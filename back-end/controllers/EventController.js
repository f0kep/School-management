const { Event, Student, Teacher } = require('../models/models');
const { Op } = require('sequelize');

class EventController {
    // Создание нового события
    async create(req, res) {
        try {
            const {
                title,
                description,
                event_date,
                organizer_id,
                organizer_type,
                studentIds, // массив ID студентов
                teacherIds  // массив ID учителей
            } = req.body;

            // Проверка обязательных полей
            if (!title || !event_date || !organizer_id || !organizer_type) {
                return res.status(400).json({
                    message: 'Обязательные поля: title, event_date, organizer_id, organizer_type'
                });
            }

            // Если организатор – учитель, проверяем его существование
            if (organizer_type === 'teacher') {
                const teacher = await Teacher.findByPk(organizer_id);
                if (!teacher) {
                    return res.status(404).json({ message: 'Учитель-организатор не найден' });
                }
            }
            // (При необходимости можно добавить проверку для администраторов)

            // Создание события
            const event = await Event.create({
                title,
                description,
                event_date,
                organizer_id,
                organizer_type
            });

            // Установка участников, если они переданы
            if (studentIds && Array.isArray(studentIds)) {
                await event.setStudents(studentIds);
            }
            if (teacherIds && Array.isArray(teacherIds)) {
                await event.setTeachers(teacherIds);
            }

            // Получаем созданное событие с участниками
            const createdEvent = await Event.findByPk(event.id, {
                include: [
                    {
                        model: Student,
                        through: { attributes: [] },
                        attributes: ['id', 'first_name', 'last_name', 'email']
                    },
                    {
                        model: Teacher,
                        through: { attributes: [] },
                        attributes: ['id', 'first_name', 'last_name', 'email', 'subject']
                    }
                ]
            });

            res.status(201).json(createdEvent);
        } catch (error) {
            console.error('Ошибка при создании события:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение события по ID с участниками
    async findOne(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Не указан ID события' });

            const event = await Event.findByPk(id, {
                include: [
                    {
                        model: Student,
                        through: { attributes: [] },
                        attributes: ['id', 'first_name', 'last_name', 'email']
                    },
                    {
                        model: Teacher,
                        through: { attributes: [] },
                        attributes: ['id', 'first_name', 'last_name', 'email', 'subject']
                    }
                ]
            });

            if (!event) {
                return res.status(404).json({ message: 'Событие не найдено' });
            }

            res.json(event);
        } catch (error) {
            console.error('Ошибка при получении события:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение списка событий с фильтрацией и пагинацией
    async findAll(req, res) {
        try {
            // Возможные query-параметры: page, limit, organizer_id, organizer_type, start_date, end_date, title
            let { page, limit, organizer_id, organizer_type, start_date, end_date, title } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            const offset = (page - 1) * limit;

            const where = {};
            if (organizer_id) where.organizer_id = organizer_id;
            if (organizer_type) where.organizer_type = organizer_type;
            if (start_date && end_date) {
                where.event_date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)]
                };
            } else if (start_date) {
                where.event_date = {
                    [Op.gte]: new Date(start_date)
                };
            } else if (end_date) {
                where.event_date = {
                    [Op.lte]: new Date(end_date)
                };
            }
            if (title) {
                where.title = { [Op.iLike]: `%${title}%` };
            }

            const events = await Event.findAndCountAll({
                where,
                include: [
                    {
                        model: Student,
                        through: { attributes: [] },
                        attributes: ['id', 'first_name', 'last_name', 'email']
                    },
                    {
                        model: Teacher,
                        through: { attributes: [] },
                        attributes: ['id', 'first_name', 'last_name', 'email', 'subject']
                    }
                ],
                limit,
                offset,
                order: [['event_date', 'DESC']]
            });

            res.json({
                data: events.rows,
                total: events.count,
                page,
                totalPages: Math.ceil(events.count / limit)
            });
        } catch (error) {
            console.error('Ошибка при получении списка событий:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Обновление события
    async update(req, res) {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                event_date,
                organizer_id,
                organizer_type,
                studentIds, // массив новых ID студентов
                teacherIds  // массив новых ID учителей
            } = req.body;

            if (!id) return res.status(400).json({ message: 'Не указан ID события' });

            const event = await Event.findByPk(id);
            if (!event) {
                return res.status(404).json({ message: 'Событие не найдено' });
            }

            // Если изменяются организатор или его тип, при необходимости проверяем существование учителя/админа
            if (organizer_id && organizer_type) {
                if (organizer_type === 'teacher') {
                    const teacher = await Teacher.findByPk(organizer_id);
                    if (!teacher) {
                        return res.status(404).json({ message: 'Учитель-организатор не найден' });
                    }
                }
                // Аналогично можно добавить проверку для администраторов
            }

            const updatedFields = {};
            if (title !== undefined) updatedFields.title = title;
            if (description !== undefined) updatedFields.description = description;
            if (event_date !== undefined) updatedFields.event_date = event_date;
            if (organizer_id !== undefined) updatedFields.organizer_id = organizer_id;
            if (organizer_type !== undefined) updatedFields.organizer_type = organizer_type;

            await event.update(updatedFields);

            // Если переданы массивы новых участников, обновляем связи
            if (studentIds && Array.isArray(studentIds)) {
                await event.setStudents(studentIds);
            }
            if (teacherIds && Array.isArray(teacherIds)) {
                await event.setTeachers(teacherIds);
            }

            // Получаем обновлённое событие с участниками
            const updatedEvent = await Event.findByPk(id, {
                include: [
                    {
                        model: Student,
                        through: { attributes: [] },
                        attributes: ['id', 'first_name', 'last_name', 'email']
                    },
                    {
                        model: Teacher,
                        through: { attributes: [] },
                        attributes: ['id', 'first_name', 'last_name', 'email', 'subject']
                    }
                ]
            });

            res.json(updatedEvent);
        } catch (error) {
            console.error('Ошибка при обновлении события:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Удаление события
    async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Не указан ID события' });

            const event = await Event.findByPk(id);
            if (!event) {
                return res.status(404).json({ message: 'Событие не найдено' });
            }

            await event.destroy();
            res.status(200).json({ message: 'Событие успешно удалено' });
        } catch (error) {
            console.error('Ошибка при удалении события:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
}

module.exports = new EventController();