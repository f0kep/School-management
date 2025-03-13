const { Class, Teacher, Student } = require('../models/models');
const { Op } = require('sequelize');

class ClassController {
    // Создание нового класса
    async create(req, res) {
        try {
            const { name, class_teacher_id, academic_year } = req.body;

            // Проверка обязательных полей
            if (!name || !class_teacher_id || !academic_year) {
                return res.status(400).json({ message: 'Не заполнены обязательные поля: name, class_teacher_id, academic_year' });
            }

            // Проверка существования классного руководителя
            const teacher = await Teacher.findByPk(class_teacher_id);
            if (!teacher) {
                return res.status(404).json({ message: 'Учитель-классный руководитель не найден' });
            }

            const newClass = await Class.create({
                name,
                class_teacher_id,
                academic_year,
            });

            res.status(201).json(newClass);
        } catch (error) {
            console.error('Ошибка при создании класса:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение класса по id с информацией о классном руководителе и учениках
    async findOne(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Не указан ID класса' });

            const classRecord = await Class.findByPk(id, {
                include: [
                    {
                        model: Teacher,
                        as: 'ClassTeacher',
                        attributes: ['id', 'first_name', 'last_name', 'email'],
                    },
                    {
                        model: Student,
                        attributes: ['id', 'first_name', 'last_name', 'email'],
                    },
                ],
            });

            if (!classRecord) {
                return res.status(404).json({ message: 'Класс не найден' });
            }

            res.json(classRecord);
        } catch (error) {
            console.error('Ошибка при получении класса:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение списка классов с пагинацией и фильтрацией
    async findAll(req, res) {
        try {
            // Допустимые query-параметры: page, limit, academic_year, name
            let { page, limit, academic_year, name } = req.query;
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

            const classes = await Class.findAndCountAll({
                where,
                include: [
                    {
                        model: Teacher,
                        as: 'ClassTeacher',
                        attributes: ['id', 'first_name', 'last_name', 'email'],
                    },
                    {
                        model: Student,
                        attributes: ['id', 'first_name', 'last_name', 'email'],
                    },
                ],
                limit,
                offset,
                order: [['name', 'ASC']],
            });

            res.json({
                data: classes.rows,
                total: classes.count,
                page,
                totalPages: Math.ceil(classes.count / limit),
            });
        } catch (error) {
            console.error('Ошибка при получении списка классов:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Обновление данных класса
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, class_teacher_id, academic_year } = req.body;

            if (!id) return res.status(400).json({ message: 'Не указан ID класса' });

            const classRecord = await Class.findByPk(id);
            if (!classRecord) {
                return res.status(404).json({ message: 'Класс не найден' });
            }

            // Если передан новый классный руководитель, проверяем его существование
            if (class_teacher_id) {
                const teacher = await Teacher.findByPk(class_teacher_id);
                if (!teacher) {
                    return res.status(404).json({ message: 'Учитель-классный руководитель не найден' });
                }
            }

            const updatedFields = {};
            if (name !== undefined) updatedFields.name = name;
            if (class_teacher_id !== undefined) updatedFields.class_teacher_id = class_teacher_id;
            if (academic_year !== undefined) updatedFields.academic_year = academic_year;

            await classRecord.update(updatedFields);
            res.json(classRecord);
        } catch (error) {
            console.error('Ошибка при обновлении класса:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Удаление класса
    async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'Не указан ID класса' });

            const classRecord = await Class.findByPk(id);
            if (!classRecord) {
                return res.status(404).json({ message: 'Класс не найден' });
            }

            // Проверяем, есть ли студенты, привязанные к классу
            const studentCount = await Student.count({ where: { class_id: id } });
            if (studentCount > 0) {
                return res.status(400).json({ message: 'Невозможно удалить класс, к которому привязаны студенты' });
            }

            await classRecord.destroy();
            res.status(200).json({ message: 'Класс успешно удалён' });
        } catch (error) {
            console.error('Ошибка при удалении класса:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
}

module.exports = new ClassController();