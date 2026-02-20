const User = require('../models/User');

const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ message: 'Search query is required' });

        // Search by uniqueId or username
        const users = await User.find({
            $or: [
                { uniqueId: { $regex: query, $options: 'i' } },
                { username: { $regex: query, $options: 'i' } }
            ],
            _id: { $ne: req.user.userId } // Exclude self
        }).select('uniqueId username profilePhoto statusMessage isOnline');

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('uniqueId username profilePhoto statusMessage isOnline lastSeen');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { searchUsers, getProfile };
