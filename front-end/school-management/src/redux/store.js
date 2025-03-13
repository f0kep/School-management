// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import teacherReducer from './slices/teacherSlice'
import adminReducer from './slices/adminSlice';
import studentReducer from './slices/studentSlice';

const store = configureStore({
    reducer: {
        teacher: teacherReducer,
        admin: adminReducer,
        student: studentReducer,
    },
});

export default store;