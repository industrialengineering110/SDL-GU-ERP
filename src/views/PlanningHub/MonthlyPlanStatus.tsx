import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Layers, 
  RefreshCcw, 
  Clock, 
  Split, 
  BarChart3,
  Download,
  Filter
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';

export const MonthlyPlanStatus: React.FC<{ selectedMonth: number }> = ({ selectedMonth }) => {
  const [stats, setStats] = useState({
    workingDays: 26,
    totalProduction: 125000,
    totalStyles: 42,
    changeovers: 12,
    effectedDays: 4,
    totalSplits: 8
  });

  useEffect(() => {
    // In a real app, we'd fetch this from the DB based on the current month
    // For now, we'll vary the mock data slightly based on the month
    const factor = (selectedMonth % 3) + 1;
    setStats({
      workingDays: 24 + (selectedMonth % 3),
      totalProduction: 100000 + (selectedMonth * 5000),
      totalStyles: 30 + (selectedMonth * 2),
      changeovers: 10 + (selectedMonth % 5),
      effectedDays: 2 + (selectedMonth % 4),
      totalSplits: 5 + (selectedMonth % 6)
    });
  }, [selectedMonth]);

  const metrics = [
    { label: 'Working Days', value: stats.workingDays, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Production', value: stats.totalProduction.toLocaleString(), icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Styles', value: stats.totalStyles, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Changeovers', value: stats.changeovers, icon: RefreshCcw, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Effected Days', value: stats.effectedDays, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Total Splits', value: stats.totalSplits, icon: Split, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">Monthly Plan Status</h2>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Monthly production summary and efficiency metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map(metric => (
          <div key={metric.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className={`p-4 rounded-xl ${metric.bg} ${metric.color}`}>
              <metric.icon size={28} />
            </div>
            <div>
              <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{metric.label}</h3>
              <p className="text-2xl font-black">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-tight mb-6">Production Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {[65, 45, 75, 55, 85, 95, 70, 60, 80, 90, 100, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600 cursor-pointer" 
                  style={{ height: `${h}%` }}
                ></div>
                <span className="text-[8px] font-black text-slate-400">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-tight mb-6">Efficiency Breakdown</h3>
          <div className="space-y-6">
            {[
              { label: 'Line 01', value: 78, color: 'bg-emerald-500' },
              { label: 'Line 02', value: 65, color: 'bg-amber-500' },
              { label: 'Line 03', value: 82, color: 'bg-emerald-500' },
              { label: 'Line 04', value: 54, color: 'bg-rose-500' },
              { label: 'Line 05', value: 71, color: 'bg-emerald-500' },
            ].map(line => (
              <div key={line.label} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span>{line.label}</span>
                  <span>{line.value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${line.color}`} style={{ width: `${line.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
