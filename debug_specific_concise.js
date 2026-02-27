const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

async function debugSpecificGyms() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gymkaana');
        const gymNames = [/sfs/i, /whats up/i];
        for (const namePattern of gymNames) {
            const gym = await Gym.findOne({ name: namePattern });
            if (!gym) continue;
            console.log(`GYM: ${gym.name} | DayPass: ₹${gym.baseDayPassPrice}`);
            const plans = await Plan.find({ gymId: gym._id });
            plans.forEach(p => {
                const totalVal = (gym.baseDayPassPrice || 0) * (p.sessions || 1);
                const calc = totalVal > 0 ? Math.round((1 - (p.price / totalVal)) * 100) : 0;
                console.log(`  P: ${p.name} | Pr: ${p.price} | S: ${p.sessions} | val: ${totalVal} | calc: ${calc}%`);
            });
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
debugSpecificGyms();
