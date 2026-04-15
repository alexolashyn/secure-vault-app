import React from 'react';
import { FileText, Loader2 } from 'lucide-react';
import FileCard from './FileCard';
import type { FileItem } from '../types/file';

interface FileListProps {
    title: string;
    icon: React.ReactNode;
    files: FileItem[];
    loading: boolean;
    onDownload: (fileId: string) => void;
    onShare?: (fileId: string) => void;
    sharingFileId: string | null;
    showShareButton?: boolean;
    emptyMessage: string;
    iconColor: string;
}

const FileList: React.FC<FileListProps> = ({
    title,
    icon,
    files,
    loading,
    onDownload,
    onShare,
    sharingFileId,
    showShareButton = true,
    emptyMessage,
    iconColor
}) => {
    return (
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-3xl shadow-xl shadow-black/20 overflow-hidden">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center gap-3">
                    <div className={iconColor}>{icon}</div>
                    <span className="font-bold tracking-wide">{title}</span>
                </div>
                <div className="px-3 py-1 bg-slate-700 rounded-lg text-xs font-mono text-slate-300">
                    {files.length} ITEMS
                </div>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className={`animate-spin ${iconColor}`} size={40} />
                        <p className="text-slate-500 font-medium">
                            {title === 'Your Files' ? 'Fetching your secure files...' : 'Fetching shared files...'}
                        </p>
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-700 rounded-2xl">
                        <FileText size={48} className="text-slate-700 mb-4" />
                        <p className="text-slate-500">{emptyMessage}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {files.map((file) => (
                            <FileCard
                                key={file.id}
                                file={file}
                                onDownload={onDownload}
                                onShare={onShare}
                                sharingFileId={sharingFileId}
                                showShareButton={showShareButton}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileList;
