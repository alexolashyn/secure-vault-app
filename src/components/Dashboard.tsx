import React, {useEffect, useRef, useState} from 'react';
import {useAuth} from '../hooks/useAuth';
import {
    encryptFile, decryptFile, decryptFileKey, decryptPrivateKey,
    importPrivateKey
} from '../utils/crypto';
import {
    LogOut,
    Shield,
    FileText,
    Loader2,
    Lock,
    Cloud,
    Plus,
    User
} from 'lucide-react';
import {filesApi} from "../api/file.ts";
import type {FileItem} from "../types/file.ts";
import {getAuditContract} from "../utils/contract.ts"

const Dashboard = () => {
    const {logout, user} = useAuth();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadFiles = async () => {
        try {
            setLoadingFiles(true);
            const {details} = await filesApi.getFiles();
            setFiles(details);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingFiles(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

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

            const {details:{uploadUrl, fileId}} = await filesApi.requestUpload({
                name: file.name,
                encryptedFileKey: encryptedData.encryptedFileKey,
                fileIv: encryptedData.fileIv,
                mimeType: file.type,
                size: encryptedBlob.size
            });

            setStatusMessage("Uploading...");
            await filesApi.uploadToStorage(uploadUrl, encryptedBlob);

            const contract = await getAuditContract();
            const accounts = await (window as any).ethereum.request({method: 'eth_accounts'});
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
            const {details: {file, downloadUrl}} = await filesApi.requestDownload(fileId);

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

            const fileKey = await decryptFileKey(
                file.encryptedFileKey,
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

            {/* Navigation */}
            <nav className="sticky top-0 z-10 bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-700/50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2.5 group cursor-default">
                        <div
                            className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                            <Shield className="text-emerald-400" size={24}/>
                        </div>
                        <span
                            className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            SecureVault
                        </span>
                    </div>

                    <button
                        onClick={logout}
                        className="group flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform"/>
                        <span className="font-medium text-sm">Sign Out</span>
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Your Vault</h1>
                        <div className="flex items-center gap-2 text-slate-400">
                            <div className="p-1 bg-slate-800 rounded-full">
                                <User size={14}/>
                            </div>
                            <span className="text-sm font-medium">{user?.email}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Panel: Upload */}
                    <div className="lg:col-span-4">
                        <div
                            className="bg-[#1e293b] border border-slate-700/50 p-8 rounded-3xl shadow-xl shadow-black/20 flex flex-col items-center text-center">
                            <div
                                className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                                <Lock size={32} className="text-emerald-400"/>
                            </div>

                            <h3 className="text-lg font-semibold mb-2">Secure Upload</h3>
                            <p className="text-slate-400 text-sm mb-8">
                                Files are encrypted client-side before being transmitted to our storage.
                            </p>

                            <button
                                disabled={isProcessing}
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300
                                    ${isProcessing
                                    ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                                    : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98] text-white'}
                                `}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20}/>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20}/>
                                        <span>Encrypt & Upload</span>
                                    </>
                                )}
                            </button>

                            {statusMessage && (
                                <div className={`mt-4 px-4 py-2 rounded-full text-xs font-medium animate-pulse
                                    ${statusMessage.includes('Success') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {statusMessage}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Files List */}
                    <div className="lg:col-span-8">
                        <div
                            className="bg-[#1e293b] border border-slate-700/50 rounded-3xl shadow-xl shadow-black/20 overflow-hidden">

                            <div
                                className="flex justify-between items-center px-8 py-6 border-b border-slate-700/50 bg-slate-800/30">
                                <div className="flex items-center gap-3">
                                    <Cloud size={20} className="text-emerald-400"/>
                                    <span className="font-bold tracking-wide">Storage Explorer</span>
                                </div>
                                <div className="px-3 py-1 bg-slate-700 rounded-lg text-xs font-mono text-slate-300">
                                    {files.length} ITEMS
                                </div>
                            </div>

                            <div className="p-6">
                                {loadingFiles ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="animate-spin text-emerald-500" size={40}/>
                                        <p className="text-slate-500 font-medium">Fetching your secure files...</p>
                                    </div>
                                ) : files.length === 0 ? (
                                    <div
                                        className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-700 rounded-2xl">
                                        <FileText size={48} className="text-slate-700 mb-4"/>
                                        <p className="text-slate-500">Your vault is empty</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {files.map((file) => (
                                            <div
                                                key={file.id}
                                                onClick={() => downloadRequest(file.id)}
                                                className="group relative bg-[#0f172a]/50 border border-slate-700/50 p-4 rounded-2xl cursor-pointer hover:border-emerald-500/50 hover:bg-slate-700/30 transition-all duration-200"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                      <span
                                                          className="text-slate-200 font-medium truncate max-w-[200px]">
                                                        {file.name}
                                                      </span>
                                                        <span className="text-slate-500 text-xs">
                                                        Click to download
                                                      </span>
                                                    </div>
                                                    <div
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <svg
                                                            className="w-5 h-5 text-emerald-500"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;