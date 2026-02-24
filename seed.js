const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');
const Booking = require('./models/Booking');
const User = require('./models/User');
require('dotenv').config();

const gymsData = [
    {
        name: "PowerHouse Fitness - Main Branch",
        address: "Koramangala, Bangalore",
        location: "Koramangala, Bangalore",
        rating: 4.5,
        reviews: 120,
        status: "Active",
        description: "Premium fitness facility with state-of-the-art equipment and experienced trainers.",
        phone: "+91 98765 43210",
        email: "powerhouse@gym.com",
        timings: "6:00 AM - 10:00 PM",
        images: ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000"],
        members: 156,
        checkins: 34,
        revenues: '₹45K',
        facilities: ['Cardio Equipment', 'Free WiFi', 'Showers', 'Personal Trainer', 'Lockers', 'Parking'],
        trainers: ['Rahul Dev', 'Sanjana M', 'Vikram Singh']
    },
    {
        name: "Elite Sports Club - Indiranagar",
        address: "Indiranagar, Bangalore",
        location: "Indiranagar, Bangalore",
        rating: 4.8,
        reviews: 456,
        status: "Active",
        description: "Exclusive sports club with premium amenities and specialized training programs.",
        phone: "+91 98765 55555",
        email: "elite@sports.com",
        timings: "5:00 AM - 11:00 PM",
        images: ["https://images.unsplash.com/photo-1570829763335-57f730af1762?q=80&w=1000"],
        members: 89,
        checkins: 12,
        revenues: '₹28K',
        facilities: ['AC', 'Showers', 'Swimming Pool', 'Steam Room', 'Cardio'],
        trainers: ['Amit K', 'John Doe']
    }
];

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Gym.deleteMany({});
        await Plan.deleteMany({});
        await Booking.deleteMany({});

        console.log('Creating Test Accounts...');
        await User.create({
            name: 'Gymkaana Admin',
            email: 'admin@gymkaana.com',
            password: 'admin123',
            role: 'admin'
        });

        await User.create({
            name: 'John Owner',
            email: 'owner@gymkaana.com',
            password: 'owner123',
            role: 'owner'
        });

        await User.create({
            name: 'Sarah User',
            email: 'user@gymkaana.com',
            password: 'user123',
            role: 'user'
        });

        console.log('Database cleared! Only test users remain.');

        console.log('\n--- Login Details ---');
        console.log('USER: user@gymkaana.com / user123');
        console.log('OWNER: owner@gymkaana.com / owner123');
        console.log('ADMIN: admin@gymkaana.com / admin123');

        process.exit();
    } catch (err) {
        console.error('ERROR DURING SEEDING:');
        console.error(err.message);
        if (err.errors) console.error(err.errors);
        process.exit(1);
    }
};

seedData();
