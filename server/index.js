require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const fs = require('fs');

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// CORS configuration for production
const allowedOrigins = [
    'http://localhost:3000',
    'https://connectcall-web.vercel.app',
    'https://client-amit33.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.indexOf(origin) !== -1 ||
            origin.endsWith('.vercel.app') ||
            origin.startsWith('http://localhost');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('CORS Blocked for origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

const io = new Server(server, {
    cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const adminRoutes = require('./routes/adminRoutes');
const statusRoutes = require('./routes/statusRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/status', statusRoutes);

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/connectcall';
mongoose.connect(MONGO_URI)
    .then(() => console.log(`Successfully connected to MongoDB: ${MONGO_URI.split('@')[1] || 'Local'}`))
    .catch(err => {
        console.error('CRITICAL: MongoDB connection error:', err);
        console.error('MONGO_URI used:', MONGO_URI);
        // Don't exit process in some environments to allow debugging via logs
        if (process.env.NODE_ENV === 'production') {
            console.error('Exiting due to DB connection failure in production');
            process.exit(1);
        }
    });

// Basic Route
app.get('/', (req, res) => {
    res.send('ConnectCall API is running');
});

const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const User = require('./models/User');
const Chat = require('./models/Chat');
const { getJwtSecret } = require('./middleware/auth');

// Socket.io JWT authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
            return next(new Error('Authentication error: token required'));
        }

        const decoded = jwt.verify(token, getJwtSecret());
        const user = await User.findById(decoded.userId).select('isBlocked');
        if (!user) {
            return next(new Error('Authentication error: user not found'));
        }
        if (user.isBlocked) {
            return next(new Error('Authentication error: account is blocked'));
        }

        socket.userId = user._id.toString();
        next();
    } catch (err) {
        next(new Error('Authentication error: invalid token'));
    }
});

// Track multi-tab presence: userId -> Set<socketId> and socketId -> userId
const onlineUsers = new Map();
const socketToUser = new Map();

const isChatParticipant = async (chatId, userId) => {
    if (!chatId || !userId) return false;
    return Boolean(await Chat.exists({ _id: chatId, participants: userId }));
};

