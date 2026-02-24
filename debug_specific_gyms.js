const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

async function debugSpecificGyms() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gymkaana');

        const gymNames = [/sfs/i, /whats up/i];

        for (const namePattern of gymNames) {
            const gym = await Gym.findOne({ name: namePattern });
            if (!gym) {
                console.log(`Gym matching ${namePattern} not found`);
                continue;
            }

            console.log(`\nGym: ${gym.name} (ID: ${gym._id})`);
            console.log(`Base Day Pass Price: ₹${gym.baseDayPassPrice || 0}`);

            const plans = await Plan.find({ gymId: gym._id });
            console.log(`Found ${plans.length} plans:`);

            plans.forEach(p => {
                const totalDayValue = (gym.baseDayPassPrice || 0) * (p.sessions || 1);
                const calculatedDiscount = totalDayValue > 0 ? Math.round((1 - (p.price / totalDayValue)) * 100) : 0;
                console.log(`  - Plan: ${p.name}`);
                console.log(`    Price: ₹${p.price}`);
                console.log(`    Sessions: ${p.sessions}`);
                console.log(`    Current baseDiscount in DB: ${p.baseDiscount}%`);
                console.log(`    Calculated Save vs Day Pass: ${calculatedDiscount}%`);
                console.log(`    Total Day Pass Value: ₹${totalDayValue}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugSpecificGyms();
