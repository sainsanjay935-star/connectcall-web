const Message = require('../models/Message');
const Chat = require('../models/Chat');

const sendMessage = async (req, res) => {
    const { chatId, content, messageType, fileUrl } = req.body;

    if (!chatId || (!content && !fileUrl)) {
        return res.status(400).json({ message: 'Invalid data passed into request' });
    }

    const newMessage = {
        sender: req.user.userId,
        content: content || '',
        chat: chatId,
        messageType: messageType || 'text',
        fileUrl: fileUrl || ''
    };

    try {
        let message = await Message.create(newMessage);
        message = await message.populate('sender', 'username profilePhoto');
        message = await message.populate('chat');

        await Chat.findByIdAndUpdate(chatId, { lastMessage: message });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const allMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate('sender', 'username profilePhoto email')
            .populate('chat');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { sendMessage, allMessages };
