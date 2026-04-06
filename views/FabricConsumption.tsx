import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Ruler, 
  Scissors, 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  Search, 
  Database, 
  FilePlus,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { motion, AnimatePresence } from 'motion/react';
import { FabricConsumptionEntry } from '../types';

export const FabricConsumption: React.FC = () => {
  const [view, setView] = useState<'ENTRY' | 'DATABASE'>('ENTRY');
  const [entries, setEntries] = useState<FabricConsumptionEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<FabricConsumptionEntry>>({
    style: '',
    buyer: '',
    markerLength: 0,
    markerWidth: 0,
    garmentsPerMarker: 1,
    wastagePercent: 3.5,
    fabricType: ''
  });

  useEffect(() => {
    setEntries(mockDb.getFabricConsumptions());
  }, []);

  const calculateConsumption = () => {
    if (!formData.markerLength || !formData.garmentsPerMarker) return 0;
    const netCons = formData.markerLength / formData.garmentsPerMarker;
    const withWastage = netCons * (1 + (formData.wastagePercent || 0) / 100);
    return parseFloat(withWastage.toFixed(3));
  };

  const handleSave = () => {
    if (!formData.style || !formData.buyer || !formData.markerLength) {
      alert('Please fill in all required fields');
      return;
    }

    const newEntry: FabricConsumptionEntry = {
      id: formData.id || Date.now().toString(),
      style: formData.style!,
      buyer: formData.buyer!,
      markerLength: formData.markerLength!,
      markerWidth: formData.markerWidth || 0,
      garmentsPerMarker: formData.garmentsPerMarker!,
      wastagePercent: formData.wastagePercent!,
      fabricType: formData.fabricType || '',
      consumptionPerGarment: calculateConsumption(),
      updatedAt: new Date().toISOString()
    };

    mockDb.saveFabricConsumption(newEntry);
    setEntries(mockDb.getFabricConsumptions());
    setView('DATABASE');
    setFormData({
      style: '',
      buyer: '',
      markerLength: 0,
      markerWidth: 0,
      garmentsPerMarker: 1,
      wastagePercent: 3.5,
      fabricType: ''
    });
  };

  const filteredEntries = entries.filter(e => 
    e.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.buyer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase italic leading-none text-slate-900">
              Fabric Consumption Analysis
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Precision Material Requirement Planning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('ENTRY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'ENTRY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FilePlus size={14} /> Entry
          </button>
          <button 
            onClick={() => setView('DATABASE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'DATABASE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Database size={14} /> Database
          </button>
        </div>
      </div>

      {view === 'ENTRY' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Calculator size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase italic">Consumption Calculator</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={formData.buyer}
                    onChange={e => setFormData({ ...formData, buyer: e.target.value })}
                    placeholder="e.g. LEVI'S"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Style Number</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={formData.style}
                    onChange={e => setFormData({ ...formData, style: e.target.value })}
                    placeholder="e.g. DMN-5544"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marker Length (Yds)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={formData.markerLength || ''}
                    onChange={e => setFormData({ ...formData, markerLength: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Garments Per Marker</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={formData.garmentsPerMarker || ''}
                    onChange={e => setFormData({ ...formData, garmentsPerMarker: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wastage (%)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={formData.wastagePercent || ''}
                    onChange={e => setFormData({ ...formData, wastagePercent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fabric Type</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={formData.fabricType}
                    onChange={e => setFormData({ ...formData, fabricType: e.target.value })}
                    placeholder="e.g. 12oz Denim"
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-blue-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl active:scale-95"
                >
                  <Save size={16} /> Save Consumption
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Live Result</h3>
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Consumption Per Garment</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter text-blue-400">{calculateConsumption()}</span>
                    <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Yds</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Net Consumption</p>
                    <p className="text-sm font-black">{(formData.markerLength && formData.garmentsPerMarker ? formData.markerLength / formData.garmentsPerMarker : 0).toFixed(3)} Yds</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Wastage Amount</p>
                    <p className="text-sm font-black">{(calculateConsumption() - (formData.markerLength && formData.garmentsPerMarker ? formData.markerLength / formData.garmentsPerMarker : 0)).toFixed(3)} Yds</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-6">
              <div className="flex items-center gap-3 text-blue-600 mb-2">
                <AlertCircle size={18} />
                <h4 className="text-xs font-black uppercase tracking-tight">Pro Tip</h4>
              </div>
              <p className="text-[10px] font-bold text-blue-600/70 leading-relaxed uppercase">
                Marker efficiency is automatically factored into the marker length. Ensure the length provided is for the full marker including ends.
              </p>
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
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
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
                  <th className="px-8">Fabric Type</th>
                  <th className="px-8">Marker Details</th>
                  <th className="px-8">Wastage</th>
                  <th className="px-8 text-right">Consumption</th>
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
                      <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">
                        {e.fabricType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[10px] font-bold text-slate-600 uppercase">{e.markerLength} Yds / {e.garmentsPerMarker} Pcs</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[10px] font-black text-rose-500 uppercase">{e.wastagePercent}%</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-sm font-black text-blue-600">{e.consumptionPerGarment} Yds</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <Plus size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            const updated = entries.filter(item => item.id !== e.id);
                            setEntries(updated);
                            localStorage.setItem('protrack_fabric_consumption', JSON.stringify(updated));
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

export default FabricConsumption;
