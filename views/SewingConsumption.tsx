import React from 'react';
import ThreadConsumptionTab from '../components/ThreadConsumptionTab';

const SewingConsumption: React.FC<{ department?: string }> = ({ department }) => {
  return (
    <div className="space-y-6 pb-20 max-w-[1900px] mx-auto animate-in fade-in duration-700">
      <div className="px-4">
        <ThreadConsumptionTab />
      </div>
    </div>
  );
};

export default SewingConsumption;
