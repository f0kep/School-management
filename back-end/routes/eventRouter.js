const express = require('express');
const EventController = require('../controllers/EventController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/', authenticateToken, EventController.create);
router.get('/:id', EventController.findOne);  // Получение события может быть публичным
router.get('/', EventController.findAll);
router.put('/:id', authenticateToken, EventController.update);
router.delete('/:id', authenticateToken, EventController.delete);

module.exports = router;
