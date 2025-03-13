import React, { useState, useEffect } from 'react';
import axios from '../../redux/axios';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import 'bootstrap/dist/css/bootstrap.min.css';

// Опции для выбора типа организатора
const organizerTypeOptions = [
    { value: 'teacher', label: 'Учитель' },
    { value: 'admin', label: 'Админ' },
];

const AdminManageEvents = () => {
    // Основные состояния для списка событий и пагинации
    const [events, setEvents] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [listError, setListError] = useState(null);

    // Фильтры для поиска событий
    const [filters, setFilters] = useState({
        organizer_id: '',
        organizer_type: '',
        start_date: '',
        end_date: '',
        title: '',
    });

    // Состояния модальных окон
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Форма для создания/редактирования события
    const [form, setForm] = useState({
        id: null,
        title: '',
        description: '',
        event_date: '',
        organizer_id: '',
        organizer_type: '',
        studentIds: [],
        teacherIds: [],
    });
    const [notification, setNotification] = useState(null);

    // Состояние для просмотра деталей события
    const [eventDetails, setEventDetails] = useState(null);

    // Списки для выпадающих списков участников
    const [studentOptions, setStudentOptions] = useState([]);
    const [teacherOptions, setTeacherOptions] = useState([]);
    const [adminOptions, setAdminOptions] = useState([]);

    // Состояния для поиска участников в модальных окнах (создание/редактирование)
    const [studentSearch, setStudentSearch] = useState('');
    const [teacherSearch, setTeacherSearch] = useState('');

    // Флаги для раскрытия списка участников (показывать больше 5)
    const [studentsExpanded, setStudentsExpanded] = useState(false);
    const [teachersExpanded, setTeachersExpanded] = useState(false);

    // Выбранные участники (массивы ID)
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);

    // Функция для загрузки событий
    const fetchEvents = async () => {
        try {
            const params = { page, limit, ...filters };
            const response = await axios.get('/events', { params });
            const data = response.data;
            setEvents(Array.isArray(data.data) ? data.data : []);
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

    // Загрузка списка учителей
    const fetchTeacherOptions = async () => {
        try {
            const { data } = await axios.get('/teachers');
            const arr = data.data || data.teachers || data;
            setTeacherOptions(Array.isArray(arr) ? arr : []);
        } catch (err) {
            console.error('Ошибка при загрузке учителей:', err.response?.data?.message || err.message);
        }
    };

    // Загрузка списка администраторов
    const fetchAdminOptions = async () => {
        try {
            const { data } = await axios.get('/admins');
            const arr = data.data || data.admins || data;
            setAdminOptions(Array.isArray(arr) ? arr : []);
        } catch (err) {
            console.error('Ошибка при загрузке администраторов:', err.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchStudentOptions();
        fetchTeacherOptions();
        fetchAdminOptions();
    }, [page, limit, filters]);

    // Обработчик изменения фильтров событий
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Обработчик изменения полей формы события
    const handleFormChange = (e) => {
        const { name, value, multiple, options } = e.target;
        if (multiple) {
            const selected = Array.from(options)
                .filter(option => option.selected)
                .map(option => option.value);
            setForm(prev => ({ ...prev, [name]: selected }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    // Функции для получения первых 5 доступных участников
    const getDisplayedStudents = () => {
        const filtered = studentOptions.filter(s =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase())
        );
        return studentsExpanded ? filtered : filtered.slice(0, 5);
    };

    const getDisplayedTeachers = () => {
        const filtered = teacherOptions.filter(t =>
            `${t.first_name} ${t.last_name}`.toLowerCase().includes(teacherSearch.toLowerCase())
        );
        return teachersExpanded ? filtered : filtered.slice(0, 5);
    };

    // Функция для получения имени организатора по его типу и id
    const getOrganizerName = (ev) => {
        if (ev.organizer_type === 'teacher') {
            const teacher = teacherOptions.find(t => t.id.toString() === ev.organizer_id.toString());
            return teacher ? `${teacher.first_name} ${teacher.last_name}` : ev.organizer_id;
        }
        if (ev.organizer_type === 'admin') {
            const admin = adminOptions.find(a => a.id.toString() === ev.organizer_id.toString());
            return admin ? `${admin.first_name} ${admin.last_name}` : ev.organizer_id;
        }
        return ev.organizer_id;
    };

    // Создание события
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        // Перед отправкой обновляем участников из выбранных списков
        const updatedForm = { ...form, studentIds: selectedStudentIds, teacherIds: selectedTeacherIds };
        try {
            const response = await axios.post('/events', updatedForm);
            setNotification('Событие успешно создано');
            fetchEvents();
            setTimeout(() => {
                setNotification(null);
                setShowCreateModal(false);
                setForm({
                    id: null,
                    title: '',
                    description: '',
                    event_date: '',
                    organizer_id: '',
                    organizer_type: '',
                    studentIds: [],
                    teacherIds: [],
                });
                setSelectedStudentIds([]);
                setSelectedTeacherIds([]);
                setStudentsExpanded(false);
                setTeachersExpanded(false);
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Редактирование события
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const updatedForm = { ...form, studentIds: selectedStudentIds, teacherIds: selectedTeacherIds };
        try {
            const response = await axios.put(`/events/${form.id}`, updatedForm);
            setNotification('Событие успешно обновлено');
            fetchEvents();
            setTimeout(() => {
                setNotification(null);
                setShowEditModal(false);
                setForm({
                    id: null,
                    title: '',
                    description: '',
                    event_date: '',
                    organizer_id: '',
                    organizer_type: '',
                    studentIds: [],
                    teacherIds: [],
                });
                setSelectedStudentIds([]);
                setSelectedTeacherIds([]);
                setStudentsExpanded(false);
                setTeachersExpanded(false);
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Удаление события
    const handleDelete = async (id) => {
        if (!window.confirm('Вы действительно хотите удалить это событие?')) return;
        try {
            const response = await axios.delete(`/events/${id}`);
            alert(response.data.message);
            fetchEvents();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Просмотр деталей события
    const handleViewDetails = async (id) => {
        try {
            const response = await axios.get(`/events/${id}`);
            setEventDetails(response.data);
            setShowDetailsModal(true);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Открытие модального окна редактирования
    const handleEditClick = (ev) => {
        setForm({
            id: ev.id,
            title: ev.title,
            description: ev.description,
            event_date: ev.event_date ? ev.event_date.substring(0, 10) : '',
            organizer_id: ev.organizer_id,
            organizer_type: ev.organizer_type,
            studentIds: ev.Students ? ev.Students.map(s => s.id) : [],
            teacherIds: ev.Teachers ? ev.Teachers.map(t => t.id) : [],
        });
        setSelectedStudentIds(ev.Students ? ev.Students.map(s => s.id) : []);
        setSelectedTeacherIds(ev.Teachers ? ev.Teachers.map(t => t.id) : []);
        setShowEditModal(true);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    // Экспорт в Excel
    const handleExportExcel = () => {
        const exportData = events.map(ev => ({
            ID: ev.id,
            Заголовок: ev.title,
            Описание: ev.description,
            Дата: ev.event_date,
            'Организатор': getOrganizerName(ev),
            'Тип организатора': ev.organizer_type,
            'Студенты': ev.Students ? ev.Students.map(s => `${s.first_name} ${s.last_name}`).join(', ') : '',
            'Учителя': ev.Teachers ? ev.Teachers.map(t => `${t.first_name} ${t.last_name} (${t.subject || '-'})`).join(', ') : '',
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Events");
        XLSX.writeFile(workbook, "events_report.xlsx");
    };

    // Экспорт в DOCX
    const handleExportDocx = async () => {
        const paragraphs = events.map((ev, index) => {
            const studentNames = ev.Students ? ev.Students.map(s => `${s.first_name} ${s.last_name}`).join(', ') : '';
            const teacherNames = ev.Teachers ? ev.Teachers.map(t => `${t.first_name} ${t.last_name} (${t.subject || '-'})`).join(', ') : '';
            return new Paragraph({
                children: [
                    new TextRun({ text: `${index + 1}. ${ev.title}`, bold: true }),
                    new TextRun({ text: ` | Дата: ${ev.event_date}` }),
                    new TextRun({ text: ` | Организатор: ${getOrganizerName(ev)} (${ev.organizer_type})` }),
                    new TextRun({ text: ` | Студенты: ${studentNames}` }),
                    new TextRun({ text: ` | Учителя: ${teacherNames}` }),
                ],
            });
        });
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: "Отчёт по событиям", heading: "Heading1" }),
                    ...paragraphs,
                ],
            }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, "events_report.docx");
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Управление событиями</h2>

            {/* Панель поиска и фильтрации */}
            <div className="mb-4">
                <div className="row g-2">
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            name="organizer_type"
                            value={filters.organizer_type}
                            onChange={handleFilterChange}
                        >
                            <option value="">Все типы организаторов</option>
                            {organizerTypeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Организатор (ID)"
                            name="organizer_id"
                            value={filters.organizer_id}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col-md-3">
                        <input
                            type="date"
                            className="form-control"
                            name="start_date"
                            value={filters.start_date}
                            onChange={handleFilterChange}
                            placeholder="Начало периода"
                        />
                    </div>
                    <div className="col-md-3">
                        <input
                            type="date"
                            className="form-control"
                            name="end_date"
                            value={filters.end_date}
                            onChange={handleFilterChange}
                            placeholder="Конец периода"
                        />
                    </div>
                    <div className="col-md-12 mt-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Заголовок события"
                            name="title"
                            value={filters.title}
                            onChange={handleFilterChange}
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
                    Создать новое событие
                </button>
            </div>

            {/* Таблица событий */}
            {listError && <div className="alert alert-danger">{listError}</div>}
            {events.length === 0 ? (
                <p>События отсутствуют.</p>
            ) : (
                <table className="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Заголовок</th>
                            <th>Дата</th>
                            <th>Организатор</th>
                            <th>Тип</th>
                            <th>Участники</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(ev => {
                            const studentNames = ev.Students ? ev.Students.map(s => `${s.first_name} ${s.last_name}`).join(', ') : '';
                            const teacherNames = ev.Teachers ? ev.Teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ') : '';
                            return (
                                <tr key={ev.id}>
                                    <td>{ev.id}</td>
                                    <td>{ev.title}</td>
                                    <td>{ev.event_date}</td>
                                    <td>{getOrganizerName(ev)}</td>
                                    <td>{ev.organizer_type}</td>
                                    <td>
                                        {studentNames}
                                        {teacherNames && studentNames ? '; ' : ''}
                                        {teacherNames}
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-info me-1" onClick={() => handleViewDetails(ev.id)}>
                                            Детали
                                        </button>
                                        <button className="btn btn-sm btn-warning me-1" onClick={() => handleEditClick(ev)}>
                                            Редактировать
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(ev.id)}>
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

            {/* Модальное окно для создания события */}
            {showCreateModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleCreateSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Создание нового события</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {notification && <div className="alert alert-success">{notification}</div>}
                                    <div className="mb-3">
                                        <label htmlFor="title_create" className="form-label">Заголовок</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="title_create"
                                            name="title"
                                            value={form.title}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="description_create" className="form-label">Описание</label>
                                        <textarea
                                            className="form-control"
                                            id="description_create"
                                            name="description"
                                            value={form.description}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="event_date_create" className="form-label">Дата события</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="event_date_create"
                                            name="event_date"
                                            value={form.event_date}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="organizer_type_create" className="form-label">Тип организатора</label>
                                        <select
                                            className="form-select"
                                            id="organizer_type_create"
                                            name="organizer_type"
                                            value={form.organizer_type}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите тип</option>
                                            {organizerTypeOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {form.organizer_type === 'teacher' ? (
                                        <div className="mb-3">
                                            <label htmlFor="organizer_id_create" className="form-label">Учитель-организатор</label>
                                            <select
                                                className="form-select"
                                                id="organizer_id_create"
                                                name="organizer_id"
                                                value={form.organizer_id}
                                                onChange={handleFormChange}
                                                required
                                            >
                                                <option value="">Выберите учителя</option>
                                                {teacherOptions.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.first_name} {t.last_name} ({t.subject || '-'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : form.organizer_type === 'admin' ? (
                                        <div className="mb-3">
                                            <label htmlFor="organizer_id_create" className="form-label">Админ-организатор</label>
                                            <select
                                                className="form-select"
                                                id="organizer_id_create"
                                                name="organizer_id"
                                                value={form.organizer_id}
                                                onChange={handleFormChange}
                                                required
                                            >
                                                <option value="">Выберите администратора</option>
                                                {adminOptions.map(a => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.first_name} {a.last_name} ({a.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : null}
                                    {/* Блок выбора участников (Студенты) */}
                                    <div className="mb-3">
                                        <label className="form-label">Участники (Студенты)</label>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <h6>Доступные студенты</h6>
                                                <input
                                                    type="text"
                                                    className="form-control mb-2"
                                                    placeholder="Поиск по имени студента"
                                                    value={studentSearch}
                                                    onChange={(e) => setStudentSearch(e.target.value)}
                                                />
                                                <ul className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {studentOptions
                                                        .filter(s =>
                                                            `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase())
                                                        )
                                                        .slice(0, studentsExpanded ? undefined : 5)
                                                        .map(s => (
                                                            <li
                                                                key={s.id}
                                                                className="list-group-item list-group-item-action"
                                                                onDoubleClick={() => {
                                                                    if (!selectedStudentIds.includes(s.id)) {
                                                                        setSelectedStudentIds(prev => [...prev, s.id]);
                                                                    }
                                                                }}
                                                            >
                                                                {s.first_name} {s.last_name}
                                                            </li>
                                                        ))}
                                                </ul>
                                                {studentOptions.filter(s =>
                                                    `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase())
                                                ).length > 5 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-link p-0"
                                                            onClick={() => setStudentsExpanded(!studentsExpanded)}
                                                        >
                                                            {studentsExpanded ? 'Свернуть' : 'Показать больше'}
                                                        </button>
                                                    )}
                                            </div>
                                            <div className="col-md-6">
                                                <h6>Выбранные студенты</h6>
                                                <ul className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {selectedStudentIds.map(id => {
                                                        const student = studentOptions.find(s => s.id === id);
                                                        return (
                                                            <li
                                                                key={id}
                                                                className="list-group-item list-group-item-action"
                                                                onDoubleClick={() => {
                                                                    setSelectedStudentIds(prev => prev.filter(item => item !== id));
                                                                }}
                                                            >
                                                                {student ? `${student.first_name} ${student.last_name}` : id}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Блок выбора участников (Учителя) */}
                                    <div className="mb-3">
                                        <label className="form-label">Участники (Учителя)</label>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <h6>Доступные учителя</h6>
                                                <input
                                                    type="text"
                                                    className="form-control mb-2"
                                                    placeholder="Поиск по имени учителя"
                                                    value={teacherSearch}
                                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                                />
                                                <ul className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {teacherOptions
                                                        .filter(t =>
                                                            `${t.first_name} ${t.last_name}`.toLowerCase().includes(teacherSearch.toLowerCase())
                                                        )
                                                        .slice(0, teachersExpanded ? undefined : 5)
                                                        .map(t => (
                                                            <li
                                                                key={t.id}
                                                                className="list-group-item list-group-item-action"
                                                                onDoubleClick={() => {
                                                                    if (!selectedTeacherIds.includes(t.id)) {
                                                                        setSelectedTeacherIds(prev => [...prev, t.id]);
                                                                    }
                                                                }}
                                                            >
                                                                {t.first_name} {t.last_name} ({t.subject || '-'})
                                                            </li>
                                                        ))}
                                                </ul>
                                                {teacherOptions.filter(t =>
                                                    `${t.first_name} ${t.last_name}`.toLowerCase().includes(teacherSearch.toLowerCase())
                                                ).length > 5 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-link p-0"
                                                            onClick={() => setTeachersExpanded(!teachersExpanded)}
                                                        >
                                                            {teachersExpanded ? 'Свернуть' : 'Показать больше'}
                                                        </button>
                                                    )}
                                            </div>
                                            <div className="col-md-6">
                                                <h6>Выбранные учителя</h6>
                                                <ul className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {selectedTeacherIds.map(id => {
                                                        const teacher = teacherOptions.find(t => t.id === id);
                                                        return (
                                                            <li
                                                                key={id}
                                                                className="list-group-item list-group-item-action"
                                                                onDoubleClick={() => {
                                                                    setSelectedTeacherIds(prev => prev.filter(item => item !== id));
                                                                }}
                                                            >
                                                                {teacher ? `${teacher.first_name} ${teacher.last_name} (${teacher.subject || '-'})` : id}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
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

            {/* Модальное окно для редактирования события */}
            {showEditModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Редактирование события (ID: {form.id})</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {notification && <div className="alert alert-success">{notification}</div>}
                                    <div className="mb-3">
                                        <label htmlFor="title_edit" className="form-label">Заголовок</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="title_edit"
                                            name="title"
                                            value={form.title}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="description_edit" className="form-label">Описание</label>
                                        <textarea
                                            className="form-control"
                                            id="description_edit"
                                            name="description"
                                            value={form.description}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="event_date_edit" className="form-label">Дата события</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="event_date_edit"
                                            name="event_date"
                                            value={form.event_date}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="organizer_type_edit" className="form-label">Тип организатора</label>
                                        <select
                                            className="form-select"
                                            id="organizer_type_edit"
                                            name="organizer_type"
                                            value={form.organizer_type}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите тип</option>
                                            {organizerTypeOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {form.organizer_type === 'teacher' ? (
                                        <div className="mb-3">
                                            <label htmlFor="organizer_id_edit" className="form-label">Учитель-организатор</label>
                                            <select
                                                className="form-select"
                                                id="organizer_id_edit"
                                                name="organizer_id"
                                                value={form.organizer_id}
                                                onChange={handleFormChange}
                                                required
                                            >
                                                <option value="">Выберите учителя</option>
                                                {teacherOptions.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.first_name} {t.last_name} ({t.subject || '-'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : form.organizer_type === 'admin' ? (
                                        <div className="mb-3">
                                            <label htmlFor="organizer_id_edit" className="form-label">Админ-организатор</label>
                                            <select
                                                className="form-select"
                                                id="organizer_id_edit"
                                                name="organizer_id"
                                                value={form.organizer_id}
                                                onChange={handleFormChange}
                                                required
                                            >
                                                <option value="">Выберите администратора</option>
                                                {adminOptions.map(a => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.first_name} {a.last_name} ({a.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : null}
                                    {/* Блок выбора участников (Студенты) для редактирования */}
                                    <div className="mb-3">
                                        <label className="form-label">Участники (Студенты)</label>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <h6>Доступные студенты</h6>
                                                <input
                                                    type="text"
                                                    className="form-control mb-2"
                                                    placeholder="Поиск по имени студента"
                                                    value={studentSearch}
                                                    onChange={(e) => setStudentSearch(e.target.value)}
                                                />
                                                <ul className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {studentOptions
                                                        .filter(s =>
                                                            `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase())
                                                        )
                                                        .slice(0, studentsExpanded ? undefined : 5)
                                                        .map(s => (
                                                            <li
                                                                key={s.id}
                                                                className="list-group-item list-group-item-action"
                                                                onDoubleClick={() => {
                                                                    if (!selectedStudentIds.includes(s.id)) {
                                                                        setSelectedStudentIds(prev => [...prev, s.id]);
                                                                    }
                                                                }}
                                                            >
                                                                {s.first_name} {s.last_name}
                                                            </li>
                                                        ))}
                                                </ul>
                                                {studentOptions.filter(s =>
                                                    `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase())
                                                ).length > 5 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-link p-0"
                                                            onClick={() => setStudentsExpanded(!studentsExpanded)}
                                                        >
                                                            {studentsExpanded ? 'Свернуть' : 'Показать больше'}
                                                        </button>
                                                    )}
                                            </div>
                                            <div className="col-md-6">
                                                <h6>Выбранные студенты</h6>
                                                <ul className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {selectedStudentIds.map(id => {
                                                        const student = studentOptions.find(s => s.id === id);
                                                        return (
                                                            <li
                                                                key={id}
                                                                className="list-group-item list-group-item-action"
                                                                onDoubleClick={() => {
                                                                    setSelectedStudentIds(prev => prev.filter(item => item !== id));
                                                                }}
                                                            >
                                                                {student ? `${student.first_name} ${student.last_name}` : id}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Блок выбора участников (Учителя) для редактирования */}
                                    <div className="mb-3">
                                        <label className="form-label">Участники (Учителя)</label>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <h6>Доступные учителя</h6>
                                                <input
                                                    type="text"
                                                    className="form-control mb-2"
                                                    placeholder="Поиск по имени учителя"
                                                    value={teacherSearch}
                                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                                />
                                                <ul className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {teacherOptions
                                                        .filter(t =>
                                                            `${t.first_name} ${t.last_name}`.toLowerCase().includes(teacherSearch.toLowerCase())
                                                        )
                                                        .slice(0, teachersExpanded ? undefined : 5)
                                                        .map(t => (
                                                            <li
                                                                key={t.id}
                                                                className="list-group-item list-group-item-action"
                                                                onDoubleClick={() => {
                                                                    if (!selectedTeacherIds.includes(t.id)) {
                                                                        setSelectedTeacherIds(prev => [...prev, t.id]);
                                                                    }
                                                                }}
                                                            >
                                                                {t.first_name} {t.last_name} ({t.subject || '-'})
                                                            </li>
                                                        ))}
                                                </ul>
                                                {teacherOptions.filter(t =>
                                                    `${t.first_name} ${t.last_name}`.toLowerCase().includes(teacherSearch.toLowerCase())
                                                ).length > 5 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-link p-0"
                                                            onClick={() => setTeachersExpanded(!teachersExpanded)}
                                                        >
                                                            {teachersExpanded ? 'Свернуть' : 'Показать больше'}
                                                        </button>
                                                    )}
                                            </div>
                                            <div className="col-md-6">
                                                <h6>Выбранные учителя</h6>
                                                <ul className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {selectedTeacherIds.map(id => {
                                                        const teacher = teacherOptions.find(t => t.id === id);
                                                        return (
                                                            <li
                                                                key={id}
                                                                className="list-group-item list-group-item-action"
                                                                onDoubleClick={() => {
                                                                    setSelectedTeacherIds(prev => prev.filter(item => item !== id));
                                                                }}
                                                            >
                                                                {teacher ? `${teacher.first_name} ${teacher.last_name} (${teacher.subject || '-'})` : id}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
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

            {/* Модальное окно для просмотра деталей события */}
            {showDetailsModal && eventDetails && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Детали события (ID: {eventDetails.id})</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p><strong>Заголовок:</strong> {eventDetails.title}</p>
                                <p><strong>Описание:</strong> {eventDetails.description}</p>
                                <p><strong>Дата события:</strong> {eventDetails.event_date}</p>
                                <p><strong>Организатор:</strong> {getOrganizerName(eventDetails)}</p>
                                <p><strong>Тип организатора:</strong> {eventDetails.organizer_type}</p>
                                <p>
                                    <strong>Студенты-участники:</strong>{" "}
                                    {eventDetails.Students && eventDetails.Students.length > 0
                                        ? eventDetails.Students.map(s => `${s.first_name} ${s.last_name}`).join(', ')
                                        : 'Нет'}
                                </p>
                                <p>
                                    <strong>Учителя-участники:</strong>{" "}
                                    {eventDetails.Teachers && eventDetails.Teachers.length > 0
                                        ? eventDetails.Teachers.map(t => `${t.first_name} ${t.last_name} (${t.subject || '-'})`).join(', ')
                                        : 'Нет'}
                                </p>
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

export default AdminManageEvents;
