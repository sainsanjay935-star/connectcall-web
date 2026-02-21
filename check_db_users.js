const mongoose = require('mongoose');

const uri = "mongodb+srv://amit:%23MitS%40in3355%21@amit.glxpqpz.mongodb.net/connectcall?retryWrites=true&w=majority";

async function checkUser() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            username: String,
            uniqueId: String,
            email: String
        }));

        const users = await User.find({
            $or: [
                { username: /jax/i },
                { uniqueId: /jax/i }
            ]
        });

        console.log('Users found with "jax":', JSON.stringify(users, null, 2));

        const allUsers = await User.find().limit(5);
        console.log('Last 5 users in DB:', JSON.stringify(allUsers, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUser();
