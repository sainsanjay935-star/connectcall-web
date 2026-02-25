const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || "mongodb+srv://amit:%23MitS%40in3355%21@amit.glxpqpz.mongodb.net/connectcall?retryWrites=true&w=majority";

async function resetDatabase() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Define schemas briefly for deletion
        const User = mongoose.model('User', new mongoose.Schema({}));
        const Chat = mongoose.model('Chat', new mongoose.Schema({}));
        const Message = mongoose.model('Message', new mongoose.Schema({}));

        console.log('Deleting all messages...');
        await Message.deleteMany({});

        console.log('Deleting all chats...');
        await Chat.deleteMany({});

        console.log('Deleting all users...');
        await User.deleteMany({});

        console.log('Database reset complete. All users, chats, and messages have been removed.');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error during database reset:', err);
    }
}

resetDatabase();
