const express = require('express');
const GradeController = require('../controllers/GradeController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/', authenticateToken, GradeController.create);
router.get('/:id', authenticateToken, GradeController.findOne);
router.get('/', authenticateToken, GradeController.findAll);
router.put('/:id', authenticateToken, GradeController.update);
router.delete('/:id', authenticateToken, GradeController.delete);

module.exports = router;