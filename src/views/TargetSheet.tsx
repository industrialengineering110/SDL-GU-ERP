
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, Search, Calendar, Save, Factory, Clock, Info, 
  TrendingUp, X, LineChart, ChevronDown, Hash, Tag, 
  RefreshCcw, Layers, Zap, CheckCircle, Calculator, Activity,
  FileText, HelpCircle, ArrowUpRight, ArrowDownRight,
  LayoutGrid, ArrowLeft
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { 
  DailyTarget, StyleInfo, BlockConfig, UserRole, 
  AppUser as User, DepartmentType, StyleConfirmation, ManpowerRecord 
} from '../types';

interface TargetSheetProps {
  role: UserRole;
  currentUser?: User;
  department: DepartmentType;
}

const SMV_CURVE_GROUPS = []; // Removed hardcoded groups

const GridSearchableSelect: React.FC<{
  options: string[];
  value: string;
  placeholder: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}> = ({ options, value, placeholder, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-8 px-3 flex items-center justify-between text-[10px] font-[1000] border rounded-lg transition-all cursor-pointer ${disabled ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-white border-slate-300 hover:border-indigo-600 shadow-sm'}`}
      >
        <span className="truncate uppercase">{value || placeholder}</span>
        <ChevronDown size={12} className="flex-shrink-0 text-slate-400" />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-64 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in slide-in-from-top-1 duration-200">
          <div className="p-2 border-b bg-slate-50">
            <input 
              autoFocus
              className="w-full px-3 py-1.5 text-[10px] border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 border-slate-200"
              placeholder="Search library..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-52 overflow-y-auto custom-scrollbar">
            {filtered.map(opt => (
              <div 
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className="px-4 py-2.5 text-[10px] hover:bg-indigo-50 cursor-pointer font-bold text-slate-700 border-b border-slate-50 last:border-0 uppercase"
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TargetSheet: React.FC<TargetSheetProps> = ({ role, currentUser, department }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBlock, setSelectedBlock] = useState('Block-1');
  const [targets, setTargets] = useState<Record<string, DailyTarget>>({});
  const [styleConfirmations, setStyleConfirmations] = useState<StyleConfirmation[]>([]);
  const [styles, setStyles] = useState<StyleInfo[]>([]);
  const [message, setMessage] = useState('');
  const [showCurveTable, setShowCurveTable] = useState(false);

  const config = mockDb.getSystemConfig();
  const blocks = mockDb.getBlocks();
  const isAdmin = role === UserRole.ADMIN;

  const getCurveEfficiency = (smv: number, day: number) => {
    const curveGroups = config.learningCurve[department] || [];
    const group = curveGroups.find(g => smv >= g.min && smv <= g.max);
    if (!group) return 85; 
    const dayIdx = Math.min(Math.max(1, day), 7) - 1;
    return group.curve[dayIdx];
  };

  const calculateTargetPcs = (headCount: number, workingHours: number, efficiency: number, sam: number) => {
    if (sam <= 0) return 0;
    const totalMinutes = headCount * (workingHours * 60);
    return Math.round((totalMinutes * (efficiency / 100)) / sam);
  };

  const lastStylesRef = useRef<string>('');

  useEffect(() => {
    const refreshData = () => {
      const confirmations = mockDb.getStyleConfirmations();
      const styleMaster = mockDb.getStyles();
      
      // Prevent infinite loop by checking if styles actually changed
      const stylesHash = JSON.stringify(styleMaster);
      if (stylesHash !== lastStylesRef.current) {
        lastStylesRef.current = stylesHash;
        setStyles(styleMaster);
      }
      
      setStyleConfirmations(confirmations);

      const allTargets = mockDb.getDailyTargets(department);
      const existingTargets = allTargets.filter(t => t.date === selectedDate);
      const targetMap: Record<string, DailyTarget> = {};
      existingTargets.forEach(t => { targetMap[t.lineId] = t; });

      const blockLines = config.lineMappings.filter(m => m.blockId === selectedBlock && m.sectionId === department);
      
      const yesterday = new Date(selectedDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayTargets = allTargets.filter(t => t.date === yesterdayStr);
      const yesterdayManpower = mockDb.getManpower(department).filter(m => m.date === yesterdayStr);

      const initialTargets: Record<string, DailyTarget> = {};
      blockLines.forEach(line => {
        let t: DailyTarget;
        if (targetMap[line.lineId]) {
          t = { ...targetMap[line.lineId] };
        } else {
          const lineTargets = allTargets
            .filter(t => t.lineId === line.lineId && t.date < selectedDate)
            .sort((a, b) => b.date.localeCompare(a.date));
          
          const lastTarget = lineTargets[0];
          const mpRecord = yesterdayManpower.find(m => m.lineId === line.lineId);
          const prevHeadcount = mpRecord ? mpRecord.headCount : (line.layoutManpower || 67);

          t = {
            id: `temp-${line.lineId}`,
            date: selectedDate,
            department,
            lineId: line.lineId,
            blockId: selectedBlock,
            styleNumber: lastTarget?.styleNumber || '',
            productItem: lastTarget?.productItem || '',
            buyer: lastTarget?.buyer || '',
            sam: lastTarget?.sam || 0,
            outputStartDate: lastTarget?.outputStartDate || selectedDate,
            daysRunning: 1, 
            actualSamEarner: prevHeadcount,
            lineWip: mockDb.getLineWIP(line.lineId, department),
            workingHours: 10,
            headCount: prevHeadcount,
            todayTargetPcs: 0,
            targetEfficiency: 0,
            efficiencyAdjustment: 0,
            mmTopTgtHr: lastTarget?.mmTopTgtHr || 0,
            lineCapacity: 0,
            lineHrPrdn: 0,
            remarks: ''
          };

          const start = new Date(t.outputStartDate);
          const plan = new Date(t.date);
          t.daysRunning = Math.max(1, Math.ceil((plan.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
          
          if (t.sam > 0) {
            t.targetEfficiency = getCurveEfficiency(t.sam, t.daysRunning);
            t.todayTargetPcs = calculateTargetPcs(t.headCount, t.workingHours, t.targetEfficiency, t.sam);
          }
        }

        // Always sync with latest style master data for M&M Top and SAM if style is selected
        if (t.styleNumber) {
          const styleMeta = styleMaster.find(s => s.styleNumber === t.styleNumber);
          if (styleMeta) {
            t.mmTopTgtHr = styleMeta.productionTopTarget;
            t.sam = styleMeta.marketingSmv || styleMeta.smv;
            // Recalculate target pcs based on potentially updated SAM/Efficiency
            if (t.sam > 0) {
              const baseCurveEff = getCurveEfficiency(t.sam, t.daysRunning);
              t.targetEfficiency = Math.max(0, Math.min(100, baseCurveEff + (t.efficiencyAdjustment || 0)));
              t.todayTargetPcs = calculateTargetPcs(t.headCount, t.workingHours, t.targetEfficiency, t.sam);
            }
          }
        }

        // Populate last day metrics
        const lastDayTgt = yesterdayTargets.find(yt => yt.lineId === line.lineId);
        if (lastDayTgt) {
          t.lastDayWorkHr = lastDayTgt.workingHours;
          // If actual hours were different, target should be adjusted
          // But for now we show the target that was set for that day
          t.lastDayTarget = lastDayTgt.todayTargetPcs;
          t.lastDayAchieve = lastDayTgt.actualPcs || 0;
        }
        
        initialTargets[line.lineId] = t;
      });

      setTargets(initialTargets);
    };

    refreshData();
    window.addEventListener('focus', refreshData);
    return () => window.removeEventListener('focus', refreshData);
  }, [selectedDate, selectedBlock, department, styles]); // Added styles to dependencies

  const summaryTotals = useMemo(() => {
    const targetList = Object.values(targets) as DailyTarget[];
    const activeTargets = targetList.filter(t => t.styleNumber && t.buyer);
    
    const totalPcs = activeTargets.reduce((s, t) => s + (t.todayTargetPcs || 0), 0);
    const totalMp = activeTargets.reduce((s, t) => s + (t.headCount || 0), 0);
    const avgEff = activeTargets.length > 0 
      ? activeTargets.reduce((s, t) => s + (t.targetEfficiency || 0), 0) / activeTargets.length 
      : 0;
    
    return {
      totalPcs,
      totalMp,
      avgEff,
      activeCount: activeTargets.length,
      isReady: activeTargets.length > 0
    };
  }, [targets]);

  const groupedLines = useMemo(() => {
    const list = Object.values(targets) as DailyTarget[];
    const sorted = list.sort((a, b) => a.lineId.localeCompare(b.lineId, undefined, { numeric: true }));
    
    const groups: Record<string, DailyTarget[]> = {
      'Governance': [],
      'Config': [],
      'Lines': []
    };
    
    sorted.forEach(t => {
      const mapping = config.lineMappings.find(m => m.lineId === t.lineId);
      const cat = mapping?.category || 'Lines';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });
    
    return groups;
  }, [targets, config.lineMappings]);

  const buyersList = useMemo(() => Array.from(new Set(styleConfirmations.map(c => c.buyer))).sort(), [styleConfirmations]);

  const updateRow = (lineId: string, updates: Partial<DailyTarget>) => {
    const current = targets[lineId];
    if (!current) return;

    const updated = { ...current, ...updates };

    if (updates.styleNumber) {
      const styleMeta = styles.find(s => s.styleNumber === updates.styleNumber);
      if (styleMeta) {
        updated.productItem = styleMeta.productCategory;
        updated.sam = styleMeta.marketingSmv || styleMeta.smv;
        updated.mmTopTgtHr = styleMeta.productionTopTarget;
      }

      // Start Date Logic: If style changes from previous day, reset start date
      const allTargets = mockDb.getDailyTargets(department);
      const lineTargets = allTargets
        .filter(t => t.lineId === lineId && t.date < selectedDate)
        .sort((a, b) => b.date.localeCompare(a.date));
      
      const lastTarget = lineTargets[0];
      if (lastTarget && lastTarget.styleNumber === updates.styleNumber) {
        updated.outputStartDate = lastTarget.outputStartDate;
      } else {
        updated.outputStartDate = selectedDate;
      }
    }

    const start = new Date(updated.outputStartDate);
    const plan = new Date(updated.date);
    updated.daysRunning = Math.max(1, Math.ceil((plan.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

    const baseCurveEff = getCurveEfficiency(updated.sam, updated.daysRunning);
    const adjustment = updated.efficiencyAdjustment || 0;
    updated.targetEfficiency = Math.max(0, Math.min(100, baseCurveEff + adjustment));

    updated.todayTargetPcs = calculateTargetPcs(updated.headCount, updated.workingHours, updated.targetEfficiency, updated.sam);

    setTargets({ ...targets, [lineId]: updated });
  };

  const handleBulkSave = () => {
    const targetValues = Object.values(targets) as DailyTarget[];
    const toSave = targetValues.filter(t => t.styleNumber && t.buyer);
    if (toSave.length === 0) {
        alert("No valid targets (with Style/Buyer) to save.");
        return;
    }
    
    toSave.forEach(t => {
      const record = t.id.startsWith('temp-') ? { ...t, id: `${t.date}-${t.lineId}` } : t;
      mockDb.saveDailyTarget(record);
    });

    setMessage(`Production Matrix committed to Enterprise Ledger.`);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-4 pb-24 max-w-[1950px] mx-auto animate-in fade-in duration-700">
      {/* Matrix Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/ie-activity`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg">
            <Target size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Production Plan Matrix</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <button 
             onClick={() => setShowCurveTable(true)}
             className="bg-white border border-slate-200 text-slate-600 px-6 py-2 rounded-xl font-black text-[9px] uppercase shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95 border-b-2 border-slate-300"
           >
              <HelpCircle size={14}/> Technical Library
           </button>

           <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6 px-6">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Plan Date</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none text-[11px] font-black text-slate-900 focus:ring-0 p-0 cursor-pointer h-5"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="w-px h-6 bg-slate-100"></div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Active Block</span>
                <select 
                  className="bg-transparent border-none text-[11px] font-black text-indigo-600 focus:ring-0 p-0 cursor-pointer h-5"
                  value={selectedBlock}
                  onChange={e => setSelectedBlock(e.target.value)}
                >
                   {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
           </div>
           
           <button 
             onClick={handleBulkSave}
             className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-[1000] text-[10px] uppercase shadow-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2 border-b-4 border-emerald-900"
           >
             <Save size={16}/> Commit Master Plan
           </button>
        </div>
      </div>

      {/* Main Matrix Grid */}
      <div className="bg-white rounded-2xl border border-slate-900 shadow-2xl overflow-hidden mx-2">
        <div className="max-h-[600px] overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1800px]">
            <thead className="sticky top-0 z-30">
              <tr className="bg-slate-900 text-white text-[9px] font-[1000] uppercase tracking-wider h-12">
                <th className="px-3 border-r border-white/10 text-center w-16">Block</th>
                <th className="px-3 border-r border-white/10 text-center w-16">Line</th>
                <th className="px-3 border-r border-white/10 w-60">Buyer</th>
                <th className="px-3 border-r border-white/10 w-60">Style Reference</th>
                <th className="px-3 border-r border-white/10 text-center w-32">Category</th>
                <th className="px-2 border-r border-white/10 text-center w-24">IE SMV</th>
                <th className="px-2 border-r border-white/10 text-center w-32">Start Date</th>
                <th className="px-2 border-r border-white/10 text-center w-16">Day</th>
                <th className="px-2 border-r border-white/10 text-center w-20 bg-blue-900/50">MP</th>
                <th className="px-2 border-r border-white/10 text-center w-24">WIP</th>
                <th className="px-2 border-r border-white/10 text-center w-20 bg-indigo-900/50">Work HR</th>
                <th className="px-2 border-r border-white/10 text-center w-20">Tgt Eff%</th>
                <th className="px-4 border-r border-white/10 text-center w-32 bg-emerald-900/50 text-emerald-400">Target Pcs</th>
                <th className="px-2 border-r border-white/10 text-center w-24 text-amber-400">M&M Top</th>
                <th className="px-2 border-r border-white/10 text-center w-20">Cap</th>
                <th className="px-2 border-r border-white/10 text-center w-20">Prdn/HR</th>
                <th className="px-4 border-r border-white/10 text-center w-24 text-amber-400 bg-slate-800">Eff (+/-)</th>
                <th className="px-2 border-r border-white/10 text-center w-20 bg-slate-800/50">L.Day WH</th>
                <th className="px-2 border-r border-white/10 text-center w-24 bg-slate-800/50">L.Day Tgt</th>
                <th className="px-2 border-r border-white/10 text-center w-24 bg-slate-800/50">L.Day Ach</th>
                <th className="px-4 text-center w-48 bg-slate-800/50">Gap Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
              {Object.entries(groupedLines as Record<string, DailyTarget[]>).map(([category, lines]) => (
                <React.Fragment key={category}>
                  {lines.length > 0 && (
                    <tr className="bg-slate-50/80 h-8">
                      <td colSpan={21} className="px-4 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-y border-slate-200">
                        {category} Block
                      </td>
                    </tr>
                  )}
                  {lines.map((t) => (
                    <tr key={t.lineId} className="hover:bg-blue-50/50 transition-colors h-10">
                      <td className="px-3 border-r border-slate-200 text-center text-[9px] font-black text-slate-300">{t.blockId.replace('Block-', '')}</td>
                      <td className="px-3 border-r border-slate-200 text-center font-[1000] text-sm text-indigo-600 bg-slate-50/50">{t.lineId.replace('Line ', '')}</td>
                      
                      <td className="px-2 border-r border-slate-200">
                        <GridSearchableSelect 
                          options={buyersList} 
                          value={t.buyer} 
                          placeholder="Select Buyer..." 
                          onChange={val => updateRow(t.lineId, { buyer: val })}
                        />
                      </td>

                      <td className="px-2 border-r border-slate-200">
                        <GridSearchableSelect 
                          options={styleConfirmations.filter(c => c.buyer === t.buyer).map(c => c.styleNumber)} 
                          value={t.styleNumber} 
                          placeholder="Select Style..." 
                          disabled={!t.buyer}
                          onChange={val => updateRow(t.lineId, { styleNumber: val })}
                        />
                      </td>

                      <td className="px-2 border-r border-slate-200 text-center text-[9px] font-black text-slate-400 uppercase truncate">{t.productItem || '--'}</td>
                      <td className="px-2 border-r border-slate-200 text-center font-mono text-indigo-600 text-xs tracking-tighter">{t.sam?.toFixed(3) || '0.000'}</td>
                      
                      <td className="px-2 border-r border-slate-200 text-center">
                        <input 
                          type="date" 
                          className="bg-transparent border-none text-[10px] font-black text-slate-900 p-0 focus:ring-0 w-full text-center h-full"
                          value={t.outputStartDate}
                          onChange={e => updateRow(t.lineId, { outputStartDate: e.target.value })}
                        />
                      </td>

                      <td className="px-2 border-r border-slate-200 text-center bg-slate-50/50">
                        <span className={`text-[10px] font-black ${t.daysRunning <= 7 ? 'text-amber-600' : 'text-slate-400'}`}>D{t.daysRunning}</span>
                      </td>

                      <td className="px-2 border-r border-slate-200 text-center bg-blue-50/30">
                        <input 
                          type="number" 
                          readOnly={!isAdmin}
                          className={`w-full bg-transparent border-none text-center font-black text-blue-700 p-0 focus:ring-0 text-sm ${!isAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-text'}`}
                          value={t.headCount || ''}
                          onChange={e => updateRow(t.lineId, { headCount: parseInt(e.target.value) || 0 })}
                        />
                      </td>

                      <td className="px-2 border-r border-slate-200 text-center text-[10px] font-black text-slate-400 tabular-nums">{t.lineWip.toLocaleString()}</td>

                      <td className="px-2 border-r border-slate-200 text-center bg-indigo-50/30">
                        <input 
                          type="number" 
                          className="w-full bg-transparent border-none text-center font-black text-indigo-700 p-0 focus:ring-0 text-sm"
                          value={t.workingHours || ''}
                          onChange={e => updateRow(t.lineId, { workingHours: parseFloat(e.target.value) || 0 })}
                        />
                      </td>

                      <td className="px-2 border-r border-slate-200 text-center">
                        <span className={`text-[11px] font-black ${t.daysRunning <= 7 ? 'text-amber-600' : 'text-slate-900'}`}>{t.targetEfficiency}%</span>
                      </td>

                      <td className="px-4 border-r border-slate-200 text-center bg-emerald-50/50 font-black text-emerald-700 text-lg tabular-nums">
                        {t.todayTargetPcs || '--'}
                      </td>

                      <td className="px-2 border-r border-slate-200 text-center font-black text-amber-600 text-xs tabular-nums">
                        {styles.find(s => s.styleNumber === t.styleNumber)?.productionTopTarget || t.mmTopTgtHr || '--'}
                      </td>
                      <td className="px-2 border-r border-slate-200 text-center text-slate-300 text-[10px]">320</td>
                      <td className="px-2 border-r border-slate-200 text-center text-slate-300 text-[10px]">30</td>

                      <td className="px-2 border-r border-slate-200 text-center bg-slate-800/10">
                        <input 
                          type="number" 
                          className={`w-full bg-transparent border-none text-center font-black p-0 focus:ring-0 text-xs ${
                            (t.efficiencyAdjustment || 0) < 0 ? 'text-rose-600' : (t.efficiencyAdjustment || 0) > 0 ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                          placeholder="+/-"
                          value={t.efficiencyAdjustment || ''}
                          onChange={e => updateRow(t.lineId, { efficiencyAdjustment: parseInt(e.target.value) || 0 })}
                        />
                      </td>

                      <td className="px-2 border-r border-slate-200 text-center text-[10px] font-bold text-slate-400 bg-slate-50/30">{t.lastDayWorkHr || '--'}</td>
                      <td className="px-2 border-r border-slate-200 text-center text-[10px] font-bold text-slate-500 bg-slate-50/30">{t.lastDayTarget || '--'}</td>
                      <td className="px-2 border-r border-slate-200 text-center">
                        <input 
                          type="number" 
                          className="w-full bg-transparent border-none text-center font-black text-blue-600 p-0 focus:ring-0 text-[10px]"
                          placeholder="Achieve"
                          value={t.actualPcs || ''}
                          onChange={e => updateRow(t.lineId, { actualPcs: parseInt(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-2 text-center">
                        <input 
                          type="text" 
                          className="w-full bg-transparent border-none text-left font-medium text-slate-500 p-0 focus:ring-0 text-[9px]"
                          placeholder="Why gap?"
                          value={t.gapRemarks || ''}
                          onChange={e => updateRow(t.lineId, { gapRemarks: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-30">
              <tr className="bg-slate-900 text-white h-12 font-black text-xs uppercase italic border-t border-white/20">
                 <td colSpan={2} className="px-4 text-right border-r border-white/10 uppercase tracking-widest text-[9px]">BLOCK TOTALS</td>
                 <td colSpan={6} className="bg-slate-800/50"></td>
                 <td className="text-center text-blue-400 tabular-nums">{summaryTotals.totalMp}</td>
                 <td className="bg-slate-800/50"></td>
                 <td className="bg-slate-800/50"></td>
                 <td className="text-center text-amber-400">{summaryTotals.avgEff.toFixed(1)}%</td>
                 <td className="text-center text-emerald-400 text-xl tabular-nums">{summaryTotals.totalPcs.toLocaleString()}</td>
                 <td colSpan={8} className="bg-slate-800/50"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-indigo-500 transition-all h-24">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><Calculator size={24}/></div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Logic Analytics</p>
                <p className="text-base font-black text-slate-800 uppercase mt-1">{summaryTotals.avgEff.toFixed(1)}% Matrix Efficiency</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-blue-500 transition-all h-24">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><TrendingUp size={24}/></div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Registry Capacity</p>
                <p className="text-base font-black text-slate-800 uppercase mt-1">{summaryTotals.totalMp} Total Resource</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-emerald-500 transition-all h-24">
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><RefreshCcw size={24}/></div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Line Feed</p>
                <p className="text-base font-black text-slate-800 uppercase mt-1">{summaryTotals.activeCount} Active Stations</p>
             </div>
          </div>
          <div 
            onClick={handleBulkSave}
            className="bg-slate-900 p-6 rounded-2xl text-white flex items-center justify-between shadow-xl cursor-pointer hover:bg-black transition-all group h-24 border-b-4 border-slate-700 active:translate-y-0.5"
          >
             <div className="space-y-0.5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">System Handover</p>
                <p className={`text-sm font-black uppercase ${summaryTotals.isReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                   {summaryTotals.isReady ? `${summaryTotals.totalPcs.toLocaleString()} PCS Committed` : 'Awaiting Matrix'}
                </p>
             </div>
             <Save className={`group-hover:scale-110 transition-transform ${summaryTotals.isReady ? 'text-emerald-400' : 'text-slate-600'}`} size={24} />
          </div>
      </div>

      {/* Technical Reference Modal */}
      {showCurveTable && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-4xl p-10 space-y-8 animate-in zoom-in-95 duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-6 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl"><FileText size={24}/></div>
                    <div>
                       <h2 className="text-2xl font-[1000] text-slate-900 uppercase tracking-tighter">Learning Curve Standards</h2>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Enterprise Efficiency Benchmark Matrix</p>
                    </div>
                 </div>
                 <button onClick={() => setShowCurveTable(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-300 transition-all active:scale-90"><X size={32}/></button>
              </div>

              <div className="overflow-x-auto rounded-2xl border-2 border-slate-100 relative z-10">
                 <table className="w-full text-center border-collapse">
                    <thead>
                       <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-12">
                          <th className="px-4 py-2 border-r border-white/10">Group</th>
                          <th className="px-4 py-2 border-r border-white/10">SMV Range</th>
                          {[1,2,3,4,5,6,7].map(d => <th key={d} className="px-4 py-2 border-r border-white/10 uppercase">Day {d}</th>)}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                       {(config.learningCurve[department] || []).map((g, i) => (
                         <tr key={i} className="hover:bg-indigo-50/80 transition-colors h-10 text-[11px]">
                            <td className="px-4 py-2 border-r border-slate-100 font-black text-indigo-600 text-sm">{g.label}</td>
                            <td className="px-4 py-2 border-r border-slate-100 font-black bg-slate-50/50">{g.min.toFixed(2)} - {g.max.toFixed(2)}</td>
                            {g.curve.map((eff, idx) => (
                               <td key={idx} className="px-4 py-2 border-r border-slate-100 font-black text-slate-900">{eff}%</td>
                            ))}
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              
              <button 
                onClick={() => setShowCurveTable(false)}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-[1000] text-sm uppercase shadow-4xl hover:bg-black transition-all active:scale-[0.98] border-b-4 border-black"
              >
                 Return to Matrix Workspace
              </button>
           </div>
        </div>
      )}

      {message && (
        <div className="fixed bottom-10 right-10 p-6 bg-emerald-600 text-white rounded-2xl shadow-4xl font-black flex items-center gap-4 animate-in slide-in-from-right-10 z-[300] border-2 border-white">
           <CheckCircle size={24}/>
           <div className="flex flex-col">
              <span className="text-sm uppercase leading-none tracking-tight">Synchronized</span>
              <span className="text-[9px] opacity-90 font-bold mt-1 tracking-widest">{message}</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default TargetSheet;
