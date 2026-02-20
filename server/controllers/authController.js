const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateUniqueId } = require('../utils/generateId');

const signup = async (req, res) => {
    try {
        console.log('--- Signup Process Started ---');
        const { username, email, password } = req.body;
        console.log('Request body:', { username, email });

        console.log('Checking for existing user...');
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists');
            return res.status(400).json({ message: 'Email already exists' });
        }

        console.log('Generating unique ID...');
        const uniqueId = await generateUniqueId();
        console.log('Generated ID:', uniqueId);

        console.log('Creating user model instance...');
        const user = new User({
            username,
            email,
            password,
            uniqueId
        });

        console.log('Saving user to database...');
        // Note: bcrypt hashing happens in User.js pre-save hook
        await user.save();
        console.log('User saved successfully');

        console.log('Signing JWT token...');
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        console.log('Signup completed successfully');
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
        console.error('CRITICAL SIGNUP ERROR:', error);
        // We send the specific error message to the client to see it on the UI
        res.status(500).json({
            message: `Server Error: ${error.message}`,
            error: error.message,
            stack: error.stack
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

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

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
