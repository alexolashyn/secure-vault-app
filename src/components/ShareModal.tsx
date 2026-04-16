import React, { useRef, useState, useEffect, useCallback } from 'react';
import { User, Share2, Loader2, CheckCircle2, XCircle, X } from 'lucide-react';
import { filesApi } from '../api/file';
import SeedPhraseInputModal from './SeedPhraseInputModal';
import { decryptPrivateKeyFromSeed, importPrivateKey, encryptFileKeyForSharing } from '../utils/crypto';
import type { User as CurrentUser } from '../types/auth';

interface SearchUser {
    id: string;
    email: string;
}

type SharePhase =
    | 'idle'
    | 'fetching-key'
    | 'awaiting-seed'
    | 'encrypting'
    | 'uploading'
    | 'success'
    | 'error';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string | null;
    user: CurrentUser;
    onShareSuccess: () => void;
}

const PHASE_MESSAGES: Partial<Record<SharePhase, string>> = {
    'fetching-key': "Getting recipient's public key…",
    'encrypting': 'Encrypting file key for recipient…',
    'uploading': 'Sharing file…',
    'success': 'File shared successfully!',
    'error': 'Something went wrong. Please try again.',
};

const SEARCH_DEBOUNCE_MS = 500;
const STATUS_DISMISS_MS = 3000;
const SUCCESS_CLOSE_MS = 1500;

