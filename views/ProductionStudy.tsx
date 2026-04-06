
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Timer, Search as SearchIcon, Play, Pause, Save, CheckCircle, 
  User as UserIcon, Activity, X, Check,
  Hammer, ShieldCheck, History, AlertTriangle,
  FileText, Printer, ChevronDown, Target, Clock, Tag, Box,
  Star, Shirt, UserCheck, LayoutList, Camera, Eye, Image as ImageIcon, ArrowLeft
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { DepartmentType, StaffMember, ProcessConfig, StyleConfirmation, TimeStudyRecord, AppUser } from '../types';

interface ProductionStudyProps {
  department: DepartmentType;
  currentUser: AppUser;
}

const NEA_CATEGORIES = [
  'Bundle Handling', 'Bobbin Changes', 'Thread Breakage', 'Needle Breakage',
  'Machine Break Down', 'Waiting for Work', 'Rework', 'Personal & Fatigue', 'Others'
];

const MOTION_RATINGS = ['Very good', 'Good', 'OK', 'Not OK', 'Not understand'];
const METHOD_RATINGS = ['Very optimized', 'Optimized', 'OK', 'Poor'];

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

  const filteredOptions = useMemo(() => 
    (options || []).filter(opt => 
      opt && opt.toString().toLowerCase().includes((searchTerm || '').toLowerCase())
    ), [options, searchTerm]);

  return (
    <div className={`space-y-1 relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 font-black cursor-pointer flex items-center justify-between group hover:border-indigo-600 transition-all shadow-sm"
      >
        <Icon size={14} className="absolute left-4 text-slate-400 group-hover:text-indigo-600" />
        <span className={`text-xs truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>{value || placeholder}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-1">
           <div className="p-2 border-b border-slate-50 bg-slate-50/50">
              <input 
                autoFocus
                className="w-full bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" 
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
           </div>
           <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {filteredOptions.map((opt, idx) => (
                <div 
                  key={`${opt}-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                >
                  {opt}
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

const ProductionStudy: React.FC<ProductionStudyProps> = ({ department, currentUser }) => {
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<StaffMember | null>(null);
  const [workingLine, setWorkingLine] = useState('');
  const [buyer, setBuyer] = useState('');
  const [styleNumber, setStyleNumber] = useState('');
  const [processName, setProcessName] = useState('');
  const [machineType, setMachineType] = useState('');
  const [standardSmv, setStandardSmv] = useState(0);
  
  const [availableProcesses, setAvailableProcesses] = useState<ProcessConfig[]>([]);
  const [styleConfirmations, setStyleConfirmations] = useState<StyleConfirmation[]>([]);
  
  const [allLaps, setAllLaps] = useState<{ type: 'PROD' | 'LOSS', lapTime: number, overall: number, category?: string }[]>([]);
  const [comments, setComments] = useState('');
  const [workMotion, setWorkMotion] = useState('');
  const [workMethod, setWorkMethod] = useState('');
  
  const [message, setMessage] = useState('');
  const [showNeaSelector, setShowNeaSelector] = useState(false);
  
  const [time, setTime] = useState(0);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const config = mockDb.getSystemConfig();
    setAvailableProcesses(config.processConfigs[department] || []);
    setStyleConfirmations(mockDb.getStyleConfirmations());
  }, [department]);

  useEffect(() => {
    if (isRunning) {
      if (!startTimeStr) {
        setStartTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
      timerRef.current = window.setInterval(() => {
        setTime((t) => t + 10);
        setTotalStudyTime((t) => t + 10);
      }, 10);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setEndTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, startTimeStr]);

  const handleSearch = () => {
    const config = mockDb.getSystemConfig();
    const staff = config.staffDatabase || [];
    const found = staff.find(s => s.employeeId === searchId);
    if (found) {
      setSelectedEmp(found);
      setWorkingLine(found.line);
      setSearchId('');
    } else {
      alert("Operator ID not found.");
    }
  };

  const captureProductionLap = () => {
    if (time === 0) return;
    setAllLaps([{ type: 'PROD', lapTime: time, overall: totalStudyTime }, ...allLaps]);
    setTime(0);
  };

  const captureNeaLap = (category: string) => {
    if (time === 0) return;
    setAllLaps([{ type: 'LOSS', lapTime: time, overall: totalStudyTime, category }, ...allLaps]);
    setTime(0);
    setShowNeaSelector(false);
  };

  const handleReset = () => {
    if (confirm("Clear current session?")) {
      setTime(0); setTotalStudyTime(0); setIsRunning(false);
      setAllLaps([]); setStartTimeStr(''); setEndTimeStr(''); setComments('');
      setWorkMotion(''); setWorkMethod('');
      setSelectedEmp(null); setBuyer(''); setStyleNumber(''); setProcessName(''); setMachineType(''); setStandardSmv(0);
    }
  };

  const productionCycles = useMemo(() => allLaps.filter(l => l.type === 'PROD').map(l => l.lapTime / 1000), [allLaps]);
  const neaLogs = useMemo(() => allLaps.filter(l => l.type === 'LOSS').map(l => ({ category: l.category!, time: l.lapTime / 1000 })), [allLaps]);

  const avgProdTime = useMemo(() => 
    productionCycles.length > 0 ? productionCycles.reduce((a, b) => a + b, 0) / productionCycles.length : 0
  , [productionCycles]);

  const capacity = useMemo(() => avgProdTime > 0 ? 3600 / avgProdTime : 0, [avgProdTime]);

  const handleSave = () => {
    if (!selectedEmp || !processName || productionCycles.length === 0) {
      alert("Missing Required Fields: Operator, Process, or Production Laps.");
      return;
    }

    const record: any = {
      id: Date.now().toString(),
      department,
      employeeId: selectedEmp.employeeId,
      operatorName: selectedEmp.name,
      designation: selectedEmp.designation,
      lineId: workingLine,
      processName,
      machineType,
      productionCycles: [...productionCycles],
      othersCycles: neaLogs.map(l => ({ category: l.category, time: l.time })),
      avgProductionTime: avgProdTime,
      avgOthersTime: neaLogs.length > 0 ? neaLogs.reduce((acc, curr) => acc + curr.time, 0) / neaLogs.length : 0,
      capacity,
      comments,
      workMotion,
      workMethod,
      studyBy: currentUser.name,
      studyById: currentUser.id, // Traceability: User ID
      timestamp: new Date().toISOString(),
      startTime: startTimeStr,
      endTime: endTimeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      buyer,
      styleNumber,
      unit: department,
      efficiency: 0 
    };

    mockDb.saveTimeStudy(record);
    setMessage('Study Archived to Database!');
    setTimeout(() => setMessage(''), 4000);
    handleReset();
  };

  const formatTimeParts = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const sec = (totalSeconds % 60).toString().padStart(2, '0');
    const msec = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return { min, sec, msec };
  };

  const { min, sec, msec } = formatTimeParts(time);

  const buyers = useMemo(() => Array.from(new Set(styleConfirmations.map(c => c.buyer))).sort(), [styleConfirmations]);
  const filteredStyles = useMemo(() => 
    styleConfirmations.filter(c => c.buyer === buyer).map(c => c.styleNumber).sort()
  , [styleConfirmations, buyer]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20 max-w-[1800px] mx-auto animate-in fade-in duration-500">
      <div className="px-4 md:px-8 py-6 border-b border-slate-200 bg-white mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/ie-activity`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              SDL (GU) Work Study Report Module
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 md:p-8">
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                 <div className="flex-1 relative">
                    <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                       className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 font-black text-sm outline-none"
                       placeholder="Scan Operator ID..."
                       value={searchId}
                       onChange={(e) => setSearchId(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                 </div>
                 <button onClick={handleSearch} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase shadow-lg">Find</button>
              </div>
              {selectedEmp && (
                 <div className="p-6 bg-indigo-50/50 rounded-3xl grid grid-cols-2 gap-4 border border-indigo-100">
                    <div><p className="text-[9px] font-black text-slate-400 uppercase">Operator</p><p className="text-sm font-black text-indigo-600 truncate">{selectedEmp.name}</p></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase">Line</p><p className="text-sm font-black text-slate-900">{selectedEmp.line}</p></div>
                 </div>
              )}
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect label="Buyer" options={buyers} value={buyer} placeholder="Pick Buyer..." icon={UserIcon} onChange={val => { setBuyer(val); setStyleNumber(''); }} />
                <SearchableSelect label="Style" options={filteredStyles} value={styleNumber} placeholder="Pick Style..." icon={Tag} disabled={!buyer} onChange={setStyleNumber} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect label="Process" options={availableProcesses.map(p => p.processName)} value={processName} placeholder="Pick Process..." icon={Activity} onChange={val => {
                   setProcessName(val);
                   const p = availableProcesses.find(x => x.processName === val);
                   if (p) { setMachineType(p.machineType); setStandardSmv(p.smv); }
                }} />
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Machine</label><input readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold" value={machineType} /></div>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-6">
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Observations</p>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm font-bold h-32 resize-none outline-none focus:ring-4 focus:ring-indigo-500/10" 
                      placeholder="Method observations..." 
                      value={comments} 
                      onChange={e => setComments(e.target.value)} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black" value={workMotion} onChange={e => setWorkMotion(e.target.value)}>
                        <option value="">Work Motion Rating</option>
                        {MOTION_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black" value={workMethod} onChange={e => setWorkMethod(e.target.value)}>
                        <option value="">Work Method Rating</option>
                        {METHOD_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
           </div>
        </div>

        <div className="bg-[#0c0d10] rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col items-center">
            <div className="relative w-72 h-72 rounded-full border border-white/5 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-black shadow-[0_0_100px_rgba(124,58,237,0.1)]">
               <div className="flex items-baseline gap-1">
                  <span className="text-7xl font-mono font-black tabular-nums">{min}</span>
                  <span className="text-3xl font-mono text-slate-700">:</span>
                  <span className="text-7xl font-mono font-black tabular-nums">{sec}</span>
                  <span className="text-3xl font-mono text-slate-700">:</span>
                  <span className="text-7xl font-mono font-black tabular-nums text-indigo-400">{msec}</span>
               </div>
               <div className="flex gap-14 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                  <span>min</span><span>sec</span><span>ms</span>
               </div>
            </div>

            <div className="w-full flex items-center justify-center gap-8 mt-12">
               <button onClick={() => setIsRunning(!isRunning)} className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl hover:bg-blue-500 transition-all active:scale-95">
                  {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
               </button>

               <div className="relative">
                  <button onClick={() => setShowNeaSelector(!showNeaSelector)} disabled={!isRunning} className="w-20 h-20 rounded-full bg-rose-900/30 border border-rose-500/20 flex flex-col items-center justify-center text-rose-500 disabled:opacity-20">
                     <AlertTriangle size={28} />
                     <span className="text-[8px] font-black uppercase mt-1">NEA</span>
                  </button>
                  {showNeaSelector && (
                    <div className="absolute bottom-full left-0 mb-4 w-64 bg-[#1a1b1e] rounded-3xl shadow-2xl border border-white/5 overflow-hidden z-[200]">
                       {NEA_CATEGORIES.map(cat => ( <button key={cat} onClick={() => captureNeaLap(cat)} className="w-full text-left px-4 py-3 text-[10px] font-black text-slate-400 hover:bg-rose-50 hover:text-white rounded-xl uppercase transition-all"> {cat} </button> ))}
                    </div>
                  )}
               </div>

               <button onClick={captureProductionLap} disabled={!isRunning} className="w-28 h-28 rounded-full bg-emerald-600 flex flex-col items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.3)] hover:bg-emerald-500 disabled:opacity-20 active:scale-95">
                  <Shirt size={40} fill="currentColor" />
                  <span className="text-[10px] font-black uppercase mt-1">PROD</span>
               </button>
            </div>

            <div className="w-full mt-10 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {allLaps.map((l, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Unit {(allLaps.length - idx)}</span>
                        <span className={`text-lg font-mono font-black ${l.type === 'LOSS' ? 'text-rose-400' : 'text-white'}`}>{Math.floor(l.lapTime/1000)}s</span>
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${l.type === 'LOSS' ? 'bg-rose-900/50 text-rose-300' : 'bg-emerald-900/50 text-emerald-300'}`}>{l.type === 'LOSS' ? l.category : 'PROD'}</span>
                    </div>
                ))}
            </div>

            <div className="w-full mt-auto pt-10 flex gap-4">
                <button onClick={handleReset} className="flex-1 py-4 text-slate-500 font-black uppercase text-xs">Clear</button>
                <button onClick={handleSave} className="flex-[3] bg-indigo-600 text-white py-5 rounded-3xl font-black text-sm uppercase shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3">
                    <Save size={20}/> Archive Study
                </button>
            </div>
        </div>
      </div>
      {message && <div className="fixed bottom-10 right-10 p-6 bg-emerald-600 text-white rounded-3xl shadow-2xl font-black flex items-center gap-3 animate-in slide-in-from-right-4 z-[300]"><CheckCircle size={24}/> {message}</div>}
    </div>
  );
};

export default ProductionStudy;
