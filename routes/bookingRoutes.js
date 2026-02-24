const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// Create booking - with auth from localStorage userId
router.post('/', bookingController.createBooking);

// All other routes require authentication
router.use(protect);

router.get('/', bookingController.getAllBookings);
router.get('/my', bookingController.getMyBookings);
router.get('/gym/:gymId', bookingController.getBookingsByGym);
router.get('/:id', bookingController.getBookingById);
router.put('/:id/cancel', bookingController.cancelBooking);
router.put('/:id/update-date', bookingController.updateBookingDate);
router.post('/lookup-qr', bookingController.lookupBooking);
router.post('/confirm-qr', bookingController.confirmBooking);
router.post('/verify-qr', bookingController.lookupBooking); // Map old verify to lookup for now to prevent breaks during migration

module.exports = router;