function StatusBanner({ phase }: { phase: SharePhase }) {
    const message = PHASE_MESSAGES[phase];
    if (!message || phase === 'awaiting-seed') return null;

    const isSuccess = phase === 'success';
    const isError = phase === 'error';

    return (
        <div
            role="status"
            aria-live="polite"
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' :
                isError ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                }`}
        >
            {isSuccess ? <CheckCircle2 size={16} className="shrink-0" /> :
                isError ? <XCircle size={16} className="shrink-0" /> :
                    <Loader2 size={16} className="animate-spin shrink-0" />}
            <span>{message}</span>
        </div>
    );
}

function SelectedUserCard({
    user,
    onClear,
    disabled,
}: {
    user: SearchUser;
    onClear: () => void;
    disabled: boolean;
}) {
    return (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                <User size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-emerald-400 mb-0.5">Selected user</p>
                <p className="text-slate-300 truncate">{user.email}</p>
            </div>
            {!disabled && (
                <button
                    onClick={onClear}
                    aria-label="Remove selected user"
                    className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-700/50"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}

const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    fileId,
    user,
    onShareSuccess,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [phase, setPhase] = useState<SharePhase>('idle');
    const [seedModalOpen, setSeedModalOpen] = useState(false);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingShareRef = useRef<((seed: string) => Promise<void>) | null>(null);
    const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    }, []);

    const resetShareState = useCallback(() => {
        setPhase('idle');
        pendingShareRef.current = null;
    }, []);

    const scheduleReset = useCallback((delay: number, andClose = false) => {
        dismissTimerRef.current = setTimeout(() => {
            resetShareState();
            if (andClose) {
                onClose();
                onShareSuccess();
            }
        }, delay);
    }, [resetShareState, onClose, onShareSuccess]);

    const fetchUsers = useCallback(async (query: string) => {
        try {
            setSearchLoading(true);
            setSearchResults(await filesApi.searchUsers(query));
        } catch {
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (query.length >= 2) {
            searchTimeoutRef.current = setTimeout(() => fetchUsers(query), SEARCH_DEBOUNCE_MS);
        } else {
            setSearchResults([]);
        }
    };

    const handleUserSelect = (u: SearchUser) => {
        setSelectedUser(u);
        setSearchQuery(u.email);
        setSearchResults([]);
    };

    const handleClearSelection = () => {
        setSelectedUser(null);
        setSearchQuery('');
    };

    const handleFail = (err: unknown, message: string) => {
        console.error(message, err);
        setPhase('error');
        scheduleReset(STATUS_DISMISS_MS);
        onClose();
    }

    const handleShare = async () => {
        if (!selectedUser || !fileId) return;

        try {
            setPhase('fetching-key');

            const [publicKey, { file }] = await Promise.all([
                filesApi.getUserPublicKey(selectedUser.id),
                filesApi.requestDownload(fileId),
            ]);

            pendingShareRef.current = async (seedPhrase: string) => {
                try {
                    setPhase('encrypting');

                    const pkcs8 = await decryptPrivateKeyFromSeed(
                        user.encryptedPrivateKey,
                        seedPhrase,
                        user.kdfSalt,
                        user.iv,
                    );
                    const privateKey = await importPrivateKey(pkcs8);
                    const encryptedFileKeyForRecipient = await encryptFileKeyForSharing(
                        file.encryptedFileKey,
                        privateKey,
                        publicKey,
                    );

                    setPhase('uploading');
                    await filesApi.shareFile(fileId, selectedUser.id, encryptedFileKeyForRecipient);

                    setPhase('success');
                    scheduleReset(SUCCESS_CLOSE_MS, true);
                } catch (err) {
                    handleFail(err, '[ShareModal] Encryption/upload failed:');
                }
            };

            setSeedModalOpen(true);
            setPhase('awaiting-seed');
        } catch (err) {
            handleFail(err, '[ShareModal] Pre-share fetch failed:');
        }
    };

    const handleSeedSubmit = async (seedPhrase: string) => {
        setSeedModalOpen(false);
        if (pendingShareRef.current) {
            await pendingShareRef.current(seedPhrase);
            pendingShareRef.current = null;
        }
    };

    const handleSeedCancel = () => {
        setSeedModalOpen(false);
        resetShareState();
    };

    const isSharing = phase !== 'idle' && phase !== 'error';
    const canShare = !!selectedUser && !isSharing;

    const handleClose = () => {
        if (isSharing) return;
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop — click-outside to close */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
            >
                {/* Dialog */}
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="share-modal-title"
                    className="bg-[#1e293b] border border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-md p-8"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h3 id="share-modal-title" className="text-2xl font-bold text-white">
                            Share File
                        </h3>
                        <button
                            onClick={handleClose}
                            disabled={isSharing}
                            aria-label="Close dialog"
                            className="text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors p-1 rounded-lg hover:bg-slate-700/50"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Search input */}
                        <div>
                            <label htmlFor="user-search" className="block text-sm font-medium text-slate-300 mb-2">
                                Search user by email
                            </label>
                            <div className="relative">
                                <input
                                    id="user-search"
                                    type="email"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Enter email (e.g., alex@example.com)"
                                    autoComplete="off"
                                    disabled={isSharing}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {searchLoading && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="animate-spin w-5 h-5 text-emerald-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search results dropdown */}
                        {searchResults.length > 0 && (
                            <ul className="bg-slate-800 border border-slate-600 rounded-xl overflow-y-auto max-h-60">
                                {searchResults.map((u) => (
                                    <li key={u.id}>
                                        <button
                                            onClick={() => handleUserSelect(u)}
                                            className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                                <User size={16} className="text-emerald-400" />
                                            </div>
                                            <span className="text-slate-200 truncate">{u.email}</span>
                                            {user.email === u.email && (
                                                <span className="ml-auto text-xs text-emerald-400 shrink-0">You</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Selected user */}
                        {selectedUser && (
                            <SelectedUserCard
                                user={selectedUser}
                                onClear={handleClearSelection}
                                disabled={isSharing}
                            />
                        )}

                        {/* Status banner */}
                        <StatusBanner phase={phase} />

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleClose}
                                disabled={isSharing}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShare}
                                disabled={!canShare}
                                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {isSharing ? (
                                    <>
                                        <Loader2 className="animate-spin shrink-0" size={18} />
                                        <span>Sharing…</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 size={18} />
                                        <span>Share</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <SeedPhraseInputModal
                isOpen={seedModalOpen}
                onSubmit={handleSeedSubmit}
                onCancel={handleSeedCancel}
            />
        </>
    );
};

export default ShareModal;