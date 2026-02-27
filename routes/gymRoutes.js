const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gymController');

router.get('/', gymController.getAllGyms);
router.post('/', gymController.createGym);
router.get('/:id', gymController.getGymById);
router.put('/:id', gymController.updateGym);
router.delete('/:id', gymController.deleteGym);

module.exports = router;
