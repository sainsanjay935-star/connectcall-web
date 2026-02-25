export const getApiBaseUrl = () => {
    // Priority: .env variable -> fallback
    const envUrl = process.env.NEXT_PUBLIC_API_URL;

    // Check if it's a valid string starting with http
    if (typeof envUrl === 'string' && envUrl.trim() !== '' && envUrl.startsWith('http') && !envUrl.includes('undefined')) {
        return envUrl;
    }

    // Hardcoded fallback for production
    const fallback = 'https://connectcall-backend.onrender.com';
    console.warn(`[getApiBaseUrl] API_URL invalid (${envUrl}), using fallback: ${fallback}`);
    return fallback;
};

export const getSocketUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

    if (typeof envUrl === 'string' && envUrl.trim() !== '' && envUrl.startsWith('http') && !envUrl.includes('undefined')) {
        return envUrl;
    }

    const fallback = 'https://connectcall-backend.onrender.com';
    return fallback;
};
