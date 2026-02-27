const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

async function checkSfs() {
    await mongoose.connect('mongodb://localhost:27017/gymkaana');
    const gym = await Gym.findOne({ name: /sfs/i });
    console.log(`GYM: ${gym.name} | Base Day Pass: ₹${gym.baseDayPassPrice}`);
    const plans = await Plan.find({ gymId: gym._id });
    plans.forEach(p => {
        const totalVal = gym.baseDayPassPrice * p.sessions;
        const calcBase = Math.round((1 - (p.price / totalVal)) * 100);
        console.log(`- Plan: ${p.name}`);
        console.log(`  Price: ₹${p.price} | Sessions: ${p.sessions} | Value: ₹${totalVal}`);
        console.log(`  DB baseDiscount: ${p.baseDiscount}% | DB promo Discount: ${p.discount}%`);
        console.log(`  Calculated baseDiscount: ${calcBase}%`);
    });
    process.exit();
}
checkSfs();
