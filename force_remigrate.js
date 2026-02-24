const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

async function reMigrate() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gymkaana');

        const gyms = await Gym.find();
        const plans = await Plan.find();

        console.log(`Processing ${plans.length} plans for ${gyms.length} gyms...`);

        for (const p of plans) {
            const gym = gyms.find(g => g._id.toString() === p.gymId.toString());
            if (!gym || !gym.baseDayPassPrice || gym.baseDayPassPrice <= 0) {
                console.log(`Skipping plan ${p.name} (No valid baseDayPassPrice for gym)`);
                continue;
            }

            const totalDayValue = gym.baseDayPassPrice * (p.sessions || 1);
            if (totalDayValue > 0) {
                const calculatedDiscount = Math.round((1 - (p.price / totalDayValue)) * 100);
                if (calculatedDiscount > 0) {
                    p.baseDiscount = calculatedDiscount;
                    await p.save();
                    console.log(`Updated plan ${p.name}: ${calculatedDiscount}%`);
                } else {
                    p.baseDiscount = 0;
                    await p.save();
                    console.log(`Set plan ${p.name} baseDiscount to 0 (Price >= Day Pass Value)`);
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

reMigrate();
