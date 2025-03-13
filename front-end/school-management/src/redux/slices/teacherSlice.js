import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../axios';

// Асинхронный экшен для регистрации учителя
export const registerTeacher = createAsyncThunk(
    'teacher/register',
    async (params, { rejectWithValue }) => {
        try {
            const { data } = await axios.post('/teachers/registration', params);
            return data;
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для входа учителя
export const loginTeacher = createAsyncThunk(
    'teacher/login',
    async (params, { rejectWithValue }) => {
        try {
            const { data } = await axios.post('/teachers/login', params);
            // Сохраняем токен и роль в localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role); // например, "teacher"
            // Устанавливаем заголовок для axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            return data;
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для получения данных текущего учителя
export const fetchCurrentTeacher = createAsyncThunk(
    'teacher/fetchCurrentTeacher',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get('/teachers/auth');
            return data;
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для обновления данных учителя
export const updateTeacher = createAsyncThunk(
    'teacher/updateTeacher',
    async (formData, { rejectWithValue }) => {
        try {
            const { data } = await axios.put(`/teachers/${formData.id}`, formData);
            return data;
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для удаления учителя
export const deleteTeacher = createAsyncThunk(
    'teacher/deleteTeacher',
    async (teacherId, { rejectWithValue }) => {
        try {
            await axios.delete(`/teachers/${teacherId}`);
            return teacherId;
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для получения списка всех учителей
export const fetchAllTeachers = createAsyncThunk(
    'teacher/fetchAllTeachers',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get('/teachers/');
            return data;
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для получения учителя по ID
export const fetchTeacherById = createAsyncThunk(
    'teacher/fetchTeacherById',
    async (teacherId, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`/teachers/${teacherId}`);
            return data;
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

const initialState = {
    teacher: null,
    teachers: [],
    status: 'idle',
    error: null,
};

const teacherSlice = createSlice({
    name: 'teacher',
    initialState,
    reducers: {
        logoutTeacher: (state) => {
            state.teacher = null;
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
            .addCase(registerTeacher.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(registerTeacher.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(registerTeacher.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Вход
            .addCase(loginTeacher.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginTeacher.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Если API возвращает объект с teacher, используем его; иначе - teacherId
                if (action.payload.teacher) {
                    state.teacher = {
                        id: action.payload.teacher.id,
                        token: action.payload.token,
                        role: action.payload.role,
                        ...action.payload.teacher
                    };
                } else {
                    state.teacher = {
                        id: action.payload.teacherId,
                        token: action.payload.token,
                        role: action.payload.role
                    };
                }
            })
            .addCase(loginTeacher.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Получение текущего учителя
            .addCase(fetchCurrentTeacher.pending, (state) => {
                console.log('fetchCurrentTeacher: pending');
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCurrentTeacher.fulfilled, (state, action) => {
                console.log('fetchCurrentTeacher: fulfilled', action.payload);
                state.status = 'succeeded';
                state.teacher = action.payload.teacher;
            })
            .addCase(fetchCurrentTeacher.rejected, (state, action) => {
                console.log('fetchCurrentTeacher: rejected', action.payload || action.error.message);
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Обновление учителя
            .addCase(updateTeacher.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateTeacher.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.teacher = action.payload.teacher;
            })
            .addCase(updateTeacher.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Удаление учителя
            .addCase(deleteTeacher.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(deleteTeacher.fulfilled, (state) => {
                state.status = 'succeeded';
                state.teacher = null;
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                delete axios.defaults.headers.common['Authorization'];
            })
            .addCase(deleteTeacher.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Получение всех учителей
            .addCase(fetchAllTeachers.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchAllTeachers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.teachers = action.payload.teachers;
            })
            .addCase(fetchAllTeachers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Получение учителя по ID
            .addCase(fetchTeacherById.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchTeacherById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const teacher = action.payload.teacher;
                const existingTeacher = state.teachers.find((t) => t.id === teacher.id);
                if (existingTeacher) {
                    Object.assign(existingTeacher, teacher);
                } else {
                    state.teachers.push(teacher);
                }
            })
            .addCase(fetchTeacherById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            });
    },
});

export const selectIsTeacherAuth = (state) => Boolean(state.teacher.teacher);
export const selectCurrentTeacher = (state) => state.teacher.teacher;
export const selectAllTeachers = (state) => state.teacher.teachers;
export const selectTeacherStatus = (state) => state.teacher.status;
export const selectTeacherError = (state) => state.teacher.error;

export const { logoutTeacher, clearError } = teacherSlice.actions;
export default teacherSlice.reducer;
