const mongoose = require('mongoose');
const Gym = require('../models/Gym');
const Booking = require('../models/Booking');
const User = require('../models/User');

exports.getStats = async (req, res) => {
    try {
        const { ownerId } = req.query;
        let query = {};
        if (ownerId && ownerId !== 'all') {
            query.ownerId = new mongoose.Types.ObjectId(ownerId);
        }

        const statsQuery = ownerId && ownerId !== 'all' ? { ownerId: new mongoose.Types.ObjectId(ownerId) } : {};

        const totalGyms = await Gym.countDocuments(statsQuery);
        const pendingGyms = await Gym.countDocuments({ ...statsQuery, status: 'pending' });

        // Count real registered users (not gym.members field)
        const totalUsers = await User.countDocuments();

        const totalMembers = await Gym.aggregate([
            { $match: statsQuery },
            { $group: { _id: null, total: { $sum: "$members" } } }
        ]);

        const totalRevenue = await Booking.aggregate([
            { $match: { status: 'completed' } },
            // If filtering by owner, we need to join with Gym to check ownerId
            ...(ownerId && ownerId !== 'all' ? [
                {
                    $lookup: {
                        from: 'gyms',
                        localField: 'gymId',
                        foreignField: '_id',
                        as: 'gym_info'
                    }
                },
                { $unwind: '$gym_info' },
                { $match: { 'gym_info.ownerId': new mongoose.Types.ObjectId(ownerId) } }
            ] : []),
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.json({
            activeMembers: totalMembers[0]?.total || 0,
            totalUsers,           // Real count of registered users
            totalRevenue: totalRevenue[0]?.total || 0,
            pendingGyms,
            checkInsToday: 0,
            totalGyms
        });
    } catch (err) {
        console.error('📊 Dashboard Stats Error:', err);
        res.status(500).json({ message: err.message });
    }
};
