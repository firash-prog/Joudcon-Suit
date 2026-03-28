import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, collection, query, where, onSnapshot, deleteDoc, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Project, Task, User } from '../types';
import { ArrowLeft, Calendar, Users, Trash2, Plus, MessageSquare, Briefcase, UserCheck, Clock, CheckCircle2, LayoutGrid, Info, Edit3, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

export function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { dbUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newTask, setNewTask] = useState({ title: '', assignedUserId: '', deadline: '', priority: 'medium' });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    status: 'active' as 'active' | 'completed',
    installationDate: '',
    customerName: '',
    customerDetails: ''
  });

  const isAdmin = dbUser?.role === 'admin';
  const isPM = project?.projectManagerId === dbUser?.uid;
  const isCoordinator = project?.coordinatorIds?.includes(dbUser?.uid || '');
  const canEdit = isAdmin || isPM || isCoordinator || dbUser?.permissions?.canEditProjects;
  const canDelete = isAdmin || dbUser?.permissions?.canDeleteProjects;
  const canCreateTasks = isAdmin || dbUser?.permissions?.canCreateTasks;
  const canDeleteTasks = isAdmin || dbUser?.permissions?.canDeleteTasks;

  useEffect(() => {
    if (!projectId) return;
    const unsubProject = onSnapshot(doc(db, 'projects', projectId), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Project;
        setProject(data);
        setEditForm({
          name: data.name,
          status: data.status,
          installationDate: data.installationDate.toDate().toISOString().slice(0, 16),
          customerName: data.customerName || '',
          customerDetails: data.customerDetails || ''
        });
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

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !canEdit) return;
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        name: editForm.name,
        status: editForm.status,
        installationDate: Timestamp.fromDate(new Date(editForm.installationDate)),
        customerName: editForm.customerName,
        customerDetails: editForm.customerDetails
      });
      sounds.play('success');
      setIsEditing(false);
    } catch (err) {
      sounds.play('error');
      console.error(err);
    }
  };

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
      sounds.play('success');
      setNewTask({ title: '', assignedUserId: '', deadline: '', priority: 'medium' });
    } catch (err) {
      sounds.play('error');
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    sounds.play('click');
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
        sounds.play('success');
      } catch (err) {
        sounds.play('error');
        console.error(err);
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId || !canDelete) return;
    sounds.play('click');
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'projects', projectId));
        sounds.play('success');
        navigate(isAdmin ? "/admin" : "/dashboard");
      } catch (err) {
        sounds.play('error');
        console.error(err);
      }
    }
  };

  if (!project) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
    </div>
  );

  const projectUserIds = new Set<string>();
  if (project.projectManagerId) projectUserIds.add(project.projectManagerId);
  if (project.coordinatorIds) project.coordinatorIds.forEach(id => projectUserIds.add(id));
  if (project.assignedUsers) project.assignedUsers.forEach(id => projectUserIds.add(id));
  const projectUsers = users.filter(u => projectUserIds.has(u.uid));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-10"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link 
            to={isAdmin ? "/admin" : "/dashboard"} 
            onMouseEnter={() => sounds.play('hover')}
            onClick={() => sounds.play('click')}
            className="w-12 h-12 glass-dark hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-white/5 active:scale-90"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{project.name}</h1>
              <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                project.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
              }`}>
                {project.status}
              </span>
            </div>
            {project.customerName && (
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-3 h-3 text-brand-orange" />
                Strategic Client: {project.customerName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {canEdit && (
            <button 
              onClick={() => {
                sounds.play('click');
                setIsEditing(!isEditing);
              }}
              onMouseEnter={() => sounds.play('hover')}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border border-white/5 active:scale-90 ${
                isEditing ? 'bg-brand-orange text-brand-dark' : 'glass-dark text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-6 h-6" />
            </button>
          )}
          {canDelete && (
            <button 
              onClick={handleDeleteProject}
              onMouseEnter={() => sounds.play('hover')}
              className="w-12 h-12 glass-dark hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-2xl flex items-center justify-center transition-all border border-white/5 active:scale-90"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          )}
          <Link 
            to={`/projects/${project.id}/chat`}
            onMouseEnter={() => sounds.play('hover')}
            onClick={() => sounds.play('click')}
            className="bg-brand-blue hover:bg-brand-blue/90 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,122,255,0.2)]"
          >
            <MessageSquare className="w-5 h-5" />
            Secure Group Chat
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Edit Project Section */}
          <AnimatePresence>
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card rounded-[40px] p-8 border-brand-orange/20 overflow-hidden"
              >
                <form onSubmit={handleUpdateProject} className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Modify Mission Parameters</h3>
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mission Designation</label>
                      <input 
                        type="text"
                        required
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-orange/30 transition-all"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Operational Status</label>
                      <select 
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-orange/30 transition-all"
                        value={editForm.status}
                        onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                      >
                        <option value="active">ACTIVE</option>
                        <option value="completed">COMPLETED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Deployment Deadline</label>
                      <input 
                        type="datetime-local"
                        required
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-orange/30 transition-all"
                        value={editForm.installationDate}
                        onChange={e => setEditForm({...editForm, installationDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Strategic Client</label>
                      <input 
                        type="text"
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-orange/30 transition-all"
                        value={editForm.customerName}
                        onChange={e => setEditForm({...editForm, customerName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Strategic Requirements</label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-orange/30 transition-all min-h-[100px]"
                      value={editForm.customerDetails}
                      onChange={e => setEditForm({...editForm, customerDetails: e.target.value})}
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <button 
                      type="submit"
                      className="bg-brand-orange text-brand-dark px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      Commit Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tasks Section */}
          <motion.div variants={itemVariants} className="glass-card rounded-[40px] p-8 border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 text-brand-orange" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Operational Tasks</h2>
              </div>
            </div>
            
            {/* Add Task Form */}
            {canCreateTasks && (
              <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 bg-white/2 p-6 rounded-[32px] border border-white/5">
                <div className="md:col-span-2">
                  <input 
                    type="text" 
                    placeholder="TASK OBJECTIVE..." 
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-orange/30 transition-all placeholder:text-slate-600"
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <select 
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-orange/30 transition-all cursor-pointer"
                    value={newTask.assignedUserId}
                    onChange={e => setNewTask({...newTask, assignedUserId: e.target.value})}
                  >
                    <option value="">ASSIGN AGENT</option>
                    {projectUsers.map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <input 
                    type="datetime-local" 
                    required
                    className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-orange/30 transition-all"
                    value={newTask.deadline}
                    onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                  />
                  <button 
                    type="submit" 
                    onMouseEnter={() => sounds.play('hover')}
                    onClick={() => sounds.play('click')}
                    className="bg-brand-orange hover:bg-brand-orange/90 text-brand-dark p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,176,65,0.2)]"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </form>
            )}

            {/* Task List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {tasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-slate-600 text-center py-20 border-2 border-dashed border-white/5 rounded-[32px]"
                  >
                    <Info className="w-10 h-10 mx-auto mb-4 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No operational tasks initialized</p>
                  </motion.div>
                ) : (
                  tasks.map(task => {
                    const assignee = users.find(u => u.uid === task.assignedUserId);
                    return (
                      <motion.div 
                        layout
                        key={task.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-dark border border-white/5 rounded-[32px] p-6 flex items-center justify-between group hover:border-brand-orange/20 transition-all"
                      >
                        <div className="flex-1">
                          <h4 className="font-black text-white uppercase tracking-tight text-lg mb-2 group-hover:text-brand-orange transition-colors">{task.title}</h4>
                          <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl">
                              <UserCheck className="w-3.5 h-3.5 text-brand-blue" /> 
                              {assignee?.displayName || 'UNASSIGNED'}
                            </span>
                            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl">
                              <Clock className="w-3.5 h-3.5 text-brand-orange" /> 
                              {task.deadline.toDate().toLocaleDateString()}
                            </span>
                            <span className={`px-3 py-1.5 rounded-xl border ${
                              task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              task.priority === 'medium' ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20' :
                              'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-10">
                          <div className="text-right">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Execution</span>
                            <span className="text-xl font-black text-white font-mono">{task.progress}%</span>
                          </div>
                          <button 
                            onClick={() => {
                              if (canDeleteTasks) {
                                sounds.play('click');
                                handleDeleteTask(task.id);
                              }
                            }}
                            onMouseEnter={() => sounds.play('hover')}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all opacity-0 group-hover:opacity-100 ${
                              canDeleteTasks ? 'text-slate-600 hover:text-red-400 hover:bg-red-400/10' : 'hidden'
                            }`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Details */}
        <div className="space-y-10">
          <motion.div variants={itemVariants} className="glass-card rounded-[40px] p-8 border-white/5">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-brand-orange rounded-full" />
              Strategic Intelligence
            </h3>
            <div className="space-y-8">
              <div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3">Operational Status</span>
                <span className="px-4 py-2 rounded-2xl bg-brand-blue/10 text-brand-blue text-[10px] font-black uppercase tracking-[0.2em] border border-brand-blue/20">
                  {project.status}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3">Global Completion</span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black text-white uppercase tracking-widest">
                    <span>Progress Matrix</span>
                    <span className="font-mono">{Math.round(project.progress)}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-brand-blue to-brand-orange rounded-full shadow-[0_0_10px_rgba(0,122,255,0.3)]"
                    />
                  </div>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3">Deployment Deadline</span>
                <div className="flex items-center gap-3 text-white font-black text-sm uppercase tracking-tight">
                  <Calendar className="w-5 h-5 text-brand-orange" />
                  {project.installationDate.toDate().toLocaleString()}
                </div>
              </div>
              {project.customerDetails && (
                <div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3">Strategic Requirements</span>
                  <div className="glass-dark p-5 rounded-[24px] border border-white/5">
                    <p className="text-xs text-slate-400 font-bold leading-relaxed whitespace-pre-wrap">{project.customerDetails}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card rounded-[40px] p-8 border-white/5">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-brand-blue rounded-full" />
              Assigned Personnel
            </h3>
            <div className="space-y-8">
              {project.projectManagerId && (
                <div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3">Project Director</span>
                  <div className="flex items-center gap-3 text-white font-black text-sm uppercase tracking-tight">
                    <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange text-[10px]">PM</div>
                    {users.find(u => u.uid === project.projectManagerId)?.displayName || 'UNKNOWN'}
                  </div>
                </div>
              )}
              {project.coordinatorIds && project.coordinatorIds.length > 0 && (
                <div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3">Strategic Coordinators</span>
                  <div className="flex flex-wrap gap-2">
                    {project.coordinatorIds.map(id => {
                      const u = users.find(u => u.uid === id);
                      return u ? (
                        <div key={id} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {u.displayName}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {project.assignedUsers && project.assignedUsers.length > 0 && (
                <div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3">Field Agents</span>
                  <div className="flex flex-wrap gap-2">
                    {project.assignedUsers.map(id => {
                      const u = users.find(u => u.uid === id);
                      return u ? (
                        <div key={id} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {u.displayName}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
