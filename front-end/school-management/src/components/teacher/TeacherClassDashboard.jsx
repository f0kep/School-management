import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../redux/axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const TeacherClassDashboard = () => {
    const { teacher } = useSelector(state => state.teacher);
    const [classInfo, setClassInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Состояния для подробной информации об ученике
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentLoading, setStudentLoading] = useState(false);
    const [studentError, setStudentError] = useState(null);

    // Состояния для расписания класса
    const [scheduleInfo, setScheduleInfo] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleError, setScheduleError] = useState(null);

    // Состояния для оценок выбранного ученика
    const [studentGrades, setStudentGrades] = useState([]);
    const [gradesLoading, setGradesLoading] = useState(false);
    const [gradesError, setGradesError] = useState(null);

    // Состояния для посещаемости выбранного ученика
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceError, setAttendanceError] = useState(null);

    // Получение информации о классе, где учитель является классным руководителем
    useEffect(() => {
        if (teacher && teacher.id) {
            setLoading(true);
            axios.get('/classes', { params: { class_teacher_id: teacher.id } })
                .then(response => {
                    // Предполагается, что сервер возвращает объект вида:
                    // { data: [ { id, name, academic_year, Students: [...] } ], total, totalPages }
                    const classesData = response.data.data;
                    if (classesData && classesData.length > 0) {
                        setClassInfo(classesData[0]);
                    } else {
                        setError('Класс для данного учителя не найден');
                    }
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.response?.data?.message || err.message);
                    setLoading(false);
                });
        }
    }, [teacher]);

    // После получения информации о классе – получаем расписание для данного класса
    useEffect(() => {
        if (classInfo && classInfo.id) {
            setScheduleLoading(true);
            axios.get('/schedules', { params: { class_id: classInfo.id } })
                .then(response => {
                    // Ожидается, что сервер вернёт объект с расписанием, например: { data: [ ... ] }
                    setScheduleInfo(response.data.data);
                    setScheduleLoading(false);
                })
                .catch(err => {
                    setScheduleError(err.response?.data?.message || err.message);
                    setScheduleLoading(false);
                });
        }
    }, [classInfo]);

    // Функция запроса подробной информации об ученике
    const handleViewDetails = (studentId) => {
        setStudentLoading(true);
        setStudentError(null);
        // При выборе нового ученика сбрасываем оценки и посещаемость
        setStudentGrades([]);
        setGradesError(null);
        setAttendanceRecords([]);
        setAttendanceError(null);
        axios.get(`/students/${studentId}`)
            .then(response => {
                setSelectedStudent(response.data);
                setStudentLoading(false);
            })
            .catch(err => {
                setStudentError(err.response?.data?.message || err.message);
                setStudentLoading(false);
            });
    };

    // Функция для закрытия карточки с подробной информацией
    const handleCloseDetails = () => {
        setSelectedStudent(null);
        setStudentError(null);
        // Сброс оценок и посещаемости
        setStudentGrades([]);
        setGradesError(null);
        setAttendanceRecords([]);
        setAttendanceError(null);
    };

    // Функция для получения оценок выбранного ученика
    const handleViewGrades = () => {
        if (!selectedStudent) return;
        setGradesLoading(true);
        setGradesError(null);
        axios.get('/grades', { params: { student_id: selectedStudent.id } })
            .then(response => {
                // Предполагается, что сервер возвращает объект вида: { data: [ ... ], total, ... }
                setStudentGrades(response.data.data);
                setGradesLoading(false);
            })
            .catch(err => {
                setGradesError(err.response?.data?.message || err.message);
                setGradesLoading(false);
            });
    };

    // Функция для скрытия оценок
    const handleHideGrades = () => {
        setStudentGrades([]);
        setGradesError(null);
    };

    // Функция для получения посещаемости выбранного ученика
    const handleViewAttendance = () => {
        if (!selectedStudent) return;
        setAttendanceLoading(true);
        setAttendanceError(null);
        axios.get('/attendance', { params: { student_id: selectedStudent.id } })
            .then(response => {
                // Ожидается, что сервер возвращает объект вида: { data: [ ... ], total, ... }
                setAttendanceRecords(response.data.data);
                setAttendanceLoading(false);
            })
            .catch(err => {
                setAttendanceError(err.response?.data?.message || err.message);
                setAttendanceLoading(false);
            });
    };

    // Функция для скрытия посещаемости
    const handleHideAttendance = () => {
        setAttendanceRecords([]);
        setAttendanceError(null);
    };

    if (loading) {
        return <div className="container mt-5"><p>Загрузка информации о классе...</p></div>;
    }

    if (error) {
        return <div className="container mt-5"><div className="alert alert-danger">{error}</div></div>;
    }

    if (!classInfo) {
        return <div className="container mt-5"><p>Информация о классе отсутствует</p></div>;
    }

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Мой класс</h2>
            <div className="card mb-4">
                <div className="card-body">
                    <h4 className="card-title">{classInfo.name}</h4>
                    <p className="card-text">
                        <strong>Академический год:</strong> {classInfo.academic_year}
                    </p>
                </div>
            </div>

            {/* Раздел для отображения расписания */}
            <h4>Расписание класса</h4>
            {scheduleLoading ? (
                <p>Загрузка расписания...</p>
            ) : scheduleError ? (
                <div className="alert alert-danger">{scheduleError}</div>
            ) : scheduleInfo && scheduleInfo.length > 0 ? (
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>День недели</th>
                            <th>Номер урока</th>
                            <th>Аудитория</th>
                            <th>Учитель</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scheduleInfo.map(item => (
                            <tr key={item.id}>
                                <td>{item.day_of_week}</td>
                                <td>{item.lesson_number}</td>
                                <td>{item.classroom}</td>
                                <td>
                                    {item.Teacher ? `${item.Teacher.first_name} ${item.Teacher.last_name}` : 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Расписание отсутствует</p>
            )}

            {/* Список учеников */}
            <h4>Список учеников</h4>
            {classInfo.Students && classInfo.Students.length > 0 ? (
                <div class="table-responsive">
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Фамилия</th>
                            <th>Email</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classInfo.Students.map(student => (
                            <tr key={student.id}>
                                <td>{student.id}</td>
                                <td>{student.first_name}</td>
                                <td>{student.last_name}</td>
                                <td>{student.email}</td>
                                <td>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleViewDetails(student.id)}
                                    >
                                        Подробнее
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            ) : (
                <p>Ученики отсутствуют</p>
            )}

            {/* Карточка с подробной информацией об ученике */}
            {studentLoading && (
                <div className="mt-4">
                    <p>Загрузка подробной информации об ученике...</p>
                </div>
            )}
            {studentError && (
                <div className="alert alert-danger mt-4">
                    {studentError}
                    <button className="btn btn-link" onClick={handleCloseDetails}>Закрыть</button>
                </div>
            )}
            {selectedStudent && (
                <div className="card mt-4">
                    <div className="card-header">
                        Подробная информация об ученике
                        <button
                            className="btn btn-link float-end"
                            onClick={handleCloseDetails}
                        >
                            Закрыть
                        </button>
                    </div>
                    <div className="card-body">
                        <p><strong>ID:</strong> {selectedStudent.id}</p>
                        <p><strong>Имя:</strong> {selectedStudent.first_name}</p>
                        <p><strong>Фамилия:</strong> {selectedStudent.last_name}</p>
                        <p><strong>Email:</strong> {selectedStudent.email}</p>
                        {selectedStudent.birth_date && (
                            <p><strong>Дата рождения:</strong> {selectedStudent.birth_date}</p>
                        )}
                        {selectedStudent.parent_contact && (
                            <p><strong>Контакт родителя:</strong> {selectedStudent.parent_contact}</p>
                        )}

                        {/* Блок для оценок */}
                        {studentGrades.length === 0 ? (
                            <button className="btn btn-secondary mt-3" onClick={handleViewGrades}>
                                Показать оценки
                            </button>
                        ) : (
                            <button className="btn btn-secondary mt-3" onClick={handleHideGrades}>
                                Скрыть оценки
                            </button>
                        )}
                        {gradesLoading && <p className="mt-3">Загрузка оценок...</p>}
                        {gradesError && <div className="alert alert-danger mt-3">{gradesError}</div>}
                        {studentGrades && studentGrades.length > 0 ? (
                            <table className="table table-bordered mt-3">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Оценка</th>
                                        <th>Дата</th>
                                        <th>Учитель (предмет)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentGrades.map(grade => (
                                        <tr key={grade.id}>
                                            <td>{grade.id}</td>
                                            <td>{grade.grade_value}</td>
                                            <td>{grade.date}</td>
                                            <td>
                                                {grade.Teacher
                                                    ? `${grade.Teacher.first_name} ${grade.Teacher.last_name} (${grade.Teacher.subject})`
                                                    : 'N/A'
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (!gradesLoading && studentGrades.length === 0 && (
                            <p className="mt-3">Оценки отсутствуют</p>
                        ))}

                        {/* Блок для посещаемости */}
                        {attendanceRecords.length === 0 ? (
                            <button className="btn btn-secondary mt-3" onClick={handleViewAttendance}>
                                Показать посещаемость
                            </button>
                        ) : (
                            <button className="btn btn-secondary mt-3" onClick={handleHideAttendance}>
                                Скрыть посещаемость
                            </button>
                        )}
                        {attendanceLoading && <p className="mt-3">Загрузка посещаемости...</p>}
                        {attendanceError && <div className="alert alert-danger mt-3">{attendanceError}</div>}
                        {attendanceRecords && attendanceRecords.length > 0 ? (
                            <table className="table table-bordered mt-3">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Дата</th>
                                        <th>Статус</th>
                                        <th>Расписание</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceRecords.map(record => (
                                        <tr key={record.id}>
                                            <td>{record.id}</td>
                                            <td>{record.date}</td>
                                            <td>{record.status}</td>
                                            <td>
                                                {record.Schedule
                                                    ? `День: ${record.Schedule.day_of_week}, Урок: ${record.Schedule.lesson_number}, Аудитория: ${record.Schedule.classroom}`
                                                    : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (!attendanceLoading && attendanceRecords.length === 0 && (
                            <p className="mt-3">Данные о посещаемости отсутствуют</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherClassDashboard;
