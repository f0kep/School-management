import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from '../redux/axios';
import { logoutAdmin } from '../redux/slices/adminSlice';
import { logoutTeacher } from '../redux/slices/teacherSlice';
import { logoutStudent } from '../redux/slices/studentSlice';
import 'bootstrap/dist/css/bootstrap.min.css';

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    // Получаем роль из localStorage (если пользователь не авторизован, роль отсутствует)
    const role = localStorage.getItem('role');

    const handleLogout = () => {
        // Удаляем данные из localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        // Удаляем заголовок авторизации
        delete axios.defaults.headers.common['Authorization'];

        // Диспатчим соответствующий экшен для выхода
        if (role === 'admin') {
            dispatch(logoutAdmin());
        } else if (role === 'teacher') {
            dispatch(logoutTeacher());
        } else if (role === 'student') {
            dispatch(logoutStudent());
        }
        // Перенаправляем на главную страницу или страницу авторизации
        navigate('/events');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container">
                <Link className="navbar-brand" to="/events">Школа №31</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon" />
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    {/* Если роль отсутствует, показываем ссылки на авторизацию для всех пользователей */}
                    {!role ? (
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item">
                                <Link className="nav-link" to="/admin-auth">Вход для админа</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/teacher-auth">Вход для учителя</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/student-auth">Вход для ученика</Link>
                            </li>
                        </ul>
                    ) : (
                        // Если роль установлена, показываем меню в зависимости от роли
                        <ul className="navbar-nav me-auto">
                            {role === 'admin' && (
                                <>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin/dashboard">Dashboard</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin/teachers">Учителя</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin/students">Ученики</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin/classes">Классы</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin/schedules">Расписание</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin/grades">Оценки</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin/events">События</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin/attandance">Посещаемость</Link>
                                    </li>
                                </>
                            )}
                            {role === 'teacher' && (
                                <>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/teacher/profile">Профиль</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/teacher/class">Мой класс</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/events">События</Link>
                                    </li>
                                </>
                            )}
                            {role === 'student' && (
                                <>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/student/dashboard">Кабинет</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/events">События</Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    )}
                    {role && (
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <button className="btn btn-outline-light" onClick={handleLogout}>Выйти</button>
                            </li>
                        </ul>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Header;
