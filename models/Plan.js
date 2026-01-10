const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true }, // e.g., '1 month', '3 months', '1 year'
    description: { type: String },
    features: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plan', planSchema);
