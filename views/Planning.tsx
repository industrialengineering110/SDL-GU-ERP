import React, { useState, useEffect } from 'react';
import { ListTodo, ArrowLeft, CheckSquare, Scissors, Droplets, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobal } from '../App';
import { PlanningDashboard, OrderPool, PreProductionTracker, LineLoading, CoordinationWall, PlanningOwnership } from '../views/PlanningHub';
import { RevisionHistory } from './PlanningHub/RevisionHistory';
import { AppUser } from '../types';

type PlanningTab = 'DASHBOARD' | 'ORDER_POOL' | 'PRE_PRODUCTION' | 'OWNERSHIP' | 'LINE_LOADING' | 'COORDINATION_WALL' | 'REVISION_HISTORY';

const Planning: React.FC<{ department?: string, currentUser?: AppUser }> = ({ department, currentUser }) => {
  const navigate = useNavigate();
  const { theme } = useGlobal();
  const [activeTab, setActiveTab] = useState<PlanningTab>('DASHBOARD');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const tabs: { id: PlanningTab; label: string }[] = [
    { id: 'DASHBOARD', label: 'Dashboard' },
    { id: 'ORDER_POOL', label: 'Order Pool' },
    { id: 'PRE_PRODUCTION', label: 'Pre-Production' },
    { id: 'LINE_LOADING', label: 'Line Loading' },
    { id: 'COORDINATION_WALL', label: 'Coordination Wall' },
    { id: 'REVISION_HISTORY', label: 'Revision History' },
    { id: 'OWNERSHIP', label: 'Ownership' },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-[1900px] mx-auto animate-in fade-in duration-700">
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 px-4 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className={`p-2.5 rounded-xl border transition-all shadow-sm hover:shadow-md ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-blue-400 hover:border-blue-400' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-black tracking-tight uppercase italic leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Planning Hub {department ? `- ${department}` : ''}
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Central Planning Hub</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  : theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {activeTab === 'DASHBOARD' && <PlanningDashboard />}
        {activeTab === 'ORDER_POOL' && <OrderPool selectedMonth={selectedMonth} />}
        {activeTab === 'PRE_PRODUCTION' && <PreProductionTracker selectedMonth={selectedMonth} />}
        {activeTab === 'LINE_LOADING' && <LineLoading selectedMonth={selectedMonth} />}
        {activeTab === 'COORDINATION_WALL' && <CoordinationWall />}
        {activeTab === 'REVISION_HISTORY' && <RevisionHistory />}
        {activeTab === 'OWNERSHIP' && <PlanningOwnership />}
      </div>
    </div>
  );
};

export default Planning;
