import React from 'react';
import { LogOut, Shield } from 'lucide-react';

interface HeaderProps {
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
    return (
        <nav className="sticky top-0 z-10 bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-700/50 px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-2.5 group cursor-default">
                    <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                        <Shield className="text-emerald-400" size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        SecureVault
                    </span>
                </div>

                <button
                    onClick={onLogout}
                    className="group flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                >
                    <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="font-medium text-sm">Sign Out</span>
                </button>
            </div>
        </nav>
    );
};

export default Header;
