import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Save, CheckCircle2, Shield, Mail, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

export function Profile() {
  const { user, dbUser } = useAuth();
  const [displayName, setDisplayName] = useState(dbUser?.displayName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;

    setIsSubmitting(true);
    setError('');
    setSuccess(false);
    sounds.play('click');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim()
      });
      
      sounds.play('success');
      setSuccess(true);
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      sounds.play('error');
      console.error(err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-10"
    >
      <div className="flex items-center gap-4">
        <div className="w-2 h-10 bg-brand-orange rounded-full" />
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Personal Profile</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Operational Identity Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-[40px] p-8 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <BadgeCheck className="w-24 h-24 text-brand-orange" />
            </div>
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-[32px] bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-4xl font-black text-brand-orange mx-auto mb-6 shadow-2xl relative z-10"
            >
              {dbUser?.displayName.charAt(0).toUpperCase()}
            </motion.div>
            
            <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{dbUser?.displayName}</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">{dbUser?.email}</p>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-[10px] font-black uppercase tracking-[0.2em]">
              <Shield className="w-3 h-3" />
              {dbUser?.role}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-600">Security Clearance</span>
                <span className="text-green-500">Verified</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-600">Operational Status</span>
                <span className="text-brand-blue">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-[40px] p-10 border-white/5">
            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  >
                    {error}
                  </motion.div>
                )}
                
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-green-500/10 border border-green-500/20 text-green-400 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Identity updated. Re-initializing session...
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Operational Call Sign</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all"
                      value={displayName} 
                      onChange={e => setDisplayName(e.target.value)}
                    />
                  </div>
                  <p className="mt-3 text-[9px] text-slate-600 font-bold uppercase tracking-widest">This identifier will be visible across all operational sectors.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Primary Communication Channel</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                    <input 
                      type="email" 
                      disabled
                      className="w-full bg-white/2 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-slate-500 text-xs font-bold uppercase tracking-widest cursor-not-allowed"
                      value={dbUser?.email || ''} 
                    />
                  </div>
                  <p className="mt-3 text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">Primary communication channels are hard-coded for security.</p>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting || displayName.trim() === dbUser?.displayName}
                  onMouseEnter={() => sounds.play('hover')}
                  onClick={() => sounds.play('click')}
                  className="bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-30 disabled:grayscale text-brand-dark px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(255,176,65,0.2)] active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Processing...' : 'Commit Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
