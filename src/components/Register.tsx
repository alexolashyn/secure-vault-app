import React, {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {authApi} from '../api/auth';
import {generateCryptoData} from '../utils/crypto';
import {useAuth} from "../hooks/useAuth.ts";
import {connectMetaMask} from "../utils/metamask.ts";

const Register = () => {
    const {login} = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({email: '', password: ''});
    const [loading, setLoading] = useState(false);
    const [showMetaMaskModal, setShowMetaMaskModal] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const cryptoData = await generateCryptoData(formData.password);

            const {details} = await authApi.register({
                email: formData.email,
                password: formData.password,
                publicKey: cryptoData.publicKey,
                encryptedPrivateKey: cryptoData.encryptedPrivateKey,
                kdfSalt: cryptoData.salt,
                iv: cryptoData.iv,
            });

            if (details.accessToken) {
                login(details.accessToken);
                setShowMetaMaskModal(true);
            }

        } catch (error) {
            alert('Registration failed');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMetamaskConnect = async () => {
        try {
            const isConnected = await connectMetaMask();
            if (isConnected) {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 text-white font-sans">
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Create Account</h2>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-gray-400 mb-1 text-sm">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition-all"
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
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400 text-sm">
                    Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Log In</Link>
                </p>
            </div>

            {/* MetaMask Modal */}
            {showMetaMaskModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-gray-800 border border-blue-500 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                        <div className="mb-4 flex justify-center">
                            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
                                <span className="text-4xl">🦊</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white">Майже готово!</h3>
                        <p className="text-gray-400 mb-6">Ваш акаунт створено. Тепер підключіть MetaMask для доступу до
                            дешборду.</p>
                        <button
                            onClick={handleMetamaskConnect}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-900/20"
                        >
                            Connect MetaMask
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;