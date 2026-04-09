import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileBarChart, Calendar, TrendingUp, Box, Users, 
  LayoutList, Clock, ChevronRight, Gauge, Timer,
  ShieldAlert, Target, ArrowLeft
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { DepartmentType, AppUser } from '../types';

interface SectionReportProps {
  department: DepartmentType;
  currentUser: AppUser;
}

const KPICard = ({ title, sub, icon: Icon, color, value, trend, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-white p-5 rounded-[2rem] border-2 border-slate-100 shadow-sm cursor-pointer transition-all flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden group hover:border-blue-500 hover:shadow-xl hover:scale-[1.02]"
  >
    <div className="absolute top-0 right-0 p-3">
      {trend && (
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    
    <div>
      <div className={`p-2.5 rounded-xl ${color} text-white w-fit mb-4 shadow-lg group-hover:rotate-3 transition-transform`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{sub}</p>
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-tight">{title}</h3>
      </div>
    </div>

    <div className="mt-4 flex items-end justify-between">
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <div className="p-1.5 rounded-lg bg-slate-50 text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-colors">
        <ChevronRight size={14} />
      </div>
    </div>
  </div>
);

const SectionReport: React.FC<SectionReportProps> = ({ department, currentUser }) => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const deptPath = department.toLowerCase();

  const summaryMetrics = useMemo(() => {
    const prod = mockDb.getProduction(department).filter(p => p.date === startDate);
    const target = prod.reduce((s, r) => s + (r.target || 0), 0);
    const actual = prod.reduce((s, r) => s + (r.actual || 0), 0);
    
    const mp = mockDb.getManpower(department).filter(m => m.date === startDate);
    const present = mp.reduce((s, m) => s + m.presentOp + m.presentIr + m.presentHp, 0);
    const totalHC = mp.reduce((s, m) => s + m.headCount + m.headCountExtra, 0);

    const defects = mockDb.getDefects(department).filter(d => d.date === startDate && !d.isReject);
    const totalDefects = defects.reduce((s, d) => s + d.count, 0);

    return { 
      actual,
      efficiency: target > 0 ? (actual / target) * 100 : 0,
      presenceRate: totalHC > 0 ? (present / totalHC) * 100 : 94,
      dhu: actual > 0 ? (totalDefects / actual) * 100 : 0
    };
  }, [department, startDate]);

  return (
    <div className="space-y-10 pb-20 max-w-[1700px] mx-auto animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
            <FileBarChart size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">{department} Operations Hub</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Calendar size={18} className="text-slate-400 ml-2" />
          <input type="date" className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 p-0" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
      </div>

      {/* 8 Primary KPI Cards Hub */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6 px-2">
         <KPICard title="Section Plan" sub="Milestone Tracker" icon={LayoutList} color="bg-indigo-600" value="8 Active" onClick={() => navigate(`/${deptPath}/planning`)} />
         <KPICard title="Daily Target" sub="Production Board" icon={Target} color="bg-slate-900" value="Report" onClick={() => navigate(`/${deptPath}/report/daily-target`)} />
         <KPICard title="Hourly Monitoring" sub="Production Variance" icon={Clock} color="bg-blue-500" value="Live" onClick={() => navigate(`/${deptPath}/report/efficiency`)} />
         <KPICard title="WIP Analysis" sub="Inventory Flow" icon={Box} color="bg-blue-600" value="Report" trend={4.2} onClick={() => navigate(`/${deptPath}/report/wip`)} />
         <KPICard title="Efficiency" sub="Productivity Rating" icon={TrendingUp} color="bg-emerald-600" value={`${summaryMetrics.efficiency.toFixed(1)}%`} trend={-1.5} onClick={() => navigate(`/${deptPath}/report/efficiency`)} />
         <KPICard title="Loss Time Report" sub="NPT Diagnostics" icon={Timer} color="bg-orange-600" value="0m" onClick={() => navigate(`/${deptPath}/input/npt`)} />
         <KPICard title="Quality Status" sub="DHU & Rejection Rate" icon={ShieldAlert} color="bg-rose-600" value={`${summaryMetrics.dhu.toFixed(2)}%`} onClick={() => navigate(`/${deptPath}/report/quality`)} />
         <KPICard title="Manpower" sub="Attendance & Allocation" icon={Users} color="bg-teal-600" value={`${summaryMetrics.presenceRate.toFixed(1)}%`} onClick={() => navigate(`/${deptPath}/report/manpower`)} />
      </div>
    </div>
  );
};

export default SectionReport;