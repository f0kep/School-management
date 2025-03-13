import React, { useState, useEffect } from 'react';
import axios from '../../redux/axios';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminManageGrades = () => {
    // Состояния для списка оценок и пагинации
    const [grades, setGrades] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [listError, setListError] = useState(null);

    // Фильтры: по студенту, учителю, диапазону дат
    const [filters, setFilters] = useState({
        student_id: '',
        teacher_id: '',
        start_date: '',
        end_date: '',
    });

    // Состояния для модальных окон
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Форма для создания/редактирования оценки
    const [form, setForm] = useState({
        id: null,
        student_id: '',
        teacher_id: '',
        grade_value: '',
        date: '',
    });
    const [notification, setNotification] = useState(null);

    // Состояние для просмотра деталей оценки
    const [gradeDetails, setGradeDetails] = useState(null);

    // Списки для выпадающих списков
    const [studentOptions, setStudentOptions] = useState([]);
    const [teacherOptions, setTeacherOptions] = useState([]);

    // Функция для загрузки оценок с пагинацией и фильтрами
    const fetchGrades = async () => {
        try {
            const params = { page, limit, ...filters };
            const response = await axios.get('/grades', { params });
            const data = response.data;
            setGrades(Array.isArray(data.data) ? data.data : []);
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
            const studentsArray = data.data || data.students || data;
            setStudentOptions(Array.isArray(studentsArray) ? studentsArray : []);
        } catch (err) {
            console.error('Ошибка при загрузке студентов:', err.response?.data?.message || err.message);
        }
    };

    // Загрузка списка учителей
    const fetchTeacherOptions = async () => {
        try {
            const { data } = await axios.get('/teachers');
            const teachersArray = data.data || data.teachers || data;
            setTeacherOptions(Array.isArray(teachersArray) ? teachersArray : []);
        } catch (err) {
            console.error('Ошибка при загрузке учителей:', err.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        fetchGrades();
        fetchStudentOptions();
        fetchTeacherOptions();
    }, [page, limit, filters]);

    // Обработчик для изменения фильтров
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Обработчик для изменения полей формы
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // Создание оценки
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/grades', form);
            setNotification('Оценка успешно создана');
            fetchGrades();
            setTimeout(() => {
                setNotification(null);
                setShowCreateModal(false);
                setForm({ id: null, student_id: '', teacher_id: '', grade_value: '', date: '' });
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Редактирование оценки
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`/grades/${form.id}`, form);
            setNotification('Оценка успешно обновлена');
            fetchGrades();
            setTimeout(() => {
                setNotification(null);
                setShowEditModal(false);
                setForm({ id: null, student_id: '', teacher_id: '', grade_value: '', date: '' });
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Удаление оценки
    const handleDelete = async (id) => {
        if (!window.confirm('Вы действительно хотите удалить эту оценку?')) return;
        try {
            const response = await axios.delete(`/grades/${id}`);
            alert(response.data.message);
            fetchGrades();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Просмотр деталей оценки
    const handleViewDetails = async (id) => {
        try {
            const response = await axios.get(`/grades/${id}`);
            setGradeDetails(response.data);
            setShowDetailsModal(true);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Открыть модальное окно редактирования и заполнить форму
    const handleEditClick = (grade) => {
        setForm({
            id: grade.id,
            student_id: grade.student_id,
            teacher_id: grade.teacher_id,
            grade_value: grade.grade_value,
            date: grade.date ? grade.date.substring(0, 10) : '',
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
        const exportData = grades.map(g => ({
            ID: g.id,
            Студент: (() => {
                const student = studentOptions.find(s => s.id === g.student_id);
                return student ? `${student.first_name} ${student.last_name}` : g.student_id;
            })(),
            Учитель: (() => {
                const teacher = teacherOptions.find(t => t.id === g.teacher_id);
                return teacher
                    ? `${teacher.first_name} ${teacher.last_name} (${teacher.subject || '-'})`
                    : g.teacher_id;
            })(),
            Оценка: g.grade_value,
            Дата: g.date,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");
        XLSX.writeFile(workbook, "grades_report.xlsx");
    };

    // Экспорт в DOCX
    const handleExportDocx = async () => {
        const paragraphs = grades.map((g, index) => {
            const student = studentOptions.find(s => s.id === g.student_id);
            const teacher = teacherOptions.find(t => t.id === g.teacher_id);
            return new Paragraph({
                children: [
                    new TextRun({ text: `${index + 1}. Студент: ${student ? `${student.first_name} ${student.last_name}` : g.student_id}`, bold: true }),
                    new TextRun({ text: ` | Учитель: ${teacher ? `${teacher.first_name} ${teacher.last_name} (${teacher.subject || '-'})` : g.teacher_id}` }),
                    new TextRun({ text: ` | Оценка: ${g.grade_value}` }),
                    new TextRun({ text: ` | Дата: ${g.date}` }),
                ],
            });
        });
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: "Отчёт по оценкам",
                        heading: "Heading1",
                    }),
                    ...paragraphs,
                ],
            }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, "grades_report.docx");
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Управление оценками</h2>

            {/* Панель поиска и фильтрации */}
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
                            name="teacher_id"
                            value={filters.teacher_id}
                            onChange={handleFilterChange}
                        >
                            <option value="">Все учителя</option>
                            {teacherOptions.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.first_name} {t.last_name}
                                </option>
                            ))}
                        </select>
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
                    Создать новую оценку
                </button>
            </div>

            {/* Таблица оценок */}
            {listError && <div className="alert alert-danger">{listError}</div>}
            {grades.length === 0 ? (
                <p>Оценки отсутствуют.</p>
            ) : (
                <table className="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Студент</th>
                            <th>Учитель</th>
                            <th>Оценка</th>
                            <th>Дата</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grades.map((grade) => {
                            const student = studentOptions.find(s => s.id === grade.student_id);
                            const teacher = teacherOptions.find(t => t.id === grade.teacher_id);
                            return (
                                <tr key={grade.id}>
                                    <td>{grade.id}</td>
                                    <td>{student ? `${student.first_name} ${student.last_name}` : grade.student_id}</td>
                                    <td>
                                        {teacher
                                            ? `${teacher.first_name} ${teacher.last_name} (${teacher.subject || '-'})`
                                            : grade.teacher_id}
                                    </td>
                                    <td>{grade.grade_value}</td>
                                    <td>{grade.date}</td>
                                    <td>
                                        <button className="btn btn-sm btn-info me-1" onClick={() => handleViewDetails(grade.id)}>
                                            Детали
                                        </button>
                                        <button className="btn btn-sm btn-warning me-1" onClick={() => handleEditClick(grade)}>
                                            Редактировать
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(grade.id)}>
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

            {/* Модальное окно для создания оценки */}
            {showCreateModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleCreateSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Создание новой оценки</h5>
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
                                            {studentOptions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.first_name} {s.last_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="teacher_id_create" className="form-label">Учитель</label>
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
                                                    {t.first_name} {t.last_name} ({t.subject || '-'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="grade_value_create" className="form-label">Оценка</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="grade_value_create"
                                            name="grade_value"
                                            value={form.grade_value}
                                            onChange={handleFormChange}
                                            required
                                        />
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

            {/* Модальное окно для редактирования оценки */}
            {showEditModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Редактирование оценки (ID: {form.id})</h5>
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
                                            {studentOptions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.first_name} {s.last_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="teacher_id_edit" className="form-label">Учитель</label>
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
                                                    {t.first_name} {t.last_name} ({t.subject || '-'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="grade_value_edit" className="form-label">Оценка</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="grade_value_edit"
                                            name="grade_value"
                                            value={form.grade_value}
                                            onChange={handleFormChange}
                                            required
                                        />
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

            {/* Модальное окно для просмотра деталей оценки */}
            {showDetailsModal && gradeDetails && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Детали оценки (ID: {gradeDetails.id})</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    <strong>Студент:</strong>{" "}
                                    {studentOptions.find(s => s.id === gradeDetails.student_id)
                                        ? `${studentOptions.find(s => s.id === gradeDetails.student_id).first_name} ${studentOptions.find(s => s.id === gradeDetails.student_id).last_name}`
                                        : gradeDetails.student_id}
                                </p>
                                <p>
                                    <strong>Учитель:</strong>{" "}
                                    {teacherOptions.find(t => t.id === gradeDetails.teacher_id)
                                        ? `${teacherOptions.find(t => t.id === gradeDetails.teacher_id).first_name} ${teacherOptions.find(t => t.id === gradeDetails.teacher_id).last_name} (${teacherOptions.find(t => t.id === gradeDetails.teacher_id).subject || '-'})`
                                        : gradeDetails.teacher_id}
                                </p>
                                <p><strong>Оценка:</strong> {gradeDetails.grade_value}</p>
                                <p><strong>Дата:</strong> {gradeDetails.date}</p>
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

export default AdminManageGrades;
