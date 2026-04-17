import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Cloud, User } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';

import {
    decryptFile,
    decryptFileKey,
    decryptPrivateKeyFromSeed,
    encryptFile,
    importPrivateKey,
} from '../utils/crypto';

import { filesApi } from '../api/file.ts';
import type { FileItem } from '../types/file.ts';

import { getAuditContract } from '../utils/contract.ts';

import Header from './Header';
import UploadSection from './UploadSection';
import FileList from './FileList';
import ShareModal from './ShareModal';
import SeedPhraseInputModal from './SeedPhraseInputModal';

type StatusVariant = 'info' | 'success' | 'error';

interface StatusMessage {
    text: string;
    variant: StatusVariant;
}

type PendingDownload = (seedPhrase: string) => Promise<void>;

function useFileDownload(user: ReturnType<typeof useAuth>['user']) {
    const [seedPhraseModalOpen, setSeedPhraseModalOpen] = useState(false);
    const pendingDownloadRef = useRef<PendingDownload | null>(null);

    const requestDownload = useCallback(
        async (fileId: string) => {
            if (!user) return;

            try {
                const { file, downloadUrl, sharedEncryptedFileKey } =
                    await filesApi.requestDownload(fileId);

                const { contract, signer } = await getAuditContract();
                console.log('[audit] signer.address:', signer.address);

                if (sharedEncryptedFileKey) {
                    const tx = await contract.logDownloadShared(
                        signer.address,
                        user.email,
                        fileId,
                        '0x7690Fc3976782786F2dBEec096cf62FC6A601267',
                    );
                    await tx.wait();
                    console.log('[audit] logDownloadShared confirmed:', tx.hash);
                } else {
                    const tx = await contract.logDownload(
                        signer.address,
                        user.email,
                        fileId,
                    );
                    await tx.wait();
                    console.log('[audit] logDownload confirmed:', tx.hash);
                }
                
                const response = await fetch(downloadUrl);
                const encryptedBuffer = await response.arrayBuffer();

                pendingDownloadRef.current = async (seedPhrase: string) => {
                    const pkcs8 = await decryptPrivateKeyFromSeed(
                        user.encryptedPrivateKey,
                        seedPhrase,
                        user.kdfSalt,
                        user.iv,
                    );

                    const privateKey = await importPrivateKey(pkcs8);
                    const keyToUse = sharedEncryptedFileKey ?? file.encryptedFileKey;
                    const fileKey = await decryptFileKey(keyToUse, privateKey);

                    const decryptedBuffer = await decryptFile(
                        encryptedBuffer,
                        fileKey,
                        file.fileIv,
                    );

                    const blob = new Blob([decryptedBuffer], { type: file.mimeType });
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(url);
                };

                setSeedPhraseModalOpen(true);
            } catch (error) {
                console.error('[useFileDownload] requestDownload failed:', error);
            }
        },
        [user],
    );

    const handleSeedPhraseSubmit = useCallback(async (seedPhrase: string) => {
        setSeedPhraseModalOpen(false);
        const pending = pendingDownloadRef.current;
        pendingDownloadRef.current = null;

        if (typeof pending === 'function') {
            try {
                await pending(seedPhrase);
            } catch (error) {
                console.error('[useFileDownload] decryption failed:', error);
            }
        }
    }, []);

    const handleSeedPhraseCancel = useCallback(() => {
        setSeedPhraseModalOpen(false);
        pendingDownloadRef.current = null;
    }, []);

    return {
        seedPhraseModalOpen,
        requestDownload,
        handleSeedPhraseSubmit,
        handleSeedPhraseCancel,
    };
}

// ---------------------------------------------------------------------------
// Hook: useDashboard
// ---------------------------------------------------------------------------

