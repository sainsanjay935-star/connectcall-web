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
        return res.status(400).send({ message: "Please fill all the fields" });
    }

    let users = JSON.parse(req.body.users);

    if (users.length < 2) {
        return res.status(400).send("More than 2 users are required to form a group chat");
    }

    users.push(req.user.userId);

    try {
        const groupChat = await Chat.create({
            groupName: req.body.name,
            participants: users,
            isGroupChat: true,
            groupAdmin: req.user.userId,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

const renameGroup = async (req, res) => {
    const { chatId, groupName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { groupName: groupName },
        { new: true }
    )
        .populate("participants", "-password")
        .populate("groupAdmin", "-password");

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(updatedChat);
    }
};

const addToGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    const added = await Chat.findByIdAndUpdate(
        chatId,
        { $push: { participants: userId } },
        { new: true }
    )
        .populate("participants", "-password")
        .populate("groupAdmin", "-password");

    if (!added) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(added);
    }
};

const removeFromGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        { $pull: { participants: userId } },
        { new: true }
    )
        .populate("participants", "-password")
        .populate("groupAdmin", "-password");

    if (!removed) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(removed);
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
