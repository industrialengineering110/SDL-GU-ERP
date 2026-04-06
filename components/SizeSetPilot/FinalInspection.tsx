import React, { useState } from 'react';
import { SizeSetPilotRequest } from '../../types';
import { CheckSquare, Play, CheckCircle2, Search, AlertTriangle, Plus, X } from 'lucide-react';

interface Props {
  requests: SizeSetPilotRequest[];
  onUpdate: (id: string, updates: Partial<SizeSetPilotRequest>) => void;
}

const FinalInspection: React.FC<Props> = ({ requests, onUpdate }) => {
  const finalRequests = requests.filter(r => r.currentStage === 'Final Inspection');
  const [newRiskPoint, setNewRiskPoint] = useState('');

  const handleStart = (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const updatedStages = { ...req.stages };
    updatedStages['Final Inspection'] = {
      ...updatedStages['Final Inspection'],
      startTime: new Date().toISOString(),
      status: 'In Progress'
    };
    onUpdate(id, { stages: updatedStages });
  };

  const handleEnd = (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const updatedStages = { ...req.stages };
    updatedStages['Final Inspection'] = {
      ...updatedStages['Final Inspection'],
      endTime: new Date().toISOString(),
      status: 'Completed'
    };
    onUpdate(id, { 
      stages: updatedStages,
      status: 'Completed' // Final stage
    });
  };

  const addRiskPoint = (reqId: string, point: string) => {
    if (!point.trim()) return;
    const req = requests.find(r => r.id === reqId);
    if (!req) return;
    const updatedStages = { ...req.stages };
    updatedStages['Final Inspection'].riskPoints = [...(updatedStages['Final Inspection'].riskPoints || []), point];
    onUpdate(reqId, { stages: updatedStages });
    setNewRiskPoint('');
  };

  const removeRiskPoint = (reqId: string, index: number) => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;
    const updatedStages = { ...req.stages };
    updatedStages['Final Inspection'].riskPoints = updatedStages['Final Inspection'].riskPoints.filter((_, i) => i !== index);
    onUpdate(reqId, { stages: updatedStages });
  };

  return (
    <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-2xl shadow-black/5">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-4 bg-purple-400 text-white rounded-2xl shadow-lg shadow-purple-400/20">
            <CheckSquare size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Final Inspection</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Final QC & Packing</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {finalRequests.map(req => (
          <div key={req.id} className="bg-muted/30 p-6 rounded-3xl border border-border group hover:border-primary/30 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground">Style Info</p>
                <p className="text-sm font-black">{req.styleNumber}</p>
                <p className="text-[10px] font-bold text-muted-foreground">{req.buyer}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground">Type</p>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${req.requestType === 'Size Set' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                  {req.requestType}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground">Wash Qty</p>
                <p className="text-sm font-black">{req.stages['Wash Sample Concern'].quantityHandled}</p>
              </div>
              <div className="flex items-center justify-end">
                {req.stages['Final Inspection']?.status === 'Pending' && (
                  <button onClick={() => handleStart(req.id)} className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-lg shadow-purple-600/20">
                    <Play size={14} /> Start Inspection
                  </button>
                )}
                {req.stages['Final Inspection']?.status === 'In Progress' && (
                  <button onClick={() => handleEnd(req.id)} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-lg shadow-emerald-600/20">
                    <CheckCircle2 size={14} /> Complete Inspection
                  </button>
                )}
                {req.stages['Final Inspection']?.status === 'Completed' && (
                  <span className="px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    Inspection Completed
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Final Qty</label>
                <input 
                  type="number" 
                  value={req.stages['Final Inspection']?.quantityHandled || ''} 
                  onChange={e => {
                    const updatedStages = { ...req.stages };
                    updatedStages['Final Inspection'] = {
                        ...updatedStages['Final Inspection'],
                        quantityHandled: parseInt(e.target.value) || 0
                    };
                    onUpdate(req.id, { stages: updatedStages });
                  }}
                  className="w-full p-4 bg-white border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Remarks</label>
                <input 
                  type="text" 
                  placeholder="Remarks..."
                  value={req.stages['Final Inspection']?.remarks || ''} 
                  onChange={e => {
                    const updatedStages = { ...req.stages };
                    updatedStages['Final Inspection'] = {
                        ...updatedStages['Final Inspection'],
                        remarks: e.target.value
                    };
                    onUpdate(req.id, { stages: updatedStages });
                  }}
                  className="w-full p-4 bg-white border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                <AlertTriangle size={14} className="text-rose-500" /> Risk Points
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add risk point..."
                  value={newRiskPoint}
                  onChange={e => setNewRiskPoint(e.target.value)}
                  className="flex-1 p-4 bg-white border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <button onClick={() => addRiskPoint(req.id, newRiskPoint)} className="p-4 bg-primary text-white rounded-2xl hover:bg-primary/90">
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {req.stages['Final Inspection']?.riskPoints?.map((point, index) => (
                  <span key={index} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {point}
                    <button onClick={() => removeRiskPoint(req.id, index)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {finalRequests.length === 0 && (
          <div className="p-12 text-center bg-card rounded-3xl border border-border">
            <div className="flex flex-col items-center gap-2 opacity-20">
              <Search size={48} />
              <span className="text-xs font-black uppercase tracking-widest">No pending final inspections</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalInspection;
