const { Grade, Student, Teacher } = require('../models/models');
const { Op } = require('sequelize');

class GradeController {
    // Создание новой оценки
    async create(req, res) {
        try {
            const { student_id, teacher_id, grade_value, date } = req.body;

            // Проверка обязательных полей
            if (!student_id || !teacher_id || grade_value === undefined || !date) {
                return res.status(400).json({ message: 'Обязательные поля: student_id, teacher_id, grade_value, date' });
            }

            // Проверка существования студента
            const student = await Student.findByPk(student_id);
            if (!student) {
                return res.status(404).json({ message: 'Студент не найден' });
            }

            // Проверка существования учителя
            const teacher = await Teacher.findByPk(teacher_id);
            if (!teacher) {
                return res.status(404).json({ message: 'Учитель не найден' });
            }

            // (Опционально можно добавить дополнительные проверки – например, допустимый диапазон оценок)

            const newGrade = await Grade.create({
                student_id,
                teacher_id,
                grade_value,
                date
            });

            res.status(201).json(newGrade);
        } catch (error) {
            console.error('Ошибка при создании оценки:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение оценки по id с включением информации о студенте и учителе
    async findOne(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Не указан ID оценки' });

            const grade = await Grade.findByPk(id, {
                include: [
                    {
                        model: Student,
                        attributes: ['id', 'first_name', 'last_name', 'email']
                    },
                    {
                        model: Teacher,
                        attributes: ['id', 'first_name', 'last_name', 'email', 'subject']
                    }
                ]
            });

            if (!grade) {
                return res.status(404).json({ message: 'Оценка не найдена' });
            }

            res.json(grade);
        } catch (error) {
            console.error('Ошибка при получении оценки:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение списка оценок с фильтрацией и пагинацией
    async findAll(req, res) {
        try {
            // Допустимые query-параметры: student_id, teacher_id, start_date, end_date, page, limit
            let { student_id, teacher_id, start_date, end_date, page, limit } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            const offset = (page - 1) * limit;

            const where = {};
            if (student_id) where.student_id = student_id;
            if (teacher_id) where.teacher_id = teacher_id;
            if (start_date && end_date) {
                where.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)]
                };
            } else if (start_date) {
                where.date = {
                    [Op.gte]: new Date(start_date)
                };
            } else if (end_date) {
                where.date = {
                    [Op.lte]: new Date(end_date)
                };
            }

            const grades = await Grade.findAndCountAll({
                where,
                include: [
                    {
                        model: Student,
                        attributes: ['id', 'first_name', 'last_name', 'email']
                    },
                    {
                        model: Teacher,
                        attributes: ['id', 'first_name', 'last_name', 'email', 'subject']
                    }
                ],
                limit,
                offset,
                order: [['date', 'DESC']]
            });

            res.json({
                data: grades.rows,
                total: grades.count,
                page,
                totalPages: Math.ceil(grades.count / limit)
            });
        } catch (error) {
            console.error('Ошибка при получении списка оценок:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Обновление оценки
    async update(req, res) {
        try {
            const { id } = req.params;
            const { student_id, teacher_id, grade_value, date } = req.body;

            if (!id) return res.status(400).json({ message: 'Не указан ID оценки' });

            const grade = await Grade.findByPk(id);
            if (!grade) {
                return res.status(404).json({ message: 'Оценка не найдена' });
            }

            // Если переданы новые student_id или teacher_id, проверяем существование соответствующих записей
            if (student_id) {
                const student = await Student.findByPk(student_id);
                if (!student) {
                    return res.status(404).json({ message: 'Студент не найден' });
                }
            }

            if (teacher_id) {
                const teacher = await Teacher.findByPk(teacher_id);
                if (!teacher) {
                    return res.status(404).json({ message: 'Учитель не найден' });
                }
            }

            const updatedFields = {};
            if (student_id !== undefined) updatedFields.student_id = student_id;
            if (teacher_id !== undefined) updatedFields.teacher_id = teacher_id;
            if (grade_value !== undefined) updatedFields.grade_value = grade_value;
            if (date !== undefined) updatedFields.date = date;

            await grade.update(updatedFields);
            res.json(grade);
        } catch (error) {
            console.error('Ошибка при обновлении оценки:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Удаление оценки
    async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Не указан ID оценки' });

            const grade = await Grade.findByPk(id);
            if (!grade) {
                return res.status(404).json({ message: 'Оценка не найдена' });
            }

            await grade.destroy();
            res.status(200).json({ message: 'Оценка успешно удалена' });
        } catch (error) {
            console.error('Ошибка при удалении оценки:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
}

module.exports = new GradeController();