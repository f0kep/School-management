import React, { useState, useEffect } from 'react';
import axios from '../../redux/axios';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import 'bootstrap/dist/css/bootstrap.min.css';

const allowedStatuses = [
    { value: 'present', label: 'Присутствует' },
    { value: 'absent', label: 'Отсутствует' },
    { value: 'excused', label: 'Отпущен' },
];

const AdminManageAttendance = () => {
    // Состояния для списка записей посещаемости и пагинации
    const [attendances, setAttendances] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [listError, setListError] = useState(null);

    // Фильтры для поиска записей
    const [filters, setFilters] = useState({
        student_id: '',
        schedule_id: '',
        status: '',
        start_date: '',
        end_date: '',
    });

    // Состояния модальных окон
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Форма для создания/редактирования записи посещаемости
    const [form, setForm] = useState({
        id: null,
        student_id: '',
        schedule_id: '',
        date: '',
        status: '',
        remarks: '',
    });
    const [notification, setNotification] = useState(null);

    // Состояние для просмотра деталей записи
    const [attendanceDetails, setAttendanceDetails] = useState(null);

    // Списки для выпадающих списков студентов, расписаний и классов
    const [studentOptions, setStudentOptions] = useState([]);
    const [scheduleOptions, setScheduleOptions] = useState([]);
    const [classOptions, setClassOptions] = useState([]);

    // Функция загрузки записей посещаемости с фильтрами и пагинацией
    const fetchAttendances = async () => {
        try {
            const params = { page, limit, ...filters };
            const response = await axios.get('/attendance', { params });
            const data = response.data;
            setAttendances(Array.isArray(data.data) ? data.data : []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setListError(err.response?.data?.message || err.message);
        }
    };

    // Загрузка списка студентов
    const fetchStudentOptions = async () => {
        try {
            const { data } = await axios.get('/students');
            const arr = data.data || data.students || data;
            setStudentOptions(Array.isArray(arr) ? arr : []);
        } catch (err) {
            console.error('Ошибка при загрузке студентов:', err.response?.data?.message || err.message);
        }
    };

    // Загрузка списка расписаний
    const fetchScheduleOptions = async () => {
        try {
            const { data } = await axios.get('/schedules');
            const arr = data.data || data;
            setScheduleOptions(Array.isArray(arr) ? arr : []);
        } catch (err) {
            console.error('Ошибка при загрузке расписаний:', err.response?.data?.message || err.message);
        }
    };

    // Загрузка списка классов
    const fetchClassOptions = async () => {
        try {
            const { data } = await axios.get('/classes');
            const arr = data.data || data.classes || data;
            setClassOptions(Array.isArray(arr) ? arr : []);
        } catch (err) {
            console.error('Ошибка при загрузке классов:', err.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        fetchAttendances();
        fetchStudentOptions();
        fetchScheduleOptions();
        fetchClassOptions();
    }, [page, limit, filters]);

    // Обработчик изменения фильтров
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Обработчик изменения полей формы
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // Создание записи посещаемости
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/attendance', form);
            setNotification('Запись посещаемости успешно создана');
            fetchAttendances();
            setTimeout(() => {
                setNotification(null);
                setShowCreateModal(false);
                setForm({ id: null, student_id: '', schedule_id: '', date: '', status: '', remarks: '' });
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Редактирование записи посещаемости
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`/attendance/${form.id}`, form);
            setNotification('Запись посещаемости успешно обновлена');
            fetchAttendances();
            setTimeout(() => {
                setNotification(null);
                setShowEditModal(false);
                setForm({ id: null, student_id: '', schedule_id: '', date: '', status: '', remarks: '' });
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Удаление записи посещаемости
    const handleDelete = async (id) => {
        if (!window.confirm('Вы действительно хотите удалить эту запись?')) return;
        try {
            const response = await axios.delete(`/attendance/${id}`);
            alert(response.data.message);
            fetchAttendances();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Просмотр деталей записи посещаемости
    const handleViewDetails = async (id) => {
        try {
            const response = await axios.get(`/attendance/${id}`);
            setAttendanceDetails(response.data);
            setShowDetailsModal(true);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Открытие модального окна редактирования и заполнение формы
    const handleEditClick = (attendance) => {
        setForm({
            id: attendance.id,
            student_id: attendance.student_id,
            schedule_id: attendance.schedule_id,
            date: attendance.date ? attendance.date.substring(0, 10) : '',
            status: attendance.status,
            remarks: attendance.remarks || '',
        });
        setShowEditModal(true);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    // Функция для отображения имени студента по его ID
    const getStudentName = (id) => {
        const student = studentOptions.find(s => s.id.toString() === id.toString());
        return student ? `${student.first_name} ${student.last_name}` : id;
    };

    // Функция для отображения информации о расписании с названием класса вместо id
    const getScheduleInfo = (attendance) => {
        if (attendance.Schedule) {
            const classId = attendance.Schedule.class_id;
            const classObj = classOptions.find(c => c.id.toString() === classId.toString());
            const className = classObj ? classObj.name : classId;
            return `${className}, День: ${attendance.Schedule.day_of_week}, Урок: ${attendance.Schedule.lesson_number}, Аудитория: ${attendance.Schedule.classroom}`;
        }
        return attendance.schedule_id;
    };

    // Экспорт в Excel
    const handleExportExcel = () => {
        const exportData = attendances.map(a => ({
            ID: a.id,
            Студент: a.Student ? `${a.Student.first_name} ${a.Student.last_name}` : getStudentName(a.student_id),
            Расписание: a.Schedule ? getScheduleInfo(a) : a.schedule_id,
            Дата: a.date,
            Статус: a.status,
            Примечания: a.remarks || '',
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
        XLSX.writeFile(workbook, "attendance_report.xlsx");
    };

    // Экспорт в DOCX
    const handleExportDocx = async () => {
        const paragraphs = attendances.map((a, index) => {
            const studentName = a.Student ? `${a.Student.first_name} ${a.Student.last_name}` : getStudentName(a.student_id);
            const scheduleInfo = a.Schedule ? getScheduleInfo(a) : a.schedule_id;
            return new Paragraph({
                children: [
                    new TextRun({ text: `${index + 1}. Студент: ${studentName}`, bold: true }),
                    new TextRun({ text: ` | Расписание: ${scheduleInfo}` }),
                    new TextRun({ text: ` | Дата: ${a.date}` }),
                    new TextRun({ text: ` | Статус: ${a.status}` }),
                    new TextRun({ text: ` | Примечания: ${a.remarks || '-'}` }),
                ],
            });
        });
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: "Отчёт по посещаемости", heading: "Heading1" }),
                    ...paragraphs,
                ],
            }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, "attendance_report.docx");
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Управление посещаемостью</h2>

            {/* Панель фильтров */}
            <div className="mb-4">
                <div className="row g-2">
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            name="student_id"
                            value={filters.student_id}
                            onChange={handleFilterChange}
                        >
                            <option value="">Все студенты</option>
                            {studentOptions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.first_name} {s.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            name="schedule_id"
                            value={filters.schedule_id}
                            onChange={handleFilterChange}
                        >
                            <option value="">Все расписания</option>
                            {scheduleOptions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {`Класс: ${s.class_id}, День: ${s.day_of_week}, Урок: ${s.lesson_number}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="">Все статусы</option>
                            {allowedStatuses.map(st => (
                                <option key={st.value} value={st.value}>
                                    {st.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <input
                            type="date"
                            className="form-control"
                            name="start_date"
                            value={filters.start_date}
                            onChange={handleFilterChange}
                            placeholder="Начало"
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="date"
                            className="form-control"
                            name="end_date"
                            value={filters.end_date}
                            onChange={handleFilterChange}
                            placeholder="Конец"
                        />
                    </div>
                </div>
            </div>

            {/* Кнопки экспорта и создания */}
            <div className="mb-3 d-flex justify-content-between">
                <div>
                    <button className="btn btn-success me-2" onClick={handleExportExcel}>
                        Экспорт в Excel
                    </button>
                    <button className="btn btn-info me-2" onClick={handleExportDocx}>
                        Экспорт в DOCX
                    </button>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    Создать новую запись
                </button>
            </div>

            {/* Таблица записей посещаемости */}
            {listError && <div className="alert alert-danger">{listError}</div>}
            {attendances.length === 0 ? (
                <p>Записи посещаемости отсутствуют.</p>
            ) : (
                <table className="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Студент</th>
                            <th>Расписание</th>
                            <th>Дата</th>
                            <th>Статус</th>
                            <th>Примечания</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendances.map(a => (
                            <tr key={a.id}>
                                <td>{a.id}</td>
                                <td>{a.Student ? `${a.Student.first_name} ${a.Student.last_name}` : a.student_id}</td>
                                <td>{a.Schedule ? getScheduleInfo(a) : a.schedule_id}</td>
                                <td>{a.date}</td>
                                <td>{a.status}</td>
                                <td>{a.remarks}</td>
                                <td>
                                    <button className="btn btn-sm btn-info me-1" onClick={() => handleViewDetails(a.id)}>
                                        Детали
                                    </button>
                                    <button className="btn btn-sm btn-warning me-1" onClick={() => handleEditClick(a)}>
                                        Редактировать
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Пагинация */}
            <div className="d-flex justify-content-center align-items-center my-3">
                <button className="btn btn-outline-secondary me-2" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                    Предыдущая
                </button>
                <span>Страница {page} из {totalPages}</span>
                <button className="btn btn-outline-secondary ms-2" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                    Следующая
                </button>
            </div>

            {/* Модальное окно для создания записи посещаемости */}
            {showCreateModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleCreateSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Создание новой записи посещаемости</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {notification && <div className="alert alert-success">{notification}</div>}
                                    <div className="mb-3">
                                        <label htmlFor="student_id_create" className="form-label">Студент</label>
                                        <select
                                            className="form-select"
                                            id="student_id_create"
                                            name="student_id"
                                            value={form.student_id}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите студента</option>
                                            {studentOptions.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.first_name} {s.last_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="schedule_id_create" className="form-label">Расписание</label>
                                        <select
                                            className="form-select"
                                            id="schedule_id_create"
                                            name="schedule_id"
                                            value={form.schedule_id}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите расписание</option>
                                            {scheduleOptions.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {`Класс: ${s.class_id}, День: ${s.day_of_week}, Урок: ${s.lesson_number}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="date_create" className="form-label">Дата</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="date_create"
                                            name="date"
                                            value={form.date}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="status_create" className="form-label">Статус</label>
                                        <select
                                            className="form-select"
                                            id="status_create"
                                            name="status"
                                            value={form.status}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите статус</option>
                                            {allowedStatuses.map(st => (
                                                <option key={st.value} value={st.value}>
                                                    {st.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="remarks_create" className="form-label">Примечания</label>
                                        <textarea
                                            className="form-control"
                                            id="remarks_create"
                                            name="remarks"
                                            value={form.remarks}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    {/* Здесь можно добавить блоки для выбора участников, если требуется */}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                                        Отмена
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Создать
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно для редактирования записи посещаемости */}
            {showEditModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Редактирование записи (ID: {form.id})</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {notification && <div className="alert alert-success">{notification}</div>}
                                    <div className="mb-3">
                                        <label htmlFor="student_id_edit" className="form-label">Студент</label>
                                        <select
                                            className="form-select"
                                            id="student_id_edit"
                                            name="student_id"
                                            value={form.student_id}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите студента</option>
                                            {studentOptions.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.first_name} {s.last_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="schedule_id_edit" className="form-label">Расписание</label>
                                        <select
                                            className="form-select"
                                            id="schedule_id_edit"
                                            name="schedule_id"
                                            value={form.schedule_id}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите расписание</option>
                                            {scheduleOptions.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {`Класс: ${s.class_id}, День: ${s.day_of_week}, Урок: ${s.lesson_number}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="date_edit" className="form-label">Дата</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="date_edit"
                                            name="date"
                                            value={form.date}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="status_edit" className="form-label">Статус</label>
                                        <select
                                            className="form-select"
                                            id="status_edit"
                                            name="status"
                                            value={form.status}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите статус</option>
                                            {allowedStatuses.map(st => (
                                                <option key={st.value} value={st.value}>
                                                    {st.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="remarks_edit" className="form-label">Примечания</label>
                                        <textarea
                                            className="form-control"
                                            id="remarks_edit"
                                            name="remarks"
                                            value={form.remarks}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                        Отмена
                                    </button>
                                    <button type="submit" className="btn btn-success">
                                        Сохранить изменения
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно для просмотра деталей записи посещаемости */}
            {showDetailsModal && attendanceDetails && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Детали записи (ID: {attendanceDetails.id})</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    <strong>Студент:</strong>{" "}
                                    {attendanceDetails.Student ? `${attendanceDetails.Student.first_name} ${attendanceDetails.Student.last_name}` : attendanceDetails.student_id}
                                </p>
                                <p>
                                    <strong>Расписание:</strong>{" "}
                                    {attendanceDetails.Schedule
                                        ? // Вместо вывода id класса выводим название класса из списка классов
                                        (() => {
                                            const classObj = classOptions.find(c => c.id.toString() === attendanceDetails.Schedule.class_id.toString());
                                            const className = classObj ? classObj.name : attendanceDetails.Schedule.class_id;
                                            return `${className}, День: ${attendanceDetails.Schedule.day_of_week}, Урок: ${attendanceDetails.Schedule.lesson_number}, Аудитория: ${attendanceDetails.Schedule.classroom}`;
                                        })()
                                        : attendanceDetails.schedule_id}
                                </p>
                                <p><strong>Дата:</strong> {attendanceDetails.date}</p>
                                <p><strong>Статус:</strong> {attendanceDetails.status}</p>
                                <p><strong>Примечания:</strong> {attendanceDetails.remarks || '-'}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManageAttendance;
