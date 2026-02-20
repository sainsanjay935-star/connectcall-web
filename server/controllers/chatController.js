const Chat = require('../models/Chat');
const Message = require('../models/Message');

const accessChat = async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'UserId not provided' });

    // Check if chat already exists
    let chat = await Chat.findOne({
        isGroupChat: false,
        $and: [
            { participants: { $elemMatch: { $eq: req.user.userId } } },
            { participants: { $elemMatch: { $eq: userId } } }
        ]
    }).populate('participants', '-password').populate('lastMessage');

    if (chat) {
        res.json(chat);
    } else {
        // Create new chat
        const newChat = new Chat({
            participants: [req.user.userId, userId],
            isGroupChat: false
        });

        try {
            const savedChat = await newChat.save();
            const fullChat = await Chat.findOne({ _id: savedChat._id }).populate('participants', '-password');
            res.status(201).json(fullChat);
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
};

const fetchChats = async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: { $elemMatch: { $eq: req.user.userId } }
        })
            .populate('participants', '-password')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { accessChat, fetchChats };
