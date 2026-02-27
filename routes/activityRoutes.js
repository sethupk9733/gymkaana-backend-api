const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, activityController.getActivities);

module.exports = router;
