import React from 'react';

const HubDashboard: React.FC<{ dept: string }> = ({ dept }) => {
  return (
    <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
      <h2 className="text-xl font-black uppercase italic text-slate-900 mb-4">{dept} Hub Dashboard</h2>
      <p className="text-slate-500 font-bold">Dashboard content coming soon...</p>
    </div>
  );
};

export default HubDashboard;
