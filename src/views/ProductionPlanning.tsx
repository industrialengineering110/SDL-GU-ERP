import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Calendar, Plus, X, Search, Box, ChevronDown, Hash, Target, Save, CheckCircle, 
  Info, Trash2, Scissors, Boxes, Layers, Clock, TrendingUp, 
  Calculator, User as UserIcon, Tag, AlertCircle, AlertTriangle, CalendarDays, Ship, 
  FileBarChart, ArrowUpRight, BarChart3, PieChart, Activity, 
  LayoutGrid, ChevronLeft, ChevronRight, List, RefreshCcw, Droplets, 
  FlaskConical, Gauge, Repeat, Shirt, GripVertical, Check, ArrowRight, ArrowLeft, MousePointer2, Flame,
  FileText, ClipboardList, InfoIcon, LayoutList, Edit3, Settings2, Filter, Copy, Move,
  History as HistoryIcon, Palette, SquareCheck, CheckSquare, Square, Trash, Settings, 
  Database, Kanban, Waves, BarChart, LayoutDashboard, GripHorizontal, Lock, Layout as LayoutIcon,
  CircleCheck, AlertCircle as AlertIcon, ListTodo
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { 
  StyleInfo, StyleConfirmation, AppUser, StylePlan, StyleConfirmationVariant, SectionMilestone 
} from '../types';
import Logo from '../components/Logo';

type PlanningTab = 'SUMMARY' | 'REGISTRY' | 'MASTER' | 'WASH' | 'REPORT';

// --- HELPERS ---
const isFriday = (dateStr: string) => {
  if (!dateStr) return false;
  return new Date(dateStr).getDay() === 5;
};

// Normalize dates to midnight to avoid hour-based width calculation errors
const normalizeDate = (date: Date | string) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const countWorkingDays = (startStr: string, endStr: string) => {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  let count = 0;
  let cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() !== 5) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const addWorkingDays = (startStr: string, days: number) => {
    if (!startStr || days <= 0) return startStr;
    let date = new Date(startStr);
    let count = 0;
    // If only 1 day needed, it starts and ends on the same day
    if (days <= 1) return startStr;
    
    while (count < days - 1) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() !== 5) {
            count++;
        }
    }
    return date.toISOString().split('T')[0];
};

const getDaysArray = (start: Date, end: Date) => {
    const arr = [];
    for(let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        arr.push(new Date(dt));
    }
    return arr;
};

const checkOverlap = (plan: StylePlan, allPlans: StylePlan[]) => {
  if (!plan.lineId || !plan.sections.Sewing.inputDate || !plan.sections.Sewing.outputDate) return false;
  const startA = normalizeDate(plan.sections.Sewing.inputDate);
  const endA = normalizeDate(plan.sections.Sewing.outputDate);

  return allPlans.some(p => {
    if (p.id === plan.id || p.lineId !== plan.lineId) return false;
    const startB = normalizeDate(p.sections.Sewing.inputDate);
    const endB = normalizeDate(p.sections.Sewing.outputDate);
    return startA <= endB && startB <= endA;
  });
};

// --- COMPONENTS ---

const StatusCard = React.memo(({ 
  label, 
  icon: Icon, 
  valueKey, 
  dateKey, 
  form, 
  onFormChange 
}: { 
  label: string, 
  icon: any, 
  valueKey: keyof StylePlan, 
  dateKey?: keyof StylePlan,
  form: Partial<StylePlan>,
  onFormChange: (updates: Partial<StylePlan>) => void
}) => {
  const statusVal = form[valueKey] as string;
  const showDateInput = statusVal !== 'In-house';

  return (
    <div className="p-4 bg-white border border-slate-100 rounded-3xl space-y-4 shadow-sm group hover:border-blue-400 transition-all">
       <div className="flex items-center justify-between border-b border-slate-50 pb-2">
          <div className="flex items-center gap-2">
            <Icon size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{label}</span>
          </div>
          <ChevronDown size={14} className="text-slate-300" />
       </div>
       <div className="space-y-3">
          <select 
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black outline-none h-10 cursor-pointer"
            value={statusVal}
            onChange={e => {
              onFormChange({ [valueKey]: e.target.value });
            }}
          >
             <option value="Will Come">Will Come</option>
             <option value="In-house">In-house</option>
             <option value="Shortage">Shortage</option>
          </select>
          {showDateInput && (
            <div className="relative animate-in fade-in slide-in-from-top-1">
              <input 
                type="date" 
                className={`w-full bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-[10px] font-black h-10 outline-none ${dateKey && isFriday(form[dateKey] as string) ? 'text-rose-600' : 'text-slate-900'}`} 
                value={dateKey ? (form[dateKey] as string || '') : ''}
                onChange={e => {
                  if (dateKey) onFormChange({ [dateKey]: e.target.value });
                }}
              />
            </div>
          )}
       </div>
    </div>
  );
});

