import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Zap, Save, RefreshCcw, History, Search, LayoutGrid, Clock, Tag, User, Unlock, Lock, X, Check, CheckCircle, ArrowRight, Gauge, AlertTriangle, ListChecks, ChevronDown, ArrowLeft } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { apiService } from '../services/apiService';
import { DepartmentType, QCORecord, UserRole, AppUser } from '../types';

const SearchableSelect: React.FC<{
  label: string;
  options: string[];
  value: string;
  placeholder: string;
  icon: any;
  onChange: (val: string) => void;
  disabled?: boolean;
}> = ({ label, options, value, placeholder, icon: Icon, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = (options || []).filter(opt => 
    opt && opt.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className={`space-y-1.5 relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-slate-900 font-black cursor-pointer flex items-center justify-between group hover:border-indigo-600 transition-colors shadow-sm"
      >
        <Icon size={16} className="absolute left-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        <span className={`text-xs truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>{value || placeholder}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-[1.2rem] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
           <div className="p-2 border-b border-slate-50 bg-slate-50/50">
              <input autoFocus className="w-full bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} />
           </div>
           <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {filteredOptions.map((opt, idx) => (
                <div key={idx} onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }} className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors">{opt}</div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

const QCOHub: React.FC<{ department: DepartmentType, currentUser: AppUser }> = ({ department, currentUser }) => {
  const navigate = useNavigate();
  const [activeLine, setActiveLine] = useState('');
  const [allRecords, setAllRecords] = useState<QCORecord[]>([]);
  const [isResolving, setIsResolving] = useState<QCORecord | null>(null);
  const [message, setMessage] = useState('');
  const [isLive, setIsLive] = useState(false);

  const config = mockDb.getSystemConfig();
  const styles = mockDb.getStyles().map(s => s.styleNumber);
  const userLines = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN) return config.lineMappings.filter(m => m.sectionId === department).map(m => m.lineId);
    return currentUser.lines || [];
  }, [currentUser, department, config.lineMappings]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    oldStyle: '',
    newStyle: '',
    complexity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    remarks: ''
  });

  const [resolveData, setResolveData] = useState({
    endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    machineLayout: false,
    operatorBriefing: false,
    attachmentReady: false
  });

  useEffect(() => {
    if (userLines.length > 0 && !activeLine) setActiveLine(userLines[0]);
    checkApi();
    refreshData();
  }, [department, userLines]);

  const checkApi = async () => {
    const live = await apiService.checkHealth();
    setIsLive(live);
  };

  const refreshData = async () => {
    try {
      if (await apiService.checkHealth()) {
        const liveData = await apiService.getQCO(department);
        setAllRecords(liveData);
        setIsLive(true);
      } else {
        setAllRecords(mockDb.getQCO(department));
        setIsLive(false);
      }
    } catch (e) {
      setAllRecords(mockDb.getQCO(department));
      setIsLive(false);
    }
  };

  const handleStartQCO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.oldStyle || !formData.newStyle || !activeLine) {
        alert("Please complete style references."); return;
    }

    const newRecord: QCORecord = {
      id: Date.now().toString(),
      date: formData.date,
      department,
      lineId: activeLine,
      oldStyle: formData.oldStyle,
      newStyle: formData.newStyle,
      complexity: formData.complexity,
      startTime: formData.startTime,
      status: 'PENDING',
      checklist: { machineLayout: false, operatorBriefing: false, attachmentReady: false },
      remarks: formData.remarks,
      reporterId: currentUser.id,
      timestamp: new Date().toISOString()
    };

    if (isLive) {
      await apiService.saveQCO(newRecord);
    }
    mockDb.saveQCO(newRecord);
    
    refreshData();
    setMessage(`QCO Sequence initiated for ${activeLine}.`);
    setTimeout(() => setMessage(''), 3000);
    setFormData(prev => ({ ...prev, oldStyle: '', newStyle: '', remarks: '' }));
  };

  const handleResolve = async () => {
    if (!isResolving) return;
    const [startH, startM] = isResolving.startTime.split(':').map(Number);
    const [endH, endM] = resolveData.endTime.split(':').map(Number);
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 1440;

    const updated: QCORecord = {
      ...isResolving,
      endTime: resolveData.endTime,
      durationMinutes: diff,
      status: 'RESOLVED',
      checklist: {
        machineLayout: resolveData.machineLayout,
        operatorBriefing: resolveData.operatorBriefing,
        attachmentReady: resolveData.attachmentReady
      }
    };

    if (isLive) {
      await apiService.saveQCO(updated);
    }
    mockDb.saveQCO(updated);
    
    refreshData();
    setIsResolving(null);
    setMessage('QCO Successfully Resolved and Performance metrics logged.');
    setTimeout(() => setMessage(''), 3000);
  };

  const stats = useMemo(() => {
    const resolved = allRecords.filter(r => r.status === 'RESOLVED');
    const totalTime = resolved.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const avgTime = resolved.length > 0 ? Math.round(totalTime / resolved.length) : 0;
    return { avgTime, resolvedCount: resolved.length, pendingCount: allRecords.filter(r => r.status === 'PENDING').length };
  }, [allRecords]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/ie-activity`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-indigo-700 p-3 rounded-2xl text-white shadow-lg">
            <Zap size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Quick Change Over (QCO) Hub</h1>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-widest ${isLive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                {isLive ? 'Live Sync Active' : 'Local Sandbox Mode'}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>

        <div className="bg-white p-2 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-3">
           <LayoutGrid size={18} className="text-indigo-600 ml-2" />
           <select 
             className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 p-0 cursor-pointer"
             value={activeLine}
             onChange={e => setActiveLine(e.target.value)}
           >
             {userLines.map(l => <option key={l} value={l}>{l}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {[
           { label: 'Avg QCO Time', value: `${stats.avgTime}m`, color: 'text-indigo-600' },
           { label: 'Live Transitions', value: stats.pendingCount, color: 'text-orange-600' },
           { label: 'Completed Today', value: stats.resolvedCount, color: 'text-emerald-600' },
           { label: 'Complexity Index', value: 'Level B', color: 'text-blue-600' }
         ].map((s, i) => (
           <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between h-32">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl p-10 space-y-10">
         <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
               <Unlock size={24} className="text-indigo-600" /> Start Changeover Entry
            </h3>
            <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">Planning Sync Active</span>
         </div>

         <form onSubmit={handleStartQCO} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 items-end">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Plan Date</label>
               <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black shadow-inner" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>

            <SearchableSelect label="Old Style (Out)" options={styles} value={formData.oldStyle} placeholder="Pick Style..." icon={Tag} onChange={val => setFormData({...formData, oldStyle: val})} />
            <SearchableSelect label="New Style (In)" options={styles} value={formData.newStyle} placeholder="Pick Style..." icon={Zap} onChange={val => setFormData({...formData, newStyle: val})} />

            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Transition Complexity</label>
               <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black" value={formData.complexity} onChange={e => setFormData({...formData, complexity: e.target.value as any})}>
                  <option value="LOW">Low (Color/Minor)</option>
                  <option value="MEDIUM">Medium (Similar Style)</option>
                  <option value="HIGH">High (Full Changeover)</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Start Time</label>
               <div className="relative">
                  <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-black" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
               </div>
            </div>

            <button type="submit" className="bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl shadow-indigo-100 hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95">
               <RefreshCcw size={16} /> Open Sequence
            </button>
         </form>

         {message && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-xs font-black animate-in zoom-in-95">{message}</div>}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div>
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <History size={24} className="text-slate-400" /> QCO Performance Registry
               </h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live transitions & Style closure metrics</p>
            </div>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-5">Status / Resolution</th>
                    <th className="px-6 py-5">Line</th>
                    <th className="px-6 py-5">Style Transition</th>
                    <th className="px-6 py-5">Complexity</th>
                    <th className="px-6 py-5 text-center">Duration</th>
                    <th className="px-8 py-5 text-right">Audit Readiness</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                 {allRecords.filter(r => currentUser.role === UserRole.ADMIN || r.lineId === activeLine).sort((a,b) => a.status === 'PENDING' ? -1 : 1).map(r => (
                    <tr key={r.id} className={`hover:bg-slate-50/50 transition-all ${r.status === 'PENDING' ? 'bg-orange-50/30' : ''}`}>
                       <td className="px-8 py-6">
                          {r.status === 'PENDING' ? (
                             <button onClick={() => setIsResolving(r)} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-orange-100 hover:bg-black transition-all">
                                <RefreshCcw size={12}/> Resolve Transition
                             </button>
                          ) : (
                             <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit">
                                <CheckCircle size={14}/> Successfully Switched
                             </div>
                          )}
                       </td>
                       <td className="px-6 py-6"><span className="text-sm font-black text-slate-900">{r.lineId}</span></td>
                       <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                             <div className="text-slate-400 text-[9px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{r.oldStyle}</div>
                             <ArrowRight size={14} className="text-indigo-400" />
                             <div className="text-indigo-600 text-sm font-black uppercase">{r.newStyle}</div>
                          </div>
                       </td>
                       <td className="px-6 py-6">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-lg border uppercase ${
                             r.complexity === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                             r.complexity === 'MEDIUM' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                             'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                             {r.complexity} Complexity
                          </span>
                       </td>
                       <td className="px-6 py-6 text-center">
                          <div className="flex flex-col items-center">
                             <p className="text-sm font-black text-slate-900">{r.durationMinutes ? `${r.durationMinutes}m` : '--'}</p>
                             <p className="text-[9px] font-mono text-slate-400 uppercase">{r.startTime} {r.endTime ? `→ ${r.endTime}` : ''}</p>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          {r.status === 'RESOLVED' ? (
                             <div className="flex justify-end gap-1.5">
                                <Check size={14} className={r.checklist.machineLayout ? 'text-emerald-500' : 'text-slate-200'} />
                                <Check size={14} className={r.checklist.operatorBriefing ? 'text-emerald-500' : 'text-slate-200'} />
                                <Check size={14} className={r.checklist.attachmentReady ? 'text-emerald-500' : 'text-slate-200'} />
                             </div>
                          ) : <span className="text-[10px] font-black text-slate-300 uppercase italic">In Progress</span>}
                       </td>
                    </tr>
                 ))}
                 {allRecords.length === 0 && <tr><td colSpan={6} className="py-40 text-center opacity-30 italic">No QCO events tracked for selection.</td></tr>}
              </tbody>
           </table>
        </div>
      </div>

      {isResolving && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b pb-6">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Check size={24} className="text-emerald-600"/> Resolve QCO</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-1">Finalizing Transition Velocity</p>
                 </div>
                 <button onClick={() => setIsResolving(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-300"><X size={24}/></button>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase">Transition</p>
                 <p className="text-sm font-black text-slate-900">{isResolving.oldStyle} <ArrowRight size={12} className="inline mx-2" /> {isResolving.newStyle}</p>
                 <p className="text-xs text-indigo-600 font-bold uppercase mt-2 flex items-center gap-1.5"><Clock size={12}/> Started at {isResolving.startTime}</p>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Actual Completion Time</label>
                    <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-black" value={resolveData.endTime} onChange={e => setResolveData({...resolveData, endTime: e.target.value})} />
                 </div>
                 
                 <div className="space-y-4 pt-4 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2"><ListChecks size={14} className="text-indigo-600" /> Method Audit Checklist</p>
                    <div className="space-y-3">
                       {[
                         { id: 'machineLayout', label: 'Machine Layout Verified' },
                         { id: 'operatorBriefing', label: 'Operator Technical Briefing' },
                         { id: 'attachmentReady', label: 'Work Aids & Attachments Ready' }
                       ].map(item => (
                         <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-600">{item.label}</span>
                            <button 
                              type="button" 
                              onClick={() => setResolveData({...resolveData, [item.id]: !resolveData[item.id as keyof typeof resolveData]})}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${resolveData[item.id as keyof typeof resolveData] ? 'bg-indigo-600 text-white' : 'bg-white text-slate-200 border border-slate-200'}`}
                            >
                               <Check size={20}/>
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <button onClick={handleResolve} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                 <Save size={20}/> Commit Resolution
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default QCOHub;