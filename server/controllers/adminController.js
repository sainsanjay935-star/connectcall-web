const User = require('../models/User');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(userId, { isBlocked: true }, { new: true });
        res.json({ message: 'User blocked', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(userId, { isBlocked: false }, { new: true });
        res.json({ message: 'User unblocked', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const removeUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await User.findByIdAndDelete(userId);
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({});
        const activeUsers = await User.countDocuments({ isOnline: true });
        res.json({ totalUsers, activeUsers });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllUsers, blockUser, unblockUser, removeUser, getStats };
