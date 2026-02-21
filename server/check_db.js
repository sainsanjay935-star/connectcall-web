const mongoose = require('mongoose');

const uri = "mongodb+srv://amit:%23MitS%40in3355%21@amit.glxpqpz.mongodb.net/connectcall?retryWrites=true&w=majority";

async function checkUser() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Define internal model for checking
        const User = mongoose.model('UserTemp', new mongoose.Schema({
            username: String,
            uniqueId: String,
            email: String
        }, { collection: 'users' })); // Explicitly use 'users' collection

        const users = await User.find({
            $or: [
                { username: /jax/i },
                { uniqueId: /jax/i }
            ]
        });

        console.log('--- SEARCHING FOR "jax" ---');
        console.log(JSON.stringify(users, null, 2));

        const allUsersCount = await User.countDocuments();
        console.log('Total users in DB:', allUsersCount);

        const lastUsers = await User.find().sort({ _id: -1 }).limit(3);
        console.log('--- RECENT USERS ---');
        console.log(JSON.stringify(lastUsers, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUser();
