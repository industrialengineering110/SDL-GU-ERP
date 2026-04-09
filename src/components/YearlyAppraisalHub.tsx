import React from 'react';

export const YearlyAppraisalHub: React.FC<{ config: any; department: string }> = ({ config, department }) => {
  return (
    <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
      <h2 className="text-xl font-black uppercase italic text-slate-900 mb-4">Yearly Appraisal Hub - {department}</h2>
      <p className="text-slate-500 font-bold">Appraisal content coming soon...</p>
    </div>
  );
};
