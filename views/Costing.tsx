import React, { useState, useMemo, useEffect } from 'react';
import { 
  Banknote, ArrowLeft, Plus, Trash2, Save, Database, 
  FilePlus, ChevronRight, ChevronLeft, Image as ImageIcon, 
  Calculator, CheckCircle2, Search, Edit2, X, Upload, TrendingUp,
  History as HistoryIcon, LayoutDashboard, Printer, Eye, Download
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { exportToExcel } from '@/src/lib/export';
import SewingCostingDashboard from '../components/SewingCostingDashboard';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { SewingCosting, Operation, DailyTarget, LayoutTemplate } from '../types';

const Costing: React.FC<{ department?: string; subType?: string }> = ({ department, subType }) => {
  const navigate = useNavigate();
  
  const [view, setView] = useState<'ENTRY' | 'DATABASE'>('ENTRY');
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<any>({ buyers: [], productCategories: [], lineMappings: [] });
  const [costingList, setCostingList] = useState<SewingCosting[]>([]);
  const [layoutTemplates, setLayoutTemplates] = useState<LayoutTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modification Remark State
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [modificationRemark, setModificationRemark] = useState('');
  const [pendingSaveData, setPendingSaveData] = useState<SewingCosting | null>(null);

  // History View State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<SewingCosting | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<SewingCosting>>(() => {
    const saved = localStorage.getItem('sewing_costing_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved draft:", e);
      }
    }
    return {
      id: '',
      buyer: '',
      styleNumber: '',
      styleCode: '',
      productCategory: '',
      size: '',
      fabrication: '',
      numStyling: 1,
      numStyle: 1,
      numColor: 1,
      marketingOrderQty: 0,
      lineConsideration: 1,
      operations: [],
      dailyTargets: [
        { day: 1, target: 0 },
        { day: 2, target: 0 },
        { day: 3, target: 0 },
        { day: 4, target: 0 },
      ],
      topTargetDay: 4,
    };
  });

  // Persist draft to localStorage
  useEffect(() => {
    localStorage.setItem('sewing_costing_draft', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [remoteConfig, remoteCostings] = await Promise.all([
          apiService.getRemoteConfig(),
          apiService.getSewingCosting()
        ]);
        setConfig(remoteConfig);
        setCostingList(remoteCostings);
      } catch (error) {
        console.error("Failed to load costing data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // In a real app, layout templates would also come from API
    // For now, we'll keep them empty or fetch if endpoint exists
  }, [department]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = layoutTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        productCategory: template.garmentType,
        operations: template.operations.map((op: any) => ({
          id: op.id || Date.now().toString() + Math.random().toString(36).substring(7),
          name: op.operationName || op.name || '',
          smv: op.smv || 0,
          machineType: op.mcType || op.machineType || '',
          partContext: op.part || op.partContext || '',
          folderAttachment: op.folderAttachment || '',
          requiredMan: op.actualMan || op.requiredMan || 1,
          actualMan: op.actualMan || 1,
          actualMc: op.actualMc || 1,
          balancePercent: op.balancePercent || 0,
          idleTime: op.idleTime || 0,
          remarks: op.remarks || ''
        }))
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.styleNumber || !formData.buyer) {
      alert("Please fill in Style Number and Buyer");
      return;
    }

    const isEdit = !!formData.id;
    const existingRecord = isEdit ? costingList.find(c => c.id === formData.id) : null;

    const newCosting: SewingCosting = {
      ...formData as SewingCosting,
      id: formData.id || `CST-${Date.now()}`,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: 'Admin',
      productionSMV: formData.productionSMV !== undefined ? formData.productionSMV : calculations.defaultProductionSMV,
      productionTopTarget: formData.productionTopTarget !== undefined ? formData.productionTopTarget : Math.round(calculations.defaultProductionTopTarget),
      productionAverageTarget: formData.productionAverageTarget !== undefined ? formData.productionAverageTarget : Math.round(calculations.defaultProductionAverageTarget),
    };

    if (isEdit && existingRecord) {
      // If editing, we need a remark
      setPendingSaveData(newCosting);
      setShowRemarkModal(true);
    } else {
      try {
        await apiService.saveSewingCosting(newCosting);
        alert("Costing saved successfully!");
        resetForm();
        const updatedList = await apiService.getSewingCosting();
        setCostingList(updatedList);
        setView('DATABASE');
      } catch (error) {
        alert("Failed to save costing");
      }
    }
  };

  const handlePrint = (costing: SewingCosting) => {
    console.log("Printing costing:", costing);
    window.print();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this costing record?")) {
      try {
        await apiService.deleteSewingCosting(id);
        setCostingList(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        alert("Failed to delete record");
      }
    }
  };

  const confirmSaveWithRemark = async () => {
    if (!modificationRemark.trim()) {
      alert("Please provide a remark for this modification");
      return;
    }

    if (pendingSaveData) {
      const existingRecord = costingList.find(c => c.id === pendingSaveData.id);
      if (existingRecord) {
        const historyEntry = {
          id: `hist-${Date.now()}`,
          timestamp: existingRecord.updatedAt || existingRecord.createdAt,
          user: existingRecord.user || 'Admin',
          remark: modificationRemark,
          snapshot: { ...existingRecord, history: undefined } // Don't nest history infinitely
        };
        
        const updatedData = {
          ...pendingSaveData,
          history: [historyEntry, ...(existingRecord.history || [])]
        };

        try {
          await apiService.saveSewingCosting(updatedData);
          alert("Costing updated successfully with history!");
          setModificationRemark('');
          setShowRemarkModal(false);
          setPendingSaveData(null);
          resetForm();
          const updatedList = await apiService.getSewingCosting();
          setCostingList(updatedList);
          setView('DATABASE');
        } catch (error) {
          alert("Failed to update costing");
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      buyer: '',
      styleNumber: '',
      styleCode: '',
      productCategory: '',
      size: '',
      fabrication: '',
      numStyling: 1,
      numStyle: 1,
      numColor: 1,
      marketingOrderQty: 0,
      lineConsideration: 1,
      operations: [],
      dailyTargets: [
        { day: 1, target: 0 },
        { day: 2, target: 0 },
        { day: 3, target: 0 },
        { day: 4, target: 0 },
      ],
      topTargetDay: 4,
    });
    setStep(1);
  };

  const addOperation = (partContext?: string) => {
    const newOp: Operation = {
      id: `op-${Date.now()}`,
      name: '',
      smv: 0,
      machineType: '',
      partContext: partContext || 'General',
    };
    setFormData(prev => ({
      ...prev,
      operations: [...(prev.operations || []), newOp]
    }));
  };

  const updateOperation = (id: string, updates: Partial<Operation>) => {
    setFormData(prev => ({
      ...prev,
      operations: prev.operations?.map(op => op.id === id ? { ...op, ...updates } : op)
    }));
  };

  const removeOperation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      operations: prev.operations?.filter(op => op.id !== id)
    }));
  };

  const calculateEfficiency = (prod: number, smv: number) => {
    if (!prod || !smv) return 0;
    const availableMinutes = 67 * 10 * 60; // Standard 10h shift baseline
    const producedMinutes = prod * smv;
    return (producedMinutes / availableMinutes) * 100;
  };

  const addTargetDay = () => {
    setFormData(prev => {
      const nextDay = (prev.dailyTargets?.length || 0) + 1;
      return {
        ...prev,
        dailyTargets: [...(prev.dailyTargets || []), { day: nextDay, target: 0 }]
      };
    });
  };

  const removeTargetDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      dailyTargets: prev.dailyTargets?.filter(t => t.day !== day).map((t, i) => ({ ...t, day: i + 1 }))
    }));
  };

  const updateTarget = (day: number, target: number) => {
    setFormData(prev => ({
      ...prev,
      dailyTargets: prev.dailyTargets?.map(t => t.day === day ? { ...t, target } : t)
    }));
  };

  // Calculations
  const calculations = useMemo(() => {
    const targets = formData.dailyTargets || [];
    const lineConsideration = formData.lineConsideration || 1;
    const manpowerPerLine = config.lineMappings?.[0]?.layoutManpower || 67;
    const totalManpower = manpowerPerLine * lineConsideration;

    const topTarget = targets.length > 0 ? targets[targets.length - 1].target : 0;
    const totalProductionInLearning = targets.reduce((sum, t) => sum + t.target, 0);
    const orderQty = formData.marketingOrderQty || 0;
    
    // If targets are per line, then total production in learning is totalProductionInLearning * lineConsideration
    const totalProductionInLearningAllLines = totalProductionInLearning * lineConsideration;
    const balanceQty = Math.max(0, orderQty - totalProductionInLearningAllLines);
    
    // Days for balance considering all lines
    const dailyCapacityAllLines = topTarget * lineConsideration;
    const daysForBalance = dailyCapacityAllLines > 0 ? balanceQty / dailyCapacityAllLines : 0;
    
    const totalDays = targets.length + daysForBalance;
    const productionPerDay = totalDays > 0 ? orderQty / totalDays : 0;
    const productivityPerHour = productionPerDay / 10; // Assuming 10 hour shift
    const productivityPerHourPerLine = lineConsideration > 0 ? productivityPerHour / lineConsideration : 0;
    
    const calculatedSMV = formData.operations?.reduce((sum, op) => sum + op.smv, 0) || 0;
    const baseSMV = calculatedSMV > 0 ? calculatedSMV : (formData.manualSMV || 0);
    const totalSMV = baseSMV + (formData.othersSMV || 0) + (formData.afterWashSMV || 0);

    const totalMinutesAvailable = targets.length * totalManpower * 10 * 60;
    const averageEfficiency = totalMinutesAvailable > 0 ? ((totalProductionInLearningAllLines * totalSMV) / totalMinutesAvailable) * 100 : 0;

    const defaultProductionSMV = calculatedSMV;
    const defaultProductionTopTarget = topTarget > 0 ? (topTarget / 10) * 1.10 : 0;
    const defaultProductionAverageTarget = productivityPerHourPerLine * 1.10;

    // Marketing Metrics as per User Request
    const marketingSMV = totalSMV;
    const marketingAverage = productivityPerHourPerLine;
    const marketingTop = topTarget / 10;
    const marketingEfficiency = averageEfficiency;

    return {
      totalProductionInLearning,
      totalProductionInLearningAllLines,
      balanceQty,
      daysForBalance,
      totalDays,
      productionPerDay,
      productivityPerHour,
      productivityPerHourPerLine,
      calculatedSMV,
      baseSMV,
      totalSMV,
      averageEfficiency,
      defaultProductionSMV,
      defaultProductionTopTarget,
      defaultProductionAverageTarget,
      marketingSMV,
      marketingAverage,
      marketingTop,
      marketingEfficiency
    };
  }, [formData.dailyTargets, formData.marketingOrderQty, formData.operations, formData.manualSMV, formData.othersSMV, formData.afterWashSMV, formData.lineConsideration, config.lineMappings]);

  const filteredDatabase = useMemo(() => {
    return costingList.filter(c => 
      c.styleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.styleCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [costingList, searchTerm]);

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase italic leading-none text-slate-900">
              {department === 'Washing' ? 'Wash Costing' : `Sewing Costing ${department ? `- ${department}` : ''}`}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Production Planning & Cost Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('ENTRY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'ENTRY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FilePlus size={14} /> Costing Entry
          </button>
          <button 
            onClick={() => setView('DATABASE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'DATABASE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Database size={14} /> Database
          </button>
          {view === 'DATABASE' && (
            <button 
              onClick={() => exportToExcel(costingList, 'SewingCosting')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase hover:bg-emerald-700 transition-all"
            >
              <Download size={14} /> Export
            </button>
          )}
        </div>
      </div>

      {view === 'ENTRY' ? (
        <div className="space-y-8">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all border-2 ${step === s ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-110' : step > s ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-300 border-slate-200'}`}
                >
                  {step > s ? <CheckCircle2 size={18} /> : s}
                </div>
                {s < 3 && <div className={`h-1 flex-1 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 md:p-12 animate-in slide-in-from-bottom-4 duration-500">
            {step === 1 && (
              <div className="space-y-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                    <Edit2 size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 uppercase italic">Style Profile Setup</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer Group</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={formData.buyer}
                      onChange={e => setFormData({ ...formData, buyer: e.target.value })}
                    >
                      <option value="">Select Buyer</option>
                      {config.buyers.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Style Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. SN-8822"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={formData.styleNumber}
                      onChange={e => setFormData({ ...formData, styleNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Style Code (System ID)</label>
                    <input 
                      type="text"
                      placeholder="DMN-2024"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={formData.styleCode}
                      onChange={e => setFormData({ ...formData, styleCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Category</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={formData.productCategory}
                      onChange={e => setFormData({ ...formData, productCategory: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {config.productCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Size</label>
                    <input 
                      type="text"
                      placeholder="e.g. 32, 34, L, XL"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={formData.size}
                      onChange={e => setFormData({ ...formData, size: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fabrication</label>
                    <input 
                      type="text"
                      placeholder="e.g. 100% Cotton Denim"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={formData.fabrication}
                      onChange={e => setFormData({ ...formData, fabrication: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Template Label (Optional)</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={selectedTemplateId}
                      onChange={e => handleTemplateSelect(e.target.value)}
                    >
                      <option value="">Select Template</option>
                      {layoutTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-8 space-y-8">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Complexity & Resource Load</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {[
                      { label: 'Number of Styling', key: 'numStyling' },
                      { label: 'Number of Style', key: 'numStyle' },
                      { label: 'Number of Color', key: 'numColor' },
                      { label: 'Marketing Order Qty', key: 'marketingOrderQty', highlight: true },
                      { label: 'Line Consideration', key: 'lineConsideration' },
                    ].map(field => (
                      <div key={field.key} className="space-y-2">
                        <label className={`text-[9px] font-black uppercase tracking-widest ${field.highlight ? 'text-orange-600' : 'text-slate-400'}`}>
                          {field.label}
                        </label>
                        <input 
                          type="number"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                          value={(formData as any)[field.key]}
                          onChange={e => setFormData({ ...formData, [field.key]: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Calculator size={20} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic">Operation Breakdown</h2>
                  </div>
                  <button 
                    onClick={() => addOperation()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Plus size={14} /> Add Operation
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 md:w-16">SL</th>
                          <th className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Operation</th>
                          <th className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 md:w-32">SMV</th>
                          <th className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 md:w-32">M/C</th>
                          <th className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 md:w-32 text-center">Capacity<br/>(Per Person)</th>
                          <th className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 md:w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.operations?.map((op, idx) => (
                          <tr key={op.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 md:px-6 py-3 text-xs font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-4 md:px-6 py-3">
                              <input 
                                type="text"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0"
                                placeholder="Enter operation name..."
                                value={op.name}
                                onChange={e => updateOperation(op.id, { name: e.target.value })}
                              />
                            </td>
                            <td className="px-4 md:px-6 py-3">
                              <input 
                                type="number"
                                step="0.01"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-black p-0"
                                value={op.smv === 0 ? '' : op.smv}
                                onChange={e => updateOperation(op.id, { smv: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-4 md:px-6 py-3">
                              <input 
                                type="text"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0 uppercase"
                                placeholder="M/C Type"
                                value={op.machineType}
                                onChange={e => updateOperation(op.id, { machineType: e.target.value })}
                              />
                            </td>
                            <td className="px-4 md:px-6 py-3 text-center">
                              <span className="text-sm font-black text-emerald-600">
                                {op.smv > 0 ? Math.round(60 / op.smv) : 0}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-3 text-right">
                              <button 
                                onClick={() => removeOperation(op.id)}
                                className="text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(!formData.operations || formData.operations.length === 0) && (
                          <tr>
                            <td colSpan={6} className="px-4 md:px-6 py-12 text-center text-slate-400 italic text-sm">
                              No operations added yet. Click "Add Operation" to begin.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {formData.operations && formData.operations.length > 0 && (
                        <tfoot className="bg-slate-50/50 font-black">
                          <tr>
                            <td colSpan={2} className="px-4 md:px-6 py-4 text-right text-[10px] uppercase tracking-widest text-slate-400">Total SMV</td>
                            <td className="px-4 md:px-6 py-4 text-sm text-blue-600">
                              {formData.operations.reduce((sum, op) => sum + op.smv, 0).toFixed(2)}
                            </td>
                            <td colSpan={3}></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <TrendingUp size={20} />
                      </div>
                      <h2 className="text-xl font-black text-slate-900 uppercase italic">Production Curve</h2>
                    </div>
                    <button 
                      onClick={addTargetDay}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Plus size={14} /> Add Day
                    </button>
                  </div>

                  <div className="border-2 border-emerald-600/20 rounded-2xl overflow-x-auto">
                    <table className="w-full text-center border-collapse min-w-[400px]">
                      <thead>
                        <tr className="bg-emerald-600 text-white">
                          <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r border-white/20">Day</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border-r border-white/20">Production Target</th>
                          <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest">Efficiency (%)</th>
                          <th className="w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.dailyTargets?.map((t) => (
                          <tr key={t.day} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 text-xs font-black text-slate-900 border-r border-slate-100">
                              {t.day}{t.day === 1 ? 'st' : t.day === 2 ? 'nd' : t.day === 3 ? 'rd' : 'th'} Day
                              {t.day === (formData.dailyTargets?.length || 0) && <span className="ml-2 text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Top</span>}
                            </td>
                            <td className="px-6 py-3 border-r border-slate-100">
                              <input 
                                type="number"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-black text-center"
                                value={t.target === 0 ? '' : t.target}
                                onChange={e => updateTarget(t.day, parseInt(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </td>
                            <td className="px-6 py-3 text-sm font-black text-emerald-600">
                              {calculations.totalSMV > 0 
                                ? ((t.target * calculations.totalSMV) / (67 * 10 * 60) * 100).toFixed(1) + '%'
                                : '0.0%'}
                            </td>
                            <td className="px-2">
                              {(formData.dailyTargets?.length || 0) > 1 && (
                                <button onClick={() => removeTargetDay(t.day)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                  <X size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Production Curve Chart */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-black text-slate-900 uppercase italic flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500" /> Production Curve Visualization
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Target</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Efficiency</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={formData.dailyTargets || []}>
                          <defs>
                            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="day" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            dy={10}
                            label={{ value: 'Production Day', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 800, fill: '#64748b' }}
                          />
                          <YAxis 
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            label={{ value: 'Target (Pcs)', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 800, fill: '#64748b' }}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            label={{ value: 'Efficiency (%)', angle: 90, position: 'insideRight', fontSize: 10, fontWeight: 800, fill: '#64748b' }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            labelStyle={{ fontWeight: 900, color: '#0f172a', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}
                          />
                          <Area 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="target" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorTarget)" 
                            name="Target Pcs"
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="efficiency" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            name="Efficiency %"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Sewing SMV</p>
                          {calculations.calculatedSMV > 0 ? (
                            <p className="text-[10px] text-emerald-600 font-bold">Auto-calculated from Step 2</p>
                          ) : (
                            <p className="text-[10px] text-orange-500 font-bold">Manual Entry (Step 2 skipped)</p>
                          )}
                        </div>
                        <div className="w-32">
                          <input 
                            type="number" 
                            step="0.01"
                            disabled={calculations.calculatedSMV > 0}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-lg font-black text-right outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            value={calculations.calculatedSMV > 0 ? calculations.calculatedSMV : (formData.manualSMV || '')}
                            onChange={e => setFormData({ ...formData, manualSMV: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Others Process SMV</p>
                        <div className="w-24">
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-black text-right outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.othersSMV || ''}
                            onChange={e => setFormData({ ...formData, othersSMV: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase">After Wash SMV</p>
                        <div className="w-24">
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-black text-right outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.afterWashSMV || ''}
                            onChange={e => setFormData({ ...formData, afterWashSMV: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Finishing SMV</p>
                          <p className="text-[8px] text-slate-400 font-bold italic">Not added to total calculation</p>
                        </div>
                        <div className="w-24">
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-black text-right outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.finishingSMV || ''}
                            onChange={e => setFormData({ ...formData, finishingSMV: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
                        <p className="text-[12px] font-black text-emerald-700 uppercase">Total SMV (For Costing)</p>
                        <p className="text-xl font-black text-emerald-700">{calculations.totalSMV.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Production (Learning)</p>
                        <p className="text-lg font-black text-slate-900">{calculations.totalProductionInLearning}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Balance Qty</p>
                        <p className="text-lg font-black text-orange-600">{calculations.balanceQty}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Days for Balance</p>
                        <p className="text-lg font-black text-slate-900">{calculations.daysForBalance.toFixed(1)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Days Required</p>
                        <p className="text-lg font-black text-blue-600">{calculations.totalDays.toFixed(1)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Production / Day</p>
                        <p className="text-lg font-black text-slate-900">{Math.round(calculations.productionPerDay)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[8px] font-black text-blue-600 uppercase mb-1">Productivity / Hour</p>
                        <p className="text-lg font-black text-blue-600">{Math.round(calculations.productivityPerHour)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
                        <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Average Efficiency</p>
                        <p className="text-lg font-black text-emerald-600">{calculations.averageEfficiency.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Production SMV</p>
                        <input 
                          type="number" 
                          step="0.01"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-lg font-black text-right outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.productionSMV !== undefined ? (formData.productionSMV === 0 ? '' : formData.productionSMV) : (calculations.defaultProductionSMV === 0 ? '' : calculations.defaultProductionSMV)}
                          onChange={e => setFormData({ ...formData, productionSMV: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Production Top Target</p>
                        <input 
                          type="number" 
                          step="1"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-lg font-black text-right outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.productionTopTarget !== undefined ? (formData.productionTopTarget === 0 ? '' : formData.productionTopTarget) : (Math.round(calculations.defaultProductionTopTarget) === 0 ? '' : Math.round(calculations.defaultProductionTopTarget))}
                          onChange={e => setFormData({ ...formData, productionTopTarget: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Production Avg Target</p>
                        <input 
                          type="number" 
                          step="1"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-lg font-black text-right outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.productionAverageTarget !== undefined ? (formData.productionAverageTarget === 0 ? '' : formData.productionAverageTarget) : (Math.round(calculations.defaultProductionAverageTarget) === 0 ? '' : Math.round(calculations.defaultProductionAverageTarget))}
                          onChange={e => setFormData({ ...formData, productionAverageTarget: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Production Avg Eff.</p>
                        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-lg font-black text-right text-emerald-700">
                          {calculateEfficiency(
                            formData.productionAverageTarget !== undefined ? formData.productionAverageTarget : Math.round(calculations.defaultProductionAverageTarget),
                            formData.productionSMV !== undefined ? formData.productionSMV : calculations.defaultProductionSMV
                          ).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                      <Edit2 size={20} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic">Remarks</h2>
                  </div>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[100px]"
                    placeholder="Add any additional remarks or notes here..."
                    value={formData.remarks || ''}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <ImageIcon size={20} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic">Garments Images (Max 4)</h2>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className="aspect-square w-full bg-slate-50 border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 group hover:border-blue-400 transition-all cursor-pointer relative overflow-hidden">
                        {(formData.images && formData.images[index]) ? (
                          <>
                            <img src={formData.images[index]} alt={`Garment ${index + 1}`} className="w-full h-full object-cover" />
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const newImages = [...(formData.images || [])];
                                newImages[index] = '';
                                setFormData({ ...formData, images: newImages }); 
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full text-rose-500 shadow-lg hover:bg-rose-500 hover:text-white transition-all"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="p-3 bg-white rounded-full shadow-md text-slate-300 group-hover:text-blue-600 transition-all group-hover:scale-110">
                              <Upload size={24} />
                            </div>
                            <div className="text-center px-2">
                              <p className="text-[10px] font-black text-slate-900 uppercase italic">Image {index + 1}</p>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const newImages = [...(formData.images || [])];
                                    newImages[index] = reader.result as string;
                                    setFormData({ ...formData, images: newImages });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center italic">
                    * Images can be added later from the database if not available now.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <button 
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black uppercase text-xs transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 shadow-sm'}`}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            
            {step < 3 ? (
              <button 
                onClick={() => setStep(s => Math.min(3, s + 1))}
                className="flex items-center gap-2 bg-slate-900 text-white px-10 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-blue-600 transition-all active:scale-95"
              >
                Next Step <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-emerald-600 text-white px-12 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-emerald-700 transition-all active:scale-95"
              >
                <Save size={16} /> Confirm & Save Costing
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Database View */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search style, buyer, or code..."
                className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <FilePlus size={14} /> Print Report
              </button>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredDatabase.length} Entries Found</span>
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[3400px]">
              <thead>
                <tr className="bg-[#1e293b] text-white">
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 sticky left-0 z-10 bg-[#1e293b]">Activity State</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest">Buyer</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest">Style Number</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-center">Product category</th>
                  
                  <th className="px-2 py-6 text-[10px] font-black uppercase tracking-widest text-center border-l border-white/10">Styling</th>
                  <th className="px-2 py-6 text-[10px] font-black uppercase tracking-widest text-center">Style</th>
                  <th className="px-2 py-6 text-[10px] font-black uppercase tracking-widest text-center">Colors</th>
                  
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-blue-400 border-l border-white/10 text-center">Order qty</th>
                  <th className="px-2 py-6 text-[10px] font-black uppercase tracking-widest text-blue-400 text-center">Lines</th>
                  
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-blue-400 border-l border-white/10 text-center">Mkt SMV</th>
                  <th className="px-3 py-6 text-[10px] font-black uppercase tracking-widest text-blue-400 text-center">Mkt top</th>
                  <th className="px-3 py-6 text-[10px] font-black uppercase tracking-widest text-blue-400 text-center">Mkt Avg</th>
                  <th className="px-3 py-6 text-[10px] font-black uppercase tracking-widest text-blue-400 text-center">Mkt eff</th>

                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-orange-400 border-l border-white/10 text-center">Pro SMV</th>
                  <th className="px-3 py-6 text-[10px] font-black uppercase tracking-widest text-orange-400 text-center">Pro Top</th>
                  <th className="px-3 py-6 text-[10px] font-black uppercase tracking-widest text-orange-400 text-center">Pro Avg</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-orange-400 text-center">Pro EFF</th>
                  
                  <th className="px-5 py-6 text-[10px] font-black uppercase tracking-widest text-emerald-400 border-l border-white/10 text-center">Actual Output</th>
                  <th className="px-3 py-6 text-[10px] font-black uppercase tracking-widest text-emerald-400 text-center">Actual Working hr.</th>
                  <th className="px-5 py-6 text-[10px] font-black uppercase tracking-widest text-emerald-400 text-center">Actual EFF</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right sticky right-0 z-10 bg-[#1e293b]">Registry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDatabase.map(costing => {
                  const calculatedSMV = costing.operations.reduce((sum, op) => sum + op.smv, 0);
                  const baseSMV = calculatedSMV > 0 ? calculatedSMV : (costing.manualSMV || 0);
                  const totalSMV = baseSMV + (costing.othersSMV || 0) + (costing.afterWashSMV || 0);

                  // Marketing Metrics Calculations for Table
                  const targets = costing.dailyTargets || [];
                  const topTarget = targets.length > 0 ? targets[targets.length - 1].target : 0;
                  const totalProductionInLearning = targets.reduce((sum, t) => sum + t.target, 0);
                  const orderQty = costing.marketingOrderQty || 0;
                  const balanceQty = Math.max(0, orderQty - totalProductionInLearning);
                  const daysForBalance = topTarget > 0 ? balanceQty / topTarget : 0;
                  const totalDays = targets.length + daysForBalance;
                  const productionPerDay = totalDays > 0 ? orderQty / totalDays : 0;
                  const mktAverage = productionPerDay / 10;
                  const mktTop = topTarget / 10;
                  
                  const totalMinutes = targets.length * 67 * 10 * 60;
                  const mktEfficiency = totalMinutes > 0 ? ((totalProductionInLearning * totalSMV) / totalMinutes) * 100 : 0;

                  const achievement = { totalHours: 10, avgManpower: 67, totalOutput: 0 }; // Placeholder or fetch from API
                  const workingHrs = achievement.totalHours;
                  const totalMinsAvailable = (achievement.avgManpower) * workingHrs * 60;
                  const prodMins = achievement.totalOutput * totalSMV;
                  const actEff = totalMinsAvailable > 0 ? (prodMins / totalMinsAvailable) * 100 : 0;
                  
                  const proSMV = costing.productionSMV !== undefined ? costing.productionSMV : calculatedSMV;
                  const proTop = costing.productionTopTarget || 0;
                  const proAvg = costing.productionAverageTarget || 0;
                  const proEff = calculateEfficiency(proAvg, proSMV);

                  return (
                    <tr key={costing.id} className="hover:bg-slate-50 transition-all font-semibold text-slate-700 group">
                      <td className="px-4 py-5 sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col text-[10px]">
                            <span className="font-black text-slate-900">{new Date(costing.updatedAt).toLocaleDateString()}</span>
                            <span className={`text-[8px] font-bold uppercase tracking-tight ${costing.updatedAt !== costing.createdAt ? 'text-amber-500' : 'text-slate-400'}`}>
                                {costing.updatedAt !== costing.createdAt ? 'MODIFIED' : 'INITIAL'}
                            </span>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-sm font-black text-slate-900">{costing.buyer}</td>
                      <td className="px-4 py-5 font-black text-indigo-600">{costing.styleNumber}</td>
                      <td className="px-4 py-5 text-[10px] font-black uppercase text-slate-400 text-center">{costing.productCategory || 'Standard Garment'}</td>
                      
                      <td className="px-2 py-5 text-center border-l border-slate-100 bg-slate-50/50"><span className="text-xs font-black">{costing.numStyling}</span></td>
                      <td className="px-2 py-5 text-center bg-slate-50/50"><span className="text-xs font-black">{costing.numStyle}</span></td>
                      <td className="px-2 py-5 text-center bg-slate-50/50"><span className="text-xs font-black">{costing.numColor}</span></td>

                      <td className="px-4 py-5 text-center font-black text-blue-600 bg-blue-50/10 border-l border-slate-100">{(costing.marketingOrderQty || 0).toLocaleString()}</td>
                      <td className="px-2 py-5 text-center font-black text-indigo-600 bg-blue-50/10">{costing.lineConsideration || 1}</td>

                      <td className="px-4 py-5 font-mono text-blue-700 bg-blue-50/20 border-l border-slate-100 text-center">{totalSMV.toFixed(2)}</td>
                      <td className="px-3 py-5 text-center text-slate-400 font-black bg-blue-50/20">{mktTop.toFixed(1)}</td>
                      <td className="px-3 py-5 text-center text-slate-900 font-black bg-blue-50/20">{mktAverage.toFixed(1)}</td>
                      <td className="px-3 py-5 text-center bg-blue-50/20"><span className="text-[10px] font-black text-blue-600">{mktEfficiency.toFixed(1)}%</span></td>

                      <td className="px-4 py-5 font-mono text-orange-700 bg-orange-50/20 border-l border-slate-100 text-center">{proSMV.toFixed(2)}</td>
                      <td className="px-3 py-5 text-center text-slate-400 bg-orange-50/20">{proTop}</td>
                      <td className="px-3 py-5 text-center text-slate-900 font-black bg-orange-50/20">{proAvg}</td>
                      <td className="px-4 py-5 text-center bg-orange-50/20"><span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black">{proEff.toFixed(1)}%</span></td>
                      
                      <td className="px-5 py-5 font-black text-emerald-700 bg-emerald-50/20 border-l border-slate-100 text-center">{achievement.totalOutput.toLocaleString()} PCS</td>
                      <td className="px-3 py-5 font-black text-slate-900 bg-emerald-50/20 text-center">{workingHrs} HR</td>
                      <td className="px-5 py-5 bg-emerald-50/20">
                         <div className="flex items-center justify-center gap-2">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500" style={{ width: `${Math.min(actEff, 100)}%` }}></div>
                            </div>
                            <span className="text-xs font-black text-emerald-600">{actEff.toFixed(1)}%</span>
                         </div>
                      </td>
                      
                      <td className="px-4 py-5 text-right sticky right-0 z-10 bg-white group-hover:bg-slate-50 transition-colors border-l border-slate-100 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {costing.history && costing.history.length > 0 && (
                              <button 
                                onClick={() => {
                                  setSelectedHistory(costing);
                                  setShowHistoryModal(true);
                                }}
                                className="p-2.5 bg-white border border-slate-100 rounded-xl text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title="View History"
                              >
                                <HistoryIcon size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setFormData(costing);
                                setStep(1);
                                setView('ENTRY');
                              }}
                              className="p-2.5 bg-white border border-slate-100 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm" 
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this costing?")) {
                                  try {
                                    await apiService.deleteSewingCosting(costing.id);
                                    setCostingList(prev => prev.filter(c => c.id !== costing.id));
                                  } catch (e) {
                                    alert("Failed to delete");
                                  }
                                }
                              }}
                              className="p-2.5 bg-white border border-slate-100 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              title="Delete"
                            >
                              <Trash2 size={16}/>
                            </button>
                            <button 
                              onClick={() => handlePrint(costing)}
                              className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                              title="Print"
                            >
                              <Printer size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredDatabase.length === 0 && (
              <div className="col-span-full py-20 bg-white border-dashed flex flex-col items-center justify-center gap-4 text-slate-400">
                <Database size={48} className="opacity-20" />
                <p className="text-sm font-black uppercase italic">No costing records found</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Remark Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Edit2 size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic">Modification Remark</h3>
              </div>
              <button onClick={() => setShowRemarkModal(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-sm font-bold text-slate-500">
                You are modifying an existing costing record. Please provide a reason or remark for this change to maintain the history.
              </p>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[120px]"
                placeholder="Enter modification remark..."
                value={modificationRemark}
                onChange={e => setModificationRemark(e.target.value)}
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowRemarkModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-black uppercase text-xs text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmSaveWithRemark}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedHistory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <HistoryIcon size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic">Modification History</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedHistory.styleNumber} - {selectedHistory.buyer}</p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
              {selectedHistory.history?.map((entry, idx) => (
                <div key={entry.id} className="relative pl-8 border-l-2 border-slate-100 pb-8 last:pb-0">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-sm" />
                  <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{new Date(entry.timestamp).toLocaleString()}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">Version {selectedHistory.history!.length - idx}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User: {entry.user}</span>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Remark</p>
                      <p className="text-sm font-bold text-slate-700 italic">"{entry.remark}"</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total SMV</p>
                        <p className="text-xs font-black text-blue-600">{(entry.snapshot.productionSMV || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Top Target</p>
                        <p className="text-xs font-black text-slate-900">{entry.snapshot.productionTopTarget || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Avg Target</p>
                        <p className="text-xs font-black text-slate-900">{entry.snapshot.productionAverageTarget || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Order Qty</p>
                        <p className="text-xs font-black text-slate-900">{(entry.snapshot.marketingOrderQty || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!selectedHistory.history || selectedHistory.history.length === 0) && (
                <div className="py-12 text-center text-slate-400 italic text-sm">
                  No history records available for this costing.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Costing;
