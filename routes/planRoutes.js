const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');

router.get('/gym/:gymId', planController.getPlansByGym);
router.post('/', planController.createPlan);
router.put('/:id', planController.updatePlan);
router.delete('/:id', planController.deletePlan);

module.exports = router;
