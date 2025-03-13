const express = require('express');
const StudentController = require('../controllers/StudentController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/registration', StudentController.registration);
router.post('/login', StudentController.login);
router.get('/auth', authenticateToken, StudentController.auth);
router.get('/:id', authenticateToken, StudentController.findOne);
router.get('/', authenticateToken, StudentController.findAll);
router.put('/:id', authenticateToken, StudentController.update);
router.delete('/:id', authenticateToken, StudentController.delete);

module.exports = router;