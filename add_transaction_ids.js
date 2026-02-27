const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymkaana';

async function addTransactionIds() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all bookings without transaction IDs
        const bookings = await Booking.find({
            $or: [
                { transactionId: { $exists: false } },
                { transactionId: null },
                { transactionId: '' }
            ]
        });

        console.log(`📊 Found ${bookings.length} bookings without transaction IDs`);

        if (bookings.length === 0) {
            console.log('✅ All bookings already have transaction IDs!');
            return;
        }

        let updated = 0;
        const usedIds = new Set();

        for (const booking of bookings) {
            let transactionId;
            let attempts = 0;

            // Generate unique transaction ID
            do {
                const date = booking.bookingDate || new Date();
                const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
                const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
                transactionId = `GYM-${dateStr}-${randomStr}`;
                attempts++;
            } while (usedIds.has(transactionId) && attempts < 10);

            usedIds.add(transactionId);

            try {
                await Booking.updateOne(
                    { _id: booking._id },
                    { $set: { transactionId: transactionId } }
                );
                updated++;
                console.log(`✅ Updated booking ${booking._id} with transaction ID: ${transactionId}`);
            } catch (error) {
                console.error(`❌ Failed to update booking ${booking._id}:`, error.message);
            }
        }

        console.log(`\n📈 Summary:`);
        console.log(`   - Total bookings processed: ${bookings.length}`);
        console.log(`   - Successfully updated: ${updated}`);
        console.log(`   - Failed: ${bookings.length - updated}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
addTransactionIds();
