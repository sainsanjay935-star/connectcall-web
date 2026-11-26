import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'connectcall-secret-key-123';

export const encryptMessage = (message: string): string => {
    return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

export const decryptMessage = (ciphertext: string): string => {
    if (!ciphertext) return '';
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted || ciphertext;
    } catch (error) {
        console.error('Decryption failed', error);
        return ciphertext; // Return raw text if decryption fails
    }
};
