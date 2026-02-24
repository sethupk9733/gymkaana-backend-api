const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Gym = require('../models/Gym');
const { logActivity } = require('./activityController');
const QRCode = require('qrcode');
const sendEmail = require('../utils/sendEmail');

exports.getAllBookings = async (req, res) => {
    try {
        let filter = {};
        const roles = req.user.roles || [];
        if (roles.includes('owner') && !roles.includes('admin')) {
            const myGyms = await Gym.find({ ownerId: req.user._id });
            filter = { gymId: { $in: myGyms.map(g => g._id) } };
        }

        const bookings = await Booking.find(filter)
            .populate('gymId')
            .populate('planId')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getBookingsByGym = async (req, res) => {
    try {
        const bookings = await Booking.find({ gymId: req.params.gymId })
            .populate('planId')
            .populate('userId', 'name email');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id })
            .populate('gymId')
            .populate('planId')
            .sort({ createdAt: -1 });
        res.json(bookings);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createBooking = async (req, res) => {
    try {
        console.log('===== BOOKING CREATION DEBUG =====');
        console.log('Body:', req.body);

        // Validate required fields
        const requiredFields = ['gymId', 'planId', 'userId', 'memberName', 'memberEmail', 'amount', 'startDate', 'endDate'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
        }

        const booking = new Booking({
            gymId: req.body.gymId,
            planId: req.body.planId,
            userId: req.body.userId,
            memberName: req.body.memberName,
            memberEmail: req.body.memberEmail,
            amount: req.body.amount,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            status: req.body.status || 'upcoming'
        });

        console.log('Booking object created:', booking);
        const newBooking = await booking.save();
        console.log('Booking saved successfully:', newBooking._id);

        // Populate and return
        const populated = await Booking.findById(newBooking._id).populate('gymId planId');
        console.log('Booking populated:', populated);

        // Log activity asynchronously (don't block response)
        logActivity({
            userId: req.body.userId,
            gymId: req.body.gymId,
            action: 'Booking Created',
            description: `New booking for ₹${req.body.amount} secured.`,
            type: 'success'
        }).catch(err => console.error("Activity log failed:", err.message));

        // Generate and Send QR Email
        try {
            const qrDataUrl = await QRCode.toDataURL(newBooking._id.toString());
            await sendEmail({
                email: req.body.memberEmail,
                subject: 'Your Gymkaana Pass is Ready! 🎫',
                message: `Your booking for ${populated.gymId?.name || 'the gym'} is confirmed. Use the attached QR code for entry.`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 15px; text-align: center;">
                        <h2 style="color: #000;">Booking Confirmed! 🚀</h2>
                        <p>Hi ${req.body.memberName || 'Athlete'},</p>
                        <p>Your session at <strong>${populated.gymId?.name || 'Gymkaana Partner'}</strong> is ready.</p>
                        
                        <div style="background: #f9f9f9; padding: 30px; border-radius: 20px; display: inline-block; margin: 20px 0;">
                            <img src="${qrDataUrl}" alt="Booking QR Code" style="width: 200px; height: 200px;" />
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">Present this QR code at the reception when you arrive.</p>
                        
                        <div style="text-align: left; background: #fafafa; padding: 15px; border-radius: 10px; margin-top: 20px;">
                            <p style="margin: 5px 0;"><strong>Plan:</strong> ${populated.planId?.name || 'Standard Access'}</p>
                            <p style="margin: 5px 0;"><strong>Valid From:</strong> ${new Date(req.body.startDate).toLocaleDateString()}</p>
                            <p style="margin: 5px 0;"><strong>Expires:</strong> ${new Date(req.body.endDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                `
            });
            console.log('✅ QR Email sent to:', req.body.memberEmail);
        } catch (qrErr) {
            console.error('❌ Failed to send QR email:', qrErr.message);
        }

        res.status(201).json(populated);
    } catch (err) {
        console.error("===== BOOKING ERROR =====");
        console.error("Error message:", err.message);
        console.error("Full Error:", err);
        res.status(400).json({ message: err.message });
    }
};

exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('gymId')
            .populate('planId')
            .populate('userId', 'name email phoneNumber');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.lookupBooking = async (req, res) => {
    try {
        const { bookingId } = req.body;
        let booking;

        // Try searching by full ObjectId first
        if (mongoose.Types.ObjectId.isValid(bookingId)) {
            booking = await Booking.findById(bookingId)
                .populate('gymId')
                .populate('planId')
                .populate('userId', 'name email phoneNumber profileImage photo');
        }

        // Fallback: If not found or if bookingId is short (8 chars), try to find by short display ID
        if (!booking && (bookingId.length === 8 || bookingId.length === 24)) {
            const regex = new RegExp(bookingId + '$', 'i');
            booking = await Booking.findOne({
                $expr: {
                    $regexMatch: {
                        input: { $toString: "$_id" },
                        regex: regex
                    }
                }
            })
                .populate('gymId')
                .populate('planId')
                .populate('userId', 'name email phoneNumber profileImage photo');
        }

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Security Check: Only the gym owner or an admin can verify this booking
        const roles = req.user.roles || [];
        if (roles.includes('owner') && !roles.includes('admin')) {
            const gymId = booking.gymId._id || booking.gymId;
            const gym = await Gym.findById(gymId);
            if (!gym || gym.ownerId.toString() !== req.user._id.toString()) {
                console.warn(`Unauthorized verification attempt by owner ${req.user._id} for booking at gym ${gymId}`);
                return res.status(403).json({ message: 'Authorization Failed: You can only verify check-ins for your own gym.' });
            }
        }

        res.json({ booking });
    } catch (err) {
        console.error("Lookup Error:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const { bookingId, action, reason } = req.body; // action: 'accept' | 'reject'
        const booking = await Booking.findById(bookingId).populate('planId');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Security Check
        const roles = req.user.roles || [];
        if (roles.includes('owner') && !roles.includes('admin')) {
            const gym = await Gym.findById(booking.gymId);
            if (!gym || gym.ownerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Authorization Failed' });
            }
        }

        if (action === 'accept') {
            booking.status = 'completed';
            await booking.save();

            logActivity({
                userId: booking.userId,
                gymId: booking.gymId,
                action: 'Check-in Verified',
                description: `Member ${booking.memberName} checked in successfully.`,
                type: 'success'
            }).catch(err => console.error("Activity log failed:", err.message));

            return res.json({ message: 'Entry accepted', booking });
        } else {
            booking.status = 'cancelled';
            booking.cancellationReason = reason || 'Rejected during verification';
            booking.cancellationDate = new Date();
            booking.cancelledBy = 'owner';

            const isDayPass = booking.planId?.duration?.toLowerCase().includes('day');

            booking.refundDetails = {
                status: isDayPass ? 'processed' : 'pending',
                amount: booking.amount,
                processedAt: isDayPass ? new Date() : null
            };
            await booking.save();

            logActivity({
                userId: booking.userId,
                gymId: booking.gymId,
                action: 'Check-in Rejected',
                description: `Entry for ${booking.memberName} rejected. Reason: ${reason || 'Not specified'}`,
                type: 'warning'
            }).catch(err => console.error("Activity log failed:", err.message));

            return res.json({ message: 'Entry rejected', booking });
        }
    } catch (err) {
        console.error("Confirmation Error:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('planId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Security check
        const roles = req.user.roles || [];
        if (booking.userId.toString() !== req.user._id.toString() && !roles.includes('admin')) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const now = new Date();
        const bookingTime = new Date(booking.createdAt);
        const diffMs = now - bookingTime;
        const diffHrs = diffMs / (1000 * 60 * 60);

        let canCancel = false;
        let reason = "";

        // Within 1 hour of booking OR before checking in (upcoming status)
        if (booking.status === 'upcoming') {
            canCancel = true;
            reason = "Before check-in";
        } else if (diffHrs <= 1 && booking.status !== 'cancelled') {
            // This case handles edge cases where status might have changed but still within 1hr cooling off
            // though usually check-in happens after 1hr unless it's a very quick walk-in
            canCancel = true;
            reason = "Within 1 hour of booking";
        }

        if (!canCancel) {
            return res.status(400).json({
                message: 'Cancellation policy: Must be before check-in or within 1 hour of booking. Otherwise, please contact support.',
                requiresChat: true
            });
        }

        booking.status = 'cancelled';
        booking.cancellationReason = reason || "Cancelled by user";
        booking.cancellationDate = new Date();
        booking.cancelledBy = 'user';

        const isDayPass = booking.planId?.duration?.toLowerCase().includes('day');

        booking.refundDetails = {
            status: isDayPass ? 'processed' : 'pending',
            amount: booking.amount,
            processedAt: isDayPass ? new Date() : null
        };
        await booking.save();

        logActivity({
            userId: booking.userId,
            gymId: booking.gymId,
            action: 'Booking Cancelled',
            description: `Booking ${booking._id} cancelled by user. Reason: ${reason}`,
            type: 'warning'
        }).catch(err => console.error("Activity log failed:", err.message));

        res.json({ message: 'Booking cancelled successfully', booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateBookingDate = async (req, res) => {
    try {
        // Option removed as per user request
        return res.status(400).json({ message: 'Date modification is no longer allowed. Please cancel and re-book if needed.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

