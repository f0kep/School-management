const { Admin, Teacher, Student, Class, Schedule, Grade, Event, Attendance, sequelize } = require('./models/models');
const bcrypt = require('bcrypt');

async function seedDatabase() {
    try {
        // Создание администраторов
        const adminPasswords = await Promise.all(Array(15).fill().map(() => bcrypt.hash('admin123', 10)));
        const admins = await Promise.all(Array(15).fill().map((_, index) => 
            Admin.create({
                first_name: `Администратор${index + 1}`,
                last_name: `Системы${index + 1}`,
                email: `admin${index + 1}${Math.floor(Math.random() * 1000)}@school.com`,
                password: adminPasswords[index]
            })
        ));

        // Создание учителей с реалистичными именами и фамилиями
        const teacherPasswords = await Promise.all(Array(15).fill().map(() => bcrypt.hash('teacher123', 10)));
        const subjects = ['Математика', 'Русский язык', 'Физика', 'Химия', 'Биология', 'История', 'География', 
                        'Английский язык', 'Литература', 'Информатика', 'Физкультура', 'Музыка', 'ИЗО', 'ОБЖ', 'Технология'];
        const teacherNames = [
            { first: 'Анна', last: 'Петрова' },
            { first: 'Иван', last: 'Сидоров' },
            { first: 'Мария', last: 'Иванова' },
            { first: 'Дмитрий', last: 'Козлов' },
            { first: 'Елена', last: 'Смирнова' },
            { first: 'Александр', last: 'Попов' },
            { first: 'Ольга', last: 'Васильева' },
            { first: 'Сергей', last: 'Кузнецов' },
            { first: 'Татьяна', last: 'Новикова' },
            { first: 'Андрей', last: 'Морозов' },
            { first: 'Наталья', last: 'Волкова' },
            { first: 'Павел', last: 'Антонов' },
            { first: 'Екатерина', last: 'Романова' },
            { first: 'Михаил', last: 'Соколов' },
            { first: 'Юлия', last: 'Лебедева' }
        ];

        const teachers = await Promise.all(Array(15).fill().map((_, index) => 
            Teacher.create({
                first_name: teacherNames[index].first,
                last_name: teacherNames[index].last,
                email: `${teacherNames[index].last.toLowerCase()}${Math.floor(Math.random() * 1000)}@school.com`,
                password: teacherPasswords[index],
                phone: `+7 (999) ${String(index + 1).padStart(3, '0')}-${String(index + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
                room: `${100 + index}`,
                subject: subjects[index]
            })
        ));

        // Создание классов (от 1 до 11, буквы А, Б, В, Г)
        const classes = await Promise.all(Array(15).fill().map((_, index) => 
            Class.create({
                name: `${(index % 11) + 1}${String.fromCharCode(65 + (index % 4))}`,
                class_teacher_id: teachers[index].id,
                academic_year: '2023-2024'
            })
        ));

        // Создание учеников с реалистичными именами и фамилиями
        const studentPasswords = await Promise.all(Array(15).fill().map(() => bcrypt.hash('student123', 10)));
        const studentNames = [
            { first: 'Алексей', last: 'Федоров' },
            { first: 'София', last: 'Медведева' },
            { first: 'Артём', last: 'Ершов' },
            { first: 'Алиса', last: 'Григорьева' },
            { first: 'Максим', last: 'Соловьёв' },
            { first: 'Виктория', last: 'Титова' },
            { first: 'Даниил', last: 'Комаров' },
            { first: 'Полина', last: 'Крылова' },
            { first: 'Кирилл', last: 'Тихонов' },
            { first: 'Анна', last: 'Кузьмина' },
            { first: 'Денис', last: 'Кудрявцев' },
            { first: 'Елизавета', last: 'Белова' },
            { first: 'Илья', last: 'Мельников' },
            { first: 'Дарья', last: 'Коновалова' },
            { first: 'Роман', last: 'Ефимов' }
        ];

        const students = await Promise.all(Array(15).fill().map((_, index) => 
            Student.create({
                first_name: studentNames[index].first,
                last_name: studentNames[index].last,
                email: `${studentNames[index].last.toLowerCase()}${Math.floor(Math.random() * 1000)}@school.com`,
                password: studentPasswords[index],
                birth_date: new Date(2010 + Math.floor(index / 3), index % 12, (index % 28) + 1),
                parent_contact: `+7 (999) ${String(index + 1).padStart(3, '0')}-${String(index + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
                class_id: classes[index].id
            })
        ));

        // Создание расписания
        const schedules = await Promise.all(Array(15).fill().map((_, index) => 
            Schedule.create({
                class_id: classes[index].id,
                teacher_id: teachers[index].id,
                day_of_week: (index % 5) + 1,
                lesson_number: (index % 6) + 1,
                classroom: `${100 + index}`
            })
        ));

        // Создание оценок (от 1 до 10)
        const grades = await Promise.all(Array(15).fill().map((_, index) => 
            Grade.create({
                student_id: students[index].id,
                teacher_id: teachers[index].id,
                grade_value: Math.floor(Math.random() * 10) + 1, // Случайная оценка от 1 до 10
                date: new Date()
            })
        ));

        // Создание событий
        const eventTitles = [
            'Школьный концерт', 'Олимпиада по математике', 'Спортивный праздник',
            'Выставка рисунков', 'Конкурс чтецов', 'Турнир по шахматам',
            'День открытых дверей', 'Праздник осени', 'Новогодний утренник',
            'Конкурс проектов', 'Военно-спортивная игра', 'Концерт ко Дню Победы',
            'Выпускной вечер', 'День знаний', 'Последний звонок'
        ];

        const events = await Promise.all(Array(15).fill().map((_, index) => 
            Event.create({
                title: eventTitles[index],
                description: `Описание события ${index + 1}`,
                event_date: new Date(2024, index % 12, (index % 28) + 1),
                organizer_id: index % 2 === 0 ? admins[Math.floor(index / 2)].id : teachers[Math.floor(index / 2)].id,
                organizer_type: index % 2 === 0 ? 'admin' : 'teacher'
            })
        ));

        // Создание посещаемости
        const attendanceStatuses = ['present', 'absent', 'excused'];
        const attendances = await Promise.all(Array(15).fill().map((_, index) => 
            Attendance.create({
                student_id: students[index].id,
                schedule_id: schedules[index].id,
                date: new Date(),
                status: attendanceStatuses[Math.floor(Math.random() * 3)]
            })
        ));

        console.log('База данных успешно заполнена тестовыми данными!');
    } catch (error) {
        console.error('Ошибка при заполнении базы данных:', error);
        throw error;
    }
}

module.exports = { seedDatabase }; 