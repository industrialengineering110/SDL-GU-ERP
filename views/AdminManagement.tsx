
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, CheckCircle, Trash2, Plus, Lock, Save, 
  Layers, Building, Briefcase, ChevronDown, ChevronRight, X, 
  FileUp, ShieldAlert, TrendingUp, Hammer, Target, 
  TriangleAlert, Cpu, List, Package, Box, QrCode, 
  Activity, RefreshCcw, Tag, ListChecks, Gauge, 
  Presentation, SquareUser, Sparkles, History,
  Calendar, AlarmClock, UserX, Check, BookOpen, Clock, 
  FileBarChart, BarChart3, PieChart, Printer, BrainCircuit, 
  Download, Upload, Database, FileText, Search, ClipboardList, 
  MapPin, Timer, Info, ArrowRight, Shirt, Trash, FlaskConical,
  Layout, Edit, Copy, FileSpreadsheet, Eye, GraduationCap, Zap,
  Monitor, Globe, CircleHelp, Wrench, LifeBuoy, BriefcaseBusiness,
  TrendingDown, CheckSquare, Settings2, UserPlus, FileSpreadsheet as ExcelIcon,
  ShieldX, AlertOctagon, ArrowLeft, ArrowUp, ArrowDown, Calculator, GanttChartSquare,
  Banknote, Gem, Scissors, Droplets, Truck, Armchair, Bell, Shield, LayoutDashboard
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { apiService } from '../services/apiService';
import { SkillConfigEditor } from '../components/SkillConfigEditor';
import { 
  AppUser as User, SystemConfig, ManpowerBudgetEntry, 
  LineMapping, MachineAsset, MachineRequirement, UserRole, HRReasons,
  ManpowerStatusEntry, QualityIssueConfig, LearningCurveGroup,
  PagePermissions, INITIAL_PERMISSIONS
} from '../types';
import Logo from '../components/Logo';
import AdminRegistration from './AdminRegistration';

