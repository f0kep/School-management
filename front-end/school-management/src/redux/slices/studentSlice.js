import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../axios';

// Асинхронный экшен для регистрации ученика
export const registerStudent = createAsyncThunk(
    'student/register',
    async (params, { rejectWithValue }) => {
        try {
            const { data } = await axios.post('/students/registration', params);
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

// Асинхронный экшен для входа ученика
export const loginStudent = createAsyncThunk(
    'student/login',
    async (params, { rejectWithValue }) => {
        try {
            const { data } = await axios.post('/students/login', params);
            // Сохраняем токен и роль в localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
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

// Асинхронный экшен для получения данных текущего ученика
export const fetchCurrentStudent = createAsyncThunk(
    'student/fetchCurrentStudent',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get('/students/auth');
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

// Асинхронный экшен для обновления данных ученика
export const updateStudent = createAsyncThunk(
    'student/updateStudent',
    async (formData, { rejectWithValue }) => {
        try {
            const { data } = await axios.put(`/students/${formData.id}`, formData);
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

// Асинхронный экшен для удаления ученика
export const deleteStudent = createAsyncThunk(
    'student/deleteStudent',
    async (studentId, { rejectWithValue }) => {
        try {
            await axios.delete(`/students/${studentId}`);
            return studentId;
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                return rejectWithValue(err.response.data.message);
            } else {
                return rejectWithValue(err.message);
            }
        }
    }
);

// Асинхронный экшен для получения списка всех учеников
export const fetchAllStudents = createAsyncThunk(
    'student/fetchAllStudents',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get('/students/');
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

// Асинхронный экшен для получения ученика по ID
export const fetchStudentById = createAsyncThunk(
    'student/fetchStudentById',
    async (studentId, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`/students/${studentId}`);
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
    student: null,
    students: [],
    status: 'idle',
    error: null,
};

const studentSlice = createSlice({
    name: 'student',
    initialState,
    reducers: {
        logoutStudent: (state) => {
            state.student = null;
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
            .addCase(registerStudent.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(registerStudent.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(registerStudent.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Вход
            .addCase(loginStudent.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginStudent.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Если API возвращает объект с student, используем его; иначе — studentId
                state.student = {
                    id: action.payload.studentId,
                    token: action.payload.token,
                    role: action.payload.role
                };
            })
            .addCase(loginStudent.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Получение текущего ученика
            .addCase(fetchCurrentStudent.pending, (state) => {
                console.log('fetchCurrentStudent: pending');
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCurrentStudent.fulfilled, (state, action) => {
                console.log('fetchCurrentStudent: fulfilled', action.payload);
                state.status = 'succeeded';
                state.student = action.payload.student;
            })
            .addCase(fetchCurrentStudent.rejected, (state, action) => {
                console.log('fetchCurrentStudent: rejected', action.payload || action.error.message);
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Обновление ученика
            .addCase(updateStudent.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateStudent.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.student = action.payload.student;
            })
            .addCase(updateStudent.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Удаление ученика
            .addCase(deleteStudent.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(deleteStudent.fulfilled, (state) => {
                state.status = 'succeeded';
                state.student = null;
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                delete axios.defaults.headers.common['Authorization'];
            })
            .addCase(deleteStudent.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Получение всех учеников
            .addCase(fetchAllStudents.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchAllStudents.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.students = action.payload.students;
            })
            .addCase(fetchAllStudents.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Получение ученика по ID
            .addCase(fetchStudentById.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchStudentById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const student = action.payload.student;
                const existingStudent = state.students.find((s) => s.id === student.id);
                if (existingStudent) {
                    Object.assign(existingStudent, student);
                } else {
                    state.students.push(student);
                }
            })
            .addCase(fetchStudentById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            });
    },
});

export const selectIsStudentAuth = (state) => Boolean(state.student.student);
export const selectCurrentStudent = (state) => state.student.student;
export const selectAllStudents = (state) => state.student.students;
export const selectStudentStatus = (state) => state.student.status;
export const selectStudentError = (state) => state.student.error;

export const { logoutStudent, clearError } = studentSlice.actions;
export default studentSlice.reducer;