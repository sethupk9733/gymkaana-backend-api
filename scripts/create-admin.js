const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
    const adminEmail = process.argv[2] || 'admin@gymkaana.com';
    const adminPass = process.argv[3] || 'Admin@123';

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        let admin = await User.findOne({ email: adminEmail });
        if (admin) {
            console.log('Admin user already exists. Resetting password and ensuring roles.');
            admin.password = adminPass;
            admin.roles = ['admin'];
            admin.isVerified = true;
            await admin.save();
        } else {
            console.log('Creating new admin user...');
            admin = await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: adminPass,
                roles: ['admin'],
                isVerified: true
            });
        }

        console.log('✅ Admin account configured successfully.');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPass}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating admin:', err.message);
        process.exit(1);
    }
};

createAdmin();
