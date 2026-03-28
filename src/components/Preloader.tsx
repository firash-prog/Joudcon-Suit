import React from 'react';
import { motion } from 'motion/react';

export function Preloader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-brand-dark flex flex-col items-center justify-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-blue/10 blur-[120px] rounded-full animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-orange/5 blur-[100px] rounded-full animate-pulse-slow" />

      <div className="relative flex flex-col items-center">
        {/* Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-32 h-32 relative mb-8"
        >
          <div className="absolute inset-0 bg-brand-orange/20 rounded-[2.5rem] blur-2xl animate-pulse" />
          <div className="relative bg-white/10 p-6 rounded-[2.5rem] border border-white/10 glass shadow-2xl overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 shimmer-bg opacity-30" />
            <img 
              src="/logo.png" 
              alt="Joudcon Logo" 
              className="w-full h-full object-contain relative z-10"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://picsum.photos/seed/joudcon/200/200";
              }}
            />
          </div>
          
          {/* Scanning Line */}
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] bg-brand-orange/50 shadow-[0_0_10px_rgba(255,176,65,0.5)] z-20 pointer-events-none"
          />
        </motion.div>

        {/* Text & Progress */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic text-gradient">Joudcon</h1>
            <p className="text-[10px] text-brand-orange font-black uppercase tracking-[0.4em] opacity-80 mt-1">Initializing Systems</p>
          </motion.div>

          {/* Progress Bar */}
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-brand-blue via-white to-brand-orange shadow-[0_0_10px_rgba(0,163,255,0.5)]"
            />
          </div>
          
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[8px] font-black text-slate-500 uppercase tracking-widest"
          >
            Establishing Secure Connection...
          </motion.div>
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-white/5 rounded-tl-3xl" />
      <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-white/5 rounded-tr-3xl" />
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-white/5 rounded-bl-3xl" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-white/5 rounded-br-3xl" />
    </div>
  );
}
