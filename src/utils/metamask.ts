export const connectMetaMask = async () => {
    const {ethereum} = window;
    if (ethereum) {
        try {
            await ethereum.request({method: 'eth_requestAccounts'});
            return true;
        } catch (error) {
            alert('To fulfil procedure MetaMask must be connected');
            console.error(error);
        }
    } else {
        alert('MetaMask is not found');
    }
};