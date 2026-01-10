const Booking = require('../models/Booking');

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('gymId').populate('planId');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getBookingsByGym = async (req, res) => {
    try {
        const bookings = await Booking.find({ gymId: req.params.gymId }).populate('planId');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createBooking = async (req, res) => {
    const booking = new Booking(req.body);
    try {
        const newBooking = await booking.save();
        res.status(201).json(newBooking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
