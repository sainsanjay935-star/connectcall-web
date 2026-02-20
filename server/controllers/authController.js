const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateUniqueId } = require('../utils/generateId');

const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
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
            username,
            email,
            password,
            uniqueId
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'connectcall-production-secret-9988',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                uniqueId: user.uniqueId,
                username: user.username,
                email: user.email,
                profilePhoto: user.profilePhoto,
                statusMessage: user.statusMessage
            }
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'connectcall-production-secret-9988',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                uniqueId: user.uniqueId,
                username: user.username,
                email: user.email,
                profilePhoto: user.profilePhoto,
                statusMessage: user.statusMessage
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { signup, login, getMe };
