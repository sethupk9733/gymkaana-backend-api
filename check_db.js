require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Gym = require('./models/Gym');

async function checkBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const gymId = '697094c2cbb8950d0c74b52f';
        const bookings = await Booking.find({ gymId: gymId });

        console.log(`Found ${bookings.length} bookings for gym ${gymId}`);
        bookings.forEach(b => {
            console.log(`- Status: ${b.status}, Amount: ${b.amount}, User: ${b.userId}`);
        });

        const gym = await Gym.findById(gymId);
        console.log(`Gym Name: ${gym.name}`);
        console.log(`Gym revenues field: ${gym.revenues}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkBookings();
