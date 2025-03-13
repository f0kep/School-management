const { Schedule, Class, Teacher } = require('../models/models');
const { Op } = require('sequelize');

class ScheduleController {
    // Создание новой записи расписания
    async create(req, res) {
        try {
            const { class_id, teacher_id, day_of_week, lesson_number, classroom } = req.body;

            // Проверка обязательных полей
            if (!class_id || !teacher_id || day_of_week === undefined || !lesson_number || !classroom) {
                return res.status(400).json({ message: 'Не заполнены обязательные поля: class_id, teacher_id, day_of_week, lesson_number, classroom' });
            }

            // Проверка существования класса
            const classRecord = await Class.findByPk(class_id);
            if (!classRecord) {
                return res.status(404).json({ message: 'Класс не найден' });
            }

            // Проверка существования учителя
            const teacherRecord = await Teacher.findByPk(teacher_id);
            if (!teacherRecord) {
                return res.status(404).json({ message: 'Учитель не найден' });
            }

            // Проверка на конфликт: в одном классе в один и тот же день и урок не может быть двух записей
            const conflict = await Schedule.findOne({
                where: {
                    class_id,
                    day_of_week,
                    lesson_number
                }
            });
            if (conflict) {
                return res.status(400).json({ message: 'Расписание для этого класса в указанное время уже существует' });
            }

            const newSchedule = await Schedule.create({
                class_id,
                teacher_id,
                day_of_week,
                lesson_number,
                classroom
            });

            res.status(201).json(newSchedule);
        } catch (error) {
            console.error('Ошибка при создании расписания:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение записи расписания по id с информацией о классе и учителе
    async findOne(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Не указан ID расписания' });

            const schedule = await Schedule.findByPk(id, {
                include: [
                    {
                        model: Class,
                        attributes: ['id', 'name', 'academic_year']
                    },
                    {
                        model: Teacher,
                        attributes: ['id', 'first_name', 'last_name', 'email', 'subject']
                    }
                ]
            });

            if (!schedule) {
                return res.status(404).json({ message: 'Расписание не найдено' });
            }

            res.json(schedule);
        } catch (error) {
            console.error('Ошибка при получении расписания:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение списка записей расписания с фильтрацией и пагинацией
    async findAll(req, res) {
        try {
            let { page, limit, academic_year, name, teacher_id, day_of_week } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            const offset = (page - 1) * limit;

            const where = {};
            if (academic_year) {
                where.academic_year = academic_year;
            }
            if (name) {
                where.name = { [Op.iLike]: `%${name}%` };
            }
            if (teacher_id) {
                where.teacher_id = teacher_id;
            }
            // Применяем фильтр по day_of_week только если он не пустой
            if (day_of_week !== undefined && day_of_week !== "") {
                where.day_of_week = day_of_week;
            }

            const schedules = await Schedule.findAndCountAll({
                where,
                include: [
                    {
                        model: Class,
                        attributes: ['id', 'name', 'academic_year']
                    },
                    {
                        model: Teacher,
                        attributes: ['id', 'first_name', 'last_name', 'email', 'subject']
                    }
                ],
                limit,
                offset,
                order: [['day_of_week', 'ASC'], ['lesson_number', 'ASC']]
            });

            res.json({
                data: schedules.rows,
                total: schedules.count,
                page,
                totalPages: Math.ceil(schedules.count / limit)
            });
        } catch (error) {
            console.error('Ошибка при получении списка расписания:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Обновление записи расписания
    async update(req, res) {
        try {
            const { id } = req.params;
            const { class_id, teacher_id, day_of_week, lesson_number, classroom } = req.body;

            if (!id) return res.status(400).json({ message: 'Не указан ID расписания' });

            const schedule = await Schedule.findByPk(id);
            if (!schedule) {
                return res.status(404).json({ message: 'Расписание не найдено' });
            }

            // Если обновляются поля, влияющие на уникальность расписания, проверяем наличие конфликта
            const newClassId = class_id || schedule.class_id;
            const newDay = day_of_week !== undefined ? day_of_week : schedule.day_of_week;
            const newLessonNumber = lesson_number || schedule.lesson_number;

            const conflict = await Schedule.findOne({
                where: {
                    id: { [Op.ne]: id },
                    class_id: newClassId,
                    day_of_week: newDay,
                    lesson_number: newLessonNumber
                }
            });
            if (conflict) {
                return res.status(400).json({ message: 'Расписание для этого класса в указанное время уже существует' });
            }

            // Если указан новый teacher_id, проверяем существование учителя
            if (teacher_id) {
                const teacher = await Teacher.findByPk(teacher_id);
                if (!teacher) {
                    return res.status(404).json({ message: 'Учитель не найден' });
                }
            }

            // Если указан новый class_id, проверяем существование класса
            if (class_id) {
                const classRecord = await Class.findByPk(class_id);
                if (!classRecord) {
                    return res.status(404).json({ message: 'Класс не найден' });
                }
            }

            const updatedFields = {};
            if (class_id !== undefined) updatedFields.class_id = class_id;
            if (teacher_id !== undefined) updatedFields.teacher_id = teacher_id;
            if (day_of_week !== undefined) updatedFields.day_of_week = day_of_week;
            if (lesson_number !== undefined) updatedFields.lesson_number = lesson_number;
            if (classroom !== undefined) updatedFields.classroom = classroom;

            await schedule.update(updatedFields);
            res.json(schedule);
        } catch (error) {
            console.error('Ошибка при обновлении расписания:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Удаление записи расписания
    async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Не указан ID расписания' });

            const schedule = await Schedule.findByPk(id);
            if (!schedule) {
                return res.status(404).json({ message: 'Расписание не найдено' });
            }

            await schedule.destroy();
            res.status(200).json({ message: 'Расписание успешно удалено' });
        } catch (error) {
            console.error('Ошибка при удалении расписания:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
}

module.exports = new ScheduleController();