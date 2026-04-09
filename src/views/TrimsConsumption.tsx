import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Tag, 
  ShoppingBag, 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  Search, 
  Database, 
  FilePlus,
  CheckCircle2,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from '../services/apiService';
import { TrimsConsumptionEntry, TrimItem } from '../types';

export const TrimsConsumption: React.FC = () => {
  const [view, setView] = useState<'ENTRY' | 'DATABASE'>('ENTRY');
  const [entries, setEntries] = useState<TrimsConsumptionEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<TrimsConsumptionEntry>>({
    style: '',
    buyer: '',
    orderQty: 0,
    trims: []
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getConsumption('trims');
        setEntries(data);
      } catch (error) {
        console.error("Failed to load trims consumption:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [view]);

  const addTrim = () => {
    const newTrim: TrimItem = {
      id: Date.now().toString(),
      name: '',
      unit: 'Pcs',
      consumptionPerGarment: 0,
      unitPrice: 0,
      wastagePercent: 2
    };
    setFormData(prev => ({
      ...prev,
      trims: [...(prev.trims || []), newTrim]
    }));
  };

  const updateTrim = (id: string, updates: Partial<TrimItem>) => {
    setFormData(prev => ({
      ...prev,
      trims: prev.trims?.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const removeTrim = (id: string) => {
    setFormData(prev => ({
      ...prev,
      trims: prev.trims?.filter(t => t.id !== id)
    }));
  };

  const calculateTotalCost = () => {
    return formData.trims?.reduce((sum, t) => {
      const qtyWithWastage = t.consumptionPerGarment * (1 + t.wastagePercent / 100);
      return sum + (qtyWithWastage * t.unitPrice);
    }, 0) || 0;
  };

  const handleSave = async () => {
    if (!formData.style || !formData.buyer || !formData.trims?.length) {
      alert('Please fill in style, buyer and at least one trim item');
      return;
    }

    const newEntry: TrimsConsumptionEntry = {
      id: formData.id || Date.now().toString(),
      style: formData.style!,
      buyer: formData.buyer!,
      orderQty: formData.orderQty || 0,
      trims: formData.trims!,
      totalTrimCost: calculateTotalCost(),
      updatedAt: new Date().toISOString()
    };

    try {
      await apiService.saveConsumption('trims', {
        id: newEntry.id,
        style_name: newEntry.style,
        buyer_name: newEntry.buyer,
        data: newEntry
      });
      alert('Trim costing saved successfully!');
      setView('DATABASE');
      setFormData({
        style: '',
        buyer: '',
        orderQty: 0,
        trims: []
      });
    } catch (error) {
      alert('Failed to save trim costing');
    }
  };

  const filteredEntries = entries.filter(e => 
    e.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.buyer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
            <Boxes size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase italic leading-none text-slate-900">
              Trims & Accessories Analysis
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Component & Trim Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('ENTRY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'ENTRY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FilePlus size={14} /> Entry
          </button>
          <button 
            onClick={() => setView('DATABASE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'DATABASE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Database size={14} /> Database
          </button>
        </div>
      </div>

      {view === 'ENTRY' ? (
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={formData.buyer}
                  onChange={e => setFormData({ ...formData, buyer: e.target.value })}
                  placeholder="e.g. H&M"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Style Number</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={formData.style}
                  onChange={e => setFormData({ ...formData, style: e.target.value })}
                  placeholder="e.g. HM-デニム-22"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Qty</label>
                <input 
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={formData.orderQty || ''}
                  onChange={e => setFormData({ ...formData, orderQty: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase italic text-slate-900">Trim Components</h3>
                <button 
                  onClick={addTrim}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                >
                  <Plus size={14} /> Add Component
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Trim Name</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cons/Gmt</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Price/Unit</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Wastage %</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Cost/Gmt</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.trims?.map((trim) => (
                      <tr key={trim.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <input 
                            type="text"
                            className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold p-0"
                            placeholder="e.g. Shank Button"
                            value={trim.name}
                            onChange={e => updateTrim(trim.id, { name: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-3">
                          <select 
                            className="bg-transparent border-none focus:ring-0 text-xs font-bold p-0"
                            value={trim.unit}
                            onChange={e => updateTrim(trim.id, { unit: e.target.value })}
                          >
                            <option value="Pcs">Pcs</option>
                            <option value="Dzn">Dzn</option>
                            <option value="Gross">Gross</option>
                            <option value="Yds">Yds</option>
                            <option value="Meters">Meters</option>
                          </select>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <input 
                            type="number"
                            step="0.01"
                            className="w-full bg-transparent border-none focus:ring-0 text-xs font-black text-center p-0"
                            value={trim.consumptionPerGarment || ''}
                            onChange={e => updateTrim(trim.id, { consumptionPerGarment: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <input 
                            type="number"
                            step="0.001"
                            className="w-full bg-transparent border-none focus:ring-0 text-xs font-black text-right p-0"
                            value={trim.unitPrice || ''}
                            onChange={e => updateTrim(trim.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="px-6 py-3 text-center">
                          <input 
                            type="number"
                            step="0.1"
                            className="w-full bg-transparent border-none focus:ring-0 text-xs font-black text-center p-0 text-rose-500"
                            value={trim.wastagePercent || ''}
                            onChange={e => updateTrim(trim.id, { wastagePercent: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="text-xs font-black text-indigo-600">
                            ${(trim.consumptionPerGarment * (1 + trim.wastagePercent / 100) * trim.unitPrice).toFixed(4)}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => removeTrim(trim.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!formData.trims || formData.trims.length === 0) && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic text-xs">
                          No trims added. Click "Add Component" to begin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {formData.trims && formData.trims.length > 0 && (
                    <tfoot className="bg-slate-50/50 font-black">
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-slate-400">Total Trim Cost / Garment</td>
                        <td className="px-6 py-4 text-right text-sm text-indigo-600">
                          ${calculateTotalCost().toFixed(4)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-indigo-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl active:scale-95"
              >
                <Save size={16} /> Save Trim Costing
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search style or buyer..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase h-14">
                  <th className="px-8">Style & Buyer</th>
                  <th className="px-8">Order Qty</th>
                  <th className="px-8">Trim Components</th>
                  <th className="px-8 text-right">Cost / Gmt</th>
                  <th className="px-8 text-right">Total Order Cost</th>
                  <th className="px-8 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-xs font-black text-slate-900 uppercase">{e.style}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{e.buyer}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-slate-600">{e.orderQty.toLocaleString()} Pcs</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1">
                        {e.trims.slice(0, 3).map((t, i) => (
                          <span key={i} className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                            {t.name}
                          </span>
                        ))}
                        {e.trims.length > 3 && <span className="text-[8px] font-black text-slate-400">+{e.trims.length - 3} more</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-sm font-black text-indigo-600">${e.totalTrimCost.toFixed(4)}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-sm font-black text-slate-900">${(e.totalTrimCost * e.orderQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            const updated = entries.filter(item => item.id !== e.id);
                            setEntries(updated);
                            localStorage.setItem('protrack_trims_consumption', JSON.stringify(updated));
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-300">
                        <Database size={48} className="opacity-20" />
                        <p className="text-sm font-black uppercase tracking-widest">No records found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrimsConsumption;
