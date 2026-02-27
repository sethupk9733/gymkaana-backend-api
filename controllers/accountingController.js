const Gym = require('../models/Gym');
const Booking = require('../models/Booking');
const Payout = require('../models/Payout');

// @desc    Get comprehensive accounting data for owner
// @route   GET /api/accounting
// @access  Private (Owner)
const getAccountingData = async (req, res) => {
    try {
        console.log("Fetching account data for user:", req.user.id);
        const ownerId = req.user.id; // User must be authenticated

        // 1. Get all Gyms owned by this user
        const gyms = await Gym.find({ ownerId });
        const gymIds = gyms.map(gym => gym._id);
        const gymMap = gyms.reduce((acc, gym) => {
            acc[gym._id.toString()] = gym.name;
            return acc;
        }, {});

        // 2. Get all Bookings for these gyms (INCOMING)
        const bookings = await Booking.find({ gymId: { $in: gymIds } })
            .select('amount bookingDate status gymId memberName')
            .lean();

        // 3. Get all Payouts for this owner (OUTGOING)
        const payouts = await Payout.find({ ownerId })
            .select('amount requestedAt paidAt status gymId transactionId')
            .lean();

        // 4. Transform and Merge
        const transactions = [];

        // Add Bookings
        bookings.forEach(booking => {
            transactions.push({
                _id: booking._id,
                type: 'IN', // Income
                amount: booking.amount,
                date: booking.bookingDate || new Date(),
                description: `Booking - ${booking.memberName}`,
                gymName: gymMap[booking.gymId.toString()] || 'Unknown Gym',
                status: booking.status,
                entityId: booking._id,
                entityType: 'booking'
            });
        });

        // Add Payouts
        payouts.forEach(payout => {
            transactions.push({
                _id: payout._id,
                type: 'OUT', // Expense/Withdrawal
                amount: payout.amount,
                date: payout.paidAt || payout.requestedAt, // Use paid date if available
                description: `Payout Withdrawal`,
                gymName: gymMap[payout.gymId?.toString()] || 'Wallet',
                status: payout.status,
                entityId: payout._id,
                entityType: 'payout',
                reference: payout.transactionId
            });
        });

        // 5. Sort by Date Descending (Newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 6. Calculate Stats
        const stats = {
            totalRevenue: bookings.reduce((sum, b) => sum + (b.amount || 0), 0),
            totalWithdrawn: payouts
                .filter(p => p.status === 'Paid')
                .reduce((sum, p) => sum + (p.amount || 0), 0),
            pendingPayouts: payouts
                .filter(p => p.status === 'Pending' || p.status === 'Processing')
                .reduce((sum, p) => sum + (p.amount || 0), 0),
        };
        stats.netBalance = stats.totalRevenue - stats.totalWithdrawn - stats.pendingPayouts; // Approximate

        res.json({
            stats,
            transactions
        });

    } catch (err) {
        console.error("Accounting Error:", err);
        res.status(500).json({ message: err.message });
    }
};

const getAdminAccountingData = async (req, res) => {
    try {
        const roles = req.user.roles || [];
        if (!roles.includes('admin')) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // 1. Get all Gyms
        const gyms = await Gym.find({});
        const gymMap = gyms.reduce((acc, gym) => {
            acc[gym._id.toString()] = gym.name;
            return acc;
        }, {});

        // 2. Get all Bookings
        const bookings = await Booking.find({})
            .populate('userId', 'name email')
            .lean();

        // 3. Get all Payouts
        const payouts = await Payout.find({})
            .populate('gymId', 'name')
            .populate('ownerId', 'name email')
            .lean();

        // 4. Transform into Ledger
        const transactions = [];

        bookings.forEach(b => {
            transactions.push({
                id: `TXN-${b._id.toString().slice(-7).toUpperCase()}`,
                user: b.userId?.name || b.memberName || 'Unknown User',
                email: b.userId?.email || b.memberEmail || '',
                gym: gymMap[b.gymId?.toString()] || 'Unknown Hub',
                amount: b.amount,
                date: new Date(b.bookingDate || b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: new Date(b.bookingDate || b.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                status: b.status === 'active' || b.status === 'completed' ? 'Completed' : b.status === 'cancelled' ? 'Refunded' : 'Pending',
                type: 'Booking',
                method: 'UPI',
                commission: b.amount * 0.15,
                netPayout: b.amount * 0.85,
                cancellationReason: b.cancellationReason,
                cancellationDate: b.cancellationDate,
                refundDetails: b.refundDetails
            });
        });

        payouts.forEach(p => {
            transactions.push({
                id: `PAY-${p._id.toString().slice(-7).toUpperCase()}`,
                user: p.ownerId?.name || 'Unknown Owner',
                email: p.ownerId?.email || '',
                gym: p.gymId?.name || 'Multiple Hubs',
                amount: p.amount,
                date: new Date(p.paidAt || p.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: new Date(p.paidAt || p.requestedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                status: p.status === 'Paid' ? 'Completed' : p.status === 'Pending' ? 'Pending' : 'Failed',
                type: 'Payout',
                method: 'Bank Transfer',
                commission: 0,
                netPayout: p.amount,
                rawDate: p.paidAt || p.requestedAt
            });
        });

        const stats = {
            grossRevenue: bookings.reduce((sum, b) => sum + (b.amount || 0), 0),
            totalCommission: bookings.reduce((sum, b) => sum + ((b.amount || 0) * 0.15), 0),
            totalRefunds: bookings.filter(b => b.status === 'cancelled').reduce((sum, b) => sum + (b.amount || 0), 0),
            settledPayouts: payouts.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.amount || 0), 0),
        };

        res.json({
            stats,
            transactions: transactions.sort((a, b) => new Date(b.rawDate || b.date).getTime() - new Date(a.rawDate || a.date).getTime())
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAccountingData,
    getAdminAccountingData
};
