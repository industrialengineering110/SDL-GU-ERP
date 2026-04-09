import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Droplets, Hammer, Settings, Users, Clock } from 'lucide-react';

const Washing: React.FC = () => {
  const { process } = useParams();
  const [activeTab, setActiveTab] = useState<'Machine' | 'Manpower' | 'Hourly Production'>('Machine');

  const tabs = ['Machine', 'Manpower', 'Hourly Production'] as const;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-black uppercase tracking-tight italic text-foreground">
        {process === 'wet-process' ? 'Wet Process' : 'Dry Process'}
      </h1>

      <div className="flex gap-4 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 text-sm font-bold uppercase tracking-widest transition-colors ${
              activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
        <h2 className="text-lg font-black uppercase tracking-tight mb-4">{activeTab} Details</h2>
        {/* Content for each tab will go here */}
        <p className="text-muted-foreground">Content for {activeTab} in {process === 'wet-process' ? 'Wet Process' : 'Dry Process'} goes here.</p>
      </div>
    </div>
  );
};

export default Washing;
