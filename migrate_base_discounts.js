const mongoose = require('mongoose');
const Plan = require('./models/Plan');
const Gym = require('./models/Gym');

async function migrateBaseDiscounts() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gymkaana');
        console.log('Connected to MongoDB');

        const plans = await Plan.find();
        console.log(`Found ${plans.length} plans to process`);

        for (const plan of plans) {
            const gym = await Gym.findById(plan.gymId);

            if (!gym || !gym.baseDayPassPrice || gym.baseDayPassPrice === 0) {
                console.log(`Skipping plan ${plan.name} - no base day pass price`);
                continue;
            }

            const totalDayValue = gym.baseDayPassPrice * plan.sessions;
            if (totalDayValue <= 0 || plan.price <= 0) {
                console.log(`Skipping plan ${plan.name} - invalid pricing`);
                continue;
            }

            const calculatedDiscount = Math.round((1 - (plan.price / totalDayValue)) * 100);

            if (calculatedDiscount > 0 && calculatedDiscount <= 100) {
                plan.baseDiscount = calculatedDiscount;
                await plan.save();
                console.log(`✅ Updated ${plan.name}: ${calculatedDiscount}% base discount`);
            } else {
                console.log(`⚠️ Skipping ${plan.name}: calculated discount ${calculatedDiscount}% is out of range`);
            }
        }

        console.log('\n✅ Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateBaseDiscounts();
