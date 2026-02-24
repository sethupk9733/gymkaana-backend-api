const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, reviewController.createReview);
router.get('/', protect, reviewController.getAllReviews);
router.get('/owner', protect, reviewController.getOwnerReviews);
router.get('/gym/:gymId', reviewController.getGymReviews);
router.post('/:reviewId/reply', protect, reviewController.replyToReview);

module.exports = router;
