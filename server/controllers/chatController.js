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

const createGroupChat = async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).json({ message: 'Please fill all the fields' });
    }

    let users;
    try {
        users = Array.isArray(req.body.users) ? req.body.users : JSON.parse(req.body.users);
    } catch {
        return res.status(400).json({ message: 'Invalid users list format' });
    }

    if (!Array.isArray(users) || users.length < 2) {
        return res.status(400).json({ message: 'More than 2 users are required to form a group chat' });
    }

    const participantIds = [...new Set([...users.map(String), req.user.userId.toString()])];

    try {
        const groupChat = await Chat.create({
            groupName: req.body.name.trim(),
            participants: participantIds,
            isGroupChat: true,
            groupAdmin: req.user.userId,
        });

        const fullGroupChat = await Chat.findById(groupChat._id)
            .populate('participants', '-password')
            .populate('groupAdmin', '-password');

        res.status(201).json(fullGroupChat);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const verifyGroupAdmin = async (chatId, userId, res) => {
    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404).json({ message: 'Chat not found' });
        return null;
    }
    if (!chat.isGroupChat) {
        res.status(400).json({ message: 'Not a group chat' });
        return null;
    }
    if (chat.groupAdmin?.toString() !== userId.toString()) {
        res.status(403).json({ message: 'Only group admin can perform this action' });
        return null;
    }
    return chat;
};

const renameGroup = async (req, res) => {
    try {
        const { chatId, groupName } = req.body;
        if (!groupName || !groupName.trim()) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        const chat = await verifyGroupAdmin(chatId, req.user.userId, res);
        if (!chat) return;

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { groupName: groupName.trim() },
            { new: true }
        )
            .populate('participants', '-password')
            .populate('groupAdmin', '-password');

        res.json(updatedChat);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const addToGroup = async (req, res) => {
    try {
        const { chatId, userId } = req.body;
        const chat = await verifyGroupAdmin(chatId, req.user.userId, res);
        if (!chat) return;

        const added = await Chat.findByIdAndUpdate(
            chatId,
            { $addToSet: { participants: userId } },
            { new: true }
        )
            .populate('participants', '-password')
            .populate('groupAdmin', '-password');

        res.json(added);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const removeFromGroup = async (req, res) => {
    try {
        const { chatId, userId } = req.body;
        const chat = await verifyGroupAdmin(chatId, req.user.userId, res);
        if (!chat) return;

        const removed = await Chat.findByIdAndUpdate(
            chatId,
            { $pull: { participants: userId } },
            { new: true }
        )
            .populate('participants', '-password')
            .populate('groupAdmin', '-password');

        res.json(removed);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup
};
