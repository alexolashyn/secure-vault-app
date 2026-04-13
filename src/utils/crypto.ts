const PBKDF2_ITERATIONS = 100000;
const AES_ALGO = "AES-GCM";
const encoder = new TextEncoder();

export interface CryptoData {
    publicKey: string;
    encryptedPrivateKey: string;
    salt: string;
    iv: string;
}

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
};

export const base64ToUint8Array = (base64: string): Uint8Array<ArrayBuffer> => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes as Uint8Array<ArrayBuffer>;
};

const deriveAESKey = async (
    password: string,
    salt: Uint8Array,
    usage: KeyUsage[]
): Promise<CryptoKey> => {
    const baseKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        {name: "PBKDF2"},
        false,
        ["deriveKey"]
    );

    const safeSalt = new Uint8Array(salt.buffer as ArrayBuffer, salt.byteOffset, salt.byteLength);

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: safeSalt,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256",
        },
        baseKey,
        {name: AES_ALGO, length: 256},
        false,
        usage
    );
};

export const generateCryptoData = async (password: string): Promise<CryptoData> => {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );

    const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const aesKey = await deriveAESKey(password, salt, ["encrypt"]);

    const safeIv = new Uint8Array(iv.buffer as ArrayBuffer, iv.byteOffset, iv.byteLength);

    const encryptedPrivateKey = await crypto.subtle.encrypt(
        {name: AES_ALGO, iv: safeIv},
        aesKey,
        privateKeyBuffer
    );

    return {
        publicKey: arrayBufferToBase64(publicKeyBuffer),
        encryptedPrivateKey: arrayBufferToBase64(encryptedPrivateKey),
        salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    };
};

export const decryptPrivateKey = async (
    encryptedPrivateKeyBase64: string,
    password: string,
    saltBase64: string,
    ivBase64: string
): Promise<ArrayBuffer> => {
    const salt = base64ToUint8Array(saltBase64);
    const iv = base64ToUint8Array(ivBase64);
    const encryptedData = base64ToUint8Array(encryptedPrivateKeyBase64);

    const aesKey = await deriveAESKey(password, salt, ["decrypt"]);

    const safeIv = new Uint8Array(iv.buffer as ArrayBuffer, iv.byteOffset, iv.byteLength);
    const safeData = new Uint8Array(encryptedData.buffer as ArrayBuffer, encryptedData.byteOffset, encryptedData.byteLength);

    return crypto.subtle.decrypt(
        {name: AES_ALGO, iv: safeIv},
        aesKey,
        safeData
    );
};

export const importPrivateKey = async (pkcs8: ArrayBuffer): Promise<CryptoKey> => {
    return crypto.subtle.importKey(
        "pkcs8",
        pkcs8,
        {name: "RSA-OAEP", hash: "SHA-256"},
        true,
        ["decrypt"]
    );
};

export const encryptFile = async (fileBuffer: ArrayBuffer, publicKeySpki: string) => {
    const fileKey = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt"]
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        fileKey,
        fileBuffer
    );

    const exportedFileKey = await window.crypto.subtle.exportKey("raw", fileKey);

    const publicKey = await window.crypto.subtle.importKey(
        "spki",
        base64ToArrayBuffer(publicKeySpki),
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["encrypt"]
    );

    const encryptedKey = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        exportedFileKey
    );

    return {
        encryptedContent,
        encryptedFileKey: arrayBufferToBase64(encryptedKey),
        fileIv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    };
};

export const decryptFileKey = async (
    encryptedFileKeyBase64: string,
    privateKey: CryptoKey
): Promise<ArrayBuffer> => {
    const encryptedKey = base64ToArrayBuffer(encryptedFileKeyBase64);

    return crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedKey
    );
};

export const decryptFile = async (
    encryptedContent: ArrayBuffer,
    decryptedFileKey: ArrayBuffer,
    ivBase64: string
): Promise<ArrayBuffer> => {
    const iv = base64ToUint8Array(ivBase64);

    const aesKey = await crypto.subtle.importKey(
        "raw",
        decryptedFileKey,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    return crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encryptedContent
    );
};