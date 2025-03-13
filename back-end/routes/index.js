const Router = require('express').Router;
const router = new Router();

router.use('/admins', require('./adminRouter'));
router.use('/teachers', require('./teacherRouter'));
router.use('/students', require('./studentRouter'));
router.use('/classes', require('./classRouter'));
router.use('/schedules', require('./scheduleRouter'));
router.use('/grades', require('./gradeRouter'));
router.use('/events', require('./eventRouter'));
router.use('/attendance', require('./attendanceRouter'));

module.exports = router;
