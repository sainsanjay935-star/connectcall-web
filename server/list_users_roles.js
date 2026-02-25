const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || "mongodb+srv://amit:%23MitS%40in3355%21@amit.glxpqpz.mongodb.net/connectcall?retryWrites=true&w=majority";

async function listUsers() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            username: String,
            email: String,
            role: String,
            uniqueId: String
        }));

        const users = await User.find({}, 'username email role uniqueId');
        console.log('Users in DB:');
        console.table(users.map(u => ({
            username: u.username,
            email: u.email,
            role: u.role,
            uniqueId: u.uniqueId
        })));

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

listUsers();
