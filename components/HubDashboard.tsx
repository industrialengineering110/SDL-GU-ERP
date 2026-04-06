
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Label
} from 'recharts';
import { Users, TrendingUp, Clock, Target } from 'lucide-react';

const HubDashboard: React.FC<{ dept: string }> = ({ dept }) => {
  // Mock data for the dashboard based on the user's image
  const efficiencyData = [
    { name: 'SEP', value: 52.61, target: 75 },
    { name: 'OCT', value: 53.27, target: 75 },
    { name: 'NOV', value: 51.50, target: 75 },
  ];

  const achievementData = [
    { name: 'SEP', value: 91.63 },
    { name: 'OCT', value: 93.84 },
    { name: 'NOV', value: 92.84 },
  ];

  const overtimeData = [
    { name: 'OCT', value: 2.38 },
    { name: 'NOV', value: 2.01 },
  ];

  return (
    <div className="bg-card p-6 rounded-[3rem] border border-border shadow-sm space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Efficiency Chart */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Avg Efficiency %</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: 'var(--chart-text)'}} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ 
                    backgroundColor: 'var(--chart-tooltip-bg)', 
                    borderColor: 'var(--chart-tooltip-border)',
                    color: 'var(--chart-tooltip-text)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {efficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= entry.target ? '#10b981' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around">
            {efficiencyData.map((d, i) => (
              <div key={i} className="text-center">
                <p className={`text-xs font-black ${d.value >= d.target ? 'text-emerald-600' : 'text-muted-foreground'}`}>{d.value}%</p>
                <p className="text-[8px] font-bold text-muted-foreground/50 uppercase">Target {d.target}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Chart */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Avg Achievement %</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={achievementData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: 'var(--chart-text)'}} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ 
                    backgroundColor: 'var(--chart-tooltip-bg)', 
                    borderColor: 'var(--chart-tooltip-border)',
                    color: 'var(--chart-tooltip-text)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {achievementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= 93 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around">
            {achievementData.map((d, i) => (
              <div key={i} className="text-center">
                <p className="text-xs font-black text-foreground">{d.value}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Overtime Chart */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Overtime (Hrs)</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overtimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: 'var(--chart-text)'}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ 
                    backgroundColor: 'var(--chart-tooltip-bg)', 
                    borderColor: 'var(--chart-tooltip-border)',
                    color: 'var(--chart-tooltip-text)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around">
            {overtimeData.map((d, i) => (
              <div key={i} className="text-center">
                <p className="text-xs font-black text-foreground">{d.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row with Stats and Circle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center pt-8 border-t border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">SMV Trend</span>
            <span className="text-xs font-black text-foreground">12.30</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-muted-foreground/30 w-[80%]"></div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Layout Analysis</span>
            <span className="text-xs font-black text-foreground">761 / 805</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-muted-foreground/30 w-[94%]"></div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Users size={20} className="text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground leading-none">3518</p>
              <p className="text-[10px] font-bold text-emerald-500 mt-1 flex items-center justify-center gap-1">
                ▲ 83
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted p-4 rounded-3xl text-center">
            <Target size={16} className="mx-auto mb-2 text-primary" />
            <p className="text-lg font-black text-foreground leading-none">94%</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Quality Score</p>
          </div>
          <div className="bg-muted p-4 rounded-3xl text-center">
            <Clock size={16} className="mx-auto mb-2 text-amber-500" />
            <p className="text-lg font-black text-foreground leading-none">1.2h</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Avg Downtime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubDashboard;
