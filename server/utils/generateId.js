const User = require('../models/User');

const generateUniqueId = async () => {
    let isUnique = false;
    let uniqueId = '';

    while (!isUnique) {
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        uniqueId = `WEB${randomDigits}`;

        const existingUser = await User.findOne({ uniqueId });
        if (!existingUser) {
            isUnique = true;
        }
    }

    return uniqueId;
};

module.exports = { generateUniqueId };
