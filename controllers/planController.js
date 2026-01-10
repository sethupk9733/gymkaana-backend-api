const Plan = require('../models/Plan');

exports.getPlansByGym = async (req, res) => {
    try {
        const plans = await Plan.find({ gymId: req.params.gymId });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createPlan = async (req, res) => {
    const plan = new Plan({
        gymId: req.body.gymId,
        name: req.body.name,
        price: req.body.price,
        duration: req.body.duration,
        description: req.body.description,
        features: req.body.features
    });

    try {
        const newPlan = await plan.save();
        res.status(201).json(newPlan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updatePlan = async (req, res) => {
    try {
        const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json(plan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findByIdAndDelete(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json({ message: 'Plan deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
