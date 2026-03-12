const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    memberName: { type: String }, // Optional if userId exists
    memberEmail: { type: String },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'active', 'upcoming', 'completed', 'cancelled', 'rejected'],
        default: 'pending'
    },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    paymentId: { type: String }, // Razorpay Payment ID / Stripe Payment Intent
    orderId: { type: String }, // Razorpay Order ID
    bookingDate: { type: Date, default: Date.now },
    bookingTime: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
