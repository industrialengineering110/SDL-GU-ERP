
import React, { useState } from 'react';
import { Save, Users, Calendar, CheckCircle, Info, MinusCircle, PlusCircle } from 'lucide-react';
import { mockDb } from '../services/mockDb';
// Fixed: AppUser exported from types.ts instead of User
import { DepartmentType, AppUser as User, ManpowerRecord } from '../types';

interface ManpowerInputProps {
  department?: DepartmentType;
  currentUser?: User;
}

const ManpowerInput: React.FC<ManpowerInputProps> = ({ department = 'Sewing' as DepartmentType, currentUser }) => {
  const [formData, setFormData] = useState({
    lineId: 'Line 01',
    totalManpower: 25,
    present: 23,
    date: new Date().toISOString().split('T')[0]
  });

  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fixed: Corrected object mapping to satisfy ManpowerRecord interface by including all required properties.
    const manpowerRec: ManpowerRecord = {
      id: Date.now().toString(),
      date: formData.date,
      department: department,
      blockId: currentUser?.area || 'Unknown',
      lineId: formData.lineId,
      totalSupervisor: 0,
      presentOp: formData.present,
      presentIr: 0,
      presentHp: 0,
      headCount: formData.totalManpower,
      headCountExtra: 0,
      budgetOp: 0,
      budgetIr: 0,
      budgetHp: 0,
      totalRecruit: 0,
      closeOp: 0,
      closeHpIr: 0,
      actualRecruit: 0,
      absent: formData.totalManpower - formData.present,
      layoutManpower: 0,
      layoutExtra: 0,
      timestamp: new Date().toISOString(),
      reporterId: currentUser?.id || 'system'
    };
    
    mockDb.saveManpower(manpowerRec);
    setMessage('Attendance recorded successfully.');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-teal-100 p-3 rounded-2xl text-teal-600">
          <Users size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manpower Attendance</h1>
          <p className="text-slate-500">Log daily presence per production line.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Calendar size={14}/> Reporting Date</label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Production Line</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  value={formData.lineId}
                  onChange={(e) => setFormData({...formData, lineId: e.target.value})}
                >
                  {Array.from({length: 20}, (_, i) => `Line ${String(i+1).padStart(2, '0')}`).map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
           </div>

           <div className="bg-slate-50 p-6 rounded-2xl space-y-6 border border-slate-100">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700">Allocated Manpower</p>
                    <p className="text-xs text-slate-400">Standard team size</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setFormData(prev => ({...prev, totalManpower: Math.max(1, prev.totalManpower - 1)}))} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-red-500"><MinusCircle size={20}/></button>
                    <span className="text-xl font-bold w-8 text-center">{formData.totalManpower}</span>
                    <button type="button" onClick={() => setFormData(prev => ({...prev, totalManpower: prev.totalManpower + 1}))} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-teal-500"><PlusCircle size={20}/></button>
                 </div>
              </div>

              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700">Present Today</p>
                    <p className="text-xs text-slate-400">Actual available heads</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setFormData(prev => ({...prev, present: Math.max(0, prev.present - 1)}))} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-red-500"><MinusCircle size={20}/></button>
                    <span className="text-xl font-bold w-8 text-center">{formData.present}</span>
                    <button type="button" onClick={() => setFormData(prev => ({...prev, present: Math.min(prev.totalManpower, prev.present + 1)}))} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-teal-500"><PlusCircle size={20}/></button>
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-slate-500">
                 <span className="text-sm font-medium">Absenteeism</span>
                 <span className="text-lg font-bold text-red-500">{formData.totalManpower - formData.present} Persons</span>
              </div>
           </div>
        </div>

        {message && (
          <div className="p-4 bg-teal-50 text-teal-700 rounded-xl border border-teal-100 flex items-center gap-2">
            <CheckCircle size={18} /> {message}
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-sm italic">
            <Info size={16} />
            Note: Frequent absenteeism affects Line Efficiency calculations.
          </div>
          <button 
            type="submit"
            className="w-full sm:w-auto bg-teal-600 text-white font-bold py-3 px-10 rounded-xl flex items-center justify-center gap-2 hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all"
          >
            <Save size={20} />
            Submit Attendance
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManpowerInput;
