const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => process.env.JWT_SECRET || 'connectcall-production-secret-9988';

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret());
        const user = await User.findById(decoded.userId).select('role isBlocked');

        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: 'Your account has been blocked by an administrator.' });
        }

        req.user = { ...decoded, role: user.role };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
module.exports.getJwtSecret = getJwtSecret;
