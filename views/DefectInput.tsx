
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Save, CheckCircle, Hash, Tag, User as UserIcon, Box, Search, ChevronDown, Calendar, Palette, Activity, Clock, Filter, X, AlertTriangle, PieChart, ArrowRight, RotateCcw, ArrowLeft, Ruler } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { DepartmentType, AppUser, UserRole, WIPRecord } from '../types';

type EntryMode = 'OUTPUT' | 'DEFECT' | 'REJECT' | 'RECTIFY';

const SearchableSelect: React.FC<{
  label: string;
  options: string[];
  value: string;
  placeholder: string;
  icon: any;
  onChange: (val: string) => void;
  disabled?: boolean;
  accentColor?: "rose" | "blue" | "emerald" | "indigo";
}> = ({ label, options, value, placeholder, icon: Icon, onChange, disabled, accentColor = "rose" }) => {
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

  const getBorderColor = () => {
    switch(accentColor) {
      case 'rose': return 'hover:border-rose-400';
      case 'emerald': return 'hover:border-emerald-400';
      case 'indigo': return 'hover:border-indigo-400';
      default: return 'hover:border-blue-400';
    }
  };

  return (
    <div className={`space-y-2 relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-900 font-black cursor-pointer flex items-center justify-between group transition-colors shadow-sm ${getBorderColor()}`}
      >
        <Icon size={18} className="absolute left-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value || placeholder}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2">
           <div className="p-3 border-b border-slate-50 bg-slate-50/50">
              <div className="relative">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input autoFocus className="w-full bg-white border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} />
              </div>
           </div>
           <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredOptions.map((o, i) => <div key={i} onClick={() => { onChange(o); setIsOpen(false); setSearchTerm(''); }} className="px-5 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors">{o}</div>)}
           </div>
        </div>
      )}
    </div>
  );
};

