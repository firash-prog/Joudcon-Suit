import { Timestamp } from 'firebase/firestore';

export interface RolePermissions {
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canManageUsers: boolean;
  canViewAllWorkLogs: boolean;
  canManageRoles: boolean;
  canAccessAdminDashboard: boolean;
  canManageCRM: boolean;
}

export interface CustomRole {
  id: string;
  name: string;
  permissions: RolePermissions;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: string; // Can be 'admin', 'user', or a custom role ID
  permissions?: RolePermissions; // Optional: store permissions on the user for easy access
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed';
  installationDate: Timestamp;
  progress: number;
  assignedUsers?: string[];
  projectManagerId?: string;
  coordinatorIds?: string[];
  memberIds?: string[];
  customerName?: string;
  customerDetails?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assignedUserId: string;
  deadline: Timestamp;
  priority: 'low' | 'medium' | 'high';
  progress: number;
  notes?: string;
}

export interface WorkLog {
  id: string;
  userId: string;
  punchIn: Timestamp;
  punchOut?: Timestamp;
  hours?: number;
}

export interface Message {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Timestamp;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'lead' | 'active' | 'inactive';
  notes?: string;
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
  type: 'task_update' | 'message';
}
