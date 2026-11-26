const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateUniqueId } = require('../utils/generateId');
const { getJwtSecret } = require('../middleware/auth');

const generateToken = (userId) =>
    jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });

const formatUserResponse = (user) => ({
    id: user._id,
    uniqueId: user.uniqueId,
    username: user.username,
    email: user.email,
    role: user.role,
    profilePhoto: user.profilePhoto,
    statusMessage: user.statusMessage
});

const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        let uniqueId = '';
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            uniqueId = generateUniqueId();
            const idExists = await User.findOne({ uniqueId });
            if (!idExists) isUnique = true;
            attempts++;
        }

        if (!isUnique) throw new Error('Unique ID generation failed');

        const user = new User({
            username: username.trim(),
            email: normalizedEmail,
            password,
            uniqueId
        });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: formatUserResponse(user)
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: 'Your account has been blocked by an administrator.' });
        }

        const token = generateToken(user._id);

        res.json({
            token,
            user: formatUserResponse(user)
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { signup, login, getMe };
