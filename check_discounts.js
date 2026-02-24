const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

async function checkDiscounts() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gymkaana');

        const plans = await Plan.find({ baseDiscount: { $gt: 0 } }).populate('gymId', 'name');

        console.log(`Found ${plans.length} plans with base discount > 0:`);
        plans.forEach(p => {
            console.log(`  - ${p.gymId?.name || 'Unknown'}: ${p.name} = ${p.baseDiscount}%`);
        });

        const allPlans = await Plan.find();
        console.log(`\nTotal plans: ${allPlans.length}`);
        console.log(`Plans with baseDiscount = 0: ${allPlans.filter(p => p.baseDiscount === 0).length}`);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkDiscounts();
