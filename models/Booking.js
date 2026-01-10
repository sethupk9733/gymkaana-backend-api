const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    memberName: { type: String, required: true },
    memberEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' },
    bookingDate: { type: Date, default: Date.now },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
});

module.exports = mongoose.model('Booking', bookingSchema);
