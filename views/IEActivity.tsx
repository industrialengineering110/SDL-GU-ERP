import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Timer, TrendingUp, Target, Activity, Users, 
  BarChart3, PieChart, Info, ShieldCheck, CheckCircle2, AlertTriangle, 
  ArrowRight, Search, Filter, History, Calendar, Layout as LayoutIcon, 
  Hammer, FileText, UsersRound, Settings, Gauge, Rocket, ListChecks, 
  Clock, Presentation, Zap, ChevronRight, Scale, FileBarChart, Layers, Database, ArrowLeft, FlaskConical
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';
import { mockDb } from '../services/mockDb';
import { DepartmentType, AppUser } from '../types';

const ActivityCard = ({ title, sub, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden flex items-center gap-4"
  >
    <div className={`p-3 rounded-xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
      <Icon size={20} />
    </div>
    
    <div className="min-w-0 flex-1">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{title}</h3>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{sub}</p>
    </div>

    <div className="text-slate-200 group-hover:text-indigo-600 transition-colors">
      <ChevronRight size={16} />
    </div>
  </div>
);

const IEActivity: React.FC<{ department: DepartmentType; currentUser: AppUser }> = ({ department, currentUser }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'STYLE' | 'GENERAL' | 'KPI' | 'WASHING'>('GENERAL');
  
  const activityTrend = [
    { name: 'Mon', studies: 4, audits: 2, optimization: 85 },
    { name: 'Tue', studies: 6, audits: 4, optimization: 88 },
    { name: 'Wed', studies: 5, audits: 3, optimization: 92 },
    { name: 'Thu', studies: 7, audits: 5, optimization: 90 },
    { name: 'Fri', studies: 3, audits: 2, optimization: 87 },
    { name: 'Sat', studies: 5, audits: 4, optimization: 91 },
  ];

  const departmentPath = department.toLowerCase();

  return (
    <div className="space-y-10 pb-20 max-w-[1700px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/hub`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
            <Presentation size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">{department} IE Activity Board</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center shadow-inner">
            <button 
              onClick={() => setActiveTab('GENERAL')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'GENERAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              General Activity
            </button>
            <button 
              onClick={() => setActiveTab('STYLE')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'STYLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Style wise Activity
            </button>
            <button 
              onClick={() => setActiveTab('KPI')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'KPI' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              IE team KPI
            </button>
            <button 
              onClick={() => setActiveTab('WASHING')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'WASHING' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Washing
            </button>
          </div>
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Calendar size={18} className="text-slate-400 ml-2" />
            <input 
                type="date" 
                className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 p-0 cursor-pointer"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Functional Grid */}
      {activeTab === 'GENERAL' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActivityCard 
              title="Target" 
              sub="Capacity & Output Forecasting" 
              icon={Target} 
              color="bg-slate-900" 
              onClick={() => navigate(`/${departmentPath}/config/targets`)}
            />
            {/* Removed Layout Bank from General Activity as requested */}
            <ActivityCard 
              title="Efficiency" 
              sub="Real-time Efficiency Monitoring" 
              icon={Activity} 
              color="bg-emerald-600" 
              onClick={() => navigate(`/${departmentPath}/report/efficiency`)}
            />
            <ActivityCard 
              title="Skill Matrix" 
              sub="Workforce Capability & Efficiency Matrix" 
              icon={Layers} 
              color="bg-teal-600" 
              onClick={() => navigate(`/${departmentPath}/input/skills`)}
            />
            <ActivityCard 
              title="Development" 
              sub="Process Improvement & Multiskilling" 
              icon={Rocket} 
              color="bg-purple-600" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Activity size={18} className="text-indigo-600" /> Operational Density</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1 rounded-lg">Live Analytics</span>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={activityTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar yAxisId="left" dataKey="studies" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Work Studies" />
                    <Bar yAxisId="left" dataKey="audits" fill="#10b981" radius={[4, 4, 0, 0]} name="Process Audits" />
                    <Line yAxisId="right" type="monotone" dataKey="optimization" stroke="#f59e0b" strokeWidth={3} name="Eff %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><BarChart3 size={18} className="text-emerald-600" /> System Integrity Checks</h3>
                <span className="text-[10px] font-black text-rose-500 uppercase bg-rose-50 px-3 py-1 rounded-lg">Target Compliance</span>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'GSD/SAM Accuracy', value: 98, color: 'bg-emerald-500' },
                  { label: 'Capacity Utilization', value: 84, color: 'bg-blue-500' },
                  { label: 'QCO Speed Index', value: 72, color: 'bg-amber-500' },
                  { label: 'Cost Avoidance', value: 18, color: 'bg-indigo-50' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest px-1">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-900">{item.value}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-sm`} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {activeTab === 'STYLE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ActivityCard 
            title="Layout master" 
            sub="Bulletin & Machine Layout Registry" 
            icon={LayoutIcon} 
            color="bg-emerald-600" 
            onClick={() => navigate(`/${departmentPath}/ie/layout-master`)}
          />
          <ActivityCard 
            title="Layout Bank" 
            sub="Centralized Layout Repository" 
            icon={Database} 
            color="bg-slate-900" 
            onClick={() => navigate(`/${departmentPath}/ie/layout-bank`)}
          />
          <ActivityCard 
            title="Perproduction meeting" 
            sub="Technical File (PPM) Verification" 
            icon={UsersRound} 
            color="bg-pink-600" 
          />
          <ActivityCard 
            title="QCO" 
            sub="Quick Change Over (QCO) Diagnostics" 
            icon={Zap} 
            color="bg-amber-500" 
            onClick={() => navigate(`/${departmentPath}/ie/qco-hub`)}
          />
          <ActivityCard 
            title="Capacity" 
            sub="Fleet & Unit Load Calculation" 
            icon={Gauge} 
            color="bg-slate-700" 
          />
          <ActivityCard 
            title="Production Study" 
            sub="Work Study & Time-Motion Analysis" 
            icon={Timer} 
            color="bg-indigo-600" 
            onClick={() => navigate(`/${departmentPath}/study/production`)}
          />
          <ActivityCard 
            title="Style Closing" 
            sub="Post-Order Performance Audit" 
            icon={CheckCircle2} 
            color="bg-rose-600" 
          />
        </div>
      )}

      {activeTab === 'KPI' && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300 italic font-bold">
          KPI metrics are being synchronized...
        </div>
      )}
      {activeTab === 'WASHING' && (
        <div className="space-y-12">
          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight italic text-slate-900">Wet Process</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <ActivityCard title="Recipe" sub="Chemical & Process Recipe" icon={FlaskConical} color="bg-cyan-600" />
              <ActivityCard title="Target" sub="Production Targets" icon={Target} color="bg-slate-900" />
              <ActivityCard title="Efficiency" sub="Efficiency Metrics" icon={Activity} color="bg-emerald-600" />
              <ActivityCard title="Utilization" sub="Machine Utilization" icon={Gauge} color="bg-indigo-600" />
              <ActivityCard title="Skill Matrix" sub="Workforce Capability" icon={UsersRound} color="bg-teal-600" />
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight italic text-slate-900">Dry Process</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <ActivityCard title="SMV Bank" sub="Standard Minute Values" icon={Clock} color="bg-amber-600" />
              <ActivityCard title="Target" sub="Production Targets" icon={Target} color="bg-slate-900" />
              <ActivityCard title="Efficiency" sub="Efficiency Metrics" icon={Activity} color="bg-emerald-600" />
              <ActivityCard title="Utilization" sub="Machine Utilization" icon={Gauge} color="bg-indigo-600" />
              <ActivityCard title="Skill Matrix" sub="Workforce Capability" icon={UsersRound} color="bg-teal-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IEActivity;