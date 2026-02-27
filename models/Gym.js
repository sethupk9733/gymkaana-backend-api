const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    members: { type: Number, default: 0 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
    image: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gym', gymSchema);
