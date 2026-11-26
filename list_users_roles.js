require('dotenv').config({ path: require('path').join(__dirname, 'server', '.env') });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
    console.error('Missing MONGODB_URI environment variable.');
    process.exit(1);
}

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
