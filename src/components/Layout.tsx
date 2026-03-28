import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Settings, Clock, Bell, User, Users, Shield, Menu, X, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

export function Layout() {
  const { dbUser, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    sounds.play('transition');
    setIsSidebarOpen(false); // Close sidebar on navigation
  }, [location.pathname]);

  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    sounds.setEnabled(newState);
    if (newState) sounds.play('click');
  };

  const navItems = [
    ...(dbUser?.role === 'admin' ? [
      { to: '/admin', icon: Settings, label: 'Admin Dashboard', rotate: true },
      { to: '/admin/crm', icon: Users, label: 'CRM' },
      { to: '/admin/users', icon: Shield, label: 'Users & Roles' },
    ] : []),
    { to: '/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
    { to: '/profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="min-h-screen flex bg-brand-dark overflow-hidden font-sans selection:bg-brand-orange/30">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 glass-dark border-r border-white/5 flex flex-col transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-brand-orange/20 to-transparent" />
        
        <div className="p-8 flex flex-col items-center gap-4 relative">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-24 h-24 relative group cursor-pointer"
            onClick={() => sounds.play('click')}
          >
            <div className="absolute inset-0 bg-brand-orange/20 rounded-[2rem] blur-2xl group-hover:bg-brand-orange/30 transition-all duration-700 animate-pulse-slow" />
            <div className="relative bg-white/10 p-4 rounded-[2rem] border border-white/10 glass shadow-2xl overflow-hidden">
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
          </motion.div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic text-gradient">Joudcon</h1>
            <p className="text-[10px] text-brand-orange font-black uppercase tracking-[0.3em] opacity-80">Elite Pro Events Suite</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3 overflow-y-auto hide-scrollbar relative">
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-brand-dark/20 to-transparent pointer-events-none z-10" />
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onMouseEnter={() => sounds.play('hover')}
              onClick={() => {
                sounds.play('click');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
                location.pathname === item.to 
                  ? 'bg-brand-orange/10 text-brand-orange shadow-[0_0_20px_rgba(255,176,65,0.15)] border border-brand-orange/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
              }`}
            >
              {location.pathname === item.to && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute inset-0 bg-gradient-to-r from-brand-orange/5 to-transparent"
                />
              )}
              <item.icon className={`w-5 h-5 transition-all duration-500 relative z-10 ${
                item.rotate ? 'group-hover:rotate-90' : 'group-hover:scale-110'
              } ${location.pathname === item.to ? 'text-brand-orange' : ''}`} />
              <span className="font-bold text-xs uppercase tracking-widest relative z-10">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4 relative bg-black/20">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange font-black shadow-xl relative group overflow-hidden">
                <div className="absolute inset-0 shimmer-bg opacity-20" />
                <span className="relative z-10 text-lg">{dbUser?.displayName?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate uppercase tracking-tight">{dbUser?.displayName}</p>
                <p className="text-[9px] text-brand-orange/60 truncate uppercase tracking-[0.2em] font-black">{dbUser?.role}</p>
              </div>
            </div>
            <button 
              onClick={toggleSound}
              className="p-2 text-slate-500 hover:text-brand-orange transition-colors"
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
          
          <button
            onClick={() => {
              sounds.play('click');
              logout();
            }}
            onMouseEnter={() => sounds.play('hover')}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-500 group border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-5 h-5 transition-transform duration-500 group-hover:-translate-x-1" />
            <span className="font-bold text-xs uppercase tracking-widest">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-brand-dark/30">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-15%] right-[-10%] w-[60%] h-[60%] bg-brand-blue/5 blur-[180px] rounded-full pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-brand-orange/5 blur-[150px] rounded-full pointer-events-none animate-pulse-slow" />
        <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />

        <header className="h-20 glass-dark border-b border-white/5 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                sounds.play('click');
                setIsSidebarOpen(true);
              }}
              className="p-2 text-slate-400 hover:text-brand-orange transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
              {location.pathname === '/admin' ? 'Strategic Overview' : 
               location.pathname === '/admin/crm' ? 'Client Relations' : 
               location.pathname === '/admin/users' ? 'Personnel Control' : 
               location.pathname === '/profile' ? 'Operator Profile' : 
               'Operational Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden sm:flex items-center gap-3 text-[10px] font-black text-slate-400 bg-white/5 px-4 py-2 rounded-full border border-white/5 uppercase tracking-widest">
              <Clock className="w-3 h-3 text-brand-orange" />
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button 
              onMouseEnter={() => sounds.play('hover')}
              onClick={() => sounds.play('click')}
              className="p-2.5 text-slate-400 hover:text-brand-orange transition-all relative group bg-white/5 rounded-xl border border-white/5"
            >
              <Bell className="w-5 h-5 group-hover:animate-bounce" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-orange rounded-full border-2 border-brand-dark shadow-[0_0_10px_rgba(255,176,65,0.5)]" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 relative hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

