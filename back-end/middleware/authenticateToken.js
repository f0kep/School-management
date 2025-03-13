const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Не авторизован' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Не авторизован' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        console.log('Decoded token:', decoded);

        // Проверяем наличие идентификатора для админа, учителя или ученика
        if (decoded.adminId) {
            req.user = { adminId: decoded.adminId };
        } else if (decoded.teacherId) {
            req.user = { teacherId: decoded.teacherId };
        } else if (decoded.studentId) {
            req.user = { studentId: decoded.studentId };
        } else {
            return res.status(401).json({ message: 'Не авторизован' });
        }
        next();
    } catch (error) {
        console.error('Ошибка в authenticateToken middleware:', error);
        res.status(401).json({ message: 'Не авторизован' });
    }
};
