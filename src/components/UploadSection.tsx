import React from 'react';
import { Lock, Plus, Loader2 } from 'lucide-react';

interface UploadSectionProps {
    isProcessing: boolean;
    statusMessage: string | null;
    statusVariant: 'info' | 'success' | 'error' | null;
    onUploadClick: () => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({
    isProcessing,
    statusMessage,
    statusVariant,
    onUploadClick
}) => {
    return (
        <div className="lg:col-span-4">
            <div className="bg-[#1e293b] border border-slate-700/50 p-8 rounded-3xl shadow-xl shadow-black/20 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <Lock size={32} className="text-emerald-400" />
                </div>

                <h3 className="text-lg font-semibold mb-2">Secure Upload</h3>
                <p className="text-slate-400 text-sm mb-8">
                    Files are encrypted client-side before being transmitted to our storage.
                </p>

                <button
                    disabled={isProcessing}
                    onClick={onUploadClick}
                    className={`
                        w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300
                        ${isProcessing
                            ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                            : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98] text-white'}
                    `}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <Plus size={20} />
                            <span>Encrypt & Upload</span>
                        </>
                    )}
                </button>

                {statusMessage && (
                    <div className={`mt-4 px-4 py-2 rounded-full text-xs font-medium animate-pulse
                        ${statusVariant === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
                          statusVariant === 'error' ? 'bg-red-500/20 text-red-400' : 
                          'bg-blue-500/20 text-blue-400'}`}>
                        {statusMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadSection;
