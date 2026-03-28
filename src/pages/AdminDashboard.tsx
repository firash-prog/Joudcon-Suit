import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, updateDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Project, Task, User, Notification } from '../types';
import { Plus, Trash2, AlertCircle, Clock, Calendar, CheckCircle2, MessageSquare, TrendingUp, Activity, Zap, Bell } from 'lucide-react';
import { formatDistanceToNow, isBefore, addHours, differenceInSeconds } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [now, setNow] = useState(new Date());

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
      sounds.play('success');
      setProjectToComplete(null);
    } catch (err) {
      sounds.play('error');
      console.error(err);
    }
  };

  const handleIgnoreProject = () => {
    if (!projectToComplete) return;
    sounds.play('click');
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
      sounds.play('success');
    } catch (err) {
      sounds.play('error');
      console.error(err);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'active');
  const avgProgress = activeProjects.length > 0 
    ? activeProjects.reduce((acc, p) => acc + p.progress, 0) / activeProjects.length 
    : 0;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex gap-8 h-full"
    >
      <div className="flex-1 space-y-8 overflow-y-auto pr-4 custom-scrollbar">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-10 transition-opacity" />
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-16 h-16 text-brand-blue" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Active Projects</p>
            <h4 className="text-4xl font-black text-white group-hover:text-brand-blue transition-colors">{activeProjects.length}</h4>
            <div className="mt-4 flex items-center gap-2 text-xs text-brand-blue font-bold">
              <div className="w-2 h-2 bg-brand-blue rounded-full animate-pulse" />
              <span>Real-time tracking enabled</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-10 transition-opacity" />
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-16 h-16 text-brand-orange" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pending Tasks</p>
            <h4 className="text-4xl font-black text-white group-hover:text-brand-orange transition-colors">{tasks.filter(t => t.progress < 100).length}</h4>
            <div className="mt-4 flex items-center gap-2 text-xs text-brand-orange font-bold">
              <div className="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />
              <span>{tasks.filter(t => t.priority === 'high').length} high priority</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-10 transition-opacity" />
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Avg. Progress</p>
            <h4 className="text-4xl font-black text-white group-hover:text-green-500 transition-colors">{Math.round(avgProgress)}%</h4>
            <div className="mt-4 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${avgProgress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-brand-blue via-brand-orange to-green-500"
              />
            </div>
          </motion.div>
        </div>

        {/* Projects Grid */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-brand-orange rounded-full" />
              <h3 className="text-xl font-black text-white tracking-tight uppercase">Active Projects</h3>
            </div>
            <Link 
              to="/admin/create-project" 
              onMouseEnter={() => sounds.play('hover')}
              onClick={() => sounds.play('click')}
              className="bg-brand-orange hover:bg-brand-orange/90 text-brand-dark px-6 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,176,65,0.2)]"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {activeProjects.map(project => {
                const installDate = project.installationDate.toDate();
                const isUrgent = isBefore(installDate, addHours(now, 24));
                
                return (
                  <motion.div 
                    layout
                    key={project.id} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    onMouseEnter={() => sounds.play('hover')}
                    onClick={() => {
                      sounds.play('click');
                      navigate(`/admin/projects/${project.id}`);
                    }}
                    className={`glass-card rounded-3xl p-6 relative overflow-hidden cursor-pointer transition-all duration-300 group ${isUrgent ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'hover:border-brand-orange/30'}`}
                  >
                    {isUrgent && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full animate-pulse" />
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-black text-white group-hover:text-brand-orange transition-colors">{project.name}</h4>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{project.customerName || 'Private Client'}</p>
                      </div>
                      <div className={`p-2 rounded-xl glass ${isUrgent ? 'text-red-400' : 'text-brand-blue'}`}>
                        <Zap className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                          <span>Execution Status</span>
                          <span className="text-brand-orange">{Math.round(project.progress)}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${isUrgent ? 'bg-red-500' : 'bg-brand-blue'}`}
                          />
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 text-sm font-mono glass-dark px-4 py-3 rounded-2xl border ${isUrgent ? 'text-red-400 border-red-500/20' : 'text-slate-300 border-white/5'}`}>
                        <Clock className={`w-4 h-4 ${isUrgent ? 'animate-pulse' : ''}`} />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Installation Countdown</span>
                          <span className="font-bold">{formatCountdown(installDate, now)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex -space-x-2">
                          {project.assignedUsers?.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-7 h-7 rounded-full border-2 border-brand-dark bg-brand-blue/20 flex items-center justify-center text-[10px] font-bold text-brand-blue">
                              {i + 1}
                            </div>
                          ))}
                          {project.assignedUsers && project.assignedUsers.length > 3 && (
                            <div className="w-7 h-7 rounded-full border-2 border-brand-dark bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              +{project.assignedUsers.length - 3}
                            </div>
                          )}
                        </div>
                        <Link 
                          to={`/projects/${project.id}/chat`}
                          onMouseEnter={() => sounds.play('hover')}
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.play('click');
                          }}
                          className="p-2 rounded-xl glass hover:bg-brand-orange/10 hover:text-brand-orange transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Tasks Table */}
        <motion.div variants={itemVariants} className="glass-card rounded-3xl overflow-hidden border-white/5">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-brand-blue" />
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Task Matrix</h3>
            </div>
            <Link 
              to="/admin/create-task" 
              onMouseEnter={() => sounds.play('hover')}
              onClick={() => sounds.play('click')}
              className="text-xs font-black text-brand-blue hover:text-brand-orange transition-colors uppercase tracking-widest flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Task
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/2 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Assigned</th>
                  <th className="px-6 py-4">Deadline</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const user = users.find(u => u.uid === task.assignedUserId);
                  return (
                    <tr key={task.id} className="hover:bg-white/2 transition-colors group">
                      <td className="px-6 py-4 font-bold text-white">{task.title}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{project?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-brand-blue/20 flex items-center justify-center text-[10px] font-black text-brand-blue border border-brand-blue/20">
                            {user?.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-slate-300">{user?.displayName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                        {task.deadline.toDate().toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-blue rounded-full" style={{ width: `${task.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-slate-500">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteTask(task.id)} 
                          onMouseEnter={() => sounds.play('hover')}
                          className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Notifications Panel */}
      <motion.div 
        variants={itemVariants}
        className="w-80 glass-card rounded-3xl flex flex-col overflow-hidden shrink-0 border-white/5"
      >
        <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-brand-orange" />
            <h3 className="font-black text-white uppercase tracking-tight">Live Alerts</h3>
          </div>
          <span className="bg-brand-orange text-brand-dark text-[10px] font-black px-2 py-1 rounded-lg shadow-[0_0_10px_rgba(255,176,65,0.3)]">
            {notifications.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-slate-500 text-center mt-8 font-bold uppercase tracking-widest"
              >
                No critical alerts
              </motion.p>
            ) : (
              notifications.map(notif => (
                  <motion.div 
                    layout
                    key={notif.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-dark border border-white/5 rounded-2xl p-4 group hover:border-brand-orange/20 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-orange/40" />
                    <p className="text-xs text-slate-300 leading-relaxed mb-3 font-medium">{notif.message}</p>
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                      </span>
                      <button 
                        onClick={() => {
                          sounds.play('click');
                          updateDoc(doc(db, 'notifications', notif.id), { read: true });
                        }}
                        onMouseEnter={() => sounds.play('hover')}
                        className="text-brand-blue hover:text-brand-orange transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Clear
                      </button>
                    </div>
                  </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Completion Modal */}
      <AnimatePresence>
        {projectToComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-dark/80 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center border-brand-orange/20"
            >
              <div className="w-20 h-20 bg-brand-orange/10 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-float">
                <CheckCircle2 className="w-10 h-10 text-brand-orange" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Mission Accomplished</h2>
              <p className="text-slate-400 mb-10 text-sm leading-relaxed">
                All operational targets for <span className="text-brand-orange font-black italic">"{projectToComplete.name}"</span> have been met. Finalize project status?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleIgnoreProject}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 bg-white/5 hover:bg-white/10 transition-all"
                >
                  Stand By
                </button>
                <button
                  onClick={handleCompleteProject}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-brand-dark bg-brand-orange hover:bg-brand-orange/90 transition-all shadow-[0_0_20px_rgba(255,176,65,0.3)]"
                >
                  Complete Mission
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
