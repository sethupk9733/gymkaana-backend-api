const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym' },
    action: { type: String, required: true }, // e.g., 'Booking Created', 'Gym Registered', 'Check-in'
    description: { type: String },
    type: { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);
