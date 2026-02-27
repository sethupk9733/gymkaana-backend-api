const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

async function debugIHateFat() {
    await mongoose.connect('mongodb://localhost:27017/gymkaana');
    const gym = await Gym.findOne({ name: /i hate fat/i });
    if (!gym) {
        console.log("Gym not found");
        process.exit(1);
    }
    console.log(`GYM: ${gym.name} | ID: ${gym._id} | BasePass: ₹${gym.baseDayPassPrice}`);
    const plans = await Plan.find({ gymId: gym._id });
    console.log(`Found ${plans.length} plans:`);
    plans.forEach(p => {
        console.log(`- ${p.name}: Price ₹${p.price}, Sessions ${p.sessions}, BD ${p.baseDiscount}%, PD ${p.discount}%`);
    });
    process.exit();
}
debugIHateFat();
