const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');
const Booking = require('./models/Booking');
require('dotenv').config();

const gymsData = [
    {
        name: "FitZone Gym",
        address: "Sector 18, Noida",
        rating: 4.5,
        status: "active",
        members: 156,
    },
    {
        name: "PowerHouse Fitness",
        address: "Connaught Place, Delhi",
        rating: 4.7,
        status: "active",
        members: 203,
    },
    {
        name: "Elite Fitness Center",
        address: "Gurgaon Sector 29",
        rating: 4.3,
        status: "inactive",
        members: 89,
    }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Gym.deleteMany({});
        await Plan.deleteMany({});
        await Booking.deleteMany({});

        // Seed Gyms
        const createdGyms = await Gym.insertMany(gymsData);
        console.log('Gyms seeded!');

        // Seed Plans for the first gym
        const plansData = [
            {
                gymId: createdGyms[0]._id,
                name: "Monthly Basic",
                price: 1500,
                duration: "1 month",
                description: "Access to gym floor and basic equipment",
                features: ["Gym access", "Locker room"]
            },
            {
                gymId: createdGyms[0]._id,
                name: "Quarterly Pro",
                price: 4000,
                duration: "3 months",
                description: "Includes trainer support",
                features: ["Gym access", "Locker room", "Trainer support"]
            }
        ];

        await Plan.insertMany(plansData);
        console.log('Plans seeded!');

        console.log('Seeding completed successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
