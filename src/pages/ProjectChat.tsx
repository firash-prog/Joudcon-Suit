import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Message, Project } from '../types';
import { ArrowLeft, Send } from 'lucide-react';

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
          
          // Check access
          const isPM = projData.projectManagerId === user.uid;
          const isCoord = projData.coordinatorIds?.includes(user.uid);
          const isAssigned = projData.assignedUsers?.includes(user.uid);
          const isAdmin = dbUser.role === 'admin';
          
          if (!isPM && !isCoord && !isAssigned && !isAdmin) {
            navigate('/'); // Redirect if no access
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

    try {
      await addDoc(collection(db, 'messages'), {
        projectId,
        userId: user.uid,
        userName: dbUser.displayName,
        text,
        createdAt: Timestamp.now()
      });

      // Notify admins
      if (dbUser.role !== 'admin') {
        await addDoc(collection(db, 'notifications'), {
          message: `New message from ${dbUser.displayName} in project "${project?.name || 'Unknown'}"`,
          createdAt: Timestamp.now(),
          read: false,
          type: 'message'
        });
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-400">Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-4">
        <Link to={dbUser?.role === 'admin' ? '/admin' : '/dashboard'} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-white">{project?.name || 'Project Chat'}</h2>
          <p className="text-xs text-slate-400">Group Chat</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === user?.uid;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-slate-500 mb-1 px-1">{isMe ? 'You' : msg.userName}</span>
                <div 
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-600 mt-1 px-1">
                  {msg.createdAt ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-4 py-3 rounded-xl flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
