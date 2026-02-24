const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true }, // e.g., '1 Month', '3 Months'
    sessions: { type: Number, default: 1 }, // number of sessions/days covered
    description: { type: String },
    features: [{ type: String }],
    discount: { type: Number, default: 0 }, // extra promotional discount %
    baseDiscount: { type: Number, default: 0 }, // discount from base day pass price (set by owner)
    enabled: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plan', planSchema);
