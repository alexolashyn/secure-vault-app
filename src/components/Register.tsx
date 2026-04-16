import React, {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {authApi} from '../api/auth';
import {generateCryptoDataFromSeed, generateSeedPhrase} from '../utils/crypto';
import {useAuth} from "../hooks/useAuth.ts";
import MetaMaskModal from './MetaMaskModal';
import SeedPhraseModal from './SeedPhraseModal';

const Register = () => {
    const {login} = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({email: '', password: ''});
    const [loading, setLoading] = useState(false);
    const [showMetaMaskModal, setShowMetaMaskModal] = useState(false);
    const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false);
    const [seedPhrase, setSeedPhrase] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const generatedSeedPhrase = generateSeedPhrase();
            const cryptoData = await generateCryptoDataFromSeed(generatedSeedPhrase);

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
                setSeedPhrase(generatedSeedPhrase);
                setShowSeedPhraseModal(true);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMetamaskSuccess = () => {
        navigate('/dashboard');
    };

    const handleSeedPhraseModalClose = () => {
        setShowSeedPhraseModal(false);
        setShowMetaMaskModal(true);
    };

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

            <SeedPhraseModal
                isOpen={showSeedPhraseModal}
                seedPhrase={seedPhrase}
                onClose={handleSeedPhraseModalClose}
            />
            <MetaMaskModal
                isOpen={showMetaMaskModal}
                onClose={() => setShowMetaMaskModal(false)}
                onConnectSuccess={handleMetamaskSuccess}
                color="blue"
                icon="🦊"
                title="Almost here!"
                description="Your account has been created. Now connect MetaMask to access the dashboard."
            />
        </div>
    );
};

export default Register;