const DefectInput: React.FC<{ department: DepartmentType; currentUser: AppUser }> = ({ department, currentUser }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<EntryMode>('OUTPUT');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [wipData, setWipData] = useState<WIPRecord[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Registry Table Filters
  const [logFilters, setLogFilters] = useState({
    date: '',
    so: '',
    buyer: '',
    style: '',
    color: ''
  });

  const userLines = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN) {
      return mockDb.getSystemConfig().lineMappings.filter(m => m.sectionId === department).map(m => m.lineId);
    }
    return currentUser.lines || [];
  }, [currentUser, department]);

  const [activeLine, setActiveLine] = useState(userLines[0] || 'Line 01');
  const [formData, setForm] = useState({ buyer: '', soNumber: '', styleNumber: '', color: '', size: '', defectType: '', count: 0 });

  useEffect(() => {
    refreshData();
  }, [department, activeLine, filterDate]);

  const refreshData = () => {
    const wip = mockDb.getWIP(department).filter(w => w.lineId === activeLine && w.reporterRole === 'PRODUCTION_INPUT');
    const prod = mockDb.getProduction(department).filter(p => p.lineId === activeLine);
    const defects = mockDb.getDefects(department).filter(d => d.lineId === activeLine);
    
    setWipData(wip);
    const logs: any[] = [];
    prod.forEach(p => logs.push({ ...p, type: p.isRectification ? 'RECTIFIED' : 'OUTPUT' }));
    defects.forEach(d => logs.push({ ...d, type: d.isReject ? 'REJECT' : 'DEFECT' }));
    setActivityLog(logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const currentWipBalance = useMemo(() => {
    if (!formData.styleNumber || !formData.soNumber || !formData.color) return Infinity;
    
    const relevantInputs = wipData.filter(w => 
      w.styleNumber === formData.styleNumber && 
      w.soNumber === formData.soNumber && 
      w.color === formData.color
    );
    const totalIn = relevantInputs.reduce((s, w) => s + w.inputQty, 0);

    const relevantOutputs = mockDb.getProduction(department).filter(p => 
      p.lineId === activeLine &&
      p.styleCode === formData.styleNumber && 
      p.soNumber === formData.soNumber && 
      p.color === formData.color
    );
    const totalOut = relevantOutputs.reduce((s, p) => s + p.actual, 0);

    return totalIn - totalOut;
  }, [formData, wipData, activeLine, department]);

  // SIZE-WISE RECTIFICATION BALANCE LOGIC (Scoped to current department selection)
  const rejectedSizesForCurrentSelection = useMemo(() => {
    if (mode !== 'RECTIFY' || !formData.buyer || !formData.soNumber || !formData.styleNumber) return [];
    
    const sizeMap = new Map<string, number>();
    activityLog.forEach(l => {
      // Must be same department for rectification to make sense in that section
      if (l.department !== department) return;
      if (l.buyer === formData.buyer && 
          l.soNumber === formData.soNumber && 
          (l.styleCode === formData.styleNumber || l.styleNumber === formData.styleNumber) && 
          l.color === formData.color) {
        
        const size = l.size || 'N/A';
        const count = l.type === 'REJECT' ? (l.count || 0) : (l.type === 'RECTIFIED' ? -(l.actual || 0) : 0);
        sizeMap.set(size, (sizeMap.get(size) || 0) + count);
      }
    });

    return Array.from(sizeMap.entries())
      .filter(([size, balance]) => balance > 0)
      .map(([size]) => size)
      .sort();
  }, [mode, formData, activityLog, department]);

  const availableToRectify = useMemo(() => {
    if (mode !== 'RECTIFY' || !formData.buyer || !formData.soNumber || !formData.styleNumber || !formData.size) return 0;
    
    const totalRejected = activityLog
      .filter(l => l.type === 'REJECT' && 
                  l.department === department &&
                  l.buyer === formData.buyer && 
                  l.soNumber === formData.soNumber && 
                  (l.styleCode === formData.styleNumber || l.styleNumber === formData.styleNumber) && 
                  l.color === formData.color &&
                  l.size === formData.size)
      .reduce((s, l) => s + (l.count || 0), 0);

    const totalRectified = activityLog
      .filter(l => l.type === 'RECTIFIED' && 
                  l.department === department &&
                  l.buyer === formData.buyer && 
                  l.soNumber === formData.soNumber && 
                  l.styleCode === formData.styleNumber && 
                  l.color === formData.color &&
                  l.size === formData.size)
      .reduce((s, l) => s + (l.actual || 0), 0);

    return Math.max(0, totalRejected - totalRectified);
  }, [mode, formData, activityLog, department]);

  const isInvalidQuantity = (mode === 'OUTPUT' && formData.count > currentWipBalance) || 
                            (mode === 'RECTIFY' && (!formData.size || formData.count > availableToRectify)) ||
                            (mode === 'REJECT' && !formData.size);

  const stats = useMemo(() => {
    const todayLogs = activityLog.filter(l => l.date === filterDate);
    const totalIn = wipData.reduce((s, w) => s + w.inputQty, 0);
    const totalOut = todayLogs.filter(l => l.type === 'OUTPUT' || l.type === 'RECTIFIED').reduce((s, l) => s + (l.actual || 0), 0);
    const totalDefects = todayLogs.filter(l => l.type === 'DEFECT').reduce((s, l) => s + (l.count || 0), 0);
    const totalRejects = todayLogs.filter(l => l.type === 'REJECT').reduce((s, l) => s + (l.count || 0), 0);
    
    const analysisMap = new Map<string, { defects: number, rejects: number, style: string, buyer: string }>();
    todayLogs.filter(l => l.type === 'DEFECT' || l.type === 'REJECT').forEach(l => {
      const key = `${l.buyer}-${l.styleCode}`;
      const existing = analysisMap.get(key) || { defects: 0, rejects: 0, style: l.styleCode, buyer: l.buyer };
      if (l.type === 'DEFECT') existing.defects += (l.count || 0);
      if (l.type === 'REJECT') existing.rejects += (l.count || 0);
      analysisMap.set(key, existing);
    });

    const rejectMap = new Map<string, { count: number, style: string, buyer: string }>();
    activityLog.filter(l => l.type === 'REJECT').forEach(l => {
      const key = `${l.buyer}-${l.styleCode}`;
      const existing = rejectMap.get(key) || { count: 0, style: l.styleCode, buyer: l.buyer };
      existing.count += (l.count || 0);
      rejectMap.set(key, existing);
    });

    return { 
      totalIn, totalOut, balance: totalIn - totalOut, 
      totalRejects,
      dhu: totalOut > 0 ? (totalDefects / totalOut) * 100 : 0,
      qualityAnalysis: Array.from(analysisMap.values()).sort((a,b) => (b.defects + b.rejects) - (a.defects + a.rejects)).slice(0, 3),
      rejectAnalysis: Array.from(rejectMap.values()).sort((a,b) => b.count - a.count)
    };
  }, [wipData, activityLog, filterDate]);

  const filteredRegistry = useMemo(() => {
    return activityLog.filter(l => {
      const matchDate = !logFilters.date || l.date === logFilters.date;
      const matchSO = !logFilters.so || l.soNumber.toLowerCase().includes(logFilters.so.toLowerCase());
      const matchBuyer = !logFilters.buyer || l.buyer.toLowerCase().includes(logFilters.buyer.toLowerCase());
      const matchStyle = !logFilters.style || (l.styleCode || l.styleNumber).toLowerCase().includes(logFilters.style.toLowerCase());
      const matchColor = !logFilters.color || (l.color || '').toLowerCase().includes(logFilters.color.toLowerCase());
      return matchDate && matchSO && matchBuyer && matchStyle && matchColor;
    });
  }, [activityLog, logFilters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.buyer || !formData.soNumber || !formData.styleNumber || formData.count <= 0) { alert("Invalid Selection."); return; }
    if (isInvalidQuantity) { 
      if(mode === 'RECTIFY' && !formData.size) alert("Size is mandatory for rectification.");
      else if(mode === 'RECTIFY') alert(`Error: Rectify quantity (${formData.count}) exceeds available rejects (${availableToRectify}) for this size!`);
      else if(mode === 'REJECT' && !formData.size) alert("Size is mandatory for rejection.");
      else alert(`Error: Output exceeds WIP Balance (${currentWipBalance}).`); 
      return; 
    }
    
    const now = new Date();
    const finalSize = (mode === 'REJECT' || mode === 'RECTIFY') ? formData.size : undefined;

    const common = { 
        id: Date.now().toString(), date: filterDate, time: now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', hour12:false }), 
        timestamp: now.toISOString(), department, section: department, blockId: 'Unknown', lineId: activeLine, 
        soNumber: formData.soNumber, buyer: formData.buyer, styleCode: formData.styleNumber, color: formData.color, 
        size: finalSize,
        reporterId: currentUser.id 
    };

    if (mode === 'OUTPUT') {
      mockDb.saveProduction({ ...common, actual: formData.count, target: 0, hour: now.getHours() });
    } else if (mode === 'RECTIFY') {
      mockDb.saveProduction({ ...common, actual: formData.count, target: 0, hour: now.getHours(), isRectification: true });
      mockDb.saveDefect({ ...common, defectType: 'Rectified Rejection', count: -formData.count, isReject: true });
      setMessage(`Rectification of ${formData.count} PCS (${formData.size}) recovered to production.`);
    } else {
      mockDb.saveDefect({ ...common, defectType: formData.defectType, count: formData.count, isReject: mode === 'REJECT' });
      setMessage(`${mode} committed to ledger.`);
    }
    
    setTimeout(() => setMessage(''), 3000);
    setForm(prev => ({ ...prev, count: 0 }));
    refreshData();
  };

  const buyersList = useMemo(() => Array.from(new Set(wipData.map(w => w.buyer))).sort(), [wipData]);
  const soNumbersList = useMemo(() => formData.buyer ? Array.from(new Set(wipData.filter(w => w.buyer === formData.buyer).map(w => w.soNumber))).sort() : [], [formData.buyer, wipData]);
  const stylesList = useMemo(() => formData.soNumber ? Array.from(new Set(wipData.filter(w => w.soNumber === formData.soNumber).map(w => w.styleNumber))).sort() : [], [formData.soNumber, wipData]);
  const colorsList = useMemo(() => formData.styleNumber ? Array.from(new Set(wipData.filter(w => w.styleNumber === formData.styleNumber).map(w => w.color))).sort() : [], [formData.styleNumber, wipData]);

  return (
    <div className="max-w-[1650px] mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/hub`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-rose-600 p-3 rounded-2xl text-white shadow-lg"><ShieldAlert size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">{department} QC & Output Hub</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <Calendar size={18} className="text-slate-400 ml-2" /><input type="date" className="bg-transparent border-none text-xs font-black text-slate-900 outline-none p-0" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
           </div>
           <select className="bg-white border border-slate-200 rounded-2xl px-6 py-3 text-xs font-black outline-none cursor-pointer" value={activeLine} onChange={e => setActiveLine(e.target.value)}>{userLines.map(l => <option key={l} value={l}>{l}</option>)}</select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
         {[ { label: 'Total Input', value: stats.totalIn, icon: Box, color: 'text-blue-600' }, { label: 'Output (Today)', value: stats.totalOut, icon: CheckCircle, color: 'text-emerald-600' }, { label: 'Balance WIP', value: stats.balance, icon: Clock, color: 'text-orange-600' } ].map(s => (
           <div key={s.label} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className={`${s.color} bg-current/10 p-2.5 rounded-xl w-fit mb-4`}><s.icon size={20} /></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p><p className="text-3xl font-black text-slate-900">{s.value.toLocaleString()}</p></div>
           </div>
         ))}
         
         <button 
           onClick={() => setShowAnalysis(true)}
           className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rose-400 transition-all text-left border-b-4 border-b-rose-500 group"
         >
            <div className="flex justify-between items-center mb-4"><div className="text-rose-600 bg-rose-50 p-2.5 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all"><AlertTriangle size={20} /></div><span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">Analysis Mode</span></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reject Quantity</p><p className="text-3xl font-black text-rose-600">{stats.totalRejects.toLocaleString()}</p></div>
         </button>

         <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-4"><div className="bg-white/10 p-2.5 rounded-xl"><PieChart size={18} /></div><span className="text-[8px] font-black uppercase bg-rose-50 px-2 py-0.5 rounded">Quality Analysis</span></div>
            <div className="space-y-2">
               {stats.qualityAnalysis.map((a, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1">
                     <div className="truncate pr-2"><p className="font-black truncate">{a.buyer}</p><p className="text-white/40 truncate">{a.style}</p></div>
                     <div className="flex items-center gap-2"><span className="text-amber-400 font-bold">{a.defects}D</span><span className="text-rose-400 font-bold">{a.rejects}R</span></div>
                  </div>
               ))}
               {stats.qualityAnalysis.length === 0 && <p className="text-[10px] text-white/30 italic py-2">No faults logged today.</p>}
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl p-10 space-y-10">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner">
           {(['OUTPUT', 'DEFECT', 'REJECT', 'RECTIFY'] as EntryMode[]).map(m => (
             <button 
                key={m} 
                onClick={() => setMode(m)} 
                className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  mode === m 
                  ? (m === 'RECTIFY' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg') 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
             >
                {m}
             </button>
           ))}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-20">
           <SearchableSelect label="Buyer (Search Floor WIP)" options={buyersList} value={formData.buyer} placeholder="Search Active WIP..." icon={UserIcon} accentColor={mode === 'OUTPUT' ? 'emerald' : mode === 'RECTIFY' ? 'indigo' : 'rose'} onChange={val => setForm({...formData, buyer: val, soNumber: '', styleNumber: '', color: '', size: ''})} />
           <SearchableSelect label="SO Number" options={soNumbersList} value={formData.soNumber} placeholder="Select SO..." icon={Hash} disabled={!formData.buyer} onChange={val => setForm({...formData, soNumber: val, styleNumber: '', color: '', size: ''})} />
           <SearchableSelect label="Style" options={stylesList} value={formData.styleNumber} placeholder="Select Style..." icon={Tag} disabled={!formData.soNumber} onChange={val => setForm({...formData, styleNumber: val, color: '', size: ''})} />
           <SearchableSelect label="Color" options={colorsList} value={formData.color} placeholder="Select Color..." icon={Palette} disabled={!formData.styleNumber} onChange={val => setForm({...formData, color: val, size: ''})} />
           
           { (mode === 'REJECT' || mode === 'RECTIFY') && (
             mode === 'REJECT' ? (
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Garment Size (Manual)</label>
                  <div className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-900 font-black flex items-center shadow-sm hover:border-rose-400 group transition-colors">
                    <Ruler size={18} className="absolute left-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <input 
                      className="bg-transparent border-none outline-none w-full p-0 text-slate-900 font-black placeholder:text-slate-300"
                      placeholder="Type size..."
                      value={formData.size}
                      onChange={e => setForm({...formData, size: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>
             ) : (
                <SearchableSelect 
                   label="Rejected Size (Auto)" 
                   options={rejectedSizesForCurrentSelection} 
                   value={formData.size} 
                   placeholder="Select Rejected Size..." 
                   icon={Ruler} 
                   accentColor="indigo" 
                   onChange={val => setForm({...formData, size: val})} 
                />
             )
           )}

           <div className="space-y-2">
              <div className="flex justify-between px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">{mode === 'RECTIFY' ? 'Rectify Qty' : 'Log Qty (PCS)'}</label>
                {mode === 'OUTPUT' && formData.styleNumber && <span className="text-[9px] font-black uppercase text-blue-600">Max: {currentWipBalance}</span>}
                {mode === 'RECTIFY' && formData.size && <span className="text-[9px] font-black uppercase text-indigo-600">Avail: {availableToRectify}</span>}
              </div>
              <input type="number" required className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 text-slate-900 font-black outline-none focus:ring-4 transition-all ${isInvalidQuantity ? 'border-rose-400 focus:ring-rose-500/10' : mode === 'RECTIFY' ? 'border-indigo-200 focus:ring-indigo-500/10' : 'border-slate-200 focus:ring-blue-500/10'}`} value={formData.count || ''} onChange={e => setForm({...formData, count: parseInt(e.target.value) || 0})} placeholder="0" />
              {isInvalidQuantity && (
                <p className="text-[9px] font-bold text-rose-600 px-1 mt-1 animate-bounce">
                  {mode === 'RECTIFY' ? (!formData.size ? 'Size is required!' : 'Rectify quantity cannot exceed available rejects for this size!') : (mode === 'REJECT' && !formData.size ? 'Size is required!' : 'Exceeds available floor stock!')}
                </p>
              )}
           </div>
           
           {(mode === 'DEFECT' || mode === 'REJECT') && (
             <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{mode} Reason</label><select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-black outline-none focus:ring-4 focus:ring-rose-500/10" value={formData.defectType} onChange={e => setForm({...formData, defectType: e.target.value})}><option value="">Select Reason</option>{mockDb.getDefectCategories(department, mode === 'REJECT').map(d => <option key={d} value={d}>{d}</option>)}</select></div>
           )}

           {mode === 'RECTIFY' && (
             <div className="space-y-2 flex flex-col justify-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100"><div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase mb-1"><RotateCcw size={12}/> Recovery Workflow</div><p className="text-[9px] text-indigo-400 font-medium leading-tight">Size-wise recovery: Restores output and clears pending rejects.</p></div>
           )}

           <div className={`lg:col-span-2 flex items-end ${mode === 'DEFECT' || mode === 'OUTPUT' ? 'lg:col-span-3' : ''}`}><button type="submit" disabled={isInvalidQuantity} className={`w-full text-white py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isInvalidQuantity ? 'bg-slate-300 cursor-not-allowed' : (mode === 'OUTPUT' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : mode === 'RECTIFY' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100')}`}><Save size={20}/> {mode === 'RECTIFY' ? 'Commit Recovery' : `Commit Floor ${mode}`}</button></div>
        </form>
        {message && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold animate-in zoom-in-95">{message}</div>}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 space-y-6">
           <div className="flex justify-between items-center"><h3 className="text-xl font-black text-slate-900">Output Log Registry</h3><button onClick={() => setLogFilters({date:'', so:'', buyer:'', style:'', color:''})} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline"><X size={14}/> Clear Filters</button></div>
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative"><Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="date" className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[11px] font-black outline-none shadow-sm" value={logFilters.date} onChange={e => setLogFilters({...logFilters, date: e.target.value})}/></div>
              <div className="relative"><Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[11px] font-black outline-none shadow-sm" placeholder="SO#" value={logFilters.so} onChange={e => setLogFilters({...logFilters, so: e.target.value})}/></div>
              <div className="relative"><UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[11px] font-black outline-none shadow-sm" placeholder="Buyer" value={logFilters.buyer} onChange={e => setLogFilters({...logFilters, buyer: e.target.value})}/></div>
              {/* Added comment above the fix: Ensure 'e' is passed correctly to the event handler */}
              <div className="relative"><Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[11px] font-black outline-none shadow-sm" placeholder="Style" value={logFilters.style} onChange={e => setLogFilters({...logFilters, style: e.target.value})}/></div>
              <div className="relative"><Palette size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[11px] font-black outline-none shadow-sm" placeholder="Color" value={logFilters.color} onChange={e => setLogFilters({...logFilters, color: e.target.value})}/></div>
           </div>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <th className="px-10 py-6">Date & Time</th>
                    <th className="px-8 py-6">Buyer / Style / SO</th>
                    <th className="px-8 py-6">Variant (Color/Size)</th>
                    <th className="px-8 py-6">Entry Type</th>
                    <th className="px-8 py-6 text-center">Qty</th>
                    <th className="px-10 py-6">Context</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredRegistry.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-all font-semibold text-slate-700 group">
                       <td className="px-10 py-6"><p className="text-sm font-black text-slate-900">{l.date}</p><p className="text-[10px] text-slate-400">{l.time}</p></td>
                       <td className="px-8 py-6"><p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{l.buyer}</p><p className="text-[10px] font-black text-slate-400 uppercase">{(l.styleCode || l.styleNumber)} <span className="mx-1">/</span> #{l.soNumber}</p></td>
                       <td className="px-8 py-6">
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-slate-500 uppercase">{l.color || 'N/A'}</span>
                            { (l.type === 'REJECT' || l.type === 'RECTIFIED') && l.size && (
                              <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 w-fit uppercase">{l.size}</span>
                            )}
                         </div>
                       </td>
                       <td className="px-8 py-6"><span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase ${l.type === 'OUTPUT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : l.type === 'RECTIFIED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : l.type === 'REJECT' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{l.type}</span></td>
                       <td className="px-8 py-6 text-center text-xl font-black text-slate-900">{l.actual || l.count}</td>
                       <td className="px-10 py-6 text-xs text-slate-400 italic">{l.defectType || (l.type === 'RECTIFIED' ? 'Recovered from Reject Pool' : 'Standard Production Output')}</td>
                    </tr>
                 ))}
                 {filteredRegistry.length === 0 && <tr><td colSpan={6} className="py-24 text-center text-slate-300 font-bold italic">No log entries found for current selection.</td></tr>}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default DefectInput;