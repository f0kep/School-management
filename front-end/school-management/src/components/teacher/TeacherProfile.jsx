import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentTeacher, updateTeacher, clearError } from '../../redux/slices/teacherSlice';
import 'bootstrap/dist/css/bootstrap.min.css';

const TeacherProfile = () => {
    const dispatch = useDispatch();
    const { teacher, status, error } = useSelector(state => state.teacher);

    const [formData, setFormData] = useState({
        id: null,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        room: '',
        subject: '',
    });

    const [successMessage, setSuccessMessage] = useState('');

    // При монтировании: если teacher отсутствует, запрашиваем его
    useEffect(() => {
        if (!teacher) {
            dispatch(fetchCurrentTeacher());
        }
    }, [teacher, dispatch]);

    // Обновляем форму, когда приходят данные teacher,
    // только если id в форме не совпадает с teacher.id (чтобы не затирать изменения пользователя)
    useEffect(() => {
        if (teacher && teacher.id && teacher.id !== formData.id) {
            setFormData({
                id: teacher.id,
                first_name: teacher.first_name || '',
                last_name: teacher.last_name || '',
                email: teacher.email || '',
                phone: teacher.phone || '',
                room: teacher.room || '',
                subject: teacher.subject || '',
            });
        }
    }, [teacher, formData.id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(updateTeacher(formData))
            .unwrap()
            .then(() => {
                setSuccessMessage('Данные успешно обновлены');
                setTimeout(() => setSuccessMessage(''), 3000);
            });
    };

    // Сброс ошибок при изменении формы
    useEffect(() => {
        dispatch(clearError());
    }, [formData, dispatch]);

    return (
        <div className="container mt-5">
            <h3 className="text-center mb-4">Профиль учителя</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                    <label htmlFor="first_name">Имя</label>
                    <input
                        type="text"
                        className="form-control"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="last_name">Фамилия</label>
                    <input
                        type="text"
                        className="form-control"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="phone">Телефон</label>
                    <input
                        type="text"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="room">Кабинет</label>
                    <input
                        type="text"
                        className="form-control"
                        id="room"
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="subject">Предмет</label>
                    <input
                        type="text"
                        className="form-control"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
                    {status === 'loading' ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
            </form>
        </div>
    );
};

export default TeacherProfile;
