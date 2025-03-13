const sequelize = require('../db');
const { DataTypes } = require('sequelize');

/** Модель Администратора */
const Admin = sequelize.define('Admin', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
}, { timestamps: true });

/** Модель Учителя */
const Teacher = sequelize.define('Teacher', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    room: { type: DataTypes.STRING, allowNull: true },
    subject: { type: DataTypes.STRING, allowNull: false }, // Название предмета
}, { timestamps: true });

/** Модель Ученика */
const Student = sequelize.define('Student', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    birth_date: { type: DataTypes.DATE, allowNull: false },
    parent_contact: { type: DataTypes.STRING, allowNull: true },
    class_id: { type: DataTypes.INTEGER, allowNull: false },
}, { timestamps: true });

/** Модель Класса */
const Class = sequelize.define('Class', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    class_teacher_id: { type: DataTypes.INTEGER, allowNull: false },
    academic_year: { type: DataTypes.STRING, allowNull: false },
}, { timestamps: true });

/** Модель Расписания уроков */
const Schedule = sequelize.define('Schedule', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    class_id: { type: DataTypes.INTEGER, allowNull: false },
    teacher_id: { type: DataTypes.INTEGER, allowNull: false },
    day_of_week: { type: DataTypes.INTEGER, allowNull: false }, // например, 0 (воскресенье) - 6 (суббота)
    lesson_number: { type: DataTypes.INTEGER, allowNull: false },
    classroom: { type: DataTypes.STRING, allowNull: false },
}, { timestamps: true });

/** Модель Оценки */
const Grade = sequelize.define('Grade', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    teacher_id: { type: DataTypes.INTEGER, allowNull: false },
    grade_value: { type: DataTypes.FLOAT, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
}, { timestamps: true });

/** Модель События */
const Event = sequelize.define('Event', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    event_date: { type: DataTypes.DATE, allowNull: false },
    organizer_id: { type: DataTypes.INTEGER, allowNull: false }, // ссылка на Admin или Teacher
    organizer_type: {
        type: DataTypes.ENUM('admin', 'teacher'),
        allowNull: false
    },
}, { timestamps: true });

/** Модель Посещаемости */
const Attendance = sequelize.define('Attendance', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    schedule_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'excused'),
        allowNull: false
    },
    remarks: { type: DataTypes.TEXT, allowNull: true },
}, { timestamps: true });

/** Ассоциации */

// Связь: Ученик принадлежит классу
Student.belongsTo(Class, { foreignKey: 'class_id' });
Class.hasMany(Student, { foreignKey: 'class_id' });

// Связь: Класс имеет классного руководителя (Учитель)
Class.belongsTo(Teacher, { as: 'ClassTeacher', foreignKey: 'class_teacher_id' });
Teacher.hasMany(Class, { as: 'Classes', foreignKey: 'class_teacher_id' });

// Связь: Расписание связывает Класс и Учителя
Schedule.belongsTo(Class, { foreignKey: 'class_id' });
Class.hasMany(Schedule, { foreignKey: 'class_id' });

Schedule.belongsTo(Teacher, { foreignKey: 'teacher_id' });
Teacher.hasMany(Schedule, { foreignKey: 'teacher_id' });

// Связь: Оценка связывает Ученика и Учителя
Grade.belongsTo(Student, { foreignKey: 'student_id' });
Student.hasMany(Grade, { foreignKey: 'student_id' });

Grade.belongsTo(Teacher, { foreignKey: 'teacher_id' });
Teacher.hasMany(Grade, { foreignKey: 'teacher_id' });

// Связь: Посещаемость фиксирует посещение для Ученика по Расписанию
Attendance.belongsTo(Student, { foreignKey: 'student_id' });
Student.hasMany(Attendance, { foreignKey: 'student_id' });

Attendance.belongsTo(Schedule, { foreignKey: 'schedule_id' });
Schedule.hasMany(Attendance, { foreignKey: 'schedule_id' });

// Связь: Событие – участники (многие-ко-многим)
// Для участников-события используем автоматические промежуточные таблицы
Event.belongsToMany(Student, { through: 'EventStudents', foreignKey: 'eventId' });
Student.belongsToMany(Event, { through: 'EventStudents', foreignKey: 'studentId' });

Event.belongsToMany(Teacher, { through: 'EventTeachers', foreignKey: 'eventId' });
Teacher.belongsToMany(Event, { through: 'EventTeachers', foreignKey: 'teacherId' });

module.exports = {
    Admin,
    Teacher,
    Student,
    Class,
    Schedule,
    Grade,
    Event,
    Attendance,
    sequelize,
};