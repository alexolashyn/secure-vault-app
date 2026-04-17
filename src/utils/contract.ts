import {ethers} from 'ethers';

const AUDIT_CONTRACT_ADDRESS = import.meta.env.VITE_VOTING_CONTRACT_ADDRESS;
const AUDIT_ABI = [
    "function logUpload(address user, string email, string fileId) public",
    "function logDownload(address user, string email, string fileId) public",
    "function logDownloadShared(address user, string email, string fileId, address ownerAddr) public",
    "function logShare(address user, string email, string fileId, address recipient) public"
];

export const getAuditContract = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");

    const provider = new ethers.BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();

    return {
        contract: new ethers.Contract(AUDIT_CONTRACT_ADDRESS, AUDIT_ABI, signer),
        signer
    };
};