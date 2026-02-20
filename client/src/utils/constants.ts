export const getApiBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl !== 'undefined' && envUrl !== 'null' && envUrl.startsWith('http')) {
        return envUrl;
    }
    return 'https://connectcall-backend.onrender.com';
};

export const getSocketUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (envUrl && envUrl !== 'undefined' && envUrl !== 'null' && envUrl.startsWith('http')) {
        return envUrl;
    }
    return 'https://connectcall-backend.onrender.com';
};
