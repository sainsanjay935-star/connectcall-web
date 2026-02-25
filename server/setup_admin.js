const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || "mongodb+srv://amit:%23MitS%40in3355%21@amit.glxpqpz.mongodb.net/connectcall?retryWrites=true&w=majority";

const identifier = process.argv[2]; // Can be email or username

if (!identifier) {
    console.error('Please provide an email or username as an argument.');
    console.log('Usage: node setup_admin.js <email_or_username>');
    process.exit(1);
}

async function setupAdmin() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            username: String,
            email: String,
            role: String
        }));

        const user = await User.findOneAndUpdate(
            { $or: [{ email: identifier }, { username: identifier }] },
            { role: 'admin' },
            { new: true }
        );

        if (user) {
            console.log(`Successfully promoted ${user.username} (${user.email}) to admin.`);
        } else {
            console.log(`User not found with identifier: ${identifier}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error during admin setup:', err);
    }
}

setupAdmin();
