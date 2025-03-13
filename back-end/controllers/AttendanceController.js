const { Attendance, Student, Schedule } = require('../models/models');
const { Op } = require('sequelize');

class AttendanceController {
    // Создание новой записи посещаемости
    async create(req, res) {
        try {
            const { student_id, schedule_id, date, status, remarks } = req.body;

            // Проверка обязательных полей
            if (!student_id || !schedule_id || !date || !status) {
                return res.status(400).json({ message: 'Обязательные поля: student_id, schedule_id, date, status' });
            }

            // Проверка допустимых значений статуса
            const allowedStatuses = ['present', 'absent', 'excused'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ message: 'Неверное значение статуса. Допустимые: present, absent, excused' });
            }

            // Проверка существования студента
            const student = await Student.findByPk(student_id);
            if (!student) {
                return res.status(404).json({ message: 'Студент не найден' });
            }

            // Проверка существования расписания
            const schedule = await Schedule.findByPk(schedule_id);
            if (!schedule) {
                return res.status(404).json({ message: 'Расписание не найдено' });
            }

            // Проверка на конфликт: запись для данного студента, расписания и даты не должна существовать
            const existingRecord = await Attendance.findOne({
                where: {
                    student_id,
                    schedule_id,
                    date: new Date(date)
                }
            });
            if (existingRecord) {
                return res.status(400).json({ message: 'Запись посещаемости для данного студента, расписания и даты уже существует' });
            }

            const newAttendance = await Attendance.create({
                student_id,
                schedule_id,
                date,
                status,
                remarks
            });

            res.status(201).json(newAttendance);
        } catch (error) {
            console.error('Ошибка при создании записи посещаемости:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение записи посещаемости по ID с информацией о студенте и расписании
    async findOne(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: 'Не указан ID записи посещаемости' });
            }

            const attendance = await Attendance.findByPk(id, {
                include: [
                    {
                        model: Student,
                        attributes: ['id', 'first_name', 'last_name', 'email']
                    },
                    {
                        model: Schedule,
                        attributes: ['id', 'class_id', 'teacher_id', 'day_of_week', 'lesson_number', 'classroom']
                    }
                ]
            });

            if (!attendance) {
                return res.status(404).json({ message: 'Запись посещаемости не найдена' });
            }

            res.json(attendance);
        } catch (error) {
            console.error('Ошибка при получении записи посещаемости:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Получение списка записей посещаемости с фильтрацией и пагинацией
    async findAll(req, res) {
        try {
            // Допустимые query-параметры: page, limit, student_id, schedule_id, status, start_date, end_date
            let { page, limit, student_id, schedule_id, status, start_date, end_date } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            const offset = (page - 1) * limit;

            const where = {};
            if (student_id) where.student_id = student_id;
            if (schedule_id) where.schedule_id = schedule_id;
            if (status) where.status = status;
            if (start_date && end_date) {
                where.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)]
                };
            } else if (start_date) {
                where.date = { [Op.gte]: new Date(start_date) };
            } else if (end_date) {
                where.date = { [Op.lte]: new Date(end_date) };
            }

            const attendanceRecords = await Attendance.findAndCountAll({
                where,
                include: [
                    {
                        model: Student,
                        attributes: ['id', 'first_name', 'last_name', 'email']
                    },
                    {
                        model: Schedule,
                        attributes: ['id', 'class_id', 'teacher_id', 'day_of_week', 'lesson_number', 'classroom']
                    }
                ],
                limit,
                offset,
                order: [['date', 'DESC']]
            });

            res.json({
                data: attendanceRecords.rows,
                total: attendanceRecords.count,
                page,
                totalPages: Math.ceil(attendanceRecords.count / limit)
            });
        } catch (error) {
            console.error('Ошибка при получении списка записей посещаемости:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Обновление записи посещаемости
    async update(req, res) {
        try {
            const { id } = req.params;
            const { student_id, schedule_id, date, status, remarks } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'Не указан ID записи посещаемости' });
            }

            const attendance = await Attendance.findByPk(id);
            if (!attendance) {
                return res.status(404).json({ message: 'Запись посещаемости не найдена' });
            }

            // Если обновляются идентификаторы, проверяем существование соответствующих записей
            if (student_id && student_id !== attendance.student_id) {
                const student = await Student.findByPk(student_id);
                if (!student) {
                    return res.status(404).json({ message: 'Студент не найден' });
                }
            }
            if (schedule_id && schedule_id !== attendance.schedule_id) {
                const schedule = await Schedule.findByPk(schedule_id);
                if (!schedule) {
                    return res.status(404).json({ message: 'Расписание не найдено' });
                }
            }

            // Если обновляется статус, проверяем его допустимость
            if (status) {
                const allowedStatuses = ['present', 'absent', 'excused'];
                if (!allowedStatuses.includes(status)) {
                    return res.status(400).json({ message: 'Неверное значение статуса. Допустимые: present, absent, excused' });
                }
            }

            // Если обновляются ключевые поля, проверяем, чтобы не возник конфликт (исключая текущую запись)
            if (student_id || schedule_id || date) {
                const newStudentId = student_id || attendance.student_id;
                const newScheduleId = schedule_id || attendance.schedule_id;
                const newDate = date || attendance.date;
                const conflict = await Attendance.findOne({
                    where: {
                        id: { [Op.ne]: id },
                        student_id: newStudentId,
                        schedule_id: newScheduleId,
                        date: new Date(newDate)
                    }
                });
                if (conflict) {
                    return res.status(400).json({ message: 'Запись посещаемости для данного студента, расписания и даты уже существует' });
                }
            }

            const updatedFields = {};
            if (student_id !== undefined) updatedFields.student_id = student_id;
            if (schedule_id !== undefined) updatedFields.schedule_id = schedule_id;
            if (date !== undefined) updatedFields.date = date;
            if (status !== undefined) updatedFields.status = status;
            if (remarks !== undefined) updatedFields.remarks = remarks;

            await attendance.update(updatedFields);
            res.json(attendance);
        } catch (error) {
            console.error('Ошибка при обновлении записи посещаемости:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }

    // Удаление записи посещаемости
    async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: 'Не указан ID записи посещаемости' });
            }

            const attendance = await Attendance.findByPk(id);
            if (!attendance) {
                return res.status(404).json({ message: 'Запись посещаемости не найдена' });
            }

            await attendance.destroy();
            res.status(200).json({ message: 'Запись посещаемости успешно удалена' });
        } catch (error) {
            console.error('Ошибка при удалении записи посещаемости:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
}

module.exports = new AttendanceController();