import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, collection, query, where, onSnapshot, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Project, Task, User } from '../types';
import { ArrowLeft, Calendar, Users, Trash2, Plus, MessageSquare } from 'lucide-react';

export function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newTask, setNewTask] = useState({ title: '', assignedUserId: '', deadline: '', priority: 'medium' });

  useEffect(() => {
    if (!projectId) return;
    const unsubProject = onSnapshot(doc(db, 'projects', projectId), (docSnap) => {
      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() } as Project);
      }
    });
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), where('projectId', '==', projectId)), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
    });
    return () => { unsubProject(); unsubTasks(); unsubUsers(); };
  }, [projectId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedUserId || !newTask.deadline || !projectId) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTask.title,
        projectId,
        assignedUserId: newTask.assignedUserId,
        deadline: Timestamp.fromDate(new Date(newTask.deadline)),
        priority: newTask.priority,
        progress: 0
      });
      setNewTask({ title: '', assignedUserId: '', deadline: '', priority: 'medium' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!project) return <div className="p-8 text-white flex justify-center">Loading project details...</div>;

  const projectUserIds = new Set<string>();
  if (project.projectManagerId) projectUserIds.add(project.projectManagerId);
  if (project.coordinatorIds) project.coordinatorIds.forEach(id => projectUserIds.add(id));
  if (project.assignedUsers) project.assignedUsers.forEach(id => projectUserIds.add(id));
  const projectUsers = users.filter(u => projectUserIds.has(u.uid));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            {project.customerName && <p className="text-slate-400 text-sm">Customer: {project.customerName}</p>}
          </div>
        </div>
        <Link 
          to={`/projects/${project.id}/chat`}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-blue-400 px-4 py-2 rounded-xl transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          Group Chat
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Tasks Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">Project Tasks</h2>
            
            {/* Add Task Form */}
            <form onSubmit={handleCreateTask} className="flex flex-wrap gap-3 mb-8 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <input 
                type="text" 
                placeholder="Task Title" 
                required
                className="flex-1 min-w-[200px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
              />
              <select 
                required
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={newTask.assignedUserId}
                onChange={e => setNewTask({...newTask, assignedUserId: e.target.value})}
              >
                <option value="">Assign To</option>
                {projectUsers.map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
              </select>
              <input 
                type="datetime-local" 
                required
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={newTask.deadline}
                onChange={e => setNewTask({...newTask, deadline: e.target.value})}
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            {/* Task List */}
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No tasks created yet.</p>
              ) : (
                tasks.map(task => {
                  const assignee = users.find(u => u.uid === task.assignedUserId);
                  return (
                    <div key={task.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white">{task.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {assignee?.displayName || 'Unknown'}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {task.deadline.toDate().toLocaleDateString()}</span>
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            task.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                            task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>{task.priority}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block mb-1">Progress</span>
                          <span className="text-sm font-bold text-white">{task.progress}%</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Details */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Project Info</h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Status</span>
                <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium uppercase tracking-wider">
                  {project.status}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Overall Progress</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
                  </div>
                  <span className="text-sm font-bold text-white">{Math.round(project.progress)}%</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Installation Date</span>
                <span className="text-sm text-slate-300">{project.installationDate.toDate().toLocaleString()}</span>
              </div>
              {project.customerDetails && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Customer Requirements</span>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{project.customerDetails}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Team</h3>
            <div className="space-y-3">
              {project.projectManagerId && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Project Manager</span>
                  <div className="text-sm text-slate-300">{users.find(u => u.uid === project.projectManagerId)?.displayName || 'Unknown'}</div>
                </div>
              )}
              {project.coordinatorIds && project.coordinatorIds.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Coordinators</span>
                  <div className="text-sm text-slate-300">
                    {project.coordinatorIds.map(id => users.find(u => u.uid === id)?.displayName).filter(Boolean).join(', ')}
                  </div>
                </div>
              )}
              {project.assignedUsers && project.assignedUsers.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Assigned Team</span>
                  <div className="text-sm text-slate-300">
                    {project.assignedUsers.map(id => users.find(u => u.uid === id)?.displayName).filter(Boolean).join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
