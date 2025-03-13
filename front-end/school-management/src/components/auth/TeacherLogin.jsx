// src/components/TeacherLogin.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginTeacher, clearError } from '../../redux/slices/teacherSlice';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const TeacherLogin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { teacher, token, status, error } = useSelector((state) => state.teacher);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    useEffect(() => {
        // Если авторизация успешная, перенаправляем на дашборд учителя
        if (localStorage.getItem('token') && teacher && teacher.id) {
            navigate('/teacher/class');
        }
    }, [teacher, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(loginTeacher({ email: formData.email, password: formData.password }));
    };

    // При изменении формы сбрасываем ошибки
    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card p-4">
                        <h3 className="text-center mb-4">Вход для учителя</h3>
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={handleSubmit}>
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
                                <label htmlFor="password">Пароль</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100" disabled={status === 'loading'}>
                                {status === 'loading' ? 'Загрузка...' : 'Войти'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherLogin;