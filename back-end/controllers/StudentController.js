const { Student } = require('../models/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class StudentController {
    // Регистрация студента
    async registration(req, res) {
        try {
            const { first_name, last_name, email, password, birth_date, parent_contact, class_id } = req.body;

            const existingStudent = await Student.findOne({ where: { email } });
            if (existingStudent) {
                return res.status(400).json({ message: 'Студент с таким email уже существует' });
            }

            const passwordHash = await bcrypt.hash(password, 12);

            const student = await Student.create({
                first_name,
                last_name,
                email,
                password: passwordHash,
                birth_date,
                parent_contact,
                class_id,
            });

            res.status(201).json(student);
        } catch (error) {
            console.error('Ошибка при регистрации студента:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Вход студента
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const student = await Student.findOne({ where: { email } });
            if (!student) {
                return res.status(404).json({ message: 'Студент не найден' });
            }

            const isMatch = await bcrypt.compare(password, student.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Неверный пароль' });
            }

            const token = jwt.sign(
                { studentId: student.id },
                process.env.JWT_SECRET || 'your_jwt_secret_key',
                { expiresIn: '24h' }
            );

            res.json({ token, studentId: student.id, role: 'student' });
        } catch (error) {
            console.error('Ошибка при входе студента:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Аутентификация студента (получение данных по токену)
    async auth(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: 'Не авторизован' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            const student = await Student.findByPk(decoded.studentId);
            if (!student) {
                return res.status(404).json({ message: 'Студент не найден' });
            }

            res.json({ student });
        } catch (error) {
            console.error('Ошибка при аутентификации студента:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение студента по id
    async findOne(req, res) {
        try {
            const student = await Student.findByPk(req.params.id);
            if (!student) {
                return res.status(404).json({ message: 'Студент не найден' });
            }
            res.json(student);
        } catch (error) {
            console.error('Ошибка при получении студента:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение списка всех студентов
    async findAll(req, res) {
        try {
            const students = await Student.findAll();
            res.json(students);
        } catch (error) {
            console.error('Ошибка при получении списка студентов:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Обновление данных студента
    async update(req, res) {
        try {
            const { first_name, last_name, email, password, birth_date, parent_contact, class_id } = req.body;
            const studentId = req.params.id;

            // Обновлять профиль может только сам студент (предполагается, что middleware устанавливает req.user.studentId)
            if (req.user.studentId !== parseInt(studentId, 10) && !req.user.adminId) {
                return res.status(403).json({ message: 'Нет прав для обновления этого профиля' });
            }

            const student = await Student.findByPk(studentId);
            if (!student) {
                return res.status(404).json({ message: 'Студент не найден' });
            }

            let updatedData = { first_name, last_name, email, birth_date, parent_contact, class_id };
            if (password) {
                updatedData.password = await bcrypt.hash(password, 12);
            }

            await student.update(updatedData);
            res.json(student);
        } catch (error) {
            console.error('Ошибка при обновлении студента:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Удаление студента
    async delete(req, res) {
        try {
            const studentId = req.params.id;

            // Удалять профиль может только сам студент
            if (req.user.studentId !== parseInt(studentId, 10)) {
                return res.status(403).json({ message: 'Нет прав для удаления этого профиля' });
            }

            const student = await Student.findByPk(studentId);
            if (!student) {
                return res.status(404).json({ message: 'Студент не найден' });
            }

            await student.destroy();
            res.status(200).json({ message: 'Студент успешно удалён' });
        } catch (error) {
            console.error('Ошибка при удалении студента:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
}

module.exports = new StudentController();