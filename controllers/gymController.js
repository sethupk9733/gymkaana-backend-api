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
    console.log('🏗️ createGym called | Body Keys:', Object.keys(req.body), '| User ID:', req.user?._id);
    console.log('🔍 req.body.name:', req.body.name, '| req.body.address:', req.body.address);

    // Guard: Ensure the body was actually parsed
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Empty request body. Ensure Content-Type is application/json.' });
    }

    // Guard: Check required fields manually before hitting Mongoose
    if (!req.body.name || String(req.body.name).trim() === '') {
        return res.status(400).json({ message: 'Gym name is required.' });
    }
    if (!req.body.address || String(req.body.address).trim() === '') {
        return res.status(400).json({ message: 'Gym address is required.' });
    }

    // Handle specializations: frontend may send a comma-separated string or an array
    let specializations = req.body.specializations;
    if (typeof specializations === 'string' && specializations.trim()) {
        specializations = specializations.split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(specializations)) {
        specializations = [];
    }

    const status = (req.body.status || 'pending').toLowerCase();

    const gym = new Gym({
        name: String(req.body.name).trim(),
        description: req.body.description || '',
        address: String(req.body.address).trim(),
        phone: req.body.phone || '',
        email: req.body.email || '',
        city: req.body.city || '',
        zipCode: req.body.zipCode || '',
        landmark: req.body.landmark || '',
        googleMapsLink: req.body.googleMapsLink || '',
        headTrainer: req.body.headTrainer || '',
        experience: req.body.experience || '',
        specializations,
        openingHoursWeekdays: req.body.openingHoursWeekdays || '',
        openingHoursWeekends: req.body.openingHoursWeekends || '',
        facilities: Array.isArray(req.body.facilities) ? req.body.facilities : [],
        image: req.body.image || '',
        status,
        ownerId: req.user._id
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
