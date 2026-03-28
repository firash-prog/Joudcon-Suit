import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Message, Project } from '../types';
import { ArrowLeft, Send, MessageSquare, Shield, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

export function ProjectChat() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, dbUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId || !user || !dbUser) return;

    const fetchProject = async () => {
      try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const projData = { id: docSnap.id, ...docSnap.data() } as Project;
          setProject(projData);
          
          const isPM = projData.projectManagerId === user.uid;
          const isCoord = projData.coordinatorIds?.includes(user.uid);
          const isAssigned = projData.assignedUsers?.includes(user.uid);
          const isAdmin = dbUser.role === 'admin';
          
          if (!isPM && !isCoord && !isAssigned && !isAdmin) {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error(err);
        navigate('/');
      }
    };

    fetchProject();

    const q = query(
      collection(db, 'messages'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching messages:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [projectId, user, dbUser, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !projectId || !user || !dbUser) return;

    const text = newMessage.trim();
    setNewMessage('');
    sounds.play('click');

    try {
      await addDoc(collection(db, 'messages'), {
        projectId,
        userId: user.uid,
        userName: dbUser.displayName,
        text,
        createdAt: Timestamp.now()
      });

      sounds.play('success');

      if (dbUser.role !== 'admin') {
        await addDoc(collection(db, 'notifications'), {
          message: `New message from ${dbUser.displayName} in project "${project?.name || 'Unknown'}"`,
          createdAt: Timestamp.now(),
          read: false,
          type: 'message'
        });
      }
    } catch (err) {
      sounds.play('error');
      console.error("Error sending message:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto glass-card rounded-[40px] overflow-hidden border-white/5 shadow-2xl relative group"
    >
      <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
          <Link 
            to={dbUser?.role === 'admin' ? `/admin/projects/${projectId}` : '/dashboard'} 
            onMouseEnter={() => sounds.play('hover')}
            onClick={() => sounds.play('click')}
            className="w-10 h-10 glass-dark hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-white/5 active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">{project?.name || 'Secure Channel'}</h2>
              <span className="px-2 py-0.5 rounded-lg bg-brand-blue/10 text-brand-blue text-[8px] font-black uppercase tracking-widest border border-brand-blue/20">
                Encrypted
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
              <Shield className="w-3 h-3 text-brand-orange" />
              Strategic Group Communication
            </p>
          </div>
        </div>
        <div className="flex -space-x-3">
          {messages.slice(-3).map((msg, i) => (
            <div key={i} className="w-8 h-8 rounded-xl bg-brand-dark border-2 border-brand-surface flex items-center justify-center text-[10px] font-black text-brand-orange">
              {msg.userName.charAt(0).toUpperCase()}
            </div>
          ))}
          {messages.length > 3 && (
            <div className="w-8 h-8 rounded-xl bg-brand-surface border-2 border-brand-surface flex items-center justify-center text-[10px] font-black text-white">
              +{messages.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-brand-dark/20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20">
            <MessageSquare className="w-16 h-16 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No intelligence shared in this sector</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.userId === user?.uid;
            const showName = index === 0 || messages[index - 1].userId !== msg.userId;
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {showName && (
                  <span className={`text-[9px] font-black uppercase tracking-widest mb-2 px-2 flex items-center gap-2 ${isMe ? 'text-brand-orange' : 'text-brand-blue'}`}>
                    <User className="w-3 h-3" />
                    {isMe ? 'SELF' : msg.userName}
                  </span>
                )}
                <div 
                  className={`max-w-[75%] px-6 py-4 rounded-[24px] shadow-lg relative group ${
                    isMe 
                      ? 'bg-brand-blue text-white rounded-tr-none' 
                      : 'glass-dark text-slate-200 rounded-tl-none border border-white/5'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed">{msg.text}</p>
                  <div className={`absolute bottom-2 ${isMe ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono">
                      {msg.createdAt ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </span>
                  </div>
                </div>
                {!showName && (
                   <span className="text-[8px] font-black text-slate-700 mt-1 px-2 font-mono">
                    {msg.createdAt ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                )}
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-8 border-t border-white/5 bg-white/2">
        <form onSubmit={handleSendMessage} className="flex gap-4">
          <div className="flex-1 relative group">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="TRANSMIT MESSAGE..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all placeholder:text-slate-600"
            />
          </div>
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            onMouseEnter={() => sounds.play('hover')}
            onClick={() => sounds.play('click')}
            className="bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-30 text-brand-dark px-8 py-4 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,176,65,0.2)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
