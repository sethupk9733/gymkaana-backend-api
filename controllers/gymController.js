const Gym = require('../models/Gym');

exports.getAllGyms = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status.toLowerCase();
        }
        const gyms = await Gym.find(filter).populate('ownerId', 'name email phoneNumber');
        res.json(gyms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createGym = async (req, res) => {
    console.log('🏗️ createGym called | Body Keys:', Object.keys(req.body));
    console.log('👤 Authenticated User:', req.user?._id, 'Roles:', req.user?.roles);

    // Guard: Ensure user is authenticated
    if (!req.user || !req.user._id) {
        console.error('❌ Authentication failure: req.user is missing');
        return res.status(401).json({ message: 'User NOT identified. Please login again.' });
    }

    // Guard: Ensure the body was actually parsed
    if (!req.body || Object.keys(req.body).length === 0) {
        console.error('❌ Request body is empty');
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

    console.log('📝 Creating Gym document for:', req.body.name);

    const gym = new Gym({
        name: String(req.body.name).trim(),
        description: req.body.description || '',
        address: String(req.body.address).trim(),
        phone: req.body.phone || '',
        email: req.body.email || '',
        city: req.body.city || '',
        zipCode: req.body.zipCode || req.body.zip || '', // Handle both web and mobile keys
        landmark: req.body.landmark || '',
        googleMapsLink: req.body.googleMapsLink || req.body.location || '', // Handle location field from mobile
        headTrainer: req.body.headTrainer || '',
        experience: req.body.experience || '',
        specializations,
        openingHoursWeekdays: req.body.openingHoursWeekdays || req.body.timings || '', // Handle timings field from mobile
        openingHoursWeekends: req.body.openingHoursWeekends || '',
        facilities: Array.isArray(req.body.facilities) ? req.body.facilities : [],
        images: Array.isArray(req.body.images) ? req.body.images : (req.body.image ? [req.body.image] : []),
        image: req.body.image || (Array.isArray(req.body.images) && req.body.images.length > 0 ? req.body.images[0] : ''),
        bankDetails: req.body.bankDetails || {}, // Support bank details from mobile/web
        gstNo: req.body.gstNo || '',
        panNo: req.body.panNo || '',
        documentation: {
            tradingLicense: req.body.documentation?.tradingLicense || req.body.tradingLicense || '',
            fireSafety: req.body.documentation?.fireSafety || req.body.fireSafety || '',
            insurancePolicy: req.body.documentation?.insurancePolicy || req.body.insurancePolicy || ''
        },
        status,
        ownerId: req.user._id
    });

    try {
        const newGym = await gym.save();
        console.log('✅ Gym saved successfully:', newGym._id);
        res.status(201).json(newGym);
    } catch (err) {
        console.error('❌ Error saving gym to DB:', err.message);
        res.status(400).json({
            message: `Gym validation failed: ${err.message}`,
            details: err.errors, // Mongoose validation details
            receivedBody: req.body
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
        const updates = { ...req.body };
        // Sync image fields if either is provided in the update
        if (updates.images && Array.isArray(updates.images)) {
            updates.image = updates.images[0] || '';
        } else if (updates.image && typeof updates.image === 'string') {
            updates.images = [updates.image];
        }

        const gym = await Gym.findByIdAndUpdate(req.params.id, updates, { new: true });
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
