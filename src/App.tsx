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
import { RoleManagement } from './pages/RoleManagement';
import { Layout } from './components/Layout';
import { Preloader } from './components/Preloader';
import { RolePermissions } from './types';

function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  permission 
}: { 
  children: React.ReactNode, 
  requireAdmin?: boolean,
  permission?: keyof RolePermissions
}) {
  const { user, dbUser, loading } = useAuth();

  if (loading) return <Preloader />;

  if (!user || !dbUser) return <Navigate to="/login" replace />;

  // If it's an admin route, check for admin role or canAccessAdminDashboard
  if (requireAdmin && dbUser.role !== 'admin' && !dbUser.permissions?.canAccessAdminDashboard) {
    return <Navigate to="/dashboard" replace />;
  }

  // If a specific permission is required, check it
  if (permission && dbUser.role !== 'admin' && !dbUser.permissions?.[permission]) {
    return <Navigate to="/dashboard" replace />;
  }

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
              path="projects/:projectId" 
              element={
                <ProtectedRoute>
                  <ProjectDetails />
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
                <ProtectedRoute requireAdmin permission="canCreateTasks">
                  <CreateTask />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/create-project" 
              element={
                <ProtectedRoute requireAdmin permission="canCreateProjects">
                  <CreateProject />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/crm" 
              element={
                <ProtectedRoute requireAdmin permission="canManageCRM">
                  <AdminCRM />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/users" 
              element={
                <ProtectedRoute requireAdmin permission="canManageUsers">
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/roles" 
              element={
                <ProtectedRoute requireAdmin permission="canManageRoles">
                  <RoleManagement />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
