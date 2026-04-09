
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Save, Calendar, Star, History, ClipboardCheck, User, LayoutGrid, Info, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Radar as RadarComponent
} from 'recharts';
import { mockDb } from '../services/mockDb';
import { DepartmentType, AppUser, Audit5SRecord, UserRole } from '../types';

const Audit5S: React.FC<{ department: DepartmentType; currentUser: AppUser; processType?: string }> = ({ department, currentUser, processType }) => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(mockDb.getSystemConfig());
  const criteria = useMemo(() => {
      return config.fiveSQuestions[department] || [];
  }, [config.fiveSQuestions, department]);
  
  const [activeLine, setActiveLine] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [audits, setAudits] = useState<Audit5SRecord[]>([]);
  const [message, setMessage] = useState('');

  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (criteria.length > 0) {
      const initial: Record<string, number> = {};
      criteria.forEach(c => {
        initial[c.key] = 5; 
      });
      setScores(initial);
    }
  }, [criteria]);

  const userLines = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN) {
      return config.lineMappings.filter(m => m.sectionId === department).map(m => m.lineId);
    }
    return currentUser.lines || [];
  }, [currentUser, department, config.lineMappings]);

  useEffect(() => {
    if (userLines.length > 0 && !activeLine) setActiveLine(userLines[0]);
    refreshAudits();
  }, [department, activeLine, userLines]);

  const refreshAudits = () => {
    const data = mockDb.get5SAudits(department);
    setAudits(data.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const calculateTotal = () => {
    const keys = Object.keys(scores);
    if (keys.length === 0 || criteria.length === 0) return 0;
    const sum = keys.reduce((acc, key) => acc + (scores[key] || 0), 0);
    const maxPoss = criteria.length * 5;
    return Math.round((sum / maxPoss) * 100);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLine) {
        alert("Please select a line for auditing.");
        return;
    }

    if (criteria.length === 0) {
        alert("System Error: No 5S metrics configured for this section in Governance.");
        return;
    }

    const currentTotal = calculateTotal();
    const record: Audit5SRecord = {
      id: Date.now().toString(),
      date,
      department,
      lineId: activeLine,
      scores: { ...scores },
      totalScore: currentTotal,
      auditorId: currentUser.name,
      remarks,
      timestamp: new Date().toISOString()
    };

    mockDb.save5SAudit(record);
    refreshAudits();
    setMessage(`Audit for ${activeLine} ${processType ? `(${processType})` : ''} successfully committed.`);
    setTimeout(() => setMessage(''), 3000);
    setRemarks('');
  };

  const radarData = useMemo(() => {
    return criteria.map(c => ({
      subject: c.label.split(':')[0], 
      score: scores[c.key] || 0,
      fullMark: 5
    }));
  }, [criteria, scores]);

  return (
    <div className="space-y-10 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/hub`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-purple-600 p-3 rounded-2xl text-white shadow-lg">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
                {department} 5S Audit {processType ? `(${processType})` : ''}
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3">
                <Calendar size={18} className="text-purple-600 ml-2" />
                <input 
                    type="date" 
                    className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 p-0 cursor-pointer"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                <LayoutGrid size={18} className="text-slate-400 ml-2" />
                <select 
                   className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 p-0 cursor-pointer pr-8"
                   value={activeLine}
                   onChange={e => setActiveLine(e.target.value)}
                >
                   <option value="">Select Line...</option>
                   {userLines.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8">
           <form onSubmit={handleSave} className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl space-y-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-50">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900">Conduct {department} Audit {processType ? `(${processType})` : ''}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Section-specific Benchmark Evaluation</p>
                 </div>
                 
                 <div className="flex items-center gap-10">
                    <div className="text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Score</p>
                       <p className={`text-5xl font-black ${calculateTotal() >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{calculateTotal()}%</p>
                    </div>
                    {criteria.length > 0 && (
                        <div className="w-48 h-32 hidden md:block">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#f1f5f9" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                                    <RadarComponent name="Score" dataKey="score" stroke="#9333ea" fill="#9333ea" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                 </div>
              </div>

              <div className="space-y-6">
                 {criteria.map((c, idx) => (
                    <div key={c.key} className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:border-purple-200 transition-all duration-300">
                       <div className="flex items-center gap-6">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-purple-600 shadow-sm">{idx + 1}</div>
                          <div>
                             <p className="text-base font-black text-slate-900 leading-tight">{c.label}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">{c.desc}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-1 bg-white p-2 rounded-2xl shadow-inner border border-slate-100 mt-4 md:mt-0">
                          {[1,2,3,4,5].map(n => (
                             <button 
                                key={n}
                                type="button"
                                onClick={() => setScores({...scores, [c.key]: n})}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                                   (scores[c.key] || 0) >= n 
                                   ? 'bg-purple-600 text-white shadow-lg' 
                                   : 'bg-transparent text-slate-200'
                                }`}
                             >
                                <Star size={20} fill={(scores[c.key] || 0) >= n ? "currentColor" : "none"} />
                             </button>
                          ))}
                       </div>
                    </div>
                 ))}

                 {criteria.length === 0 && (
                     <div className="py-20 text-center space-y-4">
                        <AlertCircle size={48} className="mx-auto text-amber-500" />
                        <p className="text-slate-400 font-black text-lg">No Registry Data for {department}</p>
                        <p className="text-slate-300 text-sm max-w-md mx-auto">IE Department must configure section-wise metrics in the Governance Console before audits can be initiated.</p>
                     </div>
                 )}
              </div>

              {criteria.length > 0 && (
                <>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Observations & Action Points</label>
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-slate-900 font-bold min-h-[120px] outline-none focus:ring-4 focus:ring-purple-500/10 shadow-inner"
                            placeholder="Describe specific findings..."
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>

                    {message && <div className="p-5 bg-emerald-50 text-emerald-700 rounded-3xl border border-emerald-100 font-black animate-in zoom-in-95 flex items-center gap-3"><CheckCircle2 size={20} /> {message}</div>}

                    <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm uppercase shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95">
                        <Save size={24} /> Commit Shift Audit
                    </button>
                </>
              )}
           </form>
        </div>

        <div className="xl:col-span-4 space-y-8">
           <div className="bg-gradient-to-br from-purple-700 to-indigo-900 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
              <Sparkles size={150} className="absolute -right-10 -bottom-10 opacity-10 group-hover:rotate-45 transition-transform duration-1000" />
              <div className="relative z-10 space-y-6">
                 <h3 className="text-2xl font-black leading-tight">Visual<br/>Standard KPI</h3>
                 <div className="bg-white/10 p-5 rounded-3xl border border-white/10">
                    <p className="text-xs font-bold leading-relaxed opacity-80 italic">
                       "Target 5S compliance is 85%. Maintaining standards in {department} {processType ? processType : ''} reduces operational variance by an average of 12%."
                    </p>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[700px]">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                 <h3 className="text-lg font-black text-slate-900 flex items-center gap-3"><History size={20} className="text-slate-400" /> Recent {department} History</h3>
                 <span className="text-[10px] font-black text-slate-400">{audits.length} Records</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {audits.map(a => (
                    <div key={a.id} className="p-6 border-b border-slate-50 hover:bg-slate-50 transition-all">
                       <div className="flex justify-between items-start mb-3">
                          <div>
                             <p className="text-sm font-black text-slate-900">{a.lineId}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">{a.date}</p>
                          </div>
                          <div className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                             a.totalScore >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                             {a.totalScore}%
                          </div>
                       </div>
                       {a.remarks && <p className="text-xs text-slate-500 font-medium italic border-l-2 border-slate-200 pl-3 mb-3">"{a.remarks}"</p>}
                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase">
                          <User size={12}/> {a.auditorId}
                       </div>
                    </div>
                 ))}
                 {audits.length === 0 && <div className="py-20 text-center px-10 text-slate-300 font-bold italic text-sm">No historical audits found for this section.</div>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Audit5S;
