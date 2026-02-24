const Review = require('../models/Review');
const Gym = require('../models/Gym');
const Booking = require('../models/Booking');

exports.createReview = async (req, res) => {
    try {
        const { gymId, bookingId, rating, comment } = req.body;

        // Verify booking belongs to user, is completed, and hasn't been reviewed yet
        const booking = await Booking.findOne({ _id: bookingId, userId: req.user._id });
        if (!booking) {
            return res.status(403).json({ message: 'Booking not found or access denied.' });
        }

        if (booking.status !== 'completed') {
            return res.status(400).json({ message: 'You can only review a gym after checking in and completing your session.' });
        }

        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this visit.' });
        }

        const review = new Review({
            gymId,
            userId: req.user._id,
            bookingId,
            rating,
            comment
        });

        await review.save();

        // Update gym overall rating (simplified)
        const reviews = await Review.find({ gymId });
        const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

        await Gym.findByIdAndUpdate(gymId, {
            rating: avgRating.toFixed(1),
            reviews: reviews.length
        });

        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getGymReviews = async (req, res) => {
    try {
        console.log('📝 Fetching reviews for gym:', req.params.gymId);
        const reviews = await Review.find({ gymId: req.params.gymId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
        console.log(`✅ Found ${reviews.length} reviews for gym ${req.params.gymId}`);
        res.json(reviews);
    } catch (err) {
        console.error('❌ Error fetching gym reviews:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('userId', 'name email')
            .populate('gymId', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getOwnerReviews = async (req, res) => {
    try {
        const myGyms = await Gym.find({ ownerId: req.user._id });
        const gymIds = myGyms.map(g => g._id);

        const reviews = await Review.find({ gymId: { $in: gymIds } })
            .populate('userId', 'name email phoneNumber')
            .populate('gymId', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.replyToReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { reply } = req.body;

        const review = await Review.findById(reviewId).populate('gymId');
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Verify that the user owns the gym associated with this review
        // review.gymId is the populated Gym object
        if (review.gymId.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to reply to this review' });
        }

        review.reply = reply;
        review.repliedAt = new Date();
        await review.save();

        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
