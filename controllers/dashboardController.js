const Gym = require('../models/Gym');
const Booking = require('../models/Booking');

exports.getStats = async (req, res) => {
    try {
        const totalGyms = await Gym.countDocuments();
        const totalMembers = await Gym.aggregate([
            { $group: { _id: null, total: { $sum: "$members" } } }
        ]);
        const totalRevenue = await Booking.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.json({
            activeMembers: totalMembers[0]?.total || 0,
            totalRevenue: totalRevenue[0]?.total || 0,
            checkInsToday: 142, // Mock for now until we have check-in model
            totalGyms
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
