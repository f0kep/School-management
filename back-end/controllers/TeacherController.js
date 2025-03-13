const { Teacher } = require('../models/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class TeacherController {
    // Регистрация учителя
    async registration(req, res) {
        try {
            const { first_name, last_name, email, password, phone, room, subject } = req.body;

            const existingTeacher = await Teacher.findOne({ where: { email } });
            if (existingTeacher) {
                return res.status(400).json({ message: 'Учитель с таким email уже существует' });
            }

            const passwordHash = await bcrypt.hash(password, 12);

            const teacher = await Teacher.create({
                first_name,
                last_name,
                email,
                password: passwordHash,
                phone,
                room,
                subject,
            });

            res.status(201).json(teacher);
        } catch (error) {
            console.error('Ошибка при регистрации учителя:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Вход учителя
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const teacher = await Teacher.findOne({ where: { email } });
            if (!teacher) {
                return res.status(404).json({ message: 'Учитель не найден' });
            }

            const isMatch = await bcrypt.compare(password, teacher.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Неверный пароль' });
            }

            const token = jwt.sign(
                { teacherId: teacher.id },
                process.env.JWT_SECRET || 'your_jwt_secret_key',
                { expiresIn: '24h' }
            );

            res.json({ token, teacherId: teacher.id, role: 'teacher' });
        } catch (error) {
            console.error('Ошибка при входе учителя:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Аутентификация учителя (получение данных по токену)
    async auth(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: 'Не авторизован' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            const teacher = await Teacher.findByPk(decoded.teacherId);
            if (!teacher) {
                return res.status(404).json({ message: 'Учитель не найден' });
            }

            res.json({ teacher });
        } catch (error) {
            console.error('Ошибка при аутентификации учителя:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение учителя по id
    async findOne(req, res) {
        try {
            const teacher = await Teacher.findByPk(req.params.id);
            if (!teacher) {
                return res.status(404).json({ message: 'Учитель не найден' });
            }
            res.json(teacher);
        } catch (error) {
            console.error('Ошибка при получении учителя:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение списка всех учителей
    async findAll(req, res) {
        try {
            const teachers = await Teacher.findAll();
            res.json(teachers);
        } catch (error) {
            console.error('Ошибка при получении списка учителей:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Обновление данных учителя
    async update(req, res) {
        try {
            const { first_name, last_name, email, password, phone, room, subject } = req.body;
            const teacherId = req.params.id;

            // Разрешаем обновление, если пользователь является самим учителем или администратором.
            if (req.user.teacherId !== parseInt(teacherId, 10) && !req.user.adminId) {
                return res.status(403).json({ message: 'Нет прав для обновления этого профиля' });
            }

            const teacher = await Teacher.findByPk(teacherId);
            if (!teacher) {
                return res.status(404).json({ message: 'Учитель не найден' });
            }

            let updatedData = { first_name, last_name, email, phone, room, subject };
            if (password) {
                updatedData.password = await bcrypt.hash(password, 12);
            }

            await teacher.update(updatedData);

            res.json({ teacher });
        } catch (error) {
            console.error('Ошибка при обновлении учителя:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Удаление учителя
    async delete(req, res) {
        try {
            const teacherId = req.params.id;

            // Проверка: удалять свой профиль может только сам учитель
            if (req.user.teacherId !== parseInt(teacherId, 10)) {
                return res.status(403).json({ message: 'Нет прав для удаления этого профиля' });
            }

            const teacher = await Teacher.findByPk(teacherId);
            if (!teacher) {
                return res.status(404).json({ message: 'Учитель не найден' });
            }

            await teacher.destroy();

            res.status(200).json({ message: 'Учитель успешно удалён' });
        } catch (error) {
            console.error('Ошибка при удалении учителя:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
}

module.exports = new TeacherController();