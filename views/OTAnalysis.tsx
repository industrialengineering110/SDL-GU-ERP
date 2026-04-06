import React from 'react';
import { useParams } from 'react-router-dom';

const OTAnalysis: React.FC = () => {
  const { tab } = useParams<{ tab: string }>();
  const currentTab = tab || 'summary';

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">OT Analysis - {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}</h1>
      <p>This is the {currentTab} view of the OT Analysis dashboard.</p>
    </div>
  );
};

export default OTAnalysis;
