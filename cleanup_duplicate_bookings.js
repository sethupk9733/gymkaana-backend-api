const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gymkaana';

async function cleanupDuplicateBookings() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all bookings
        const allBookings = await Booking.find({})
            .populate('userId', 'name email')
            .populate('gymId', 'name')
            .populate('planId', 'name')
            .sort({ createdAt: 1 }); // Oldest first

        console.log(`📊 Total bookings found: ${allBookings.length}`);

        // Group bookings by unique combination of userId, gymId, planId, startDate, endDate
        const bookingGroups = new Map();

        allBookings.forEach(booking => {
            const key = `${booking.userId?._id}-${booking.gymId?._id}-${booking.planId?._id}-${booking.startDate}-${booking.endDate}`;

            if (!bookingGroups.has(key)) {
                bookingGroups.set(key, []);
            }
            bookingGroups.get(key).push(booking);
        });

        // Find and remove duplicates
        let duplicatesRemoved = 0;
        const idsToDelete = [];

        bookingGroups.forEach((bookings, key) => {
            if (bookings.length > 1) {
                console.log(`\n🔍 Found ${bookings.length} duplicate bookings:`);
                bookings.forEach((b, idx) => {
                    console.log(`   ${idx + 1}. ID: ${b._id} | User: ${b.userId?.name || 'Unknown'} | Gym: ${b.gymId?.name || 'Unknown'} | Created: ${b.createdAt}`);
                });

                // Keep the first (oldest) booking, mark others for deletion
                for (let i = 1; i < bookings.length; i++) {
                    idsToDelete.push(bookings[i]._id);
                    duplicatesRemoved++;
                }
                console.log(`   ✅ Keeping booking ID: ${bookings[0]._id} (oldest)`);
                console.log(`   ❌ Marking ${bookings.length - 1} duplicate(s) for deletion`);
            }
        });

        if (idsToDelete.length > 0) {
            console.log(`\n🗑️  Deleting ${idsToDelete.length} duplicate bookings...`);
            const result = await Booking.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`✅ Successfully deleted ${result.deletedCount} duplicate bookings`);
        } else {
            console.log('\n✅ No duplicate bookings found!');
        }

        console.log(`\n📈 Summary:`);
        console.log(`   - Total bookings before: ${allBookings.length}`);
        console.log(`   - Duplicates removed: ${duplicatesRemoved}`);
        console.log(`   - Total bookings after: ${allBookings.length - duplicatesRemoved}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the cleanup
cleanupDuplicateBookings();
