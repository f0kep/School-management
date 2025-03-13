const express = require('express');
const ScheduleController = require('../controllers/ScheduleController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/', authenticateToken, ScheduleController.create);
router.get('/:id', authenticateToken, ScheduleController.findOne);
router.get('/', authenticateToken, ScheduleController.findAll);
router.put('/:id', authenticateToken, ScheduleController.update);
router.delete('/:id', authenticateToken, ScheduleController.delete);

module.exports = router;