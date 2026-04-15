import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from "../hooks/useAuth";
import MetaMaskModal from './MetaMaskModal';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showMetaMaskModal, setShowMetaMaskModal] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { details } = await authApi.login(formData);
            if (details.accessToken) {
                login(details.accessToken);
                setShowMetaMaskModal(true);
            }
        } catch {
            alert('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleMetamaskSuccess = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 text-white font-sans">
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
                <h2 className="text-3xl font-bold mb-6 text-center text-emerald-400">Welcome Back</h2>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-gray-400 mb-1 text-sm">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-emerald-500 outline-none transition-all"
                            placeholder="name@company.com"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1 text-sm">Password</label>
                        <input
                            name="password"
                            type="password"
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-emerald-500 outline-none transition-all"
                            placeholder="••••••••"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400 text-sm">
                    Don't have an account? <Link to="/register" className="text-blue-400 hover:underline">Register
                    now</Link>
                </p>
            </div>

            <MetaMaskModal
                isOpen={showMetaMaskModal}
                onClose={() => setShowMetaMaskModal(false)}
                onConnectSuccess={handleMetamaskSuccess}
                color="emerald"
                icon="🔑"
                title="Верифікація Web3"
                description="Вхід успішний. Підключіть MetaMask, щоб підтвердити свою особу."
            />
        </div>
    );
};

export default Login;