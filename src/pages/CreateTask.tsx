import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Project, User } from '../types';
import { ArrowLeft, Save, LayoutGrid, UserCheck, Clock, AlertTriangle, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

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
    sounds.play('click');
    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTask.title,
        projectId: newTask.projectId,
        assignedUserId: newTask.assignedUserId,
        deadline: Timestamp.fromDate(new Date(newTask.deadline)),
        priority: newTask.priority,
        progress: 0
      });
      sounds.play('success');
      navigate('/admin');
    } catch (err) {
      sounds.play('error');
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-10"
    >
      <div className="flex items-center gap-6">
        <Link 
          to="/admin" 
          onMouseEnter={() => sounds.play('hover')}
          onClick={() => sounds.play('click')}
          className="w-12 h-12 glass-dark hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-white/5 active:scale-90"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Initialize Task</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Operational Objective Deployment</p>
        </div>
      </div>

      <div className="glass-card rounded-[40px] p-10 border-white/5 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-brand-orange rounded-full" />
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Objective Parameters</h3>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Task Designation *</label>
              <div className="relative group">
                <LayoutGrid className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                <input 
                  type="text" 
                  required
                  placeholder="ENTER TASK TITLE..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Target Project *</label>
                <div className="relative group">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                  <select 
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all cursor-pointer"
                    value={newTask.projectId} 
                    onChange={e => setNewTask({...newTask, projectId: e.target.value})}
                  >
                    <option value="">SELECT MISSION</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Assigned Agent *</label>
                <div className="relative group">
                  <UserCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                  <select 
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all cursor-pointer disabled:opacity-30"
                    value={newTask.assignedUserId} 
                    onChange={e => setNewTask({...newTask, assignedUserId: e.target.value})}
                    disabled={!newTask.projectId || (!!newTask.projectId && filteredUsers.length === 0)}
                  >
                    {!newTask.projectId && <option value="">SELECT MISSION FIRST</option>}
                    {newTask.projectId && filteredUsers.length === 0 && <option value="">NO AGENTS DEPLOYED TO MISSION</option>}
                    {newTask.projectId && filteredUsers.length > 0 && <option value="">SELECT FIELD AGENT</option>}
                    {filteredUsers.map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Execution Deadline *</label>
                <div className="relative group">
                  <Clock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                    value={newTask.deadline} 
                    onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Priority Level *</label>
                <div className="relative group">
                  <AlertTriangle className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                  <select 
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all cursor-pointer"
                    value={newTask.priority} 
                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="low">LOW PRIORITY</option>
                    <option value="medium">MEDIUM PRIORITY</option>
                    <option value="high">HIGH PRIORITY</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex justify-end gap-6">
            <Link 
              to="/admin"
              onMouseEnter={() => sounds.play('hover')}
              onClick={() => sounds.play('click')}
              className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-all"
            >
              Abort
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              onMouseEnter={() => sounds.play('hover')}
              onClick={() => sounds.play('click')}
              className="bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-30 text-brand-dark px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(255,176,65,0.2)] active:scale-95 flex items-center gap-3"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'INITIALIZING...' : 'COMMIT OBJECTIVE'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
