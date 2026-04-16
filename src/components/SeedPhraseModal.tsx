import React, { useState } from 'react';

interface SeedPhraseModalProps {
    isOpen: boolean;
    seedPhrase: string;
    onClose: () => void;
}

const SeedPhraseModal: React.FC<SeedPhraseModalProps> = ({ isOpen, seedPhrase, onClose }) => {
    const [showPhrase, setShowPhrase] = useState(false);

    if (!isOpen) return null;

    const handleOkay = () => {
        setShowPhrase(true);
    };

    const handleClose = () => {
        onClose();
        setShowPhrase(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border border-gray-700">
                {!showPhrase ? (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-white text-center">Important!</h2>
                        <p className="text-gray-300 text-center mb-6">
                            Your seed phrase will be displayed now. Save it in a secure place. You won't be able to see it again.
                        </p>
                        <button
                            onClick={handleOkay}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors"
                        >
                            OK
                        </button>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-white text-center">Your seed phrase</h2>
                        <div className="bg-gray-900 p-4 rounded-lg mb-4 border border-gray-600">
                            <p className="text-yellow-400 text-center font-mono text-sm break-words">
                                {seedPhrase}
                            </p>
                        </div>
                        <p className="text-gray-400 text-xs text-center mb-4">
                            Save this phrase in a secure place. You won't be able to see it again.
                        </p>
                        <button
                            onClick={handleClose}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition-colors"
                        >
                            I understand
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeedPhraseModal;
