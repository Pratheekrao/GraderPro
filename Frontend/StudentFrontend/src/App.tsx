import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubjectDetail from './pages/SubjectDetail';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
      } />
      <Route path="/register" element={
        !isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />
      } />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="subject/:subject" element={<SubjectDetail />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;