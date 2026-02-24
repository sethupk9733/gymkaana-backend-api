const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkOTP() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const unverifiedCount = await User.countDocuments({ isVerified: { $ne: true } });
        console.log(`Total Unverified Users: ${unverifiedCount}`);

        // Find the most recently updated unverified user or user with reset token
        const user = await User.findOne({
            $or: [
                { otp: { $exists: true, $ne: null } },
                { resetPasswordToken: { $exists: true, $ne: null } }
            ]
        }).sort({ updatedAt: -1 });

        if (user) {
            console.log('--- FOUND OTP ---');
            console.log('EMAIL: ' + user.email);
            if (user.otp) console.log('OTP_CODE: ' + user.otp);
            if (user.resetPasswordToken) console.log('RESET_CODE: ' + user.resetPasswordToken);
            console.log('--- END ---');
        } else {
            console.log('NO_OTP_FOUND');
            const latestUnverified = await User.findOne({ isVerified: { $ne: true } }).sort({ createdAt: -1 });
            if (latestUnverified) {
                console.log('--- LATEST UNVERIFIED USER ---');
                console.log('EMAIL: ' + latestUnverified.email);
                console.log('CREATED: ' + latestUnverified.createdAt);
                console.log('------------------------------');
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkOTP();
