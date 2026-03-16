const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    address: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    city: { type: String },
    zipCode: { type: String },
    landmark: { type: String },
    googleMapsLink: { type: String },
    headTrainer: { type: String },
    experience: { type: String },
    specializations: { type: [{ type: String }], default: [] },
    openingHoursWeekdays: { type: String },
    openingHoursWeekends: { type: String },
    facilities: { type: [{ type: String }], default: [] },
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'active', 'inactive', 'rejected'], default: 'pending' },
    members: { type: Number, default: 0 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    image: { type: String },
    images: { type: [{ type: String }], default: [] },
    bankDetails: {
        accountName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String
    },
    gstNo: { type: String, default: "" },
    panNo: { type: String, default: "" },
    documentation: {
        tradingLicense: { type: String, default: "" },
        fireSafety: { type: String, default: "" },
        insurancePolicy: { type: String, default: "" }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gym', gymSchema);
