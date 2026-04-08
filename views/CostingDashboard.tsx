import React from 'react';
import SewingCostingDashboard from '../components/SewingCostingDashboard';

const CostingDashboard: React.FC = () => {
  return (
    <div className="space-y-6 pb-20 max-w-[1900px] mx-auto animate-in fade-in duration-700">
      <div className="px-4">
        <SewingCostingDashboard />
      </div>
    </div>
  );
};

export default CostingDashboard;
