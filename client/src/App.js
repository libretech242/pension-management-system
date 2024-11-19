import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import PensionManagement from './pages/PensionManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Landing from './pages/Landing';
import './styles/App.css';

function App() {
  const location = useLocation();
  const isPublicRoute = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <AuthProvider>
      <div className={`app ${isPublicRoute ? 'public-route' : ''}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <div className="dashboard-layout">
                  <Sidebar />
                  <div className="main-content">
                    <Navigation />
                    <div className="page-content">
                      <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="employees" element={<Employees />} />
                        <Route path="pension-management" element={<PensionManagement />} />
                        <Route path="reports" element={<Reports />} />
                        <Route 
                          path="settings" 
                          element={
                            <ProtectedRoute requiredRole="admin">
                              <Settings />
                            </ProtectedRoute>
                          } 
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
