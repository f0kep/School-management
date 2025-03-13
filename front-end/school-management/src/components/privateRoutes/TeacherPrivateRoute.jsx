import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const TeacherPrivateRoute = ({ allowedRoles, children }) => {
    const { teacher, status } = useSelector((state) => state.teacher);

    // Если идёт загрузка или в localStorage есть токен, но teacher ещё не заполнен
    if (status === 'loading' || (localStorage.getItem('token') && !teacher)) {
        return <div>Загрузка...</div>;
    }

    // Если учителя нет, перенаправляем на страницу авторизации для учителя
    if (!teacher || !teacher.id) {
        return <Navigate to="/teacher-auth" />;
    }

    // Здесь роль жёстко задана как "teacher"
    const role = 'teacher';
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/" />;
    }

    return children;
};

export default TeacherPrivateRoute;
