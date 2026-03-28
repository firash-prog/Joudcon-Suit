import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../firebase';
import { User, Role } from '../types';
import { Users, Plus, Edit2, Trash2, Shield, User as UserIcon, X, Search, AlertCircle, Key, Mail, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize a secondary app for creating users without logging out the admin
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setRole('user');
    setEditingUser(null);
    setIsModalOpen(false);
    setError('');
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEmail(user.email);
    setDisplayName(user.displayName);
    setRole(user.role);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.uid), {
          displayName,
          role
        });
      } else {
        if (!password || password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        await signOut(secondaryAuth);
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          displayName,
          role
        });
      }
      sounds.play('success');
      resetForm();
    } catch (err: any) {
      sounds.play('error');
      console.error("Error saving user:", err);
      setError(err.message || "An error occurred while saving the user.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (window.confirm('Are you sure you want to delete this user profile? Note: This does not delete their authentication record.')) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        sounds.play('success');
      } catch (err) {
        sounds.play('error');
        console.error("Error deleting user:", err);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-brand-orange rounded-full" />
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              Access Control
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Personnel & Permission Management</p>
          </div>
        </div>
        <button 
          onClick={() => {
            sounds.play('click');
            setIsModalOpen(true);
          }}
          onMouseEnter={() => sounds.play('hover')}
          className="bg-brand-orange hover:bg-brand-orange/90 text-brand-dark px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,176,65,0.2)]"
        >
          <Plus className="w-5 h-5" />
          Initialize Agent
        </button>
      </div>

      <div className="glass-card rounded-[40px] overflow-hidden border-white/5">
        <div className="p-8 border-b border-white/5 bg-white/2 relative overflow-hidden">
          <div className="absolute inset-0 shimmer-bg opacity-5 pointer-events-none" />
          <div className="relative max-w-lg group">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-orange transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH PERSONNEL DATABASE..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-orange/30 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/2 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Agent Identity</th>
                <th className="px-8 py-5">Communication Channel</th>
                <th className="px-8 py-5">Clearance Level</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredUsers.length === 0 ? (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Users className="w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No personnel records found</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  filteredUsers.map(user => (
                    <motion.tr 
                      layout
                      key={user.uid} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onMouseEnter={() => sounds.play('hover')}
                      className="hover:bg-white/2 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4 relative">
                          <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue font-black text-xs border border-brand-blue/20 relative overflow-hidden group-hover:border-brand-orange/40 transition-colors">
                            <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-20 transition-opacity" />
                            <span className="relative z-10">{user.displayName.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="font-black text-white group-hover:text-brand-orange transition-colors uppercase tracking-tight">{user.displayName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.email}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                          user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                        }`}>
                          {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              sounds.play('click');
                              handleOpenEdit(user);
                            }}
                            onMouseEnter={() => sounds.play('hover')}
                            className="p-2 text-slate-500 hover:text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              sounds.play('click');
                              handleDelete(user.uid);
                            }}
                            onMouseEnter={() => sounds.play('hover')}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
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
              className="glass-card rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col border-white/5"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                    {editingUser ? 'Update Clearance' : 'New Agent Registry'}
                  </h2>
                </div>
                <button onClick={resetForm} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Operational Call Sign *</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                      placeholder="ENTER AGENT NAME"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Communication Channel *</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                    <input 
                      type="email" 
                      required
                      disabled={!!editingUser}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      placeholder="AGENT EMAIL"
                    />
                  </div>
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Security Key *</label>
                    <div className="relative group">
                      <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                        placeholder="MIN 6 CHARACTERS"
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Clearance Level *</label>
                  <select 
                    value={role}
                    onChange={e => setRole(e.target.value as Role)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all cursor-pointer"
                  >
                    <option value="user">Standard Agent</option>
                    <option value="admin">Strategic Admin</option>
                  </select>
                </div>

                <div className="pt-6 flex justify-end gap-4">
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-30 text-brand-dark px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(255,176,65,0.2)] active:scale-95"
                  >
                    {loading ? 'Processing...' : editingUser ? 'Update Registry' : 'Initialize Agent'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
