
import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Save, Calendar, Clock, Users, Hash, Info, CheckCircle } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { StyleInfo, UserRole } from '../types';

const DailyProductionReport: React.FC = () => {
  const [styles, setStyles] = useState<StyleInfo[]>([]);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    lineId: 'Line 01',
    styleNumber: '',
    totalOutput: 0,
    actualWorkingHours: 8,
    actualManpower: 67
  });

  useEffect(() => {
    setStyles(mockDb.getStyles());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.styleNumber) {
      alert("Please select a style.");
      return;
    }

    mockDb.saveProductionSummary({
      id: Date.now().toString(),
      ...formData,
      timestamp: new Date().toISOString()
    });

    setMessage('Production summary recorded. Style achievement updated.');
    setTimeout(() => setMessage(''), 3000);
    setFormData({ ...formData, totalOutput: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-xl">
          <ClipboardCheck size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">IE Production Reporting</h1>
          <p className="text-slate-500 font-medium">Log shift output and actual HR working hours.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Report Date</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-black focus:ring-4 focus:ring-emerald-500/10 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Line Assignment</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-black focus:ring-4 focus:ring-emerald-500/10 outline-none" value={formData.lineId} onChange={e => setFormData({...formData, lineId: e.target.value})}>
               {Array.from({length: 20}, (_, i) => `Line ${String(i+1).padStart(2, '0')}`).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Active Style</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-black focus:ring-4 focus:ring-emerald-500/10 outline-none" value={formData.styleNumber} onChange={e => setFormData({...formData, styleNumber: e.target.value})}>
               <option value="">Select Style</option>
               {styles.map(s => <option key={s.id} value={s.styleNumber}>{s.buyer} - {s.styleNumber}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Total Output (PCS)</label>
            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-black focus:ring-4 focus:ring-emerald-500/10 outline-none" value={formData.totalOutput} onChange={e => setFormData({...formData, totalOutput: parseInt(e.target.value) || 0})} placeholder="0" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Actual HR Working Hours</label>
            <input type="number" step="0.5" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-black focus:ring-4 focus:ring-emerald-500/10 outline-none" value={formData.actualWorkingHours} onChange={e => setFormData({...formData, actualWorkingHours: parseFloat(e.target.value) || 0})} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Actual Headcount (MP)</label>
            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-black focus:ring-4 focus:ring-emerald-500/10 outline-none" value={formData.actualManpower} onChange={e => setFormData({...formData, actualManpower: parseInt(e.target.value) || 0})} />
          </div>
        </div>

        {message && (
          <div className="p-5 bg-green-50 text-green-700 rounded-2xl border border-green-200 flex items-center gap-3 font-bold animate-in zoom-in-95">
            <CheckCircle size={24} /> {message}
          </div>
        )}

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
             <Info size={16} className="text-emerald-500" />
             <span>Data used for cross-verifying Style Master achievement.</span>
          </div>
          <button type="submit" className="w-full sm:w-auto bg-slate-900 text-white font-black py-4 px-16 rounded-2xl flex items-center justify-center gap-3 hover:bg-black shadow-2xl transition-all">
             <Save size={20} />
             Save Shift Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyProductionReport;
