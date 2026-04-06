
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { FlaskConical, Info, Save, Edit2, Check, X, Filter, Plus, Trash2 } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { SystemConfig, ThreadRatio, WastageData, SDLWastage } from '../types';
import { useGlobal } from '../App';
import SearchableSelect from './SearchableSelect';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const SewingThreadAnalysis: React.FC = () => {
  const { theme } = useGlobal();
  const [config, setConfig] = useState<SystemConfig>(mockDb.getSystemConfig());
  
  // Separate edit states
  const [isEditingRatios, setIsEditingRatios] = useState(false);
  const [isEditingSDL, setIsEditingSDL] = useState(false);

  const [tempRatios, setTempRatios] = useState<ThreadRatio[]>([]);
  const [tempSDLWastage, setTempSDLWastage] = useState<SDLWastage[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<string>('ALL');

  useEffect(() => {
    setTempRatios(config.threadRatios || []);
    setTempSDLWastage(config.sdlWastage || []);
  }, [config]);

  const buyers = useMemo(() => {
    return ['ALL', ...(config.buyers || [])];
  }, [config.buyers]);

  const buyerOptions = useMemo(() => 
    buyers.map(b => ({ id: b, name: b })), 
    [buyers]
  );

  const handleAddRatio = () => {
    const newRatio: ThreadRatio = {
      id: Math.random().toString(36).substr(2, 9),
      buyer: selectedBuyer === 'ALL' ? '' : selectedBuyer,
      stitchType: 'New',
      pos1Name: 'Needle',
      pos1Ratio: 0,
      pos2Name: 'Bobbin/Looper',
      pos2Ratio: 0
    };
    setTempRatios([...tempRatios, newRatio]);
  };

  const handleAddSDLWastage = () => {
    const nextId = (tempSDLWastage.length + 1).toString();
    setTempSDLWastage([...tempSDLWastage, { id: nextId, minQty: 0, maxQty: 0, allowance: 0 }]);
  };

  const handleRemoveRatio = (id: string) => {
    setTempRatios(tempRatios.filter(r => r.id !== id));
  };

  const handleRemoveSDLWastage = (id: string) => {
    setTempSDLWastage(tempSDLWastage.filter(s => s.id !== id));
  };

  const filteredRatios = useMemo(() => {
    const source = isEditingRatios ? tempRatios : (config.threadRatios || []);
    if (selectedBuyer === 'ALL') return source;
    return source.filter(r => r?.buyer === selectedBuyer);
  }, [selectedBuyer, isEditingRatios, tempRatios, config.threadRatios]);

  const chartData = useMemo(() => {
    return (filteredRatios || []).map(r => ({
      name: `${r.stitchType || 'N/A'}`,
      ratio: (r.pos1Ratio || 0) + (r.pos2Ratio || 0),
      buyer: r.buyer || 'N/A'
    }));
  }, [filteredRatios]);

  const handleSaveRatios = () => {
    const updatedConfig = { ...config, threadRatios: tempRatios };
    mockDb.saveSystemConfig(updatedConfig);
    setConfig(updatedConfig);
    setIsEditingRatios(false);
  };

  const handleSaveSDL = () => {
    const updatedConfig = { ...config, sdlWastage: tempSDLWastage };
    mockDb.saveSystemConfig(updatedConfig);
    setConfig(updatedConfig);
    setIsEditingSDL(false);
  };

  const handleCancelRatios = () => {
    setTempRatios(config.threadRatios || []);
    setIsEditingRatios(false);
  };

  const handleCancelSDL = () => {
    setTempSDLWastage(config.sdlWastage || []);
    setIsEditingSDL(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg">
            <FlaskConical size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Sewing Thread Analysis</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Process Lab & Factory Standards</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <SearchableSelect 
              value={selectedBuyer}
              options={buyerOptions}
              onChange={setSelectedBuyer}
              placeholder="Search Buyer..."
            />
          </div>

          <div className="flex gap-2">
            {/* Global edit removed in favor of per-section edit */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Thread Ratio Chart */}
        <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Thread Ratios - {selectedBuyer}</h3>
            <div className="p-2 bg-accent rounded-lg text-muted-foreground"><Info size={14} /></div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: 'var(--chart-text)' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: 'var(--chart-text)' }} width={120} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)' }}
                  cursor={{ fill: 'var(--accent)' }}
                />
                <Bar dataKey="ratio" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center">Thread consumption factor per cm of seam</p>
        </div>

        {/* SDL Wastage Chart */}
        <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">SDL Wastage (Quantity Based)</h3>
            <div className="p-2 bg-accent rounded-lg text-muted-foreground"><Info size={14} /></div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={isEditingSDL ? tempSDLWastage : (config.sdlWastage || [])}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis 
                  dataKey="minQty" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--chart-text)' }}
                  label={{ value: 'Quantity Range', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 700, fill: 'var(--chart-text)' }}
                  tickFormatter={(val, idx) => {
                    const item = (isEditingSDL ? tempSDLWastage : (config.sdlWastage || []))[idx];
                    return item ? `${item.minQty}-${item.maxQty}` : '';
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--chart-text)' }}
                  label={{ value: 'Allowance', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 700, fill: 'var(--chart-text)' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)' }}
                  formatter={(value: number) => [`${value}`, 'Allowance']}
                  labelFormatter={(idx) => {
                    const item = (isEditingSDL ? tempSDLWastage : (config.sdlWastage || []))[idx];
                    return item ? `Quantity: ${item.minQty} - ${item.maxQty}` : '';
                  }}
                />
                <Bar dataKey="allowance" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={50} name="Allowance">
                  {(isEditingSDL ? tempSDLWastage : (config.sdlWastage || [])).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center">Thread allowance percentage based on order quantity</p>
        </div>
      </div>

      {/* Thread Ratios Table */}
      <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
            {isEditingRatios ? 'Edit Thread Ratios' : 'Thread Ratios Matrix'}
          </h3>
          <div className="flex gap-2">
            {isEditingRatios ? (
              <>
                <button onClick={handleAddRatio} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all shadow-sm" title="Add Ratio">
                  <Plus size={14} />
                </button>
                <button onClick={handleCancelRatios} className="p-2 bg-accent text-muted-foreground rounded-xl hover:bg-accent/80 transition-all shadow-sm" title="Cancel">
                  <X size={14} />
                </button>
                <button onClick={handleSaveRatios} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm" title="Save">
                  <Check size={14} />
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditingRatios(true)} className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-sm" title="Edit Ratios">
                <Edit2 size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-card text-foreground text-[9px] font-black uppercase tracking-widest h-12 border-b border-border">
                <th className="px-4 w-40">Buyer</th>
                <th className="px-4 w-40">Stitch Type</th>
                <th className="px-4 w-32">Pos 1</th>
                <th className="px-4 w-24">Factor 1</th>
                <th className="px-4 w-32">Pos 2</th>
                <th className="px-4 w-24">Factor 2</th>
                {isEditingRatios && <th className="px-4 w-16 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-muted-foreground divide-y divide-border">
              {(isEditingRatios ? tempRatios : (config.threadRatios || [])).filter(r => r && (selectedBuyer === 'ALL' || r.buyer === selectedBuyer)).map((ratio, idx) => (
                <tr key={ratio.id} className="h-14 hover:bg-accent transition-colors">
                  <td className="px-4">
                    {isEditingRatios ? (
                      <select 
                        className="bg-card border border-border rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-violet-500 outline-none text-foreground text-[11px]"
                        value={ratio.buyer}
                        onChange={e => {
                          const newRatios = [...tempRatios];
                          const actualIdx = tempRatios.findIndex(r => r.id === ratio.id);
                          if (actualIdx !== -1) {
                            newRatios[actualIdx].buyer = e.target.value;
                            setTempRatios(newRatios);
                          }
                        }}
                      >
                        <option value="">Select Buyer</option>
                        {config.buyers?.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted-foreground">{ratio.buyer || 'General'}</span>
                    )}
                  </td>
                  <td className="px-4">
                    {isEditingRatios ? (
                      <input 
                        type="text"
                        className="bg-card border border-border rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-violet-500 outline-none text-foreground text-[11px]"
                        value={ratio.stitchType}
                        onChange={e => {
                          const newRatios = [...tempRatios];
                          const actualIdx = tempRatios.findIndex(r => r.id === ratio.id);
                          if (actualIdx !== -1) {
                            newRatios[actualIdx].stitchType = e.target.value;
                            setTempRatios(newRatios);
                          }
                        }}
                      />
                    ) : (
                      <span className="font-black text-foreground uppercase">{ratio.stitchType}</span>
                    )}
                  </td>
                  <td className="px-4">
                    {isEditingRatios ? (
                      <input 
                        type="text"
                        className="bg-card border border-border rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-violet-500 outline-none text-foreground text-[11px]"
                        value={ratio.pos1Name}
                        onChange={e => {
                          const newRatios = [...tempRatios];
                          const actualIdx = tempRatios.findIndex(r => r.id === ratio.id);
                          if (actualIdx !== -1) {
                            newRatios[actualIdx].pos1Name = e.target.value;
                            setTempRatios(newRatios);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-muted-foreground">{ratio.pos1Name}</span>
                    )}
                  </td>
                  <td className="px-4">
                    {isEditingRatios ? (
                      <input 
                        type="number"
                        step="0.01"
                        className="bg-card border border-border rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-[11px]"
                        value={ratio.pos1Ratio}
                        onChange={e => {
                          const newRatios = [...tempRatios];
                          const actualIdx = tempRatios.findIndex(r => r.id === ratio.id);
                          if (actualIdx !== -1) {
                            newRatios[actualIdx].pos1Ratio = parseFloat(e.target.value) || 0;
                            setTempRatios(newRatios);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-primary">{(ratio.pos1Ratio || 0).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-4">
                    {isEditingRatios ? (
                      <input 
                        type="text"
                        className="bg-card border border-border rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-violet-500 outline-none text-foreground text-[11px]"
                        value={ratio.pos2Name}
                        onChange={e => {
                          const newRatios = [...tempRatios];
                          const actualIdx = tempRatios.findIndex(r => r.id === ratio.id);
                          if (actualIdx !== -1) {
                            newRatios[actualIdx].pos2Name = e.target.value;
                            setTempRatios(newRatios);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-muted-foreground">{ratio.pos2Name || '-'}</span>
                    )}
                  </td>
                  <td className="px-4">
                    {isEditingRatios ? (
                      <input 
                        type="number"
                        step="0.01"
                        className="bg-card border border-border rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-[11px]"
                        value={ratio.pos2Ratio}
                        onChange={e => {
                          const newRatios = [...tempRatios];
                          const actualIdx = tempRatios.findIndex(r => r.id === ratio.id);
                          if (actualIdx !== -1) {
                            newRatios[actualIdx].pos2Ratio = parseFloat(e.target.value) || 0;
                            setTempRatios(newRatios);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-primary">{(ratio.pos2Ratio || 0).toFixed(2)}</span>
                    )}
                  </td>
                  {isEditingRatios && (
                    <td className="px-4 text-center">
                      <button onClick={() => handleRemoveRatio(ratio.id)} className="text-rose-500 hover:text-rose-700 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SDL Wastage Reference Table */}
      <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
            {isEditingSDL ? 'Edit SDL Wastage Matrix' : 'SDL Wastage Matrix'}
          </h3>
          <div className="flex gap-2">
            {isEditingSDL ? (
              <>
                <button onClick={handleAddSDLWastage} className="p-2 bg-sky-100 text-sky-600 rounded-xl hover:bg-sky-200 transition-all shadow-sm" title="Add SDL">
                  <Plus size={14} />
                </button>
                <button onClick={handleCancelSDL} className="p-2 bg-accent text-muted-foreground rounded-xl hover:bg-accent/80 transition-all shadow-sm" title="Cancel">
                  <X size={14} />
                </button>
                <button onClick={handleSaveSDL} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm" title="Save">
                  <Check size={14} />
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditingSDL(true)} className="p-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all shadow-sm" title="Edit SDL">
                <Edit2 size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-card text-foreground text-[9px] font-black uppercase tracking-widest h-12 border-b border-border">
                <th className="px-4 w-1/3">Min Qty</th>
                <th className="px-4 w-1/3">Max Qty</th>
                <th className="px-4 w-1/4">Allowance (%)</th>
                {isEditingSDL && <th className="px-4 w-16 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-muted-foreground divide-y divide-border">
              {(isEditingSDL ? tempSDLWastage : (config.sdlWastage || [])).map((item, idx) => (
                <tr key={item.id} className="h-14 hover:bg-accent transition-colors">
                  <td className="px-4">
                    {isEditingSDL ? (
                      <input 
                        type="number"
                        className="bg-card border border-border rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-sky-500 outline-none text-foreground text-[11px]"
                        value={item.minQty}
                        onChange={e => {
                          const newSDL = [...tempSDLWastage];
                          newSDL[idx].minQty = parseInt(e.target.value) || 0;
                          setTempSDLWastage(newSDL);
                        }}
                      />
                    ) : (
                      (item.minQty || 0).toLocaleString()
                    )}
                  </td>
                  <td className="px-4">
                    {isEditingSDL ? (
                      <input 
                        type="number"
                        className="bg-card border border-border rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-sky-500 outline-none text-foreground text-[11px]"
                        value={item.maxQty}
                        onChange={e => {
                          const newSDL = [...tempSDLWastage];
                          newSDL[idx].maxQty = parseInt(e.target.value) || 0;
                          setTempSDLWastage(newSDL);
                        }}
                      />
                    ) : (
                      (item.maxQty || 0).toLocaleString()
                    )}
                  </td>
                  <td className="px-4">
                    {isEditingSDL ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          className="bg-card border border-border rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-sky-500 outline-none text-foreground text-[11px]"
                          value={item.allowance}
                          onChange={e => {
                            const newSDL = [...tempSDLWastage];
                            newSDL[idx].allowance = parseFloat(e.target.value) || 0;
                            setTempSDLWastage(newSDL);
                          }}
                        />
                      </div>
                    ) : (
                      <span className="text-sky-600 font-black">{item.allowance}%</span>
                    )}
                  </td>
                  {isEditingSDL && (
                    <td className="px-4 text-center">
                      <button 
                        onClick={() => handleRemoveSDLWastage(item.id)}
                        className="text-rose-500 hover:text-rose-700 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SewingThreadAnalysis;
