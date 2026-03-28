import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export function Login() {
  const { user, dbUser, signIn, loginWithCredentials, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (user && dbUser) {
    return <Navigate to={dbUser.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithCredentials(username, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Did you enable Email/Password auth in Firebase?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogIn className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Joudcon Suite</h1>
        <p className="text-slate-400 mb-8">Event Management & Logistics</p>
        
        <form onSubmit={handleCredentialLogin} className="space-y-4 mb-6">
          {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm">{error}</div>}
          <input
            type="text"
            placeholder="Username"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Logging in...' : 'Login with Username'}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-slate-500 text-sm">OR</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        <button
          onClick={signIn}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
