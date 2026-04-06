
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, AlertTriangle, Save, Bell, Info, Hammer, CheckCircle, Clock, Users, X, Check, History as HistoryIcon, LayoutGrid, Lock as LockIcon, Unlock, User, Tag, UserCheck, ChevronDown, Search, Filter, List, ArrowRight, ArrowLeft } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { AppNotification, DepartmentType, NPTRecord, UserRole, WIPRecord, AppUser } from '../types';

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

const NPTInput: React.FC<{ department: DepartmentType, currentUser: AppUser }> = ({ department, currentUser }) => {
  const navigate = useNavigate();
  const allSystemLines = useMemo(() => mockDb.getSystemConfig().lineMappings.map(m => m.lineId), []);
  const userLines = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN) return allSystemLines;
    return currentUser.lines || [];
  }, [currentUser, allSystemLines]);

  const [activeLine, setActiveLine] = useState(userLines[0] || 'Line 01');
  const [allDeptRecords, setAllDeptRecords] = useState<NPTRecord[]>([]);
  const [isSolving, setIsSolving] = useState<NPTRecord | null>(null);
  
  const config = mockDb.getSystemConfig();
  const nptConfigForDept = config.nptConfig[department] || {};
  const nptCategories = Object.keys(nptConfigForDept) as string[];

  const activeWIP = useMemo<WIPRecord[]>(() => (mockDb.getWIP(department) as WIPRecord[]).filter(w => w.lineId === activeLine), [department, activeLine]);
  const lineBuyers = useMemo<string[]>(() => Array.from(new Set(activeWIP.map(w => w.buyer))).sort() as string[], [activeWIP]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    issueCategory: nptCategories[0] || '',
    buyer: '',
    styleNumber: '',
    reason: '',
    details: '',
    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  });

  const availableReasons = useMemo(() => {
    return (nptConfigForDept[formData.issueCategory] || []) as string[];
  }, [formData.issueCategory, nptConfigForDept]);

  const [logFilter, setLogFilter] = useState({
    search: '',
    status: 'ALL',
    category: 'ALL'
  });

  const lineStyles = useMemo<string[]>(() => {
    if (!formData.buyer) return [];
    return Array.from(new Set(activeWIP.filter(w => w.buyer === formData.buyer).map(w => w.styleNumber))).sort() as string[];
  }, [activeWIP, formData.buyer]);

  const [solveData, setSolveData] = useState({
    endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    affectedManpower: 0
  });

  const [message, setMessage] = useState('');

  const refreshRecords = () => {
    setAllDeptRecords(mockDb.getNPT(department));
  };

  useEffect(() => {
    refreshRecords();
  }, [department]);

  const filteredRecords = useMemo<NPTRecord[]>(() => {
    return allDeptRecords.filter((r: NPTRecord) => {
      const matchLine = currentUser.role === UserRole.ADMIN || r.lineId === activeLine; 
      const matchSearch = !logFilter.search || 
        r.reason.toLowerCase().includes(logFilter.search.toLowerCase()) ||
        r.styleNumber?.toLowerCase().includes(logFilter.search.toLowerCase());
      const matchStatus = logFilter.status === 'ALL' || r.status === logFilter.status;
      const matchCat = logFilter.category === 'ALL' || r.issueCategory === logFilter.category;
      
      return matchLine && matchSearch && matchStatus && matchCat;
    }).sort((a: NPTRecord, b: NPTRecord) => {
      if (a.status === 'PENDING' && b.status === 'RESOLVED') return -1;
      if (a.status === 'RESOLVED' && b.status === 'PENDING') return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [allDeptRecords, logFilter, activeLine, currentUser]);

  const lineWiseLossAnalysis = useMemo(() => {
    const todayRecords = allDeptRecords.filter((r: NPTRecord) => r.date === formData.date);
    const lineMap = new Map<string, { totalTime: number, eventCount: number }>();
    
    todayRecords.forEach((r: NPTRecord) => {
      const existing = lineMap.get(r.lineId) || { totalTime: 0, eventCount: 0 };
      lineMap.set(r.lineId, {
        totalTime: existing.totalTime + (r.durationMinutes || 0),
        eventCount: existing.eventCount + 1
      });
    });

    return Array.from(lineMap.entries())
      .map(([lineId, stats]) => ({ lineId, ...stats }))
      .sort((a, b) => b.totalTime - a.totalTime);
  }, [allDeptRecords, formData.date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason || !formData.buyer || !formData.styleNumber || !formData.issueCategory) {
      alert("Please provide Buyer, Style, Category and Reason.");
      return;
    }

    const newRecord: NPTRecord = {
      id: Date.now().toString(),
      date: formData.date,
      department,
      lineId: activeLine,
      issueCategory: formData.issueCategory,
      buyer: formData.buyer,
      styleNumber: formData.styleNumber,
      reason: formData.reason,
      details: formData.details,
      startTime: formData.startTime,
      status: 'PENDING',
      reporterId: currentUser.id,
      timestamp: new Date().toISOString()
    };

    mockDb.saveNPT(newRecord);
    
    const routes = mockDb.getNotificationRoutes() as any[];
    const activeRoute = routes.find(r => r.fromDepartment === department && r.issueType === formData.issueCategory);
    if (activeRoute) {
      const alert: AppNotification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        from: `${currentUser.name} (${activeLine})`,
        toDepartment: activeRoute.toDepartment,
        toRole: activeRoute.toRole,
        message: `DOWNTIME ALERT: ${formData.issueCategory} at ${activeLine}. Buyer: ${formData.buyer}, Style: ${formData.styleNumber}. Reason: ${formData.reason}.`,
        readBy: [],
        type: 'ALERT'
      };
      mockDb.saveNotification(alert);
    }

    refreshRecords();
    setMessage(`Downtime event logged for ${activeLine}. Alert dispatched.`);
    setTimeout(() => setMessage(''), 4000);
    
    setFormData(prev => ({ 
      ...prev, 
      reason: '', 
      details: '', 
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) 
    }));
  };

  const handleSolve = () => {
    if (!isSolving) return;
    const [startH, startM] = isSolving.startTime.split(':').map(Number);
    const [endH, endM] = solveData.endTime.split(':').map(Number);
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 1440; 

    const updated: NPTRecord = {
      ...isSolving,
      endTime: solveData.endTime,
      affectedManpower: solveData.affectedManpower,
      durationMinutes: diff,
      status: 'RESOLVED'
    };

    mockDb.saveNPT(updated); 
    refreshRecords();
    setIsSolving(null);
    setMessage('Loss event resolved and metrics synchronized.');
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/hub`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-rose-600 p-3 rounded-2xl text-white shadow-lg">
            <Timer size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">{department} Downtime Portal</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>

        <div className="bg-white p-2 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-3">
           <div className="bg-rose-600 text-white p-2 rounded-xl">
              <LayoutGrid size={18} />
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Station Control</span>
              {userLines.length > 1 ? (
                <select 
                   className="bg-transparent border-none text-xs font-black text-rose-600 focus:ring-0 p-0 cursor-pointer"
                   value={activeLine}
                   onChange={(e) => {
                     setActiveLine(e.target.value);
                     setFormData(prev => ({ ...prev, buyer: '', styleNumber: '' }));
                   }}
                >
                   {userLines.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              ) : (
                <span className="text-xs font-black text-rose-600">{activeLine}</span>
              )}
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl p-10 space-y-8">
        <div className="flex items-center justify-between">
           <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <AlertTriangle size={24} className="text-rose-600" /> Start Loss Entry
           </h3>
           <span className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border border-rose-100 tracking-widest">Live Monitoring</span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 items-end">
           <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Plan Date</label>
             <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
           </div>

           <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">NPT Category</label>
             <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black outline-none focus:ring-4 focus:ring-rose-500/10 shadow-sm cursor-pointer" value={formData.issueCategory} onChange={e => setFormData({...formData, issueCategory: e.target.value, reason: ''})}>
                <option value="">Select Category</option>
                {nptCategories.map(r => <option key={r} value={r}>{r}</option>)}
             </select>
           </div>

           <div className="xl:col-span-1">
             <SearchableSelect label="Buyer" options={lineBuyers} value={formData.buyer} placeholder="Select Buyer..." icon={User} onChange={val => setFormData({...formData, buyer: val, styleNumber: ''})} />
           </div>

           <div className="xl:col-span-1">
             <SearchableSelect label="Style" options={lineStyles} value={formData.styleNumber} placeholder="Select Style..." icon={Tag} disabled={!formData.buyer} onChange={val => setFormData({...formData, styleNumber: val})} />
           </div>

           <div className="space-y-1.5 xl:col-span-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Loss Start Time</label>
             <div className="relative">
               <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
               <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-black shadow-sm" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
             </div>
           </div>

           <div className="space-y-1.5 lg:col-span-1">
             <SearchableSelect 
               label="Primary Reason" 
               options={availableReasons} 
               value={formData.reason} 
               placeholder={formData.issueCategory ? "Select Reason..." : "Pick Category First"} 
               icon={List} 
               disabled={!formData.issueCategory}
               onChange={val => setFormData({...formData, reason: val})} 
             />
           </div>

           <button type="submit" className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95">
             <Unlock size={16} /> Open Loss
           </button>
        </form>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div>
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <HistoryIcon size={24} className="text-slate-400" /> Loss Activity Registry
               </h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Station history & live resolutions</p>
            </div>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                 <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-5">Status / Action</th>
                    <th className="px-6 py-5">Line Identity</th>
                    <th className="px-6 py-5">Buyer & Style</th>
                    <th className="px-6 py-5">NPT Category & Reason</th>
                    <th className="px-6 py-5 text-center">Duration</th>
                    <th className="px-8 py-5 text-right text-rose-400">Total Loss (M-M)</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredRecords.map(r => {
                   const isPending = r.status === 'PENDING';
                   const totalLossMM = r.durationMinutes && r.affectedManpower ? r.durationMinutes * r.affectedManpower : 0;
                   const canManage = r.reporterId === currentUser.id || currentUser.role === UserRole.ADMIN;

                   return (
                     <tr key={r.id} className={`group transition-all ${isPending ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-8 py-6">
                           {isPending ? (
                              <button 
                                onClick={() => canManage && setIsSolving(r)}
                                disabled={!canManage}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm transition-all ${canManage ? 'bg-rose-600 text-white hover:bg-black active:scale-95 shadow-rose-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                              >
                                 {canManage ? <Unlock size={12}/> : <LockIcon size={12}/>}
                                 {canManage ? 'Fix Now' : 'Station Locked'}
                              </button>
                           ) : (
                              <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit shadow-sm">
                                 <CheckCircle size={14}/> Fixed
                              </div>
                           )}
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900">{r.lineId}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{department}</span>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-blue-600 truncate max-w-[150px]">{r.buyer}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">{r.styleNumber}</span>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                           <p className="text-sm font-black text-slate-900">{r.reason}</p>
                           <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1.5 uppercase">
                              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[8px]">{r.issueCategory}</span>
                           </p>
                        </td>
                        <td className="px-6 py-6 text-center">
                           <div className="flex flex-col items-center">
                              <p className={`text-sm font-black ${r.durationMinutes ? 'text-slate-900' : 'text-slate-300'}`}>{r.durationMinutes ? `${r.durationMinutes}m` : '--'}</p>
                              <p className="text-[9px] font-mono text-slate-400 uppercase">{r.startTime} {r.endTime ? `→ ${r.endTime}` : ''}</p>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <p className={`text-base font-black tabular-nums ${totalLossMM > 0 ? 'text-rose-600' : 'text-slate-200'}`}>
                              {totalLossMM > 0 ? totalLossMM.toLocaleString() : 'N/A'}
                           </p>
                        </td>
                     </tr>
                   );
                 })}
              </tbody>
           </table>
        </div>
      </div>

      {isSolving && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b pb-6">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                       <Check size={24} className="text-emerald-600"/> Resolve Event
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-1">Calculating station downtime impact</p>
                 </div>
                 <button onClick={() => setIsSolving(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24}/></button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Actual Completion Time</label>
                    <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-black outline-none" value={solveData.endTime} onChange={e => setSolveData({...solveData, endTime: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Affected Manpower (Heads)</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-black outline-none" placeholder="Heads idled..." value={solveData.affectedManpower || ''} onChange={e => setSolveData({...solveData, affectedManpower: parseInt(e.target.value) || 0})} />
                 </div>
              </div>

              <button onClick={handleSolve} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95">
                <Save size={20} /> Commit Resolution
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default NPTInput;
