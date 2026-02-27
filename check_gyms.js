const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Gym = require('./models/Gym');
const User = require('./models/User');
require('dotenv').config();

async function checkGyms() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const gyms = await Gym.find({}).lean();
        const users = await User.find({}).lean();

        let output = `Database Report\n`;
        output += `================\n\n`;

        output += `GYMS (${gyms.length}):\n`;
        gyms.forEach(g => {
            output += `- Name: ${g.name}\n  Status: ${g.status}\n  OwnerId: ${g.ownerId}\n\n`;
        });

        output += `USERS (${users.length}):\n`;
        users.forEach(u => {
            output += `- Name: ${u.name}\n  Email: ${u.email}\n  Roles: ${JSON.stringify(u.roles)}\n  ID: ${u._id}\n\n`;
        });

        fs.writeFileSync('db_report.txt', output, 'utf8');
        console.log('Report generated in db_report.txt');
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkGyms();
