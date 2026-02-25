require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

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

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);

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

const Message = require('./models/Message');
const User = require('./models/User');

// Socket.io logic
const users = new Map(); // socketId -> userId

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setup', async (userData) => {
        socket.join(userData._id);
        users.set(socket.id, userData._id);

        // Update user status to online
        await User.findByIdAndUpdate(userData._id, { isOnline: true });
        socket.broadcast.emit('user-status-change', { userId: userData._id, isOnline: true });

        socket.emit('connected');
        console.log('User setup:', userData._id);
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log('User Joined Room: ' + room);
    });

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    // WebRTC Signaling
    socket.on('call-user', ({ to, offer, from }) => {
        socket.in(to).emit('incoming-call', { from, offer });
    });

    socket.on('answer-call', ({ to, answer }) => {
        socket.in(to).emit('call-answered', { answer });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
        socket.in(to).emit('ice-candidate', { candidate });
    });

    socket.on('end-call', ({ to }) => {
        socket.in(to).emit('call-ended');
    });

    socket.on('new message', (newMessageReceived) => {
        var chat = newMessageReceived.chat;
        if (!chat.participants) return console.log('chat.participants not defined');

        chat.participants.forEach((user) => {
            if (user._id == newMessageReceived.sender._id) return;
            socket.in(user._id).emit('message received', newMessageReceived);
        });
    });

    socket.on('add-reaction', async ({ messageId, emoji, userId, chatId }) => {
        try {
            const message = await Message.findById(messageId);
            if (message) {
                // Remove existing reaction from this user if any
                message.reactions = message.reactions.filter(r => r.user.toString() !== userId);
                // Add new reaction
                message.reactions.push({ user: userId, emoji });
                await message.save();

                // Notify others in the chat
                io.in(chatId).emit('reaction-added', { messageId, reactions: message.reactions });
            }
        } catch (err) {
            console.error('Reaction error:', err);
        }
    });

    socket.on('edit-message', async ({ messageId, content, chatId }) => {
        try {
            const message = await Message.findById(messageId);
            if (message && !message.isDeleted) {
                message.content = content;
                message.isEdited = true;
                await message.save();
                io.in(chatId).emit('message-edited', { messageId, content, isEdited: true });
            }
        } catch (err) {
            console.error('Edit error:', err);
        }
    });

    socket.on('mark-as-read', async ({ messageIds, userId, chatId }) => {
        try {
            await Message.updateMany(
                { _id: { $in: messageIds }, readBy: { $ne: userId } },
                { $addToSet: { readBy: userId } }
            );
            io.in(chatId).emit('messages-seen', { messageIds, userId, chatId });
        } catch (err) {
            console.error('Mark as read error:', err);
        }
    });

    socket.on('message-delivered', async ({ messageId, userId, chatId }) => {
        try {
            await Message.findByIdAndUpdate(messageId, { $addToSet: { deliveredTo: userId } });
            io.in(chatId).emit('message-delivered-update', { messageId, userId, chatId });
        } catch (err) {
            console.error('Delivery status error:', err);
        }
    });

    socket.on('delete-message', async ({ messageId, chatId }) => {
        try {
            const message = await Message.findById(messageId);
            if (message) {
                message.isDeleted = true;
                message.content = 'This message was deleted';
                await message.save();
                io.in(chatId).emit('message-deleted', { messageId });
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    });

    socket.on('disconnect', async () => {
        const userId = users.get(socket.id);
        if (userId) {
            // Update user status to offline
            await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date()
            });
            socket.broadcast.emit('user-status-change', {
                userId,
                isOnline: false,
                lastSeen: new Date()
            });
        }
        console.log('User disconnected:', socket.id);
        users.delete(socket.id);
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
