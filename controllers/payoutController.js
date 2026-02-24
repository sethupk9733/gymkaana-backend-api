const Payout = require('../models/Payout');
const Gym = require('../models/Gym');
const Booking = require('../models/Booking');

exports.getPayoutHistory = async (req, res) => {
    try {
        const { gymId } = req.query;
        let query = { ownerId: req.user._id };
        if (gymId && gymId !== 'all') query.gymId = gymId;

        const history = await Payout.find(query).sort({ requestedAt: -1 }).populate('gymId', 'name');
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.requestPayout = async (req, res) => {
    try {
        const { gymId, amount } = req.body;

        if (!gymId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid payout request details' });
        }

        const gym = await Gym.findOne({ _id: gymId, ownerId: req.user._id });
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        if (!gym.bankDetails || !gym.bankDetails.accountNumber) {
            return res.status(400).json({ message: 'Please set up bank details for this gym first' });
        }

        // Logic check: Sum all completed bookings - already paid payouts
        const totalEarningsResult = await Booking.aggregate([
            { $match: { gymId: gym._id, status: { $in: ['active', 'completed', 'upcoming'] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalPaidOutResult = await Payout.aggregate([
            { $match: { gymId: gym._id, status: { $in: ['Paid', 'Processing', 'Pending'] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const earnings = totalEarningsResult[0]?.total || 0;
        const netRevenue = earnings * 0.85; // 15% platform fee
        const alreadyPaid = totalPaidOutResult[0]?.total || 0;
        const availableBalance = netRevenue - alreadyPaid;

        if (amount > availableBalance) {
            return res.status(400).json({ message: `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}` });
        }

        const payout = new Payout({
            ownerId: req.user._id,
            gymId: gym._id,
            amount: amount,
            bankDetails: gym.bankDetails
        });

        await payout.save();
        res.status(201).json(payout);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateGymBankDetails = async (req, res) => {
    try {
        const { gymId, bankDetails } = req.body;

        const gym = await Gym.findOneAndUpdate(
            { _id: gymId, ownerId: req.user._id },
            { $set: { bankDetails: bankDetails } },
            { new: true }
        );

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        res.json(gym);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllAdminPayouts = async (req, res) => {
    try {
        const history = await Payout.find({})
            .sort({ requestedAt: -1 })
            .populate('gymId', 'name')
            .populate('ownerId', 'name email');
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updatePayoutStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks, transactionId } = req.body;

        const payout = await Payout.findById(id);

        if (!payout) {
            return res.status(404).json({ message: 'Payout request not found' });
        }

        payout.status = status;
        if (remarks) payout.remarks = remarks;
        if (transactionId) payout.transactionId = transactionId;
        if (status === 'Paid') payout.paidAt = Date.now();

        await payout.save();
        res.json(payout);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
