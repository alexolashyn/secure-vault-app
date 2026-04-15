import React, { useRef, useState } from 'react';
import { User, Share2, Loader2 } from 'lucide-react';
import { filesApi } from '../api/file';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string | null;
    user: any;
    onShareSuccess: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    fileId,
    user,
    onShareSuccess
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string }>>([]);
    const [selectedUser, setSelectedUser] = useState<{ id: string; email: string } | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [shareStatus, setShareStatus] = useState<string | null>(null);
    const [sharingFileId, setSharingFileId] = useState<string | null>(null);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearchUsers = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setSearchLoading(true);
            const results = await filesApi.searchUsers(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Failed to search users:', error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                handleSearchUsers(query);
            }, 300);
        } else {
            setSearchResults([]);
        }
    };

    const handleUserSelect = (u: { id: string; email: string }) => {
        setSelectedUser(u);
        setSearchQuery(u.email);
        setSearchResults([]);
    };

    const handleShare = async () => {
        if (!selectedUser || !fileId) return;

        try {
            setSharingFileId(fileId);
            setShareStatus("Getting recipient's public key...");

            const publicKey = await filesApi.getUserPublicKey(selectedUser.id);
            const { decryptPrivateKey, importPrivateKey, encryptFileKeyForSharing } = await import('../utils/crypto');
            const { file } = await filesApi.requestDownload(fileId);

            const password = prompt("Enter your password");
            if (!password) {
                setShareStatus(null);
                setSharingFileId(null);
                return;
            }

            setShareStatus("Encrypting file key for recipient...");

            const pkcs8 = await decryptPrivateKey(
                user.encryptedPrivateKey,
                password,
                user.kdfSalt,
                user.iv
            );

            const privateKey = await importPrivateKey(pkcs8);

            const encryptedFileKeyForRecipient = await encryptFileKeyForSharing(
                file.encryptedFileKey,
                privateKey,
                publicKey
            );

            setShareStatus("Sharing file...");

            await filesApi.shareFile(fileId, selectedUser.id, encryptedFileKeyForRecipient);

            setShareStatus("File shared successfully!");
            setTimeout(() => {
                setShareStatus(null);
                setSharingFileId(null);
                onClose();
                onShareSuccess();
            }, 2000);

        } catch (error) {
            console.error(error);
            setShareStatus("Failed to share file");
            setTimeout(() => {
                setShareStatus(null);
                setSharingFileId(null);
            }, 3000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e293b] border border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-md p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">Share File</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Search user by email
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                                placeholder="Enter email (e.g., alex@)"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            {searchLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="animate-spin w-5 h-5 text-emerald-500" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="bg-slate-800 border border-slate-600 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                            {searchResults.map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => handleUserSelect(u)}
                                    className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                        <User size={16} className="text-emerald-400" />
                                    </div>
                                    <span className="text-slate-200">{u.email}</span>
                                    {user.email === u.email && <span className="text-xs text-emerald-400">✓ You</span>}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Selected User */}
                    {selectedUser && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <User size={20} className="text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-emerald-400">Selected user</p>
                                <p className="text-slate-300">{selectedUser.email}</p>
                            </div>
                        </div>
                    )}

                    {/* Share Status */}
                    {shareStatus && (
                        <div className={`px-4 py-3 rounded-xl text-sm font-medium
                            ${shareStatus.includes('success') || shareStatus.includes('successfully')
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-blue-500/20 text-blue-400'}`}>
                            {shareStatus}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={sharingFileId !== null}
                            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={!selectedUser || sharingFileId !== null}
                            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {sharingFileId ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Sharing...</span>
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
    );
};

export default ShareModal;
