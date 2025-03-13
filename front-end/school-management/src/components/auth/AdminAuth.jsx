// src/components/AdminAuth.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerAdmin, loginAdmin, fetchAdminAuth, clearError } from '../../redux/slices/adminSlice';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminAuth = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { admin, token, status, error } = useSelector((state) => state.admin);

    // Флаг, определяющий, какая форма отображается (вход или регистрация)
    const [isLogin, setIsLogin] = useState(true);

    // Локальное состояние для уведомлений
    const [notification, setNotification] = useState(null);

    // Хранение данных формы
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        // Если в localStorage есть токен и данные администратора получены, переходим на дашборд
        if (localStorage.getItem('token') && admin && admin.id) {
            navigate('/admin/teachers');
        }
    }, [admin, navigate]);

    // Если на форме регистрации статус успешный, показываем уведомление и переключаем форму
    useEffect(() => {
        if (!isLogin && status === 'succeeded') {
            setNotification('Регистрация прошла успешно. Пожалуйста, войдите в систему.');
            // Через 2 секунды переключаем на форму входа
            setTimeout(() => {
                setNotification(null);
                setIsLogin(true);
            }, 2000);
        }
    }, [status, isLogin]);

    // Обработчик изменения полей формы
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Обработчик отправки формы
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
            dispatch(loginAdmin({ email: formData.email, password: formData.password }));
        } else {
            // При регистрации требуются поля first_name и last_name
            dispatch(registerAdmin(formData));
        }
    };

    // Переключение между формами
    const toggleForm = () => {
        setIsLogin((prev) => !prev);
        dispatch(clearError());
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            password: '',
        });
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card p-4">
                        <h3 className="text-center mb-4">
                            {isLogin ? 'Вход для администратора' : 'Регистрация администратора'}
                        </h3>
                        {error && <div className="alert alert-danger">{error}</div>}
                        {notification && <div className="alert alert-success">{notification}</div>}
                        <form onSubmit={handleSubmit}>
                            {!isLogin && (
                                <>
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
                                </>
                            )}
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
                                {status === 'loading'
                                    ? 'Загрузка...'
                                    : isLogin
                                        ? 'Войти'
                                        : 'Зарегистрироваться'}
                            </button>
                        </form>
                        <div className="mt-3 text-center">
                            <button className="btn btn-link" onClick={toggleForm}>
                                {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже зарегистрированы? Войти'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAuth;
