import React, { useState, useEffect } from 'react';
import axios from '../../redux/axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const StudentDashboard = () => {
    const [student, setStudent] = useState(null);
    const [studentLoading, setStudentLoading] = useState(false);
    const [studentError, setStudentError] = useState(null);

    const [classInfo, setClassInfo] = useState(null);
    const [classLoading, setClassLoading] = useState(false);
    const [classError, setClassError] = useState(null);

    const [schedule, setSchedule] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleError, setScheduleError] = useState(null);

    const [grades, setGrades] = useState([]);
    const [gradesLoading, setGradesLoading] = useState(false);
    const [gradesError, setGradesError] = useState(null);

    const [attendance, setAttendance] = useState([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceError, setAttendanceError] = useState(null);

    // Получение данных студента по токену
    useEffect(() => {
        setStudentLoading(true);
        axios.get('/students/auth')
            .then(response => {
                setStudent(response.data.student);
                setStudentLoading(false);
            })
            .catch(err => {
                setStudentError(err.response?.data?.message || err.message);
                setStudentLoading(false);
            });
    }, []);

    // Получение данных о классе, если у студента указан class_id
    useEffect(() => {
        if (student && student.class_id) {
            setClassLoading(true);
            axios.get(`/classes/${student.class_id}`)
                .then(response => {
                    setClassInfo(response.data);
                    setClassLoading(false);
                })
                .catch(err => {
                    setClassError(err.response?.data?.message || err.message);
                    setClassLoading(false);
                });
        }
    }, [student]);

    // Получение данных о расписании класса
    useEffect(() => {
        if (classInfo && classInfo.id) {
            setScheduleLoading(true);
            axios.get('/schedules', { params: { class_id: classInfo.id } })
                .then(response => {
                    setSchedule(response.data.data);
                    setScheduleLoading(false);
                })
                .catch(err => {
                    setScheduleError(err.response?.data?.message || err.message);
                    setScheduleLoading(false);
                });
        }
    }, [classInfo]);

    // Получение оценок ученика
    useEffect(() => {
        if (student && student.id) {
            setGradesLoading(true);
            axios.get('/grades', { params: { student_id: student.id } })
                .then(response => {
                    setGrades(response.data.data);
                    setGradesLoading(false);
                })
                .catch(err => {
                    setGradesError(err.response?.data?.message || err.message);
                    setGradesLoading(false);
                });
        }
    }, [student]);

    // Получение данных о посещаемости ученика
    useEffect(() => {
        if (student && student.id) {
            setAttendanceLoading(true);
            axios.get('/attendance', { params: { student_id: student.id } })
                .then(response => {
                    setAttendance(response.data.data);
                    setAttendanceLoading(false);
                })
                .catch(err => {
                    setAttendanceError(err.response?.data?.message || err.message);
                    setAttendanceLoading(false);
                });
        }
    }, [student]);

    if (studentLoading) {
        return (
            <div className="container mt-5">
                <p>Загрузка данных студента...</p>
            </div>
        );
    }

    if (studentError) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">{studentError}</div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="container mt-5">
                <p>Данные студента отсутствуют</p>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <h2 className="mb-4">Личный кабинет студента</h2>
            <div className="row">
                {/* Карточка с данными студента */}
                <div className="col-md-6 mb-4">
                    <div className="card">
                        <div className="card-header">Информация о студенте</div>
                        <div className="card-body">
                            <p><strong>ID:</strong> {student.id}</p>
                            <p><strong>Имя:</strong> {student.first_name}</p>
                            <p><strong>Фамилия:</strong> {student.last_name}</p>
                            <p><strong>Email:</strong> {student.email}</p>
                            {student.birth_date && (
                                <p><strong>Дата рождения:</strong> {student.birth_date}</p>
                            )}
                            {student.parent_contact && (
                                <p><strong>Контакт родителя:</strong> {student.parent_contact}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Карточка с данными класса */}
                <div className="col-md-6 mb-4">
                    {classLoading ? (
                        <p>Загрузка данных класса...</p>
                    ) : classError ? (
                        <div className="alert alert-danger">{classError}</div>
                    ) : classInfo ? (
                        <div className="card">
                            <div className="card-header">Информация о классе</div>
                            <div className="card-body">
                                <p><strong>Название класса:</strong> {classInfo.name}</p>
                                <p><strong>Академический год:</strong> {classInfo.academic_year}</p>
                                {classInfo.ClassTeacher && (
                                    <div>
                                        <p><strong>Классный руководитель:</strong></p>
                                        <p>
                                            {classInfo.ClassTeacher.first_name} {classInfo.ClassTeacher.last_name} ({classInfo.ClassTeacher.email})
                                        </p>
                                    </div>
                                )}
                                {classInfo.Students && (
                                    <p><strong>Количество учеников:</strong> {classInfo.Students.length}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p>Данные о классе отсутствуют</p>
                    )}
                </div>
            </div>

            {/* Карточка с данными расписания класса */}
            <div className="row">
                <div className="col-12 mb-4">
                    {scheduleLoading ? (
                        <p>Загрузка расписания...</p>
                    ) : scheduleError ? (
                        <div className="alert alert-danger">{scheduleError}</div>
                    ) : schedule && schedule.length > 0 ? (
                        <div className="card">
                            <div className="card-header">Расписание класса</div>
                            <div className="card-body">
                                {schedule.map(item => (
                                    <div key={item.id} className="mb-3">
                                        <p>
                                            <strong>День недели:</strong> {item.day_of_week} <br />
                                            <strong>Номер урока:</strong> {item.lesson_number} <br />
                                            <strong>Аудитория:</strong> {item.classroom} <br />
                                            <strong>Учитель:</strong> {item.Teacher ? `${item.Teacher.first_name} ${item.Teacher.last_name}` : 'N/A'}
                                        </p>
                                        <hr />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p>Расписание отсутствует</p>
                    )}
                </div>
            </div>

            {/* Карточка с оценками студента */}
            <div className="row">
                <div className="col-12 mb-4">
                    {gradesLoading ? (
                        <p>Загрузка оценок...</p>
                    ) : gradesError ? (
                        <div className="alert alert-danger">{gradesError}</div>
                    ) : grades && grades.length > 0 ? (
                        <div className="card">
                            <div className="card-header">Оценки</div>
                            <div className="card-body">
                                {grades.map(grade => (
                                    <div key={grade.id} className="mb-3">
                                        <p>
                                            <strong>ID оценки:</strong> {grade.id} <br />
                                            <strong>Оценка:</strong> {grade.grade_value} <br />
                                            <strong>Дата:</strong> {new Date(grade.date).toLocaleDateString()} <br />
                                            <strong>Учитель:</strong> {grade.Teacher ? `${grade.Teacher.first_name} ${grade.Teacher.last_name} (${grade.Teacher.subject})` : 'N/A'}
                                        </p>
                                        <hr />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p>Оценки отсутствуют</p>
                    )}
                </div>
            </div>

            {/* Карточка с посещаемостью студента */}
            <div className="row">
                <div className="col-12 mb-4">
                    {attendanceLoading ? (
                        <p>Загрузка данных о посещаемости...</p>
                    ) : attendanceError ? (
                        <div className="alert alert-danger">{attendanceError}</div>
                    ) : attendance && attendance.length > 0 ? (
                        <div className="card">
                            <div className="card-header">Посещаемость</div>
                            <div className="card-body">
                                {attendance.map(record => (
                                    <div key={record.id} className="mb-3">
                                        <p>
                                            <strong>ID записи:</strong> {record.id} <br />
                                            <strong>Дата:</strong> {new Date(record.date).toLocaleDateString()} <br />
                                            <strong>Статус:</strong> {record.status} <br />
                                            <strong>Расписание:</strong> {record.Schedule
                                                ? `День: ${record.Schedule.day_of_week}, Урок: ${record.Schedule.lesson_number}, Аудитория: ${record.Schedule.classroom}`
                                                : 'N/A'}
                                        </p>
                                        <hr />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p>Данные о посещаемости отсутствуют</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
