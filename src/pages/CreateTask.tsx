import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Project, User } from '../types';
import { ArrowLeft, Save } from 'lucide-react';

export function CreateTask() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    projectId: '',
    assignedUserId: '',
    deadline: '',
    priority: 'medium'
  });

  const getProjectUserIds = (proj: Project) => {
    const ids = new Set<string>();
    if (proj.projectManagerId) ids.add(proj.projectManagerId);
    if (proj.coordinatorIds) proj.coordinatorIds.forEach(id => ids.add(id));
    if (proj.assignedUsers) proj.assignedUsers.forEach(id => ids.add(id));
    return Array.from(ids);
  };

  const selectedProject = projects.find(p => p.id === newTask.projectId);
  const projectUserIds = selectedProject ? getProjectUserIds(selectedProject) : [];
  
  const filteredUsers = selectedProject 
    ? users.filter(u => projectUserIds.includes(u.uid))
    : [];

  useEffect(() => {
    if (newTask.projectId && newTask.assignedUserId) {
      const proj = projects.find(p => p.id === newTask.projectId);
      if (proj) {
        const projUserIds = getProjectUserIds(proj);
        if (!projUserIds.includes(newTask.assignedUserId)) {
          setNewTask(prev => ({ ...prev, assignedUserId: '' }));
        }
      }
    }
  }, [newTask.projectId, newTask.assignedUserId, projects]);

  useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
    });
    return () => { unsubProjects(); unsubUsers(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.projectId || !newTask.assignedUserId || !newTask.deadline) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTask.title,
        projectId: newTask.projectId,
        assignedUserId: newTask.assignedUserId,
        deadline: Timestamp.fromDate(new Date(newTask.deadline)),
        priority: newTask.priority,
        progress: 0
      });
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Task</h1>
          <p className="text-slate-400 text-sm">Assign a new task to a team member</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Task Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Setup Main Stage Lighting"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              value={newTask.title} 
              onChange={e => setNewTask({...newTask, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Project</label>
              <select 
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                value={newTask.projectId} 
                onChange={e => setNewTask({...newTask, projectId: e.target.value})}
              >
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Assign To</label>
              <select 
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                value={newTask.assignedUserId} 
                onChange={e => setNewTask({...newTask, assignedUserId: e.target.value})}
                disabled={!newTask.projectId || (!!newTask.projectId && filteredUsers.length === 0)}
              >
                {!newTask.projectId && <option value="">Select a project first</option>}
                {newTask.projectId && filteredUsers.length === 0 && <option value="">No users assigned to this project</option>}
                {newTask.projectId && filteredUsers.length > 0 && <option value="">Select Team Member</option>}
                {filteredUsers.map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Deadline</label>
              <input 
                type="datetime-local" 
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                value={newTask.deadline} 
                onChange={e => setNewTask({...newTask, deadline: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                value={newTask.priority} 
                onChange={e => setNewTask({...newTask, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Link 
              to="/admin"
              className="px-6 py-3 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
