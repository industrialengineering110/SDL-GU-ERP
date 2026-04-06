import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { SOP } from '../types';
import { mockDb } from '../services/mockDb';

interface SOPFormProps {
  type: 'Fabric' | 'Sample' | 'SizeSetPilot';
  onSave: () => void;
  onCancel: () => void;
}

const SOPForm: React.FC<SOPFormProps> = ({ type, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Sewing');
  const [processTime, setProcessTime] = useState(0);
  const [procedure, setProcedure] = useState('');
  const [rules, setRules] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSOP: SOP = {
      id: Date.now().toString(),
      type,
      department,
      title,
      processTime,
      procedure,
      rules: rules.split('\n').filter(r => r.trim() !== ''),
      timestamp: new Date().toISOString()
    };
    mockDb.saveSOP(newSOP);
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card p-8 rounded-[2.5rem] border border-border shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-black uppercase tracking-tight mb-6">{type} SOP Form</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SOP Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-muted/30 border border-border/50 rounded-2xl outline-none text-sm font-bold" required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department</label>
          <input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="w-full p-4 bg-muted/30 border border-border/50 rounded-2xl outline-none text-sm font-bold" required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Process Time (min)</label>
          <input type="number" value={processTime} onChange={e => setProcessTime(Number(e.target.value))} className="w-full p-4 bg-muted/30 border border-border/50 rounded-2xl outline-none text-sm font-bold" required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Procedure</label>
          <textarea value={procedure} onChange={e => setProcedure(e.target.value)} className="w-full p-4 bg-muted/30 border border-border/50 rounded-2xl outline-none text-sm font-bold h-32" required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rules (one per line)</label>
          <textarea value={rules} onChange={e => setRules(e.target.value)} className="w-full p-4 bg-muted/30 border border-border/50 rounded-2xl outline-none text-sm font-bold h-32" required />
        </div>
        <div className="md:col-span-2 flex justify-end gap-4">
          <button type="button" onClick={onCancel} className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm border border-border hover:bg-muted transition-all">Cancel</button>
          <button type="submit" className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-600/20 hover:translate-y-[-2px] transition-all flex items-center gap-3">
            <Save size={18} /> Save SOP
          </button>
        </div>
      </div>
    </form>
  );
};

export default SOPForm;
