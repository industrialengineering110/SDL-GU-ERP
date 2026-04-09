
import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Hammer, Monitor, Wrench, AlertTriangle, Zap, Boxes, 
  Layers, ArrowLeft, ChevronDown, Search, Plus, Trash2, X,
  RefreshCcw, CheckCircle, Settings2, PieChart, Activity,
  Gauge, BarChart3, TrendingUp
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { mockDb } from '../services/mockDb';
import { SystemConfig, MachineAsset, MachineMaintenanceRecord, MachineBreakdownRecord, SparePartRecord } from '../types';

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

const MachineAnalysis: React.FC<{ department: string, currentUser: any }> = ({ department: initialDept, currentUser }) => {
  console.log("MachineAnalysis Mounting with dept:", initialDept);
  const { tab } = useParams();
  const navigate = useNavigate();
  
  const [config, setConfig] = useState(mockDb.getSystemConfig());
  const [selectedDept, setSelectedDept] = useState(initialDept || 'Sewing');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingMaintenance, setIsAddingMaintenance] = useState(false);
  const [isAddingBreakdown, setIsAddingBreakdown] = useState(false);
  const [isAddingSpare, setIsAddingSpare] = useState(false);
  const [isAddingBudget, setIsAddingBudget] = useState(false);

  const [newMaintenance, setNewMaintenance] = useState<Partial<MachineMaintenanceRecord>>({
    machineName: '', mcId: '', type: 'PREVENTIVE', scheduledDate: new Date().toISOString().split('T')[0], technicianName: '', status: 'PENDING'
  });
  const [newBreakdown, setNewBreakdown] = useState<Partial<MachineBreakdownRecord>>({
    machineName: '', mcId: '', lineId: '', issueType: 'MECHANICAL', startTime: new Date().toISOString(), status: 'OPEN'
  });
  const [newSpare, setNewSpare] = useState<Partial<SparePartRecord>>({
    partName: '', partNumber: '', category: 'MECHANICAL', stockQty: 0, minStockQty: 0, unit: 'PCS'
  });

  const [newBudget, setNewBudget] = useState<Partial<any>>({
    category: '', lines: 0, requirements: {}
  });

  const [maintenanceData, setMaintenanceData] = useState<MachineMaintenanceRecord[]>(mockDb.getMaintenance());
  const [breakdownData, setBreakdownData] = useState<MachineBreakdownRecord[]>(mockDb.getBreakdowns());
  const [sparesData, setSparesData] = useState<SparePartRecord[]>(mockDb.getSpares());
  const [budgetData, setBudgetData] = useState<any[]>(config.machineRequirements || []);

  const currentTab = useMemo(() => {
    if (!tab) return 'MENU';
    const t = tab.toUpperCase();
    if (t === 'INVENTORY') return 'INVENTORY';
    if (t === 'MAINTENANCE') return 'MAINTENANCE';
    if (t === 'BREAKDOWN') return 'BREAKDOWN';
    if (t === 'EFFICIENCY') return 'EFFICIENCY';
    if (t === 'SPARES') return 'SPARES';
    if (t === 'BUDGET') return 'BUDGET';
    return 'MENU';
  }, [tab]);

  const machineStats = useMemo(() => {
    const assets = config.machineAssets || [];
    const operational = assets.filter(m => m.status === 'Operational').length;
    const running = assets.filter(m => m.lineId).length;
    const repair = assets.filter(m => m.status === 'Under repair').length;
    const disposal = assets.filter(m => m.status === 'Disposal').length;
    return { total: assets.length, operational, running, repair, disposal, idle: assets.length - running };
  }, [config.machineAssets]);

  const oeeTrend = [
    { name: 'Mon', oee: 78, availability: 85, performance: 92 },
    { name: 'Tue', oee: 82, availability: 88, performance: 94 },
    { name: 'Wed', oee: 80, availability: 86, performance: 93 },
    { name: 'Thu', oee: 85, availability: 90, performance: 95 },
    { name: 'Fri', oee: 83, availability: 89, performance: 94 },
    { name: 'Sat', oee: 88, availability: 92, performance: 96 },
  ];

  const filteredAssets = useMemo(() => {
    return (config.machineAssets || []).filter(m => 
      m.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mcId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.asset.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [config.machineAssets, searchQuery]);

  const setTab = (t: string) => {
    navigate(`/factory/machine-analysis/${t.toLowerCase()}`);
  };

  const handleAddMaintenance = () => {
    const record: MachineMaintenanceRecord = {
      id: Date.now().toString(),
      ...newMaintenance as any
    };
    const updated = [...maintenanceData, record];
    mockDb.saveMaintenances(updated);
    setMaintenanceData(updated);
    setIsAddingMaintenance(false);
    setMessage("Maintenance scheduled successfully.");
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteMaintenance = (id: string) => {
    const updated = maintenanceData.filter(m => m.id !== id);
    mockDb.saveMaintenances(updated);
    setMaintenanceData(updated);
  };

  const handleAddBreakdown = () => {
    const record: MachineBreakdownRecord = {
      id: Date.now().toString(),
      ...newBreakdown as any
    };
    const updated = [...breakdownData, record];
    mockDb.saveBreakdowns(updated);
    setBreakdownData(updated);
    setIsAddingBreakdown(false);
    setMessage("Breakdown reported successfully.");
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteBreakdown = (id: string) => {
    const updated = breakdownData.filter(b => b.id !== id);
    mockDb.saveBreakdowns(updated);
    setBreakdownData(updated);
  };

  const handleAddSpare = () => {
    const record: SparePartRecord = {
      id: Date.now().toString(),
      ...newSpare as any
    };
    const updated = [...sparesData, record];
    mockDb.saveSpares(updated);
    setSparesData(updated);
    setIsAddingSpare(false);
    setMessage("Spare part added successfully.");
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteSpare = (id: string) => {
    const updated = sparesData.filter(s => s.id !== id);
    mockDb.saveSpares(updated);
    setSparesData(updated);
  };

  const handleAddBudget = () => {
    const record = {
      ...newBudget as any
    };
    const updated = [...budgetData, record];
    const sysConfig = mockDb.getSystemConfig();
    mockDb.saveSystemConfig({ ...sysConfig, machineRequirements: updated });
    setBudgetData(updated);
    setIsAddingBudget(false);
    setMessage("Budget plan created successfully.");
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteBudget = (idx: number) => {
    const updated = budgetData.filter((_, i) => i !== idx);
    const sysConfig = mockDb.getSystemConfig();
    mockDb.saveSystemConfig({ ...sysConfig, machineRequirements: updated });
    setBudgetData(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-xl">
            <Hammer size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-[1000] tracking-tighter uppercase italic leading-none text-slate-900">
              Machine Analysis
            </h1>
          </div>
        </div>
      </div>

      {currentTab === 'MENU' ? (
        <div className="space-y-10">
          <DepartmentDropdown label="MACHINE CONTEXT FOCUS (DEPARTMENT)" options={config.departments} value={selectedDept} onChange={setSelectedDept} />
          
          {/* Dashboard Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Activity size={18} className="text-indigo-600" /> OEE Performance Trend
                </h3>
                <div className="flex gap-2">
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest">Target: 85%</span>
                </div>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={oeeTrend}>
                    <defs>
                      <linearGradient id="colorOee" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="oee" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorOee)" name="OEE %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden">
              <TrendingUp size={120} className="absolute -right-10 -bottom-10 opacity-5" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Fleet Availability</p>
                <h2 className="text-5xl font-black tracking-tighter italic">92.4%</h2>
                <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <TrendingUp size={14} /> +1.2% vs Last Month
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase">MTBF</span>
                  <span className="text-sm font-black italic">142 Hours</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase">MTTR</span>
                  <span className="text-sm font-black italic">18.5 Mins</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 pt-4">
            <SubModuleCard title="Fleet Inventory" sub="Live asset registry and status tracking" icon={Layers} color="bg-blue-600" onClick={() => setTab('INVENTORY')} />
            <SubModuleCard title="Maintenance Hub" sub="Preventive maintenance schedules" icon={Wrench} color="bg-indigo-600" onClick={() => setTab('MAINTENANCE')} />
            <SubModuleCard title="Breakdown Logs" sub="Technical downtime and repair history" icon={AlertTriangle} color="bg-rose-500" onClick={() => setTab('BREAKDOWN')} />
            <SubModuleCard title="OEE / Efficiency" sub="Machine utilization and performance" icon={Zap} color="bg-emerald-600" onClick={() => setTab('EFFICIENCY')} />
            <SubModuleCard title="Spare Parts" icon={Boxes} sub="Technical inventory and consumption" color="bg-amber-500" onClick={() => setTab('SPARES')} />
            <SubModuleCard title="Asset Budget" sub="Machinery requirement and procurement" icon={Settings2} color="bg-purple-600" onClick={() => setTab('BUDGET')} />
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <button 
            onClick={() => navigate('/factory/machine-analysis')}
            className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-6"
          >
            <ArrowLeft size={14}/> Back to Machine Menu
          </button>

          {currentTab === 'INVENTORY' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { label: 'Total Fleet', value: machineStats.total, color: 'text-slate-900' },
                  { label: 'Running', value: machineStats.running, color: 'text-emerald-600' },
                  { label: 'Operational', value: machineStats.operational, color: 'text-blue-600' },
                  { label: 'Under Repair', value: machineStats.repair, color: 'text-orange-600' },
                  { label: 'Idle Units', value: machineStats.idle, color: 'text-slate-400' }
                ].map(stat => (
                  <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-[1000] text-slate-900 uppercase italic tracking-tighter leading-none">Fleet Registry Database</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-[10px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all w-64"
                        placeholder="Search by Name, ID or Serial..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[8px] font-[1000] uppercase shadow-md">{filteredAssets.length} Units Matched</span>
                  </div>
                </div>
                <div className="max-h-[500px] overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-9">
                        <th className="px-6 py-2 border-r border-white/10">Machine Name</th>
                        <th className="px-4 py-2 border-r border-white/10 text-center">MC-ID</th>
                        <th className="px-4 py-2 border-r border-white/10">Serial Number</th>
                        <th className="px-4 py-2 border-r border-white/10">Machine Type</th>
                        <th className="px-4 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700 text-[10px]">
                      {filteredAssets.map((m, idx) => (
                        <tr key={idx} className="h-8 hover:bg-slate-50 transition-colors">
                          <td className="px-6 border-r border-slate-100 font-black text-slate-900 uppercase truncate max-w-[250px]">{m.machineName}</td>
                          <td className="px-4 border-r border-slate-100 text-center font-black text-indigo-600">{m.mcId}</td>
                          <td className="px-4 border-r border-slate-100 text-slate-500 font-mono">{m.asset}</td>
                          <td className="px-4 border-r border-slate-100 uppercase text-slate-400">{m.machineType || 'N/A'}</td>
                          <td className="px-6 text-right">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              m.status === 'Operational' ? 'bg-emerald-50 text-emerald-600' : 
                              m.status === 'Under repair' ? 'bg-orange-50 text-orange-600' : 
                              'bg-rose-50 text-rose-600'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'MAINTENANCE' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-[1000] text-slate-900 uppercase italic tracking-tighter leading-none">Preventive Maintenance Hub</h3>
                <button 
                  onClick={() => setIsAddingMaintenance(true)}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Plus size={14}/> Schedule Maintenance
                </button>
              </div>

              {isAddingMaintenance && (
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-2xl animate-in zoom-in-95 duration-300 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-xs font-black uppercase italic">Schedule New Maintenance</h4>
                    <button onClick={() => setIsAddingMaintenance(false)} className="text-slate-400 hover:text-rose-500"><X size={16}/></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Machine Name</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newMaintenance.machineName} onChange={e=>setNewMaintenance({...newMaintenance, machineName: e.target.value})} placeholder="e.g. SN-01 Juki"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">MC-ID</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newMaintenance.mcId} onChange={e=>setNewMaintenance({...newMaintenance, mcId: e.target.value})} placeholder="e.g. MC-101"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Type</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newMaintenance.type} onChange={e=>setNewMaintenance({...newMaintenance, type: e.target.value as any})}>
                        <option value="PREVENTIVE">Preventive</option>
                        <option value="CORRECTIVE">Corrective</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Scheduled Date</label>
                      <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newMaintenance.scheduledDate} onChange={e=>setNewMaintenance({...newMaintenance, scheduledDate: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Technician</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newMaintenance.technicianName} onChange={e=>setNewMaintenance({...newMaintenance, technicianName: e.target.value})} placeholder="Technician Name"/>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={handleAddMaintenance} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-xl hover:bg-indigo-700 transition-all">
                      Confirm Schedule
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Today</p>
                    <p className="text-2xl font-black text-rose-600">{maintenanceData.filter(m => m.status === 'PENDING').length}</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overdue</p>
                    <p className="text-2xl font-black text-orange-600">{maintenanceData.filter(m => m.status === 'OVERDUE').length}</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed (Month)</p>
                    <p className="text-2xl font-black text-emerald-600">{maintenanceData.filter(m => m.status === 'COMPLETED').length}</p>
                 </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-9">
                      <th className="px-6 py-2">Machine</th>
                      <th className="px-4 py-2">MC-ID</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Scheduled Date</th>
                      <th className="px-4 py-2">Technician</th>
                      <th className="px-4 py-2 text-center">Status</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700 text-[10px]">
                    {maintenanceData.map((m, idx) => (
                      <tr key={idx} className="h-10 hover:bg-slate-50 transition-colors group">
                        <td className="px-6 font-black text-slate-900 uppercase">{m.machineName}</td>
                        <td className="px-4 text-indigo-600">{m.mcId}</td>
                        <td className="px-4 uppercase text-slate-400">{m.type}</td>
                        <td className="px-4">{m.scheduledDate}</td>
                        <td className="px-4">{m.technicianName}</td>
                        <td className="px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            m.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                            m.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
                            'bg-rose-50 text-rose-600'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-6 text-right">
                          <button onClick={() => handleDeleteMaintenance(m.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'BREAKDOWN' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-[1000] text-slate-900 uppercase italic tracking-tighter leading-none">Technical Breakdown Logs</h3>
                <button 
                  onClick={() => setIsAddingBreakdown(true)}
                  className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all flex items-center gap-2"
                >
                  <AlertTriangle size={14}/> Report Breakdown
                </button>
              </div>

              {isAddingBreakdown && (
                <div className="bg-white p-6 rounded-3xl border-2 border-rose-600 shadow-2xl animate-in zoom-in-95 duration-300 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-xs font-black uppercase italic text-rose-600">Report New Machine Breakdown</h4>
                    <button onClick={() => setIsAddingBreakdown(false)} className="text-slate-400 hover:text-rose-500"><X size={16}/></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Machine Name</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newBreakdown.machineName} onChange={e=>setNewBreakdown({...newBreakdown, machineName: e.target.value})} placeholder="e.g. SN-01 Juki"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">MC-ID</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newBreakdown.mcId} onChange={e=>setNewBreakdown({...newBreakdown, mcId: e.target.value})} placeholder="e.g. MC-101"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Line ID</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newBreakdown.lineId} onChange={e=>setNewBreakdown({...newBreakdown, lineId: e.target.value})} placeholder="e.g. Line-01"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Issue Type</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newBreakdown.issueType} onChange={e=>setNewBreakdown({...newBreakdown, issueType: e.target.value as any})}>
                        <option value="MECHANICAL">Mechanical</option>
                        <option value="ELECTRICAL">Electrical</option>
                        <option value="PNEUMATIC">Pneumatic</option>
                        <option value="ELECTRONIC">Electronic</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Start Time</label>
                      <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newBreakdown.startTime?.slice(0, 16)} onChange={e=>setNewBreakdown({...newBreakdown, startTime: e.target.value})}/>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={handleAddBreakdown} className="bg-rose-600 text-white px-8 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-xl hover:bg-rose-700 transition-all">
                      Submit Log
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Issues</p>
                    <p className="text-2xl font-black text-rose-600">{breakdownData.filter(b => b.status !== 'RESOLVED').length}</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Repair Time</p>
                    <p className="text-2xl font-black text-slate-900">24m</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resolved Today</p>
                    <p className="text-2xl font-black text-emerald-600">12</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">MTTR</p>
                    <p className="text-2xl font-black text-blue-600">18.5m</p>
                 </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-9">
                      <th className="px-6 py-2">Machine</th>
                      <th className="px-4 py-2">Line</th>
                      <th className="px-4 py-2">Issue Type</th>
                      <th className="px-4 py-2">Start Time</th>
                      <th className="px-4 py-2">Technician</th>
                      <th className="px-4 py-2 text-center">Status</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700 text-[10px]">
                    {breakdownData.map((b, idx) => (
                      <tr key={idx} className="h-12 hover:bg-slate-50 transition-colors group">
                        <td className="px-6">
                           <p className="font-black text-slate-900 uppercase">{b.machineName}</p>
                           <p className="text-[8px] text-slate-400">{b.mcId}</p>
                        </td>
                        <td className="px-4 font-black text-indigo-600">{b.lineId}</td>
                        <td className="px-4 text-rose-600 uppercase">{b.issueType}</td>
                        <td className="px-4 font-mono text-slate-500">{new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4">{b.technicianName || 'Unassigned'}</td>
                        <td className="px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            b.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 
                            b.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 
                            'bg-rose-50 text-rose-600 animate-pulse'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-6 text-right">
                          <button onClick={() => handleDeleteBreakdown(b.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'EFFICIENCY' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-[1000] text-slate-900 uppercase italic tracking-tighter leading-none">Machine OEE & Efficiency</h3>
                <div className="flex gap-2">
                   <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                      Export Report
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full border-8 border-emerald-500 border-t-slate-100 flex items-center justify-center mb-4">
                       <span className="text-xl font-black text-slate-900">94%</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Availability</p>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full border-8 border-blue-500 border-t-slate-100 flex items-center justify-center mb-4">
                       <span className="text-xl font-black text-slate-900">88%</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</p>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full border-8 border-indigo-500 border-t-slate-100 flex items-center justify-center mb-4">
                       <span className="text-xl font-black text-slate-900">99%</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quality</p>
                 </div>
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Factory Wide OEE Score</p>
                    <h2 className="text-5xl font-black tracking-tighter italic">82.4%</h2>
                 </div>
                 <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-2">
                       <Activity size={16}/> +2.4% from last week
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">World Class Benchmark: 85%</p>
                 </div>
              </div>
            </div>
          )}

          {currentTab === 'SPARES' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-[1000] text-slate-900 uppercase italic tracking-tighter leading-none">Spare Parts Inventory</h3>
                <button 
                  onClick={() => setIsAddingSpare(true)}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Plus size={14}/> Add New Part
                </button>
              </div>

              {isAddingSpare && (
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-2xl animate-in zoom-in-95 duration-300 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-xs font-black uppercase italic">Register New Spare Part</h4>
                    <button onClick={() => setIsAddingSpare(false)} className="text-slate-400 hover:text-rose-500"><X size={16}/></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Part Name</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newSpare.partName} onChange={e=>setNewSpare({...newSpare, partName: e.target.value})} placeholder="e.g. Needle Bar"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Part Number</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newSpare.partNumber} onChange={e=>setNewSpare({...newSpare, partNumber: e.target.value})} placeholder="e.g. PN-9922"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Category</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newSpare.category} onChange={e=>setNewSpare({...newSpare, category: e.target.value as any})}>
                        <option value="MECHANICAL">Mechanical</option>
                        <option value="ELECTRICAL">Electrical</option>
                        <option value="PNEUMATIC">Pneumatic</option>
                        <option value="ELECTRONIC">Electronic</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Stock Qty</label>
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newSpare.stockQty} onChange={e=>setNewSpare({...newSpare, stockQty: parseInt(e.target.value)||0})}/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Min Stock Qty</label>
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newSpare.minStockQty} onChange={e=>setNewSpare({...newSpare, minStockQty: parseInt(e.target.value)||0})}/>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={handleAddSpare} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-xl hover:bg-slate-800 transition-all">
                      Add to Inventory
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total SKU</p>
                    <p className="text-2xl font-black text-slate-900">{sparesData.length}</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-amber-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Low Stock Items</p>
                    <p className="text-2xl font-black text-amber-600">{sparesData.filter(s => s.stockQty <= s.minStockQty).length}</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inventory Value</p>
                    <p className="text-2xl font-black text-blue-600">$12,450</p>
                 </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-9">
                      <th className="px-6 py-2">Part Name</th>
                      <th className="px-4 py-2">Part Number</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2 text-center">Stock</th>
                      <th className="px-4 py-2 text-center">Min Stock</th>
                      <th className="px-4 py-2 text-center">Status</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700 text-[10px]">
                    {sparesData.map((s, idx) => (
                      <tr key={idx} className="h-10 hover:bg-slate-50 transition-colors group">
                        <td className="px-6 font-black text-slate-900 uppercase">{s.partName}</td>
                        <td className="px-4 text-indigo-600 font-mono">{s.partNumber}</td>
                        <td className="px-4 uppercase text-slate-400">{s.category}</td>
                        <td className="px-4 text-center tabular-nums">{s.stockQty} {s.unit}</td>
                        <td className="px-4 text-center tabular-nums">{s.minStockQty} {s.unit}</td>
                        <td className="px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            s.stockQty > s.minStockQty ? 'bg-emerald-50 text-emerald-600' : 
                            'bg-rose-50 text-rose-600'
                          }`}>
                            {s.stockQty > s.minStockQty ? 'In Stock' : 'Low Stock'}
                          </span>
                        </td>
                        <td className="px-6 text-right">
                          <button onClick={() => handleDeleteSpare(s.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'BUDGET' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-[1000] text-slate-900 uppercase italic tracking-tighter leading-none">Machinery Requirement & Budget</h3>
                <button 
                  onClick={() => setIsAddingBudget(true)}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Plus size={14}/> Create New Budget Plan
                </button>
              </div>

              {isAddingBudget && (
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-2xl animate-in zoom-in-95 duration-300 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-xs font-black uppercase italic">Create New Procurement Plan</h4>
                    <button onClick={() => setIsAddingBudget(false)} className="text-slate-400 hover:text-rose-500"><X size={16}/></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Category / Style</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newBudget.category} onChange={e=>setNewBudget({...newBudget, category: e.target.value})} placeholder="e.g. Basic Denim 5-Pocket"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Number of Lines</label>
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" value={newBudget.lines} onChange={e=>setNewBudget({...newBudget, lines: parseInt(e.target.value)||0})}/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Machine Requirements (JSON)</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" placeholder='{"SN": 20, "OL": 10}' onChange={e=>{
                        try {
                          const val = JSON.parse(e.target.value);
                          setNewBudget({...newBudget, requirements: val});
                        } catch(err) {}
                      }}/>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={handleAddBudget} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-xl hover:bg-slate-800 transition-all">
                      Save Plan
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Procurement Plans</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-9">
                        <th className="px-6 py-2">Category / Style</th>
                        <th className="px-4 py-2 text-center">Lines</th>
                        <th className="px-4 py-2">Machine Requirements</th>
                        <th className="px-4 py-2 text-center">Status</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700 text-[10px]">
                      {budgetData.length > 0 ? budgetData.map((r, idx) => (
                        <tr key={idx} className="h-12 hover:bg-slate-50 transition-colors group">
                          <td className="px-6 font-black text-slate-900 uppercase">{r.category}</td>
                          <td className="px-4 text-center font-black text-indigo-600">{r.lines} Lines</td>
                          <td className="px-4">
                             <div className="flex flex-wrap gap-2">
                                {Object.entries(r.requirements || {}).map(([mc, qty]) => (
                                   <span key={mc} className="bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black text-slate-600 uppercase">
                                      {mc}: {qty as any}
                                   </span>
                                ))}
                             </div>
                          </td>
                          <td className="px-4 text-center">
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Planning</span>
                          </td>
                          <td className="px-6 text-right">
                            <button onClick={() => handleDeleteBudget(idx)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-300 italic">No active machinery budget plans found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {message && <div className="fixed bottom-8 right-8 p-4 bg-emerald-600 text-white rounded-2xl shadow-4xl font-black z-[1200] animate-in slide-in-from-right-5 border-2 border-white flex items-center gap-2.5 text-xs"><CheckCircle size={18}/> {message}</div>}
    </div>
  );
};

export default MachineAnalysis;
