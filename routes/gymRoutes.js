const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gymController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', gymController.getAllGyms);
router.post('/', protect, gymController.createGym);
router.get('/:id', gymController.getGymById);
router.put('/:id', protect, gymController.updateGym);
router.delete('/:id', protect, gymController.deleteGym);

module.exports = router;