function useDashboard(user: ReturnType<typeof useAuth>['user']) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

    const [ownerFiles, setOwnerFiles] = useState<FileItem[]>([]);
    const [loadingOwnerFiles, setLoadingOwnerFiles] = useState(true);

    const [sharedFiles, setSharedFiles] = useState<FileItem[]>([]);
    const [loadingSharedFiles, setLoadingSharedFiles] = useState(true);

    const showStatus = useCallback(
        (text: string, variant: StatusVariant, autoClearMs = 2500) => {
            setStatusMessage({ text, variant });
            if (autoClearMs > 0) {
                setTimeout(() => setStatusMessage(null), autoClearMs);
            }
        },
        [],
    );

    const loadFiles = useCallback(async () => {
        setLoadingOwnerFiles(true);
        setLoadingSharedFiles(true);

        try {
            const [ownerResponse, sharedResponse] = await Promise.all([
                filesApi.getOwnersFiles(),
                filesApi.getSharedFiles(),
            ]);

            setOwnerFiles(ownerResponse);
            setSharedFiles(sharedResponse);
        } catch (error) {
            console.error('[useDashboard] loadFiles failed:', error);
        } finally {
            setLoadingOwnerFiles(false);
            setLoadingSharedFiles(false);
        }
    }, []);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const handleUpload = useCallback(
        async (file: File) => {
            if (!user?.publicKey) return;

            setIsProcessing(true);
            showStatus('Encrypting…', 'info', 0);

            let fileId: string | undefined;

            try {
                const fileBuffer = await file.arrayBuffer();
                const encryptedData = await encryptFile(fileBuffer, user.publicKey);
                const encryptedBlob = new Blob([encryptedData.encryptedContent]);

                showStatus('Requesting slot…', 'info', 0);
                const { details } = await filesApi.requestUpload({
                    name: file.name,
                    encryptedFileKey: encryptedData.encryptedFileKey,
                    fileIv: encryptedData.fileIv,
                    mimeType: file.type,
                    size: encryptedBlob.size,
                });

                fileId = details.fileId;

                // 1. Записуємо в блокчейн і чекаємо підтвердження
                showStatus('Logging to blockchain…', 'info', 0);
                const { contract, signer } = await getAuditContract();
                console.log('[audit] signer.address:', signer.address);
                const tx = await contract.logUpload(signer.address, user.email, fileId);
                await tx.wait();
                console.log('[audit] logUpload confirmed:', tx.hash);

                // 2. Тільки після підтвердження — завантажуємо в сховище
                showStatus('Uploading…', 'info', 0);
                await filesApi.uploadToStorage(details.uploadUrl, encryptedBlob);
                await filesApi.updateFileStatus(fileId, 'success');

                showStatus('Uploaded successfully', 'success');
                await loadFiles();
            } catch (error) {
                if (fileId) {
                    await filesApi.updateFileStatus(fileId, 'failed').catch(console.error);
                }
                console.error('[useDashboard] handleUpload failed:', error);
                showStatus('Upload failed', 'error');
            } finally {
                setIsProcessing(false);
            }
        },
        [user, loadFiles, showStatus],
    );

    return {
        isProcessing,
        statusMessage,
        ownerFiles,
        loadingOwnerFiles,
        sharedFiles,
        loadingSharedFiles,
        loadFiles,
        handleUpload,
    };
}

// ---------------------------------------------------------------------------
// Component: Dashboard
// ---------------------------------------------------------------------------

const Dashboard: React.FC = () => {
    const { logout, user } = useAuth();

    const {
        isProcessing,
        statusMessage,
        ownerFiles,
        loadingOwnerFiles,
        sharedFiles,
        loadingSharedFiles,
        loadFiles,
        handleUpload,
    } = useDashboard(user);

    const {
        seedPhraseModalOpen,
        requestDownload,
        handleSeedPhraseSubmit,
        handleSeedPhraseCancel,
    } = useFileDownload(user);

    const [shareFileId, setShareFileId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpenShare = useCallback((fileId: string) => {
        setShareFileId(fileId);
    }, []);

    const handleCloseShare = useCallback(() => {
        setShareFileId(null);
    }, []);

    const handleFileInputChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) await handleUpload(file);
            if (fileInputRef.current) fileInputRef.current.value = '';
        },
        [handleUpload],
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-emerald-500/30">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                className="hidden"
                aria-hidden="true"
            />

            <Header onLogout={logout} />

            <main className="max-w-7xl mx-auto p-6 md:p-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
                            Your Vault
                        </h1>
                        <div className="flex items-center gap-2 text-slate-400">
                            <div className="p-1 bg-slate-800 rounded-full">
                                <User size={14} aria-hidden="true" />
                            </div>
                            <span className="text-sm font-medium">{user?.email}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <UploadSection
                        isProcessing={isProcessing}
                        statusMessage={statusMessage?.text ?? null}
                        statusVariant={statusMessage?.variant ?? null}
                        onUploadClick={() => fileInputRef.current?.click()}
                    />

                    <div className="lg:col-span-8 space-y-6">
                        <FileList
                            title="Your Files"
                            icon={<Cloud size={20} className="text-emerald-400" aria-hidden="true" />}
                            files={ownerFiles}
                            loading={loadingOwnerFiles}
                            onDownload={requestDownload}
                            onShare={handleOpenShare}
                            sharingFileId={shareFileId}
                            showShareButton
                            emptyMessage="No files uploaded yet"
                            iconColor="text-emerald-400"
                        />

                        <FileList
                            title="Shared with You"
                            icon={<User size={20} className="text-blue-400" aria-hidden="true" />}
                            files={sharedFiles}
                            loading={loadingSharedFiles}
                            onDownload={requestDownload}
                            sharingFileId={shareFileId}
                            showShareButton={false}
                            emptyMessage="No files shared with you"
                            iconColor="text-blue-400"
                        />
                    </div>
                </div>
            </main>

            <ShareModal
                isOpen={shareFileId !== null}
                onClose={handleCloseShare}
                fileId={shareFileId}
                user={user}
                onShareSuccess={loadFiles}
            />

            <SeedPhraseInputModal
                isOpen={seedPhraseModalOpen}
                onSubmit={handleSeedPhraseSubmit}
                onCancel={handleSeedPhraseCancel}
            />
        </div>
    );
};

export default Dashboard;