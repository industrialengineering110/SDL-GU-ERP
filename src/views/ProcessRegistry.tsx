
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Save, Trash2, Search, ArrowLeft, Activity, 
  Layers, Hammer, Gauge, Info, CheckCircle, RefreshCcw, 
  Sparkles, FileText, X, ChevronDown, Tag, FlaskConical,
  Wrench, ClipboardList, Zap, LayoutGrid, Heart, Edit3, User
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { DepartmentType, ProcessConfig, AppUser, SystemConfig } from '../types';
import SearchableSelect from '@/components/SearchableSelect';

interface ProcessRegistryProps {
  department: DepartmentType;
  currentUser: AppUser;
  onBack?: () => void;
}

const ProcessRegistry: React.FC<ProcessRegistryProps> = ({ department, currentUser, onBack }) => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [processes, setProcesses] = useState<ProcessConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [filterGarmentType, setFilterGarmentType] = useState('All Garment Types');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNewPart, setIsAddingNewPart] = useState(false);
  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newTypeName, setNewTypeName] = useState('');

  const [form, setForm] = useState<Partial<ProcessConfig>>({
    garmentType: '5-Pocket',
    part: 'Preparation',
    processName: '',
    machineType: '',
    smv: 0,
    exceptionalBuyer: '',
    remarks: ''
  });

  useEffect(() => {
    const sysConfig = mockDb.getSystemConfig();
    setConfig(sysConfig);
    setProcesses(sysConfig.processConfigs[department] || []);
  }, [department]);

  const handleSave = () => {
    if (!form.processName || !form.machineType || form.smv === undefined || !form.garmentType) {
      alert("Please complete all technical fields."); return;
    }

    const processData: ProcessConfig = {
      id: editingId || Date.now().toString(),
      garmentType: form.garmentType!,
      part: form.part || 'Preparation',
      processName: form.processName,
      machineType: form.machineType!,
      smv: form.smv,
      exceptionalBuyer: form.exceptionalBuyer,
      remarks: form.remarks
    };

    let updated: ProcessConfig[];
    if (editingId) {
      updated = processes.map(p => p.id === editingId ? processData : p);
    } else {
      updated = [...processes, processData];
    }

    const newConfig = { ...config!, processConfigs: { ...config!.processConfigs, [department]: updated } };
    mockDb.saveSystemConfig(newConfig);
    setProcesses(updated);
    setForm({ garmentType: '5-Pocket', part: 'Preparation', processName: '', machineType: '', smv: 0, exceptionalBuyer: '', remarks: '' });
    setEditingId(null);
    setIsFormOpen(false);
    setMessage(editingId ? `${processData.processName} updated.` : `${processData.processName} committed to matrix.`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddNewPart = () => {
    if (!newPartName.trim() || !config) return;
    if (config.garmentParts.includes(newPartName.trim())) {
      alert("Part already exists."); return;
    }
    const updatedParts = [...config.garmentParts, newPartName.trim()];
    const newConfig = { ...config, garmentParts: updatedParts };
    mockDb.saveSystemConfig(newConfig);
    setConfig(newConfig);
    setForm({ ...form, part: newPartName.trim() });
    setNewPartName('');
    setIsAddingNewPart(false);
  };

  const handleAddNewType = () => {
    if (!newTypeName.trim() || !config) return;
    if (config.productCategories.includes(newTypeName.trim())) {
      alert("Type already exists."); return;
    }
    const updatedTypes = [...config.productCategories, newTypeName.trim()];
    const newConfig = { ...config, productCategories: updatedTypes };
    mockDb.saveSystemConfig(newConfig);
    setConfig(newConfig);
    setForm({ ...form, garmentType: newTypeName.trim() });
    setNewTypeName('');
    setIsAddingNewType(false);
  };

  const handleEdit = (p: ProcessConfig) => {
    setForm({ ...p });
    setEditingId(p.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = processes.filter(p => {
    const matchSearch = p.processName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.machineType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterGarmentType === 'All Garment Types' || p.garmentType === filterGarmentType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-12 pb-24 max-w-[1600px] mx-auto animate-in fade-in duration-500 px-4">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onBack ? onBack() : navigate(`/${department.toLowerCase()}/hub`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 className="text-xl font-black text-[#1a1c2e] tracking-tight uppercase italic leading-none">
              {department} Process SMV Registry
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              Industrial Engineering Department
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              if (!isFormOpen) {
                setEditingId(null);
                setForm({ garmentType: '5-Pocket', part: 'Preparation', processName: '', machineType: '', smv: 0, exceptionalBuyer: '', remarks: '' });
              }
            }} 
            className={`${isFormOpen ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#1a1c2e] hover:bg-black'} text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95`}
          >
            {isFormOpen ? <X size={16}/> : <Plus size={16}/>}
            {isFormOpen ? 'Cancel Setup' : 'Add New Process'}
          </button>
          <button 
            onClick={() => navigate(-1)} 
            className="bg-white text-slate-900 border border-slate-200 px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
          >
            <X size={16}/> Discard Draft
          </button>
        </div>
      </div>

      {/* TECHNICAL PROCESS SETUP CARD */}
      {isFormOpen && (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 space-y-10 relative overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 text-[#6366f1]">
            <Zap size={24} fill="currentColor" />
            <h3 className="text-base font-black uppercase tracking-[0.1em]">{editingId ? 'Update Process Definition' : 'Technical Process Setup'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest">Garment Type</label>
                <button 
                  onClick={() => setIsAddingNewType(!isAddingNewType)}
                  className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
                >
                  {isAddingNewType ? 'Cancel' : '+ New Type'}
                </button>
              </div>
              {isAddingNewType ? (
                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                    placeholder="New type name..." 
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                  />
                  <button 
                    onClick={handleAddNewType}
                    className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black shadow-sm appearance-none outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                    value={form.garmentType} 
                    onChange={e => setForm({...form, garmentType: e.target.value})}
                  >
                    {config?.productCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest">Garment Part</label>
                <button 
                  onClick={() => setIsAddingNewPart(!isAddingNewPart)}
                  className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
                >
                  {isAddingNewPart ? 'Cancel' : '+ New Part'}
                </button>
              </div>
              {isAddingNewPart ? (
                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                    placeholder="New part name..." 
                    value={newPartName}
                    onChange={e => setNewPartName(e.target.value)}
                  />
                  <button 
                    onClick={handleAddNewPart}
                    className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black shadow-sm appearance-none outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                    value={form.part} 
                    onChange={e => setForm({...form, part: e.target.value})}
                  >
                    {config?.garmentParts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest px-1">Operation Name</label>
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-bold shadow-inner outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                placeholder="e.g. Pocket Joining" 
                value={form.processName} 
                onChange={e => setForm({...form, processName: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest px-1">Machine Type</label>
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-bold shadow-inner outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                placeholder="e.g. SNLS, 4TOL" 
                value={form.machineType} 
                onChange={e => setForm({...form, machineType: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest px-1">Standard SMV</label>
              <div className="relative">
                <Gauge size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="number" 
                  step="0.001" 
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 text-xs font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                  placeholder="0.000" 
                  value={form.smv || ''} 
                  onChange={e => setForm({...form, smv: parseFloat(e.target.value) || 0})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest px-1">Exceptional Buyer</label>
              <div className="relative">
                <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                  placeholder="e.g. Levi's, H&M" 
                  value={form.exceptionalBuyer || ''} 
                  onChange={e => setForm({...form, exceptionalBuyer: e.target.value})} 
                />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2">
              <label className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest px-1">Remarks</label>
              <input 
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                placeholder="Technical notes..." 
                value={form.remarks || ''} 
                onChange={e => setForm({...form, remarks: e.target.value})} 
              />
            </div>

            <div className="lg:col-span-4 flex justify-end">
              <button 
                onClick={handleSave} 
                className="bg-[#1a1c22] text-white px-12 py-4 rounded-xl font-black text-[11px] uppercase shadow-2xl hover:bg-black transition-all flex items-center gap-3 active:scale-95"
              >
                <Save size={18}/> {editingId ? 'Update Process' : 'Commit to Matrix'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCESS REGISTRY DATABASE CARD */}
      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-[#1a1c2e] p-3 rounded-2xl text-white shadow-lg">
              <FileText size={20}/>
            </div>
            <h3 className="text-lg font-black text-[#1a1c2e] uppercase tracking-tight">Process Registry Database</h3>
            <div className="w-64">
              <SearchableSelect 
                value={filterGarmentType}
                options={[
                  { id: 'all', name: 'All Garment Types' },
                  ...(config?.productCategories.map(c => ({ id: c, name: c })) || [])
                ]}
                onChange={val => setFilterGarmentType(val)}
                placeholder="Filter by Garment Type..."
              />
            </div>
          </div>
          <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3 text-xs font-black shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
              placeholder="Search matrix by name or machine..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#1a1c2e] text-white text-[10px] font-black uppercase tracking-widest h-14">
                <th className="px-6 border-r border-white/5">Classification</th>
                <th className="px-6 border-r border-white/5">Part Context</th>
                <th className="px-6 border-r border-white/5">Process / Operation Name</th>
                <th className="px-6 border-r border-white/5">Required Machine</th>
                <th className="px-6 border-r border-white/5 text-center bg-[#252841]">Standard SMV</th>
                <th className="px-6 border-r border-white/5">Exceptional Buyer</th>
                <th className="px-6 border-r border-white/5">Remarks</th>
                <th className="px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
              {filtered.map(p => (
                <tr key={p.id} className="h-14 hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 border-r border-slate-100">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{p.garmentType}</span>
                  </td>
                  <td className="px-6 border-r border-slate-100 uppercase text-[10px] text-slate-400">
                    {p.part}
                  </td>
                  <td className="px-6 border-r border-slate-100 uppercase truncate max-w-[200px] font-black text-slate-900">
                    {p.processName}
                  </td>
                  <td className="px-6 border-r border-slate-100 uppercase font-black text-[10px] text-slate-400 tracking-widest">
                    {p.machineType}
                  </td>
                  <td className="px-6 border-r border-slate-100 text-center font-mono font-black text-base text-indigo-900 bg-indigo-50/20">
                    {p.smv.toFixed(3)}
                  </td>
                  <td className="px-6 border-r border-slate-100 text-[10px] text-slate-500 italic">
                    {p.exceptionalBuyer || '-'}
                  </td>
                  <td className="px-6 border-r border-slate-100 text-[10px] text-slate-400 truncate max-w-[150px]">
                    {p.remarks || '-'}
                  </td>
                  <td className="px-6 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(p)} 
                        className="p-2 text-slate-300 hover:text-indigo-600 transition-all hover:bg-indigo-50 rounded-xl"
                        title="Edit Process"
                      >
                        <Edit3 size={16}/>
                      </button>
                      <button 
                        onClick={() => {
                          const updated = processes.filter(x => x.id !== p.id);
                          const newConfig = { ...config!, processConfigs: { ...config!.processConfigs, [department]: updated } };
                          mockDb.saveSystemConfig(newConfig);
                          setProcesses(updated);
                        }} 
                        className="p-2 text-slate-300 hover:text-rose-600 transition-all hover:bg-rose-50 rounded-xl"
                        title="Delete Process"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-40 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative mb-6">
                        <Activity size={48} className="text-slate-100" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Heart size={20} className="text-slate-200 fill-slate-50 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">Registry Database Empty</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Add technical definitions to see them here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Toast */}
      {message && (
        <div className="fixed bottom-12 right-12 p-5 bg-emerald-600 text-white rounded-[1.5rem] shadow-4xl font-black flex items-center gap-4 animate-in slide-in-from-right-10 z-[1000] border-2 border-white">
          <CheckCircle size={24}/>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-tight leading-none">System Ledger Updated</span>
            <span className="text-[8px] opacity-80 mt-1 uppercase leading-none">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessRegistry;
