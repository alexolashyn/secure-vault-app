import React from 'react';
import { Share2, Loader2 } from 'lucide-react';
import type { FileItem } from '../types/file';

interface FileCardProps {
    file: FileItem;
    onDownload: (fileId: string) => void;
    onShare?: (fileId: string) => void;
    sharingFileId: string | null;
    showShareButton?: boolean;
}

const FileCard: React.FC<FileCardProps> = ({
    file,
    onDownload,
    onShare,
    sharingFileId,
    showShareButton = true
}) => {
    return (
        <div className="group relative bg-[#0f172a]/50 border border-slate-700/50 p-4 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-700/30 transition-all duration-200">
            <div className="flex items-center justify-between">
                <div
                    className="flex flex-col flex-1 cursor-pointer"
                    onClick={() => onDownload(file.id)}
                >
                    <span className="text-slate-200 font-medium truncate max-w-[200px]">
                        {file.name}
                    </span>
                    <span className="text-slate-500 text-xs">
                        Click to download
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {showShareButton && onShare && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare(file.id);
                            }}
                            disabled={sharingFileId === file.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-600 rounded-lg"
                            title="Share file"
                        >
                            {sharingFileId === file.id ? (
                                <Loader2 className="animate-spin w-5 h-5 text-emerald-500" />
                            ) : (
                                <Share2 className="w-5 h-5 text-emerald-500" />
                            )}
                        </button>
                    )}
                    <div
                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => onDownload(file.id)}
                    >
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
        </div>
    );
};

export default FileCard;
