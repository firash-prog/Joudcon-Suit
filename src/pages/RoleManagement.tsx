import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { CustomRole, RolePermissions } from '../types';
import { Shield, Plus, Trash2, Save, Check, X, Settings, Zap, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

const defaultPermissions: RolePermissions = {
  canCreateProjects: false,
  canEditProjects: false,
  canDeleteProjects: false,
  canCreateTasks: false,
  canEditTasks: false,
  canDeleteTasks: false,
  canManageUsers: false,
  canViewAllWorkLogs: false,
  canManageRoles: false,
  canAccessAdminDashboard: false,
  canManageCRM: false,
};

const permissionLabels: Record<keyof RolePermissions, string> = {
  canCreateProjects: 'Create Projects',
  canEditProjects: 'Edit Projects',
  canDeleteProjects: 'Delete Projects',
  canCreateTasks: 'Create Tasks',
  canEditTasks: 'Edit Tasks',
  canDeleteTasks: 'Delete Tasks',
  canManageUsers: 'Manage Users',
  canViewAllWorkLogs: 'View All Work Logs',
  canManageRoles: 'Manage Roles',
  canAccessAdminDashboard: 'Access Admin Dashboard',
  canManageCRM: 'Manage CRM & Customers',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export function RoleManagement() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'roles'), (snap) => {
      setRoles(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomRole)));
    });
    return () => unsub();
  }, []);

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      await addDoc(collection(db, 'roles'), {
        name: newRoleName,
        permissions: { ...defaultPermissions }
      });
      setNewRoleName('');
      setIsAdding(false);
      sounds.play('success');
    } catch (err) {
      console.error(err);
      sounds.play('error');
    }
  };

  const handleUpdatePermissions = async (roleId: string, permissions: RolePermissions) => {
    try {
      await updateDoc(doc(db, 'roles', roleId), { permissions });
      sounds.play('success');
    } catch (err) {
      console.error(err);
      sounds.play('error');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await deleteDoc(doc(db, 'roles', roleId));
      sounds.play('success');
    } catch (err) {
      console.error(err);
      sounds.play('error');
    }
  };

  const togglePermission = (role: CustomRole, key: keyof RolePermissions) => {
    const updatedPermissions = {
      ...role.permissions,
      [key]: !role.permissions[key]
    };
    handleUpdatePermissions(role.id, updatedPermissions);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-orange/10 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-brand-orange" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Operational Protocols</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Custom Role & Access Matrix</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            sounds.play('click');
          }}
          className="bg-brand-orange hover:bg-brand-orange/90 text-brand-dark px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,176,65,0.2)]"
        >
          <Plus className="w-5 h-5" />
          Initialize New Protocol
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 rounded-3xl border-brand-orange/30"
          >
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Protocol Designation (e.g. Field Commander)"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-orange/50 transition-colors font-bold"
              />
              <button
                onClick={handleAddRole}
                className="bg-brand-orange text-brand-dark px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-orange/90 transition-all"
              >
                Authorize
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="bg-white/5 text-slate-400 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
              >
                Abort
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <motion.div
            key={role.id}
            variants={itemVariants}
            className="glass-card rounded-3xl overflow-hidden border-white/5 group hover:border-brand-orange/20 transition-all"
          >
            <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-brand-orange" />
                <h3 className="text-lg font-black text-white uppercase tracking-tight">{role.name}</h3>
              </div>
              <button
                onClick={() => handleDeleteRole(role.id)}
                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(role.permissions) as Array<keyof RolePermissions>).map((key) => (
                  <div 
                    key={key}
                    onClick={() => {
                      togglePermission(role, key);
                      sounds.play('click');
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                      role.permissions[key] 
                        ? 'bg-brand-orange/5 border-brand-orange/20 text-brand-orange' 
                        : 'bg-white/2 border-white/5 text-slate-500 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-widest">{permissionLabels[key]}</span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${role.permissions[key] ? 'bg-brand-orange' : 'bg-slate-700'}`}>
                      <motion.div 
                        animate={{ x: role.permissions[key] ? 20 : 2 }}
                        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-6 py-4 bg-white/2 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Activity className="w-3 h-3" />
                <span>Protocol Active</span>
              </div>
              <div className="text-[10px] font-black text-brand-orange uppercase tracking-widest">
                {Object.values(role.permissions).filter(Boolean).length} Permissions Enabled
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {roles.length === 0 && !isAdding && (
        <div className="text-center py-20 glass-card rounded-[40px] border-dashed border-white/10">
          <Settings className="w-16 h-16 text-slate-700 mx-auto mb-6 animate-spin-slow" />
          <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest">No Custom Protocols Defined</h3>
          <p className="text-slate-600 text-sm mt-2">Initialize a new protocol to begin custom access mapping.</p>
        </div>
      )}
    </motion.div>
  );
}