const SearchableSelect: React.FC<{
  label: string;
  options: string[];
  value: string;
  placeholder: string;
  icon: any;
  onChange: (val: string) => void;
  disabled?: boolean;
}> = ({ label, options, value, placeholder, icon: Icon, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const filtered = options.filter(opt => opt && opt.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`space-y-1 relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black cursor-pointer flex items-center justify-between hover:border-indigo-400 transition-all shadow-sm h-11"
      >
        <div className="flex items-center gap-2 overflow-hidden truncate">
           <Icon size={14} className="text-indigo-400 flex-shrink-0" />
           <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value || placeholder}</span>
        </div>
        <ChevronDown size={14} className="text-slate-300" />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[500] max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1">
           <div className="p-2 border-b border-slate-100 bg-slate-50">
              <input 
                autoFocus
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Filter..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
           </div>
           <div className="overflow-y-auto custom-scrollbar flex-1 max-h-48">
              {filtered.map(opt => (
                <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }} className="px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                   {opt}
                </div>
              ))}
              {filtered.length === 0 && <div className="p-4 text-center text-xs text-slate-400 italic">No matches.</div>}
           </div>
        </div>
      )}
    </div>
  );
};

const MultiSelectInput: React.FC<{ 
  label: string; 
  options: string[]; 
  selected: string[]; 
  onChange: (val: string[]) => void;
  icon: any;
}> = ({ label, options, selected, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
    onChange(next);
  };

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black cursor-pointer flex items-center justify-between hover:border-indigo-400 transition-all shadow-sm h-11"
      >
        <div className="flex gap-1 overflow-hidden truncate">
           <Icon size={14} className="text-indigo-400 mr-1 flex-shrink-0" />
           {selected.length > 0 ? selected.join(', ') : 'Select...'}
        </div>
        <ChevronDown size={14} className="text-slate-300" />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[500] max-h-60 overflow-y-auto custom-scrollbar p-2 animate-in fade-in slide-in-from-top-1">
           {options.map(opt => (
             <div key={opt} onClick={() => toggle(opt)} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected.includes(opt) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'}`}>
                   {selected.includes(opt) && <Check size={10}/>}
                </div>
                <span className="text-[10px] font-bold text-slate-700">{opt}</span>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

const ProductionPlanningView: React.FC<{ currentUser: AppUser, defaultTab?: PlanningTab }> = ({ currentUser, defaultTab }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<PlanningTab>(defaultTab || 'REGISTRY');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as PlanningTab;
    if (tab && ['SUMMARY', 'REGISTRY', 'MASTER', 'WASH', 'REPORT'].includes(tab)) {
      setActiveTab(tab);
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [location.search, defaultTab]);

  const [styles, setStyles] = useState<StyleInfo[]>([]);
  const [confirmations, setConfirmations] = useState<StyleConfirmation[]>([]);
  const [plans, setPlans] = useState<StylePlan[]>([]);
  const [message, setMessage] = useState('');
  
  // HISTORY FILTERS
  const [historyFilters, setHistoryFilters] = useState({ buyer: '', style: '', so: '' });

  // MODAL FOR STATUS PREVIEW
  const [previewPlan, setPreviewPlan] = useState<StylePlan | null>(null);

  // Board timeline configuration
  const timelineStart = new Date('2026-02-01');
  const timelineEnd = new Date('2026-05-31');

  const initialForm: Partial<StylePlan> = {
    buyer: '', styleNumber: '', productCategory: '', soNumber: '', mpo: '', planQuantity: 0, 
    smv: 0, marketingSmv: 0, marketingTop: 0, marketingEff: 0, marketingLines: 1, orderQuantity: 0,
    selectedPos: [], selectedColors: [], manpower: 67, targetEff: 85, workingHours: 10,
    shipmentDate: '', priority: 'NORMAL', lineId: '',
    sampleStatus: 'Will Come', fileHandoverStatus: 'Will Come', fabricStatus: 'Will Come', accessoriesStatus: 'Will Come', printEmbStatus: 'Will Come',
    sewingThreadInhouse: true,
    sections: {
      'Cutting': { inputDate: '', outputDate: '', workingDays: 0, requiredPcsPerDay: 0, status: 'PLANNING' },
      'Sewing': { inputDate: '', outputDate: '', workingDays: 0, requiredPcsPerDay: 0, status: 'PLANNING' },
      'Washing': { inputDate: '', outputDate: '', workingDays: 0, requiredPcsPerDay: 0, status: 'PLANNING' },
      'Finishing': { inputDate: '', outputDate: '', workingDays: 0, requiredPcsPerDay: 0, status: 'PLANNING' }
    }
  };

  const [newPlanForm, setNewPlanForm] = useState<Partial<StylePlan>>(initialForm);

  const refreshPlans = () => {
    setPlans(mockDb.getStylePlans());
    setMessage("Data Synchronized.");
    setTimeout(() => setMessage(''), 2000);
  };

  const handleGlobalSave = () => {
    // This button explicitly "saves" or "commits" the current state of all plans (for Master Board context)
    plans.forEach(p => mockDb.saveStylePlan(p));
    setMessage("Factory Allocation Matrix Committed.");
    setTimeout(() => setMessage(''), 3000);
  };

  useEffect(() => {
    setStyles(mockDb.getStyles());
    setConfirmations(mockDb.getStyleConfirmations());
    setPlans(mockDb.getStylePlans());
  }, []);

  const config = mockDb.getSystemConfig();
  const allLines = config.lineMappings.filter(m => m.sectionId === 'Sewing');

  useEffect(() => {
    if (newPlanForm.lineId) {
      const lineConfig = config.lineMappings.find(m => m.lineId === newPlanForm.lineId);
      if (lineConfig) {
        setNewPlanForm(prev => ({
          ...prev,
          manpower: lineConfig.layoutManpower || 67
        }));
      }
    }
  }, [newPlanForm.lineId, config.lineMappings]);

  const activeSOData = useMemo(() => confirmations.find(c => c.soNumber === newPlanForm.soNumber), [confirmations, newPlanForm.soNumber]);
  
  useEffect(() => {
    if (activeSOData) {
      const selectedVariants = activeSOData.variants.filter(v => 
        (newPlanForm.selectedPos?.length === 0 || newPlanForm.selectedPos?.includes(v.po)) &&
        (newPlanForm.selectedColors?.length === 0 || newPlanForm.selectedColors?.includes(v.color))
      );
      const orderQty = selectedVariants.reduce((s,v) => s + v.quantity, 0);
      setNewPlanForm(prev => {
          if (prev.orderQuantity === orderQty) return prev;
          return {
            ...prev,
            orderQuantity: orderQty,
            planQuantity: prev.planQuantity || Math.round(orderQty * 1.05)
          };
      });
    }
  }, [newPlanForm.selectedPos, newPlanForm.selectedColors, activeSOData]);

  // Total Quantity already planned for this SO + Style (excluding current if editing)
  const alreadyPlannedQtyTotal = useMemo(() => {
     if (!newPlanForm.soNumber || !newPlanForm.styleNumber) return 0;
     return plans
        .filter(p => p.id !== newPlanForm.id && p.soNumber === newPlanForm.soNumber && p.styleNumber === newPlanForm.styleNumber)
        .reduce((sum, p) => sum + p.planQuantity, 0);
  }, [plans, newPlanForm.soNumber, newPlanForm.styleNumber, newPlanForm.id]);

  const remainingQtyToPlan = Math.max(0, (newPlanForm.orderQuantity || 0) - alreadyPlannedQtyTotal);
  const isOverPlanned = (newPlanForm.planQuantity || 0) > Math.round((newPlanForm.orderQuantity || 0) * 1.05) - alreadyPlannedQtyTotal;
  
  const isEligibleForCopy = alreadyPlannedQtyTotal + (newPlanForm.planQuantity || 0) < (newPlanForm.orderQuantity || 0);

  const perDayProduction = useMemo(() => {
    const eff = newPlanForm.targetEff || 0;
    const mp = newPlanForm.manpower || 67; 
    const hrs = newPlanForm.workingHours || 10; 
    const smv = newPlanForm.smv || 1; 
    if (!eff || !smv || mp === 0) return 0;
    return Math.round(((eff / 100) * mp * hrs * 60) / smv);
  }, [newPlanForm.targetEff, newPlanForm.smv, newPlanForm.workingHours, newPlanForm.manpower]);

  const handleUpdateSection = (section: string, field: keyof SectionMilestone, val: any) => {
    setNewPlanForm(prev => {
        const sections = { ...prev.sections };
        const current = { ...sections[section], [field]: val };
        
        if (section === 'Sewing' && field === 'inputDate' && val) {
            // Guard: If capacity is 0, we can't calculate end date
            const capacity = perDayProduction;
            if (capacity > 0) {
              const daysNeeded = Math.ceil((prev.planQuantity || 0) / capacity);
              current.outputDate = addWorkingDays(val, daysNeeded);
              current.workingDays = daysNeeded;
              current.requiredPcsPerDay = capacity;
            } else {
              // Reset if no capacity
              current.outputDate = '';
              current.workingDays = 0;
              current.requiredPcsPerDay = 0;
            }
        } else if (field === 'inputDate' || field === 'outputDate') {
            if (current.inputDate && current.outputDate) {
                current.workingDays = countWorkingDays(current.inputDate, current.outputDate);
                current.requiredPcsPerDay = current.workingDays > 0 ? Math.ceil((prev.planQuantity || 0) / current.workingDays) : 0;
            }
        }
        
        sections[section] = current;
        return { ...prev, sections };
    });
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newPlanForm.buyer || !newPlanForm.styleNumber || !newPlanForm.planQuantity) {
        alert("Buyer, Style and Quantity are mandatory."); return;
    }

    const planToSave: StylePlan = {
      ...initialForm,
      ...newPlanForm,
      id: newPlanForm.id || `PLAN-${Date.now()}`,
      status: 'ACTIVE',
      isComplete: !!(newPlanForm.sections!['Sewing']?.inputDate && newPlanForm.sections!['Sewing']?.outputDate && newPlanForm.fabricStatus === 'In-house'),
      timestamp: new Date().toISOString()
    } as StylePlan;

    mockDb.saveStylePlan(planToSave);
    setPlans(mockDb.getStylePlans());
    setNewPlanForm(initialForm);
    setMessage("Registry Committed Successfully.");
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCopyPlan = () => {
    if (!newPlanForm.id) return;
    
    const clonedPlan: StylePlan = {
      ...newPlanForm,
      id: `PLAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      lineId: '', 
      isComplete: false,
      timestamp: new Date().toISOString(),
      sections: { ...newPlanForm.sections } 
    } as StylePlan;

    mockDb.saveStylePlan(clonedPlan);
    setPlans(mockDb.getStylePlans());
    setMessage("Plan duplicated to Backlog.");
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm("Are you sure you want to delete this plan record?")) {
        await mockDb.deleteStylePlan(id);
        setPlans(mockDb.getStylePlans());
        setMessage("Plan record deleted.");
        setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEditPlan = (plan: StylePlan) => {
    setPreviewPlan(null);
    const meta = styles.find(s => s.styleNumber === plan.styleNumber);
    const updatedPlan = {
      ...plan,
      productCategory: plan.productCategory || meta?.productCategory || 'N/A',
      marketingSmv: plan.marketingSmv || meta?.marketingSmv || 0,
      marketingTop: plan.marketingTop || meta?.marketingTop || 0,
      marketingEff: plan.marketingEff || meta?.marketingEfficiency || 0,
      marketingLines: plan.marketingLines || meta?.lineConsideration || 1,
    };

    setNewPlanForm(updatedPlan);
    setActiveTab('REGISTRY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDragStart = (e: React.DragEvent, plan: StylePlan) => {
    if (!plan.isComplete) {
      e.preventDefault();
      alert("Validation Rejected: Only Complete (Green) styles can be moved to the Execution Board.");
      return;
    }
    e.dataTransfer.setData('planId', plan.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnLine = (e: React.DragEvent, targetLineId: string) => {
    e.preventDefault();
    const planId = e.dataTransfer.getData('planId');
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const lineConfig = config.lineMappings.find(m => m.lineId === targetLineId);
    const newManpower = lineConfig?.layoutManpower || 67;
    const newPerDay = Math.round(((plan.targetEff / 100) * newManpower * plan.workingHours * 60) / plan.smv);
    
    // Safety guard for bar duration
    const capacity = newPerDay || 1;
    const daysNeeded = Math.ceil(plan.planQuantity / capacity);
    const newOutputDate = addWorkingDays(plan.sections.Sewing.inputDate, daysNeeded);

    const updatedPlan: StylePlan = { 
        ...plan, 
        lineId: targetLineId,
        manpower: newManpower,
        sections: {
            ...plan.sections,
            Sewing: {
                ...plan.sections.Sewing,
                outputDate: newOutputDate,
                workingDays: daysNeeded,
                requiredPcsPerDay: newPerDay
            }
        }
    };
    
    // Immediate update for UI responsiveness
    setPlans(prev => prev.map(p => p.id === plan.id ? updatedPlan : p));
  };

  const handleDropInBacklog = (e: React.DragEvent) => {
    e.preventDefault();
    const planId = e.dataTransfer.getData('planId');
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const updatedPlan: StylePlan = { ...plan, lineId: '' };
    setPlans(prev => prev.map(p => p.id === plan.id ? updatedPlan : p));
  };

  const timelineDays = useMemo(() => getDaysArray(timelineStart, timelineEnd), []);
  const cellWidth = 32;

  const monthsHeader = useMemo(() => {
    const headers: { month: string, width: number }[] = [];
    let currentMonth = "";
    let currentWidth = 0;
    
    timelineDays.forEach(day => {
        const m = day.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (m !== currentMonth) {
            if (currentMonth !== "") headers.push({ month: currentMonth, width: currentWidth });
            currentMonth = m;
            currentWidth = cellWidth;
        } else {
            currentWidth += cellWidth;
        }
    });
    headers.push({ month: currentMonth, width: currentWidth });
    return headers;
  }, [timelineDays]);

  const filteredHistory = useMemo(() => {
    return plans.filter(p => {
        return (!historyFilters.buyer || p.buyer.toLowerCase().includes(historyFilters.buyer.toLowerCase())) &&
               (!historyFilters.style || p.styleNumber.toLowerCase().includes(historyFilters.style.toLowerCase())) &&
               (!historyFilters.so || p.soNumber.toLowerCase().includes(historyFilters.so.toLowerCase()));
    });
  }, [plans, historyFilters]);

  // Logic to calculate progress in modal
  const getSectionProgress = (plan: StylePlan, section: string) => {
    const allProd = mockDb.getProduction(section);
    const actual = allProd
        .filter(p => p.soNumber === plan.soNumber && p.styleCode === plan.styleNumber)
        .reduce((s, r) => s + r.actual, 0);
    const progress = Math.min((actual / plan.planQuantity) * 100, 100);
    return { actual, progress, rest: Math.max(0, plan.planQuantity - actual) };
  };

  const handleStatusUpdate = (updates: Partial<StylePlan>) => {
    setNewPlanForm(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="flex flex-col h-screen -m-8 bg-[#f4f7fe] overflow-hidden font-inter relative">
      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar relative z-10">
           {activeTab === 'REGISTRY' && (
              <div className="max-w-[1700px] mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                 <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl p-10 space-y-10">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                       <div className="flex items-center gap-4">
                          <button onClick={() => setActiveTab('MASTER')} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm hover:shadow-md">
                             <ArrowLeft size={20} />
                          </button>
                          <Logo size={32} showText={false} className="opacity-40" />
                          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Plan Registry Terminal</h2>
                       </div>
                       <LayoutGrid size={32} className="text-emerald-500 opacity-80" />
                    </div>

                    <form onSubmit={handleSavePlan} className="space-y-10">
                       <div className="grid grid-cols-8 gap-4">
                          <SearchableSelect label="Buyer Group" icon={UserIcon} options={Array.from(new Set(confirmations.map(c => c.buyer))).sort()} value={newPlanForm.buyer || ''} placeholder="Search Buyer..." onChange={val => setNewPlanForm({...initialForm, buyer: val})} />
                          <SearchableSelect label="SO Identification" icon={Hash} options={confirmations.filter(c => c.buyer === newPlanForm.buyer).map(c => c.soNumber)} value={newPlanForm.soNumber || ''} placeholder="Search SO..." disabled={!newPlanForm.buyer} onChange={val => setNewPlanForm(prev => ({ ...prev, soNumber: val, styleNumber: '' }))} />
                          <SearchableSelect label="Style Reference" icon={Tag} options={confirmations.filter(c => c.soNumber === newPlanForm.soNumber).map(c => c.styleNumber)} value={newPlanForm.styleNumber || ''} placeholder="Search Style..." disabled={!newPlanForm.soNumber} onChange={val => {
                             const meta = styles.find(s => s.styleNumber === val);
                             setNewPlanForm(prev => ({ 
                               ...prev, 
                               styleNumber: val, 
                               productCategory: meta?.productCategory || '',
                               smv: meta?.smv || 0, 
                               marketingSmv: meta?.marketingSmv || 0, 
                               marketingTop: meta?.marketingTop || 0, 
                               marketingEff: meta?.marketingEfficiency || 0, 
                               marketingLines: meta?.lineConsideration || 1,
                               targetEff: meta?.marketingEfficiency || 85 
                             }));
                          }} />
                          <MultiSelectInput label="PO" icon={Hash} options={activeSOData ? Array.from(new Set(activeSOData.variants.map(v => v.po))) : []} selected={newPlanForm.selectedPos || []} onChange={v => setNewPlanForm({...newPlanForm, selectedPos: v})} />
                          <MultiSelectInput label="Color" icon={Palette} options={activeSOData ? Array.from(new Set(activeSOData.variants.map(v => v.color))) : []} selected={newPlanForm.selectedColors || []} onChange={v => setNewPlanForm({...newPlanForm, selectedColors: v})} />
                          
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Order Qty</label>
                             <div className="relative">
                                <input readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-base font-black text-slate-600 h-11" value={newPlanForm.orderQuantity?.toLocaleString() || '0'} />
                                <span className="text-[7px] font-black text-blue-500 absolute right-2 -bottom-4 uppercase">Rem: {remainingQtyToPlan.toLocaleString()}</span>
                             </div>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Plan Qty</label>
                             <input type="number" className={`w-full border rounded-xl px-4 py-2.5 text-base font-black h-11 outline-none transition-all bg-[#fffce6] ${isOverPlanned ? 'border-rose-400 text-rose-600' : 'border-slate-200 focus:border-indigo-600'}`} value={newPlanForm.planQuantity || ''} onChange={e => setNewPlanForm({...newPlanForm, planQuantity: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Shipment Date</label>
                             <input type="date" className="w-full border border-slate-200 bg-[#fffce6] rounded-xl px-4 py-2.5 text-[10px] font-black h-11 outline-none" value={newPlanForm.shipmentDate} onChange={e => setNewPlanForm({...newPlanForm, shipmentDate: e.target.value})} />
                          </div>
                       </div>

                       <div className="grid grid-cols-10 gap-4 items-center px-4 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                          <div className="text-center space-y-1">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Product Type</p>
                             <p className="text-xs font-black text-indigo-600 uppercase truncate px-1">{newPlanForm.productCategory || 'N/A'}</p>
                          </div>
                          <div className="text-center space-y-1">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mkt SMV</p>
                             <p className="text-xl font-black text-slate-900">{newPlanForm.marketingSmv?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div className="text-center space-y-1">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mkt Top</p>
                             <p className="text-xl font-black text-slate-900">{newPlanForm.marketingTop || '0'}</p>
                          </div>
                          <div className="text-center space-y-1 border-r border-slate-200 pr-2">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mkt Eff</p>
                             <p className="text-xl font-black text-slate-900">{newPlanForm.marketingEff?.toFixed(1) || '0.0'}%</p>
                          </div>
                          <div className="text-center space-y-1 border-r border-slate-200 pr-4">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Master Lines</p>
                             <p className="text-xl font-black text-slate-900">{newPlanForm.marketingLines || 1}</p>
                          </div>
                          <div className="col-span-1 space-y-1 pl-2">
                             <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest px-1">Plan Line</label>
                             <select className="w-full bg-white border-2 border-blue-100 rounded-xl px-2 py-2 text-[10px] font-black outline-none h-10 shadow-sm" value={newPlanForm.lineId} onChange={e => setNewPlanForm({...newPlanForm, lineId: e.target.value})}>
                                <option value="">Select...</option>
                                {allLines.map(l => <option key={l.lineId} value={l.lineId}>{l.lineId}</option>)}
                             </select>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Manpower</label>
                             <div className="relative flex items-center h-10 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                                <input readOnly type="number" className="w-full text-center text-xs font-black outline-none bg-transparent text-slate-500 cursor-not-allowed" value={newPlanForm.manpower} />
                                <span className="bg-slate-200 text-[8px] font-black text-slate-500 px-1 h-full flex items-center">MP</span>
                             </div>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Work HR</label>
                             <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-black h-10 text-center outline-none shadow-sm" value={newPlanForm.workingHours} onChange={e => setNewPlanForm({...newPlanForm, workingHours: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Plan Eff%</label>
                             <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-black h-10 text-center outline-none shadow-sm" value={newPlanForm.targetEff} onChange={e => setNewPlanForm({...newPlanForm, targetEff: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="text-center bg-white rounded-2xl p-2 border border-emerald-100 shadow-lg h-20 flex flex-col justify-center min-w-[90px]">
                             <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1 italic">PCS/DAY</p>
                             <p className="text-2xl font-black text-emerald-600 tracking-tighter">{perDayProduction.toLocaleString()}</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-5 gap-6">
                          <StatusCard label="FABRIC" icon={Scissors} valueKey="fabricStatus" dateKey="fabricDate" form={newPlanForm} onFormChange={handleStatusUpdate} />
                          <StatusCard label="ACCESSORIES" icon={Boxes} valueKey="accessoriesStatus" dateKey="accessoriesDate" form={newPlanForm} onFormChange={handleStatusUpdate} />
                          <StatusCard label="PRINT/EMB" icon={Activity} valueKey="printEmbStatus" dateKey="printEmbDate" form={newPlanForm} onFormChange={handleStatusUpdate} />
                          <StatusCard label="SAMPLE" icon={Shirt} valueKey="sampleStatus" dateKey="sampleDate" form={newPlanForm} onFormChange={handleStatusUpdate} />
                          <StatusCard label="FILE HANDOVER" icon={FileText} valueKey="fileHandoverStatus" dateKey="fileHandoverDate" form={newPlanForm} onFormChange={handleStatusUpdate} />
                       </div>

                       <div className="space-y-4">
                          <div className="flex items-center gap-3 px-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Section Sequencing (Working Days exclude Friday)</p>
                          </div>
                          <div className="grid grid-cols-4 gap-6">
                             {['Cutting', 'Sewing', 'Washing', 'Finishing'].map(sec => {
                                const meta = newPlanForm.sections![sec];
                                const isSewing = sec === 'Sewing';
                                return (
                                   <div key={sec} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-6">
                                      <h4 className="text-xs font-black text-slate-900 uppercase italic tracking-tighter border-b border-slate-50 pb-2">{sec}</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                         <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Start</label>
                                            <input type="date" className={`w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-[9px] font-black h-9 outline-none ${isFriday(meta.inputDate) ? 'text-rose-600' : 'text-slate-900'}`} value={meta.inputDate} onChange={e => handleUpdateSection(sec, 'inputDate', e.target.value)} />
                                         </div>
                                         <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">End</label>
                                            <input 
                                              type="date" 
                                              readOnly={isSewing}
                                              className={`w-full border border-slate-100 rounded-xl px-2 py-2 text-[9px] font-black h-9 outline-none ${isFriday(meta.outputDate) ? 'text-rose-600' : 'text-slate-900'} ${isSewing ? 'bg-slate-100 cursor-not-allowed opacity-70' : 'bg-slate-50'}`} 
                                              value={meta.outputDate} 
                                              onChange={e => !isSewing && handleUpdateSection(sec, 'outputDate', e.target.value)} 
                                            />
                                         </div>
                                      </div>
                                      <div className="flex justify-between items-center pt-2">
                                         <div><p className="text-[7px] font-black text-slate-400 uppercase">W.Days</p><p className="text-xl font-black text-slate-900">{meta.workingDays || 0}</p></div>
                                         <div className="text-right"><p className="text-[7px] font-black text-slate-400 uppercase">Req Pcs/D</p><p className="text-xl font-black text-emerald-600">{meta.requiredPcsPerDay?.toLocaleString() || 0}</p></div>
                                      </div>
                                   </div>
                                );
                             })}
                          </div>
                       </div>

                       <div className="flex justify-end pt-4 gap-4">
                          {newPlanForm.id && isEligibleForCopy && (
                            <button type="button" onClick={handleCopyPlan} className="bg-indigo-50 text-indigo-600 px-10 py-5 rounded-[2rem] font-[1000] text-sm uppercase shadow-sm hover:bg-indigo-100 transition-all active:scale-95 flex items-center gap-4"><Copy size={20}/> Copy Plan</button>
                          )}
                          <button type="submit" disabled={isOverPlanned} className={`bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-[1000] text-sm uppercase shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-4 ${isOverPlanned ? 'opacity-30 cursor-not-allowed' : ''}`}><Save size={20}/> Commit Master Registry</button>
                       </div>
                    </form>
                 </div>

                 {/* MASTER REGISTRY HISTORY TABLE */}
                 <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                       <h3 className="text-sm font-black text-slate-900 uppercase">Master Registry History</h3>
                       <div className="flex flex-wrap gap-2">
                          <input className="bg-white border border-slate-200 rounded-xl px-4 py-1.5 text-[10px] font-bold outline-none w-32" placeholder="Filter Buyer..." value={historyFilters.buyer} onChange={e => setHistoryFilters({...historyFilters, buyer: e.target.value})} />
                          <input className="bg-white border border-slate-200 rounded-xl px-4 py-1.5 text-[10px] font-bold outline-none w-32" placeholder="Filter Style..." value={historyFilters.style} onChange={e => setHistoryFilters({...historyFilters, style: e.target.value})} />
                          <input className="bg-white border border-slate-200 rounded-xl px-4 py-1.5 text-[10px] font-bold outline-none w-32" placeholder="Filter SO#..." value={historyFilters.so} onChange={e => setHistoryFilters({...historyFilters, so: e.target.value})} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center ml-2">{filteredHistory.length} Allocated Records</span>
                       </div>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-12">
                                <th className="px-6 border-r border-white/10">Buyer/SO/Style</th>
                                <th className="px-4 border-r border-white/10 text-center">Plan Line</th>
                                <th className="px-4 border-r border-white/10 text-center">Plan Qty</th>
                                <th className="px-4 border-r border-white/10 text-center">Mkt SMV</th>
                                <th className="px-4 border-r border-white/10 text-center">Fabric</th>
                                <th className="px-4 border-r border-white/10 text-center">Acc.</th>
                                <th className="px-4 border-r border-white/10 text-center">Sewing</th>
                                <th className="px-4 border-r border-white/10 text-center">Finishing</th>
                                <th className="px-4 border-r border-white/10 text-right">Shipment</th>
                                <th className="px-6 text-center">Actions</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                             {filteredHistory.slice().reverse().map(p => (
                                <tr key={p.id} className="hover:bg-blue-50 transition-colors h-14 cursor-pointer group">
                                   <td className="px-6 py-4" onClick={() => setPreviewPlan(p)}>
                                      <p className="text-xs font-black text-slate-900">{p.buyer}</p>
                                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">#{p.soNumber} / {p.styleNumber}</p>
                                   </td>
                                   <td className="px-4 py-4 text-center" onClick={() => setPreviewPlan(p)}>
                                      <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase ${p.lineId ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                         {p.lineId || 'Unassigned'}
                                      </span>
                                   </td>
                                   <td className="px-4 py-4 text-center font-black text-slate-900" onClick={() => setPreviewPlan(p)}>{p.planQuantity.toLocaleString()}</td>
                                   <td className="px-4 py-4 text-center text-slate-400" onClick={() => setPreviewPlan(p)}>{p.marketingSmv?.toFixed(2) || '0.00'}</td>
                                   <td className="px-4 py-4 text-center" onClick={() => setPreviewPlan(p)}><span className={`text-[8px] font-black uppercase ${p.fabricStatus === 'In-house' ? 'text-emerald-50' : 'text-rose-50'} ${p.fabricStatus === 'In-house' ? 'text-emerald-600' : 'text-rose-600'} border ${p.fabricStatus === 'In-house' ? 'border-emerald-100' : 'border-rose-100'} px-2 py-0.5 rounded-lg`}>{p.fabricStatus}</span></td>
                                   <td className="px-4 py-4 text-center" onClick={() => setPreviewPlan(p)}><span className={`text-[8px] font-black uppercase ${p.accessoriesStatus === 'In-house' ? 'text-emerald-50' : 'text-rose-50'} ${p.accessoriesStatus === 'In-house' ? 'text-emerald-600' : 'text-rose-600'} border ${p.accessoriesStatus === 'In-house' ? 'border-emerald-100' : 'border-rose-100'} px-2 py-0.5 rounded-lg`}>{p.accessoriesStatus}</span></td>
                                   <td className="px-4 py-4 text-center" onClick={() => setPreviewPlan(p)}>
                                      <p className="text-[10px] font-black text-slate-900">{p.sections.Sewing.inputDate || '**'}</p>
                                      <p className="text-[7px] font-bold text-slate-400">{p.sections.Sewing.workingDays}d @ {p.sections.Sewing.requiredPcsPerDay}</p>
                                   </td>
                                   <td className="px-4 py-4 text-center" onClick={() => setPreviewPlan(p)}>
                                      <p className="text-[10px] font-black text-slate-900">{p.sections.Finishing.outputDate || '**'}</p>
                                      <p className="text-[7px] font-bold text-slate-400">{p.sections.Finishing.workingDays}d @ {p.sections.Finishing.requiredPcsPerDay}</p>
                                   </td>
                                   <td className="px-4 py-4 text-right font-black text-rose-600 text-xs" onClick={() => setPreviewPlan(p)}>{p.shipmentDate || '--'}</td>
                                   <td className="px-6 py-4 text-center">
                                      <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(p.id); }} className="p-2 text-slate-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">
                                         <Trash2 size={16}/>
                                      </button>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'MASTER' && (
              <div className="space-y-8 animate-in fade-in duration-700 h-[calc(100vh-12rem)] flex flex-col">
                 <div className="flex items-center justify-between px-4 shrink-0">
                    <div>
                        <h3 className="text-4xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Factory Allocation Matrix</h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Live Technical Gantt Board</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveTab('REGISTRY')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 border-b-4 border-indigo-900">
                           <Plus size={20}/> Initialize Plan
                        </button>
                        <button onClick={refreshPlans} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-indigo-600 transition-all shadow-md active:scale-95"><RefreshCcw size={20}/></button>
                        <button onClick={handleGlobalSave} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-3 border-b-4 border-emerald-900">
                           <Save size={20}/> Commit Board State
                        </button>
                    </div>
                 </div>

                 <div className="flex gap-6 flex-1 overflow-hidden">
                    {/* BACKLOG COLUMN */}
                    <div className="w-[320px] shrink-0 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl flex flex-col overflow-hidden" onDragOver={e => e.preventDefault()} onDrop={handleDropInBacklog}>
                       <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 italic">Registry Backlog</h4>
                          <span className="text-[9px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full shadow-lg">{plans.filter(p => !p.lineId).length} RECORDS</span>
                       </div>
                       <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
                          {plans.filter(p => !p.lineId).map(p => (
                            <div 
                                key={p.id} 
                                draggable={p.isComplete} 
                                onDragStart={e => handleDragStart(e, p)} 
                                onClick={() => p.isComplete ? setPreviewPlan(p) : handleEditPlan(p)} 
                                className={`p-5 rounded-3xl border-2 shadow-sm transition-all group relative active:scale-95 ${
                                    p.isComplete 
                                    ? 'bg-white border-emerald-500 hover:border-emerald-600 cursor-grab' 
                                    : 'bg-white border-rose-500 hover:border-rose-600 cursor-pointer border-dashed'
                                }`}
                            >
                               <div className="flex justify-between items-start mb-4">
                                  <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg shadow-sm ${p.isComplete ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>{p.buyer}</span>
                                  {p.isComplete ? <GripVertical size={16} className="text-emerald-300" /> : <Lock size={16} className="text-rose-300" />}
                               </div>
                               <h5 className="text-lg font-black text-slate-900 uppercase truncate leading-none mb-2">{p.styleNumber}</h5>
                               <p className="text-[10px] font-bold text-blue-600 uppercase">SO: #{p.soNumber}</p>
                               {!p.isComplete && <p className="text-[8px] font-black text-rose-500 mt-2 uppercase flex items-center gap-1"><AlertCircle size={10}/> Action Required: Click to Edit</p>}
                               <div className="flex justify-between items-end mt-6 pt-4 border-t border-black/5">
                                  <div className="flex flex-col">
                                     <p className="text-[8px] font-black text-slate-400 uppercase">Qty</p>
                                     <p className="text-sm font-black text-slate-700">{p.planQuantity.toLocaleString()}</p>
                                  </div>
                                  <div className="flex flex-col items-end">
                                     <p className="text-[8px] font-black text-slate-400 uppercase">Shipment</p>
                                     <p className={`text-[10px] font-black ${isFriday(p.shipmentDate) ? 'text-rose-600' : 'text-slate-900'}`}>{p.shipmentDate || 'TBD'}</p>
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* MASTER BOARD */}
                    <div className="flex-1 bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white relative">
                        <div className="flex-1 overflow-auto custom-scrollbar relative bg-[#1a1c22]">
                            <div className="min-w-max">
                                <div className="flex h-12 bg-slate-900 border-b border-white/10 sticky top-0 z-40">
                                    <div className="w-40 border-r border-white/10 flex items-center justify-center bg-slate-900 text-[10px] font-black uppercase tracking-widest sticky left-0 z-50">PRODUCTION UNIT</div>
                                    {monthsHeader.map((m, i) => (
                                        <div key={i} style={{ width: m.width }} className="border-r border-white/10 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em]">{m.month}</div>
                                    ))}
                                </div>
                                <div className="flex h-10 bg-slate-900 border-b border-white/20 sticky top-12 z-30 shadow-2xl">
                                    <div className="w-40 border-r border-white/10 flex items-center justify-center bg-slate-900 text-[8px] font-black uppercase sticky left-0 z-50">CODE IDENTITY</div>
                                    {timelineDays.map((day, i) => {
                                        const fri = day.getDay() === 5;
                                        return (
                                            <div key={i} style={{ width: cellWidth }} className={`border-r border-white/5 flex items-center justify-center text-[10px] font-black transition-colors ${fri ? 'text-rose-400 bg-rose-500/20' : 'text-slate-400'}`}>{day.getDate()}</div>
                                        );
                                    })}
                                </div>
                                <div className="relative">
                                    {allLines.map((line) => (
                                        <div key={line.lineId} className="flex h-16 border-b border-white/5 hover:bg-white/[0.04] transition-colors relative" onDragOver={e => e.preventDefault()} onDrop={e => handleDropOnLine(e, line.lineId)}>
                                            <div className="w-40 border-r border-white/10 flex flex-col items-center justify-center bg-slate-900 sticky left-0 z-20 leading-none italic">
                                                <span className="text-[8px] font-black text-blue-500 opacity-50 uppercase mb-0.5">LINE</span>
                                                <span className="text-4xl font-[1000] text-white tracking-tighter">
                                                    {line.lineId.split(' ')[1]}
                                                </span>
                                            </div>
                                            {timelineDays.map((day, dIdx) => {
                                                const fri = day.getDay() === 5;
                                                return (
                                                    <div key={dIdx} style={{ width: cellWidth }} className={`border-r border-white/[0.03] flex-shrink-0 ${fri ? 'bg-rose-500/5' : ''}`}></div>
                                                );
                                            })}
                                            {plans.filter(p => p.lineId === line.lineId).map(plan => {
                                                if (!plan.sections?.Sewing?.inputDate || !plan.sections?.Sewing?.outputDate) return null;
                                                
                                                // Normalized calculation to avoid hour/minute overlap glitches
                                                const startTs = normalizeDate(plan.sections.Sewing.inputDate);
                                                const endTs = normalizeDate(plan.sections.Sewing.outputDate);
                                                const baseTs = normalizeDate(timelineStart);
                                                
                                                // Validate board range
                                                if (endTs < baseTs || startTs > normalizeDate(timelineEnd)) return null;

                                                const leftOffset = Math.max(0, Math.floor((startTs - baseTs) / (1000 * 3600 * 24))) * cellWidth;
                                                const rawDiffDays = Math.round((endTs - startTs) / (1000 * 3600 * 24));
                                                
                                                // Security guard: Ensure duration is at least 1 and within reasonable bounds
                                                const dayDuration = Math.max(1, Math.min(rawDiffDays + 1, 120)); 
                                                const totalWidth = dayDuration * cellWidth;

                                                const isRed = checkOverlap(plan, plans);
                                                const allInHouse = plan.fabricStatus === 'In-house' && 
                                                                 plan.accessoriesStatus === 'In-house' && 
                                                                 plan.sampleStatus === 'In-house' && 
                                                                 plan.printEmbStatus === 'In-house' && 
                                                                 plan.fileHandoverStatus === 'In-house';

                                                return (
                                                    <div 
                                                        key={plan.id}
                                                        draggable
                                                        onDragStart={e => handleDragStart(e, plan)}
                                                        onClick={() => setPreviewPlan(plan)}
                                                        style={{ left: 160 + leftOffset, width: totalWidth }}
                                                        className={`absolute top-2 bottom-2 rounded-lg shadow-2xl cursor-pointer active:cursor-grabbing group overflow-hidden transition-all hover:scale-[1.02] hover:z-50 border-2 p-2 flex flex-row items-center gap-3 ${
                                                            isRed ? 'bg-rose-600 border-rose-300 animate-pulse' : 
                                                            allInHouse ? 'bg-emerald-600 border-emerald-300' : 'bg-[#eab308] border-yellow-200'
                                                        }`}
                                                    >
                                                        <div className="flex flex-row items-center gap-3 flex-1 min-w-0">
                                                            <p className="text-[10px] font-black uppercase truncate tracking-tighter text-white/90 border-r border-white/20 pr-2 shrink-0">{plan.buyer}</p>
                                                            <p className="text-[11px] font-[1000] text-white leading-tight uppercase truncate flex-1">{plan.styleNumber}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0 border-l border-white/20 pl-2">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[8px] font-black uppercase text-white/60 leading-none">{plan.planQuantity.toLocaleString()}</span>
                                                                <span className="text-[7px] font-black text-white/40">D{plan.sections.Sewing.workingDays}</span>
                                                            </div>
                                                            <GripHorizontal size={12} className="text-white/40" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'SUMMARY' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl space-y-6 group hover:-translate-y-1 transition-all">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Active Load</p>
                    <p className="text-7xl font-black tracking-tighter text-slate-900 tabular-nums leading-none group-hover:scale-105 transition-transform">{plans.reduce((s,p)=>s+p.planQuantity, 0).toLocaleString()}</p>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] pt-4 border-t border-slate-50">UNITS COMMITTED TO REGISTRY</p>
                 </div>
                 <div className="bg-slate-900 p-12 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-all">
                    <Activity size={200} className="absolute -right-10 -bottom-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest relative z-10">Factory Utilization</p>
                    <div className="space-y-6 relative z-10">
                        <p className="text-7xl font-black text-emerald-400 tracking-tighter">84.2%</p>
                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{width: '84.2%'}}></div>
                        </div>
                    </div>
                 </div>
                 <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col justify-between group hover:border-blue-400 hover:-translate-y-1 transition-all">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Efficiency Status</p>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sewing</span><p className="text-4xl font-black text-blue-600">88.1%</p></div>
                       <div className="space-y-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Washing</span><p className="text-4xl font-black text-cyan-500">72.4%</p></div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-3 text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-pulse"><ArrowUpRight size={16}/> +2.1% Weekly Growth</div>
                 </div>
              </div>
           )}
      </main>

      {/* STATUS PREVIEW MODAL */}
      {previewPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-8 bg-slate-900 text-white flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-indigo-600 text-[10px] font-black uppercase px-3 py-1 rounded-lg">LIVE TECHNICAL STATUS</span>
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">LINE: {previewPlan.lineId || 'UNASSIGNED'}</span>
                        </div>
                        <h2 className="text-4xl font-[1000] tracking-tighter uppercase italic leading-tight">{previewPlan.styleNumber}</h2>
                        <p className="text-indigo-400 font-black uppercase text-xs tracking-widest">{previewPlan.buyer} • SO: #{previewPlan.soNumber}</p>
                    </div>
                    <button onClick={() => setPreviewPlan(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-all"><X size={32}/></button>
                </div>

                <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Plan Target</p>
                            <p className="text-3xl font-[1000] text-slate-900">{previewPlan.planQuantity.toLocaleString()}</p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col items-center">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Achievement</p>
                            <p className="text-3xl font-[1000] text-emerald-600">
                                {mockDb.getProduction('Sewing')
                                    .filter(p => p.soNumber === previewPlan.soNumber && p.styleCode === previewPlan.styleNumber)
                                    .reduce((s, r) => s + r.actual, 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 flex flex-col items-center">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Global Rest Qty</p>
                            <p className="text-3xl font-[1000] text-rose-600">
                                {Math.max(0, previewPlan.planQuantity - mockDb.getProduction('Sewing')
                                    .filter(p => p.soNumber === previewPlan.soNumber && p.styleCode === previewPlan.styleNumber)
                                    .reduce((s, r) => s + r.actual, 0)).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <ListTodo size={20} className="text-indigo-600" />
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Section-wise Execution Analysis</h4>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase italic">Source: QC Output Terminals</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['Cutting', 'Sewing', 'Washing', 'Finishing'].map(section => {
                                const prog = getSectionProgress(previewPlan, section);
                                const sectionColor = section === 'Cutting' ? 'bg-orange-500' : section === 'Sewing' ? 'bg-blue-600' : section === 'Washing' ? 'bg-cyan-500' : 'bg-emerald-500';
                                
                                return (
                                    <div key={section} className="bg-slate-50/50 border border-slate-100 p-6 rounded-[2.5rem] space-y-4 shadow-sm group hover:bg-white hover:border-blue-200 transition-all">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{section} Floor Flow</p>
                                            <span className="text-[10px] font-[1000] text-indigo-600">{prog.progress.toFixed(1)}%</span>
                                        </div>
                                        
                                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                            <div 
                                                className={`h-full ${sectionColor} transition-all duration-1000 shadow-lg group-hover:scale-y-110`} 
                                                style={{ width: `${prog.progress}%` }}
                                            ></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="text-center">
                                                <p className="text-[8px] font-black text-slate-400 uppercase">Actual Pcs</p>
                                                <p className="text-sm font-black text-slate-700">{prog.actual.toLocaleString()}</p>
                                            </div>
                                            <div className="text-center border-l border-slate-200">
                                                <p className="text-[8px] font-black text-slate-400 uppercase">Rest Pcs</p>
                                                <p className="text-sm font-black text-rose-500">{prog.rest.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
                    <button 
                        onClick={() => handleEditPlan(previewPlan)}
                        className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        <Edit3 size={20}/> Modify Allocation
                    </button>
                    <button 
                        onClick={() => setPreviewPlan(null)}
                        className="flex-1 bg-white border-2 border-slate-200 text-slate-400 py-5 rounded-2xl font-black text-sm uppercase hover:bg-slate-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        <CircleCheck size={20}/> Technical OK
                    </button>
                </div>
            </div>
        </div>
      )}

      {message && <div className="fixed bottom-12 right-12 p-8 bg-slate-900 text-white rounded-3xl shadow-4xl font-black z-[1000] animate-in slide-in-from-right-4 border border-indigo-600 flex items-center gap-6"><CheckCircle size={32} className="text-emerald-400" /> <span className="text-2xl uppercase tracking-tighter italic">{message}</span></div>}
    </div>
  );
};

export default ProductionPlanningView;