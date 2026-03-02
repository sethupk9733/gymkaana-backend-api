const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function resetAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@gymkaana.com';
        const newPassword = 'Admin@gymkaana2026';

        const user = await User.findOne({ email });
        if (user) {
            user.password = newPassword;
            user.roles = ['admin'];
            user.isVerified = true;
            await user.save();
            console.log(`Successfully reset password for: ${email}`);
            console.log(`New Password is: ${newPassword}`);
        } else {
            console.log(`User ${email} not found.`);
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

resetAdmin();
