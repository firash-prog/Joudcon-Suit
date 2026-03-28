import { Timestamp } from 'firebase/firestore';

export type Role = 'admin' | 'user';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
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
