
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Database, Search, Filter, ArrowLeft, Download, FileText, 
  Users, Activity, Layout as LayoutIcon, ChevronRight, BarChart3,
  TrendingUp, Layers, Settings, User, Calendar, Tag, ChevronDown, X, Printer, Trash2, Eye
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { LayoutMasterRecord, DepartmentType, AppUser } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Cell, Pie, AreaChart, Area
} from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

interface LayoutBankProps {
  department: DepartmentType;
  currentUser: AppUser;
  onBack?: () => void;
}

const LayoutBank: React.FC<LayoutBankProps> = ({ department, currentUser, onBack }) => {
  const [layouts, setLayouts] = useState<LayoutMasterRecord[]>([]);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    preparedBy: 'All',
    category: 'All'
  });

  useEffect(() => {
    setLayouts(mockDb.getLayoutMasters());
  }, []);

  const uniqueUsers = useMemo(() => Array.from(new Set(layouts.map(l => l.preparedBy))).sort(), [layouts]);
  const uniqueCategories = useMemo(() => Array.from(new Set(layouts.map(l => l.productCategory || 'Uncategorized'))).sort(), [layouts]);

  const filteredLayouts = useMemo(() => {
    return layouts.filter(l => {
      const matchesSearch = l.style.toLowerCase().includes(search.toLowerCase()) || 
                            l.buyer.toLowerCase().includes(search.toLowerCase()) ||
                            (l.remarks || '').toLowerCase().includes(search.toLowerCase());
      
      const layoutDate = parseISO(l.preparedDate);
      const matchesDate = isWithinInterval(layoutDate, {
        start: parseISO(filters.startDate),
        end: parseISO(filters.endDate)
      });

      const matchesUser = filters.preparedBy === 'All' || l.preparedBy === filters.preparedBy;
      const matchesCategory = filters.category === 'All' || (l.productCategory || 'Uncategorized') === filters.category;
      
      return matchesSearch && matchesDate && matchesUser && matchesCategory;
    });
  }, [layouts, search, filters]);

  const stats = useMemo(() => {
    const total = filteredLayouts.length;
    
    // Category wise counts & averages
    const catCounts: Record<string, { count: number, machines: number[], manpower: number[], ops: number[], hlp: number[], irn: number[] }> = {};

    filteredLayouts.forEach(l => {
      const cat = l.productCategory || 'Uncategorized';
      if (!catCounts[cat]) catCounts[cat] = { count: 0, machines: [], manpower: [], ops: [], hlp: [], irn: [] };
      
      catCounts[cat].count++;
      const totalMachines = l.operators + l.helpers + l.ironMan;
      catCounts[cat].machines.push(totalMachines);
      catCounts[cat].manpower.push(totalMachines);
      catCounts[cat].ops.push(l.operators);
      catCounts[cat].hlp.push(l.helpers);
      catCounts[cat].irn.push(l.ironMan);
    });

    const categoryStats = Object.entries(catCounts).map(([name, data]) => ({
      name,
      count: data.count,
      avgMachines: Math.round(data.machines.reduce((a, b) => a + b, 0) / data.count),
      avgManpower: Math.round(data.manpower.reduce((a, b) => a + b, 0) / data.count),
      avgOps: Math.round(data.ops.reduce((a, b) => a + b, 0) / data.count),
      avgHlp: Math.round(data.hlp.reduce((a, b) => a + b, 0) / data.count),
      avgIrn: Math.round(data.irn.reduce((a, b) => a + b, 0) / data.count),
    }));

    // User wise counts
    const userCounts: Record<string, number> = {};
    filteredLayouts.forEach(l => {
      userCounts[l.preparedBy] = (userCounts[l.preparedBy] || 0) + 1;
    });
    const userData = Object.entries(userCounts).map(([name, count]) => ({ name, count }));

    // Month wise trend
    const monthCounts: Record<string, number> = {};
    filteredLayouts.forEach(l => {
      const month = l.preparedDate.substring(0, 7);
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    const monthData = Object.entries(monthCounts).sort().map(([name, count]) => ({ name, count }));

    return { total, categoryStats, userData, monthData };
  }, [filteredLayouts]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-[1700px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 no-print">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Layout Bank Dashboard</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Centralized Production Layout Repository</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search style, buyer or remarks..." 
                className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 w-[350px] shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${showFilters ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter size={16} /> Filters {showFilters && <ChevronDown size={14} />}
          </button>
           <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2 hover:bg-black transition-all active:scale-95">
              <Download size={16} /> Export Bank
           </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300 no-print mx-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Start Date</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20"
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">End Date</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20"
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">User</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20"
              value={filters.preparedBy}
              onChange={e => setFilters({...filters, preparedBy: e.target.value})}
            >
              <option value="All">All Users</option>
              {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20"
              value={filters.category}
              onChange={e => setFilters({...filters, category: e.target.value})}
            >
              <option value="All">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Total Layouts</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-[1000] tracking-tighter italic">{stats.total}</span>
              <span className="text-xs font-bold text-emerald-400 uppercase">Filtered</span>
            </div>
            <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <Activity size={12} className="text-emerald-400" />
              <span>Production Registry</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Manpower</span>
          </div>
          <div className="space-y-4">
            <p className="text-4xl font-black text-slate-900">
              {Math.round(filteredLayouts.reduce((s, l) => s + l.operators + l.helpers + l.ironMan, 0) / (filteredLayouts.length || 1))}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per Layout Average</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Settings size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Operators</span>
          </div>
          <div className="space-y-4">
            <p className="text-4xl font-black text-slate-900">
              {Math.round(filteredLayouts.reduce((s, l) => s + l.operators, 0) / (filteredLayouts.length || 1))}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per Layout Average</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Efficiency</span>
          </div>
          <div className="space-y-4">
            <p className="text-4xl font-black text-slate-900">
              {Math.round(filteredLayouts.reduce((s, l) => s + l.efficiency, 0) / (filteredLayouts.length || 1))}%
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Achievement</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" /> Category wise Layouts
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <User size={18} className="text-emerald-600" /> User wise Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.userData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {stats.userData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" /> Monthly Creation Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Settings size={18} className="text-amber-600" /> Category wise Resource Averages
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryStats} layout="vertical" margin={{left: 40}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgOps" name="Avg. Operators" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                <Bar dataKey="avgHlp" name="Avg. Helpers" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="avgIrn" name="Avg. Ironman" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                <Bar dataKey="avgMachines" name="Avg. Total Machines" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden mx-2">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Layout Registry</h3>
          <div className="flex gap-4">
             <div className="relative group no-print">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 w-64 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SL</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Name</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Buyer</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Style</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Manpower</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLayouts.map((layout, idx) => (
                <tr key={layout.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 text-xs font-black text-slate-400">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-600">{layout.preparedDate}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-black text-slate-900">{layout.preparedBy}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{layout.buyer}</span>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-slate-900">{layout.style}</td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{layout.productCategory || 'Uncategorized'}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center">
                       <span className="text-sm font-black text-slate-900">{layout.operators + layout.helpers + layout.ironMan}</span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Total Man</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Details">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Print Layout">
                        <Printer size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLayouts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Database size={48} />
                      <p className="text-sm font-black uppercase tracking-widest">No layouts found in bank</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LayoutBank;
