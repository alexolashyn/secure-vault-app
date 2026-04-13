import {ethers} from 'ethers';

const AUDIT_CONTRACT_ADDRESS = import.meta.env.VITE_VOTING_CONTRACT_ADDRESS;
const AUDIT_ABI = [
    "function logAction(address user, string fileId, uint8 action) public"
];

export const getAuditContract = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");

    const provider = new ethers.BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();

    return new ethers.Contract(AUDIT_CONTRACT_ADDRESS, AUDIT_ABI, signer);
};