const Gym = require('../models/Gym');

exports.getAllGyms = async (req, res) => {
    try {
        const gyms = await Gym.find().populate('ownerId', 'name email phoneNumber');
        res.json(gyms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createGym = async (req, res) => {
    console.log('🏗️ Incoming Gym Creation Request | Body Keys:', Object.keys(req.body), '| User:', req.user?._id);

    // Normalize status to lowercase if provided
    const status = (req.body.status || 'pending').toLowerCase();

    const gym = new Gym({
        name: req.body.name,
        address: req.body.address,
        rating: req.body.rating || 0,
        status: status, // Use normalized status
        members: req.body.members || 0,
        image: req.body.image,
        ownerId: req.user._id // Critical: assign owner from current user
    });

    try {
        const newGym = await gym.save();
        console.log('✅ Gym saved successfully:', newGym._id);
        res.status(201).json(newGym);
    } catch (err) {
        console.error('❌ Error saving gym:', err.message);
        res.status(400).json({
            message: `Gym validation failed: ${err.message}`,
            receivedBody: req.body // Send back what we received for debugging
        });
    }
};

exports.getGymById = async (req, res) => {
    try {
        const gym = await Gym.findById(req.params.id);
        if (!gym) return res.status(404).json({ message: 'Gym not found' });
        res.json(gym);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateGym = async (req, res) => {
    try {
        const gym = await Gym.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!gym) return res.status(404).json({ message: 'Gym not found' });
        res.json(gym);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteGym = async (req, res) => {
    try {
        const gym = await Gym.findByIdAndDelete(req.params.id);
        if (!gym) return res.status(404).json({ message: 'Gym not found' });
        res.json({ message: 'Gym deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
