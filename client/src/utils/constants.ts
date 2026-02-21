export const getApiBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl !== 'undefined' && envUrl !== 'null' && envUrl.trim() !== '' && envUrl.startsWith('http')) {
        return envUrl;
    }
    const fallback = 'https://connectcall-backend.onrender.com';
    console.warn(`[getApiBaseUrl] API_URL not found or invalid (${envUrl}), falling back to: ${fallback}`);
    return fallback;
};

export const getSocketUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (envUrl && envUrl !== 'undefined' && envUrl !== 'null' && envUrl.trim() !== '' && envUrl.startsWith('http')) {
        return envUrl;
    }
    const fallback = 'https://connectcall-backend.onrender.com';
    console.warn(`[getSocketUrl] SOCKET_URL not found or invalid (${envUrl}), falling back to: ${fallback}`);
    return fallback;
};
