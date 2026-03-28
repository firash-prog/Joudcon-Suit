import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Preloader } from '../components/Preloader';

export function Login() {
  const { user, dbUser, signIn, loginWithCredentials, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <Preloader />;

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
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-brand-dark flex items-center justify-center p-4 relative overflow-hidden font-sans"
    >
      {/* Background Decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-blue/10 blur-[150px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-orange/5 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full glass-card rounded-[40px] p-10 shadow-2xl text-center relative z-10 border-white/5"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-24 h-24 relative mx-auto mb-8 group"
        >
          <div className="absolute inset-0 bg-brand-orange/20 rounded-3xl blur-2xl group-hover:bg-brand-orange/30 transition-all duration-500 animate-pulse" />
          <div className="relative bg-white/10 p-4 rounded-3xl border border-white/10 glass shadow-2xl flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Joudcon Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://picsum.photos/seed/joudcon/200/200";
              }}
            />
          </div>
        </motion.div>

        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">Joudcon</h1>
        <p className="text-[10px] text-brand-orange font-black uppercase tracking-[0.3em] mb-10 opacity-80">Elite Pro Events Suite</p>
        
        <form onSubmit={handleCredentialLogin} className="space-y-4 mb-8">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <input
              type="text"
              placeholder="OPERATIONAL ID"
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all placeholder:text-slate-600"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative group">
            <input
              type="password"
              placeholder="SECURITY ACCESS KEY"
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-orange/30 transition-all placeholder:text-slate-600"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-brand-dark font-black py-4 px-6 rounded-2xl transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px] shadow-[0_0_30px_rgba(255,176,65,0.2)] active:scale-95 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-brand-dark/20 border-t-brand-dark rounded-full"
              />
            ) : (
              <><Zap className="w-4 h-4 fill-current" /> Initialize Session</>
            )}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-white/5"></div>
          <span className="text-slate-600 text-[9px] font-black tracking-widest uppercase">External Auth</span>
          <div className="flex-1 h-px bg-white/5"></div>
        </div>

        <button
          onClick={signIn}
          className="w-full glass-dark hover:bg-white/5 text-white font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] border border-white/5 active:scale-95 group"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 group-hover:scale-110 transition-transform" alt="Google" />
          Google Authentication
        </button>

        <div className="mt-12 flex items-center justify-center gap-2 text-slate-600">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Secure Terminal Access</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
