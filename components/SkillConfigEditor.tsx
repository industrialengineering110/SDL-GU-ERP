import React, { useState } from 'react';
import { AppraisalConfig } from '../types';
import { Plus, Trash2, Edit, Settings, X } from 'lucide-react';

interface Props {
  config: AppraisalConfig[];
  onUpdate: (config: AppraisalConfig[]) => void;
}

export const SkillConfigEditor: React.FC<Props> = ({ config, onUpdate }) => {
  const [newConfig, setNewConfig] = useState<Partial<AppraisalConfig>>({
    section: '',
    designation: '',
    efficiencyRules: [],
    absenteeismRules: [],
    machineCountRules: [],
    processCountRules: [],
    totalWeight: { skill: 0, efficiency: 0, absenteeism: 0, machines: 0 }
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newConfig.section || !newConfig.designation) return;
    const item: AppraisalConfig = {
      id: Date.now().toString(),
      section: newConfig.section!,
      designation: newConfig.designation!,
      efficiencyRules: newConfig.efficiencyRules || [],
      absenteeismRules: newConfig.absenteeismRules || [],
      machineCountRules: newConfig.machineCountRules || [],
      processCountRules: newConfig.processCountRules || [],
      totalWeight: newConfig.totalWeight || { skill: 0, efficiency: 0, absenteeism: 0, machines: 0 }
    };
    onUpdate([...config, item]);
    setNewConfig({
      section: '',
      designation: '',
      efficiencyRules: [],
      absenteeismRules: [],
      machineCountRules: [],
      processCountRules: [],
      totalWeight: { skill: 0, efficiency: 0, absenteeism: 0, machines: 0 }
    });
  };

  const editingItem = config.find(c => c.id === editingId);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
          <Settings size={18} className="text-blue-600" /> Add New Appraisal Rule
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <input className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold" placeholder="Section" value={newConfig.section} onChange={e => setNewConfig({...newConfig, section: e.target.value})} />
          <input className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold" placeholder="Designation" value={newConfig.designation} onChange={e => setNewConfig({...newConfig, designation: e.target.value})} />
        </div>
        <button onClick={handleAdd} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all flex items-center gap-2">
          <Plus size={14}/> Add Rule
        </button>
      </div>

      {editingId && editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black uppercase">Edit Rules: {editingItem.section} - {editingItem.designation}</h3>
              <button onClick={() => setEditingId(null)}><X size={24}/></button>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Efficiency Rules (Min Eff, Max Eff, Score)</h4>
              {editingItem.efficiencyRules.map((rule, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" value={rule.minEff} onChange={e => {
                    const newRules = [...editingItem.efficiencyRules];
                    newRules[idx].minEff = Number(e.target.value);
                    onUpdate(config.map(c => c.id === editingId ? {...c, efficiencyRules: newRules} : c));
                  }} />
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" value={rule.maxEff} onChange={e => {
                    const newRules = [...editingItem.efficiencyRules];
                    newRules[idx].maxEff = Number(e.target.value);
                    onUpdate(config.map(c => c.id === editingId ? {...c, efficiencyRules: newRules} : c));
                  }} />
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" value={rule.score} onChange={e => {
                    const newRules = [...editingItem.efficiencyRules];
                    newRules[idx].score = Number(e.target.value);
                    onUpdate(config.map(c => c.id === editingId ? {...c, efficiencyRules: newRules} : c));
                  }} />
                </div>
              ))}
              <button onClick={() => onUpdate(config.map(c => c.id === editingId ? {...c, efficiencyRules: [...c.efficiencyRules, {minEff: 0, maxEff: 0, score: 0}]} : c))} className="text-xs font-bold text-blue-600">+ Add Rule</button>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Absenteeism Rules (Max Absent %, Score)</h4>
              {editingItem.absenteeismRules.map((rule, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" value={rule.maxAbsentPercent} onChange={e => {
                    const newRules = [...editingItem.absenteeismRules];
                    newRules[idx].maxAbsentPercent = Number(e.target.value);
                    onUpdate(config.map(c => c.id === editingId ? {...c, absenteeismRules: newRules} : c));
                  }} />
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" value={rule.score} onChange={e => {
                    const newRules = [...editingItem.absenteeismRules];
                    newRules[idx].score = Number(e.target.value);
                    onUpdate(config.map(c => c.id === editingId ? {...c, absenteeismRules: newRules} : c));
                  }} />
                </div>
              ))}
              <button onClick={() => onUpdate(config.map(c => c.id === editingId ? {...c, absenteeismRules: [...c.absenteeismRules, {maxAbsentPercent: 0, score: 0}]} : c))} className="text-xs font-bold text-blue-600">+ Add Rule</button>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Machine Count Rules (Min Machines, Score)</h4>
              {editingItem.machineCountRules.map((rule, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" value={rule.minMachines} onChange={e => {
                    const newRules = [...editingItem.machineCountRules];
                    newRules[idx].minMachines = Number(e.target.value);
                    onUpdate(config.map(c => c.id === editingId ? {...c, machineCountRules: newRules} : c));
                  }} />
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" value={rule.score} onChange={e => {
                    const newRules = [...editingItem.machineCountRules];
                    newRules[idx].score = Number(e.target.value);
                    onUpdate(config.map(c => c.id === editingId ? {...c, machineCountRules: newRules} : c));
                  }} />
                </div>
              ))}
              <button onClick={() => onUpdate(config.map(c => c.id === editingId ? {...c, machineCountRules: [...c.machineCountRules, {minMachines: 0, score: 0}]} : c))} className="text-xs font-bold text-blue-600">+ Add Rule</button>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Process Count Rules (Min Processes, Score)</h4>
              {editingItem.processCountRules.map((rule, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" value={rule.minProcesses} onChange={e => {
                    const newRules = [...editingItem.processCountRules];
                    newRules[idx].minProcesses = Number(e.target.value);
                    onUpdate(config.map(c => c.id === editingId ? {...c, processCountRules: newRules} : c));
                  }} />
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" value={rule.score} onChange={e => {
                    const newRules = [...editingItem.processCountRules];
                    newRules[idx].score = Number(e.target.value);
                    onUpdate(config.map(c => c.id === editingId ? {...c, processCountRules: newRules} : c));
                  }} />
                </div>
              ))}
              <button onClick={() => onUpdate(config.map(c => c.id === editingId ? {...c, processCountRules: [...c.processCountRules, {minProcesses: 0, score: 0}]} : c))} className="text-xs font-bold text-blue-600">+ Add Rule</button>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Total Weights</h4>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(editingItem.totalWeight).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold uppercase text-slate-500">{key}</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" value={value} onChange={e => {
                      const newWeight = {...editingItem.totalWeight, [key]: Number(e.target.value)};
                      onUpdate(config.map(c => c.id === editingId ? {...c, totalWeight: newWeight} : c));
                    }} />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setEditingId(null)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase">Save Changes</button>
          </div>
        </div>
      )}

      <div className="border border-slate-200 overflow-hidden rounded-[2rem] shadow-lg bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-12">
              <th className="px-6">Section</th>
              <th className="px-6">Designation</th>
              <th className="px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold text-slate-700 divide-y">
            {config.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">{item.section}</td>
                <td className="px-6 py-4">{item.designation}</td>
                <td className="px-6 py-4 text-center flex justify-center gap-2">
                  <button onClick={() => setEditingId(item.id)} className="text-slate-300 hover:text-indigo-500 transition-colors">
                    <Edit size={16}/>
                  </button>
                  <button onClick={() => onUpdate(config.filter(c => c.id !== item.id))} className="text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={16}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
