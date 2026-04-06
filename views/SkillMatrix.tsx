import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Search, Clock, Award, ShieldCheck, Filter, UserCheck, Save, Factory, Wrench, ArrowLeft } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { SkillRecord, UserRole, DepartmentType } from '../types';

interface SkillMatrixProps {
  role?: UserRole;
  department: DepartmentType;
}

const SkillMatrix: React.FC<SkillMatrixProps> = ({ role = UserRole.DATA_ENTRY, department }) => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  
  // Filters
  const [lineFilter, setLineFilter] = useState('All Lines');
  const [processFilter, setProcessFilter] = useState('All Processes');
  const [searchFilter, setSearchFilter] = useState('');
  
  const isAdmin = role === UserRole.ADMIN;

  // Manual Entry Form (Admin Only)
  const [isAdding, setIsAdding] = useState(false);
  const [manualSkill, setManualSkill] = useState<Partial<SkillRecord>>({
    operatorId: '',
    operatorName: '',
    processName: '',
    lineId: 'Line 01',
    skillLevel: 'B',
    efficiency: 75
  });

  useEffect(() => {
    setSkills(mockDb.getSkills(department));
  }, [department]);

  const lines = ['All Lines', ...Array.from({length: 20}, (_, i) => `Line ${String(i+1).padStart(2, '0')}`)];
  const processes = ['All Processes', ...Array.from(new Set(skills.map(s => s.processName)))];

  const filteredSkills = skills.filter(s => {
    const matchLine = lineFilter === 'All Lines' || s.lineId === lineFilter;
    const matchProcess = processFilter === 'All Processes' || s.processName === processFilter;
    const matchSearch = s.operatorName.toLowerCase().includes(searchFilter.toLowerCase()) || 
                      s.operatorId.includes(searchFilter);
    return matchLine && matchProcess && matchSearch;
  });

  const handleManualSave = () => {
    if (!manualSkill.operatorName || !manualSkill.operatorId) return;
    const newSkill: SkillRecord = {
      id: Date.now().toString(),
      department,
      operatorId: manualSkill.operatorId!,
      operatorName: manualSkill.operatorName!,
      processName: manualSkill.processName || 'General',
      lineId: manualSkill.lineId || 'Unassigned',
      skillLevel: manualSkill.skillLevel as any || 'B',
      efficiency: manualSkill.efficiency || 0,
      lastStudyDate: new Date().toISOString()
    };
    mockDb.saveSkillManual(newSkill);
    setSkills(mockDb.getSkills(department));
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/ie-activity`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">{department} Skill Matrix</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-slate-900 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl"
          >
            <UserCheck size={20} />
            Manual Database Entry
          </button>
        )}
      </div>

      {/* Admin Manual Entry Form */}
      {isAdding && isAdmin && (
        <div className="bg-white p-8 rounded-[2rem] border-2 border-indigo-100 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" /> Admin: Manual {department} Registration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase px-1">Operator ID</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="ID 10XX"
                  value={manualSkill.operatorId}
                  onChange={e => setManualSkill({...manualSkill, operatorId: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase px-1">Full Name</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="Operator Name"
                  value={manualSkill.operatorName}
                  onChange={e => setManualSkill({...manualSkill, operatorName: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase px-1">Process</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="e.g. Waistband"
                  value={manualSkill.processName}
                  onChange={e => setManualSkill({...manualSkill, processName: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase px-1">Line Assignment</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={manualSkill.lineId}
                  onChange={e => setManualSkill({...manualSkill, lineId: e.target.value})}
                >
                  {lines.filter(l => l !== 'All Lines').map(l => <option key={l} value={l}>{l}</option>)}
                </select>
             </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
             <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-slate-500 font-bold">Cancel</button>
             <button onClick={handleManualSave} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700">Save Record</button>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Search Database</label>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
              placeholder="Operator Name or ID..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
             <Factory size={12} /> Factory Line
          </label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-black focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
          >
            {lines.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
             <Wrench size={12} /> Garment Process
          </label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-black focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            value={processFilter}
            onChange={(e) => setProcessFilter(e.target.value)}
          >
            {processes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredSkills.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative">
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-5 ${
              s.skillLevel === 'A' ? 'bg-emerald-500' : s.skillLevel === 'B' ? 'bg-blue-500' : 'bg-orange-500'
            }`}></div>

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${
                s.skillLevel === 'A' ? 'bg-emerald-100 text-emerald-600 shadow-emerald-50' : 
                s.skillLevel === 'B' ? 'bg-blue-100 text-blue-600 shadow-blue-50' : 
                'bg-orange-100 text-orange-600 shadow-orange-50'
              }`}>
                {s.skillLevel}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 text-lg truncate">{s.operatorName}</h3>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">ID: {s.operatorId}</span>
                   <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                   <span className="text-[10px] font-black text-blue-600 uppercase">{s.lineId}</span>
                </div>
              </div>
            </div>

            <div className="space-y-5 relative z-10">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Process</p>
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                   <Wrench size={14} className="text-indigo-600" />
                   {s.processName}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-black uppercase mb-2">
                   <span className="text-slate-400">Measured Efficiency</span>
                   <span className="text-slate-900">{s.efficiency} U/H</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                   <div 
                      className={`h-full transition-all duration-1000 ${
                        s.skillLevel === 'A' ? 'bg-emerald-500' : 
                        s.skillLevel === 'B' ? 'bg-blue-500' : 
                        'bg-orange-500'
                      }`} 
                      style={{ width: `${Math.min((s.efficiency / 120) * 100, 100)}%` }}
                   ></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Clock size={12} />
                    <span>{s.lastStudyDate ? new Date(s.lastStudyDate).toLocaleDateString() : 'N/A'}</span>
                 </div>
                 <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    <ShieldCheck size={12} />
                    IE VERIFIED
                 </div>
              </div>
            </div>
          </div>
        ))}

        {filteredSkills.length === 0 && (
           <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
              <Award size={64} className="mx-auto text-slate-100 mb-6" />
              <p className="text-slate-400 font-black text-xl mb-2">No Verified Specialists Found</p>
              <p className="text-slate-300 font-medium">Try adjusting your filters for {department}.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default SkillMatrix;