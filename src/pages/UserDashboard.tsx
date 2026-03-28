import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Task, Project, WorkLog } from '../types';
import { Clock, MessageSquare, Send, CheckCircle2, Play, Square, Zap, Activity, LayoutGrid } from 'lucide-react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import * as Slider from '@radix-ui/react-slider';
import { sounds } from '../lib/sounds';

function formatCountdown(targetDate: Date, now: Date) {
  const diff = differenceInSeconds(targetDate, now);
  if (diff <= 0) return '00:00:00';
  
  const days = Math.floor(diff / (3600 * 24));
  const hours = Math.floor((diff % (3600 * 24)) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  
  if (days > 0) return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
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

export function UserDashboard() {
  const { dbUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeLog, setActiveLog] = useState<WorkLog | null>(null);
  const [now, setNow] = useState(new Date());
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!dbUser) return;

    const qTasks = query(collection(db, 'tasks'), where('assignedUserId', '==', dbUser.uid));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });

    const qProjects = query(collection(db, 'projects'), where('memberIds', 'array-contains', dbUser.uid));
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    });

    const qLogs = query(collection(db, 'workLogs'), where('userId', '==', dbUser.uid));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkLog));
      const active = logs.find(l => !l.punchOut);
      setActiveLog(active || null);
    });

    return () => {
      unsubTasks();
      unsubProjects();
      unsubLogs();
    };
  }, [dbUser]);

  const handlePunchIn = async () => {
    if (!dbUser) return;
    try {
      await addDoc(collection(db, 'workLogs'), {
        userId: dbUser.uid,
        punchIn: Timestamp.now()
      });
      sounds.play('success');
    } catch (err) {
      sounds.play('error');
      console.error(err);
    }
  };

  const handlePunchOut = async () => {
    if (!activeLog) return;
    try {
      const punchOut = Timestamp.now();
      const hours = (punchOut.toMillis() - activeLog.punchIn.toMillis()) / (1000 * 60 * 60);
      
      await updateDoc(doc(db, 'workLogs', activeLog.id), {
        punchOut,
        hours
      });

      if (hours > 8) {
        await addDoc(collection(db, 'notifications'), {
          message: `${dbUser?.displayName} logged overtime (${hours.toFixed(1)} hours).`,
          createdAt: Timestamp.now(),
          read: false,
          type: 'message'
        });
      }
      sounds.play('success');
    } catch (err) {
      sounds.play('error');
      console.error(err);
    }
  };

  const handleProgressChange = async (taskId: string, projectId: string, newProgress: number) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { progress: newProgress });

      const allTasksSnap = await getDocs(query(collection(db, 'tasks'), where('projectId', '==', projectId)));
      const allTasks = allTasksSnap.docs.map(d => d.data() as Task);
      const updatedTasks = allTasks.map(t => t.id === taskId ? { ...t, progress: newProgress } : t);
      const totalProgress = updatedTasks.reduce((acc, t) => acc + t.progress, 0);
      const avgProgress = updatedTasks.length > 0 ? totalProgress / updatedTasks.length : 0;

      await updateDoc(doc(db, 'projects', projectId), { progress: avgProgress });

      await addDoc(collection(db, 'notifications'), {
        message: `${dbUser?.displayName} updated task progress to ${newProgress}%`,
        createdAt: Timestamp.now(),
        read: false,
        type: 'task_update'
      });
      sounds.play('success');
    } catch (err) {
      sounds.play('error');
      console.error(err);
    }
  };

  const handleSendNote = async (taskId: string) => {
    const note = notes[taskId];
    if (!note) return;

    try {
      await updateDoc(doc(db, 'tasks', taskId), { notes: note });
      
      await addDoc(collection(db, 'notifications'), {
        message: `${dbUser?.displayName} added a note: "${note}"`,
        createdAt: Timestamp.now(),
        read: false,
        type: 'message'
      });

      setNotes(prev => ({ ...prev, [taskId]: '' }));
      sounds.play('success');
    } catch (err) {
      sounds.play('error');
      console.error(err);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto space-y-10"
    >
      {/* Time Clock */}
      <motion.div variants={itemVariants} className="glass-card rounded-[40px] p-8 flex items-center justify-between relative overflow-hidden group">
        <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-10 transition-opacity" />
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <Clock className="w-24 h-24 text-brand-orange" />
        </div>
        <div className="flex items-center gap-6 relative">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${activeLog ? 'bg-green-500/20 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)]' : 'bg-white/5 text-slate-500'}`}>
            <Clock className={`w-8 h-8 ${activeLog ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Time Tracking</h3>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
              {activeLog 
                ? `Active Session: ${activeLog.punchIn.toDate().toLocaleTimeString()}` 
                : 'System Standby'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            sounds.play('click');
            activeLog ? handlePunchOut() : handlePunchIn();
          }}
          onMouseEnter={() => sounds.play('hover')}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all relative overflow-hidden ${
            activeLog 
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
              : 'bg-brand-orange text-brand-dark hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,176,65,0.3)]'
          }`}
        >
          {activeLog ? (
            <><Square className="w-4 h-4 fill-current" /> End Shift</>
          ) : (
            <><Play className="w-4 h-4 fill-current" /> Start Shift</>
          )}
        </button>
      </motion.div>

      {/* Task Cards */}
      <div className="space-y-8">
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <div className="w-2 h-8 bg-brand-blue rounded-full" />
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Operational Tasks</h2>
          <span className="bg-white/5 text-slate-500 px-3 py-1 rounded-lg text-xs font-black">{tasks.length}</span>
        </motion.div>

        {tasks.length === 0 ? (
          <motion.div 
            variants={itemVariants}
            className="text-center py-20 glass-card rounded-[40px] border-dashed border-white/10"
          >
            <CheckCircle2 className="w-16 h-16 text-slate-700 mx-auto mb-6" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">All clear. No active assignments.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {tasks.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                const deadline = task.deadline.toDate();
                
                return (
                  <motion.div 
                    layout
                    key={task.id} 
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    onMouseEnter={() => sounds.play('hover')}
                    className="glass-card rounded-[40px] p-8 flex flex-col relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Activity className="w-20 h-20 text-brand-blue" />
                    </div>

                    <div className="flex justify-between items-start mb-6 relative">
                      <div className="flex-1 min-w-0 pr-4">
                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em] mb-2 block">
                          {project?.name || 'Unknown Project'}
                        </span>
                        <h3 className="text-xl font-black text-white leading-tight group-hover:text-brand-orange transition-colors">{task.title}</h3>
                      </div>
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0 ${
                        task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                      }`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono glass-dark py-3 px-4 rounded-2xl border border-white/5 w-fit mb-8">
                      <Clock className="w-4 h-4 text-brand-orange" />
                      <span className="font-bold text-slate-300 uppercase tracking-tighter">
                        Deadline: {formatCountdown(deadline, now)}
                      </span>
                    </div>

                    <div className="mb-10 flex-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-4">
                        <span className="text-slate-500">Execution Progress</span>
                        <span className="text-brand-orange">{task.progress}%</span>
                      </div>
                      <Slider.Root
                        className="relative flex items-center select-none touch-none w-full h-5"
                        value={[task.progress]}
                        max={100}
                        step={5}
                        onValueChange={(val) => {
                          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress: val[0] } : t));
                        }}
                        onValueCommit={(val) => handleProgressChange(task.id, task.projectId, val[0])}
                      >
                        <Slider.Track className="bg-white/5 relative grow rounded-full h-2 overflow-hidden">
                          <Slider.Range className="absolute bg-gradient-to-r from-brand-blue to-brand-orange rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb
                          className="block w-6 h-6 bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)] rounded-full hover:scale-110 focus:outline-none transition-all cursor-grab active:cursor-grabbing"
                          aria-label="Progress"
                        />
                      </Slider.Root>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Operational note..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange/30 transition-all font-medium"
                            value={notes[task.id] || ''}
                            onChange={(e) => setNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendNote(task.id)}
                          />
                        </div>
                        <button
                          onClick={() => {
                            sounds.play('click');
                            handleSendNote(task.id);
                          }}
                          onMouseEnter={() => sounds.play('hover')}
                          disabled={!notes[task.id]}
                          className="bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-30 disabled:grayscale text-white p-3.5 rounded-2xl transition-all shadow-lg active:scale-95"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {task.notes && (
                        <div className="bg-white/2 p-3 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Latest Intelligence</p>
                          <p className="text-xs text-slate-300 font-medium italic">"{task.notes}"</p>
                        </div>
                      )}
                      
                      {project && (
                        <div className="flex gap-3">
                          <Link 
                            to={`/projects/${project.id}`}
                            onMouseEnter={() => sounds.play('hover')}
                            onClick={() => sounds.play('click')}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl glass-dark text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                          >
                            <LayoutGrid className="w-4 h-4" />
                            Mission Details
                          </Link>
                          <Link 
                            to={`/projects/${project.id}/chat`}
                            onMouseEnter={() => sounds.play('hover')}
                            onClick={() => sounds.play('click')}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl glass-dark text-[10px] font-black uppercase tracking-widest text-brand-orange hover:bg-brand-orange/10 transition-all"
                          >
                            <Zap className="w-4 h-4" />
                            Project Secure Chat
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
