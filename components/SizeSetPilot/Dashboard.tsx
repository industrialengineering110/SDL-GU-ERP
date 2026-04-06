import React from 'react';
import { SizeSetPilotRequest, SizeSetPilotStageName } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, CheckCircle2, Clock, AlertCircle, LayoutDashboard } from 'lucide-react';

interface Props {
  requests: SizeSetPilotRequest[];
}

const Dashboard: React.FC<Props> = ({ requests }) => {
  const stats = {
    total: requests.length,
    completed: requests.filter(r => r.status === 'Completed').length,
    active: requests.filter(r => r.status === 'Active').length,
    sizeSet: requests.filter(r => r.requestType === 'Size Set').length,
    pilot: requests.filter(r => r.requestType === 'Pilot').length,
  };

  const calculateAverageTime = (stage: SizeSetPilotStageName) => {
    const completedRequests = requests.filter(r => r.stages[stage]?.endTime && r.stages[stage]?.startTime);
    if (completedRequests.length === 0) return 0;
    
    const totalDuration = completedRequests.reduce((acc, r) => {
      const start = new Date(r.stages[stage].startTime).getTime();
      const end = new Date(r.stages[stage].endTime).getTime();
      return acc + (end - start);
    }, 0);
    
    return (totalDuration / completedRequests.length) / (1000 * 60 * 60); // Hours
  };

  const stageAverages = [
    { name: 'Planner', value: calculateAverageTime('Planner Request') },
    { name: 'Cutting', value: calculateAverageTime('Cutting Concern') },
    { name: 'Sewing', value: calculateAverageTime('Sewing / Sample Line Concern') },
    { name: 'Quality', value: calculateAverageTime('Quality Team') },
    { name: 'Wash', value: calculateAverageTime('Wash Sample Concern') },
  ];

  const chartData = [
    { name: 'Size Set', value: stats.sizeSet, color: '#3b82f6' },
    { name: 'Pilot', value: stats.pilot, color: '#a855f7' },
  ];

  // Mock trend data for visual appeal
  const trendData = [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 7 },
    { day: 'Wed', count: 5 },
    { day: 'Thu', count: 8 },
    { day: 'Fri', count: 12 },
    { day: 'Sat', count: 9 },
    { day: 'Sun', count: 15 },
  ];

  const StatCard = ({ label, value, icon: Icon, color, bgColor }: { label: string, value: number | string, icon: any, color: string, bgColor: string }) => (
    <div className="bg-card p-6 rounded-[2rem] border border-border shadow-xl shadow-black/5 flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <h3 className="text-4xl font-black tracking-tighter">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${bgColor} ${color} shadow-lg shadow-current/10`}>
        <Icon size={28} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Requests" value={stats.total} icon={LayoutDashboard} color="text-blue-500" bgColor="bg-blue-500/10" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="text-emerald-500" bgColor="bg-emerald-500/10" />
        <StatCard label="Active Styles" value={stats.active} icon={Clock} color="text-amber-500" bgColor="bg-amber-500/10" />
        <StatCard label="Avg Time (Hrs)" value={calculateAverageTime('Cutting Concern').toFixed(1)} icon={AlertCircle} color="text-rose-500" bgColor="bg-rose-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-2xl shadow-black/5">
          <div className="mb-8">
            <h3 className="text-xl font-black uppercase tracking-tight">Average Stage Time (Hrs)</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Time spent per department</p>
          </div>
          <div className="h-[250px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageAverages} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={50} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-2xl shadow-black/5">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Distribution</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Size Set vs Pilot Comparison</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Size Set</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Pilot</span>
              </div>
            </div>
          </div>
          <div className="h-[250px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={80}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
