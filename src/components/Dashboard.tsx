import React, { useEffect, useRef, useState } from 'react';
import { User, Cloud } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
    encryptFile, decryptFile, decryptFileKey, decryptPrivateKey,
    importPrivateKey
} from '../utils/crypto';
import { filesApi } from "../api/file.ts";
import type { FileItem } from "../types/file.ts";
import { getAuditContract } from "../utils/contract.ts";
import Header from './Header';
import UploadSection from './UploadSection';
import FileList from './FileList';
import ShareModal from './ShareModal';

const Dashboard = () => {
    const { logout, user } = useAuth();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [ownerFiles, setOwnerFiles] = useState<FileItem[]>([]);
    const [sharedFiles, setSharedFiles] = useState<FileItem[]>([]);
    const [loadingOwnerFiles, setLoadingOwnerFiles] = useState(true);
    const [loadingSharedFiles, setLoadingSharedFiles] = useState(true);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareFileId, setShareFileId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadFiles = async () => {
        try {
            setLoadingOwnerFiles(true);
            setLoadingSharedFiles(true);

            const [ownerResponse, sharedResponse] = await Promise.all([
                filesApi.getOwnersFiles(),
                filesApi.getSharedFiles()
            ]);

            setOwnerFiles(ownerResponse);
            setSharedFiles(sharedResponse);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingOwnerFiles(false);
            setLoadingSharedFiles(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    const openShareModal = (fileId: string) => {
        setShareFileId(fileId);
        setShareModalOpen(true);
    };

    const closeShareModal = () => {
        setShareModalOpen(false);
        setShareFileId(null);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.publicKey) return;

        setIsProcessing(true);
        setStatusMessage("Encrypting...");

        try {
            const fileBuffer = await file.arrayBuffer();
            const encryptedData = await encryptFile(fileBuffer, user.publicKey);
            const encryptedBlob = new Blob([encryptedData.encryptedContent]);

            setStatusMessage("Requesting slot...");

            const { details: { uploadUrl, fileId } } = await filesApi.requestUpload({
                name: file.name,
                encryptedFileKey: encryptedData.encryptedFileKey,
                fileIv: encryptedData.fileIv,
                mimeType: file.type,
                size: encryptedBlob.size
            });

            setStatusMessage("Uploading...");
            await filesApi.uploadToStorage(uploadUrl, encryptedBlob);

            const contract = await getAuditContract();
            const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
            const tx = await contract.logAction(accounts[0], fileId, 0);
            await tx.wait();

            setStatusMessage("Success!");
            await loadFiles();
        } catch (error) {
            console.error(error);
            setStatusMessage("Failed");
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

    const downloadRequest = async (fileId: string) => {
        try {
            const { file, downloadUrl, sharedEncryptedFileKey } = await filesApi.requestDownload(fileId);

            const response = await fetch(downloadUrl);
            const encryptedBuffer = await response.arrayBuffer();

            const password = prompt("Enter your password");
            if (!password) return;

            const pkcs8 = await decryptPrivateKey(
                user.encryptedPrivateKey,
                password,
                user.kdfSalt,
                user.iv
            );

            const privateKey = await importPrivateKey(pkcs8);

            let keyToUse = file.encryptedFileKey;
            if (sharedEncryptedFileKey) {
                keyToUse = sharedEncryptedFileKey;
            }

            const fileKey = await decryptFileKey(
                keyToUse,
                privateKey
            );

            const decryptedBuffer = await decryptFile(
                encryptedBuffer,
                fileKey,
                file.fileIv
            );

            const blob = new Blob([decryptedBuffer], {
                type: file.mimeType
            });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = file.name;

            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-emerald-500/30">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            <Header onLogout={logout} />

            <main className="max-w-7xl mx-auto p-6 md:p-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Your Vault</h1>
                        <div className="flex items-center gap-2 text-slate-400">
                            <div className="p-1 bg-slate-800 rounded-full">
                                <User size={14} />
                            </div>
                            <span className="text-sm font-medium">{user?.email}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <UploadSection
                        isProcessing={isProcessing}
                        statusMessage={statusMessage}
                        onUploadClick={() => fileInputRef.current?.click()}
                    />

                    <div className="lg:col-span-8 space-y-6">
                        <FileList
                            title="Your Files"
                            icon={<Cloud size={20} className="text-emerald-400" />}
                            files={ownerFiles}
                            loading={loadingOwnerFiles}
                            onDownload={downloadRequest}
                            onShare={openShareModal}
                            sharingFileId={shareFileId}
                            showShareButton={true}
                            emptyMessage="No files uploaded yet"
                            iconColor="text-emerald-400"
                        />

                        <FileList
                            title="Shared with You"
                            icon={<User size={20} className="text-blue-400" />}
                            files={sharedFiles}
                            loading={loadingSharedFiles}
                            onDownload={downloadRequest}
                            sharingFileId={shareFileId}
                            showShareButton={false}
                            emptyMessage="No files shared with you"
                            iconColor="text-blue-400"
                        />
                    </div>
                </div>
            </main>

            <ShareModal
                isOpen={shareModalOpen}
                onClose={closeShareModal}
                fileId={shareFileId}
                user={user}
                onShareSuccess={loadFiles}
            />
        </div>
    );
};

export default Dashboard;