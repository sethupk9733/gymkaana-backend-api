const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Processing', 'Paid', 'Rejected'], default: 'Pending' },
    requestedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
    transactionId: { type: String },
    bankDetails: {
        accountName: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String },
        bankName: { type: String }
    },
    remarks: { type: String }
});

module.exports = mongoose.model('Payout', payoutSchema);
