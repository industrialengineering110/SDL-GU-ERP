import React, { useMemo } from 'react';
import { 
  TrendingUp, Users, Package, Scissors, 
  BarChart3, PieChart as PieChartIcon, Activity,
  Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { mockDb } from '../services/mockDb';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const CostingDashboard: React.FC = () => {
  const threadConsumptions = mockDb.getThreadConsumptions();
  const sewingCostings = mockDb.getSewingCostingList();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const runningMonthConsumptions = (threadConsumptions || []).filter(c => {
      if (!c.createdAt) return false;
      const date = new Date(c.createdAt);
      return !isNaN(date.getTime()) && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const totalFabricConsumption = (threadConsumptions || []).reduce((sum, c) => sum + (Number(c.totalFabricConsumption) || 0), 0);
    const totalThreadConsumption = (threadConsumptions || []).reduce((sum, c) => sum + (Number(c.totalThreadConsumption) || 0), 0);

    return {
      runningMonthCount: runningMonthConsumptions.length,
      totalCount: (threadConsumptions || []).length,
      totalFabric: totalFabricConsumption.toFixed(2),
      totalThread: totalThreadConsumption.toFixed(2)
    };
  }, [threadConsumptions]);

  const monthlyTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ name: m, count: 0 }));
    
    (threadConsumptions || []).forEach(c => {
      if (c.createdAt) {
        const date = new Date(c.createdAt);
        if (!isNaN(date.getTime())) {
          const month = date.getMonth();
          if (month >= 0 && month < 12) {
            data[month].count++;
          }
        }
      }
    });
    
    return data;
  }, [threadConsumptions]);

  const buyerWiseData = useMemo(() => {
    const buyers: Record<string, number> = {};
    (threadConsumptions || []).forEach(c => {
      const b = c.buyer || 'Unknown';
      buyers[b] = (buyers[b] || 0) + 1;
    });
    
    return Object.entries(buyers).map(([name, value]) => ({ name, value }));
  }, [threadConsumptions]);

  const styleComparisonData = useMemo(() => {
    // Compare Consumption vs Booking (using marketingOrderQty as booking)
    return (threadConsumptions || []).slice(0, 10).map(c => {
      const costing = (sewingCostings || []).find(sc => sc.styleNumber === c.styleNumber);
      return {
        style: c.styleNumber || 'Unknown',
        consumption: Number(c.totalThreadConsumption) || 0,
        booking: Number(costing?.marketingOrderQty) || 0
      };
    });
  }, [threadConsumptions, sewingCostings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Calendar size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Running Month</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">{stats.runningMonthCount}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Consumptions</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Activity size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total History</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">{stats.totalCount}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Records</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <Package size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fabric Usage</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">{stats.totalFabric}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total KG</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Scissors size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thread Usage</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">{stats.totalThread}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Cones</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trend */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase italic">Monthly Consumption Trend</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Buyer Wise Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
              <PieChartIcon size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase italic">Buyer-wise Distribution</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={buyerWiseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {buyerWiseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consumption vs Booking */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase italic">Consumption vs Booking Comparison (Style-wise)</h3>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={styleComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="style" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="consumption" name="Thread Consumption" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="booking" name="Marketing Booking" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostingDashboard;
