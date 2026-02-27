const mongoose = require('mongoose');
const Plan = require('./models/Plan');

async function findEight() {
    await mongoose.connect('mongodb://localhost:27017/gymkaana');
    const plans = await Plan.find({ $or: [{ baseDiscount: 8 }, { discount: 8 }, { baseDiscount: 18 }, { discount: 18 }] });
    plans.forEach(p => {
        console.log(`Plan: ${p.name} | BD: ${p.baseDiscount}% | PD: ${p.discount}%`);
    });
    process.exit();
}
findEight();
