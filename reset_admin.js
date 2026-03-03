const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if needed
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@gymkaana.com';
        const password = 'Admin@gymkaana2026';

        let admin = await User.findOne({ email });

        if (admin) {
            console.log('Admin user found, updating password and roles...');
            admin.password = password;
            admin.roles = ['admin', 'user'];
            admin.isVerified = true;
            await admin.save();
            console.log('Admin user updated successfully');
        } else {
            console.log('Admin user not found, creating new...');
            admin = new User({
                name: 'System Admin',
                email,
                password,
                roles: ['admin', 'user'],
                isVerified: true
            });
            await admin.save();
            console.log('Admin user created successfully');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error reset admin:', err);
        process.exit(1);
    }
}

resetAdmin();
