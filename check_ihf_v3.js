const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

async function checkIhf() {
    await mongoose.connect('mongodb://localhost:27017/gymkaana');
    const gym = await Gym.findOne({ name: /i hate fat/i });
    console.log("GYM_NAME=" + gym.name);
    console.log("GYM_DP=" + gym.baseDayPassPrice);

    const plans = await Plan.find({ gymId: gym._id });
    plans.forEach(p => {
        console.log("---");
        console.log("P_NAME=" + p.name);
        console.log("P_PR=" + p.price);
        console.log("P_SES=" + p.sessions);
        console.log("P_BD_DB=" + p.baseDiscount);
        const total = (gym.baseDayPassPrice || 0) * (p.sessions || 1);
        const calc = total > 0 ? Math.round((1 - (p.price / total)) * 100) : 0;
        console.log("P_CALC=" + calc);
    });
    process.exit();
}
checkIhf();
