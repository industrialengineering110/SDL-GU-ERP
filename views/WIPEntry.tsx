import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Save, Search, ChevronDown, User as UserIcon, Tag, Hash, Box, Calendar, Palette, Clock, CheckCircle, AlertTriangle, X, PieChart, ArrowRight, Filter, ArrowLeft } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { AppUser, WIPRecord, StyleConfirmation, UserRole } from '../types';

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
    <div className={`space-y-2 relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-slate-900 font-black cursor-pointer flex items-center justify-between group hover:border-blue-400 transition-colors shadow-sm"
      >
        <Icon size={18} className="absolute left-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value || placeholder}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
           <div className="p-3 border-b border-slate-50 bg-slate-50/50">
              <div className="relative">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input autoFocus className="w-full bg-white border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} />
              </div>
           </div>
           <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredOptions.map((opt, idx) => (
                <div key={idx} onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }} className="px-5 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors">{opt}</div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

const WIPEntry: React.FC<{ currentUser: AppUser; department: string }> = ({ currentUser, department }) => {
  const navigate = useNavigate();
  const [confirmations, setConfirmations] = useState<StyleConfirmation[]>([]);
  const [history, setHistory] = useState<WIPRecord[]>([]);
  const [message, setMessage] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Chalan Log Filters
  const [logFilters, setLogFilters] = useState({
    date: '',
    so: '',
    buyer: '',
    style: '',
    color: ''
  });

  const assignedSection = currentUser.section || department;
  const userLines = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN) {
      return mockDb.getSystemConfig().lineMappings.filter(m => m.sectionId === assignedSection).map(m => m.lineId);
    }
    return currentUser.lines || [];
  }, [currentUser, assignedSection]);
  
  const [activeLine, setActiveLine] = useState(userLines[0] || 'Line 01');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    styleNumber: '',
    soNumber: '',
    color: '',
    buyer: '',
    qty: 0,
    lineId: userLines[0] || 'Line 01'
  });

  useEffect(() => {
    setConfirmations(mockDb.getStyleConfirmations());
    refreshData();
  }, [assignedSection, activeLine]);

  const refreshData = () => {
    const wip = mockDb.getWIP(assignedSection).filter(r => r.lineId === activeLine && r.reporterRole === 'PRODUCTION_INPUT');
    setHistory(wip);
  };

  const totals = useMemo(() => {
    const prod = mockDb.getProduction(assignedSection).filter(p => p.lineId === activeLine);
    const defects = mockDb.getDefects(department).filter(d => d.lineId === activeLine && d.isReject);
    
    const totalIn = history.reduce((s, h) => s + h.inputQty, 0);
    const totalOut = prod.reduce((s, p) => s + p.actual, 0);
    const totalRejects = defects.reduce((s, d) => s + d.count, 0);

    const analysisMap = new Map<string, { count: number, style: string, buyer: string }>();
    defects.forEach(d => {
      const key = `${d.buyer}-${d.styleCode}`;
      const existing = analysisMap.get(key) || { count: 0, style: d.styleCode, buyer: d.buyer };
      existing.count += d.count;
      analysisMap.set(key, existing);
    });

    return { 
      totalIn, 
      totalOut, 
      totalWIP: totalIn - totalOut, 
      totalRejects,
      analysis: Array.from(analysisMap.values()).sort((a,b) => b.count - a.count)
    };
  }, [history, assignedSection, activeLine, department]);

  const fifoHistory = useMemo(() => {
    const allOut = mockDb.getProduction(assignedSection).filter(p => p.lineId === activeLine);
    const outKeyMap = new Map<string, number>();
    allOut.forEach(o => {
      const key = `${o.soNumber}-${o.styleCode}-${o.color}`;
      outKeyMap.set(key, (outKeyMap.get(key) || 0) + o.actual);
    });

    const sorted = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return sorted.map(item => {
      const key = `${item.soNumber}-${item.styleNumber}-${item.color}`;
      let availableOut = outKeyMap.get(key) || 0;
      let allocatedOut = 0;
      if (availableOut > 0) {
        allocatedOut = Math.min(item.inputQty, availableOut);
        outKeyMap.set(key, availableOut - allocatedOut);
      }
      return { ...item, allocatedOut, balance: item.inputQty - allocatedOut };
    });
  }, [history, assignedSection, activeLine]);

  const filteredHistory = useMemo(() => {
    return fifoHistory.filter(h => {
      const matchDate = !logFilters.date || h.date === logFilters.date;
      const matchSO = !logFilters.so || h.soNumber.toLowerCase().includes(logFilters.so.toLowerCase());
      const matchBuyer = !logFilters.buyer || h.buyer.toLowerCase().includes(logFilters.buyer.toLowerCase());
      const matchStyle = !logFilters.style || h.styleNumber.toLowerCase().includes(logFilters.style.toLowerCase());
      const matchColor = !logFilters.color || h.color.toLowerCase().includes(logFilters.color.toLowerCase());
      return matchDate && matchSO && matchBuyer && matchStyle && matchColor;
    });
  }, [fifoHistory, logFilters]);

  const handleSave = () => {
    if (!formData.styleNumber || !formData.qty || !formData.soNumber || !formData.buyer) {
      alert("Please fill all required fields correctly."); return;
    }
    const mapping = mockDb.getSystemConfig().lineMappings.find(m => m.lineId === formData.lineId);
    mockDb.saveWIP({
      id: Date.now().toString(), date: formData.date,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      department: currentUser.department, section: assignedSection,
      blockId: mapping?.blockId || 'Unknown', lineId: formData.lineId,
      soNumber: formData.soNumber, buyer: formData.buyer, styleNumber: formData.styleNumber,
      color: formData.color || 'Standard', inputQty: formData.qty, outputQty: 0,
      reporterRole: 'PRODUCTION_INPUT', reporterId: currentUser.id, timestamp: new Date().toISOString()
    });
    setMessage(`Input Chalan of ${formData.qty} PCS recorded!`);
    setTimeout(() => setMessage(''), 3000);
    // STABILITY UPDATE: Only reset the quantity, keep other fields stable
    setFormData(prev => ({ ...prev, qty: 0 }));
    refreshData();
  };

  const allBuyers = useMemo(() => Array.from(new Set(confirmations.map(c => c.buyer))).sort(), [confirmations]);
  const filteredSOs = formData.buyer ? Array.from(new Set(confirmations.filter(c => c.buyer === formData.buyer).map(c => c.soNumber))) : [];
  const filteredStyles = formData.soNumber ? confirmations.filter(c => c.soNumber === formData.soNumber).map(c => c.styleNumber) : [];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${assignedSection.toLowerCase()}/hub`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100"><Package size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">{assignedSection} Input Terminal</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <Calendar size={18} className="text-slate-400 ml-2" /><input type="date" className="bg-transparent border-none text-xs font-black text-slate-900 outline-none p-0" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
           </div>
           <select className="bg-white border border-slate-200 rounded-2xl px-6 py-3 text-xs font-black outline-none cursor-pointer" value={activeLine} onChange={e => setActiveLine(e.target.value)}>{userLines.map(l => <option key={l} value={l}>{l}</option>)}</select>
        </div>
      </div>

      {/* KPI Cards at Top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-400 transition-all">
            <div className="flex justify-between items-center mb-4"><div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl"><Box size={20} /></div><span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">Registry Totals</span></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Floor Input</p><p className="text-4xl font-black text-indigo-600">{totals.totalIn.toLocaleString()}</p></div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between border-b-4 border-b-emerald-500 group hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between mb-4"><div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl"><CheckCircle size={20} /></div><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Output (Live)</p><p className="text-4xl font-black text-emerald-600">{totals.totalOut.toLocaleString()}</p></div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-blue-400 transition-all">
            <div className="flex justify-between items-center mb-4"><div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl"><Clock size={20} /></div><span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">Work In Progress</span></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Floor WIP</p><p className="text-4xl font-black text-slate-900">{totals.totalWIP.toLocaleString()}</p></div>
         </div>
         <button 
           onClick={() => setShowAnalysis(true)}
           className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rose-400 group transition-all text-left border-b-4 border-b-rose-500"
         >
            <div className="flex justify-between items-center mb-4"><div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all"><PieChart size={20} /></div><span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">Analysis Mode</span></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Rejects</p><p className="text-4xl font-black text-rose-600">{totals.totalRejects.toLocaleString()}</p></div>
         </button>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl p-10 space-y-10">
        <div className="flex items-center gap-4"><div className="bg-slate-900 p-2 rounded-xl text-white"><ArrowRight size={18}/></div><h3 className="text-xl font-black text-slate-900">New Chalan Registration</h3></div>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-20">
           <SearchableSelect label="Buyer (Search Floor WIP)" options={allBuyers} value={formData.buyer} placeholder="Pick Buyer..." icon={UserIcon} onChange={val => setFormData({...formData, buyer: val, soNumber: '', styleNumber: ''})} />
           <SearchableSelect label="SO Number" options={filteredSOs} value={formData.soNumber} placeholder="Select SO..." icon={Hash} disabled={!formData.buyer} onChange={val => setFormData({...formData, soNumber: val, styleNumber: ''})} />
           <SearchableSelect label="Style Reference" options={filteredStyles} value={formData.styleNumber} placeholder="Select Style..." icon={Tag} disabled={!formData.soNumber} onChange={val => setFormData({...formData, styleNumber: val})} />
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fabric Color</label><div className="relative"><Palette size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 font-black outline-none focus:ring-4 focus:ring-blue-500/10" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="e.g. Blue" /></div></div>
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Input Qty (PCS)</label><div className="relative"><Box size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 font-black outline-none focus:ring-4 focus:ring-blue-500/10" value={formData.qty || ''} onChange={e => setFormData({...formData, qty: parseInt(e.target.value) || 0})} placeholder="0" /></div></div>
           <div className="flex items-end"><button type="button" onClick={handleSave} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"><Save size={18}/> Commit Chalan Registry</button></div>
        </form>
        {message && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold animate-in zoom-in-95">{message}</div>}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 space-y-6">
           <div className="flex items-center justify-between"><h3 className="text-xl font-black text-slate-900">Historical Chalan Registry</h3><button onClick={() => setLogFilters({date:'', so:'', buyer:'', style:'', color:''})} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline"><X size={14}/> Clear Filters</button></div>
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative"><Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="date" className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[11px] font-black outline-none shadow-sm" value={logFilters.date} onChange={e => setLogFilters({...logFilters, date: e.target.value})}/></div>
              <div className="relative"><Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[11px] font-black outline-none shadow-sm" placeholder="Filter SO#" value={logFilters.so} onChange={e => setLogFilters({...logFilters, so: e.target.value})}/></div>
              <div className="relative"><UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[11px] font-black outline-none shadow-sm" placeholder="Filter Buyer" value={logFilters.buyer} onChange={e => setLogFilters({...logFilters, buyer: e.target.value})}/></div>
              <div className="relative"><Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[11px] font-black outline-none shadow-sm" placeholder="Filter Style" value={logFilters.style} onChange={e => setLogFilters({...logFilters, style: e.target.value})}/></div>
              <div className="relative"><Palette size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[11px] font-black outline-none shadow-sm" placeholder="Filter Color" value={logFilters.color} onChange={e => setLogFilters({...logFilters, color: e.target.value})}/></div>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-white">
                <th className="px-8 py-6">Date / Time</th>
                <th className="px-8 py-6">Buyer / Style / SO</th>
                <th className="px-8 py-6">Color Variant</th>
                <th className="px-8 py-6 text-center bg-indigo-50/20 text-indigo-600">Input Qty</th>
                <th className="px-8 py-6 text-center bg-emerald-50/20 text-emerald-600">Consumed (FIFO)</th>
                <th className="px-8 py-6 text-right">Remaining Bal.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.slice().reverse().map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-all group font-semibold text-slate-700">
                  <td className="px-8 py-6"><p className="text-sm font-black text-slate-900">{item.date}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{item.time}</p></td>
                  <td className="px-8 py-6"><p className="text-sm font-black text-slate-900">{item.buyer}</p><p className="text-[10px] font-black text-blue-600 uppercase">{item.styleNumber} <span className="text-slate-300 mx-1">/</span> #{item.soNumber}</p></td>
                  <td className="px-8 py-6"><span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-slate-200">{item.color}</span></td>
                  <td className="px-8 py-6 text-center text-xl font-black text-indigo-700 bg-indigo-50/10">{item.inputQty.toLocaleString()}</td>
                  <td className="px-8 py-6 text-center text-xl font-black text-emerald-700 bg-emerald-50/10">{item.allocatedOut.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right"><div className="flex flex-col items-end"><span className={`text-xl font-black ${item.balance > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>{item.balance.toLocaleString()}</span><span className="text-[9px] font-black uppercase text-slate-400">Pcs Left</span></div></td>
                </tr>
              ))}
              {filteredHistory.length === 0 && <tr><td colSpan={6} className="py-24 text-center text-slate-300 font-bold italic">No records found for current criteria.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showAnalysis && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 overflow-y-auto">
           <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300 my-auto">
              <div className="flex items-center justify-between border-b pb-6">
                 <div className="flex items-center gap-4">
                    <div className="bg-rose-600 p-3 rounded-2xl text-white shadow-lg"><PieChart size={24}/></div>
                    <div><h2 className="text-2xl font-black text-slate-900">Reject Analysis Dashboard</h2><p className="text-[10px] font-black text-slate-400 uppercase mt-1">Buyer-Style Reject Pareto for {activeLine}</p></div>
                 </div>
                 <button onClick={() => setShowAnalysis(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={24}/></button>
              </div>
              <div className="space-y-4">
                 {totals.analysis.map((a, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-rose-200 transition-all shadow-sm">
                       <div className="flex items-center gap-5">
                          <div className="bg-white p-3 rounded-xl border border-slate-200 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all"><Tag size={20}/></div>
                          <div><p className="text-sm font-black text-slate-900">{a.buyer}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.style}</p></div>
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-black text-rose-600">{a.count.toLocaleString()} <span className="text-xs font-bold">PCS</span></p>
                          <div className="flex items-center gap-1 justify-end mt-1 text-[8px] font-black text-rose-400 uppercase tracking-widest">Requires Intervention <ArrowRight size={10}/></div>
                       </div>
                    </div>
                 ))}
                 {totals.analysis.length === 0 && <div className="py-20 text-center text-slate-300 font-bold italic">No reject records detected in current department history.</div>}
              </div>
              <button onClick={() => setShowAnalysis(false)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all">Close Dashboard</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default WIPEntry;