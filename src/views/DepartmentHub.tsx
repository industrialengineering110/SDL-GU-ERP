import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGlobal } from '../App';
import { 
  ClipboardList, FileBarChart, Package, Users, Hammer, 
  ShieldAlert, AlertTriangle, Clock, Sparkles, ChevronRight,
  ArrowLeft, LayoutDashboard, Banknote, ListTodo, Droplets,
  TrendingUp, Settings, Layers, Calendar, CheckSquare, Layout,
  FileStack, Search, Rocket, Scissors, Shirt
} from 'lucide-react';
import HubDashboard from '../components/HubDashboard';
import { COSTING_ROUTES } from '../constants/costing';

const HubCard = ({ title, sub, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className="p-6 rounded-[2.5rem] border border-border bg-card transition-all cursor-pointer group flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 ${color} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
    
    <div className="flex justify-between items-start">
      <div className={`p-4 rounded-2xl ${color} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
        <Icon size={24} />
      </div>
      <div className="p-2 rounded-xl transition-all bg-muted group-hover:bg-accent group-hover:text-accent-foreground text-muted-foreground">
        <ChevronRight size={16} />
      </div>
    </div>
    
    <div className="mt-4">
      <h4 className="text-[13px] font-black uppercase tracking-tight mb-1 leading-none text-foreground">{title}</h4>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{sub}</p>
    </div>
  </div>
);

const DepartmentHub: React.FC = () => {
  const { dept } = useParams();
  const navigate = useNavigate();
  
  const formattedDept = dept ? (dept.charAt(0).toUpperCase() + dept.slice(1)) : 'Sewing';

  const getMenuItems = () => {
    const d = dept?.toLowerCase();
    
    if (d === 'costing') {
      return [
        { title: 'Sewing Costing', sub: 'Financial Analysis for Sewing', icon: Banknote, color: 'bg-blue-600', path: COSTING_ROUTES.SEWING },
        { title: 'Consumption', sub: 'Material Usage Analysis', icon: Layers, color: 'bg-indigo-600', path: COSTING_ROUTES.CONSUMPTION.SEWING },
        { title: 'Washing Costing', sub: 'Washing Department Finance', icon: Droplets, color: 'bg-cyan-500', path: COSTING_ROUTES.WASH },
      ];
    }

    if (d === 'washing') {
      return [
        { title: 'Washing Input', sub: 'Manage Washing Inputs', icon: Package, color: 'bg-cyan-600', path: `/washing/input` },
        { title: 'Production Report', sub: 'Process Wise Production & Handover', icon: FileBarChart, color: 'bg-blue-600', path: `/washing/production-report` },
        { title: 'Wet Process', sub: 'Wet Process Operations', icon: Droplets, color: 'bg-cyan-500', path: `/washing/wet-process` },
        { title: 'Dry Process', sub: 'Dry Process Operations', icon: Shirt, color: 'bg-amber-600', path: `/washing/dry-process` },
      ];
    }

    if (d === 'store') {
      return [
        { title: 'Fabric Inventory', sub: 'Manage Fabric Rolls & Yardage', icon: Scissors, color: 'bg-emerald-600', path: `/store/fabric` },
        { title: 'Accessories', sub: 'Manage Trims & Accessories', icon: Package, color: 'bg-amber-500', path: `/store/accessories` },
        { title: 'IE Activity', sub: 'Industrial Engineering Tasks', icon: ClipboardList, color: 'bg-indigo-600', path: `/store/ie-activity` },
        { title: 'Section Report', sub: 'Performance & KPIs', icon: FileBarChart, color: 'bg-blue-600', path: `/store/report` },
      ];
    }

    if (d === 'planning') {
      return [
        { title: 'Plan Analysis', sub: 'Strategic Planning Metrics', icon: TrendingUp, color: 'bg-indigo-600', path: `/factory/planning/analysis` },
        { title: 'Sewing: Summary', sub: 'Production Planning Overview', icon: FileBarChart, color: 'bg-blue-600', path: `/config/planning?tab=SUMMARY` },
        { title: 'Sewing: Initialize', sub: 'Start New Production Plan', icon: Rocket, color: 'bg-emerald-600', path: `/config/planning?tab=REGISTRY` },
        { title: 'Sewing: Master Board', sub: 'Central Planning Registry', icon: Layout, color: 'bg-slate-900', path: `/config/planning?tab=MASTER` },
        { title: 'Washing Planning', sub: 'Washing Schedule & Load', icon: Droplets, color: 'bg-cyan-500', path: `/factory/planning/washing` },
      ];
    }

    if (d === 'ot-analysis') {
      return [
        { title: 'OT Analysis', sub: 'Overtime Trends & Metrics', icon: Clock, color: 'bg-slate-600', path: `/factory/ot-analysis/summary` },
        { title: 'OT Approvals', sub: 'Central Requisition Approval', icon: CheckSquare, color: 'bg-emerald-600', path: `/central/ot-approval` },
      ];
    }

    // Default operations hub items
    const defaultItems = [
      { title: 'IE Activity', sub: 'Industrial Engineering Tasks', icon: ClipboardList, color: 'bg-indigo-600', path: `/${dept}/ie-activity` },
      { title: 'Section Report', sub: 'Performance & KPIs', icon: FileBarChart, color: 'bg-blue-600', path: `/${dept}/report` },
      { title: 'Input Chalan', sub: 'WIP & Material Flow', icon: Package, color: 'bg-amber-500', path: `/${dept}/input/wip` },
      { title: 'Manpower', sub: 'Attendance & Allocation', icon: Users, color: 'bg-teal-600', path: `/${dept}/input/manpower` },
      { title: 'Machinery', sub: 'Equipment Status', icon: Hammer, color: 'bg-slate-700', path: `/${dept}/input/machines` },
      { title: 'QC & Output', sub: 'Quality & Production', icon: ShieldAlert, color: 'bg-rose-600', path: `/${dept}/input/defects` },
      { title: 'Downtime', sub: 'NPT & Loss Analysis', icon: AlertTriangle, color: 'bg-orange-500', path: `/${dept}/input/npt` },
      { title: 'OT Requisition', sub: 'Overtime Planning', icon: Clock, color: 'bg-violet-600', path: `/${dept}/ot-requisition` },
      { title: '5S Audit', sub: 'Workplace Standards', icon: Sparkles, color: 'bg-emerald-600', path: `/${dept}/audit/5s` },
    ];

    if (d === 'sewing') {
      defaultItems.push({ title: 'Output & Transfer', sub: 'Transfer to Washing', icon: Package, color: 'bg-blue-600', path: `/sewing/output-transfer` });
    }

    return defaultItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase italic leading-none text-foreground">
              {formattedDept} Hub
            </h1>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 p-1.5 rounded-2xl bg-muted">
          <div className="px-4 py-2 rounded-xl shadow-sm bg-card">
            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
              <LayoutDashboard size={12} className="text-primary" /> Dashboard View
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard Box */}
      <HubDashboard dept={formattedDept} />

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, idx) => (
          <HubCard 
            key={idx}
            {...item}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>

    </div>
  );
};

export default DepartmentHub;

