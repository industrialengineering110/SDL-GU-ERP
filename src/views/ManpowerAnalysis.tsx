
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, PieChart, Settings2, ClipboardList, Award, UserMinus, FileStack,
  ChevronDown, ArrowLeft, RefreshCcw, Search, Trash2, Plus, CheckCircle,
  FileSpreadsheet as ExcelIcon, TrendingUp, BarChart3, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, AreaChart, Area
} from 'recharts';
import { mockDb } from '../services/mockDb';
import SkillMatrix from './SkillMatrix';
import { YearlyAppraisalHub } from '../components/YearlyAppraisalHub';
import { 
  SystemConfig, ManpowerBudgetEntry, ManpowerStatusEntry
} from '../types';

const Building = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M9 22v-4h6v4"></path>
    <path d="M8 6h.01"></path>
    <path d="M16 6h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M16 10h.01"></path>
    <path d="M8 14h.01"></path>
    <path d="M16 14h.01"></path>
  </svg>
);

const DepartmentDropdown = React.memo(({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) => (
  <div className="space-y-1 w-full mb-4 animate-in slide-in-from-top-2 duration-300 px-1">
    <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest px-1 flex items-center gap-2">
      <Building size={11} className="text-blue-600" /> {label}
    </label>
    <div className="relative group max-w-xs">
      <select 
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-1.5 text-[11px] font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none shadow-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </div>
));

const SubModuleCard = ({ title, sub, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group flex flex-col gap-4 relative overflow-hidden"
  >
    <div className={`absolute -right-4 -bottom-4 w-20 h-20 ${color} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
    <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}>
        <Icon size={24} />
    </div>
    <div>
        <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-tight mb-1">{title}</h4>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight line-clamp-2">{sub}</p>
    </div>
  </div>
);

const ManpowerAnalysis: React.FC<{ department: string, currentUser: any }> = ({ department: initialDept, currentUser }) => {
  const { tab } = useParams();
  const navigate = useNavigate();
  
  const [config, setConfig] = useState(mockDb.getSystemConfig());
  const [selectedDept, setSelectedDept] = useState(initialDept || 'Sewing');
  const [summaryCategory, setSummaryCategory] = useState<'MANAGEMENT' | 'NON-MANAGEMENT'>('NON-MANAGEMENT');
  const [message, setMessage] = useState('');
  const [excelImport, setExcelImport] = useState('');
  const [searchFilters, setSearchFilters] = useState({ id: '', name: '', designation: '', dept: '', section: '' });

  const currentTab = useMemo(() => {
    if (!tab) return 'MENU';
    const t = tab.toUpperCase();
    if (t === 'SUMMARY') return 'SUMMARY';
    if (t === 'BUDGET') return 'MAKE';
    if (t === 'REGISTRY') return 'STATUS';
    if (t === 'SKILLS') return 'SKILL';
    if (t === 'ABSENT') return 'ABSENT';
    if (t === 'APPRAISAL') return 'APPRAISAL';
    return 'MENU';
  }, [tab]);

  const manpowerTrend = [
    { name: 'Mon', strength: 850, present: 810, target: 840 },
    { name: 'Tue', strength: 850, present: 825, target: 840 },
    { name: 'Wed', strength: 855, present: 815, target: 840 },
    { name: 'Thu', strength: 855, present: 830, target: 840 },
    { name: 'Fri', strength: 860, present: 820, target: 840 },
    { name: 'Sat', strength: 860, present: 845, target: 840 },
  ];

  const handleConfigUpdate = useCallback((key: keyof SystemConfig, value: any) => {
    setConfig(prev => {
      const updated = { ...prev, [key]: value };
      mockDb.saveSystemConfig(updated);
      return updated;
    });
  }, []);

  const handleBudgetUpdate = (id: string, updates: Partial<ManpowerBudgetEntry>) => {
    const updated = config.manpowerBudgets.map(b => {
      if (b.id !== id) return b;
      const next = { ...b, ...updates };
      if (next.category === 'NON-MANAGEMENT') {
        next.totalBudget = (next.budgetPerLine || 0) * (next.numLines || 0);
      }
      return next;
    });
    handleConfigUpdate('manpowerBudgets', updated);
  };

  const handleAddBudgetEntry = (cat: 'MANAGEMENT' | 'NON-MANAGEMENT') => {
    const newEntry: ManpowerBudgetEntry = {
      id: Date.now().toString(),
      department: selectedDept,
      section: '',
      area: '',
      designation: '',
      category: cat,
      type: 'Worker',
      budgetPerLine: 0,
      numLines: 0,
      totalBudget: 0,
      remarks: '',
      existing: 0
    };
    handleConfigUpdate('manpowerBudgets', [...config.manpowerBudgets, newEntry]);
  };

  const handleDeleteBudgetEntry = (id: string) => {
    handleConfigUpdate('manpowerBudgets', config.manpowerBudgets.filter(b => b.id !== id));
  };

  const handleWorkforceImport = () => {
    if (!excelImport.trim()) return;
    const lines = excelImport.trim().split('\n');
    const newStatus: ManpowerStatusEntry[] = lines.map((l, idx) => {
      const parts = l.split(/\t| {2,}/);
      return {
        id: (Date.now() + idx).toString(),
        employeeId: parts[1] || '',
        name: parts[2] || '',
        designation: parts[3] || '',
        department: parts[4] || '',
        section: parts[5] || '',
        location: parts[6] || '',
        joined: parts[7] || '',
        type: parts[8] || '',
        grade: parts[9] || '',
        religion: parts[10] || '',
        gender: parts[11] || ''
      };
    });
    handleConfigUpdate('manpowerStatus', [...config.manpowerStatus, ...newStatus]);
    setExcelImport('');
    setMessage("Workforce Registry synchronized.");
    setTimeout(() => setMessage(''), 3000);
  };

  const filteredWorkforce = useMemo(() => {
    return config.manpowerStatus.filter(e => {
        return (!searchFilters.id || e.employeeId.includes(searchFilters.id)) &&
               (!searchFilters.name || e.name.toLowerCase().includes(searchFilters.name.toLowerCase())) &&
               (!searchFilters.designation || e.designation.toLowerCase().includes(searchFilters.designation.toLowerCase())) &&
               (!searchFilters.dept || e.department.toLowerCase().includes(searchFilters.dept.toLowerCase())) &&
               (!searchFilters.section || e.section.toLowerCase().includes(searchFilters.section.toLowerCase()));
    });
  }, [config.manpowerStatus, searchFilters]);

  const setTab = (t: string) => {
    navigate(`/factory/manpower-analysis/${t.toLowerCase()}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-teal-700 p-2.5 rounded-xl text-white shadow-lg">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-teal-900">
              Manpower Analysis
            </h1>
          </div>
        </div>
      </div>

      {currentTab === 'MENU' ? (
        <div className="space-y-10">
          <DepartmentDropdown label="WORKFORCE CONTEXT (DEPARTMENT)" options={config.departments} value={selectedDept} onChange={setSelectedDept} />
          
          {/* Dashboard Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Activity size={18} className="text-teal-600" /> Attendance vs Strength Trend
                </h3>
                <div className="flex gap-2">
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">Avg: 94%</span>
                </div>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={manpowerTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar dataKey="present" fill="#0d9488" radius={[4, 4, 0, 0]} name="Present" />
                    <Line type="monotone" dataKey="strength" stroke="#4f46e5" strokeWidth={3} name="Total Strength" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden">
              <TrendingUp size={120} className="absolute -right-10 -bottom-10 opacity-5" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Efficiency Index</p>
                <h2 className="text-5xl font-black tracking-tighter italic">84.2%</h2>
                <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <TrendingUp size={14} /> +2.4% vs Last Week
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Turnover Rate</span>
                  <span className="text-sm font-black italic">1.2%</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Skill Gap</span>
                  <span className="text-sm font-black italic">14.5%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 pt-4">
            <SubModuleCard title="Strength Summary" sub="Departmental budget vs actual strength" icon={PieChart} color="bg-blue-600" onClick={() => setTab('SUMMARY')} />
            <SubModuleCard title="Budget Master" sub="Setup designation-wise manpower budget" icon={Settings2} color="bg-indigo-600" onClick={() => setTab('BUDGET')} />
            <SubModuleCard title="Personnel Registry" sub="Live workforce database and excel import" icon={ClipboardList} color="bg-emerald-600" onClick={() => setTab('REGISTRY')} />
            <SubModuleCard title="Skill Matrix" sub="Process-wise workforce capability" icon={Award} color="bg-amber-500" onClick={() => setTab('SKILLS')} />
            <SubModuleCard title="Absent Monitor" sub="Tracking shift attendance leakage" icon={UserMinus} color="bg-rose-500" onClick={() => setTab('ABSENT')} />
            <SubModuleCard title="Appraisal Hub" sub="Performance review and grading" icon={FileStack} color="bg-purple-600" onClick={() => setTab('APPRAISAL')} />
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <button 
            onClick={() => navigate('/factory/manpower-analysis')}
            className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-6"
          >
            <ArrowLeft size={14}/> Back to Workforce Menu
          </button>

          {currentTab === 'SUMMARY' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter Category:</span>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-[9px] font-black uppercase outline-none cursor-pointer"
                  value={summaryCategory}
                  onChange={e => setSummaryCategory(e.target.value as any)}
                >
                  <option value="MANAGEMENT">Management</option>
                  <option value="NON-MANAGEMENT">Non-Management</option>
                </select>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-900 shadow-xl overflow-hidden">
                <div className="max-h-[500px] overflow-auto custom-scrollbar">
                  <table className="w-full text-center border-collapse min-w-[900px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#FFCC00] text-black text-[10px] font-[1000] uppercase h-9 border-b border-black">
                        <th className="w-12 border-r border-black/20">SL</th>
                        <th className="text-left px-6 border-r border-black/20">DEPARTMENT</th>
                        <th className="px-4 border-r border-black/20">BUDGET</th>
                        <th className="px-4 border-r border-black/20">STRENGTH</th>
                        <th className="px-4 border-r border-black/20">PRESENT</th>
                        <th className="px-4 border-r border-black/20">VARIANCE</th>
                        <th>REMARKS</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-slate-700 divide-y divide-slate-100">
                      {config.departments.map((dept, i) => {
                        const budgets = config.manpowerBudgets.filter(b => b.department === dept && b.category === summaryCategory);
                        const totalBudget = budgets.reduce((s, b) => s + b.totalBudget, 0);
                        return (
                          <tr key={dept} className="h-8 hover:bg-slate-50 transition-colors">
                            <td className="border-r border-slate-100 text-slate-300 font-black">{i + 1}</td>
                            <td className="text-left px-6 text-blue-600 uppercase italic font-black border-r border-slate-100">{dept}</td>
                            <td className="border-r border-slate-100 font-[1000] text-slate-900 text-sm">{totalBudget}</td>
                            <td className="border-r border-slate-100 text-slate-400">0</td>
                            <td className="border-r border-slate-100 text-slate-400">0</td>
                            <td className={`border-r border-slate-100 font-black ${totalBudget > 0 ? 'text-rose-600' : 'text-slate-300'}`}>{totalBudget}</td>
                            <td className="text-[8px] text-slate-300 italic px-4 truncate">--</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-10">
                      <tr className="bg-slate-900 text-white h-10 font-[1000] text-[11px]">
                        <td colSpan={2} className="text-right px-6 uppercase italic">TOTAL</td>
                        <td className="border-x border-white/10 text-base">{config.manpowerBudgets.filter(b => b.category === summaryCategory).reduce((s, b) => s + b.totalBudget, 0)}</td>
                        <td className="border-x border-white/10 text-slate-500">0</td>
                        <td className="border-x border-white/10 text-slate-500">0</td>
                        <td className="border-x border-white/10 text-rose-500 text-base">{config.manpowerBudgets.filter(b => b.category === summaryCategory).reduce((s, b) => s + b.totalBudget, 0)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'MAKE' && (
            <div className="space-y-10 pb-10">
              <div className="space-y-2">
                <h3 className="text-sm font-[1000] text-slate-900 uppercase italic tracking-tighter text-center border-b-2 border-slate-900 pb-1">MANAGEMENT - {selectedDept.toUpperCase()}</h3>
                <div className="bg-white rounded-xl border border-slate-900 overflow-hidden shadow-lg">
                  <div className="max-h-[350px] overflow-auto custom-scrollbar">
                    <table className="w-full text-center border-collapse min-w-[1100px]">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-[#FFCC00] text-black text-[9px] font-[1000] uppercase h-9 border-b-2 border-black">
                          <th className="px-3 border-r border-black/20">DEPT/SECTION</th>
                          <th className="px-3 border-r border-black/20">DESIGNATION</th>
                          <th className="px-3 border-r border-black/20">TYPES</th>
                          <th className="px-3 border-r border-black/20">TOTAL BUDGET</th>
                          <th className="px-3 border-r border-black/20 text-slate-400">STRENGTH</th>
                          <th className="px-3 border-r border-black/20 text-slate-400">PRESENT</th>
                          <th className="px-3 border-r border-black/20 text-rose-600">VARIANCE</th>
                          <th className="px-3 border-r border-black/20 text-slate-400">STAFF</th>
                          <th className="px-3 border-r border-black/20">REMARKS</th>
                          <th className="px-3">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="text-[10px] font-bold text-slate-700 divide-y divide-slate-100">
                        {config.manpowerBudgets.filter(b => b.category === 'MANAGEMENT' && b.department === selectedDept).map(b => (
                          <tr key={b.id} className="h-8 hover:bg-slate-50 transition-colors">
                            <td className="border-r border-slate-100 p-0 h-8"><input className="w-full h-full text-center bg-transparent border-none focus:ring-0 text-[10px] px-1" value={b.section} onChange={e=>handleBudgetUpdate(b.id, {section: e.target.value})} placeholder="Section..."/></td>
                            <td className="border-r border-slate-100 p-0 h-8"><input className="w-full h-full text-center bg-transparent border-none focus:ring-0 text-[10px] px-1" value={b.designation} onChange={e=>handleBudgetUpdate(b.id, {designation: e.target.value})} placeholder="Designation..."/></td>
                            <td className="border-r border-slate-100 p-0 h-8">
                              <select className="w-full h-full text-center bg-transparent border-none focus:ring-0 font-bold text-[10px] appearance-none cursor-pointer" value={b.type} onChange={e=>handleBudgetUpdate(b.id, {type: e.target.value})}>
                                <option value="Staff">Staff</option>
                                <option value="Worker">Worker</option>
                              </select>
                            </td>
                            <td className="border-r border-slate-100 p-0 h-8 font-black"><input type="number" className="w-full h-full text-center bg-transparent border-none focus:ring-0 text-[11px]" value={b.totalBudget} onChange={e=>handleBudgetUpdate(b.id, {totalBudget: parseInt(e.target.value)||0})} /></td>
                            <td className="border-r border-slate-100 text-slate-300 italic">0</td>
                            <td className="border-r border-slate-100 text-slate-300 italic">0</td>
                            <td className="border-r border-slate-100 text-rose-600 font-black">{b.totalBudget - 0}</td>
                            <td className="border-r border-slate-100 text-slate-300 italic">--</td>
                            <td className="border-r border-slate-100 p-0 h-8"><input className="w-full h-full text-center bg-transparent border-none focus:ring-0 text-[9px] px-1" value={b.remarks} onChange={e=>handleBudgetUpdate(b.id, {remarks: e.target.value})} placeholder="Remarks..."/></td>
                            <td className="h-8"><button onClick={()=>handleDeleteBudgetEntry(b.id)} className="text-slate-300 hover:text-rose-500 flex items-center justify-center w-full"><Trash2 size={13}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-slate-50/50 h-8 border-t border-slate-900 flex items-center justify-center">
                    <button onClick={() => handleAddBudgetEntry('MANAGEMENT')} className="text-[9px] font-[1000] text-blue-600 uppercase flex items-center gap-1.5 hover:bg-white px-6 h-full transition-all">
                      <Plus size={12}/> ADD MANAGEMENT ROW
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-[1000] text-slate-900 uppercase italic tracking-tighter text-center border-b-2 border-slate-900 pb-1">NON MANAGEMENT - {selectedDept.toUpperCase()}</h3>
                <div className="bg-white rounded-xl border border-slate-900 overflow-hidden shadow-lg">
                  <div className="max-h-[450px] overflow-auto custom-scrollbar">
                    <table className="w-full text-center border-collapse min-w-[1400px]">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-[#FFCC00] text-black text-[9px] font-[1000] uppercase h-9 border-b-2 border-black">
                          <th className="px-3 border-r border-black/20">DEPT/SECTION</th>
                          <th className="px-3 border-r border-black/20">DESIGNATION</th>
                          <th className="px-3 border-r border-black/20">TYPES</th>
                          <th className="px-2 border-r border-black/20">BGT/LINE</th>
                          <th className="px-2 border-r border-black/20">LINES</th>
                          <th className="px-3 border-r border-black/20 bg-indigo-900/10">TOTAL BUDGET</th>
                          <th className="px-3 border-r border-black/20 text-slate-400">STRENGTH</th>
                          <th className="px-3 border-r border-black/20 text-slate-400">PRESENT</th>
                          <th className="px-3 border-r border-black/20 text-rose-600">VARIANCE</th>
                          <th className="px-3 border-r border-black/20 text-slate-400">STAFF</th>
                          <th className="px-3 border-r border-black/20">REMARKS</th>
                          <th className="px-3">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="text-[10px] font-bold text-slate-700 divide-y divide-slate-100">
                        {config.manpowerBudgets.filter(b => b.category === 'NON-MANAGEMENT' && b.department === selectedDept).map(b => (
                          <tr key={b.id} className="h-8 hover:bg-slate-50 transition-colors">
                            <td className="border-r border-slate-100 p-0 h-8"><input className="w-full h-full text-center bg-transparent border-none focus:ring-0 text-[10px] px-1" value={b.section} onChange={e=>handleBudgetUpdate(b.id, {section: e.target.value})} placeholder="Section..."/></td>
                            <td className="border-r border-slate-100 p-0 h-8"><input className="w-full h-full text-center bg-transparent border-none focus:ring-0 text-[10px] px-1" value={b.designation} onChange={e=>handleBudgetUpdate(b.id, {designation: e.target.value})} placeholder="Designation..."/></td>
                            <td className="border-r border-slate-100 p-0 h-8">
                              <select className="w-full h-full text-center bg-transparent border-none focus:ring-0 font-bold text-[10px] appearance-none cursor-pointer" value={b.type} onChange={e=>handleBudgetUpdate(b.id, {type: e.target.value})}>
                                <option value="Worker">Worker</option>
                                <option value="Staff">Staff</option>
                              </select>
                            </td>
                            <td className="border-r border-slate-100 p-0 h-8"><input type="number" className="w-full h-full text-center bg-transparent border-none focus:ring-0 text-[10px]" value={b.budgetPerLine} onChange={e=>handleBudgetUpdate(b.id, {budgetPerLine: parseInt(e.target.value)||0})} /></td>
                            <td className="border-r border-slate-100 p-0 h-8"><input type="number" className="w-full h-full text-center bg-transparent border-none focus:ring-0 text-[10px]" value={b.numLines} onChange={e=>handleBudgetUpdate(b.id, {numLines: parseInt(e.target.value)||0})} /></td>
                            <td className="border-r border-slate-100 font-[1000] bg-indigo-50 text-indigo-700 text-[11px]">{b.totalBudget}</td>
                            <td className="border-r border-slate-100 text-slate-300 italic">0</td>
                            <td className="border-r border-slate-100 text-slate-300 italic">0</td>
                            <td className={`border-r border-slate-100 font-black ${b.totalBudget - 0 < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{b.totalBudget - 0}</td>
                            <td className="border-r border-slate-100 text-slate-300 italic">--</td>
                            <td className="border-r border-slate-100 p-0 h-8"><input className="w-full h-full text-center bg-transparent border-none focus:ring-0 text-[9px] px-1" value={b.remarks} onChange={e=>handleBudgetUpdate(b.id, {remarks: e.target.value})} placeholder="Remarks..."/></td>
                            <td className="h-8"><button onClick={()=>handleDeleteBudgetEntry(b.id)} className="text-slate-300 hover:text-rose-500 flex items-center justify-center w-full"><Trash2 size={13}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-slate-50/50 h-8 border-t border-slate-900 flex items-center justify-center">
                    <button onClick={() => handleAddBudgetEntry('NON-MANAGEMENT')} className="text-[9px] font-[1000] text-blue-600 uppercase flex items-center gap-1.5 hover:bg-white px-6 h-full transition-all">
                      <Plus size={12}/> ADD NON-MANAGEMENT ROW
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'STATUS' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3 text-emerald-700">
                  <ExcelIcon size={20} />
                  <h3 className="text-sm font-black uppercase tracking-tighter leading-none">Workforce Excel Import</h3>
                </div>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-[11px] font-mono min-h-[150px] outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="SI  ID  NAME  DESIG  DEPT  SEC LOC JOIN  TYPE  GRADE  RELIGION  GENDER..."
                  value={excelImport}
                  onChange={e => setExcelImport(e.target.value)}
                />
                <button onClick={handleWorkforceImport} className="bg-emerald-700 text-white px-6 py-2 rounded-lg font-black uppercase text-[10px] shadow-md hover:bg-emerald-800 transition-all flex items-center gap-2 active:scale-95">
                  <RefreshCcw size={14}/> Synchronize Registry
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter leading-none">Live Workforce Registry</h3>
                  <span className="bg-blue-900 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-sm">{filteredWorkforce.length} Personnel Matched</span>
                </div>
                <div className="max-h-[500px] overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1400px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest h-10">
                        <th className="px-4 border-r border-white/10 w-12 text-center">SI</th>
                        <th className="px-4 border-r border-white/10 w-32 text-center">ID</th>
                        <th className="px-6 border-r border-white/10">EMPLOYEE NAME</th>
                        <th className="px-6 border-r border-white/10">DESIGNATION</th>
                        <th className="px-6 border-r border-white/10 bg-indigo-950">COMMON DESIGNATION</th>
                        <th className="px-6 border-r border-white/10">DEPARTMENT</th>
                        <th className="px-6 border-r border-white/10">SECTION</th>
                        <th className="px-6 border-r border-white/10">LOCATION</th>
                        <th className="px-4 border-r border-white/10 text-center">JOINED</th>
                        <th className="px-4 border-r border-white/10 text-center">TYPE</th>
                        <th className="px-4 border-r border-white/10 text-center">GRADE</th>
                        <th className="px-4 border-r border-white/10 text-center">RELIGION</th>
                        <th className="px-4 text-center">GEN</th>
                      </tr>
                      <tr className="bg-slate-800 text-white h-8">
                        <td className="px-2 border-r border-white/5"></td>
                        <td className="px-2 border-r border-white/5"><input className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-bold outline-none" placeholder="ID..." value={searchFilters.id} onChange={e=>setSearchFilters({...searchFilters, id: e.target.value})} /></td>
                        <td className="px-2 border-r border-white/5"><input className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-bold outline-none" placeholder="Name..." value={searchFilters.name} onChange={e=>setSearchFilters({...searchFilters, name: e.target.value})} /></td>
                        <td className="px-2 border-r border-white/5"><input className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-bold outline-none" placeholder="Desig..." value={searchFilters.designation} onChange={e=>setSearchFilters({...searchFilters, designation: e.target.value})} /></td>
                        <td className="px-2 border-r border-white/5"></td>
                        <td className="px-2 border-r border-white/5"><input className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-bold outline-none" placeholder="Dept..." value={searchFilters.dept} onChange={e=>setSearchFilters({...searchFilters, dept: e.target.value})} /></td>
                        <td className="px-2 border-r border-white/5"><input className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-bold outline-none" placeholder="Sec..." value={searchFilters.section} onChange={e=>setSearchFilters({...searchFilters, section: e.target.value})} /></td>
                        <td colSpan={6}></td>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                      {filteredWorkforce.map((e, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors h-8 text-[10px]">
                          <td className="px-4 border-r border-slate-100 text-center text-slate-400">{idx + 1}</td>
                          <td className="px-4 border-r border-slate-100 text-center font-black text-blue-700">{e.employeeId}</td>
                          <td className="px-6 border-r border-slate-100 uppercase truncate max-w-[150px]">{e.name}</td>
                          <td className="px-6 border-r border-slate-100 text-slate-500 italic text-[9px] truncate max-w-[120px]">{e.designation}</td>
                          <td className="px-6 border-r border-slate-100 bg-slate-50 font-black text-slate-900 truncate max-w-[120px]">{e.designation}</td>
                          <td className="px-6 border-r border-slate-100 uppercase text-[9px]">{e.department}</td>
                          <td className="px-6 border-r border-slate-100 uppercase text-[9px]">{e.section}</td>
                          <td className="px-6 border-r border-slate-100 uppercase text-slate-500 text-[9px]">{e.location}</td>
                          <td className="px-4 border-r border-slate-100 text-center text-[9px]">{e.joined}</td>
                          <td className="px-4 border-r border-slate-100 text-center"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[8px]">{e.type}</span></td>
                          <td className="px-4 border-r border-slate-100 text-center font-black">{e.grade}</td>
                          <td className="px-4 border-r border-slate-100 text-center text-slate-500">{e.religion}</td>
                          <td className="px-4 text-center font-black">{e.gender}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'SKILL' && (
            <SkillMatrix department={selectedDept as any} role={currentUser.role} />
          )}

          {currentTab === 'ABSENT' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Strength', value: config.manpowerStatus.filter(e => e.department === selectedDept).length, color: 'text-blue-600' },
                  { label: 'Present Today', value: Math.floor(config.manpowerStatus.filter(e => e.department === selectedDept).length * 0.92), color: 'text-emerald-600' },
                  { label: 'Absent Count', value: Math.ceil(config.manpowerStatus.filter(e => e.department === selectedDept).length * 0.08), color: 'text-rose-600' },
                  { label: 'Attendance %', value: '92.4%', color: 'text-indigo-600' }
                ].map(stat => (
                  <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 h-60 flex flex-col items-center justify-center space-y-3 animate-in zoom-in-95">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shadow-sm">
                  <UserMinus size={28}/>
                </div>
                <h3 className="text-base font-black uppercase italic text-slate-900">Absent Status Monitor</h3>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px] text-center max-w-md">Detailed attendance logs are currently syncing from central biometric servers...</p>
              </div>
            </div>
          )}

          {currentTab === 'APPRAISAL' && (
            <YearlyAppraisalHub config={config} department={selectedDept} />
          )}
        </div>
      )}

      {message && <div className="fixed bottom-8 right-8 p-4 bg-emerald-600 text-white rounded-2xl shadow-4xl font-black z-[1200] animate-in slide-in-from-right-5 border-2 border-white flex items-center gap-2.5 text-xs"><CheckCircle size={18}/> {message}</div>}
    </div>
  );
};

export default ManpowerAnalysis;
