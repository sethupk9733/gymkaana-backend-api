const Booking = require('../models/Booking');

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('gymId')
            .populate('planId')
            .populate('userId', 'name email phoneNumber profileImage'); // Populate user details
        res.json(bookings);
    } catch (err) {
        console.error('Error fetching bookings:', err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.getBookingsByGym = async (req, res) => {
    try {
        const bookings = await Booking.find({ gymId: req.params.gymId })
            .populate('planId')
            .populate('userId', 'name email phoneNumber profileImage');
        res.json(bookings);
    } catch (err) {
        console.error('Error fetching gym bookings:', err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const booking = new Booking({
            ...req.body,
            status: 'pending'
        });
        const newBooking = await booking.save();
        res.status(201).json(newBooking);
    } catch (err) {
        console.error('Error creating booking:', err.message);
        res.status(400).json({ message: err.message });
    }
};

// @desc    Get bookings for logged in user
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id })
            .populate('gymId', 'name location images')
            .populate('planId', 'name price duration')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Request a refund for a booking
// @route   PUT /api/bookings/:id/request-refund
// @access  Private
exports.requestRefund = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status === 'cancelled' || booking.paymentStatus === 'refunded') {
            return res.status(400).json({ message: 'Booking already cancelled or refunded' });
        }

        // Logic check: within 1hr or before check-in (upcoming)
        const ONE_HOUR = 60 * 60 * 1000;
        const isWithinOneHour = (Date.now() - new Date(booking.createdAt).getTime()) < ONE_HOUR;
        const isUpcoming = booking.status === 'upcoming' || booking.status === 'active'; // Assuming active means pass is valid but not necessarily checked in

        if (!isWithinOneHour && booking.status !== 'upcoming') {
            return res.status(400).json({ message: 'Cancellation policy: must be within 1hr of booking or before start date.' });
        }

        booking.status = 'pending_refund';
        booking.refundRequestedAt = Date.now();
        booking.cancellationReason = req.body.reason || 'User requested refund';
        
        await booking.save();

        res.json({ 
            message: 'Refund requested. Administration will decide within 48hr. If approved, refund will be processed in 14 days.',
            booking 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Admin approve refund
// @route   PUT /api/bookings/:id/approve-refund
// @access  Private/Admin
exports.approveRefund = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = 'cancelled';
        booking.paymentStatus = 'refunded'; // Or 'refund_processing'
        booking.refundApprovedAt = Date.now();
        booking.refundStatus = 'approved';
        
        await booking.save();

        res.json({ message: 'Refund approved successfully. Funds will be returned within 14 days.', booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Admin reject refund
// @route   PUT /api/bookings/:id/reject-refund
// @access  Private/Admin
exports.rejectRefund = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = 'active'; // Restore to active or previous state
        booking.refundStatus = 'rejected';
        booking.adminRemarks = req.body.remarks || 'Refund policy not met';
        
        await booking.save();

        res.json({ message: 'Refund request rejected', booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

