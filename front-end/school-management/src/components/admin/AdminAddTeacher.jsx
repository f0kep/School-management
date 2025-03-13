import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerTeacher, clearError } from '../../redux/slices/teacherSlice';
import axios from '../../redux/axios';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminManageTeachers = () => {
    const dispatch = useDispatch();
    const { status, error } = useSelector((state) => state.teacher);

    // Состояние для списка учителей
    const [teacherList, setTeacherList] = useState([]);
    const [listError, setListError] = useState(null);

    // Состояния для поиска по полям
    const [search, setSearch] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        room: '',
        subject: '',
    });

    // Состояния для модальных окон
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Состояния для формы регистрации (через Redux)
    const [regForm, setRegForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        room: '',
        subject: '',
    });
    const [regNotification, setRegNotification] = useState(null);

    // Состояния для редактирования учителя
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        room: '',
        subject: '',
    });
    const [editNotification, setEditNotification] = useState(null);

    // Получаем список учителей
    const fetchTeachers = async () => {
        try {
            const { data } = await axios.get('/teachers/');
            setTeacherList(data.teachers || data);
        } catch (err) {
            setListError(err.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // Обработка регистрации нового учителя (через Redux)
    useEffect(() => {
        if (status === 'succeeded') {
            setRegNotification('Учитель успешно зарегистрирован');
            setRegForm({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                phone: '',
                room: '',
                subject: '',
            });
            fetchTeachers();
            setTimeout(() => {
                setRegNotification(null);
                setShowAddModal(false);
            }, 3000);
        }
    }, [status]);

    const handleRegChange = (e) => {
        const { name, value } = e.target;
        setRegForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleRegSubmit = (e) => {
        e.preventDefault();
        dispatch(registerTeacher(regForm));
    };

    useEffect(() => {
        dispatch(clearError());
    }, [regForm, dispatch]);

    // Обработчики для поиска
    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearch((prev) => ({ ...prev, [name]: value }));
    };

    // Фильтрация списка учителей
    const filteredTeachers = teacherList.filter((t) => {
        return (
            t.first_name.toLowerCase().includes(search.first_name.toLowerCase()) &&
            t.last_name.toLowerCase().includes(search.last_name.toLowerCase()) &&
            t.email.toLowerCase().includes(search.email.toLowerCase()) &&
            (t.phone || '').toLowerCase().includes(search.phone.toLowerCase()) &&
            (t.room || '').toLowerCase().includes(search.room.toLowerCase()) &&
            (t.subject || '').toLowerCase().includes(search.subject.toLowerCase())
        );
    });

    // Редактирование: открытие модального окна
    const handleEditClick = (teacher) => {
        setEditingTeacher(teacher);
        setEditForm({
            first_name: teacher.first_name || '',
            last_name: teacher.last_name || '',
            email: teacher.email || '',
            phone: teacher.phone || '',
            room: teacher.room || '',
            subject: teacher.subject || '',
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingTeacher) return;
        try {
            const { data } = await axios.put(`/teachers/${editingTeacher.id}`, editForm);
            setEditNotification('Данные учителя успешно обновлены');
            setTeacherList((prev) =>
                prev.map((t) => (t.id === data.id ? data : t))
            );
            setTimeout(() => {
                setEditNotification(null);
                setShowEditModal(false);
                setEditingTeacher(null);
            }, 3000);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // Экспорт в Excel с использованием SheetJS
    const handleExportExcel = () => {
        // Преобразуем список учителей в формат, удобный для Excel
        const worksheet = XLSX.utils.json_to_sheet(filteredTeachers);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
        // Генерируем файл
        XLSX.writeFile(workbook, "teachers_report.xlsx");
    };

    // Экспорт в DOCX с использованием библиотеки docx
    const handleExportDocx = async () => {
        const paragraphs = filteredTeachers.map((t, index) => {
            return new Paragraph({
                children: [
                    new TextRun({ text: `${index + 1}. ${t.first_name} ${t.last_name}`, bold: true }),
                    new TextRun({ text: ` | Email: ${t.email}` }),
                    new TextRun({ text: ` | Телефон: ${t.phone || '-'}` }),
                    new TextRun({ text: ` | Кабинет: ${t.room || '-'}` }),
                    new TextRun({ text: ` | Предмет: ${t.subject || '-'}` }),
                ],
            });
        });

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: "Отчёт по учителям",
                        heading: "Heading1",
                    }),
                    ...paragraphs,
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, "teachers_report.docx");
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Список учителей</h2>

            {/* Панель поиска */}
            <div className="mb-4">
                <h5>Поиск по полям:</h5>
                <div className="row g-2">
                    <div className="col-md-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Имя"
                            name="first_name"
                            value={search.first_name}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Фамилия"
                            name="last_name"
                            value={search.last_name}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Email"
                            name="email"
                            value={search.email}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Телефон"
                            name="phone"
                            value={search.phone}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Кабинет"
                            name="room"
                            value={search.room}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Предмет"
                            name="subject"
                            value={search.subject}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
            </div>

            {/* Кнопки экспорта отчёта */}
            <div className="mb-3 d-flex justify-content-between">
                <button className="btn btn-success" onClick={handleExportExcel}>
                    Экспорт в Excel
                </button>
                <button className="btn btn-info" onClick={handleExportDocx}>
                    Экспорт в DOCX
                </button>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    Добавить учителя
                </button>
            </div>

            {/* Таблица учителей */}
            {listError && <div className="alert alert-danger">{listError}</div>}
            {filteredTeachers.length === 0 ? (
                <p>Учителя отсутствуют.</p>
            ) : (
                <table className="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Фамилия</th>
                            <th>Email</th>
                            <th>Телефон</th>
                            <th>Кабинет</th>
                            <th>Предмет</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeachers.map((teacher) => (
                            <tr key={teacher.id}>
                                <td>{teacher.id}</td>
                                <td>{teacher.first_name}</td>
                                <td>{teacher.last_name}</td>
                                <td>{teacher.email}</td>
                                <td>{teacher.phone}</td>
                                <td>{teacher.room}</td>
                                <td>{teacher.subject}</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-warning"
                                        onClick={() => handleEditClick(teacher)}
                                    >
                                        Редактировать
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Модальное окно для добавления нового учителя */}
            {showAddModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleRegSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Добавление нового учителя</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    {regNotification && <div className="alert alert-success">{regNotification}</div>}
                                    <div className="mb-3">
                                        <label htmlFor="first_name_modal" className="form-label">Имя</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="first_name_modal"
                                            name="first_name"
                                            value={regForm.first_name}
                                            onChange={handleRegChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="last_name_modal" className="form-label">Фамилия</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="last_name_modal"
                                            name="last_name"
                                            value={regForm.last_name}
                                            onChange={handleRegChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="email_modal" className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email_modal"
                                            name="email"
                                            value={regForm.email}
                                            onChange={handleRegChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="password_modal" className="form-label">Пароль</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="password_modal"
                                            name="password"
                                            value={regForm.password}
                                            onChange={handleRegChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="phone_modal" className="form-label">Телефон</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="phone_modal"
                                            name="phone"
                                            value={regForm.phone}
                                            onChange={handleRegChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="room_modal" className="form-label">Кабинет</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="room_modal"
                                            name="room"
                                            value={regForm.room}
                                            onChange={handleRegChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="subject_modal" className="form-label">Предмет</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="subject_modal"
                                            name="subject"
                                            value={regForm.subject}
                                            onChange={handleRegChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                        Отмена
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
                                        {status === 'loading' ? 'Загрузка...' : 'Добавить'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно для редактирования учителя */}
            {showEditModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Редактирование учителя (ID: {editingTeacher.id})</h5>
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
                                        <label htmlFor="edit_phone" className="form-label">Телефон</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="edit_phone"
                                            name="phone"
                                            value={editForm.phone}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit_room" className="form-label">Кабинет</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="edit_room"
                                            name="room"
                                            value={editForm.room}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit_subject" className="form-label">Предмет</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="edit_subject"
                                            name="subject"
                                            value={editForm.subject}
                                            onChange={handleEditChange}
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
        </div>
    );
};

export default AdminManageTeachers;