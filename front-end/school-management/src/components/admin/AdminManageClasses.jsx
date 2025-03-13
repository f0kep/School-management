import React, { useState, useEffect } from 'react';
import axios from '../../redux/axios';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminManageClasses = () => {
    // Состояния для списка классов и пагинации
    const [classes, setClasses] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [listError, setListError] = useState(null);

    // Состояния для фильтрации
    const [filters, setFilters] = useState({
        academic_year: '',
        name: '',
    });

    // Состояния для модальных окон
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Состояния для формы создания/редактирования
    const [form, setForm] = useState({
        id: null,
        name: '',
        class_teacher_id: '',
        academic_year: '',
    });
    const [notification, setNotification] = useState(null);

    // Состояние для деталей класса (просмотр)
    const [classDetails, setClassDetails] = useState(null);

    // Состояние для списка учителей (для выпадающего списка)
    const [teacherOptions, setTeacherOptions] = useState([]);

    // Функция для загрузки классов с пагинацией и фильтрацией
    const fetchClasses = async () => {
        try {
            const params = {
                page,
                limit,
                academic_year: filters.academic_year || undefined,
                name: filters.name || undefined,
            };
            const { data } = await axios.get('/classes', { params });
            setClasses(data.data);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            setListError(err.response?.data?.message || err.message);
        }
    };

    // Функция для загрузки списка учителей (для выпадающего списка)
    const fetchTeacherOptions = async () => {
        try {
            const { data } = await axios.get('/teachers/');
            // Предполагается, что данные либо в data.teachers, либо в data
            setTeacherOptions(data.teachers || data);
        } catch (err) {
            console.error('Ошибка при загрузке учителей:', err.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchTeacherOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Создание нового класса
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/classes', form);
            setNotification('Класс успешно создан');
            // Обновляем список
            fetchClasses();
            setTimeout(() => {
                setNotification(null);
                setShowCreateModal(false);
                setForm({ id: null, name: '', class_teacher_id: '', academic_year: '' });
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Редактирование класса
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.put(`/classes/${form.id}`, form);
            setNotification('Данные класса успешно обновлены');
            fetchClasses();
            setTimeout(() => {
                setNotification(null);
                setShowEditModal(false);
                setForm({ id: null, name: '', class_teacher_id: '', academic_year: '' });
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Удаление класса
    const handleDelete = async (id) => {
        if (!window.confirm('Вы действительно хотите удалить этот класс?')) return;
        try {
            const { data } = await axios.delete(`/classes/${id}`);
            alert(data.message);
            fetchClasses();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Просмотр деталей класса
    const handleViewDetails = async (id) => {
        try {
            const { data } = await axios.get(`/classes/${id}`);
            setClassDetails(data);
            setShowDetailsModal(true);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Открыть модальное окно редактирования с данными выбранного класса
    const handleEditClick = (cls) => {
        setForm({
            id: cls.id,
            name: cls.name,
            class_teacher_id: cls.class_teacher_id,
            academic_year: cls.academic_year,
        });
        setShowEditModal(true);
    };

    // Функции для смены страниц
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    // Экспорт в Excel (с использованием SheetJS)
    const handleExportExcel = () => {
        const exportData = classes.map((cls) => ({
            ID: cls.id,
            Название: cls.name,
            'Классный руководитель': cls.ClassTeacher
                ? `${cls.ClassTeacher.first_name} ${cls.ClassTeacher.last_name}`
                : '-',
            'Академический год': cls.academic_year,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Classes");
        XLSX.writeFile(workbook, "classes_report.xlsx");
    };

    // Экспорт в DOCX (с использованием docx)
    const handleExportDocx = async () => {
        const paragraphs = classes.map((cls, index) => {
            const teacherInfo = cls.ClassTeacher
                ? `${cls.ClassTeacher.first_name} ${cls.ClassTeacher.last_name} (${cls.ClassTeacher.email})`
                : '-';
            return new Paragraph({
                children: [
                    new TextRun({ text: `${index + 1}. ${cls.name}`, bold: true }),
                    new TextRun({ text: ` | Классный руководитель: ${teacherInfo}` }),
                    new TextRun({ text: ` | Академический год: ${cls.academic_year}` }),
                ],
            });
        });
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: "Отчёт по классам",
                        heading: "Heading1",
                    }),
                    ...paragraphs,
                ],
            }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, "classes_report.docx");
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Управление классами</h2>

            {/* Панель поиска и фильтрации */}
            <div className="mb-4">
                <div className="row g-2">
                    <div className="col-md-4">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Название класса"
                            name="name"
                            value={filters.name}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col-md-4">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Академический год"
                            name="academic_year"
                            value={filters.academic_year}
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
                    Создать новый класс
                </button>
            </div>

            {/* Таблица классов */}
            {listError && <div className="alert alert-danger">{listError}</div>}
            {classes.length === 0 ? (
                <p>Классы отсутствуют.</p>
            ) : (
                <table className="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Название</th>
                            <th>Классный руководитель</th>
                            <th>Академический год</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.map((cls) => (
                            <tr key={cls.id}>
                                <td>{cls.id}</td>
                                <td>{cls.name}</td>
                                <td>
                                    {cls.ClassTeacher
                                        ? `${cls.ClassTeacher.first_name} ${cls.ClassTeacher.last_name}`
                                        : '-'}
                                </td>
                                <td>{cls.academic_year}</td>
                                <td>
                                    <button className="btn btn-sm btn-info me-1" onClick={() => handleViewDetails(cls.id)}>
                                        Детали
                                    </button>
                                    <button className="btn btn-sm btn-warning me-1" onClick={() => handleEditClick(cls)}>
                                        Редактировать
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cls.id)}>
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

            {/* Модальное окно для создания класса */}
            {showCreateModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleCreateSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Создание нового класса</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {notification && <div className="alert alert-success">{notification}</div>}
                                    <div className="mb-3">
                                        <label htmlFor="class_name" className="form-label">Название</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="class_name"
                                            name="name"
                                            value={form.name}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    {/* Выпадающий список для выбора классного руководителя */}
                                    <div className="mb-3">
                                        <label htmlFor="class_teacher_id" className="form-label">Классный руководитель</label>
                                        <select
                                            className="form-select"
                                            id="class_teacher_id"
                                            name="class_teacher_id"
                                            value={form.class_teacher_id}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите учителя</option>
                                            {teacherOptions.map((teacher) => (
                                                <option key={teacher.id} value={teacher.id}>
                                                    {teacher.first_name} {teacher.last_name} ({teacher.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="academic_year" className="form-label">Академический год</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="academic_year"
                                            name="academic_year"
                                            value={form.academic_year}
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

            {/* Модальное окно для редактирования класса */}
            {showEditModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Редактирование класса (ID: {form.id})</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {notification && <div className="alert alert-success">{notification}</div>}
                                    <div className="mb-3">
                                        <label htmlFor="edit_class_name" className="form-label">Название</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="edit_class_name"
                                            name="name"
                                            value={form.name}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    {/* Выпадающий список для выбора классного руководителя */}
                                    <div className="mb-3">
                                        <label htmlFor="edit_class_teacher_id" className="form-label">Классный руководитель</label>
                                        <select
                                            className="form-select"
                                            id="edit_class_teacher_id"
                                            name="class_teacher_id"
                                            value={form.class_teacher_id}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Выберите учителя</option>
                                            {teacherOptions.map((teacher) => (
                                                <option key={teacher.id} value={teacher.id}>
                                                    {teacher.first_name} {teacher.last_name} ({teacher.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit_academic_year" className="form-label">Академический год</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="edit_academic_year"
                                            name="academic_year"
                                            value={form.academic_year}
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

            {/* Модальное окно для просмотра деталей класса */}
            {showDetailsModal && classDetails && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Детали класса (ID: {classDetails.id})</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p><strong>Название:</strong> {classDetails.name}</p>
                                <p>
                                    <strong>Классный руководитель:</strong>{' '}
                                    {classDetails.ClassTeacher
                                        ? `${classDetails.ClassTeacher.first_name} ${classDetails.ClassTeacher.last_name} (${classDetails.ClassTeacher.email})`
                                        : 'Не назначен'}
                                </p>
                                <p><strong>Академический год:</strong> {classDetails.academic_year}</p>
                                <hr />
                                <h6>Ученики:</h6>
                                {classDetails.Students && classDetails.Students.length > 0 ? (
                                    <table className="table table-bordered table-sm">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Имя</th>
                                                <th>Фамилия</th>
                                                <th>Email</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classDetails.Students.map((student) => (
                                                <tr key={student.id}>
                                                    <td>{student.id}</td>
                                                    <td>{student.first_name}</td>
                                                    <td>{student.last_name}</td>
                                                    <td>{student.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p>Ученики отсутствуют.</p>
                                )}
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

export default AdminManageClasses;