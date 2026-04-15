import React from 'react';
import { connectMetaMask } from '../utils/metamask';

interface MetaMaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnectSuccess: () => void;
    color: 'emerald' | 'blue';
    icon: string;
    title: string;
    description: string;
}

const MetaMaskModal: React.FC<MetaMaskModalProps> = ({
    isOpen,
    onClose,
    onConnectSuccess,
    color,
    icon,
    title,
    description
}) => {
    const handleMetamaskConnect = async () => {
        try {
            const isConnected = await connectMetaMask();
            if (isConnected) {
                onConnectSuccess();
                onClose();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const colorClasses = {
        emerald: {
            border: 'border-emerald-500',
            bg: 'bg-emerald-500/10',
            button: 'bg-emerald-600 hover:bg-emerald-700',
            shadow: 'shadow-emerald-900/20'
        },
        blue: {
            border: 'border-blue-500',
            bg: 'bg-blue-500/10',
            button: 'bg-blue-600 hover:bg-blue-700',
            shadow: 'shadow-blue-900/20'
        }
    };

    const classes = colorClasses[color];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className={`bg-gray-800 border ${classes.border} p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl`}>
                <div className="mb-4 flex justify-center">
                    <div className={`w-20 h-20 ${classes.bg} rounded-full flex items-center justify-center`}>
                        <span className="text-4xl">{icon}</span>
                    </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">{title}</h3>
                <p className="text-gray-400 mb-6">{description}</p>
                <button
                    onClick={handleMetamaskConnect}
                    className={`w-full ${classes.button} text-white font-bold py-3 rounded-lg transition-all shadow-lg ${classes.shadow}`}
                >
                    Connect MetaMask
                </button>
            </div>
        </div>
    );
};

export default MetaMaskModal;
