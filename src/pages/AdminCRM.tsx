import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Customer } from '../types';
import { Users, Plus, Edit2, Trash2, Mail, Phone, Building, Search, X, Filter, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

export function AdminCRM() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<'lead' | 'active' | 'inactive'>('lead');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setStatus('lead');
    setNotes('');
    setEditingCustomer(null);
    setIsModalOpen(false);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
    setCompany(customer.company || '');
    setStatus(customer.status);
    setNotes(customer.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const customerData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
        status,
        notes: notes.trim(),
      };

      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), customerData);
      } else {
        await addDoc(collection(db, 'customers'), {
          ...customerData,
          createdAt: Timestamp.now()
        });
      }
      sounds.play('success');
      resetForm();
    } catch (err) {
      sounds.play('error');
      console.error("Error saving customer:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteDoc(doc(db, 'customers', id));
        sounds.play('success');
      } catch (err) {
        sounds.play('error');
        console.error("Error deleting customer:", err);
      }
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
              CRM Intelligence
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Strategic Client Relationship Management</p>
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
          <UserPlus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      <div className="glass-card rounded-[40px] overflow-hidden border-white/5">
        <div className="p-8 border-b border-white/5 bg-white/2 flex flex-wrap gap-6 items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 shimmer-bg opacity-5 pointer-events-none" />
          <div className="relative flex-1 min-w-[300px] max-w-lg group">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-orange transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH CLIENT DATABASE..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-orange/30 transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 glass-dark px-4 py-3 rounded-2xl border border-white/5">
              <Filter className="w-4 h-4 text-brand-blue" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white focus:outline-none cursor-pointer"
              >
                <option value="all">Global Status</option>
                <option value="lead">Leads</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/2 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Customer Profile</th>
                <th className="px-8 py-5">Communication</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Registry Date</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredCustomers.length === 0 ? (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Users className="w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No records found in current sector</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  filteredCustomers.map(customer => (
                    <motion.tr 
                      layout
                      key={customer.id} 
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
                            <span className="relative z-10">{customer.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-black text-white group-hover:text-brand-orange transition-colors">{customer.name}</div>
                            {customer.company && (
                              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-slate-500 mt-1">
                                <Building className="w-3 h-3" />
                                {customer.company}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-2">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                              <Mail className="w-3 h-3 text-brand-blue" />
                              <a href={`mailto:${customer.email}`} className="hover:text-brand-orange transition-colors">{customer.email}</a>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                              <Phone className="w-3 h-3 text-brand-blue" />
                              <a href={`tel:${customer.phone}`} className="hover:text-brand-orange transition-colors">{customer.phone}</a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          customer.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          customer.status === 'lead' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                        {customer.createdAt?.toDate().toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              sounds.play('click');
                              handleOpenEdit(customer);
                            }}
                            onMouseEnter={() => sounds.play('hover')}
                            className="p-2 text-slate-500 hover:text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(customer.id)}
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
              className="glass-card rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-white/5"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-brand-orange" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                    {editingCustomer ? 'Update Intelligence' : 'New Client Registry'}
                  </h2>
                </div>
                <button onClick={resetForm} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Operational Name *</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                      placeholder="ENTER FULL NAME"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Communication Channel</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                        placeholder="EMAIL ADDRESS"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Secure Line</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                        placeholder="PHONE NUMBER"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Organization</label>
                      <input 
                        type="text" 
                        value={company}
                        onChange={e => setCompany(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                        placeholder="COMPANY NAME"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Strategic Status</label>
                      <select 
                        value={status}
                        onChange={e => setStatus(e.target.value as any)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all cursor-pointer"
                      >
                        <option value="lead">Lead</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Intelligence Notes</label>
                    <textarea 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all min-h-[120px] resize-none"
                      placeholder="ADDITIONAL STRATEGIC CONTEXT..."
                    />
                  </div>
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
                    className="bg-brand-orange hover:bg-brand-orange/90 text-brand-dark px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(255,176,65,0.2)] active:scale-95"
                  >
                    {editingCustomer ? 'Update Record' : 'Initialize Registry'}
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
