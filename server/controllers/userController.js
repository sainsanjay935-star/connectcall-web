const User = require('../models/User');

const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        console.log('--- Backend Search Start ---');
        console.log('Received Query:', query);
        console.log('Searcher ID:', req.user.userId);

        if (!query) return res.status(400).json({ message: 'Search query is required' });

        // Search by uniqueId or username
        const users = await User.find({
            $or: [
                { uniqueId: { $regex: query, $options: 'i' } },
                { username: { $regex: query, $options: 'i' } }
            ],
            _id: { $ne: req.user.userId } // Exclude self
        }).select('uniqueId username profilePhoto statusMessage isOnline');

        console.log('Users Found Count:', users.length);
        console.log('Users:', users);
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

const resetUserData = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(`[ResetData] Starting reset for user: ${userId}`);

        // 1. Delete all messages where this user is the sender
        await Message.deleteMany({ sender: userId });

        // 2. Delete all 1-to-1 chats where this user is a participant
        // Note: This also deletes the chat for the other participant
        await Chat.deleteMany({
            isGroupChat: false,
            participants: userId
        });

        // 3. Remove user from all group chats
        await Chat.updateMany(
            { isGroupChat: true, participants: userId },
            { $pull: { participants: userId } }
        );

        // 4. If user is group admin, they remain admin but are not in participants (or we could handle specifically)
        // For simplicity, we just pull them from participants. If they were the ONLY one, chat remains empty.

        console.log(`[ResetData] Reset completed for user: ${userId}`);
        res.json({ message: 'Account data reset successfully. All chats and messages have been removed.' });
    } catch (error) {
        console.error('[ResetData] Error:', error);
        res.status(500).json({ message: 'Server error during data reset', error: error.message });
    }
};

const getSuggestedUsers = async (req, res) => {
    try {
        // Find 10 users that are NOT the current user
        const users = await User.find({
            _id: { $ne: req.user.userId }
        })
            .select('uniqueId username profilePhoto statusMessage isOnline')
            .limit(10)
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { searchUsers, getProfile, resetUserData, getSuggestedUsers };
