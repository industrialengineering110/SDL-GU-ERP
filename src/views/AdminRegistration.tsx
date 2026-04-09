
import React, { useState } from 'react';
import { User, Lock, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/apiService';
import { AppUser as UserType, INITIAL_PERMISSIONS, FULL_PERMISSIONS } from '../types';
import Logo from '../components/Logo';

interface AdminRegistrationProps {
  onSuccess: () => void;
  embedded?: boolean;
}

const AdminRegistration: React.FC<AdminRegistrationProps> = ({ onSuccess, embedded }) => {
  const [form, setForm] = useState({
    name: '',
    employeeId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.employeeId || !form.password) {
      setError('Please fill all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newAdmin = {
        id: 'admin-' + Date.now(),
        name: form.name.trim(),
        employee_id: form.employeeId.trim(),
        password: form.password.trim(),
        email: `${form.employeeId.trim()}@sdl-garments.com`,
        mobileNumber: '0000000000'
      };

      console.log("DEBUG: Registering new admin via API:", JSON.stringify(newAdmin, null, 2));
      await apiService.registerAdmin(newAdmin);
      
      setMessage('Admin account created successfully. Redirecting...');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to register admin');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={`${embedded ? 'w-full' : 'max-w-md w-full bg-card rounded-[3rem] shadow-2xl border border-border p-10 space-y-8'}`}>
      <div className="text-center space-y-4">
         <Logo size={60} />
         <h1 className="text-xl font-black text-foreground tracking-tight uppercase italic">Admin Setup</h1>
         <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">No admin found. Register first admin.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Name</label>
          <input className="w-full bg-muted border border-border rounded-2xl px-4 py-4 font-bold text-foreground outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Admin Name" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Admin ID</label>
          <input className="w-full bg-muted border border-border rounded-2xl px-4 py-4 font-bold text-foreground outline-none" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} placeholder="Admin ID" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Password</label>
          <input type="password" className="w-full bg-muted border border-border rounded-2xl px-4 py-4 font-bold text-foreground outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
        </div>

        {error && <div className="p-4 bg-rose-500/10 text-rose-600 rounded-2xl border border-rose-500/20 text-xs font-bold flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
        {message && <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20 text-xs font-bold flex items-center gap-2"><CheckCircle size={16}/> {message}</div>}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
           {loading ? (
             <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
           ) : (
             <ShieldCheck size={20} />
           )}
           {loading ? 'Registering...' : 'Register Admin'}
        </button>
      </form>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {content}
    </div>
  );
};

export default AdminRegistration;
