// Utility to generate a random ID
// This file NO LONGER imports the User model to avoid circular dependencies.
// Uniqueness check is now handled by the caller (controller).

const generateUniqueId = () => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `WEB${randomDigits}`;
};

module.exports = { generateUniqueId };
