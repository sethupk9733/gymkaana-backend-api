const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

async function checkDetails() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gymkaana');
        const gyms = await Gym.find({ name: { $in: [/sfs/i, /whats up gym/i] } });
        for (const gym of gyms) {
            console.log(`\nGym: ${gym.name} | Base Day Pass: ₹${gym.baseDayPassPrice}`);
            const plans = await Plan.find({ gymId: gym._id });
            plans.forEach(p => {
                console.log(`  - Plan: ${p.name} | Sessions: ${p.sessions} | Price: ₹${p.price} | baseDiscount: ${p.baseDiscount}%`);
            });
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkDetails();
