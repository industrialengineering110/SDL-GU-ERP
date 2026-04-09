import React, { useMemo } from 'react';
import { SizeSetPilotRequest } from '../../types';
import { EmptyState } from './shared';

const Dashboard: React.FC<{ requests: SizeSetPilotRequest[] }> = ({ requests }) => {
  const summary = useMemo(() => ({
    total: requests.length,
    active: requests.filter(r => r.status === 'Active').length,
    completed: requests.filter(r => r.status === 'Completed').length,
    delayed: requests.filter(r => r.status === 'Delayed').length,
  }), [requests]);

  const cards = [
    ['Total Requests', summary.total],
    ['Active', summary.active],
    ['Completed', summary.completed],
    ['Delayed', summary.delayed],
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-3xl font-black mt-3">{value}</p>
          </div>
        ))}
      </div>
      <EmptyState title="Size Set & Pilot Dashboard" subtitle="Track all requests and stage progress from one place." />
    </div>
  );
};

export default Dashboard;
