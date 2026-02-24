const Activity = require('../models/Activity');

exports.getActivities = async (req, res) => {
    try {
        let filter = {};
        const roles = req.user.roles || [];
        if (roles.includes('owner') && !roles.includes('admin')) {
            const Gym = require('../models/Gym');
            const myGyms = await Gym.find({ ownerId: req.user._id });
            filter = { gymId: { $in: myGyms.map(g => g._id) } };
        } else if (roles.includes('user') && !roles.includes('admin') && !roles.includes('owner')) {
            filter = { userId: req.user._id };
        }

        const activities = await Activity.find(filter)
            .populate('userId', 'name email shadowRole')
            .populate('gymId', 'name location')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.logActivity = async (data) => {
    try {
        const activity = new Activity(data);
        await activity.save();
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
};
