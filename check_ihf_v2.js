const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

async function checkIhf() {
    await mongoose.connect('mongodb://localhost:27017/gymkaana');
    const gym = await Gym.findOne({ name: /i hate fat/i });
    if (!gym) {
        console.log("GYM NOT FOUND");
        process.exit(1);
    }
    console.log("GYM NAME:", gym.name);
    console.log("GYM BASE PASS:", gym.baseDayPassPrice);

    const plans = await Plan.find({ gymId: gym._id });
    for (const p of plans) {
        console.log(`PLAN: ${p.name}`);
        console.log(`  Price: ${p.price}`);
        console.log(`  Sessions: ${p.sessions}`);
        console.log(`  DB baseDiscount (owner sees this): ${p.baseDiscount}`);

        const totalDayVal = (gym.baseDayPassPrice || 0) * (p.sessions || 1);
        const calculated = totalDayVal > 0 ? Math.round((1 - (p.price / totalDayVal)) * 100) : 0;
        console.log(`  Marketplace calculated discount: ${calculated}`);
    }
    process.exit();
}
checkIhf();
