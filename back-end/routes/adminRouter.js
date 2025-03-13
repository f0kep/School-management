const express = require('express');
const AdminController = require('../controllers/AdminController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/registration', AdminController.registration);
router.post('/login', AdminController.login);
router.get('/auth', authenticateToken, AdminController.auth);
router.get('/:id', authenticateToken, AdminController.findOne);
router.get('/', authenticateToken, AdminController.findAll);
router.put('/:id', authenticateToken, AdminController.update);
router.delete('/:id', authenticateToken, AdminController.delete);

module.exports = router;