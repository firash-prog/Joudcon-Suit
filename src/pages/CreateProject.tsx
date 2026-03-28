import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, Timestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Customer } from '../types';
import { ArrowLeft, Check, ChevronDown, User as UserIcon, Users as UsersIcon, Briefcase, Calendar, Info, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

export function CreateProject() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newProject, setNewProject] = useState({
    name: '',
    customerName: '',
    customerDetails: '',
    installationDate: '',
    projectManagerId: '',
    coordinatorIds: [] as string[],
    assignedUsers: [] as string[]
  });

  const [isCoordinatorDropdownOpen, setIsCoordinatorDropdownOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const coordinatorDropdownRef = useRef<HTMLDivElement>(null);
  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
    });
    const unsubCustomers = onSnapshot(query(collection(db, 'customers'), orderBy('name', 'asc')), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    });
    return () => {
      unsubUsers();
      unsubCustomers();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (coordinatorDropdownRef.current && !coordinatorDropdownRef.current.contains(event.target as Node)) {
        setIsCoordinatorDropdownOpen(false);
      }
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
        setIsTeamDropdownOpen(false);
      }
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.installationDate) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'projects'), {
        name: newProject.name,
        status: 'active',
        installationDate: Timestamp.fromDate(new Date(newProject.installationDate)),
        progress: 0,
        projectManagerId: newProject.projectManagerId || null,
        coordinatorIds: newProject.coordinatorIds,
        assignedUsers: newProject.assignedUsers,
        customerName: newProject.customerName || null,
        customerDetails: newProject.customerDetails || null
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
      className="max-w-4xl mx-auto space-y-10"
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
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Initialize Project</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Strategic Mission Deployment</p>
        </div>
      </div>

      <div className="glass-card rounded-[40px] p-10 border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Rocket className="w-32 h-32 text-brand-orange" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
          
          {/* Project Details */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-brand-orange rounded-full" />
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Operational Parameters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Mission Designation *</label>
                <input 
                  type="text" 
                  required
                  placeholder="ENTER PROJECT NAME..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                  value={newProject.name} 
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Deployment Deadline *</label>
                <div className="relative group">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                    value={newProject.installationDate} 
                    onChange={e => setNewProject({...newProject, installationDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Customer Details */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-brand-blue rounded-full" />
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Strategic Client Intelligence</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              <div ref={customerDropdownRef} className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">CRM Registry Lookup</label>
                <div className="relative group">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                  <button
                    type="button"
                    onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-12 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all flex items-center justify-between"
                  >
                    <span className="truncate">
                      {newProject.customerName || "SELECT FROM INTELLIGENCE DATABASE"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isCustomerDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-full glass-dark border border-white/5 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar"
                      >
                        {customers.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setNewProject(prev => ({
                                ...prev,
                                customerName: c.name,
                                customerDetails: c.company ? `Company: ${c.company}\n${c.notes || ''}` : c.notes || ''
                              }));
                              setIsCustomerDropdownOpen(false);
                            }}
                            className="w-full text-left px-6 py-4 hover:bg-white/5 flex flex-col transition-colors border-b border-white/5 last:border-0"
                          >
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{c.name}</span>
                            {c.company && <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">{c.company}</span>}
                          </button>
                        ))}
                        {customers.length === 0 && (
                          <div className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest italic">No records in database</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Manual Designation</label>
                  <input 
                    type="text" 
                    placeholder="ENTER CLIENT NAME..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                    value={newProject.customerName} 
                    onChange={e => setNewProject({...newProject, customerName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Strategic Requirements</label>
                  <textarea 
                    rows={1}
                    placeholder="MISSION CONTEXT..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all resize-none min-h-[58px]"
                    value={newProject.customerDetails} 
                    onChange={e => setNewProject({...newProject, customerDetails: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Team Assignment */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-brand-orange rounded-full" />
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Personnel Deployment</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Project Manager */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Mission Director</label>
                <div className="relative group">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                  <select 
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all cursor-pointer"
                    value={newProject.projectManagerId} 
                    onChange={e => setNewProject({...newProject, projectManagerId: e.target.value})}
                  >
                    <option value="">SELECT DIRECTOR</option>
                    {users.map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                  </select>
                </div>
              </div>

              {/* Coordinators */}
              <div ref={coordinatorDropdownRef}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Strategic Coordinators</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCoordinatorDropdownOpen(!isCoordinatorDropdownOpen)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all flex items-center justify-between"
                  >
                    <span className="truncate">
                      {newProject.coordinatorIds.length === 0 
                        ? "SELECT COORDINATORS" 
                        : `${newProject.coordinatorIds.length} AGENTS DEPLOYED`}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isCoordinatorDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isCoordinatorDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-full glass-dark border border-white/5 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar"
                      >
                        {users.map(u => {
                          const isSelected = newProject.coordinatorIds.includes(u.uid);
                          return (
                            <button
                              key={u.uid}
                              type="button"
                              onClick={() => {
                                setNewProject(prev => ({
                                  ...prev,
                                  coordinatorIds: isSelected 
                                    ? prev.coordinatorIds.filter(id => id !== u.uid)
                                    : [...prev.coordinatorIds, u.uid]
                                }));
                              }}
                              className="w-full text-left px-6 py-4 hover:bg-white/5 flex items-center justify-between transition-colors border-b border-white/5 last:border-0"
                            >
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">{u.displayName}</span>
                              {isSelected && <Check className="w-4 h-4 text-brand-orange flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* General Team */}
              <div ref={teamDropdownRef}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Field Agents</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all flex items-center justify-between"
                  >
                    <span className="truncate">
                      {newProject.assignedUsers.length === 0 
                        ? "SELECT FIELD TEAM" 
                        : `${newProject.assignedUsers.length} AGENTS DEPLOYED`}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isTeamDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isTeamDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-full glass-dark border border-white/5 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar"
                      >
                        {users.map(u => {
                          const isSelected = newProject.assignedUsers.includes(u.uid);
                          return (
                            <button
                              key={u.uid}
                              type="button"
                              onClick={() => {
                                setNewProject(prev => ({
                                  ...prev,
                                  assignedUsers: isSelected 
                                    ? prev.assignedUsers.filter(id => id !== u.uid)
                                    : [...prev.assignedUsers, u.uid]
                                }));
                              }}
                              className="w-full text-left px-6 py-4 hover:bg-white/5 flex items-center justify-between transition-colors border-b border-white/5 last:border-0"
                            >
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">{u.displayName}</span>
                              {isSelected && <Check className="w-4 h-4 text-brand-blue flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </section>

          <div className="pt-10 border-t border-white/5 flex justify-end gap-6">
             <Link 
              to="/admin"
              onMouseEnter={() => sounds.play('hover')}
              onClick={() => sounds.play('click')}
              className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-all"
            >
              Abort Mission
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              onMouseEnter={() => sounds.play('hover')}
              onClick={() => sounds.play('click')}
              className="bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-30 text-brand-dark px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(255,176,65,0.2)] active:scale-95"
            >
              {isSubmitting ? 'INITIALIZING...' : 'LAUNCH PROJECT'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
