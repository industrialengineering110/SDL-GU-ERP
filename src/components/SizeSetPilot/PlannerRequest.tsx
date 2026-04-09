import React, { useState, useEffect } from 'react';
import { SizeSetPilotRequest, SizeSetPilotStageName, SizeSetPilotStageData } from '../../types';
import { Plus, List, Search, CheckCircle2, Save, Trash2, Edit } from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { useGlobal } from '../../App';
import SearchableSelect from '../SearchableSelect';
import Logo from '../Logo';

interface Props {
  requests: SizeSetPilotRequest[];
  onAdd: (req: SizeSetPilotRequest) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SizeSetPilotRequest>) => void;
}

const STAGES: SizeSetPilotStageName[] = [
  'Planner Request', 'Cutting Concern', 'Sewing / Sample Line Concern', 'Quality Team', 'Wash Sample Concern', 'Full Dashboard and Style Report'
];

const PlannerRequest: React.FC<Props> = ({ requests, onAdd, onDelete, onUpdate }) => {
  const { currentUser } = useGlobal();
  const [formData, setFormData] = useState({
    buyer: '',
    styleNumber: '',
    productItem: '',
    plannerName: currentUser?.name || '',
    requestType: 'Size Set' as 'Size Set' | 'Pilot',
    requestedQuantity: 0,
  });

  const [availableBuyers, setAvailableBuyers] = useState<{id: string, name: string}[]>([]);
  const [availableStyles, setAvailableStyles] = useState<{id: string, name: string}[]>([]);
  const [availableProductItems, setAvailableProductItems] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const orders = mockDb.getOrderPoolEntries();
    const buyers = Array.from(new Set(orders.map(o => o.buyer))).map(b => ({ id: b, name: b }));
    setAvailableBuyers(buyers);

    const config = mockDb.getSystemConfig();
    const items = (config.productCategories || []).map(c => ({ id: c, name: c }));
    setAvailableProductItems(items);
  }, []);

  useEffect(() => {
    if (formData.buyer) {
      const orders = mockDb.getOrderPoolEntries();
      const styles = orders.filter(o => o.buyer === formData.buyer).map(o => o.style);
      setAvailableStyles(Array.from(new Set(styles)).map(s => ({ id: s, name: s })));
    } else {
      setAvailableStyles([]);
      setFormData(prev => ({ ...prev, styleNumber: '' }));
    }
  }, [formData.buyer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.styleNumber || formData.requestedQuantity <= 0) {
      alert('Style Number and Quantity are mandatory');
      return;
    }

    const initialStages = STAGES.reduce((acc, stage) => {
      acc[stage] = {
        responsiblePerson: stage === 'Planner Request' ? formData.plannerName : '',
        startTime: stage === 'Planner Request' ? new Date().toISOString() : '',
        endTime: '',
        quantityHandled: stage === 'Planner Request' ? formData.requestedQuantity : 0,
        riskPoints: [],
        issueNotes: '',
        remarks: '',
        status: stage === 'Planner Request' ? 'Completed' : 'Pending'
      };
      return acc;
    }, {} as Record<SizeSetPilotStageName, SizeSetPilotStageData>);

    const newRequest: SizeSetPilotRequest = {
      id: Date.now().toString(),
      ...formData,
      requestDate: new Date().toISOString(),
      stages: initialStages,
      currentStage: 'Cutting Concern',
      status: 'Active',
    };
    onAdd(newRequest);
    setFormData({ buyer: '', styleNumber: '', productItem: '', plannerName: currentUser?.name || '', requestType: 'Size Set', requestedQuantity: 0 });
  };

  return (
    <div className="space-y-8">
      <div className="bg-card p-8 rounded-3xl border border-border shadow-xl shadow-black/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Plus size={120} />
        </div>
        
        <div className="flex items-center gap-4 mb-8">
          <Logo size={40} showText={false} />
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">New Request</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Initiate Size Set or Pilot Process</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Buyer Name</label>
            <div className="bg-muted/30 rounded-2xl border border-border/50 p-1">
              <SearchableSelect 
                value={formData.buyer}
                options={availableBuyers}
                onChange={val => setFormData({...formData, buyer: val, styleNumber: ''})}
                placeholder="Search Buyer..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Style Number *</label>
            <div className="bg-muted/30 rounded-2xl border border-border/50 p-1">
              <SearchableSelect 
                value={formData.styleNumber}
                options={availableStyles}
                onChange={val => setFormData({...formData, styleNumber: val})}
                placeholder="Search Style..."
                disabled={!formData.buyer}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Product Item</label>
            <div className="bg-muted/30 rounded-2xl border border-border/50 p-1">
              <SearchableSelect 
                value={formData.productItem}
                options={availableProductItems}
                onChange={val => setFormData({...formData, productItem: val})}
                placeholder="Search Category..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Planner Name</label>
            <input 
              type="text" 
              value={formData.plannerName} 
              readOnly
              className="w-full p-4 bg-muted/20 border border-border/50 rounded-2xl outline-none transition-all text-sm font-bold text-muted-foreground" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Request Type</label>
            <div className="flex p-1.5 bg-muted/30 rounded-2xl border border-border/50 gap-1">
              {(['Size Set', 'Pilot'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, requestType: type})}
                  className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${formData.requestType === type ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:bg-white/50'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Requested Quantity *</label>
            <input 
              type="number" 
              placeholder="0" 
              value={formData.requestedQuantity || ''} 
              onChange={e => setFormData({...formData, requestedQuantity: parseInt(e.target.value) || 0})} 
              className="w-full p-4 bg-muted/30 border border-border/50 focus:border-primary/50 rounded-2xl outline-none transition-all text-sm font-bold" 
              required 
            />
          </div>

          <div className="lg:col-span-3 flex justify-end pt-6 border-t border-border mt-4">
            <button type="submit" className="bg-primary text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:translate-y-[-2px] active:translate-y-[0px] transition-all flex items-center gap-3">
              <Save size={20} />
              Save & Submit Request
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card p-8 rounded-3xl border border-border shadow-xl shadow-black/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
              <List size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Recent Activity</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Track your latest requests</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input type="text" placeholder="Search Style..." className="pl-10 pr-4 py-2 bg-muted/50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 w-64" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr>
                <th className="px-6 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</th>
                <th className="px-6 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Buyer & Style</th>
                <th className="px-6 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Type</th>
                <th className="px-6 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Status</th>
                <th className="px-6 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()).map(req => {
                const cuttingStage = req.stages['Cutting Concern'];
                const canEdit = cuttingStage?.status === 'Pending';
                return (
                  <tr key={req.id} className="group hover:scale-[1.01] transition-all">
                    <td className="px-6 py-4 bg-muted/30 first:rounded-l-2xl last:rounded-r-2xl border-y border-l border-border group-hover:bg-muted/50">
                      <span className="text-xs font-bold text-muted-foreground">{new Date(req.requestDate).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 bg-muted/30 border-y border-border group-hover:bg-muted/50">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight">{req.buyer}</span>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{req.styleNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-muted/30 border-y border-border group-hover:bg-muted/50">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${req.requestType === 'Size Set' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                        {req.requestType}
                      </span>
                    </td>
                    <td className="px-6 py-4 bg-muted/30 border-y border-border group-hover:bg-muted/50 text-center">
                      <span className="text-xs font-black">{req.requestedQuantity}</span>
                    </td>
                    <td className="px-6 py-4 bg-muted/30 border-y border-border group-hover:bg-muted/50 text-right">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${req.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 bg-muted/30 first:rounded-l-2xl last:rounded-r-2xl border-y border-r border-border group-hover:bg-muted/50 text-right">
                      {canEdit && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => {/* Implement edit logic */}} className="p-2 text-muted-foreground hover:text-primary transition-colors"><Edit size={16} /></button>
                          <button onClick={() => onDelete(req.id)} className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <Search size={48} />
                      <span className="text-xs font-black uppercase tracking-widest">No requests found</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlannerRequest;
