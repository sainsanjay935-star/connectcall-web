const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateUniqueId } = require('../utils/generateId');

const signup = async (req, res) => {
    try {
        console.log('--- SIGNUP START ---');
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // 1. Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // 2. Generate and Verify Unique ID
        let uniqueId = '';
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            uniqueId = generateUniqueId();
            const idExists = await User.findOne({ uniqueId });
            if (!idExists) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            throw new Error('Failed to generate a unique user ID. Please try again.');
        }

        console.log('Creating user with ID:', uniqueId);

        // 3. Create and Save User
        const user = new User({
            username,
            email,
            password,
            uniqueId
        });

        await user.save();
        console.log('User saved: ', user._id);

        // 4. Generate Token
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
        console.error('SERVER SIGNUP BOOM:', error);
        res.status(500).json({
            message: `BOOM Signup Error: ${error.message}`,
            error: error.message
        });
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
        console.error('SERVER LOGIN ERROR:', error);
        res.status(500).json({ message: error.message });
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
