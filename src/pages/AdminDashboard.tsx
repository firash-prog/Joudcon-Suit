import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Project, Task, User, Notification } from '../types';
import { Plus, Trash2, Edit2, AlertCircle, Clock, Calendar, Users, ChevronDown, Check, CheckCircle2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow, isBefore, addHours, differenceInSeconds } from 'date-fns';

function formatCountdown(targetDate: Date, now: Date) {
  const diff = differenceInSeconds(targetDate, now);
  if (diff <= 0) return '00:00:00';
  
  const days = Math.floor(diff / (3600 * 24));
  const hours = Math.floor((diff % (3600 * 24)) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  
  if (days > 0) return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [now, setNow] = useState(new Date());

  // Form states
  const [newTask, setNewTask] = useState({ title: '', projectId: '', assignedUserId: '', deadline: '', priority: 'medium' });

  // Auto-complete project states
  const [projectToComplete, setProjectToComplete] = useState<Project | null>(null);
  const [ignoredProjects, setIgnoredProjects] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const completedActive = projects.find(p => p.status === 'active' && p.progress === 100 && !ignoredProjects.has(p.id));
    if (completedActive && !projectToComplete) {
      setProjectToComplete(completedActive);
    }
  }, [projects, ignoredProjects, projectToComplete]);

  const handleCompleteProject = async () => {
    if (!projectToComplete) return;
    try {
      await updateDoc(doc(db, 'projects', projectToComplete.id), { status: 'completed' });
      setProjectToComplete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIgnoreProject = () => {
    if (!projectToComplete) return;
    setIgnoredProjects(prev => new Set(prev).add(projectToComplete.id));
    setProjectToComplete(null);
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    }, (err) => console.error(err));

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    }, (err) => console.error(err));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
    }, (err) => console.error(err));

    const unsubNotifs = onSnapshot(query(collection(db, 'notifications'), where('read', '==', false)), (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    }, (err) => console.error(err));

    return () => {
      unsubProjects();
      unsubTasks();
      unsubUsers();
      unsubNotifs();
    };
  }, []);

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      console.error(err);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'active');
  const avgProgress = activeProjects.length > 0 
    ? activeProjects.reduce((acc, p) => acc + p.progress, 0) / activeProjects.length 
    : 0;

  return (
    <div className="flex gap-8 h-full">
      <div className="flex-1 space-y-8 overflow-y-auto pr-4">
        {/* Global Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-8">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${avgProgress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{Math.round(avgProgress)}%</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Global</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white mb-2">Command Center Overview</h3>
            <p className="text-slate-400 max-w-md">
              Monitoring {activeProjects.length} active projects and {tasks.length} tasks.
              Keep an eye on installation dates highlighted in red.
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Projects</h3>
            <Link 
              to="/admin/create-project" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map(project => {
              const installDate = project.installationDate.toDate();
              const isUrgent = isBefore(installDate, addHours(now, 24));
              
              return (
                <div 
                  key={project.id} 
                  onClick={() => navigate(`/admin/projects/${project.id}`)}
                  className={`bg-slate-900 border rounded-xl p-5 relative overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors ${isUrgent ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-800'}`}
                >
                  {isUrgent && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full" />}
                  <h4 className="text-lg font-semibold text-white mb-1">{project.name}</h4>
                  {project.customerName && (
                    <p className="text-sm text-slate-400 mb-3">{project.customerName}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium uppercase tracking-wider">
                      {project.status}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {installDate.toLocaleDateString()}
                    </span>
                    {project.assignedUsers && (
                      <span className="text-slate-400 flex items-center gap-1 ml-auto text-xs">
                        Team: {project.assignedUsers.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(project.progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 text-sm font-mono bg-slate-800/50 px-3 py-2 rounded-lg border ${isUrgent ? 'text-red-400 border-red-500/30' : 'text-slate-300 border-slate-700/50'}`}>
                    <Clock className="w-4 h-4" />
                    <span className="text-xs text-slate-500 uppercase tracking-wider mr-1">Time to Install:</span>
                    {formatCountdown(installDate, now)}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                    <Link 
                      to={`/projects/${project.id}/chat`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Group Chat
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <h3 className="text-lg font-semibold text-white">Task Management</h3>
            <Link 
              to="/admin/create-task" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Assigned To</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const user = users.find(u => u.uid === task.assignedUserId);
                  return (
                    <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">{task.title}</td>
                      <td className="px-4 py-3">{project?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                          {user?.displayName.charAt(0)}
                        </div>
                        {user?.displayName || 'Unknown'}
                      </td>
                      <td className="px-4 py-3">{task.deadline.toDate().toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                          task.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                          task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${task.progress}%` }} />
                          </div>
                          <span className="text-xs">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <div className="w-80 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Live Alerts</h3>
          <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {notifications.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500 text-center mt-4">No new alerts</p>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-sm">
                <p className="text-slate-200 mb-2">{notif.message}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}</span>
                  <button 
                    onClick={() => updateDoc(doc(db, 'notifications', notif.id), { read: true })}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Mark read
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {projectToComplete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Project Completed!</h2>
            <p className="text-slate-400 mb-8">
              All tasks for <span className="font-semibold text-white">"{projectToComplete.name}"</span> have reached 100%. Would you like to mark the entire project as completed?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleIgnoreProject}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Not Yet
              </button>
              <button
                onClick={handleCompleteProject}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
