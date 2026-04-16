import React, { useState } from 'react';

interface SeedPhraseInputModalProps {
    isOpen: boolean;
    onSubmit: (seedPhrase: string) => void;
    onCancel: () => void;
}

const SeedPhraseInputModal: React.FC<SeedPhraseInputModalProps> = ({
    isOpen,
    onSubmit,
    onCancel
}) => {
    const [seedPhrase, setSeedPhrase] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (seedPhrase.trim()) {
            onSubmit(seedPhrase.trim());
            setSeedPhrase('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">Введіть сід фразу</h2>
                <p className="text-gray-300 text-sm text-center mb-6">
                    Для доступу до файлів введіть вашу сід фразу
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <textarea
                            value={seedPhrase}
                            onChange={(e) => setSeedPhrase(e.target.value)}
                            placeholder="Введіть 12 слів сід фрази..."
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-emerald-500 outline-none transition-all text-white resize-none h-24"
                            required
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-bold transition-colors"
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition-colors"
                        >
                            Підтвердити
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SeedPhraseInputModal;
