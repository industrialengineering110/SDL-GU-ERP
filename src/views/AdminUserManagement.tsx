import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';
import { AppUser, SystemConfig } from '../types';
import { Check, X, ShieldCheck, User, Building, Briefcase, Layers } from 'lucide-react';

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [config, setConfig] = useState<SystemConfig>(mockDb.getSystemConfig());
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('');

  useEffect(() => {
    setUsers(mockDb.getUsers());
  }, []);

  const handleApprove = (user: AppUser) => {
    if (!editingUser || !selectedTier) return;
    mockDb.approveUser(user.id, {
      department: editingUser.department,
      designation: editingUser.designation,
      section: editingUser.section,
      lines: editingUser.lines
    }, selectedTier);
    setUsers(mockDb.getUsers());
    setEditingUser(null);
    setSelectedTier('');
  };

  const pendingUsers = users.filter(u => u.status === 'PENDING');

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-black text-foreground">Admin User Management</h1>
      <div className="grid grid-cols-1 gap-4">
        {pendingUsers.map(user => (
          <div key={user.id} className="bg-card p-4 rounded-2xl border border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold">{user.name}</h3>
              <p className="text-xs text-muted-foreground">{user.employee_id} - {user.department}</p>
            </div>
            <button 
              onClick={() => { setEditingUser(user); setSelectedTier(config.accessTiers?.[0]?.id || ''); }}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold"
            >
              Review
            </button>
          </div>
        ))}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-card p-8 rounded-3xl border border-border w-full max-w-lg space-y-4">
            <h2 className="text-xl font-black">Approve User: {editingUser.name}</h2>
            <input className="w-full bg-muted border border-border rounded-2xl px-5 py-3.5 font-bold" value={editingUser.department} onChange={e => setEditingUser({...editingUser, department: e.target.value})} placeholder="Department" />
            <input className="w-full bg-muted border border-border rounded-2xl px-5 py-3.5 font-bold" value={editingUser.designation} onChange={e => setEditingUser({...editingUser, designation: e.target.value})} placeholder="Designation" />
            <input className="w-full bg-muted border border-border rounded-2xl px-5 py-3.5 font-bold" value={editingUser.section || ''} onChange={e => setEditingUser({...editingUser, section: e.target.value})} placeholder="Section" />
            
            <select className="w-full bg-muted border border-border rounded-2xl px-5 py-3.5 font-bold" value={selectedTier} onChange={e => setSelectedTier(e.target.value)}>
              {config.accessTiers?.map(tier => (
                <option key={tier.id} value={tier.id}>{tier.name}</option>
              ))}
            </select>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setEditingUser(null)} className="flex-1 bg-muted py-3.5 rounded-2xl font-bold">Cancel</button>
              <button onClick={() => handleApprove(editingUser)} className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold">Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
