// src/redux/slices/adminSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../axios';

// Асинхронный экшен для регистрации администратора
export const registerAdmin = createAsyncThunk(
    'admin/register',
    async (params, { rejectWithValue }) => {
        try {
            const { data } = await axios.post('/admins/registration', params);
            return data;
        } catch (err) {
            if (
                err.response &&
                err.response.data &&
                err.response.data.message
            ) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для входа администратора
export const loginAdmin = createAsyncThunk(
    'admin/login',
    async (params, { rejectWithValue }) => {
        try {
            const { data } = await axios.post('/admins/login', params);
            // Сохраняем токен и роль в localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            // Устанавливаем заголовок для axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            return data;
        } catch (err) {
            if (
                err.response &&
                err.response.data &&
                err.response.data.message
            ) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для получения данных текущего администратора
export const fetchCurrentAdmin = createAsyncThunk(
    'admin/fetchCurrentAdmin',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get('/admins/auth');
            return data;
        } catch (err) {
            if (
                err.response &&
                err.response.data &&
                err.response.data.message
            ) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для обновления данных администратора
export const updateAdmin = createAsyncThunk(
    'admin/updateAdmin',
    async (formData, { rejectWithValue }) => {
        try {
            const { data } = await axios.put(`/admins/${formData.id}`, formData);
            return data;
        } catch (err) {
            if (
                err.response &&
                err.response.data &&
                err.response.data.message
            ) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для удаления администратора
export const deleteAdmin = createAsyncThunk(
    'admin/deleteAdmin',
    async (adminId, { rejectWithValue }) => {
        try {
            await axios.delete(`/admins/${adminId}`);
            return adminId;
        } catch (err) {
            if (
                err.response &&
                err.response.data &&
                err.response.data.message
            ) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для получения списка всех администраторов
export const fetchAllAdmins = createAsyncThunk(
    'admin/fetchAllAdmins',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get('/admins/');
            return data;
        } catch (err) {
            if (
                err.response &&
                err.response.data &&
                err.response.data.message
            ) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для получения администратора по ID
export const fetchAdminById = createAsyncThunk(
    'admin/fetchAdminById',
    async (adminId, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`/admins/${adminId}`);
            return data;
        } catch (err) {
            if (
                err.response &&
                err.response.data &&
                err.response.data.message
            ) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

const initialState = {
    admin: null,
    admins: [],
    status: 'idle',
    error: null,
};

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        logoutAdmin: (state) => {
            state.admin = null;
            state.status = 'idle';
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            delete axios.defaults.headers.common['Authorization'];
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Регистрация
            .addCase(registerAdmin.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(registerAdmin.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Регистрация не вызывает автоматический вход – admin не обновляется
            })
            .addCase(registerAdmin.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Вход
            .addCase(loginAdmin.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginAdmin.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Сохраняем объект с полем id, которое ожидает PrivateRoute
                state.admin = {
                    id: action.payload.adminId,
                    token: action.payload.token,
                    role: action.payload.role
                };
            })
            .addCase(loginAdmin.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Получение текущего администратора
            .addCase(fetchCurrentAdmin.pending, (state) => {
                console.log('fetchCurrentAdmin: pending');
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCurrentAdmin.fulfilled, (state, action) => {
                console.log('fetchCurrentAdmin: fulfilled', action.payload);
                state.status = 'succeeded';
                state.admin = action.payload.admin;
            })
            .addCase(fetchCurrentAdmin.rejected, (state, action) => {
                console.log('fetchCurrentAdmin: rejected', action.payload || action.error.message);
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Обновление администратора
            .addCase(updateAdmin.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateAdmin.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.admin = action.payload;
            })
            .addCase(updateAdmin.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Удаление администратора
            .addCase(deleteAdmin.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(deleteAdmin.fulfilled, (state) => {
                state.status = 'succeeded';
                state.admin = null;
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                delete axios.defaults.headers.common['Authorization'];
            })
            .addCase(deleteAdmin.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Получение всех администраторов
            .addCase(fetchAllAdmins.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchAllAdmins.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.admins = action.payload.admins;
            })
            .addCase(fetchAllAdmins.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Получение администратора по ID
            .addCase(fetchAdminById.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchAdminById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const admin = action.payload;
                const existingAdmin = state.admins.find((a) => a.id === admin.id);
                if (existingAdmin) {
                    Object.assign(existingAdmin, admin);
                } else {
                    state.admins.push(admin);
                }
            })
            .addCase(fetchAdminById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            });
    },
});

export const selectIsAdminAuth = (state) => Boolean(state.admin.admin);
export const selectCurrentAdmin = (state) => state.admin.admin;
export const selectAllAdmins = (state) => state.admin.admins;
export const selectAdminStatus = (state) => state.admin.status;
export const selectAdminError = (state) => state.admin.error;

export const { logoutAdmin, clearError } = adminSlice.actions;

export default adminSlice.reducer;