io.on('connection', (socket) => {
    const authUserId = socket.userId;
    console.log('A user connected:', socket.id, 'user:', authUserId);

    socket.on('setup', async () => {
        if (!authUserId) return;

        socket.join(authUserId);
        socketToUser.set(socket.id, authUserId);

        if (!onlineUsers.has(authUserId)) {
            onlineUsers.set(authUserId, new Set());
        }
        const userSockets = onlineUsers.get(authUserId);
        const wasOffline = userSockets.size === 0;
        userSockets.add(socket.id);

        if (wasOffline) {
            await User.findByIdAndUpdate(authUserId, { isOnline: true });
            socket.broadcast.emit('user-status-change', { userId: authUserId, isOnline: true });
        }

        socket.emit('connected');
    });

    socket.on('join chat', async (room) => {
        try {
            if (await isChatParticipant(room, authUserId)) {
                socket.join(room);
            }
        } catch (err) {
            console.error('Join chat error:', err);
        }
    });

    socket.on('typing', (room) => {
        if (room && socket.rooms.has(room)) {
            socket.in(room).emit('typing');
        }
    });
    socket.on('stop typing', (room) => {
        if (room && socket.rooms.has(room)) {
            socket.in(room).emit('stop typing');
        }
    });

    // WebRTC Signaling (always bind `from` to verified socket.userId)
    socket.on('call-user', ({ to, offer, name, callType }) => {
        if (!to) return;
        socket.to(to).emit('incoming-call', { from: authUserId, offer, name, callType });
    });

    socket.on('answer-call', ({ to, answer }) => {
        if (!to) return;
        socket.to(to).emit('call-answered', { answer, from: authUserId });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
        if (!to) return;
        socket.to(to).emit('ice-candidate', { candidate, from: authUserId });
    });

    socket.on('call-signal', ({ to, signal }) => {
        if (!to) return;
        socket.to(to).emit('call-signal', { signal, from: authUserId });
    });

    socket.on('end-call', ({ to }) => {
        if (!to) return;
        socket.to(to).emit('call-ended', { from: authUserId });
    });

    socket.on('missed-call', async ({ chatId, callType }) => {
        try {
            if (!(await isChatParticipant(chatId, authUserId))) return;

            const label = callType === 'audio' ? '📞 Missed Voice Call' : '📹 Missed Video Call';
            const message = new Message({
                sender: authUserId,
                content: label,
                chat: chatId
            });
            const savedMessage = await message.save();
            const populatedMessage = await Message.findById(savedMessage._id)
                .populate('sender', 'username profilePhoto')
                .populate('chat');

            await Chat.findByIdAndUpdate(chatId, { lastMessage: savedMessage._id });
            io.in(chatId).emit('message received', populatedMessage);
        } catch (err) {
            console.error('Missed call log error:', err);
        }
    });

    socket.on('new message', async (newMessageReceived) => {
        const chat = newMessageReceived?.chat;
        if (!chat?.participants) return;

        const senderId = (newMessageReceived.sender?._id || newMessageReceived.sender)?.toString();
        if (senderId !== authUserId) return;

        chat.participants.forEach((participant) => {
            const participantId = (participant._id || participant).toString();
            if (participantId === authUserId) return;
            socket.to(participantId).emit('message received', newMessageReceived);
        });
    });

    socket.on('add-reaction', async ({ messageId, emoji, chatId }) => {
        try {
            if (!messageId || !emoji || !(await isChatParticipant(chatId, authUserId))) return;

            const message = await Message.findOne({ _id: messageId, chat: chatId });
            if (message && !message.isDeleted) {
                message.reactions = message.reactions.filter(r => r.user.toString() !== authUserId);
                message.reactions.push({ user: authUserId, emoji });
                await message.save();

                io.in(chatId).emit('reaction-added', { messageId, reactions: message.reactions });
            }
        } catch (err) {
            console.error('Reaction error:', err);
        }
    });

    socket.on('edit-message', async ({ messageId, content, chatId }) => {
        try {
            const message = await Message.findById(messageId);
            if (!message || message.isDeleted) return;
            if (message.sender.toString() !== authUserId) return;

            message.content = content;
            message.isEdited = true;
            await message.save();
            io.in(chatId || message.chat.toString()).emit('message-edited', { messageId, content, isEdited: true });
        } catch (err) {
            console.error('Edit error:', err);
        }
    });

    socket.on('mark-as-read', async ({ messageIds, chatId }) => {
        try {
            if (!Array.isArray(messageIds) || messageIds.length === 0) return;
            if (!(await isChatParticipant(chatId, authUserId))) return;

            await Message.updateMany(
                { _id: { $in: messageIds }, chat: chatId, readBy: { $ne: authUserId } },
                { $addToSet: { readBy: authUserId } }
            );
            io.in(chatId).emit('messages-seen', { messageIds, userId: authUserId, chatId });
        } catch (err) {
            console.error('Mark as read error:', err);
        }
    });

    socket.on('message-delivered', async ({ messageId, chatId }) => {
        try {
            if (!messageId || !(await isChatParticipant(chatId, authUserId))) return;

            await Message.findOneAndUpdate(
                { _id: messageId, chat: chatId },
                { $addToSet: { deliveredTo: authUserId } }
            );
            io.in(chatId).emit('message-delivered-update', { messageId, userId: authUserId, chatId });
        } catch (err) {
            console.error('Delivery status error:', err);
        }
    });

    socket.on('delete-message', async ({ messageId, chatId }) => {
        try {
            const message = await Message.findById(messageId);
            if (!message) return;
            if (message.sender.toString() !== authUserId) return;

            message.isDeleted = true;
            message.content = 'This message was deleted';
            await message.save();
            io.in(chatId || message.chat.toString()).emit('message-deleted', { messageId });
        } catch (err) {
            console.error('Delete error:', err);
        }
    });

    socket.on('disconnect', async () => {
        const userId = socketToUser.get(socket.id);
        socketToUser.delete(socket.id);

        if (userId && onlineUsers.has(userId)) {
            const userSockets = onlineUsers.get(userId);
            userSockets.delete(socket.id);

            if (userSockets.size === 0) {
                onlineUsers.delete(userId);
                const lastSeen = new Date();
                await User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastSeen
                });
                socket.broadcast.emit('user-status-change', {
                    userId,
                    isOnline: false,
                    lastSeen
                });
            }
        }
        console.log('User disconnected:', socket.id);
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('CRITICAL GLOBAL ERROR:', err);
    res.status(500).json({
        message: `Global Error: ${err.message}`,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
