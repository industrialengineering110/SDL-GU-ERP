import React, { useMemo, useState } from 'react';
import { 
  Droplets, Activity, TrendingUp, FlaskConical, Zap, Layers, DollarSign, Calculator
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { mockDb } from '../services/mockDb';

const COLORS = ['#06b6d4', '#f59e0b', '#6366f1', '#10b981', '#ef4444'];

const WashCostingDashboard: React.FC = () => {
  const washRecords = mockDb.getWashCostingRecords();
  const [viewMode, setViewMode] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const filteredData = useMemo(() => {
    const now = new Date();
    return washRecords.filter(r => {
      const date = new Date(r.date);
      if (viewMode === 'MONTHLY') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else {
        return date.getFullYear() === now.getFullYear();
      }
    });
  }, [washRecords, viewMode]);

  const stats = useMemo(() => {
    const totalCost = filteredData.reduce((sum, r) => sum + r.totalCost, 0);
    const avgCostPerGarment = filteredData.length > 0 
      ? filteredData.reduce((sum, r) => sum + (r.totalCost / (r.orderQty || 1)), 0) / filteredData.length 
      : 0;
    
    let totalChem = 0;
    let totalUtil = 0;
    let totalLabor = 0;
    let totalTime = 0;

    filteredData.forEach(r => {
      r.processes.forEach((p: any) => {
        totalChem += p.chemicals.reduce((s: number, c: any) => s + (c.dosage * c.costPerUnit), 0);
        totalUtil += p.utilityCost || 0;
        totalLabor += p.laborCost || 0;
        totalTime += p.timeMinutes || 0;
      });
    });

    return {
      totalCost,
      avgCostPerGarment,
      totalChem,
      totalUtil,
      totalLabor,
      totalTime
    };
  }, [filteredData]);

  const costBreakdownData = [
    { name: 'Chemicals', value: stats.totalChem },
    { name: 'Utilities', value: stats.totalUtil },
    { name: 'Labor', value: stats.totalLabor }
  ];

  const processTypeData = useMemo(() => {
    let wetCount = 0;
    let dryCount = 0;
    filteredData.forEach(r => {
      r.processes.forEach((p: any) => {
        if (p.type === 'WET') wetCount++;
        else dryCount++;
      });
    });
    return [
      { name: 'Wet Process', value: wetCount },
      { name: 'Dry Process', value: dryCount }
    ];
  }, [filteredData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic">Wash Costing Dashboard</h2>
          <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Process Efficiency & Cost Analysis</p>
        </div>
        <div className="bg-slate-100 p-1 rounded-xl flex">
          <button 
            onClick={() => setViewMode('MONTHLY')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'MONTHLY' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setViewMode('YEARLY')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'YEARLY' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="Total Cost" value={`$${stats.totalCost.toLocaleString()}`} icon={DollarSign} color="bg-cyan-500" />
        <StatCard title="Avg Cost/Gmt" value={`$${stats.avgCostPerGarment.toFixed(2)}`} icon={Calculator} color="bg-emerald-500" />
        <StatCard title="Chem Cost" value={`$${stats.totalChem.toFixed(2)}`} icon={FlaskConical} color="bg-blue-500" />
        <StatCard title="Utility Cost" value={`$${stats.totalUtil.toFixed(2)}`} icon={Zap} color="bg-amber-500" />
        <StatCard title="Labor Cost" value={`$${stats.totalLabor.toFixed(2)}`} icon={Layers} color="bg-indigo-500" />
        <StatCard title="Total Time" value={`${stats.totalTime}m`} icon={Activity} color="bg-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-900 uppercase italic">Cost Component Breakdown</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-900 uppercase italic">Wet vs Dry Process Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processTypeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: any, color: string }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
    <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{title}</p>
    </div>
  </div>
);

export default WashCostingDashboard;
