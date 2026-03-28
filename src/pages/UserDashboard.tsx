import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Task, Project, WorkLog } from '../types';
import { Clock, MessageSquare, Send, CheckCircle2, Play, Square } from 'lucide-react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

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
import * as Slider from '@radix-ui/react-slider';

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

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    });

    // Find active work log (punched in, not punched out)
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
    await addDoc(collection(db, 'workLogs'), {
      userId: dbUser.uid,
      punchIn: Timestamp.now()
    });
  };

  const handlePunchOut = async () => {
    if (!activeLog) return;
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
  };

  const handleProgressChange = async (taskId: string, projectId: string, newProgress: number) => {
    // 1. Update Task
    await updateDoc(doc(db, 'tasks', taskId), { progress: newProgress });

    // 2. Recalculate Project Progress
    const allTasksSnap = await getDocs(query(collection(db, 'tasks'), where('projectId', '==', projectId)));
    const allTasks = allTasksSnap.docs.map(d => d.data() as Task);
    
    // Replace the updated task's progress in our calculation array
    const updatedTasks = allTasks.map(t => t.id === taskId ? { ...t, progress: newProgress } : t);
    
    const totalProgress = updatedTasks.reduce((acc, t) => acc + t.progress, 0);
    const avgProgress = updatedTasks.length > 0 ? totalProgress / updatedTasks.length : 0;

    await updateDoc(doc(db, 'projects', projectId), { progress: avgProgress });

    // 3. Notify Admin
    await addDoc(collection(db, 'notifications'), {
      message: `${dbUser?.displayName} updated task progress to ${newProgress}%`,
      createdAt: Timestamp.now(),
      read: false,
      type: 'task_update'
    });
  };

  const handleSendNote = async (taskId: string) => {
    const note = notes[taskId];
    if (!note) return;

    await updateDoc(doc(db, 'tasks', taskId), { notes: note });
    
    await addDoc(collection(db, 'notifications'), {
      message: `${dbUser?.displayName} added a note: "${note}"`,
      createdAt: Timestamp.now(),
      read: false,
      type: 'message'
    });

    setNotes(prev => ({ ...prev, [taskId]: '' }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Time Clock */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeLog ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Time Clock</h3>
            <p className="text-sm text-slate-400">
              {activeLog 
                ? `Punched in at ${activeLog.punchIn.toDate().toLocaleTimeString()}` 
                : 'You are currently punched out'}
            </p>
          </div>
        </div>
        <button
          onClick={activeLog ? handlePunchOut : handlePunchIn}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeLog 
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
          }`}
        >
          {activeLog ? (
            <><Square className="w-5 h-5 fill-current" /> Punch Out</>
          ) : (
            <><Play className="w-5 h-5 fill-current" /> Punch In</>
          )}
        </button>
      </div>

      {/* Task Cards */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">My Assigned Tasks</h2>
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
            <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">You have no assigned tasks right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              const deadline = task.deadline.toDate();
              
              return (
                <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1 block">
                        {project?.name || 'Unknown Project'}
                      </span>
                      <h3 className="text-xl font-bold text-white">{task.title}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      task.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 bg-slate-800/50 py-2 px-3 rounded-lg border border-slate-700/50 w-fit">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="font-mono">
                      Due in {formatCountdown(deadline, now)}
                    </span>
                  </div>

                  <div className="mb-8 flex-1">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-slate-400 font-medium">Progress</span>
                      <span className="text-white font-bold">{task.progress}%</span>
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
                      <Slider.Track className="bg-slate-800 relative grow rounded-full h-2 overflow-hidden">
                        <Slider.Range className="absolute bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb
                        className="block w-6 h-6 bg-white shadow-[0_2px_10px] shadow-black/50 rounded-full hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all cursor-grab active:cursor-grabbing"
                        aria-label="Progress"
                      />
                    </Slider.Root>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-800">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Send status note to admin..."
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          value={notes[task.id] || ''}
                          onChange={(e) => setNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendNote(task.id)}
                        />
                      </div>
                      <button
                        onClick={() => handleSendNote(task.id)}
                        disabled={!notes[task.id]}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors flex items-center justify-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    {task.notes && (
                      <p className="text-xs text-slate-500 mt-3 flex items-start gap-2 bg-slate-800/30 p-2 rounded-lg">
                        <span className="font-semibold text-slate-400">Last Note:</span> {task.notes}
                      </p>
                    )}
                    
                    {project && (
                      <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                        <Link 
                          to={`/projects/${project.id}/chat`}
                          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Project Group Chat
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
