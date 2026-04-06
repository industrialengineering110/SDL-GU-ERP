import React, { useMemo, useState } from 'react';
import { 
  BarChart3, PieChart as PieChartIcon, Activity,
  Calendar, TrendingUp, Package, Scissors, DollarSign
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { mockDb } from '../services/mockDb';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const SewingCostingDashboard: React.FC = () => {
  const sewingCostings = mockDb.getSewingCostingList();
  const threadConsumptions = mockDb.getThreadConsumptions();
  const [viewMode, setViewMode] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const calculateEfficiency = (prod: number, smv: number) => {
    if (!prod || !smv) return 0;
    const availableMinutes = 67 * 10 * 60; // Standard 10h shift baseline
    const producedMinutes = prod * smv;
    return (producedMinutes / availableMinutes) * 100;
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    return sewingCostings.filter(c => {
      const date = new Date(c.createdAt);
      if (viewMode === 'MONTHLY') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else {
        return date.getFullYear() === now.getFullYear();
      }
    });
  }, [sewingCostings, viewMode]);

  const stats = useMemo(() => {
    const totalSMV = filteredData.reduce((sum, c) => sum + (c.productionSMV || 0), 0);
    const avgSMV = filteredData.length > 0 ? totalSMV / filteredData.length : 0;
    
    const totalEfficiency = filteredData.reduce((sum, c) => sum + calculateEfficiency(c.productionAverageTarget || 0, c.productionSMV || 0), 0);
    const avgEfficiency = filteredData.length > 0 ? totalEfficiency / filteredData.length : 0;

    const totalThread = threadConsumptions.reduce((sum, c) => sum + (c.totalThreadConsumption || 0), 0);
    const totalFabric = threadConsumptions.reduce((sum, c) => sum + (c.totalFabricConsumption || 0), 0);
    const totalBookedFabric = threadConsumptions.reduce((sum, c) => sum + (c.bookedFabricQuantity || 0), 0);
    const totalBookedThread = threadConsumptions.reduce((sum, c) => sum + (c.bookedThreadQuantity || 0), 0);
    const fabricExcess = Math.max(0, totalBookedFabric - totalFabric);
    const threadExcess = Math.max(0, totalBookedThread - totalThread);

    return {
      avgSMV: avgSMV.toFixed(2),
      avgEfficiency: avgEfficiency.toFixed(1),
      totalThread: totalThread.toFixed(2),
      totalFabric: totalFabric.toFixed(2),
      fabricExcess: fabricExcess.toFixed(2),
      threadExcess: threadExcess.toFixed(2)
    };
  }, [filteredData, threadConsumptions]);

  const productWiseData = useMemo(() => {
    const products: Record<string, { smv: number, efficiency: number, count: number }> = {};
    filteredData.forEach(c => {
      const p = c.productCategory || 'Unknown';
      if (!products[p]) products[p] = { smv: 0, efficiency: 0, count: 0 };
      products[p].smv += (c.productionSMV || 0);
      products[p].efficiency += calculateEfficiency(c.productionAverageTarget || 0, c.productionSMV || 0);
      products[p].count += 1;
    });
    
    return Object.entries(products).map(([name, data]) => ({
      name,
      avgSMV: (data.smv / data.count).toFixed(2),
      avgEfficiency: (data.efficiency / data.count).toFixed(1)
    }));
  }, [filteredData]);

  const consumptionComparisonData = useMemo(() => {
    return threadConsumptions.map(c => ({
      style: c.styleNumber,
      bookedFabric: c.bookedFabricQuantity || 0,
      inhouseFabric: c.inhouseFabricQuantity || 0,
      actualFabric: c.totalFabricConsumption || 0,
      bookedThread: c.bookedThreadQuantity || 0,
      inhouseThread: c.inhouseThreadQuantity || 0,
      actualThread: c.totalThreadConsumption || 0,
      fabricExcess: Math.max(0, (c.bookedFabricQuantity || 0) - (c.totalFabricConsumption || 0)),
      threadExcess: Math.max(0, (c.bookedThreadQuantity || 0) - (c.totalThreadConsumption || 0))
    }));
  }, [threadConsumptions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic">Sewing Costing Dashboard</h2>
          <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">KPIs & Consumption Analysis</p>
        </div>
        <div className="bg-slate-100 p-1 rounded-xl flex">
          <button 
            onClick={() => setViewMode('MONTHLY')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'MONTHLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setViewMode('YEARLY')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'YEARLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="Avg SMV" value={stats.avgSMV} icon={Activity} color="bg-blue-500" />
        <StatCard title="Avg Efficiency" value={`${stats.avgEfficiency}%`} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard title="Total Thread" value={stats.totalThread} icon={Scissors} color="bg-purple-500" />
        <StatCard title="Total Fabric" value={stats.totalFabric} icon={Package} color="bg-orange-500" />
        <StatCard title="Fabric Excess" value={stats.fabricExcess} icon={DollarSign} color="bg-rose-500" />
        <StatCard title="Thread Excess" value={stats.threadExcess} icon={DollarSign} color="bg-rose-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-900 uppercase italic">Product-wise Avg SMV</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productWiseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgSMV" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-900 uppercase italic">Product-wise Avg Efficiency</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productWiseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgEfficiency" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Consumption Comparison */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic">Consumption Comparison</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Booked vs Actual Consumption (Fabric & Thread)</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-bold uppercase text-slate-500">In-house</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Actual</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Fabric Consumption (Yards/Meters)</h4>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumptionComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="style" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookedFabric" name="Booked Fabric" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="inhouseFabric" name="In-house Fabric" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actualFabric" name="Actual Fabric" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Thread Consumption (Cones/Meters)</h4>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumptionComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="style" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookedThread" name="Booked Thread" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="inhouseThread" name="In-house Thread" fill="#d946ef" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actualThread" name="Actual Thread" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Excess Analysis Table */}
        <div className="mt-8 overflow-hidden border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Style Number</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Fabric Excess</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Thread Excess</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {consumptionComparisonData.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700 text-sm">{item.style}</td>
                  <td className={`px-6 py-4 font-mono text-sm ${item.fabricExcess > 0 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {item.fabricExcess > 0 ? `+${item.fabricExcess.toFixed(2)}` : '0.00'}
                  </td>
                  <td className={`px-6 py-4 font-mono text-sm ${item.threadExcess > 0 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {item.threadExcess > 0 ? `+${item.threadExcess.toFixed(2)}` : '0.00'}
                  </td>
                  <td className="px-6 py-4">
                    {item.fabricExcess > 0 || item.threadExcess > 0 ? (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-md">Excess Booking</span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase rounded-md">Optimal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: any, color: string }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
    <div className="flex items-center justify-between">
      <div className={`p-3 ${color} text-white rounded-2xl`}>
        <Icon size={24} />
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-black text-slate-900">{value}</h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{title}</p>
    </div>
  </div>
);

export default SewingCostingDashboard;
