const express = require('express');
const TeacherController = require('../controllers/TeacherController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/registration', TeacherController.registration);
router.post('/login', TeacherController.login);
router.get('/auth', authenticateToken, TeacherController.auth);
router.get('/:id', authenticateToken, TeacherController.findOne);
router.get('/', authenticateToken, TeacherController.findAll);
router.put('/:id', authenticateToken, TeacherController.update);
router.delete('/:id', authenticateToken, TeacherController.delete);

module.exports = router;
