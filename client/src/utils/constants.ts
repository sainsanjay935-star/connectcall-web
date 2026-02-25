export const getApiBaseUrl = () => {
    // Priority: .env variable -> fallback
    let envUrl = process.env.NEXT_PUBLIC_API_URL;

    // Explicitly check for various "empty" or "undefined" states
    const isInvalid = !envUrl ||
        envUrl === 'undefined' ||
        envUrl === 'null' ||
        envUrl.trim() === '' ||
        !envUrl.startsWith('http') ||
        envUrl.includes('undefined');

    if (!isInvalid) {
        return envUrl;
    }

    // Hardcoded absolute fallback for production
    const fallback = 'https://connectcall-backend.onrender.com';

    // This log will help us see if the new code is actually running in the browser
    console.log(`[ConnectCall] Using API Fallback: ${fallback} (Original was: ${envUrl})`);

    return fallback;
};

export const getSocketUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const isInvalid = !envUrl || envUrl === 'undefined' || envUrl === 'null' || !envUrl.startsWith('http') || envUrl.includes('undefined');

    if (!isInvalid) {
        return envUrl;
    }

    return 'https://connectcall-backend.onrender.com';
};
