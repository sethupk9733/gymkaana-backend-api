const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

async function debugGym() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gymkaana');
        const gym = await Gym.findOne({ name: /fat/i });
        if (!gym) {
            console.log('Gym not found');
            process.exit();
        }
        const plans = await Plan.find({ gymId: gym._id });
        console.log('Gym:', gym.name);
        plans.forEach(p => {
            console.log(`Plan: ${p.name}, baseDiscount: ${p.baseDiscount}, discount: ${p.discount}`);
        });
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugGym();