const PERMISSION_STRUCTURE = [
  { id: 'costing', label: 'Costing', icon: Droplets, key: 'costing', children: [
    { id: 'c-sewing', label: 'Sewing Costing', children: [
      { id: 'c-sewing-view', label: 'View Access', key: 'c-sewing-view' },
      { id: 'c-sewing-edit', label: 'Edit/Save', key: 'c-sewing-edit' },
      { id: 'c-sewing-approve', label: 'Approval', key: 'c-sewing-approve' }
    ] },
    { id: 'c-dashboard', label: 'Costing Dashboard', children: [{ id: 'c-dash-main', label: 'Main', key: 'c-dash-main' }] },
    { id: 'c-fabric', label: 'Fabric Consumption', children: [
      { id: 'c-fab-view', label: 'View', key: 'c-fab-view' },
      { id: 'c-fab-edit', label: 'Edit', key: 'c-fab-edit' }
    ] },
    { id: 'c-thread', label: 'Sewing Thread Consumption', children: [{ id: 'c-thread-main', label: 'Main', key: 'c-thread-main' }] },
    { id: 'c-trims', label: 'Trims & Accessories', children: [{ id: 'c-trims-main', label: 'Main', key: 'c-trims-main' }] },
    { id: 'c-wash', label: 'Wash Costing', children: [{ id: 'c-wash-main', label: 'Main', key: 'c-wash-main' }] },
  ]},
  { id: 'store', label: 'Store', icon: Package, key: 'store', children: [
    { id: 'st-fabric', label: 'Fabric', children: [
      { id: 'st-fab-in', label: 'In-house Entry', key: 'st-fab-in' },
      { id: 'st-fab-out', label: 'Issue Entry', key: 'st-fab-out' },
      { id: 'st-fab-rep', label: 'Reports', key: 'st-fab-rep' }
    ] },
    { id: 'st-acc', label: 'Accessories', children: [{ id: 'st-acc-main', label: 'Main', key: 'st-acc-main' }] },
    { id: 'st-ie', label: 'IE Activity', children: [{ id: 'st-ie-main', label: 'Main', key: 'st-ie-main' }] },
    { id: 'st-report', label: 'Section Report', children: [{ id: 'st-rep-main', label: 'Main', key: 'st-rep-main' }] },
  ]},
  { id: 'planning', label: 'Planning', icon: LayoutDashboard, key: 'planning', children: [
    { id: 'p-dashboard', label: 'Dashboard', children: [{ id: 'p-dash-main', label: 'Main', key: 'p-dash-main' }] },
    { id: 'p-order', label: 'Order Pool', children: [
      { id: 'p-order-view', label: 'View Pool', key: 'p-order-view' },
      { id: 'p-order-edit', label: 'Edit Order', key: 'p-order-edit' },
      { id: 'p-order-split', label: 'Split Order', key: 'p-order-split' }
    ] },
    { id: 'p-preprod', label: 'Pre-Production', children: [{ id: 'p-pre-main', label: 'Main', key: 'p-pre-main' }] },
    { id: 'p-line', label: 'Line Loading', children: [
      { id: 'p-line-view', label: 'View Board', key: 'p-line-view' },
      { id: 'p-line-edit', label: 'Modify Plan', key: 'p-line-edit' },
      { id: 'p-line-delete', label: 'Delete Plan', key: 'p-line-delete' }
    ] },
    { id: 'p-live', label: 'Live Production', children: [{ id: 'p-live-main', label: 'Main', key: 'p-live-main' }] },
  ]},
  { id: 'sample', label: 'Sample', icon: FlaskConical, key: 'sample', children: [
    { id: 'sa-summary', label: 'Summary', children: [{ id: 'sa-sum-main', label: 'Main', key: 'sa-sum-main' }] },
    { id: 'sa-merch', label: 'Merchandisers', children: [{ id: 'sa-merch-main', label: 'Main', key: 'sa-merch-main' }] },
    { id: 'sa-pd', label: 'PD', children: [{ id: 'sa-pd-main', label: 'Main', key: 'sa-pd-main' }] },
    { id: 'sa-status', label: 'Sample Status', children: [{ id: 'sa-stat-main', label: 'Main', key: 'sa-stat-main' }] },
    { id: 'sa-prop', label: 'Sample Proportion', children: [{ id: 'sa-prop-main', label: 'Main', key: 'sa-prop-main' }] },
    { id: 'sa-qual', label: 'Sample Quality', children: [{ id: 'sa-qual-main', label: 'Main', key: 'sa-qual-main' }] },
    { id: 'sa-wash', label: 'Wash Send & Received', children: [{ id: 'sa-wash-main', label: 'Main', key: 'sa-wash-main' }] },
    { id: 'sa-risk', label: 'Risk Analysis', children: [{ id: 'sa-risk-main', label: 'Main', key: 'sa-risk-main' }] },
    { id: 'sa-man', label: 'Manpower', children: [{ id: 'sa-man-main', label: 'Main', key: 'sa-man-main' }] },
    { id: 'sa-mach', label: 'Machine', children: [{ id: 'sa-mach-main', label: 'Main', key: 'sa-mach-main' }] },
    { id: 'sa-ie', label: 'IE Activity', children: [{ id: 'sa-ie-main', label: 'Main', key: 'sa-ie-main' }] },
    { id: 'sa-5s', label: '5S Audit', children: [{ id: 'sa-5s-main', label: 'Main', key: 'sa-5s-main' }] },
  ]},
  { id: 'size-set', label: 'Size Set & Pilot', icon: Shirt, key: 'size-set', children: [
    { id: 'ss-dash', label: 'Dashboard', children: [{ id: 'ss-dash-main', label: 'Main', key: 'ss-dash-main' }] },
    { id: 'ss-plan', label: 'Planner Request', children: [{ id: 'ss-plan-main', label: 'Main', key: 'ss-plan-main' }] },
    { id: 'ss-cut', label: 'Cutting Concern', children: [{ id: 'ss-cut-main', label: 'Main', key: 'ss-cut-main' }] },
    { id: 'ss-sew', label: 'Sewing / Sample Line Concern', children: [{ id: 'ss-sew-main', label: 'Main', key: 'ss-sew-main' }] },
    { id: 'ss-qual', label: 'Quality Team', children: [{ id: 'ss-qual-main', label: 'Main', key: 'ss-qual-main' }] },
    { id: 'ss-wash', label: 'Wash Sample Concern', children: [{ id: 'ss-wash-main', label: 'Main', key: 'ss-wash-main' }] },
    { id: 'ss-rep', label: 'Full Style Report', children: [{ id: 'ss-rep-main', label: 'Main', key: 'ss-rep-main' }] },
  ]},
  { id: 'cutting', label: 'Cutting', icon: Scissors, key: 'cutting', children: [
    { id: 'cu-ie', label: 'IE Activity', children: [{ id: 'cu-ie-main', label: 'Main', key: 'cu-ie-main' }] },
    { id: 'cu-rep', label: 'Section Report', children: [{ id: 'cu-rep-main', label: 'Main', key: 'cu-rep-main' }] },
    { id: 'cu-in', label: 'Input Chalan', children: [{ id: 'cu-in-main', label: 'Main', key: 'cu-in-main' }] },
    { id: 'cu-man', label: 'Manpower', children: [{ id: 'cu-man-main', label: 'Main', key: 'cu-man-main' }] },
    { id: 'cu-mach', label: 'Machinery', children: [{ id: 'cu-mach-main', label: 'Main', key: 'cu-mach-main' }] },
    { id: 'cu-qc', label: 'QC & Output', children: [{ id: 'cu-qc-main', label: 'Main', key: 'cu-qc-main' }] },
    { id: 'cu-dwn', label: 'Downtime', children: [{ id: 'cu-dwn-main', label: 'Main', key: 'cu-dwn-main' }] },
    { id: 'cu-ot', label: 'OT Requisition', children: [{ id: 'cu-ot-main', label: 'Main', key: 'cu-ot-main' }] },
    { id: 'cu-5s', label: '5S Audit', children: [{ id: 'cu-5s-main', label: 'Main', key: 'cu-5s-main' }] },
  ]},
  { id: 'print', label: 'Print & Embroidery', icon: Sparkles, key: 'print', children: [
    { id: 'pr-ie', label: 'IE Activity', children: [{ id: 'pr-ie-main', label: 'Main', key: 'pr-ie-main' }] },
    { id: 'pr-rep', label: 'Section Report', children: [{ id: 'pr-rep-main', label: 'Main', key: 'pr-rep-main' }] },
    { id: 'pr-in', label: 'Input Chalan', children: [{ id: 'pr-in-main', label: 'Main', key: 'pr-in-main' }] },
    { id: 'pr-man', label: 'Manpower', children: [{ id: 'pr-man-main', label: 'Main', key: 'pr-man-main' }] },
    { id: 'pr-mach', label: 'Machinery', components: [{ id: 'pr-mach-main', label: 'Main', key: 'pr-mach-main' }] },
    { id: 'pr-qc', label: 'QC & Output', children: [{ id: 'pr-qc-main', label: 'Main', key: 'pr-qc-main' }] },
    { id: 'pr-dwn', label: 'Downtime', children: [{ id: 'pr-dwn-main', label: 'Main', key: 'pr-dwn-main' }] },
    { id: 'pr-ot', label: 'OT Requisition', children: [{ id: 'pr-ot-main', label: 'Main', key: 'pr-ot-main' }] },
    { id: 'pr-5s', label: '5S Audit', children: [{ id: 'pr-5s-main', label: 'Main', key: 'pr-5s-main' }] },
  ]},
  { id: 'sewing', label: 'Sewing', icon: Scissors, key: 'sewing', children: [
    { id: 'se-ie', label: 'IE Activity', children: [{ id: 'se-ie-main', label: 'Main', key: 'se-ie-main' }] },
    { id: 'se-rep', label: 'Section Report', children: [{ id: 'se-rep-main', label: 'Main', key: 'se-rep-main' }] },
    { id: 'se-in', label: 'Input Chalan', children: [{ id: 'se-in-main', label: 'Main', key: 'se-in-main' }] },
    { id: 'se-man', label: 'Manpower', children: [{ id: 'se-man-main', label: 'Main', key: 'se-man-main' }] },
    { id: 'se-mach', label: 'Machinery', children: [{ id: 'se-mach-main', label: 'Main', key: 'se-mach-main' }] },
    { id: 'se-qc', label: 'QC & Output', children: [{ id: 'se-qc-main', label: 'Main', key: 'se-qc-main' }] },
    { id: 'se-dwn', label: 'Downtime', children: [{ id: 'se-dwn-main', label: 'Main', key: 'se-dwn-main' }] },
    { id: 'se-ot', label: 'OT Requisition', children: [{ id: 'se-ot-main', label: 'Main', key: 'se-ot-main' }] },
    { id: 'se-5s', label: '5S Audit', children: [{ id: 'se-5s-main', label: 'Main', key: 'se-5s-main' }] },
  ]},
  { id: 'washing', label: 'Washing', icon: Droplets, key: 'washing', children: [
    { id: 'wa-ie', label: 'IE Activity', children: [{ id: 'wa-ie-main', label: 'Main', key: 'wa-ie-main' }] },
    { id: 'wa-rep', label: 'Section Report', children: [{ id: 'wa-rep-main', label: 'Main', key: 'wa-rep-main' }] },
    { id: 'wa-manw', label: 'Manpower (Wet)', children: [{ id: 'wa-manw-main', label: 'Main', key: 'wa-manw-main' }] },
    { id: 'wa-mand', label: 'Manpower (Dry)', children: [{ id: 'wa-mand-main', label: 'Main', key: 'wa-mand-main' }] },
    { id: 'wa-machw', label: 'Machine (Wet)', children: [{ id: 'wa-machw-main', label: 'Main', key: 'wa-machw-main' }] },
    { id: 'wa-machd', label: 'Machine (Dry)', children: [{ id: 'wa-machd-main', label: 'Main', key: 'wa-machd-main' }] },
    { id: 'wa-dwn', label: 'Down Time', children: [{ id: 'wa-dwn-main', label: 'Main', key: 'wa-dwn-main' }] },
    { id: 'wa-5sw', label: '5S Audit (Wet)', children: [{ id: 'wa-5sw-main', label: 'Main', key: 'wa-5sw-main' }] },
    { id: 'wa-5sd', label: '5S Audit (Dry)', children: [{ id: 'wa-5sd-main', label: 'Main', key: 'wa-5sd-main' }] },
  ]},
  { id: 'finishing', label: 'Finishing', icon: Sparkles, key: 'finishing', children: [
    { id: 'fi-ie', label: 'IE Activity', children: [{ id: 'fi-ie-main', label: 'Main', key: 'fi-ie-main' }] },
    { id: 'fi-rep', label: 'Section Report', children: [{ id: 'fi-rep-main', label: 'Main', key: 'fi-rep-main' }] },
    { id: 'fi-in', label: 'Input Chalan', children: [{ id: 'fi-in-main', label: 'Main', key: 'fi-in-main' }] },
    { id: 'fi-man', label: 'Manpower', children: [{ id: 'fi-man-main', label: 'Main', key: 'fi-man-main' }] },
    { id: 'fi-mach', label: 'Machinery', children: [{ id: 'fi-mach-main', label: 'Main', key: 'fi-mach-main' }] },
    { id: 'fi-qc', label: 'QC & Output', children: [{ id: 'fi-qc-main', label: 'Main', key: 'fi-qc-main' }] },
    { id: 'fi-dwn', label: 'Downtime', children: [{ id: 'fi-dwn-main', label: 'Main', key: 'fi-dwn-main' }] },
    { id: 'fi-ot', label: 'OT Requisition', children: [{ id: 'fi-ot-main', label: 'Main', key: 'fi-ot-main' }] },
    { id: 'fi-5s', label: '5S Audit', children: [{ id: 'fi-5s-main', label: 'Main', key: 'fi-5s-main' }] },
  ]},
  { id: 'shipment', label: 'Shipment', icon: Truck, key: 'shipment', children: [
    { id: 'sh-ie', label: 'IE Activity', children: [{ id: 'sh-ie-main', label: 'Main', key: 'sh-ie-main' }] },
    { id: 'sh-rep', label: 'Section Report', children: [{ id: 'sh-rep-main', label: 'Main', key: 'sh-rep-main' }] },
  ]},
  { id: 'ot-analysis', label: 'OT Analysis', icon: Clock, key: 'otAnalysis', children: [
    { id: 'ot-sum', label: 'Summary', children: [{ id: 'ot-sum-main', label: 'Main', key: 'ot-sum-main' }] },
    { id: 'ot-det', label: 'Details', children: [{ id: 'ot-det-main', label: 'Main', key: 'ot-det-main' }] },
  ]},
  { id: 'machine-analysis', label: 'Machine Analysis', icon: Hammer, key: 'machineAnalysis', children: [
    { id: 'ma-inv', label: 'Fleet Inventory', children: [{ id: 'ma-inv-main', label: 'Main', key: 'ma-inv-main' }] },
    { id: 'ma-maint', label: 'Maintenance Hub', children: [{ id: 'ma-maint-main', label: 'Main', key: 'ma-maint-main' }] },
    { id: 'ma-brk', label: 'Breakdown Logs', children: [{ id: 'ma-brk-main', label: 'Main', key: 'ma-brk-main' }] },
    { id: 'ma-eff', label: 'OEE / Efficiency', children: [{ id: 'ma-eff-main', label: 'Main', key: 'ma-eff-main' }] },
    { id: 'ma-spare', label: 'Spare Parts', children: [{ id: 'ma-spare-main', label: 'Main', key: 'ma-spare-main' }] },
  ]},
  { id: 'manpower-analysis', label: 'Manpower Analysis', icon: Users, key: 'manpowerAnalysis', children: [
    { id: 'mp-sum', label: 'Strength Summary', children: [{ id: 'mp-sum-main', label: 'Main', key: 'mp-sum-main' }] },
    { id: 'mp-bud', label: 'Budget Master', children: [{ id: 'mp-bud-main', label: 'Main', key: 'mp-bud-main' }] },
    { id: 'mp-reg', label: 'Personnel Registry', children: [{ id: 'mp-reg-main', label: 'Main', key: 'mp-reg-main' }] },
    { id: 'mp-skill', label: 'Skill Matrix', children: [{ id: 'mp-skill-main', label: 'Main', key: 'mp-skill-main' }] },
    { id: 'mp-abs', label: 'Absent Monitor', children: [{ id: 'mp-abs-main', label: 'Main', key: 'mp-abs-main' }] },
    { id: 'mp-app', label: 'Appraisal Hub', children: [{ id: 'mp-app-main', label: 'Main', key: 'mp-app-main' }] },
  ]},
  { id: 'furniture-status', label: 'Furniture Status', icon: Armchair, key: 'furnitureStatus', children: [
    { id: 'fs-inv', label: 'Inventory', children: [{ id: 'fs-inv-main', label: 'Main', key: 'fs-inv-main' }] },
    { id: 'fs-maint', label: 'Maintenance', children: [{ id: 'fs-maint-main', label: 'Main', key: 'fs-maint-main' }] },
  ]},
  { id: 'calculation', label: 'Calculation', icon: Calculator, key: 'calculation', children: [
    { id: 'ca-smv', label: 'SMV Calculator', children: [{ id: 'ca-smv-main', label: 'Main', key: 'ca-smv-main' }] },
    { id: 'ca-eff', label: 'Efficiency Calc', children: [{ id: 'ca-eff-main', label: 'Main', key: 'ca-eff-main' }] },
  ]},
  { id: 'factory-analysis', label: 'Factory Analysis', icon: BarChart3, key: 'factoryAnalysis', children: [
    { id: 'fa-rep', label: 'Report', children: [{ id: 'fa-rep-main', label: 'Main', key: 'fa-rep-main' }] },
  ]},
  { id: 'governance', label: 'Governance', icon: Shield, key: 'governance', children: [
    { id: 'go-rep', label: 'Report', children: [{ id: 'go-rep-main', label: 'Main', key: 'go-rep-main' }] },
  ]},
  { id: 'notice-board', label: 'Notice Board', icon: Bell, key: 'noticeBoard', children: [
    { id: 'no-rep', label: 'Report', children: [{ id: 'no-rep-main', label: 'Main', key: 'no-rep-main' }] },
  ]},
];

