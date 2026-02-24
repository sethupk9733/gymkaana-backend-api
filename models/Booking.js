const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    transactionId: { type: String, unique: true, sparse: true },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memberName: { type: String, required: true },
    memberEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['active', 'cancelled', 'completed', 'upcoming'], default: 'upcoming' },
    bookingDate: { type: Date, default: Date.now },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    cancellationReason: { type: String },
    cancellationDate: { type: Date },
    cancelledBy: { type: String, enum: ['user', 'owner', 'admin'] },
    refundDetails: {
        status: { type: String, enum: ['pending', 'processed', 'failed', 'none'], default: 'none' },
        amount: { type: Number, default: 0 },
        transactionId: { type: String },
        processedAt: { type: Date }
    }
}, { timestamps: true });

// Transaction ID is now generated in the direct endpoint, so we don't need this pre-save hook
// Disabling to avoid any "next is not a function" issues
// bookingSchema.pre('save', function (next) {
//     if (!this.transactionId) {
//         const date = new Date();
//         const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
//         const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
//         this.transactionId = `GYM-${dateStr}-${randomStr}`;
//         console.log('✓ Transaction ID generated:', this.transactionId);
//     }
//     next();
// });

module.exports = mongoose.model('Booking', bookingSchema);
