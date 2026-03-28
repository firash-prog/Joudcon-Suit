import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Save, CheckCircle2 } from 'lucide-react';

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

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim()
      });
      
      setSuccess(true);
      
      // Reload after a short delay to update the context state everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-slate-400 text-sm">Manage your personal information</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-blue-400 border-2 border-slate-700">
            {dbUser?.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{dbUser?.displayName}</h2>
            <p className="text-slate-400">{dbUser?.email}</p>
            <span className="inline-block mt-2 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 uppercase tracking-wider">
              {dbUser?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Profile updated successfully! Refreshing...
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <input 
                type="text" 
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">This is the name that will be displayed to other users in the app.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <input 
              type="email" 
              disabled
              className="w-full bg-slate-800/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
              value={dbUser?.email || ''} 
            />
            <p className="mt-2 text-xs text-slate-500">Email addresses cannot be changed.</p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting || displayName.trim() === dbUser?.displayName}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
