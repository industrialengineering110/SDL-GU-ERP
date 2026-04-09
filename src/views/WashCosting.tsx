import React, { useState, useMemo, useEffect } from 'react';
import { 
  Droplets, Plus, Trash2, Save, Calculator, 
  ChevronRight, ChevronLeft, CheckCircle2, 
  FlaskConical, Wind, Thermometer, Zap, 
  Droplet, Beaker, Layers, FileText, Printer, X, Eye,
  LayoutDashboard, Database, Search, ArrowLeft,
  History as HistoryIcon, Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WashCostingDashboard from '../components/WashCostingDashboard';
import { mockDb } from '../services/mockDb';
import { WashCostingRecord, WashProcess } from '../types';

const WashCosting: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'ENTRY' | 'DATABASE' | 'DASHBOARD'>('ENTRY');
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState<WashCostingRecord[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modification Remark State
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [modificationRemark, setModificationRemark] = useState('');
  const [pendingSaveData, setPendingSaveData] = useState<WashCostingRecord | null>(null);

  // History View State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<WashCostingRecord | null>(null);

  const [formData, setFormData] = useState({
    styleNumber: '',
    buyer: '',
    garmentType: 'Denim Pants',
    color: '',
    orderQty: 0,
    processes: [] as WashProcess[],
    history: [] as any[]
  });

  useEffect(() => {
    if (view === 'DATABASE') {
      setRecords(mockDb.getWashCostingRecords());
    }
  }, [view]);

  const handleSave = () => {
    const record: WashCostingRecord = {
      id: isEdit && editingId ? editingId : `wc-${Date.now()}`,
      styleNumber: formData.styleNumber,
      buyer: formData.buyer,
      garmentType: formData.garmentType,
      color: formData.color,
      orderQty: formData.orderQty,
      processes: formData.processes,
      totalCost: calculations.totalCostForOrder,
      date: new Date().toISOString(),
      user: 'Admin',
      history: isEdit && editingId ? (formData.history || []) : []
    };

    if (isEdit) {
      setPendingSaveData(record);
      setShowRemarkModal(true);
    } else {
      mockDb.saveWashCostingRecord(record);
      alert("Wash Costing saved to database!");
      resetForm();
      setView('DATABASE');
    }
  };

  const confirmSave = () => {
    if (!pendingSaveData) return;

    const updatedHistory = [
      ...(pendingSaveData.history || []),
      {
        date: new Date().toISOString(),
        user: 'Admin',
        remark: modificationRemark
      }
    ];

    const finalData = {
      ...pendingSaveData,
      history: updatedHistory
    };

    mockDb.saveWashCostingRecord(finalData);
    alert("Wash Costing updated successfully!");
    setShowRemarkModal(false);
    setModificationRemark('');
    resetForm();
    setView('DATABASE');
  };

  const resetForm = () => {
    setFormData({
      styleNumber: '',
      buyer: '',
      garmentType: 'Denim Pants',
      color: '',
      orderQty: 0,
      processes: [],
      history: []
    });
    setIsEdit(false);
    setEditingId(null);
    setStep(1);
  };

  const handleEdit = (record: WashCostingRecord) => {
    setFormData({
      styleNumber: record.styleNumber,
      buyer: record.buyer,
      garmentType: record.garmentType || 'Denim Pants',
      color: record.color,
      orderQty: record.orderQty,
      processes: record.processes,
      history: record.history || []
    });
    setIsEdit(true);
    setEditingId(record.id);
    setStep(1);
    setView('ENTRY');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      mockDb.deleteWashCostingRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const addProcess = (type: 'WET' | 'DRY') => {
    const newProcess: WashProcess = {
      id: `proc-${Date.now()}`,
      name: '',
      type,
      machineType: '',
      timeMinutes: 0,
      chemicals: [],
      utilityCost: 0,
      laborCost: 0,
      remarks: ''
    };
    setFormData(prev => ({ ...prev, processes: [...prev.processes, newProcess] }));
  };

  const updateProcess = (id: string, updates: Partial<WashProcess>) => {
    setFormData(prev => ({
      ...prev,
      processes: prev.processes.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const removeProcess = (id: string) => {
    setFormData(prev => ({
      ...prev,
      processes: prev.processes.filter(p => p.id !== id)
    }));
  };

  const addChemical = (processId: string) => {
    setFormData(prev => ({
      ...prev,
      processes: prev.processes.map(p => p.id === processId ? {
        ...p,
        chemicals: [...p.chemicals, { name: '', dosage: 0, unit: 'g/l', costPerUnit: 0 }]
      } : p)
    }));
  };

  const updateChemical = (processId: string, chemIndex: number, updates: any) => {
    setFormData(prev => ({
      ...prev,
      processes: prev.processes.map(p => p.id === processId ? {
        ...p,
        chemicals: p.chemicals.map((c, i) => i === chemIndex ? { ...c, ...updates } : c)
      } : p)
    }));
  };

  const removeChemical = (processId: string, chemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      processes: prev.processes.map(p => p.id === processId ? {
        ...p,
        chemicals: p.chemicals.filter((_, i) => i !== chemIndex)
      } : p)
    }));
  };

  const calculations = useMemo(() => {
    let totalChemicalCost = 0;
    let totalUtilityCost = 0;
    let totalLaborCost = 0;
    let totalTime = 0;

    formData.processes.forEach(p => {
      const chemCost = p.chemicals.reduce((sum, c) => sum + (c.dosage * c.costPerUnit), 0);
      totalChemicalCost += chemCost;
      totalUtilityCost += p.utilityCost;
      totalLaborCost += p.laborCost;
      totalTime += p.timeMinutes;
    });

    const totalCostPerGarment = totalChemicalCost + totalUtilityCost + totalLaborCost;
    const totalCostForOrder = totalCostPerGarment * formData.orderQty;

    return {
      totalChemicalCost,
      totalUtilityCost,
      totalLaborCost,
      totalTime,
      totalCostPerGarment,
      totalCostForOrder
    };
  }, [formData]);

  const handlePrint = () => {
    window.print();
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.styleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.buyer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-cyan-600 hover:border-cyan-600 transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase italic leading-none text-slate-900">
              World-Class Denim Wash Costing
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Advanced Wet & Dry Process Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('DASHBOARD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'DASHBOARD' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button 
            onClick={() => { setView('ENTRY'); setStep(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'ENTRY' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Plus size={14} /> New Costing
          </button>
          <button 
            onClick={() => setView('DATABASE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'DATABASE' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Database size={14} /> Database
          </button>
        </div>
      </div>

      {view === 'DASHBOARD' && <WashCostingDashboard />}

      {view === 'DATABASE' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 uppercase italic">Costing Database</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search style or buyer..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-bold w-64"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => { resetForm(); setView('ENTRY'); }}
                className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                <Plus size={16} /> New Costing
              </button>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase font-black text-slate-500">
                <tr>
                  <th className="p-6">Date</th>
                  <th className="p-6">Buyer</th>
                  <th className="p-6">Style</th>
                  <th className="p-6">Color</th>
                  <th className="p-6">Total Cost</th>
                  <th className="p-6">User</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.filter(r => 
                  r.styleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  r.buyer.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 font-bold">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="p-6 font-bold">{record.buyer}</td>
                    <td className="p-6 font-bold">{record.styleNumber}</td>
                    <td className="p-6 font-bold">{record.color}</td>
                    <td className="p-6 font-black text-emerald-600">${record.totalCost.toFixed(2)}</td>
                    <td className="p-6 font-bold">{record.user}</td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedHistory(record); setShowHistoryModal(true); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="History"
                        >
                          <HistoryIcon size={16} />
                        </button>
                        <button 
                          onClick={() => handleEdit(record)}
                          className="p-2 text-slate-400 hover:text-cyan-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(record.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button 
                          onClick={() => window.print()}
                          className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                          title="Print"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showRemarkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase italic">Modification Remark</h3>
              <button onClick={() => setShowRemarkModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-4">Please provide a reason for this modification:</p>
            <textarea 
              className="w-full h-32 p-4 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter remark here..."
              value={modificationRemark}
              onChange={e => setModificationRemark(e.target.value)}
            />
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowRemarkModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSave}
                disabled={!modificationRemark.trim()}
                className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-xl text-xs font-black uppercase hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-200 disabled:opacity-50 disabled:shadow-none"
              >
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic">Modification History</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {selectedHistory.styleNumber} | {selectedHistory.buyer}
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {selectedHistory.history && selectedHistory.history.length > 0 ? (
                selectedHistory.history.map((h, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== selectedHistory.history!.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-100"></div>
                    )}
                    <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0 z-10">
                      <HistoryIcon size={14} />
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 flex-1 border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(h.date).toLocaleString()}</span>
                        <span className="text-[10px] font-black text-cyan-600 uppercase bg-cyan-50 px-2 py-0.5 rounded">{h.user}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{h.remark}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <HistoryIcon size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-sm font-bold text-slate-400">No modification history found.</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-800 transition-all shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'ENTRY' && (
        <>
          {/* Stepper */}
          <div className="flex items-center justify-center gap-4 max-w-xl mx-auto">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all border-2 ${step === s ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg scale-110' : step > s ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-300 border-slate-200'}`}
                >
                  {step > s ? <CheckCircle2 size={18} /> : s}
                </div>
                {s < 3 && <div className={`h-1 flex-1 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 md:p-12">
        {step === 1 && (
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                <FileText size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase italic">Style & Order Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Style Number</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                  value={formData.styleNumber}
                  onChange={e => setFormData({ ...formData, styleNumber: e.target.value })}
                  placeholder="e.g. DMN-5544"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                  value={formData.buyer}
                  onChange={e => setFormData({ ...formData, buyer: e.target.value })}
                  placeholder="e.g. LEVI'S"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Quantity (Pcs)</label>
                <input 
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                  value={formData.orderQty || ''}
                  onChange={e => setFormData({ ...formData, orderQty: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-cyan-500 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-xl active:scale-95"
              >
                Next: Process Definition <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Beaker size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase italic">Process & Chemical Breakdown</h2>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => addProcess('DRY')}
                  className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all"
                >
                  <Wind size={14} /> Add Dry Process
                </button>
                <button 
                  onClick={() => addProcess('WET')}
                  className="flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 transition-all"
                >
                  <Droplet size={14} /> Add Wet Process
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {formData.processes.map((process, idx) => (
                <div key={process.id} className={`p-8 rounded-[2rem] border-2 ${process.type === 'WET' ? 'border-cyan-100 bg-cyan-50/30' : 'border-orange-100 bg-orange-50/30'} space-y-6 relative`}>
                  <button 
                    onClick={() => removeProcess(process.id)}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Process Name</label>
                      <input 
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none"
                        value={process.name}
                        onChange={e => updateProcess(process.id, { name: e.target.value })}
                        placeholder={process.type === 'WET' ? 'e.g. Enzyme Wash' : 'e.g. Whiskering'}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">M/C Type</label>
                      <input 
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none"
                        value={process.machineType}
                        onChange={updateProcess.bind(null, process.id, { machineType: '' })} // Placeholder logic
                        placeholder="e.g. Front Loader"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time (Min)</label>
                      <input 
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black outline-none"
                        value={process.timeMinutes || ''}
                        onChange={e => updateProcess(process.id, { timeMinutes: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {process.type === 'WET' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-cyan-700 uppercase tracking-widest flex items-center gap-2">
                          <FlaskConical size={14} /> Chemical Recipes
                        </h4>
                        <button 
                          onClick={() => addChemical(process.id)}
                          className="text-[9px] font-black text-cyan-600 uppercase hover:underline"
                        >
                          + Add Chemical
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {process.chemicals.map((chem, cIdx) => (
                          <div key={cIdx} className="grid grid-cols-4 gap-4 bg-white/50 p-3 rounded-xl border border-cyan-100">
                            <input 
                              type="text"
                              className="bg-transparent border-none text-xs font-bold focus:ring-0"
                              placeholder="Chemical Name"
                              value={chem.name}
                              onChange={e => updateChemical(process.id, cIdx, { name: e.target.value })}
                            />
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                className="w-full bg-transparent border-none text-xs font-black text-right focus:ring-0"
                                value={chem.dosage || ''}
                                onChange={e => updateChemical(process.id, cIdx, { dosage: parseFloat(e.target.value) || 0 })}
                              />
                              <span className="text-[9px] font-bold text-slate-400">g/l</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-slate-400">$</span>
                              <input 
                                type="number"
                                className="w-full bg-transparent border-none text-xs font-black text-right focus:ring-0"
                                value={chem.costPerUnit || ''}
                                onChange={e => updateChemical(process.id, cIdx, { costPerUnit: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <button onClick={() => removeChemical(process.id, cIdx)} className="text-slate-300 hover:text-rose-500 text-right px-2">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-200/50">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Utility Cost</p>
                      <div className="flex items-center gap-2">
                        <Zap size={12} className="text-amber-500" />
                        <input 
                          type="number"
                          className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0"
                          value={process.utilityCost || ''}
                          onChange={e => updateProcess(process.id, { utilityCost: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Labor Cost</p>
                      <div className="flex items-center gap-2">
                        <Layers size={12} className="text-indigo-500" />
                        <input 
                          type="number"
                          className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0"
                          value={process.laborCost || ''}
                          onChange={e => updateProcess(process.id, { laborCost: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Process Cost (Subtotal)</p>
                      <p className="text-lg font-black text-slate-900">
                        ${(process.chemicals.reduce((s, c) => s + (c.dosage * c.costPerUnit), 0) + process.utilityCost + process.laborCost).toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {formData.processes.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No processes defined. Start by adding a Wet or Dry process.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button 
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-cyan-500 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-xl active:scale-95"
              >
                Next: Final Summary <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Calculator size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase italic">Costing Summary</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Chemical Cost</p>
                <p className="text-2xl font-black text-cyan-600">${calculations.totalChemicalCost.toFixed(4)}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Utility Cost</p>
                <p className="text-2xl font-black text-amber-600">${calculations.totalUtilityCost.toFixed(4)}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Labor Cost</p>
                <p className="text-2xl font-black text-indigo-600">${calculations.totalLaborCost.toFixed(4)}</p>
              </div>
              <div className="bg-emerald-600 p-6 rounded-3xl shadow-xl shadow-emerald-100 space-y-1">
                <p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest">Total Cost / Garment</p>
                <p className="text-2xl font-black text-white">${calculations.totalCostPerGarment.toFixed(4)}</p>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-10 rounded-[3rem] space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <h3 className="text-lg font-black uppercase tracking-tighter italic">Order Financial Impact</h3>
                <div className="px-4 py-2 bg-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Order Qty: {formData.orderQty} Pcs
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Total Wash Cost for Style</p>
                  <p className="text-5xl font-black tracking-tighter text-emerald-400">${calculations.totalCostForOrder.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Total Process Time</p>
                    <p className="text-xl font-black">{calculations.totalTime} Minutes</p>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Avg. Cost / Min</p>
                    <p className="text-xl font-black">${calculations.totalTime > 0 ? (calculations.totalCostPerGarment / calculations.totalTime).toFixed(4) : '0.0000'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button 
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-emerald-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl active:scale-95"
              >
                Confirm & Save Record <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        )}
          </div>
        </>
      )}
    </div>
  );
};

export default WashCosting;
