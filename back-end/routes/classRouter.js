const express = require('express');
const ClassController = require('../controllers/ClassController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/', authenticateToken, ClassController.create);
router.get('/:id', authenticateToken, ClassController.findOne);
router.get('/', authenticateToken, ClassController.findAll);
router.put('/:id', authenticateToken, ClassController.update);
router.delete('/:id', authenticateToken, ClassController.delete);

module.exports = router;