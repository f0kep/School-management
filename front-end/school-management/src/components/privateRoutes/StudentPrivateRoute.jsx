import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const StudentPrivateRoute = ({ allowedRoles, children }) => {
    const { student, status } = useSelector((state) => state.student);

    // Если идёт загрузка или в localStorage есть токен, но объект ученика ещё не заполнен
    if (status === 'loading' || (localStorage.getItem('token') && !student)) {
        return <div>Загрузка...</div>;
    }

    // Если ученика нет, перенаправляем на страницу авторизации для ученика
    if (!student || !student.id) {
        return <Navigate to="/student-auth" />;
    }

    // Здесь роль жёстко задана как "student"
    const role = 'student';
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/" />;
    }

    return children;
};

export default StudentPrivateRoute;