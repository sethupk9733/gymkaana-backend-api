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
    // In a real flow, this could involve creating a Razorpay Order first
    const booking = new Booking({
        ...req.body,
        status: 'pending' // Default to pending until payment is confirmed
    });
    try {
        const newBooking = await booking.save();
        res.status(201).json(newBooking);
    } catch (err) {
        console.error('Error creating booking:', err.message);
        res.status(400).json({ message: err.message });
    }
};
