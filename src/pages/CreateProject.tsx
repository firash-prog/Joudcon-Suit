import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, Timestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Customer } from '../types';
import { ArrowLeft, Check, ChevronDown, User as UserIcon, Users as UsersIcon, Briefcase } from 'lucide-react';

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
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Project</h1>
          <p className="text-slate-400 text-sm">Set up a new project and assign the team</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Project Details */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">Project Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Project Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Main Stage Setup"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  value={newProject.name} 
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Installation Date *</label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  value={newProject.installationDate} 
                  onChange={e => setNewProject({...newProject, installationDate: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              Customer Details
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div ref={customerDropdownRef} className="relative">
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Customer (Optional)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 flex items-center justify-between"
                    >
                      <span className="truncate">
                        {newProject.customerName || "Select from CRM or type below"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    {isCustomerDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
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
                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 flex flex-col"
                          >
                            <span className="font-medium">{c.name}</span>
                            {c.company && <span className="text-xs text-slate-500">{c.company}</span>}
                          </button>
                        ))}
                        {customers.length === 0 && (
                          <div className="px-3 py-2 text-sm text-slate-500 italic">No customers in CRM</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Customer Name (Manual Entry)</label>
                <input 
                  type="text" 
                  placeholder="e.g., Acme Corp"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  value={newProject.customerName} 
                  onChange={e => setNewProject({...newProject, customerName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Customer Details / Requirements</label>
                <textarea 
                  rows={3}
                  placeholder="Any specific requirements or contact info..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                  value={newProject.customerDetails} 
                  onChange={e => setNewProject({...newProject, customerDetails: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Team Assignment */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-blue-400" />
              Team Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Project Manager */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Project Manager</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  value={newProject.projectManagerId} 
                  onChange={e => setNewProject({...newProject, projectManagerId: e.target.value})}
                >
                  <option value="">Select PM</option>
                  {users.map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                </select>
              </div>

              {/* Coordinators */}
              <div ref={coordinatorDropdownRef}>
                <label className="block text-sm font-medium text-slate-300 mb-2">Coordinators</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCoordinatorDropdownOpen(!isCoordinatorDropdownOpen)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 flex items-center justify-between"
                  >
                    <span className="truncate">
                      {newProject.coordinatorIds.length === 0 
                        ? "Select Coordinators" 
                        : `${newProject.coordinatorIds.length} selected`}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                  
                  {isCoordinatorDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
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
                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 flex items-center justify-between"
                          >
                            <span className="truncate">{u.displayName}</span>
                            {isSelected && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* General Team */}
              <div ref={teamDropdownRef}>
                <label className="block text-sm font-medium text-slate-300 mb-2">Assigned Team</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 flex items-center justify-between"
                  >
                    <span className="truncate">
                      {newProject.assignedUsers.length === 0 
                        ? "Select Team" 
                        : `${newProject.assignedUsers.length} selected`}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                  
                  {isTeamDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
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
                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 flex items-center justify-between"
                          >
                            <span className="truncate">{u.displayName}</span>
                            {isSelected && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
