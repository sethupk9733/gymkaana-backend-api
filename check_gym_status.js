const mongoose = require('mongoose');
const Gym = require('./models/Gym');

async function checkStatus() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gymkaana');
        const gyms = await Gym.find({ status: { $in: ['Approved', 'Active'] } });
        console.log('APPROVED_ACTIVE_COUNT:', gyms.length);

        const allGyms = await Gym.find({});
        console.log('ALL_GYMS:', allGyms.map(g => ({ name: g.name, status: g.status })));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStatus();
