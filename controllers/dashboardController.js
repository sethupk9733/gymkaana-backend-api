const Gym = require('../models/Gym');
const Booking = require('../models/Booking');

exports.getStats = async (req, res) => {
    try {
        const totalGyms = await Gym.countDocuments();
        const pendingGyms = await Gym.countDocuments({ status: 'pending' });
        const totalMembers = await Gym.aggregate([
            { $group: { _id: null, total: { $sum: "$members" } } }
        ]);
        const totalRevenue = await Booking.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.json({
            activeMembers: totalMembers[0]?.total || 0,
            totalUsers: totalMembers[0]?.total || 0, // Key used by some frontend parts
            totalRevenue: totalRevenue[0]?.total || 0,
            pendingGyms,
            checkInsToday: 0, // Real logic to be added with CheckIn model
            totalGyms
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
