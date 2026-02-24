const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: { type: String }, // specific area
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Active', 'Inactive'], default: 'Pending' },
    description: { type: String },
    phone: { type: String },
    email: { type: String },
    timings: { type: String },
    images: [{ type: String }], // Array of strings for multiple images
    members: { type: Number, default: 0 },
    checkins: { type: Number, default: 0 },
    baseDayPassPrice: { type: Number, default: 0 },
    revenues: { type: String }, // Keeping as string to match "₹45K" format if needed, or number
    facilities: [{ type: String }],
    specializations: [{ type: String }],
    trainers: [{ type: String }], // Keeping for backward compatibility
    trainerDetails: [{
        name: { type: String },
        experience: { type: String },
        specialization: { type: String },
        photo: { type: String }
    }],
    houseRules: [{ type: String }],
    documentation: {
        tradingLicense: { type: String },
        fireSafety: { type: String },
        insurancePolicy: { type: String },
        bankStatement: { type: String }
    },
    bankDetails: {
        accountName: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String },
        bankName: { type: String }
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gym', gymSchema);
