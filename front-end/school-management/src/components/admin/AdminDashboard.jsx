import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminDashboard = () => {
    return (
        <div className="container-fluid p-0">
            {/* Верхняя панель навигации */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                <div className="container">
                    <span className="navbar-brand">Админ-панель</span>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavbar" aria-controls="adminNavbar" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon" />
                    </button>
                    <div className="collapse navbar-collapse" id="adminNavbar">
                        <ul className="navbar-nav mx-auto">
                            <li className="nav-item mx-2">
                                <Link className="nav-link" to="/admin/teachers">
                                    Управление учителями
                                </Link>
                            </li>
                            <li className="nav-item mx-2">
                                <Link className="nav-link" to="/admin/students">
                                    Управление учениками
                                </Link>
                            </li>
                            <li className="nav-item mx-2">
                                <Link className="nav-link" to="/admin/classes">
                                    Управление классами
                                </Link>
                            </li>
                            <li className="nav-item mx-2">
                                <Link className="nav-link" to="/admin/schedules">
                                    Расписание
                                </Link>
                            </li>
                            <li className="nav-item mx-2">
                                <Link className="nav-link" to="/admin/grades">
                                    Оценки
                                </Link>
                            </li>
                            <li className="nav-item mx-2">
                                <Link className="nav-link" to="/admin/events">
                                    События
                                </Link>
                            </li>
                            <li className="nav-item mx-2">
                                <Link className="nav-link" to="/admin/attandance">
                                    Посещаемость
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Основной контент */}
            <main className="container my-4">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminDashboard;
