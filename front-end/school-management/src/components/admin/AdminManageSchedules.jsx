import React, { useState, useEffect } from 'react';
import axios from '../../redux/axios';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import 'bootstrap/dist/css/bootstrap.min.css';

const dayOptions = [
    { value: '1', label: 'Понедельник' },
    { value: '2', label: 'Вторник' },
    { value: '3', label: 'Среда' },
    { value: '4', label: 'Четверг' },
    { value: '5', label: 'Пятница' },
    { value: '6', label: 'Суббота' },
    { value: '7', label: 'Воскресенье' },
];

const AdminManageSchedules = () => {
    // Состояния для списка расписаний и пагинации
    const [schedules, setSchedules] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [listError, setListError] = useState(null);

    // Состояния для фильтрации (по основным полям)
    const [filters, setFilters] = useState({
        class_id: '',
        teacher_id: '',
        day_of_week: '',
    });

    // Состояния для модальных окон
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Состояния для формы создания/редактирования расписания
    const [form, setForm] = useState({
        id: null,
        class_id: '',
        teacher_id: '',
        day_of_week: '',
        lesson_number: '',
        classroom: '',
    });
    const [notification, setNotification] = useState(null);

    // Состояние для просмотра деталей расписания
    const [scheduleDetails, setScheduleDetails] = useState(null);

    // Состояния для списков классов и учителей (для выпадающих списков)
    const [classOptions, setClassOptions] = useState([]);
    const [teacherOptions, setTeacherOptions] = useState([]);

    // Функция для загрузки расписаний с пагинацией и фильтрами
    const fetchSchedules = async () => {
        try {
            const params = {
                page,
                limit,
                ...filters,
            };
            const response = await axios.get('/schedules', { params });
            const data = response.data;
            setSchedules(Array.isArray(data.data) ? data.data : []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setListError(err.response?.data?.message || err.message);
        }
    };

    // Функция для загрузки списка классов для выпадающего списка
    const fetchClassOptions = async () => {
        try {
            const { data } = await axios.get('/classes');
            const classesArray = data.data || data;
            setClassOptions(Array.isArray(classesArray) ? classesArray : []);
        } catch (err) {
            console.error('Ошибка при загрузке классов:', err.response?.data?.message || err.message);
        }
    };

    // Функция для загрузки списка учителей для выпадающего списка
    const fetchTeacherOptions = async () => {
        try {
            const { data } = await axios.get('/teachers');
            const teachersArray = data.teachers || data;
            setTeacherOptions(Array.isArray(teachersArray) ? teachersArray : []);
        } catch (err) {
            console.error('Ошибка при загрузке учителей:', err.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        fetchSchedules();
        fetchClassOptions();
        fetchTeacherOptions();
    }, [page, limit, filters]);

    // Обработчики для изменения фильтров
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // Обработчик изменения полей формы создания/редактирования
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Создание новой записи расписания
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/schedules', form);
            setNotification('Расписание успешно создано');
            fetchSchedules();
            setTimeout(() => {
                setNotification(null);
                setShowCreateModal(false);
                setForm({ id: null, class_id: '', teacher_id: '', day_of_week: '', lesson_number: '', classroom: '' });
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Редактирование записи расписания
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.put(`/schedules/${form.id}`, form);
            setNotification('Данные расписания успешно обновлены');
            fetchSchedules();
            setTimeout(() => {
                setNotification(null);
                setShowEditModal(false);
                setForm({ id: null, class_id: '', teacher_id: '', day_of_week: '', lesson_number: '', classroom: '' });
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Удаление записи расписания
    const handleDelete = async (id) => {
        if (!window.confirm('Вы действительно хотите удалить это расписание?')) return;
        try {
            const { data } = await axios.delete(`/schedules/${id}`);
            alert(data.message);
            fetchSchedules();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Просмотр деталей расписания
    const handleViewDetails = async (id) => {
        try {
            const { data } = await axios.get(`/schedules/${id}`);
            setScheduleDetails(data);
            setShowDetailsModal(true);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Открыть модальное окно редактирования с данными выбранной записи
    const handleEditClick = (schedule) => {
        setForm({
            id: schedule.id,
            class_id: schedule.class_id,
            teacher_id: schedule.teacher_id,
            day_of_week: schedule.day_of_week,
            lesson_number: schedule.lesson_number,
            classroom: schedule.classroom,
        });
        setShowEditModal(true);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    // Экспорт в Excel
    const handleExportExcel = () => {
        const exportData = schedules.map((sch) => ({
            ID: sch.id,
            Класс: (() => {
                const cls = classOptions.find((c) => c.id === sch.class_id);
                return cls ? cls.name : sch.class_id;
            })(),
            'Классный руководитель': (() => {
                const teacher = teacherOptions.find((t) => t.id === sch.teacher_id);
                return teacher ? `${teacher.first_name} ${teacher.last_name}` : sch.teacher_id;
            })(),
            'День недели': dayOptions.find((d) => d.value === sch.day_of_week)?.label || sch.day_of_week,
            'Номер урока': sch.lesson_number,
            Аудитория: sch.classroom,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Schedules");
        XLSX.writeFile(workbook, "schedules_report.xlsx");
    };

    // Экспорт в DOCX
    const handleExportDocx = async () => {
        const paragraphs = schedules.map((sch, index) => {
            const cls = classOptions.find((c) => c.id === sch.class_id);
            const teacher = teacherOptions.find((t) => t.id === sch.teacher_id);
            return new Paragraph({
                children: [
                    new TextRun({ text: `${index + 1}. Класс: ${cls ? cls.name : sch.class_id}`, bold: true }),
                    new TextRun({ text: ` | Классный руководитель: ${teacher ? `${teacher.first_name} ${teacher.last_name}` : sch.teacher_id}` }),
                    new TextRun({ text: ` | День недели: ${dayOptions.find((d) => d.value === sch.day_of_week)?.label || sch.day_of_week}` }),
                    new TextRun({ text: ` | Номер урока: ${sch.lesson_number}` }),
                    new TextRun({ text: ` | Аудитория: ${sch.classroom}` }),
                ],
            });
        });
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: "Отчёт по расписанию",
                        heading: "Heading1",
                    }),
                    ...paragraphs,
                ],
            }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, "schedules_report.docx");
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Управление расписанием</h2>

            {/* Панель поиска и фильтрации */}
            <div className="mb-4">
                <div className="row g-2">
                    <div className="col-md-4">
                        <select
                            className="form-select"
                            name="class_id"
                            value={filters.class_id}
                            onChange={handleFilterChange}
                        >
                            <option value="">Все классы</option>
                            {classOptions.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-4">
                        <select
                            className="form-select"
                            name="teacher_id"
                            value={filters.teacher_id}
                            onChange={handleFilterChange}
                        >
                            <option value="">Все учителя</option>
                            {teacherOptions.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.first_name} {t.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-4">
                        <select
                            className="form-select"
                            name="day_of_week"
                            value={filters.day_of_week}
                            onChange={handleFilterChange}
                        >
                            <option value="">Все дни</option>
                            {dayOptions.map((day) => (
                                <option key={day.value} value={day.value}>
                                    {day.label}
                                </option>
                            ))}
                        </select>
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

            {/* Таблица расписаний */}
            {listError && <div className="alert alert-danger">{listError}</div>}
            {schedules.length === 0 ? (
                <p>Расписания отсутствуют.</p>
            ) : (
                <table className="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Класс</th>
                            <th>Классный руководитель</th>
                            <th>День недели</th>
                            <th>Номер урока</th>
                            <th>Аудитория</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedules.map((sch) => {
                            const cls = classOptions.find((c) => c.id === sch.class_id);
                            const teacher = teacherOptions.find((t) => t.id === sch.teacher_id);
                            const dayLabel = dayOptions.find((d) => d.value === sch.day_of_week)?.label || sch.day_of_week;
                            return (
                                <tr key={sch.id}>
                                    <td>{sch.id}</td>
                                    <td>{cls ? cls.name : sch.class_id}</td>
                                    <td>{teacher ? `${teacher.first_name} ${teacher.last_name}` : sch.teacher_id}</td>
                                    <td>{dayLabel}</td>
                                    <td>{sch.lesson_number}</td>
                                    <td>{sch.classroom}</td>
                                    <td>
                                        <button className="btn btn-sm btn-info me-1" onClick={() => handleViewDetails(sch.id)}>
                                            Детали
                                        </button>
                                        <button className="btn btn-sm btn-warning me-1" onClick={() => handleEditClick(sch)}>
                                            Редактировать
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(sch.id)}>
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
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

            {/* Модальное окно для создания записи расписания */}
            {showCreateModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleCreateSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Создание новой записи расписания</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {notification && <div className="alert alert-success">{notification}</div>}
                                    <div className="mb-3">
                                        <label htmlFor="class_id_create" className="form-label">Класс</label>
                                        <select
                                            className="form-select"
                                            id="class_id_create"
                                            name="class_id"
                                            value={form.class_id}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите класс</option>
                                            {classOptions.map((cls) => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="teacher_id_create" className="form-label">Классный руководитель</label>
                                        <select
                                            className="form-select"
                                            id="teacher_id_create"
                                            name="teacher_id"
                                            value={form.teacher_id}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите учителя</option>
                                            {teacherOptions.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.first_name} {t.last_name} ({t.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="day_of_week" className="form-label">День недели</label>
                                        <select
                                            className="form-select"
                                            id="day_of_week"
                                            name="day_of_week"
                                            value={form.day_of_week}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите день</option>
                                            {dayOptions.map((day) => (
                                                <option key={day.value} value={day.value}>
                                                    {day.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="lesson_number" className="form-label">Номер урока</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="lesson_number"
                                            name="lesson_number"
                                            value={form.lesson_number}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="classroom" className="form-label">Аудитория</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="classroom"
                                            name="classroom"
                                            value={form.classroom}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
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

            {/* Модальное окно для редактирования записи расписания */}
            {showEditModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Редактирование записи расписания (ID: {form.id})</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {notification && <div className="alert alert-success">{notification}</div>}
                                    <div className="mb-3">
                                        <label htmlFor="class_id_edit" className="form-label">Класс</label>
                                        <select
                                            className="form-select"
                                            id="class_id_edit"
                                            name="class_id"
                                            value={form.class_id}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите класс</option>
                                            {classOptions.map((cls) => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="teacher_id_edit" className="form-label">Классный руководитель</label>
                                        <select
                                            className="form-select"
                                            id="teacher_id_edit"
                                            name="teacher_id"
                                            value={form.teacher_id}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите учителя</option>
                                            {teacherOptions.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.first_name} {t.last_name} ({t.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="day_of_week_edit" className="form-label">День недели</label>
                                        <select
                                            className="form-select"
                                            id="day_of_week_edit"
                                            name="day_of_week"
                                            value={form.day_of_week}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите день</option>
                                            {dayOptions.map((day) => (
                                                <option key={day.value} value={day.value}>
                                                    {day.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="lesson_number_edit" className="form-label">Номер урока</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="lesson_number_edit"
                                            name="lesson_number"
                                            value={form.lesson_number}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="classroom_edit" className="form-label">Аудитория</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="classroom_edit"
                                            name="classroom"
                                            value={form.classroom}
                                            onChange={handleFormChange}
                                            required
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

            {/* Модальное окно для просмотра деталей расписания */}
            {showDetailsModal && scheduleDetails && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Детали расписания (ID: {scheduleDetails.id})</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    <strong>Класс:</strong>{" "}
                                    {classOptions.find((cls) => cls.id === scheduleDetails.class_id)?.name || scheduleDetails.class_id}
                                </p>
                                <p>
                                    <strong>Учитель:</strong>{" "}
                                    {teacherOptions.find((t) => t.id === scheduleDetails.teacher_id)
                                        ? `${teacherOptions.find((t) => t.id === scheduleDetails.teacher_id).first_name} ${teacherOptions.find((t) => t.id === scheduleDetails.teacher_id).last_name}`
                                        : scheduleDetails.teacher_id}
                                </p>
                                <p>
                                    <strong>День недели:</strong>{" "}
                                    {dayOptions.find((d) => d.value === scheduleDetails.day_of_week)?.label || scheduleDetails.day_of_week}
                                </p>
                                <p><strong>Номер урока:</strong> {scheduleDetails.lesson_number}</p>
                                <p><strong>Аудитория:</strong> {scheduleDetails.classroom}</p>
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

export default AdminManageSchedules;
