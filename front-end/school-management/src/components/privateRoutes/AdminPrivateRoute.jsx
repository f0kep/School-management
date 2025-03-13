import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ allowedRoles, children }) => {
    const { admin, status } = useSelector((state) => state.admin);

    // Если статус загрузки или, если в localStorage есть токен, но admin еще не заполнен,
    // показываем индикатор загрузки.
    if (status === 'loading' || (localStorage.getItem('token') && !admin)) {
        return <div>Загрузка...</div>;
    }

    // Если администратора нет, перенаправляем на страницу авторизации
    if (!admin || !admin.id) {
        return <Navigate to="/admin-auth" />;
    }

    const role = 'admin';
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/" />;
    }

    return children;
};

export default PrivateRoute;
