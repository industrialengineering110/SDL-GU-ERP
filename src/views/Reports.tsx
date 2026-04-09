
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Line, Area, Cell, Scatter
} from 'recharts';
import { Search, Filter, FileText, Download, Calendar, ArrowUpRight, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { UserRole } from '@/types';
import { mockDb } from '@/services/mockDb';

interface ReportsProps {
  role: UserRole;
}

const Reports: React.FC<ReportsProps> = ({ role }) => {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const production = mockDb.getProduction();

  // Mocked Yearly Data for better visuals
  const yearlyData = [
    { name: 'Jan', actual: 45000, target: 50000, efficiency: 90 },
    { name: 'Feb', actual: 48000, target: 50000, efficiency: 96 },
    { name: 'Mar', actual: 42000, target: 52000, efficiency: 80 },
    { name: 'Apr', actual: 51000, target: 52000, efficiency: 98 },
    { name: 'May', actual: 49000, target: 52000, efficiency: 94 },
    { name: 'Jun', actual: 55000, target: 55000, efficiency: 100 },
    { name: 'Jul', actual: 41000, target: 55000, efficiency: 74 },
    { name: 'Aug', actual: 53000, target: 55000, efficiency: 96 },
    { name: 'Sep', actual: 54000, target: 55000, efficiency: 98 },
    { name: 'Oct', actual: 56000, target: 58000, efficiency: 96 },
    { name: 'Nov', actual: 57000, target: 58000, efficiency: 98 },
    { name: 'Dec', actual: 59000, target: 58000, efficiency: 101 },
  ];

  const dailyData = [
    { name: 'Line 01', actual: 4200, target: 5000, efficiency: 84 },
    { name: 'Line 02', actual: 3800, target: 5000, efficiency: 76 },
    { name: 'Line 03', actual: 4900, target: 5000, efficiency: 98 },
    { name: 'Line 04', actual: 3100, target: 5000, efficiency: 62 },
    { name: 'Line 05', actual: 4400, target: 5000, efficiency: 88 },
    { name: 'Line 06', actual: 5200, target: 5000, efficiency: 104 },
    { name: 'Line 07', actual: 4100, target: 5000, efficiency: 82 },
  ];

  const currentChartData = reportType === 'yearly' ? yearlyData : dailyData;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Performance Analytics</h1>
          <p className="text-muted-foreground font-medium">Deep-dive into production efficiency and style-wise performance logs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-card rounded-2xl border border-border p-1 shadow-sm">
            {(['daily', 'monthly', 'yearly'] as const).map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-200 ${
                  reportType === type ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex bg-card rounded-2xl border border-border p-1 shadow-sm">
            <button onClick={() => setViewMode('chart')} className={`p-2 rounded-xl transition-all ${viewMode === 'chart' ? 'bg-accent text-primary' : 'text-muted-foreground'}`}>
               <LayoutGrid size={20} />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-accent text-primary' : 'text-muted-foreground'}`}>
               <List size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Performance Visualization */}
        <div className="xl:col-span-3 bg-card rounded-[2rem] border border-border shadow-sm p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
            <div>
              <h3 className="text-xl font-black text-foreground">
                {reportType === 'yearly' ? 'Annual Production Summary (2024)' : 'Factory Wide Efficiency'}
              </h3>
              <p className="text-sm font-medium text-muted-foreground">Aggregated output and efficiency trends</p>
            </div>
            <div className="flex items-center gap-4">
               <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-bold hover:bg-accent transition-all">
                  <Download size={16} /> Export Excel
               </button>
            </div>
          </div>
          
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={currentChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--chart-text)', fontSize: 12, fontWeight: 700}} dy={15} />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fill: 'var(--chart-text)', fontSize: 12, fontWeight: 700}} label={{ value: 'Total Units', angle: -90, position: 'insideLeft', offset: -10, fill: 'var(--chart-text)', fontSize: 10, fontWeight: 800 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#f59e0b', fontSize: 12, fontWeight: 700}} label={{ value: 'Efficiency %', angle: 90, position: 'insideRight', offset: 10, fill: '#f59e0b', fontSize: 10, fontWeight: 800 }} />
                <Tooltip 
                  cursor={{ fill: 'var(--chart-grid)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--chart-tooltip-bg)', 
                    borderColor: 'var(--chart-tooltip-border)',
                    color: 'var(--chart-tooltip-text)',
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', 
                    padding: '16px' 
                  }}
                />
                <Legend verticalAlign="top" height={50} iconType="circle" />
                <Bar yAxisId="left" dataKey="actual" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Actual Output" barSize={reportType === 'yearly' ? 25 : 45} />
                <Bar yAxisId="left" dataKey="target" fill="var(--muted)" radius={[6, 6, 0, 0]} name="Baseline Target" barSize={reportType === 'yearly' ? 25 : 45} />
                <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={4} dot={{ fill: '#f59e0b', r: 6, strokeWidth: 2, stroke: 'var(--background)' }} name="Efficiency Rating" activeDot={{ r: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
              <Filter size={16} className="text-primary" /> Filter Engine
            </h3>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Global Search</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input className="w-full bg-muted border border-border rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all text-foreground" placeholder="Style, Line, OP..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Specific Date</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="date" className="w-full bg-muted border border-border rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all text-foreground" />
                </div>
              </div>
              <button className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-2xl text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                Apply Smart Filters
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 shadow-xl text-white">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 opacity-70">Top KPI Achievement</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black">98.4%</p>
                  <p className="text-[10px] font-bold uppercase opacity-80">Line 03 Achievement</p>
                </div>
                <div className="bg-white/20 p-2 rounded-xl">
                  <ArrowUpRight size={20} />
                </div>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '98%' }}></div>
              </div>
              <p className="text-[11px] font-medium leading-relaxed opacity-80 italic">
                Consistent high performance observed in Style TSH-2024 across 3 shifts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Style Matrix / Data Log */}
      <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-foreground tracking-tight">Granular Production Logs</h3>
            <p className="text-sm font-medium text-muted-foreground">Verifiable historical data entries from PostgreSQL</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground mr-2">Displaying 10 of 1,244 records</span>
            <div className="flex gap-1">
               <button className="p-2 border border-border rounded-lg hover:bg-accent text-foreground"><ChevronRight size={18} className="rotate-180" /></button>
               <button className="p-2 border border-border rounded-lg hover:bg-accent text-foreground"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-black tracking-[0.15em]">
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Line Identity</th>
                <th className="px-8 py-5">Style Reference</th>
                <th className="px-8 py-5 text-right">Target</th>
                <th className="px-8 py-5 text-right">Actual</th>
                <th className="px-8 py-5 text-center">Efficiency KPI</th>
                <th className="px-8 py-5">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {production.slice(-8).reverse().map((rec) => {
                const eff = Math.round((rec.actual / rec.target) * 100);
                return (
                  <tr key={rec.id} className="hover:bg-accent/50 transition-all cursor-pointer group">
                    <td className="px-8 py-5 text-sm font-bold text-muted-foreground">
                      {rec.date} <span className="text-muted-foreground/50 ml-1 font-medium">{rec.hour}:00</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-muted text-muted-foreground px-3 py-1 rounded-lg text-xs font-black">{rec.lineId}</span>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-sm font-black text-foreground">{rec.styleCode}</p>
                    </td>
                    <td className="px-8 py-5 text-right text-sm font-medium text-muted-foreground tabular-nums">{rec.target}</td>
                    <td className="px-8 py-5 text-right text-sm font-black text-foreground tabular-nums">{rec.actual}</td>
                    <td className="px-8 py-5 text-center">
                       <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                             <div 
                                className={`h-full ${eff >= 100 ? 'bg-green-500' : eff >= 80 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                                style={{ width: `${Math.min(eff, 100)}%` }}
                             ></div>
                          </div>
                          <span className={`text-xs font-black tabular-nums ${eff >= 100 ? 'text-green-600' : eff >= 80 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {eff}%
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                         <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Validated</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {production.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-muted-foreground italic font-medium">No production logs available in the central database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
