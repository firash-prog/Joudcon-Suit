import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserDashboard } from './pages/UserDashboard';
import { CreateTask } from './pages/CreateTask';
import { CreateProject } from './pages/CreateProject';
import { ProjectDetails } from './pages/ProjectDetails';
import { ProjectChat } from './pages/ProjectChat';
import { Profile } from './pages/Profile';
import { AdminCRM } from './pages/AdminCRM';
import { AdminUsers } from './pages/AdminUsers';
import { Layout } from './components/Layout';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, dbUser, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user || !dbUser) return <Navigate to="/login" replace />;

  if (requireAdmin && dbUser.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="projects/:projectId/chat" 
              element={
                <ProtectedRoute>
                  <ProjectChat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/create-task" 
              element={
                <ProtectedRoute requireAdmin>
                  <CreateTask />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/create-project" 
              element={
                <ProtectedRoute requireAdmin>
                  <CreateProject />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/projects/:projectId" 
              element={
                <ProtectedRoute requireAdmin>
                  <ProjectDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/crm" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminCRM />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/users" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
