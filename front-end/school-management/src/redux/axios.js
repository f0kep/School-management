// src/redux/axios.js

import axios from 'axios';

// Создаем экземпляр axios с базовым URL вашего сервера
const API_URL = 'http://localhost:5000/api'; // Измените, если ваш сервер работает на другом адресе или порту

const instance = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Если используете куки для аутентификации
});

// Добавляем интерцептор для добавления токена авторизации к каждому запросу
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Предполагается, что токен хранится в localStorage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Добавляем интерцептор для глобальной обработки ошибок
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Обработка ошибок, например, перенаправление на страницу логина при 401
        if (error.response && error.response.status === 401) {
            // Логика выхода из системы или перенаправления
            // Например, можно вызвать действие logout из userSlice
        }
        return Promise.reject(error);
    }
);

export default instance;