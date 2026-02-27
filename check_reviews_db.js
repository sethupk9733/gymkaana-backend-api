require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('./models/Review');

async function checkReviews() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gymkaana');
        const reviews = await Review.find()
            .populate('gymId', 'name')
            .populate('userId', 'name');

        console.log(`Total Reviews: ${reviews.length}`);
        reviews.forEach(r => {
            console.log(`Review ID: ${r._id}`);
            console.log(`Gym: ${r.gymId?.name || 'MISSING GYM'}`);
            console.log(`User: ${r.userId?.name || 'MISSING USER'}`);
            console.log(`Rating: ${r.rating}`);
            console.log(`Comment: ${r.comment}`);
            console.log('---');
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkReviews();
