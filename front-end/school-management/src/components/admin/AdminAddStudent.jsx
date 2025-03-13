import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerStudent, clearError } from '../../redux/slices/studentSlice';
import axios from '../../redux/axios';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminManageStudents = () => {
    const dispatch = useDispatch();
    const { status, error } = useSelector((state) => state.student);

    // Состояние для списка учеников и пагинации
    const [students, setStudents] = useState([]); // Начальное значение – пустой массив
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [listError, setListError] = useState(null);

    // Состояния для фильтрации (по всем полям)
    const [filters, setFilters] = useState({
        first_name: '',
        last_name: '',
        email: '',
        parent_contact: '',
        birth_date: '',
        class_id: '',
    });

    // Состояния для модальных окон
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Состояния для формы регистрации (через Redux)
    const [regForm, setRegForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        parent_contact: '',
        birth_date: '',
        class_id: '',
    });
    const [regNotification, setRegNotification] = useState(null);

    // Состояния для редактирования ученика
    const [editingStudent, setEditingStudent] = useState(null);
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        parent_contact: '',
        birth_date: '',
        class_id: '',
    });
    const [editNotification, setEditNotification] = useState(null);

    // Состояние для просмотра деталей ученика
    const [studentDetails, setStudentDetails] = useState(null);

    // Состояние для списка классов (для выпадающего списка)
    const [classOptions, setClassOptions] = useState([]);

    // Функция для загрузки списка учеников с пагинацией и фильтрацией
    const fetchStudents = async () => {
        try {
            const params = {
                page,
                limit,
                ...filters,
            };
            const response = await axios.get('/students', { params });
            const responseData = response.data;
            // Пробуем получить массив из нескольких возможных мест
            const studentsArray = responseData.data || responseData.students || responseData;
            setStudents(Array.isArray(studentsArray) ? studentsArray : []);
            setTotal(responseData.total || 0);
            setTotalPages(responseData.totalPages || 1);
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

    useEffect(() => {
        fetchStudents();
        fetchClassOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, filters]);

    // Локальная фильтрация (на случай, если серверная фильтрация не работает)
    const filteredStudents = students.filter((s) => {
        return (
            s.first_name.toLowerCase().includes(filters.first_name.toLowerCase()) &&
            s.last_name.toLowerCase().includes(filters.last_name.toLowerCase()) &&
            s.email.toLowerCase().includes(filters.email.toLowerCase()) &&
            (s.parent_contact || '').toLowerCase().includes(filters.parent_contact.toLowerCase()) &&
            (s.birth_date || '').includes(filters.birth_date) &&
            (s.class_id ? s.class_id.toString() : '').includes(filters.class_id.toString())
        );
    });

    // Обработка успешной регистрации ученика
    useEffect(() => {
        if (status === 'succeeded') {
            setRegNotification('Ученик успешно зарегистрирован');
            setRegForm({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                parent_contact: '',
                birth_date: '',
                class_id: '',
            });
            fetchStudents();
            setTimeout(() => {
                setRegNotification(null);
                setShowCreateModal(false);
            }, 3000);
        }
    }, [status]);

    const handleRegChange = (e) => {
        const { name, value } = e.target;
        setRegForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleRegSubmit = (e) => {
        e.preventDefault();
        dispatch(registerStudent(regForm));
    };

    useEffect(() => {
        dispatch(clearError());
    }, [regForm, dispatch]);

    // Обработчики для изменения фильтров
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // Обработчики для редактирования ученика
    const handleEditClick = (student) => {
        setEditingStudent(student);
        setEditForm({
            first_name: student.first_name || '',
            last_name: student.last_name || '',
            email: student.email || '',
            parent_contact: student.parent_contact || '',
            // Приводим дату к формату YYYY-MM-DD, если она существует
            birth_date: student.birth_date ? student.birth_date.substring(0, 10) : '',
            class_id: student.class_id || '',
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingStudent) return;
        try {
            const { data } = await axios.put(`/students/${editingStudent.id}`, editForm);
            setEditNotification('Данные ученика успешно обновлены');
            setStudents((prev) =>
                prev.map((s) => (s.id === data.id ? data : s))
            );
            setTimeout(() => {
                setEditNotification(null);
                setShowEditModal(false);
                setEditingStudent(null);
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Вы действительно хотите удалить этого ученика?')) return;
        try {
            const { data } = await axios.delete(`/students/${id}`);
            alert(data.message);
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const handleViewDetails = async (id) => {
        try {
            const { data } = await axios.get(`/students/${id}`);
            setStudentDetails(data);
            setShowDetailsModal(true);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    // Экспорт в Excel
    const handleExportExcel = () => {
        const exportData = filteredStudents.map((s) => ({
            ID: s.id,
            Имя: s.first_name,
            Фамилия: s.last_name,
            Email: s.email,
            'Контакт родителя': s.parent_contact,
            'Дата рождения': s.birth_date,
            Класс: s.class_id,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        XLSX.writeFile(workbook, "students_report.xlsx");
    };

    // Экспорт в DOCX
    const handleExportDocx = async () => {
        const paragraphs = filteredStudents.map((s, index) => {
            return new Paragraph({
                children: [
                    new TextRun({ text: `${index + 1}. ${s.first_name} ${s.last_name}`, bold: true }),
                    new TextRun({ text: ` | Email: ${s.email}` }),
                    new TextRun({ text: ` | Контакт родителя: ${s.parent_contact || '-'}` }),
                    new TextRun({ text: ` | Дата рождения: ${s.birth_date}` }),
                    new TextRun({ text: ` | Класс: ${s.class_id}` }),
                ],
            });
        });
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: "Отчёт по ученикам",
                        heading: "Heading1",
                    }),
                    ...paragraphs,
                ],
            }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, "students_report.docx");
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Управление учениками</h2>

            {/* Панель поиска и фильтрации */}
            <div className="mb-4">
                <div className="row g-2">
                    <div className="col-md-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Имя"
                            name="first_name"
                            value={filters.first_name}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Фамилия"
                            name="last_name"
                            value={filters.last_name}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Email"
                            name="email"
                            value={filters.email}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Контакт родителя"
                            name="parent_contact"
                            value={filters.parent_contact}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="date"
                            className="form-control"
                            placeholder="Дата рождения"
                            name="birth_date"
                            value={filters.birth_date}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col-md-2">
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
                    Создать нового ученика
                </button>
            </div>

            {/* Таблица учеников */}
            {listError && <div className="alert alert-danger">{listError}</div>}
            {filteredStudents.length === 0 ? (
                <p>Ученики отсутствуют.</p>
            ) : (
                <table className="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Фамилия</th>
                            <th>Email</th>
                            <th>Контакт родителя</th>
                            <th>Дата рождения</th>
                            <th>Класс</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((student) => {
                            const className =
                                classOptions.find((cls) => cls.id === student.class_id)?.name || student.class_id;
                            return (
                                <tr key={student.id}>
                                    <td>{student.id}</td>
                                    <td>{student.first_name}</td>
                                    <td>{student.last_name}</td>
                                    <td>{student.email}</td>
                                    <td>{student.parent_contact}</td>
                                    <td>{student.birth_date}</td>
                                    <td>{className}</td>
                                    <td>
                                        <button className="btn btn-sm btn-info me-1" onClick={() => handleViewDetails(student.id)}>
                                            Детали
                                        </button>
                                        <button className="btn btn-sm btn-warning me-1" onClick={() => handleEditClick(student)}>
                                            Редактировать
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(student.id)}>
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

            {/* Модальное окно для создания ученика */}
            {showCreateModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleRegSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Создание нового ученика</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {regNotification && <div className="alert alert-success">{regNotification}</div>}
                                    <div className="mb-3">
                                        <label htmlFor="first_name" className="form-label">Имя</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="first_name"
                                            name="first_name"
                                            value={regForm.first_name}
                                            onChange={handleRegChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="last_name" className="form-label">Фамилия</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="last_name"
                                            name="last_name"
                                            value={regForm.last_name}
                                            onChange={handleRegChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            name="email"
                                            value={regForm.email}
                                            onChange={handleRegChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="password" className="form-label">Пароль</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="password"
                                            name="password"
                                            value={regForm.password}
                                            onChange={handleRegChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="parent_contact" className="form-label">Контакт родителя</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="parent_contact"
                                            name="parent_contact"
                                            value={regForm.parent_contact}
                                            onChange={handleRegChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="birth_date" className="form-label">Дата рождения</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="birth_date"
                                            name="birth_date"
                                            value={regForm.birth_date}
                                            onChange={handleRegChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="class_id" className="form-label">Класс</label>
                                        <select
                                            className="form-select"
                                            id="class_id"
                                            name="class_id"
                                            value={regForm.class_id}
                                            onChange={handleRegChange}
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
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                                        Отмена
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
                                        {status === 'loading' ? 'Загрузка...' : 'Создать'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно для редактирования ученика */}
            {showEditModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Редактирование ученика (ID: {editForm.id})</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {editNotification && <div className="alert alert-success">{editNotification}</div>}
                                    <div className="mb-3">
                                        <label htmlFor="edit_first_name" className="form-label">Имя</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="edit_first_name"
                                            name="first_name"
                                            value={editForm.first_name}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit_last_name" className="form-label">Фамилия</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="edit_last_name"
                                            name="last_name"
                                            value={editForm.last_name}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit_email" className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="edit_email"
                                            name="email"
                                            value={editForm.email}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit_parent_contact" className="form-label">Контакт родителя</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="edit_parent_contact"
                                            name="parent_contact"
                                            value={editForm.parent_contact}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit_birth_date" className="form-label">Дата рождения</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="edit_birth_date"
                                            name="birth_date"
                                            value={editForm.birth_date}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit_class_id" className="form-label">Класс</label>
                                        <select
                                            className="form-select"
                                            id="edit_class_id"
                                            name="class_id"
                                            value={editForm.class_id}
                                            onChange={handleEditChange}
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

            {/* Модальное окно для просмотра деталей ученика */}
            {showDetailsModal && studentDetails && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Детали ученика (ID: {studentDetails.id})</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p><strong>Имя:</strong> {studentDetails.first_name}</p>
                                <p><strong>Фамилия:</strong> {studentDetails.last_name}</p>
                                <p><strong>Email:</strong> {studentDetails.email}</p>
                                <p><strong>Контакт родителя:</strong> {studentDetails.parent_contact}</p>
                                <p><strong>Дата рождения:</strong> {studentDetails.birth_date}</p>
                                <p>
                                    <strong>Класс:</strong>{" "}
                                    {classOptions.find((cls) => cls.id === studentDetails.class_id)?.name ||
                                        studentDetails.class_id}
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

export default AdminManageStudents;