const Switch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
      checked ? 'bg-blue-600' : 'bg-slate-200'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-5.5' : 'translate-x-1'
      }`}
    />
  </button>
);

const PermissionNode = ({ node, permissions, onToggle, level = 0 }: { node: any, permissions: PagePermissions, onToggle: (key: string, val: boolean) => void, level?: number }) => {
  const [activeSubTab, setActiveSubTab] = useState<string | null>(node.children?.[0]?.id || null);
  const hasChildren = node.children && node.children.length > 0;
  
  // Level 0 nodes are already handled by the sidebar in AdminManagement.
  // We handle level 1 as sub-tabs if they have children.
  if (level === 0 && hasChildren) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap gap-3 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
          {node.children.map((child: any) => (
            <button
              key={child.id}
              onClick={() => setActiveSubTab(child.id)}
              className={`flex-1 min-w-[140px] px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSubTab === child.id
                  ? 'bg-white text-blue-600 shadow-xl scale-105 z-10'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {child.label}
            </button>
          ))}
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {node.children.map((child: any) => (
            activeSubTab === child.id && (
              <PermissionNode 
                key={child.id} 
                node={child} 
                permissions={permissions} 
                onToggle={onToggle} 
                level={level + 1} 
              />
            )
          ))}
        </div>
      </div>
    );
  }

  if (level === 1 && hasChildren) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {node.children.map((child: any) => (
          <div key={child.id} className="p-5 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl ${permissions[child.key] !== 'NONE' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Zap size={14} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">
                  {child.label === 'Main' ? node.label : child.label}
                </span>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  {child.label === 'Main' ? 'Full Access' : 'Component Access'}
                </p>
              </div>
            </div>
            <Switch 
              checked={permissions[child.key] !== 'NONE'} 
              onChange={(val) => onToggle(child.key, val)} 
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div 
        className={`flex items-center justify-between p-5 rounded-[2rem] transition-all ${
          level === 1 ? 'bg-white border-2 border-slate-100 shadow-sm' : 'bg-slate-50/50 border border-slate-100'
        }`}
        style={{ marginLeft: level > 1 ? `${(level - 1) * 32}px` : '0px' }}
      >
        <div className="flex items-center gap-4">
          {node.icon && <node.icon size={18} className="text-blue-600" />}
          <div className="space-y-0.5">
            <span className={`text-[11px] font-black uppercase tracking-tight ${level === 1 ? 'text-slate-900' : 'text-slate-600'}`}>
              {node.label}
            </span>
            {node.key && (
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">System Key: {node.key}</p>
            )}
          </div>
        </div>
        
        {node.key && (
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
              permissions[node.key] !== 'NONE' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}>
              {permissions[node.key] !== 'NONE' ? 'Authorized' : 'Restricted'}
            </div>
            <Switch 
              checked={permissions[node.key] !== 'NONE'} 
              onChange={(val) => onToggle(node.key, val)} 
            />
          </div>
        )}
      </div>
      
      {hasChildren && (
        <div className="space-y-3">
          {node.children.map((child: any) => (
            <PermissionNode key={child.id} node={child} permissions={permissions} onToggle={onToggle} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const SectionDropdown = React.memo(({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) => (
  <div className="space-y-2 w-full mb-8 animate-in slide-in-from-top-2 duration-300">
    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest px-1 flex items-center gap-2">
      <Layers size={12} className="text-blue-600" /> {label}
    </label>
    <div className="relative group max-w-xs">
      <select 
        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 text-xs font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none shadow-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </div>
));

const ListEditor: React.FC<{ title: string, icon: any, items: string[], onAdd: (val: string) => void, onDelete: (idx: number) => void, placeholder?: string }> = ({ title, icon: Icon, items = [], onAdd, onDelete, placeholder = "Add new..." }) => {
  const [input, setInput] = useState('');
  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6 flex flex-col h-[550px]">
      <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg"><Icon size={24}/></div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h3>
      </div>
      <div className="flex gap-3">
        <input 
          className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
          placeholder={placeholder} 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if(e.key === 'Enter' && input.trim()) { onAdd(input.trim()); setInput(''); } }}
        />
        <button onClick={() => { if(input.trim()) { onAdd(input.trim()); setInput(''); } }} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"><Plus size={20}/></button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-2">
        {(items || []).length > 0 ? (items || []).map((item, idx) => (
          <div key={`${item}-${idx}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white border-2 border-transparent hover:border-slate-100 transition-all shadow-sm">
            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{item}</span>
            <button onClick={() => onDelete(idx)} className="text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
          </div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 italic space-y-4">
            <RefreshCcw size={40} className="opacity-20 animate-spin-slow" />
            <p className="text-xs font-black uppercase tracking-[0.2em]">Empty registry.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// New Component for OT Logic Mapping
const OTMappingEditor: React.FC<{ 
  reasons: string[], 
  departments: string[], 
  mapping: Record<string, string>, 
  onMappingChange: (mapping: Record<string, string>) => void 
}> = ({ reasons, departments, mapping, onMappingChange }) => {
  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 flex flex-col min-h-[550px]">
      <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><RefreshCcw size={24}/></div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Reason-to-Department Mapping</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        {reasons.map(reason => (
          <div key={reason} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-white hover:border-blue-200 transition-all">
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">OT Reason</p>
              <h4 className="text-xs font-[1000] text-slate-900 uppercase">{reason}</h4>
            </div>
            <ArrowRight size={20} className="text-slate-300 hidden md:block" />
            <div className="w-full md:w-64">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-right">Target Responsible Dept</p>
              <select 
                className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-blue-500 transition-all"
                value={mapping[reason] || ''}
                onChange={e => onMappingChange({ ...mapping, [reason]: e.target.value })}
              >
                <option value="">Select Default Dept...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        ))}
        {reasons.length === 0 && (
          <div className="py-20 text-center text-slate-300 italic text-sm">Add OT Reasons first to define mappings.</div>
        )}
      </div>
    </div>
  );
};

const AdminManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);

  const [activeTab, setActiveTab] = useState<'APPROVALS' | 'PERMISSIONS' | 'CONFIG'>(() => {
    return (localStorage.getItem('sdl_gov_active_tab') as any) || 'CONFIG';
  });
  
  const [configSubTab, setConfigSubTab] = useState<string>(() => {
    return localStorage.getItem('sdl_gov_config_subtab') || 'LINES';
  });
  
  const [permissionsSubTab, setPermissionsSubTab] = useState<'USER PERMISSIONS' | 'ACCESS TIERS'>('USER PERMISSIONS');
  const [activePermissionCategory, setActivePermissionCategory] = useState<string>('COSTING');
  
  const [selectedSection, setSelectedSection] = useState(() => {
    return localStorage.getItem('sdl_gov_selected_section') || 'Sewing';
  });

  const [message, setMessage] = useState('');
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<PagePermissions>(INITIAL_PERMISSIONS);
  const [editingTier, setEditingTier] = useState<any>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({});

  const handleEditTier = (tier: any) => {
    setEditingTier({ ...tier });
  };

  const handleDeleteTier = (tierId: string) => {
    if (confirm('Are you sure you want to delete this access tier? Users assigned to this tier will lose their permissions.')) {
      handleConfigUpdate('accessTiers', (config.accessTiers || []).filter((t: any) => t.id !== tierId));
      if (selectedUser?.id === tierId) {
        setSelectedUser(null);
        setTempPermissions(INITIAL_PERMISSIONS);
      }
    }
  };

  const handleSaveTierInfo = () => {
    if (!editingTier) return;
    const updatedTiers = (config.accessTiers || []).map((t: any) => 
      t.id === editingTier.id ? { ...t, name: editingTier.name, description: editingTier.description } : t
    );
    handleConfigUpdate('accessTiers', updatedTiers);
    if (selectedUser?.id === editingTier.id) {
      setSelectedUser({ ...selectedUser, name: editingTier.name });
    }
    setEditingTier(null);
  };
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleSavePermissions = () => {
    if (!selectedUser) return;
    
    if (selectedUser.employee_id === 'TIER') {
      // Save to Access Tiers in config
      if (!config) return;
      const updatedTiers = (config.accessTiers || []).map(t => 
        t.id === selectedUser.id ? { ...t, permissions: tempPermissions } : t
      );
      handleConfigUpdate('accessTiers', updatedTiers);
      setSelectedUser({ ...selectedUser, pagePermissions: tempPermissions });
      setMessage(`Permissions updated for Access Tier: ${selectedUser.name}`);
    } else {
      // Save to User
      const updatedUser = { ...selectedUser, pagePermissions: tempPermissions };
      mockDb.registerUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser);
      setMessage(`Permissions updated for ${updatedUser.name}`);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleApproveUser = async (user: User, tierId: string) => {
    const tier = config?.accessTiers?.find(t => t.id === tierId);
    const updatedData = { 
      status: 'APPROVED' as const, 
      role: tier?.name || user.role,
      approvedAt: new Date().toISOString()
    };
    
    try {
      await apiService.updateUserStatus(user.id, updatedData);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updatedData } : u));
      setMessage(`User ${user.name} approved with ${tier?.name || 'default'} access.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleRejectUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    try {
      await apiService.updateUserStatus(userId, { status: 'REJECTED' as const });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'REJECTED' as const } : u));
      setMessage(`User ${user.name} access request rejected.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await apiService.updateUserProfile(updatedUser.id, updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setEditingUser(null);
      setMessage(`User ${updatedUser.name} profile updated.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };
  
  const [lineForm, setLineForm] = useState<Partial<LineMapping>>({
    lineId: '', blockId: 'Block-1', floor: '1st Floor', building: 'Unit-01', layoutManpower: 67, blockIncharge: '', remarks: ''
  });

  const [fiveSForm, setFiveSForm] = useState({ key: '', label: '', desc: '' });

  useEffect(() => {
    localStorage.setItem('sdl_gov_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('sdl_gov_config_subtab', configSubTab);
  }, [configSubTab]);

  useEffect(() => {
    localStorage.setItem('sdl_gov_selected_section', selectedSection);
  }, [selectedSection]);

  const refreshAll = useCallback(async () => {
    try {
      const sys = await apiService.getRemoteConfig();
      const userList = await apiService.getUsers();
      
      // Fallback to mock if API returns empty/error (optional, but safer for transition)
      if (Object.keys(sys).length > 0) setConfig(sys);
      else setConfig(mockDb.getSystemConfig());
      
      if (userList && userList.length > 0) setUsers(userList);
      else setUsers(mockDb.getUsers());
    } catch (err) {
      console.error("Failed to fetch data from API, using mock fallback", err);
      setConfig(mockDb.getSystemConfig());
      setUsers(mockDb.getUsers());
    }
  }, []);

  useEffect(() => { 
    refreshAll(); 
  }, [refreshAll]);

  const handleConfigUpdate = useCallback(async (key: keyof SystemConfig, value: any) => {
    setConfig(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [key]: value };
      apiService.saveRemoteConfig(updated).catch(err => console.error("Failed to save config", err));
      mockDb.saveSystemConfig(updated);
      return updated;
    });
  }, []);

  const handleRegisterLine = () => {
    if (!lineForm.lineId || !lineForm.blockId || !config) {
       alert("Line ID and Block ID are mandatory for registry."); return;
    }
    
    const newLine: LineMapping = {
       ...lineForm,
       sectionId: selectedSection,
       lineId: lineForm.lineId!,
       blockId: lineForm.blockId!,
       building: lineForm.building!,
       layoutManpower: lineForm.layoutManpower || 67,
       blockIncharge: lineForm.blockIncharge || '',
       remarks: lineForm.remarks || ''
    } as LineMapping;

    let updatedMappings = [...config.lineMappings];
    
    if (editingLineIndex !== null) {
      const deptLines = config.lineMappings.filter(m => m.sectionId === selectedSection);
      const targetItem = deptLines[editingLineIndex];
      const globalIdx = config.lineMappings.indexOf(targetItem);
      if (globalIdx >= 0) {
          updatedMappings[globalIdx] = newLine;
      }
      setMessage(`Line ${newLine.lineId} technical profile updated.`);
      setEditingLineIndex(null);
    } else {
      updatedMappings.push(newLine);
      setMessage(`Line ${newLine.lineId} committed to Governance Registry.`);
    }

    handleConfigUpdate('lineMappings', updatedMappings);
    setTimeout(() => setMessage(''), 3000);
    
    setLineForm({ lineId: '', blockId: 'Block-1', floor: '1st Floor', building: 'Unit-01', layoutManpower: 67, blockIncharge: '', remarks: '' });
  };

  const handleEditLine = (line: LineMapping, indexInDept: number) => {
    setLineForm(line);
    setEditingLineIndex(indexInDept);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const moveLine = (indexInDept: number, direction: 'up' | 'down') => {
    if (!config) return;
    const deptLines = config.lineMappings.filter(m => m.sectionId === selectedSection);
    const targetIdxInDept = direction === 'up' ? indexInDept - 1 : indexInDept + 1;
    if (targetIdxInDept >= 0 && targetIdxInDept < deptLines.length) {
      const item1 = deptLines[indexInDept];
      const item2 = deptLines[targetIdxInDept];
      const globalIdx1 = config.lineMappings.indexOf(item1);
      const globalIdx2 = config.lineMappings.indexOf(item2);
      const newGlobalMappings = [...config.lineMappings];
      [newGlobalMappings[globalIdx1], newGlobalMappings[globalIdx2]] = [newGlobalMappings[globalIdx2], newGlobalMappings[globalIdx1]];
      handleConfigUpdate('lineMappings', newGlobalMappings);
    }
  };

  const handleHRUpdate = (type: keyof HRReasons, value: string[]) => {
    if (!config) return;
    const currentHR = config.hrReasons[selectedSection] || { absent: [], late: [], turnover: [], leave: [], halfDay: [] };
    const updatedHR = { ...currentHR, [type]: value };
    handleConfigUpdate('hrReasons', { ...config.hrReasons, [selectedSection]: updatedHR });
  };

  const handleQualityUpdate = (type: keyof QualityIssueConfig, value: string[]) => {
    if (!config) return;
    const currentIssues = config.qualityIssues[selectedSection] || { defects: [], rejects: [] };
    const updatedIssues = { ...currentIssues, [type]: value };
    handleConfigUpdate('qualityIssues', { ...config.qualityIssues, [selectedSection]: updatedIssues });
  };

  const handleUpdateUserInTable = (userId: string, field: string, value: any) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const updatedUser = { ...user, [field]: value };
    mockDb.registerUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
  };

  if (!config) return null;

  const currentHR = config.hrReasons[selectedSection] || { absent: [], late: [], turnover: [], leave: [], halfDay: [] };
  const currentQuality = config.qualityIssues[selectedSection] || { defects: [], rejects: [] };
  const currentDeptLines = config.lineMappings.filter(m => m.sectionId === selectedSection);
  const current5S = config.fiveSQuestions[selectedSection] || [];

  return (
    <div className="space-y-8 pb-20 max-w-[1900px] mx-auto animate-in fade-in duration-700 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-4 rounded-[2rem] text-white shadow-xl border-4 border-slate-800"><ShieldAlert size={28} /></div>
          <div>
            <h1 className="text-4xl font-[1000] tracking-tighter uppercase italic leading-none text-slate-900">GOVERNANCE</h1>
            <p className="text-slate-400 font-black uppercase text-[9px] tracking-[0.3em] mt-1.5">Enterprise Logistical Configuration</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 shadow-sm gap-1.5">
           {['APPROVALS', 'PERMISSIONS', 'CONFIG'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-8 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
           ))}
        </div>
      </div>

      {activeTab === 'CONFIG' && (
        <div className="space-y-8">
           <div className="bg-white p-2 rounded-[3rem] border border-slate-100 shadow-sm overflow-x-auto custom-scrollbar no-print">
              <div className="flex items-center gap-1 min-w-max">
                {['SIGNUP', 'BUYER HUB', 'LINES', 'HR', 'QUALITY', 'NPT', 'OT', '5S STANDARDS', 'SKILL CONFIG', 'PLANNING', 'DIAGNOSTICS'].map(tab => (
                  <button key={tab} onClick={() => { setConfigSubTab(tab); setEditingLineIndex(null); refreshAll(); }} className={`px-12 py-3.5 rounded-full text-[11px] font-[1000] uppercase tracking-tighter transition-all ${configSubTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>{tab}</button>
                ))}
              </div>
           </div>

           <div className="bg-white rounded-[4rem] border-4 border-slate-50 shadow-3xl p-10 min-h-[700px] space-y-10">
              {configSubTab === 'LINES' && (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                   <SectionDropdown label="LINES CONTEXT FOCUS" options={config.sections || []} value={selectedSection} onChange={setSelectedSection} />
                   <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row items-end gap-6 shadow-inner">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 w-full text-[9px] font-black uppercase text-slate-400">
                         <div className="space-y-1.5"><label className="px-1">LINE ID</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900" placeholder="Line 01" value={lineForm.lineId} onChange={e => setLineForm({...lineForm, lineId: e.target.value})} /></div>
                         <div className="space-y-1.5"><label className="px-1">BLOCK/AREA</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900" placeholder="B-01" value={lineForm.blockId} onChange={e => setLineForm({...lineForm, blockId: e.target.value})} /></div>
                         <div className="space-y-1.5"><label className="px-1">FLOOR</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900" placeholder="1st Floor" value={lineForm.floor} onChange={e => setLineForm({...lineForm, floor: e.target.value})} /></div>
                         <div className="space-y-1.5"><label className="px-1">BUILDING</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900" placeholder="Unit-01" value={lineForm.building} onChange={e => setLineForm({...lineForm, building: e.target.value})} /></div>
                         <div className="space-y-1.5"><label className="px-1 text-blue-600">BGT. MANPOWER</label><input type="number" className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900" value={lineForm.layoutManpower} onChange={e => setLineForm({...lineForm, layoutManpower: parseInt(e.target.value) || 0})} /></div>
                         <div className="space-y-1.5"><label className="px-1 text-indigo-600">BLOCK INCHARGE</label><input className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900" placeholder="Name" value={lineForm.blockIncharge} onChange={e => setLineForm({...lineForm, blockIncharge: e.target.value})} /></div>
                         <div className="space-y-1.5"><label className="px-1">REMARKS</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900" placeholder="Optional" value={lineForm.remarks} onChange={e => setLineForm({...lineForm, remarks: e.target.value})} /></div>
                      </div>
                      <button onClick={handleRegisterLine} className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all flex items-center gap-2 whitespace-nowrap mb-0.5 active:scale-95">
                        {editingLineIndex !== null ? <Check size={14}/> : <Plus size={14}/>} 
                        {editingLineIndex !== null ? 'UPDATE LINE' : 'REGISTER LINE'}
                      </button>
                   </div>
                   <div className="border border-slate-200 overflow-hidden rounded-[2rem] shadow-lg">
                      <table className="w-full text-center border-collapse">
                         <thead>
                            <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-14">
                               <th className="px-4 border-r border-white/10 w-24">ORDER</th>
                               <th className="px-4 border-r border-white/10">LINE IDENTITY</th>
                               <th className="px-4 border-r border-white/10">BLOCK</th>
                               <th className="px-4 border-r border-white/10">BUILDING / FLOOR</th>
                               <th className="px-4 border-r border-white/10">BGT. MANPOWER</th>
                               <th className="px-4 border-r border-white/10">INCHARGE</th>
                               <th className="px-4 border-r border-white/10">REMARKS</th>
                               <th className="px-4 text-right">ACTIONS</th>
                            </tr>
                         </thead>
                         <tbody className="text-xs font-bold text-slate-600 divide-y">
                            {currentDeptLines.map((l, i) => (
                               <tr key={i} className="h-14 hover:bg-slate-50 transition-colors group">
                                  <td className="px-4 border-r border-slate-100">
                                     <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveLine(i, 'up')} className="p-1.5 bg-slate-100 rounded-lg hover:text-indigo-600 hover:bg-white shadow-sm" title="Shift Order Up"><ArrowUp size={14}/></button>
                                        <button onClick={() => moveLine(i, 'down')} className="p-1.5 bg-slate-100 rounded-lg hover:text-indigo-600 hover:bg-white shadow-sm" title="Shift Order Down"><ArrowDown size={14}/></button>
                                     </div>
                                  </td>
                                  <td className="font-black text-indigo-600 uppercase tracking-tighter">{l.lineId}</td>
                                  <td className="uppercase font-black text-[10px] text-slate-400">{l.blockId}</td>
                                  <td className="font-black text-slate-900">{l.building} <span className="text-slate-300 font-normal mx-1">/</span> {l.floor}</td>
                                  <td className="font-black text-slate-900 bg-slate-50/50">{l.layoutManpower}</td>
                                  <td className="uppercase text-[10px] italic">{l.blockIncharge || '--'}</td>
                                  <td className="text-[10px] text-slate-400 font-medium truncate max-w-[150px] px-4">{l.remarks || '--'}</td>
                                  <td className="text-right px-6">
                                     <div className="flex items-center justify-end gap-3">
                                        <button onClick={() => handleEditLine(l, i)} className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all shadow-sm" title="Technical Edit"><Edit size={16}/></button>
                                        <button onClick={() => handleConfigUpdate('lineMappings', config.lineMappings.filter(m => m !== l))} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm" title="Deregister Line"><Trash2 size={16}/></button>
                                     </div>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {configSubTab === 'SIGNUP' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <ListEditor 
                    title="DESIGNATIONS" 
                    icon={BriefcaseBusiness} 
                    items={config.designations || []} 
                    onAdd={(v) => handleConfigUpdate('designations', [...(config.designations || []), v])} 
                    onDelete={(i) => handleConfigUpdate('designations', (config.designations || []).filter((_, idx) => idx !== i))} 
                  />
                  <ListEditor 
                    title="DEPARTMENTS" 
                    icon={Building} 
                    items={config.departments || []} 
                    onAdd={(v) => handleConfigUpdate('departments', [...(config.departments || []), v])} 
                    onDelete={(i) => handleConfigUpdate('departments', (config.departments || []).filter((_, idx) => idx !== i))} 
                  />
                  <ListEditor 
                    title="SECTIONS" 
                    icon={Layers} 
                    items={config.sections || []} 
                    onAdd={(v) => handleConfigUpdate('sections', [...(config.sections || []), v])} 
                    onDelete={(i) => handleConfigUpdate('sections', (config.sections || []).filter((_, idx) => idx !== i))} 
                  />
                </div>
              )}

              {configSubTab === 'BUYER HUB' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                  <ListEditor 
                    title="BUYER REGISTRY" 
                    icon={SquareUser} 
                    items={config.buyers || []} 
                    onAdd={(v) => handleConfigUpdate('buyers', [...(config.buyers || []), v])} 
                    onDelete={(i) => handleConfigUpdate('buyers', (config.buyers || []).filter((_, idx) => idx !== i))} 
                  />
                  <ListEditor 
                    title="PRODUCT CATEGORIES" 
                    icon={Tag} 
                    items={config.productCategories || []} 
                    onAdd={(v) => handleConfigUpdate('productCategories', [...(config.productCategories || []), v])} 
                    onDelete={(i) => handleConfigUpdate('productCategories', (config.productCategories || []).filter((_, idx) => idx !== i))} 
                  />
                </div>
              )}

              {configSubTab === 'HR' && (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                   <SectionDropdown label="HR REASONS CONTEXT FOCUS" options={config.sections || []} value={selectedSection} onChange={setSelectedSection} />
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                      <ListEditor 
                        title="ABSENT REASONS" 
                        icon={UserX} 
                        items={currentHR.absent || []} 
                        onAdd={(v) => handleHRUpdate('absent', [...(currentHR.absent || []), v])} 
                        onDelete={(i) => handleHRUpdate('absent', (currentHR.absent || []).filter((_, idx) => idx !== i))} 
                      />
                      <ListEditor 
                        title="LEAVE REASONS" 
                        icon={Calendar} 
                        items={currentHR.leave || []} 
                        onAdd={(v) => handleHRUpdate('leave', [...(currentHR.leave || []), v])} 
                        onDelete={(i) => handleHRUpdate('leave', (currentHR.leave || []).filter((_, idx) => idx !== i))} 
                      />
                      <ListEditor 
                        title="TURNOVER REASONS" 
                        icon={RefreshCcw} 
                        items={currentHR.turnover || []} 
                        onAdd={(v) => handleHRUpdate('turnover', [...(currentHR.turnover || []), v])} 
                        onDelete={(i) => handleHRUpdate('turnover', (currentHR.turnover || []).filter((_, idx) => idx !== i))} 
                      />
                      <ListEditor 
                        title="LATE REASONS" 
                        icon={Clock} 
                        items={currentHR.late || []} 
                        onAdd={(v) => handleHRUpdate('late', [...(currentHR.late || []), v])} 
                        onDelete={(i) => handleHRUpdate('late', (currentHR.late || []).filter((_, idx) => idx !== i))} 
                      />
                      <ListEditor 
                        title="HALF DAY REASONS" 
                        icon={Timer} 
                        items={currentHR.halfDay || []} 
                        onAdd={(v) => handleHRUpdate('halfDay', [...(currentHR.halfDay || []), v])} 
                        onDelete={(i) => handleHRUpdate('halfDay', (currentHR.halfDay || []).filter((_, idx) => idx !== i))} 
                      />
                   </div>
                </div>
              )}

              {configSubTab === 'QUALITY' && (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                   <SectionDropdown label="QUALITY ISSUES CONTEXT FOCUS" options={config.sections || []} value={selectedSection} onChange={setSelectedSection} />
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <ListEditor 
                        title={`${selectedSection.toUpperCase()} DEFECT TYPES`} 
                        icon={ShieldX} 
                        items={currentQuality.defects || []} 
                        onAdd={(v) => handleQualityUpdate('defects', [...(currentQuality.defects || []), v])} 
                        onDelete={(i) => handleQualityUpdate('defects', (currentQuality.defects || []).filter((_, idx) => idx !== i))} 
                        placeholder="Add new defect type..." 
                      />
                      <ListEditor 
                        title={`${selectedSection.toUpperCase()} REJECTION CATEGORIES`} 
                        icon={AlertOctagon} 
                        items={currentQuality.rejects || []} 
                        onAdd={(v) => handleQualityUpdate('rejects', [...(currentQuality.rejects || []), v])} 
                        onDelete={(i) => handleQualityUpdate('rejects', (currentQuality.rejects || []).filter((_, idx) => idx !== i))} 
                        placeholder="Add new rejection category..." 
                      />
                   </div>
                </div>
              )}

              {configSubTab === 'NPT' && (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                   <SectionDropdown label="DOWNTIME MATRIX FOCUS" options={config.sections || []} value={selectedSection} onChange={setSelectedSection} />
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {['QUALITY', 'CUTTING', 'UTILITY', 'ELECTRICAL', 'PLANNING', 'MAINTENANCE', 'CAD_SAMPLE', 'PRODUCTION'].map(unit => (
                         <ListEditor 
                            key={unit} 
                            title={`${unit}`} 
                            icon={Monitor} 
                            items={config.nptConfig[selectedSection]?.[unit] || []} 
                            onAdd={(v) => {
                               const current = config.nptConfig[selectedSection] || {};
                               const unitItems = current[unit] || [];
                               handleConfigUpdate('nptConfig', { ...config.nptConfig, [selectedSection]: { ...current, [unit]: [...unitItems, v] } });
                            }} 
                            onDelete={(i) => {
                               const current = config.nptConfig[selectedSection] || {};
                               const unitItems = current[unit] || [];
                               handleConfigUpdate('nptConfig', { ...config.nptConfig, [selectedSection]: { ...current, [unit]: unitItems.filter((_, idx) => idx !== i) } });
                            }} 
                            placeholder="New loss reason..." 
                         />
                      ))}
                   </div>
                </div>
              )}

              {configSubTab === 'OT' && (
                 <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                    <SectionDropdown label="OT POLICY FOCUS" options={config.sections || []} value={selectedSection} onChange={setSelectedSection} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                       <ListEditor 
                          title="OT REQUISITION REASONS" 
                          icon={Clock} 
                          items={config.otReasons || []} 
                          onAdd={(v) => handleConfigUpdate('otReasons', [...(config.otReasons || []), v])} 
                          onDelete={(i) => handleConfigUpdate('otReasons', (config.otReasons || []).filter((_, idx) => idx !== i))} 
                          placeholder="New policy reason..." 
                       />
                       <OTMappingEditor 
                          reasons={config.otReasons || []} 
                          departments={config.departments || []} 
                          mapping={config.otMapping || {}} 
                          onMappingChange={(m) => handleConfigUpdate('otMapping', m)} 
                       />
                    </div>
                 </div>
              )}

              {configSubTab === 'SKILL CONFIG' && (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Skill Appraisal Configuration</h2>
                   <SkillConfigEditor config={config.appraisalConfigs || []} onUpdate={(c) => handleConfigUpdate('appraisalConfigs', c)} />
                </div>
              )}

              {configSubTab === '5S STANDARDS' && (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                   <SectionDropdown label="5S AUDIT MATRIX FOCUS" options={config.sections || []} value={selectedSection} onChange={setSelectedSection} />
                   <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-8 shadow-inner">
                      <div className="flex items-center gap-4 text-purple-600 border-b border-purple-100 pb-4">
                         <Sparkles size={32} />
                         <h3 className="text-2xl font-black uppercase tracking-tight">Define 5S Standards Matrix</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Question Key</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold" placeholder="e.g. S1-SORT" value={fiveSForm.key} onChange={e => setFiveSForm({...fiveSForm, key: e.target.value})} /></div>
                         <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Standard Question</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold" placeholder="e.g. Is floor clear of debris?" value={fiveSForm.label} onChange={e => setFiveSForm({...fiveSForm, label: e.target.value})} /></div>
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Requirement Detail</label>
                            <div className="flex gap-3">
                               <input className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold" placeholder="Reference standard..." value={fiveSForm.desc} onChange={e => setFiveSForm({...fiveSForm, desc: e.target.value})} />
                               <button onClick={() => { if(!fiveSForm.key || !fiveSForm.label) return; const updated = [...current5S, { ...fiveSForm }]; handleConfigUpdate('fiveSQuestions', { ...config.fiveSQuestions, [selectedSection]: updated }); setFiveSForm({ key: '', label: '', desc: '' }); }} className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition-all shadow-lg active:scale-95"><Plus size={24}/></button>
                            </div>
                         </div>
                      </div>
                      <div className="border border-slate-200 overflow-hidden rounded-[2rem] shadow-xl bg-white">
                         <table className="w-full text-left border-collapse">
                            <thead><tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-12"><th className="px-6 border-r border-white/10 w-32">KEY</th><th className="px-6 border-r border-white/10">VISUAL STANDARD QUESTION</th><th className="px-6 border-r border-white/10">IE COMPLIANCE DESC</th><th className="px-6 text-center w-24">ACTION</th></tr></thead>
                            <tbody className="text-xs font-bold text-slate-700 divide-y">
                               {current5S.map((q, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                     <td className="px-6 py-4 font-black text-purple-600">{q.key}</td>
                                     <td className="px-6 py-4">{q.label}</td>
                                     <td className="px-6 py-4 text-slate-400 italic text-[10px]">{q.desc}</td>
                                     <td className="px-6 py-4 text-center"><button onClick={() => { const updated = current5S.filter((_, i) => i !== idx); handleConfigUpdate('fiveSQuestions', { ...config.fiveSQuestions, [selectedSection]: updated }); }} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button></td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </div>
              )}

              {configSubTab === 'PLANNING' && (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                   <SectionDropdown label="PLANNING STRATEGY FOCUS" options={config.sections || []} value={selectedSection} onChange={setSelectedSection} />
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between h-[500px] shadow-2xl relative overflow-hidden group">
                         <Calculator size={150} className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                         <div className="space-y-6 relative z-10"><div className="p-4 bg-blue-600 rounded-2xl w-fit shadow-lg"><Gauge size={28}/></div><h3 className="text-2xl font-[1000] uppercase italic tracking-tighter leading-tight">Projected<br/>Capacity Hub</h3></div>
                         <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-2"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Total Factory Daily Capacity</p><p className="text-4xl font-[1000] text-center tracking-tighter tabular-nums">42,500 <span className="text-xs">PCS</span></p></div>
                      </div>
                      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between h-[500px]">
                         <div className="space-y-6"><div className="p-4 bg-orange-50 text-orange-600 rounded-2xl w-fit group-hover:rotate-6 transition-transform"><Calendar size={28}/></div><h3 className="text-xl font-[1000] text-slate-800 uppercase italic tracking-tighter leading-tight">Lead Time<br/>Matrix Configuration</h3></div>
                         <div className="flex items-center justify-between pt-6 border-t border-slate-50"><span className="text-[11px] font-black text-orange-600 uppercase">Manage Profiles</span><ArrowRight size={18} className="text-slate-300"/></div>
                      </div>
                   </div>
                </div>
              )}

              {configSubTab === 'DIAGNOSTICS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-bottom-4 duration-500">
                   <div className="bg-slate-900 rounded-[4rem] p-12 border-4 border-slate-800 shadow-3xl space-y-8 group">
                      <div className="flex items-center gap-6"><div className="p-4 bg-white/5 rounded-[2rem] text-blue-400 border border-white/10 group-hover:scale-110 transition-all"><Download size={32}/></div><h3 className="text-3xl font-[1000] text-white uppercase italic">SYSTEM EXPORT</h3></div>
                      <button onClick={() => { const blob = new Blob([JSON.stringify(config, null, 2)], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `sdl_config_${new Date().toISOString().split('T')[0]}.json`; a.click(); }} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95"><Download size={20}/> GENERATE GLOBAL BACKUP</button>
                   </div>
                   <div className="bg-white rounded-[4rem] p-12 border-4 border-indigo-50 shadow-3xl space-y-8 group">
                      <div className="flex items-center gap-6"><div className="p-4 bg-indigo-50 rounded-[2rem] text-indigo-600 border border-indigo-100 group-hover:scale-110 transition-all"><RefreshCcw size={32}/></div><h3 className="text-xl font-[1000] text-slate-900 uppercase italic leading-none">FACTORY RESET CONFIG</h3></div>
                      <button onClick={() => { if(confirm("Are you sure? This will wipe all governance configuration.")) { mockDb.repairSystemConfig(); window.location.reload(); } }} className="w-full bg-rose-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase shadow-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 active:scale-95"><RefreshCcw size={20}/> REPAIR SYSTEM REGISTRY</button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'APPROVALS' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><ListChecks size={24}/></div>
                    <div>
                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Governance-Approvals</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage Pending & Approved Users</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowPasswords(!showPasswords)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                        showPasswords ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
                    </button>
                 </div>
              </div>

              <div className="space-y-12">
                {/* Pending Table */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pending Requests</h4>
                    <span className="px-4 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {users.filter(u => u.status === 'PENDING').length} Pending
                    </span>
                  </div>
                  <div className="border border-slate-200 overflow-x-auto rounded-[2rem] shadow-lg">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-12">
                          <th className="px-6">USER IDENTITY</th>
                          <th className="px-6">CONTACT & SECURITY</th>
                          <th className="px-6">ORGANIZATION</th>
                          <th className="px-6">REGISTRATION INFO</th>
                          <th className="px-6">ACCESS ROLE</th>
                          <th className="px-6 text-center">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-bold text-slate-700 divide-y">
                        {users.filter(u => u.status === 'PENDING').map(user => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="font-black text-slate-900 uppercase">{user.name}</p>
                                <p className="text-[10px] text-slate-400">ID: {user.employee_id}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="text-slate-600">{user.email}</p>
                                <p className="text-slate-400 text-[10px]">{user.mobileNumber}</p>
                                <p className="font-mono text-blue-600">
                                  {showPasswords ? user.password : '••••••••'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="grid grid-cols-2 gap-2 w-64">
                                <select 
                                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black uppercase outline-none focus:border-blue-500"
                                  value={user.department}
                                  onChange={(e) => handleUpdateUserInTable(user.id, 'department', e.target.value)}
                                >
                                  {config.departments?.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <select 
                                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black uppercase outline-none focus:border-blue-500"
                                  value={user.designation}
                                  onChange={(e) => handleUpdateUserInTable(user.id, 'designation', e.target.value)}
                                >
                                  {config.designations?.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <select 
                                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black uppercase outline-none focus:border-blue-500"
                                  value={user.section}
                                  onChange={(e) => handleUpdateUserInTable(user.id, 'section', e.target.value)}
                                >
                                  <option value="">No Section</option>
                                  {config.sections?.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select 
                                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black uppercase outline-none focus:border-blue-500"
                                  value={user.area}
                                  onChange={(e) => handleUpdateUserInTable(user.id, 'area', e.target.value)}
                                >
                                  <option value="">No Area</option>
                                  {Array.from(new Set(config.lineMappings.map(m => m.blockId))).map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-500 uppercase">Registered At:</p>
                                <p className="text-[10px] font-black text-slate-900">
                                  {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <select 
                                className="w-full bg-blue-50 border-2 border-blue-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-blue-900 outline-none focus:border-blue-500 transition-all"
                                value={selectedTiers[user.id] || config.accessTiers?.[0]?.id || ''}
                                onChange={(e) => setSelectedTiers(prev => ({ ...prev, [user.id]: e.target.value }))}
                              >
                                {config.accessTiers?.map(tier => (
                                  <option key={tier.id} value={tier.id}>{tier.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleApproveUser(user, selectedTiers[user.id] || config.accessTiers?.[0]?.id || '')}
                                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectUser(user.id)}
                                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                  <ShieldX size={16}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {users.filter(u => u.status === 'PENDING').length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-20 text-center text-slate-300 italic">No pending requests found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Approved Table */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Approved Users Registry</h4>
                    <span className="px-4 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {users.filter(u => u.status === 'APPROVED').length} Active
                    </span>
                  </div>
                  <div className="border border-slate-200 overflow-x-auto rounded-[2rem] shadow-lg">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-12">
                          <th className="px-6">USER IDENTITY</th>
                          <th className="px-6">CONTACT & SECURITY</th>
                          <th className="px-6">ORGANIZATION</th>
                          <th className="px-6">ACCESS ROLE</th>
                          <th className="px-6">TIMESTAMPS</th>
                          <th className="px-6 text-center">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-bold text-slate-700 divide-y">
                        {users.filter(u => u.status === 'APPROVED').map(user => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="font-black text-slate-900 uppercase">{user.name}</p>
                                <p className="text-[10px] text-slate-400">ID: {user.employee_id}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="text-slate-600">{user.email}</p>
                                <p className="text-slate-400 text-[10px]">{user.mobileNumber}</p>
                                <p className="font-mono text-blue-600">
                                  {showPasswords ? user.password : '••••••••'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="uppercase text-slate-900">{user.department} / {user.designation}</p>
                                <p className="text-[10px] text-slate-400 uppercase">{user.section || 'No Section'} - {user.area || 'No Area'}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Shield size={14} className="text-emerald-600" />
                                <span className="font-black text-slate-900 uppercase">{user.role}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1 text-[10px]">
                                <p className="text-slate-400 uppercase">Reg: <span className="text-slate-900">{user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</span></p>
                                <p className="text-slate-400 uppercase">App: <span className="text-emerald-600">{user.approvedAt ? new Date(user.approvedAt).toLocaleString() : 'N/A'}</span></p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => setEditingUser(user)}
                                className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              >
                                <Edit size={18}/>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {users.filter(u => u.status === 'APPROVED').length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-20 text-center text-slate-300 italic">No approved users found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'PERMISSIONS' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar: Access Groups & Users */}
            <div className="w-full lg:w-80 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col min-h-[400px] lg:h-[800px]">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-6 mb-6">
                <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg"><ShieldX size={24}/></div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Access Control</h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
                {/* Access Tiers (Groups) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Tiers (Groups)</p>
                    <button 
                      onClick={() => {
                        const newTier = {
                          id: `tier-${Date.now()}`,
                          name: 'New Access Tier',
                          description: 'Description of the tier',
                          permissions: { ...INITIAL_PERMISSIONS }
                        };
                        handleConfigUpdate('accessTiers', [...(config.accessTiers || []), newTier]);
                      }}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {config.accessTiers?.map(tier => (
                      <div key={tier.id} className="group/tier-item relative">
                        <button 
                          onClick={() => {
                            setSelectedUser({
                              id: tier.id,
                              name: tier.name,
                              employee_id: 'TIER',
                              department: 'SYSTEM',
                              designation: 'TIER',
                              mobileNumber: '',
                              status: 'APPROVED',
                              role: 'TIER',
                              pagePermissions: tier.permissions
                            });
                            setTempPermissions(tier.permissions);
                          }}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border-2 ${
                            selectedUser?.id === tier.id 
                              ? 'bg-indigo-50 border-indigo-200 shadow-md' 
                              : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-100'
                          }`}
                        >
                          <div className={`p-2 rounded-xl ${selectedUser?.id === tier.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <Zap size={12} />
                          </div>
                          <div className="text-left overflow-hidden flex-1">
                            <p className={`text-[10px] font-black uppercase tracking-tight truncate ${selectedUser?.id === tier.id ? 'text-indigo-900' : 'text-slate-900'}`}>{tier.name}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{tier.description}</p>
                          </div>
                        </button>
                        
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/tier-item:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditTier(tier); }}
                            className="p-1.5 bg-white shadow-sm rounded-lg text-slate-400 hover:text-blue-600 border border-slate-100"
                          >
                            <Edit size={10} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTier(tier.id); }}
                            className="p-1.5 bg-white shadow-sm rounded-lg text-slate-400 hover:text-rose-600 border border-slate-100"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Users Registry */}
                <div className="space-y-4">
                  <div className="px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User Registry</p>
                  </div>
                  <div className="space-y-2">
                    {users.filter(u => u.status === 'APPROVED').map(user => (
                      <button 
                        key={user.id} 
                        onClick={() => {
                          setSelectedUser(user);
                          setTempPermissions(user.pagePermissions || { ...INITIAL_PERMISSIONS });
                        }}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border-2 ${
                          selectedUser?.id === user.id 
                            ? 'bg-blue-50 border-blue-200 shadow-md' 
                            : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-100'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${selectedUser?.id === user.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          <Users size={12} />
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className={`text-[10px] font-black uppercase tracking-tight truncate ${selectedUser?.id === user.id ? 'text-blue-900' : 'text-slate-900'}`}>{user.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{user.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content: Access Control Matrix */}
            <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col min-h-[600px] lg:h-[800px] overflow-hidden">
              {selectedUser ? (
                <div className="flex flex-col lg:flex-row h-full">
                  {/* Module Categories Sidebar */}
                  <div className="w-full lg:w-64 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-row lg:flex-col p-4 lg:p-6 space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-hidden">
                    <div className="hidden lg:block mb-6 px-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module Groups</p>
                    </div>
                    {PERMISSION_STRUCTURE.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActivePermissionCategory(cat.id)}
                        className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 lg:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          activePermissionCategory === cat.id
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'text-slate-400 hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        <cat.icon size={14} />
                        <span className="whitespace-nowrap">{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Permissions Grid */}
                  <div className="flex-1 flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl shadow-lg text-white ${selectedUser.employee_id === 'TIER' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                          {selectedUser.employee_id === 'TIER' ? <Zap size={24}/> : <Lock size={24}/>}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            {selectedUser.employee_id === 'TIER' ? 'Tier Configuration' : 'Access Control Matrix'}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {selectedUser.employee_id === 'TIER' ? 'Configuring Profile: ' : 'Configuring User: '} {selectedUser.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {selectedUser.employee_id !== 'TIER' && (
                          <div className="relative group">
                            <select 
                              className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-[9px] font-black text-slate-900 outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none uppercase tracking-widest pr-10"
                              onChange={(e) => {
                                const tier = config.accessTiers?.find(t => t.id === e.target.value);
                                if (tier) {
                                  setTempPermissions(tier.permissions);
                                }
                              }}
                            >
                              <option value="">Apply Tier Template...</option>
                              {config.accessTiers?.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        )}
                        <button 
                          onClick={handleSavePermissions}
                          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all flex items-center gap-2 active:scale-95"
                        >
                          <Save size={14}/> {selectedUser.employee_id === 'TIER' ? 'Update Tier' : 'Save Permissions'}
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white">
                      <div className="space-y-4">
                        {PERMISSION_STRUCTURE.find(c => c.id === activePermissionCategory) && (
                          <PermissionNode 
                            node={PERMISSION_STRUCTURE.find(c => c.id === activePermissionCategory)} 
                            permissions={tempPermissions} 
                            onToggle={(key, val) => setTempPermissions(prev => ({ ...prev, [key]: val ? 'DATA_ENTRY' : 'NONE' }))}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-6">
                  <div className="p-8 bg-slate-50 rounded-full border-4 border-dashed border-slate-100">
                    <ShieldAlert size={64} className="opacity-20" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">No Selection</h3>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Select a tier or user from the sidebar to manage permissions</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {message && <div className="fixed bottom-12 right-12 p-8 bg-emerald-600 text-white rounded-[2.5rem] shadow-4xl font-black z-[600] animate-in slide-in-from-right-10 border-4 border-white"><CheckCircle size={32}/> {message}</div>}

      {/* Edit Tier Modal */}
      {editingTier && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Edit Access Tier</h3>
                <button onClick={() => setEditingTier(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tier Name</label>
                  <input 
                    type="text"
                    value={editingTier.name}
                    onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:border-blue-500 transition-all"
                    placeholder="e.g. Production Manager"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                  <textarea 
                    value={editingTier.description}
                    onChange={(e) => setEditingTier({ ...editingTier, description: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:border-blue-500 transition-all h-32 resize-none"
                    placeholder="Describe the access level..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setEditingTier(null)}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveTierInfo}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-4xl border border-white/20 p-12 space-y-10 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-xl"><Edit size={32}/></div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit User Profile</h2>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Updating: {editingUser.name}</p>
                    </div>
                 </div>
                 <button onClick={() => setEditingUser(null)} className="p-4 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><X size={32}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto px-4 custom-scrollbar">
                 {[
                   { label: 'Full Name', key: 'name', type: 'text' },
                   { label: 'Employee ID', key: 'employee_id', type: 'text' },
                   { label: 'Email Address', key: 'email', type: 'email' },
                   { label: 'Mobile Number', key: 'mobileNumber', type: 'text' },
                   { label: 'Password', key: 'password', type: 'text' },
                   { label: 'Department', key: 'department', type: 'select', options: config.departments },
                   { label: 'Designation', key: 'designation', type: 'select', options: config.designations },
                   { label: 'Section', key: 'section', type: 'select', options: config.sections },
                   { label: 'Area', key: 'area', type: 'select', options: Array.from(new Set(config.lineMappings.map(m => m.blockId))) },
                   { label: 'Access Role', key: 'role', type: 'select', options: config.accessTiers?.map(t => t.name) },
                 ].map(field => (
                   <div key={field.key} className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          value={(editingUser as any)[field.key] || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, [field.key]: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 text-sm font-black text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none uppercase tracking-tight"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type={field.type}
                          value={(editingUser as any)[field.key] || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, [field.key]: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 text-sm font-black text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none uppercase tracking-tight"
                        />
                      )}
                   </div>
                 ))}
              </div>

              <div className="pt-8 border-t border-slate-50 flex gap-4">
                 <button 
                   onClick={() => setEditingUser(null)}
                   className="flex-1 py-6 rounded-3xl text-sm font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={() => handleUpdateUser(editingUser)}
                   className="flex-[2] py-6 bg-slate-900 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95"
                 >
                    Update Profile
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
