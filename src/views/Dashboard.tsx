import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, Target, CheckCircle, Sparkles, Clock, 
  ChevronRight, Activity, ShieldAlert, Scissors, Shirt, Droplets, Sparkle, 
  Truck, Calendar, Filter, Timer, Cpu, BarChart3, ClipboardList, AlertTriangle, LineChart, Award, Minus, Plus, RotateCcw,
  Info, Layout, RefreshCcw, DollarSign
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { UserRole, DepartmentType } from '../types';
import { apiService } from '../services/apiService';
import { useGlobal } from '../App';
import Logo from '../components/Logo';

interface DashboardProps {
  role: UserRole;
}

const AnalyticsCharts: React.FC<{ dataService: any }> = ({ dataService }) => {
  if (!dataService) return <div className="h-64 flex items-center justify-center">Loading Analytics...</div>;

  const productionData = dataService.getNPT().map((n: any) => ({ date: n.date, total_production: n.durationMinutes, total_target: 100 }));
  const efficiencyData = dataService.getNPT().map((n: any) => ({ date: n.date, avg_efficiency: 80 }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
        <h3 className="text-lg font-black mb-4">Production Trend (PCS)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="total_production" name="Actual" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="total_target" name="Target" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
        <h3 className="text-lg font-black mb-4">Efficiency Trend (%)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg_efficiency" name="Avg Efficiency" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const MiniTrend = React.memo(({ data, color }: { data: any[], color: string }) => (
  <div className="h-12 w-24">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
));

const KPICard = React.memo(({ title, value, sub, icon: Icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="bg-card border-border hover:border-primary/50 shadow-sm hover:shadow-md p-5 rounded-3xl border transition-all text-left flex flex-col justify-between group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-2">
       <div className="bg-primary text-primary-foreground text-[7px] font-black px-1.5 py-0.5 rounded-bl-lg uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">KPI</div>
    </div>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
         <Icon size={18} />
      </div>
      <div className="p-1.5 rounded-lg bg-muted">
         <ChevronRight size={10} className="text-muted-foreground/50" />
      </div>
    </div>
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-1 h-1 rounded-full bg-primary"></div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</p>
      </div>
      <p className="text-xl font-black leading-none text-foreground">{value}</p>
      <p className="text-[9px] font-bold text-muted-foreground mt-2 flex items-center gap-1">
        <Activity size={8} /> {sub}
      </p>
    </div>
  </button>
));

const MonthlyProductionDashboard: React.FC<{ selectedDate: string, selectedMonth: string, theme: string, dataService: any }> = React.memo(({ selectedDate, selectedMonth, theme, dataService }) => {
  const monthName = new Date(selectedMonth).toLocaleString('default', { month: 'long' });
  
  const summary = useMemo(() => {
    if (!dataService) return {};
    const depts: DepartmentType[] = ['Cutting', 'Sewing', 'Finishing', 'Washing'];
    return depts.reduce((acc, dept) => {
      const daily = dataService.getDepartmentSummary(dept, { date: selectedDate });
      const monthly = dataService.getDepartmentSummary(dept, { month: selectedMonth });
      acc[dept] = { daily, monthly };
      return acc;
    }, {} as any);
  }, [selectedDate, selectedMonth, dataService]);

  const SummaryRow = useCallback(({ label, values, isHeader = false }: any) => (
    <div className={`flex border-b last:border-0 items-stretch ${isHeader ? 'h-auto md:h-10' : 'h-auto md:h-11'} border-border`}>
      <div className={`w-28 md:w-44 flex items-center px-2 md:px-4 border-r border-border ${isHeader ? 'bg-primary text-primary-foreground font-black' : 'bg-muted text-foreground font-bold'}`}>
        <span className="text-[9px] md:text-[10px] uppercase tracking-tighter">{label}</span>
      </div>
      {values.map((v: any, i: number) => (
        <div key={i} className={`flex-1 flex flex-col items-center justify-center border-r last:border-0 px-1 md:px-2 py-2 md:py-0 border-border ${v.bgColor || ''}`}>
          <span className={`text-[10px] md:text-[12px] font-[900] leading-none ${v.color || 'text-foreground'}`}>{v.text}</span>
          {v.subText && <span className="text-[7px] md:text-[8px] font-bold text-muted-foreground uppercase mt-0.5">{v.subText}</span>}
        </div>
      ))}
    </div>
  ), []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-[1700px] mx-auto">
      {/* Title Header */}
      <div className="bg-card border-border rounded-t-[2.5rem] p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-x border-t">
         <Logo size={30} showText={false} />
         <div className="text-center">
            <h2 className="text-xl md:text-3xl font-[1000] tracking-tighter uppercase italic leading-none text-foreground">Square Denim's Ltd (GU)</h2>
            <div className="flex items-center justify-center gap-4 mt-1">
               <h3 className="text-[10px] md:text-sm font-black text-primary uppercase tracking-[0.2em] md:tracking-[0.4em] underline underline-offset-4 decoration-2">Monthly Production Status</h3>
            </div>
         </div>
         <div className="text-center md:text-right">
            <span className="text-lg md:text-xl font-black block text-foreground">{monthName}</span>
            <span className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] md:tracking-[0.2em]">{selectedDate}</span>
         </div>
      </div>

      {/* Main High-Density Table */}
      <div className="bg-card border-border border-2 overflow-x-auto shadow-2xl">
        <div className="min-w-[600px]">
          <SummaryRow 
            label="Department Pool" 
            isHeader
            values={[
              { text: 'Cutting', bgColor: 'bg-orange-500/10', color: 'text-orange-600' },
              { text: 'Sewing', bgColor: 'bg-emerald-500/10', color: 'text-emerald-600' },
              { text: 'Finishing', bgColor: 'bg-amber-500/10', color: 'text-amber-600' },
              { text: 'Washing / Delivery', bgColor: 'bg-blue-500/10', color: 'text-blue-600' }
            ]}
          />
          <SummaryRow 
            label="Last Day Production" 
            values={[
              { text: `${summary.Cutting?.daily.totalActual || 0} Pcs` },
              { text: `${summary.Sewing?.daily.totalActual || 0} Pcs` },
              { text: `${summary.Finishing?.daily.totalActual || 0} Pcs` },
              { text: `${summary.Washing?.daily.totalActual || 0} Pcs`, subText: '(Delivery)' }
            ]}
          />
          <SummaryRow 
            label="Last Day Effi / Utiliz" 
            values={[
              { text: `${summary.Cutting?.daily.efficiency.toFixed(2) || '0.00'}%` },
              { text: `${summary.Sewing?.daily.efficiency.toFixed(2) || '0.00'}%` },
              { text: `${summary.Finishing?.daily.efficiency.toFixed(2) || '0.00'}%` },
              { text: `Wet: ${summary.Washing?.daily.efficiency.toFixed(2) || '0.00'}%`, color: 'text-blue-600', subText: 'Utilization' }
            ]}
          />
          <SummaryRow 
            label="Monthly Target" 
            values={[
              { text: `${summary.Cutting?.monthly.totalTarget || 0} Pcs` },
              { text: '--', color: 'text-slate-300' },
              { text: '--', color: 'text-slate-300' },
              { text: `${summary.Washing?.monthly.totalTarget || 0} pcs`, color: 'text-blue-600' }
            ]}
          />
          <SummaryRow 
            label="Monthly Production" 
            values={[
              { text: `${summary.Cutting?.monthly.totalActual || 0} Pcs` },
              { text: `${summary.Sewing?.monthly.totalActual || 0} Pcs` },
              { text: `${summary.Finishing?.monthly.totalActual || 0} Pcs` },
              { text: `${summary.Washing?.monthly.totalActual || 0} Pcs`, color: 'text-blue-600' }
            ]}
          />
          <SummaryRow 
            label="Target Vs Achieve %" 
            values={[
              { text: summary.Cutting?.monthly.totalTarget > 0 ? `${((summary.Cutting.monthly.totalActual / summary.Cutting.monthly.totalTarget)*100).toFixed(2)}%` : '--', color: 'text-blue-600' },
              { text: '--', color: 'text-slate-300' },
              { text: '--', color: 'text-slate-300' },
              { text: '--', color: 'text-slate-300' }
            ]}
          />
          <SummaryRow 
            label="Monthly Efficiency" 
            values={[
              { text: `${summary.Cutting?.monthly.efficiency.toFixed(2) || '0.00'}%` },
              { text: `${summary.Sewing?.monthly.efficiency.toFixed(2) || '0.00'}%` },
              { text: `${summary.Finishing?.monthly.efficiency.toFixed(2) || '0.00'}%` },
              { text: `Wet: 0.00%`, color: 'text-blue-600', subText: 'Utilization' }
            ]}
          />
          <SummaryRow 
            label="WIP / In-hand" 
            values={[
              { text: `--` },
              { text: `--` },
              { text: `--` },
              { text: `--`, color: 'text-rose-600', subText: '--' }
            ]}
          />
        </div>
      </div>


      {/* Department Detailed Status Cards (Bottom Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CUTTING STATUS */}
        <div className={`${theme === 'dark' ? 'bg-orange-950/20 border-orange-900/30' : 'bg-[#fde6d8] border-[#eebba0] shadow-sm'} rounded-[2.5rem] border overflow-hidden flex flex-col`}>
          <div className="p-6 flex items-center justify-between">
            <h4 className={`text-xl font-black tracking-tight flex items-center gap-3 ${theme === 'dark' ? 'text-orange-200' : 'text-slate-800'}`}>
               <Scissors size={20} className="text-orange-600" /> Cutting Production Status
            </h4>
          </div>
          <div className="px-8 pb-6 space-y-3 font-bold text-xs">
            <div className="flex justify-between items-center"><span className="text-slate-500 uppercase tracking-tighter">Cutting Target :</span><span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-black`}>{summary.Cutting?.daily.totalTarget || 0}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 uppercase tracking-tighter">Cutting Pcs Production :</span><span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-black`}>{summary.Cutting?.daily.totalActual || 0}</span></div>
          </div>
        </div>

        {/* SEWING STATUS */}
        <div className={`${theme === 'dark' ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-[#e2f9ee] border-[#bce8d2] shadow-sm'} rounded-[2.5rem] border overflow-hidden flex flex-col`}>
          <div className="p-6 flex items-center justify-between">
            <h4 className={`text-xl font-black tracking-tight flex items-center gap-3 ${theme === 'dark' ? 'text-emerald-200' : 'text-slate-800'}`}>
               <Shirt size={20} className="text-emerald-600" /> Sewing Production Status
            </h4>
          </div>
          <div className="px-8 pb-6 space-y-3 font-bold text-xs">
            <div className="flex justify-between items-center"><span className="text-slate-500 uppercase tracking-tighter">Sewing Line Production :</span><span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-black`}>{summary.Sewing?.daily.totalActual || 0}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 uppercase tracking-tighter">Efficiency :</span><span className="text-emerald-600 font-black">{summary.Sewing?.daily.efficiency.toFixed(2) || '0.00'}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
});

const DepartmentSection: React.FC<{ 
  dept: DepartmentType; 
  icon: any; 
  colorClass: string;
  selectedDate: string;
  selectedMonth: string;
  filterMode: 'daily' | 'monthly';
  onCardClick: (type: string, dept: string) => void;
  theme: string;
  dataService: any;
}> = React.memo(({ dept, icon: Icon, colorClass, selectedDate, selectedMonth, filterMode, onCardClick, theme, dataService }) => {
  const navigate = useNavigate();
  const [showLineDetail, setShowLineDetail] = useState(false);
  
    const summary = useMemo(() => {
      try {
        if (!dataService) return { efficiency: 0, totalActual: 0, totalTarget: 0, dhu: 0, fiveS: 0, presentMP: 0, totalMP: 0, workingMc: 0, totalMc: 0 };
        return dataService.getDepartmentSummary(dept, filterMode === 'daily' ? { date: selectedDate } : { month: selectedMonth });
      } catch (e) {
        console.error(`Error fetching summary for ${dept}:`, e);
        return { efficiency: 0, totalActual: 0, totalTarget: 0, dhu: 0, fiveS: 0, presentMP: 0, totalMP: 0, workingMc: 0, totalMc: 0 };
      }
    }, [dept, filterMode, selectedDate, selectedMonth, dataService]);

    const linePerf = useMemo(() => {
      try {
        if (!dataService) return [];
        return dataService.getLinePerformance(dept, selectedDate);
      } catch (e) {
        console.error(`Error fetching line performance for ${dept}:`, e);
        return [];
      }
    }, [dept, selectedDate, dataService]);
  
  const bestLine = useMemo(() => {
    if (linePerf.length === 0) return null;
    return [...linePerf].sort((a,b) => b.efficiency - a.efficiency)[0];
  }, [linePerf]);

  const totalNptMinutes = useMemo(() => {
    if (!dataService) return 0;
    const nptData = dataService.getNPT(dept).filter((n: any) => {
      if (filterMode === 'daily') return n.date === selectedDate;
      return n.date.startsWith(selectedMonth);
    });
    return nptData.reduce((acc: number, curr: any) => acc + (curr.durationMinutes || 0), 0);
  }, [dept, filterMode, selectedDate, selectedMonth, dataService]);

  const trendData = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ 
    value: 10 + Math.random() * 20 
  })), []);

  const isIEDept = dept === 'IE';
  const isCostingOrPlanning = dept === 'Costing' || dept === 'Planning';

  return (
    <div className="bg-card border-border rounded-[3rem] border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">
      <div className="p-8 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-6">
         <div className="flex items-center gap-5">
            <div className={`p-4 rounded-3xl ${colorClass} text-white shadow-xl`}>
               <Icon size={32} />
            </div>
            <div>
               <h2 className="text-2xl font-black tracking-tight text-foreground">{dept} Department</h2>
               <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                    <TrendingUp size={10} /> {isIEDept || isCostingOrPlanning ? '100%' : `${summary.efficiency.toFixed(1)}%`} {isIEDept || isCostingOrPlanning ? 'COMPLIANCE' : 'EFFICIENCY'}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                     {filterMode === 'daily' ? `LOGGED FOR ${selectedDate}` : `SUMMARY FOR ${selectedMonth}`}
                  </span>
               </div>
            </div>
         </div>
         
         {!isIEDept && !isCostingOrPlanning && (
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Shift Progress</p>
                 <div className="flex items-center gap-3 mt-1">
                    <div className="w-32 h-2 rounded-full overflow-hidden bg-muted">
                       <div className={`h-full ${colorClass}`} style={{ width: `${Math.min(summary.efficiency, 100)}%` }}></div>
                    </div>
                    <span className="text-sm font-black text-foreground">{summary.totalActual} / {summary.totalTarget || 'N/A'}</span>
                 </div>
              </div>
              <MiniTrend data={trendData} color={colorClass.replace('bg-', '#').replace('500', '600').replace('600', '700')} />
           </div>
         )}
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${isIEDept || isCostingOrPlanning ? 'xl:grid-cols-9' : 'xl:grid-cols-8'} p-6 gap-4 bg-muted/30`}>
         <KPICard title="Target" value={isIEDept || isCostingOrPlanning ? '24' : summary.totalTarget} sub={isIEDept || isCostingOrPlanning ? 'Tasks/Day' : "Shift Goal"} icon={Target} color="bg-slate-500" onClick={() => onCardClick('targets', dept)} />
         <KPICard title={isIEDept || isCostingOrPlanning ? 'Audit' : "Output"} value={isIEDept || isCostingOrPlanning ? '18/24' : summary.totalActual} sub={isIEDept || isCostingOrPlanning ? 'Verification' : "Actual PCS"} icon={isIEDept || isCostingOrPlanning ? ClipboardList : CheckCircle} color={colorClass} onClick={() => onCardClick('production', dept)} />
         <KPICard title={isIEDept || isCostingOrPlanning ? 'Optimization' : "Efficiency"} value={isIEDept || isCostingOrPlanning ? '92%' : `${summary.efficiency.toFixed(1)}%`} sub={isIEDept || isCostingOrPlanning ? 'Layout Savings' : "Shift Avg"} icon={TrendingUp} color="bg-indigo-600" onClick={() => onCardClick('efficiency', dept)} />
         <KPICard title={isIEDept || isCostingOrPlanning ? 'Data Integrity' : "Quality"} value={isIEDept || isCostingOrPlanning ? '99.2%' : `${summary.dhu.toFixed(2)}%`} sub={isIEDept || isCostingOrPlanning ? 'Error Check' : "DHU Rate"} icon={ShieldAlert} color="bg-rose-600" onClick={() => onCardClick('quality', dept)} />
         <KPICard title={isIEDept || isCostingOrPlanning ? 'Bottlenecks' : "NPT"} value={isIEDept || isCostingOrPlanning ? '04' : `${totalNptMinutes}m`} sub={isIEDept || isCostingOrPlanning ? 'Live Issues' : "Loss Time"} icon={isIEDept || isCostingOrPlanning ? AlertTriangle : Timer} color="bg-amber-600" onClick={() => onCardClick('npt', dept)} />
         <KPICard title="5S Score" value={`${summary.fiveS || '0'}%`} sub="Audit Compliance" icon={Sparkles} color="bg-purple-600" onClick={() => onCardClick('fives', dept)} />
         <KPICard title="Manpower" value={`${summary.presentMP}/${summary.totalMP || '?'}`} sub={`${summary.totalMP ? ((summary.presentMP/summary.totalMP)*100).toFixed(1) : 0}% Presence`} icon={Users} color="bg-teal-600" onClick={() => onCardClick('attendance', dept)} />
         <KPICard title={isIEDept || isCostingOrPlanning ? 'Accuracy' : "Machines"} value={isIEDept || isCostingOrPlanning ? '98.5%' : `${summary.workingMc}/${summary.totalMc || summary.totalMP || '?'}`} sub={isIEDept || isCostingOrPlanning ? 'Method Standards' : "Operational Ratio"} icon={isIEDept || isCostingOrPlanning ? BarChart3 : Activity} color="bg-slate-700" onClick={() => onCardClick('machinery', dept)} />
         {(isIEDept || isCostingOrPlanning) && (
           <KPICard title={`${dept} Perform`} value="12" sub="Optimized Tasks" icon={LineChart} color="bg-indigo-900" onClick={() => navigate(`/${dept.toLowerCase()}/ie-activity`)} />
         )}
      </div>

      {!isCostingOrPlanning && (
        <div className="bg-card px-8 py-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {bestLine && (
                    <div className="flex items-center gap-3 border border-emerald-500/20 px-4 py-2 rounded-2xl animate-pulse bg-emerald-500/10">
                        <Award size={20} className="text-emerald-600" />
                        <div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase leading-none">Best Performer</p>
                            <p className="text-sm font-black text-emerald-600">{bestLine.lineId} ({bestLine.efficiency.toFixed(1)}%)</p>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Info size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Detailed Block/Line Analytics Available</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowLineDetail(!showLineDetail)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg transition-all active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {showLineDetail ? <Minus size={14}/> : <Plus size={14}/>}
                {showLineDetail ? 'Hide' : 'Expand'} Line Performance Board
              </button>
          </div>

          {showLineDetail && (
              <div className="mt-8 overflow-hidden rounded-3xl border border-border shadow-inner animate-in slide-in-from-top-4 duration-500">
                  <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-primary text-primary-foreground">
                              <tr className="text-[9px] font-black uppercase tracking-widest">
                                  <th className="px-6 py-4">Line/Block</th>
                                  <th className="px-4 py-4 text-center border-l border-primary-foreground/10">Target vs Achieve</th>
                                  <th className="px-4 py-4 text-center border-l border-primary-foreground/10">Efficiency</th>
                                  <th className="px-4 py-4 text-center border-l border-primary-foreground/10">Per Man Prod (PMP)</th>
                                  <th className="px-4 py-4 text-center border-l border-primary-foreground/10">Quality (DHU)</th>
                                  <th className="px-4 py-4 text-center border-l border-primary-foreground/10">Rejects</th>
                                  <th className="px-4 py-4 text-center border-l border-primary-foreground/10">Changeovers</th>
                                  <th className="px-6 py-4 text-right">Trend</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                              {linePerf.length > 0 ? linePerf.map((line, idx) => (
                                  <tr key={idx} className="hover:bg-muted/50 transition-all group">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${line.efficiency >= 90 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                                                  {line.lineId.split(' ')[1]}
                                              </div>
                                              <div>
                                                  <p className="text-xs font-black text-foreground">{line.lineId}</p>
                                                  <p className="text-[8px] text-muted-foreground font-bold uppercase">{line.blockId}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-4 py-4">
                                          <div className="flex flex-col items-center">
                                              <p className="text-xs font-black text-foreground">{line.actual.toLocaleString()} / <span className="text-muted-foreground/50">{line.target.toLocaleString()}</span></p>
                                              <div className="w-20 h-1 rounded-full mt-1.5 overflow-hidden bg-muted">
                                                  <div className={`h-full ${line.actual >= line.target ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${Math.min((line.actual/(line.target || 1))*100, 100)}%` }}></div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-4 py-4 text-center">
                                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${line.efficiency >= 90 ? 'text-emerald-600 bg-emerald-500/10' : line.efficiency >= 75 ? 'text-primary bg-primary/10' : 'text-rose-600 bg-rose-500/10'}`}>
                                              {line.efficiency.toFixed(1)}%
                                          </span>
                                      </td>
                                      <td className="px-4 py-4 text-center font-black text-primary text-xs">
                                          {line.pmp.toFixed(2)} <span className="text-[8px] font-bold text-muted-foreground uppercase">U/M</span>
                                      </td>
                                      <td className="px-4 py-4 text-center">
                                          <div className="flex flex-col items-center">
                                              <span className={`text-[10px] font-black ${line.dhu > 5 ? 'text-rose-600' : 'text-foreground'}`}>{line.dhu.toFixed(2)}%</span>
                                              <p className="text-[8px] text-muted-foreground uppercase font-bold">Standard: 3%</p>
                                          </div>
                                      </td>
                                      <td className="px-4 py-4 text-center">
                                          <span className={`text-xs font-black ${line.rejects > 0 ? 'text-rose-600' : 'text-muted-foreground/30'}`}>{line.rejects}</span>
                                      </td>
                                      <td className="px-4 py-4 text-center">
                                          <div className="flex items-center justify-center gap-1.5">
                                              <RotateCcw size={10} className="text-amber-500" />
                                              <span className="text-xs font-black text-foreground">{line.changeovers}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end gap-1">
                                              {[...Array(5)].map((_, i) => (
                                                  <div key={i} className={`w-1.5 rounded-sm ${i === 4 ? (line.efficiency >= 85 ? 'h-4 bg-emerald-500' : 'h-2 bg-rose-400') : 'h-2 bg-muted'}`}></div>
                                              ))}
                                          </div>
                                      </td>
                                  </tr>
                              )) : (
                                  <tr>
                                      <td colSpan={8} className="py-12 text-center text-muted-foreground italic font-medium">No live performance data for selection.</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
});

const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const navigate = useNavigate();
  const { theme } = useGlobal();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterMode, setFilterMode] = useState<'daily' | 'monthly'>('daily');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.request('/sync/pull').then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const dataService = useMemo(() => {
    if (!data) return null;
    return {
      getDepartmentSummary: (dept: string, filters: any = {}) => {
        const prod = data.production.filter((p: any) => p.department === dept && (filters.date ? p.date === filters.date : filters.month ? p.date.startsWith(filters.month) : true));
        const target = prod.reduce((s: number, r: any) => s + (r.target || 0), 0);
        const actual = prod.reduce((s: number, r: any) => s + (r.actual || 0), 0);
        
        const mp = data.manpower.filter((m: any) => m.department === dept && (filters.date ? m.date === filters.date : true));
        const present = mp.reduce((s: number, m: any) => s + m.presentOp + m.presentIr + m.presentHp, 0);
        
        // Simplified for now, as we don't have config
        const totalHC = 100; 

        const defects = data.npt.filter((d: any) => d.department === dept && (filters.date ? d.date === filters.date : true));
        const totalDefects = defects.reduce((s: number, d: any) => s + (d.count || 0), 0);

        return { 
          efficiency: target > 0 ? (actual / target) * 100 : 0, 
          totalActual: actual, 
          totalTarget: target, 
          dhu: actual > 0 ? (totalDefects / actual) * 100 : 0, 
          fiveS: 0, 
          presentMP: present, 
          totalMP: totalHC, 
          workingMc: 10, 
          totalMc: 10 
        };
      },
      getLinePerformance: (dept: string, date: string) => {
        // Simplified for now
        return [];
      },
      getNPT: (dept?: string) => {
        return data.npt.filter((n: any) => dept ? n.department === dept : true);
      }
    };
  }, [data]);

  const departments: { name: DepartmentType; icon: any; color: string }[] = useMemo(() => [
    { name: 'IE', icon: Cpu, color: 'bg-indigo-600' },
    { name: 'Sample', icon: Layout, color: 'bg-pink-500' },
    { name: 'Cutting', icon: Scissors, color: 'bg-orange-500' },
    { name: 'Sewing', icon: Shirt, color: 'bg-blue-600' },
    { name: 'Washing', icon: Droplets, color: 'bg-cyan-500' },
    { name: 'Finishing', icon: Sparkle, color: 'bg-emerald-500' },
    { name: 'Costing', icon: DollarSign, color: 'bg-rose-500' },
    { name: 'Planning', icon: Calendar, color: 'bg-indigo-700' },
    { name: 'Shipment', icon: Truck, color: 'bg-slate-700' }
  ], []);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setFilterMode('daily');
  }, []);

  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(month);
    setFilterMode('monthly');
  }, []);

  const handleCardClick = useCallback((type: string, dept: string) => {
    navigate(`/breakdown/${type}?dept=${dept}&date=${selectedDate}`);
  }, [navigate, selectedDate]);

  return (
    <div className="space-y-12 pb-20 max-w-[1750px] mx-auto">
      {/* Dynamic Header Filter */}
      <div className="sticky top-0 z-30 backdrop-blur-md py-4 -mx-4 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b shadow-sm mb-4 bg-background/90 border-border">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 text-foreground">
            <Activity className="text-primary" size={20} /> SDL Master Console
          </h1>
          <p className="text-[9px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Enterprise Visualization Matrix</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
           <div className={`p-1 rounded-2xl border flex items-center shadow-sm transition-all ${filterMode === 'daily' ? 'border-primary ring-2 ring-primary/10' : 'border-border bg-card'}`}>
              <div className="px-2 sm:px-3 border-r flex items-center gap-2 border-border">
                 <Calendar size={12} className="text-primary" />
                 <input 
                    type="date" 
                    className="text-[10px] sm:text-xs font-black outline-none border-none cursor-pointer bg-transparent text-foreground" 
                    value={selectedDate} 
                    onChange={e => handleDateChange(e.target.value)}
                 />
              </div>
           </div>

           <div className={`p-1 rounded-2xl border flex items-center shadow-sm transition-all ${filterMode === 'monthly' ? 'border-indigo-400 ring-2 ring-indigo-500/10' : 'border-border bg-card'}`}>
              <div className="px-2 sm:px-3 flex items-center gap-2">
                 <Filter size={12} className="text-indigo-600" />
                 <input 
                    type="month" 
                    className="text-[10px] sm:text-xs font-black outline-none border-none cursor-pointer bg-transparent text-foreground" 
                    value={selectedMonth} 
                    onChange={e => handleMonthChange(e.target.value)}
                 />
              </div>
           </div>
           
           <div className="bg-primary text-primary-foreground px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/30">
              <Clock size={12} /> Live: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </div>
        </div>
      </div>

      {/* REFINED MONTHLY PRODUCTION DASHBOARD */}
      <MonthlyProductionDashboard selectedDate={selectedDate} selectedMonth={selectedMonth} theme={theme} dataService={dataService} />
      
      {/* Analytics Charts */}
      <AnalyticsCharts dataService={dataService} />

      {/* Departmental Sections */}
      <div className="space-y-16">
         {departments.map(dept => (
           <DepartmentSection 
             key={dept.name} 
             dept={dept.name} 
             icon={dept.icon} 
             colorClass={dept.color}
             selectedDate={selectedDate}
             selectedMonth={selectedMonth}
             filterMode={filterMode}
             onCardClick={handleCardClick}
             theme={theme}
             dataService={dataService}
           />
         ))}
      </div>
    </div>
  );
};

export default Dashboard;