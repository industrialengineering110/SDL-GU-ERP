import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Scissors, 
  Activity, 
  ShieldCheck, 
  Droplets, 
  CheckSquare,
  FileText,
  BarChart3
} from 'lucide-react';
import { useGlobal } from '../App';
import Dashboard from '../components/SizeSetPilot/Dashboard';
import PlannerRequest from '../components/SizeSetPilot/PlannerRequest';
import CuttingConcern from '../components/SizeSetPilot/CuttingConcern';
import SewingConcern from '../components/SizeSetPilot/SewingConcern';
import QualityTeam from '../components/SizeSetPilot/QualityTeam';
import WashConcern from '../components/SizeSetPilot/WashConcern';
import FinalInspection from '../components/SizeSetPilot/FinalInspection';
import FullReport from '../components/SizeSetPilot/FullReport';
import FactoryAnalysis from '../components/SizeSetPilot/FactoryAnalysis';
import { SizeSetPilotRequest } from '../types';
import { mockDb } from '../services/mockDb';

const Tab = ({ to, label, icon: Icon, description }: { to: string, label: string, icon: any, description: string }) => (
  <NavLink 
    to={`/size-set-pilot/${to}`} 
    className={({ isActive }) => `
      flex flex-col items-start p-4 rounded-2xl border-2 transition-all min-w-[140px] flex-1
      ${isActive 
        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
        : 'bg-card border-border hover:border-primary/50 hover:bg-muted/50'}
    `}
  >
    {({ isActive }) => (
      <>
        <div className={`p-2 rounded-xl mb-3 ${isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
          <Icon size={20} />
        </div>
        <span className={`text-xs font-black uppercase tracking-tight leading-none mb-1 ${isActive ? 'text-primary' : 'text-foreground'}`}>
          {label}
        </span>
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
          {description}
        </span>
      </>
    )}
  </NavLink>
);

const SizeSetPilot: React.FC = () => {
  const [requests, setRequests] = useState<SizeSetPilotRequest[]>([]);

  useEffect(() => {
    setRequests(mockDb.getSizeSetPilotRequests());
  }, []);

  const addRequest = (req: SizeSetPilotRequest) => {
    const updated = [...requests, req];
    setRequests(updated);
    mockDb.saveSizeSetPilotRequests(updated);
  };

  const updateRequest = (id: string, updates: Partial<SizeSetPilotRequest>) => {
    const updated = requests.map(r => r.id === id ? { ...r, ...updates } : r);
    setRequests(updated);
    mockDb.saveSizeSetPilotRequests(updated);
  };

  const deleteRequest = (id: string) => {
    const updated = requests.filter(r => r.id !== id);
    setRequests(updated);
    mockDb.saveSizeSetPilotRequests(updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex gap-4 pb-4 custom-scrollbar snap-x flex-wrap">
        <Tab to="dashboard" label="Dashboard" icon={LayoutDashboard} description="Overview & Stats" />
        <Tab to="planner-request" label="Planner Request" icon={PlusCircle} description="New Entry" />
        <Tab to="cutting-concern" label="Cutting" icon={Scissors} description="Fabric & Cutting" />
        <Tab to="sewing-concern" label="Sewing" icon={Activity} description="Line Production" />
        <Tab to="quality-team" label="Quality" icon={ShieldCheck} description="Inspection" />
        <Tab to="wash-concern" label="Wash" icon={Droplets} description="Laundry Process" />
        <Tab to="final-inspection" label="Final Inspection" icon={CheckSquare} description="QC & Packing" />
        <Tab to="full-report" label="Report" icon={FileText} description="Full History" />
        <Tab to="factory-analysis" label="Analysis" icon={BarChart3} description="Factory SOP & Stats" />
      </div>

      <div className="bg-background/50 backdrop-blur-sm rounded-3xl min-h-[600px]">
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard requests={requests} />} />
          <Route path="planner-request" element={<PlannerRequest requests={requests} onAdd={addRequest} onDelete={deleteRequest} onUpdate={updateRequest} />} />
          <Route path="cutting-concern" element={<CuttingConcern requests={requests} onUpdate={updateRequest} />} />
          <Route path="sewing-concern" element={<SewingConcern requests={requests} onUpdate={updateRequest} />} />
          <Route path="quality-team" element={<QualityTeam requests={requests} onUpdate={updateRequest} />} />
          <Route path="wash-concern" element={<WashConcern requests={requests} onUpdate={updateRequest} />} />
          <Route path="final-inspection" element={<FinalInspection requests={requests} onUpdate={updateRequest} />} />
          <Route path="full-report" element={<FullReport requests={requests} />} />
          <Route path="factory-analysis" element={<FactoryAnalysis requests={requests} />} />
        </Routes>
      </div>
    </div>
  );
};

export default SizeSetPilot;
