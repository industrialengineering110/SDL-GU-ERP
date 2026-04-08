import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Database, Users, BarChart3, Settings, Layers,
  Factory, ShieldAlert, Timer, AlertTriangle, Target, Package, CheckSquare, ShieldCheck, ChevronDown, ChevronRight, Scissors, Droplets, Shirt, Sparkle, Hammer, Truck, LineChart, Sparkles, LayoutList, Calendar, ClipboardList, Layout, FileBarChart, Clock, LogOut, PieChart, Store as StoreIcon, Award, UserMinus, FileStack, Wrench, Zap, Boxes, Banknote, ListTodo, TrendingUp, Rocket, X, Menu, Armchair, Calculator, Bell,
  PauseCircle, Upload, User as UserIcon, Filter, Activity, CheckCircle2
} from 'lucide-react';
import { AppUser, UserRole, INITIAL_PERMISSIONS } from '../types';
import { useGlobal } from '../App';
import Logo from './Logo';

interface SidebarProps {
  isOpen: boolean;
  user: AppUser;
  onClose?: () => void;
}

const NavItem = ({ to, icon: Icon, label, visible = true, isOpen, location, theme }: { to: string, icon: any, label: string, visible?: boolean, isOpen: boolean, location: any, theme: string }) => {
  if (!visible) return null;
  const isActive = location.pathname === to;
  
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
        ${isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20' 
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'}
      `}
    >
      <Icon size={18} className={isActive ? 'text-white' : 'text-muted-foreground group-hover:text-blue-600'} />
      {isOpen && <span className="text-xs font-black uppercase tracking-widest truncate">{label}</span>}
    </NavLink>
  );
};

const DeptSection = ({ dept, icon: Icon, color, children, to, isOpen, isExpanded, toggleDept, theme }: { dept: string, icon: any, color: string, children?: React.ReactNode, to?: string, isOpen: boolean, isExpanded: boolean, toggleDept: (dept: string) => void, theme: string }) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-1">
      <button 
        onClick={() => {
          toggleDept(dept);
          if (to) navigate(to);
        }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
          isExpanded 
            ? 'bg-accent' 
            : 'hover:bg-accent'
        }`}
      >
        <div className="flex items-center gap-3">
           <div className={`p-1.5 rounded-lg ${color} text-white shadow-sm`}>
              <Icon size={18} />
           </div>
           {isOpen && <span className="text-xs font-black uppercase tracking-wider text-foreground/80">{dept}</span>}
        </div>
        {isOpen && (isExpanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />)}
      </button>
      
      {isExpanded && isOpen && (
        <div className="pl-4 ml-4 border-l-2 border-border space-y-1 py-1 animate-in slide-in-from-top-2 duration-300">
           {children}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, user, onClose }) => {
  const location = useLocation();
  const { logout, theme } = useGlobal();
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({
    Sewing: false,
    Washing: false,
    Store: false,
    Planning: false,
    Plan: false,
    Shipment: false,
    Costing: false,
    'Print & Embroidery': false,
    'OT Analysis': false,
    'Manpower Analysis': false,
    'Machine Analysis': false
  });

  const toggleDept = (dept: string) => {
    setOpenDepts(prev => {
      const isAlreadyOpen = prev[dept];
      const newState: Record<string, boolean> = {};
      // Reset all to false
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });
      // Toggle only the clicked one
      newState[dept] = !isAlreadyOpen;
      return newState;
    });
  };

  const perms = user?.pagePermissions || INITIAL_PERMISSIONS;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        ></div>
      )}

      <aside className={`
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 w-20'} 
        bg-card border-border
        border-r h-full flex flex-col transition-all duration-300 z-50
        fixed md:relative inset-y-0 left-0
      `}>
        <div className="h-20 flex items-center px-4 border-b border-border">
          <Logo size={28} showText={false} />
          {isOpen && <span className="ml-3 font-[1000] tracking-tighter uppercase italic leading-tight text-foreground">Square Denims Ltd (GU)</span>}
          {onClose && (
            <button 
              onClick={onClose}
              className="ml-auto p-2 md:hidden text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          )}
        </div>
      
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto custom-scrollbar mt-4">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" isOpen={isOpen} location={location} theme={theme} />
        
        <div className="space-y-2">
          {isOpen && <p className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Operations</p>}
          
          <DeptSection dept="Costing" icon={Banknote} color="bg-blue-600" to="/costing/hub" isOpen={isOpen} isExpanded={openDepts['Costing']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/factory/costing/dashboard" icon={LayoutDashboard} label="Costing Dashboard" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/costing/sewing-costing" icon={Shirt} label="Sewing Costing" isOpen={isOpen} location={location} theme={theme} />
             <div className="pl-4">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Consumption</p>
                <NavItem to="/factory/costing/fabric-consumption" icon={Layers} label="Fabric Consumption" isOpen={isOpen} location={location} theme={theme} />
                <NavItem to="/factory/costing/sewing-thread-consumption" icon={Layers} label="Sewing Thread Consumption" isOpen={isOpen} location={location} theme={theme} />
                <NavItem to="/factory/costing/trims-consumption" icon={Layers} label="Trims & Accessories" isOpen={isOpen} location={location} theme={theme} />
             </div>
             <NavItem to="/factory/costing/wash-costing" icon={Droplets} label="Wash Costing" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="Store" icon={StoreIcon} color="bg-amber-500" to="/store/hub" isOpen={isOpen} isExpanded={openDepts['Store']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/store/fabric" icon={Scissors} label="Fabric" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/store/accessories" icon={Boxes} label="Accessories" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/store/ie-activity" icon={ClipboardList} label="IE Activity" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/store/report" icon={FileBarChart} label="Section Report" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="Planning" icon={ListTodo} color="bg-indigo-500" to="/planning/dashboard" isOpen={isOpen} isExpanded={openDepts['Planning'] || openDepts['Plan']} toggleDept={toggleDept} theme={theme}>
             <div className="space-y-1">
                <NavItem to="/planning/dashboard" icon={LayoutDashboard} label="Dashboard" isOpen={isOpen} location={location} theme={theme} />
                <NavItem to="/planning/order-pool" icon={Package} label="Order Pool" isOpen={isOpen} location={location} theme={theme} />
                <NavItem to="/planning/pre-production" icon={Timer} label="Pre-Production" isOpen={isOpen} location={location} theme={theme} />
                <NavItem to="/planning/line-loading" icon={TrendingUp} label="Line Loading" isOpen={isOpen} location={location} theme={theme} />
                <NavItem to="/planning/live-production" icon={Activity} label="Live Production" isOpen={isOpen} location={location} theme={theme} />
                <NavItem to="/planning/coordination-wall" icon={Layers} label="Coordination Wall" isOpen={isOpen} location={location} theme={theme} />
                <NavItem to="/planning/monthly-plan-status" icon={BarChart3} label="Monthly Status" isOpen={isOpen} location={location} theme={theme} />
                <NavItem to="/planning/planning-ownership" icon={Users} label="Ownership" isOpen={isOpen} location={location} theme={theme} />
                <NavItem to="/planning/revision-history" icon={Clock} label="Revision History" isOpen={isOpen} location={location} theme={theme} />
             </div>
          </DeptSection>

          <DeptSection dept="Sample" icon={Layout} color="bg-pink-500" to="/sample/hub" isOpen={isOpen} isExpanded={openDepts['Sample']} toggleDept={toggleDept} theme={theme}>
              <NavItem to="/sample/summary" icon={LayoutDashboard} label="Summary" isOpen={isOpen} location={location} theme={theme} />
              <div className="pl-4">
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Sample Request</p>
                 <NavItem to="/sample/request/merchandisers" icon={Users} label="Merchandisers" isOpen={isOpen} location={location} theme={theme} />
                 <NavItem to="/sample/request/pd" icon={Factory} label="PD" isOpen={isOpen} location={location} theme={theme} />
              </div>
              <NavItem to="/sample/status" icon={Clock} label="Sample Status" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/sample/proportion" icon={PieChart} label="Sample Proportion" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/sample/quality" icon={ShieldCheck} label="Sample Quality" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/sample/wash-send-received" icon={Truck} label="Wash Send & Received" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/sample/risk-analysis" icon={AlertTriangle} label="Risk Analysis" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/sample/manpower" icon={Users} label="Manpower" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/sample/machines" icon={Hammer} label="Machine" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/sample/ie-activity" icon={ClipboardList} label="IE Activity" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/sample/audit/5s" icon={Sparkles} label="5S Audit" isOpen={isOpen} location={location} theme={theme} />
           </DeptSection>

           <DeptSection dept="Size Set & Pilot" icon={ShieldCheck} color="bg-emerald-500" to="/size-set-pilot" isOpen={isOpen} isExpanded={openDepts['Size Set & Pilot']} toggleDept={toggleDept} theme={theme}>
              <NavItem to="/size-set-pilot/dashboard" icon={LayoutDashboard} label="Dashboard" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/size-set-pilot/planner-request" icon={ListTodo} label="Planner Request" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/size-set-pilot/cutting-concern" icon={Scissors} label="Cutting Concern" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/size-set-pilot/sewing-concern" icon={Shirt} label="Sewing / Sample Line Concern" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/size-set-pilot/quality-team" icon={ShieldCheck} label="Quality Team" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/size-set-pilot/wash-concern" icon={Droplets} label="Wash Sample Concern" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/size-set-pilot/full-report" icon={FileBarChart} label="Full Style Report" isOpen={isOpen} location={location} theme={theme} />
           </DeptSection>

          <DeptSection dept="Cutting" icon={Scissors} color="bg-orange-500" to="/cutting/hub" isOpen={isOpen} isExpanded={openDepts['Cutting']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/cutting/ie-activity" icon={ClipboardList} label="IE Activity" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/cutting/report" icon={FileBarChart} label="Section Report" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/cutting/input/wip" icon={Package} label="Input Chalan" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/cutting/input/manpower" icon={Users} label="Manpower" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/cutting/input/machines" icon={Hammer} label="Machinery" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/cutting/input/defects" icon={ShieldAlert} label="QC & Output" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/cutting/input/npt" icon={AlertTriangle} label="Downtime" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/cutting/ot-requisition" icon={Clock} label="OT Requisition" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/cutting/audit/5s" icon={Sparkles} label="5S Audit" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="Print & Embroidery" icon={Layers} color="bg-purple-500" to="/print-embroidery/hub" isOpen={isOpen} isExpanded={openDepts['Print & Embroidery']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/print-embroidery/ie-activity" icon={ClipboardList} label="IE Activity" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/print-embroidery/report" icon={FileBarChart} label="Section Report" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/print-embroidery/input/wip" icon={Package} label="Input Chalan" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/print-embroidery/input/manpower" icon={Users} label="Manpower" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/print-embroidery/input/machines" icon={Hammer} label="Machinery" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/print-embroidery/input/defects" icon={ShieldAlert} label="QC & Output" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/print-embroidery/input/npt" icon={AlertTriangle} label="Downtime" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/print-embroidery/ot-requisition" icon={Clock} label="OT Requisition" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/print-embroidery/audit/5s" icon={Sparkles} label="5S Audit" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="Sewing" icon={Shirt} color="bg-blue-600" to="/sewing/hub" isOpen={isOpen} isExpanded={openDepts['Sewing']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/sewing/ie-activity" icon={ClipboardList} label="IE Activity" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/sewing/report" icon={FileBarChart} label="Section Report" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/sewing/input/wip" icon={Package} label="Input Chalan" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/sewing/input/manpower" icon={Users} label="Manpower" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/sewing/input/machines" icon={Hammer} label="Machinery" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/sewing/input/defects" icon={ShieldAlert} label="QC & Output" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/sewing/input/npt" icon={AlertTriangle} label="Downtime" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/sewing/ot-requisition" icon={Clock} label="OT Requisition" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/sewing/audit/5s" icon={Sparkles} label="5S Audit" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/sewing/output-transfer" icon={Package} label="Output & Transfer" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="Washing" icon={Droplets} color="bg-cyan-500" to="/washing/hub" isOpen={isOpen} isExpanded={openDepts['Washing']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/washing/input" icon={Package} label="Washing Input" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/washing/production-report" icon={FileBarChart} label="Production Report" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/washing/wet-process" icon={Droplets} label="Wet Process" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/washing/dry-process" icon={Shirt} label="Dry Process" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="Finishing" icon={Sparkle} color="bg-emerald-500" to="/finishing/hub" isOpen={isOpen} isExpanded={openDepts['Finishing']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/finishing/ie-activity" icon={ClipboardList} label="IE Activity" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/finishing/report" icon={FileBarChart} label="Section Report" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/finishing/input/wip" icon={Package} label="Input Chalan" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/finishing/input/manpower" icon={Users} label="Manpower" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/finishing/input/machines" icon={Hammer} label="Machinery" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/finishing/input/defects" icon={ShieldAlert} label="QC & Output" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/finishing/input/npt" icon={AlertTriangle} label="Downtime" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/finishing/ot-requisition" icon={Clock} label="OT Requisition" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/finishing/audit/5s" icon={Sparkles} label="5S Audit" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="Shipment" icon={Truck} color="bg-slate-700" to="/shipment/hub" isOpen={isOpen} isExpanded={openDepts['Shipment']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/shipment/ie-activity" icon={ClipboardList} label="IE Activity" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/shipment/report" icon={FileBarChart} label="Section Report" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="OT Analysis" icon={Clock} color="bg-rose-600" to="/ot-analysis/hub" isOpen={isOpen} isExpanded={openDepts['OT Analysis']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/ot-analysis/summary" icon={LayoutDashboard} label="Summary" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/ot-analysis/details" icon={FileBarChart} label="Details" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="Machine Analysis" icon={Hammer} color="bg-slate-900" to="/factory/machine-analysis" isOpen={isOpen} isExpanded={openDepts['Machine Analysis']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/factory/machine-analysis/inventory" icon={Layers} label="Fleet Inventory" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/machine-analysis/maintenance" icon={Wrench} label="Maintenance Hub" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/machine-analysis/breakdown" icon={AlertTriangle} label="Breakdown Logs" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/machine-analysis/efficiency" icon={Zap} label="OEE / Efficiency" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/machine-analysis/spares" icon={Boxes} label="Spare Parts" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="Manpower Analysis" icon={Users} color="bg-teal-600" to="/factory/manpower-analysis" isOpen={isOpen} isExpanded={openDepts['Manpower Analysis']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/factory/manpower-analysis/summary" icon={PieChart} label="Strength Summary" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/manpower-analysis/budget" icon={Settings} label="Budget Master" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/manpower-analysis/registry" icon={ClipboardList} label="Personnel Registry" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/manpower-analysis/skills" icon={Award} label="Skill Matrix" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/manpower-analysis/absent" icon={UserMinus} label="Absent Monitor" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/manpower-analysis/appraisal" icon={FileStack} label="Appraisal Hub" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="Furniture Status" icon={Armchair} color="bg-stone-500" to="/factory/furniture-status" isOpen={isOpen} isExpanded={openDepts['Furniture Status']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/factory/furniture-status/inventory" icon={Layers} label="Inventory" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/furniture-status/maintenance" icon={Wrench} label="Maintenance" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

          <DeptSection dept="Calculation" icon={Calculator} color="bg-indigo-500" to="/factory/calculations" isOpen={isOpen} isExpanded={openDepts['Calculation']} toggleDept={toggleDept} theme={theme}>
             <NavItem to="/factory/calculations/smv" icon={Timer} label="SMV Calculator" isOpen={isOpen} location={location} theme={theme} />
             <NavItem to="/factory/calculations/efficiency" icon={Zap} label="Efficiency Calc" isOpen={isOpen} location={location} theme={theme} />
          </DeptSection>

        </div>

        <div className="pt-2 border-t border-border space-y-1">
          {isOpen && <p className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Enterprise</p>}
          {user.role === 'ADMIN' && (
            <>
              <NavItem to="/admin/analytics" icon={PieChart} label="Factory Analysis" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/admin/management" icon={ShieldCheck} label="Governance" isOpen={isOpen} location={location} theme={theme} />
              <NavItem to="/enterprise/notice-board" icon={Bell} label="Notice Board" isOpen={isOpen} location={location} theme={theme} />
            </>
          )}
        </div>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="bg-muted p-4 rounded-2xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl border border-border flex items-center justify-center bg-card text-muted-foreground"><Users size={20}/></div>
             {isOpen && (
               <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-black uppercase truncate text-foreground">{user.name}</p>
                 <p className="text-[8px] font-bold text-muted-foreground uppercase truncate">{user.role}</p>
                 <button 
                  onClick={logout}
                  className="mt-2 flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase hover:text-rose-700 transition-colors"
                 >
                   <LogOut size={10} /> Logout
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
