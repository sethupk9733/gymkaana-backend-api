const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, bookingController.getAllBookings);
router.get('/my', protect, bookingController.getMyBookings);
router.get('/gym/:gymId', protect, bookingController.getBookingsByGym);
router.post('/', protect, bookingController.createBooking);

// Refund Routes
router.put('/:id/request-refund', protect, bookingController.requestRefund);
router.put('/:id/approve-refund', protect, admin, bookingController.approveRefund);
router.put('/:id/reject-refund', protect, admin, bookingController.rejectRefund);

module.exports = router;
