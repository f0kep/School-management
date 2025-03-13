import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchCurrentAdmin } from './redux/slices/adminSlice';
import { fetchCurrentTeacher } from './redux/slices/teacherSlice';
import { fetchCurrentStudent } from './redux/slices/studentSlice';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminAuth from './components/auth/AdminAuth';
import TeacherLogin from './components/auth/TeacherLogin';
import StudentLogin from './components/auth/StudentLogin';
import AdminAddTeacher from './components/admin/AdminAddTeacher';
import AdminAddStudent from './components/admin/AdminAddStudent';
import AdminManageClasses from './components/admin/AdminManageClasses';
import AdminManageSchedules from './components/admin/AdminManageSchedules';
import AdminPrivateRoute from './components/privateRoutes/AdminPrivateRoute';
import AdminManageGrades from './components/admin/AdminManageGrades';
import AdminManageEvents from './components/admin/AdminManageEvents';
import AdminManageAttendance from './components/admin/AdminManageAttendance';
import AdminDashboard from './components/admin/AdminDashboard';
import TeacherPrivateRoute from './components/privateRoutes/TeacherPrivateRoute';
import TeacherProfile from './components/teacher/TeacherProfile';
import TeacherClassDashboard from './components/teacher/TeacherClassDashboard';
import StudentPrivateRoute from './components/privateRoutes/StudentPrivateRoute';
import EventPage from './components/EventPage';
import axios from './redux/axios'; // тот же axios
import StudentDashboard from './components/student/StudentDashboard';
import Header from './components/Header';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    console.log('Token from localStorage:', token, 'Role:', role);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (role === 'admin') {
        dispatch(fetchCurrentAdmin())
          .unwrap()
          .then(data => console.log('Fetched admin:', data))
          .catch(err => console.log('Error fetching admin:', err));
      } else if (role === 'teacher') {
        dispatch(fetchCurrentTeacher())
          .unwrap()
          .then(data => console.log('Fetched teacher:', data))
          .catch(err => console.log('Error fetching teacher:', err));
      } else if (role === 'student') {
        dispatch(fetchCurrentStudent())
          .unwrap()
          .then(data => console.log('Fetched student:', data))
          .catch(err => console.log('Error fetching student:', err));
      }
    }
  }, [dispatch]);

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/admin-auth" element={<AdminAuth />} />
        <Route path="/teacher-auth" element={<TeacherLogin />} />
        <Route path="/student-auth" element={<StudentLogin />} />

        <Route path="/events" element={<EventPage />} />

        <Route
          path="/student/dashboard"
          element={
            <StudentPrivateRoute allowedRoles={['student']}>
              <StudentDashboard />
            </StudentPrivateRoute>
          }
        />

        <Route
          path="/teacher/profile"
          element={
            <TeacherPrivateRoute allowedRoles={['teacher']}>
              <TeacherProfile />
            </TeacherPrivateRoute>
          }
        />
        <Route
          path="/teacher/class"
          element={
            <TeacherPrivateRoute allowedRoles={['teacher']}>
              <TeacherClassDashboard />
            </TeacherPrivateRoute>
          }
        />

        <Route
          path="/admin/teachers"
          element={
            <AdminPrivateRoute allowedRoles={['admin']}>
              <AdminAddTeacher />
            </AdminPrivateRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <AdminPrivateRoute allowedRoles={['admin']}>
              <AdminAddStudent />
            </AdminPrivateRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <AdminPrivateRoute allowedRoles={['admin']}>
              <AdminManageClasses />
            </AdminPrivateRoute>
          }
        />
        <Route
          path="/admin/schedules"
          element={
            <AdminPrivateRoute allowedRoles={['admin']}>
              <AdminManageSchedules />
            </AdminPrivateRoute>
          }
        />
        <Route
          path="/admin/grades"
          element={
            <AdminPrivateRoute allowedRoles={['admin']}>
              <AdminManageGrades />
            </AdminPrivateRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <AdminPrivateRoute allowedRoles={['admin']}>
              <AdminManageEvents />
            </AdminPrivateRoute>
          }
        />
        <Route
          path="/admin/attandance"
          element={
            <AdminPrivateRoute allowedRoles={['admin']}>
              <AdminManageAttendance />
            </AdminPrivateRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminPrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </AdminPrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;