const express = require('express');
const AttendanceController = require('../controllers/AttendanceController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/', authenticateToken, AttendanceController.create);
router.get('/:id', authenticateToken, AttendanceController.findOne);
router.get('/', authenticateToken, AttendanceController.findAll);
router.put('/:id', authenticateToken, AttendanceController.update);
router.delete('/:id', authenticateToken, AttendanceController.delete);

module.exports = router;
