import React, { useState, useEffect } from 'react';
import { Package, ArrowRight, CheckCircle, Search, Filter, Edit2, Save, X, Clock } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { AppUser, ProductionTransfer, ProductionRecord } from '../types';
import { toast } from 'sonner';

interface SewingOutputTransferProps {
  currentUser: AppUser;
}

interface GroupedOutput {
  id: string;
  buyer: string;
  style: string;
  soNumber: string;
  color: string;
  quantity: number;
  originalQuantity: number;
  lines: string[];
}

interface SendSummary {
  buyer: string;
  style: string;
  soNumber: string;
  color: string;
  totalSent: number;
  pendingQty: number;
  receivedQty: number;
  details: ProductionTransfer[];
}

const SewingOutputTransfer: React.FC<SewingOutputTransferProps> = ({ currentUser }) => {
  const [outputs, setOutputs] = useState<GroupedOutput[]>([]);
  const [history, setHistory] = useState<ProductionTransfer[]>([]);
  const [summaries, setSummaries] = useState<SendSummary[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedSummary, setSelectedSummary] = useState<SendSummary | null>(null);

  useEffect(() => {
    fetchOutputs();
    fetchHistory();
  }, [currentUser]);

  const fetchOutputs = () => {
    setLoading(true);
    try {
      const allProduction = mockDb.getProduction('Sewing');
      const allTransfers = mockDb.getTransfers();
      
      // Filter production by user's assigned block
      const blockProduction = currentUser.assignedBlockId 
        ? allProduction.filter(p => p.blockId === currentUser.assignedBlockId)
        : allProduction;

      const grouped: Record<string, GroupedOutput> = {};
      
      blockProduction.forEach(p => {
        const key = `${p.buyer}-${p.styleCode}-${p.soNumber}-${p.color}`;

        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            buyer: p.buyer,
            style: p.styleCode,
            soNumber: p.soNumber || 'N/A',
            color: p.color,
            quantity: 0,
            originalQuantity: 0,
            lines: []
          };
        }
        grouped[key].originalQuantity += p.actual;
        if (!grouped[key].lines.includes(p.lineId)) {
          grouped[key].lines.push(p.lineId);
        }
      });

      // Calculate already transferred quantities for this block
      const transferredMap: Record<string, number> = {};
      allTransfers.forEach(t => {
        if (t.fromDepartment === 'Sewing') {
          const key = `${t.buyer}-${t.style}-${t.soNumber}-${t.color}`;
          transferredMap[key] = (transferredMap[key] || 0) + t.quantity;
        }
      });

      // Set remaining quantity and filter out completed ones
      const finalOutputs = Object.values(grouped).map(item => {
        const transferred = transferredMap[item.id] || 0;
        const remaining = item.originalQuantity - transferred;
        return {
          ...item,
          quantity: remaining > 0 ? remaining : 0,
          originalQuantity: item.originalQuantity // Keep total QC output for reference
        };
      }).filter(item => item.quantity > 0);

      setOutputs(finalOutputs);
    } catch (error) {
      console.error('Error fetching outputs:', error);
      toast.error('Failed to fetch production data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = () => {
    const allTransfers = mockDb.getTransfers();
    const sewingTransfers = allTransfers.filter(t => 
      t.fromDepartment === 'Sewing' && 
      t.toDepartment === 'Washing'
    );
    
    setHistory(sewingTransfers);

    // Group for summary
    const summaryMap: Record<string, SendSummary> = {};
    sewingTransfers.forEach(t => {
      const key = `${t.buyer}-${t.style}-${t.soNumber}-${t.color}`;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          buyer: t.buyer,
          style: t.style,
          soNumber: t.soNumber,
          color: t.color,
          totalSent: 0,
          pendingQty: 0,
          receivedQty: 0,
          details: []
        };
      }
      summaryMap[key].totalSent += t.quantity;
      if (t.status === 'PENDING') {
        summaryMap[key].pendingQty += t.quantity;
      } else {
        summaryMap[key].receivedQty += t.quantity;
      }
      summaryMap[key].details.push(t);
    });

    setSummaries(Object.values(summaryMap));
  };

  const handleTransfer = (item: GroupedOutput) => {
    // Re-verify remaining quantity before transfer
    const allTransfers = mockDb.getTransfers();
    const alreadyTransferred = allTransfers
      .filter(t => t.buyer === item.buyer && t.style === item.style && t.soNumber === item.soNumber && t.color === item.color)
      .reduce((sum, t) => sum + t.quantity, 0);
    
    const remaining = item.originalQuantity - alreadyTransferred;

    if (item.quantity <= 0) {
      toast.error('Transfer quantity must be greater than 0');
      return;
    }

    if (item.quantity > remaining) {
      toast.error(`Cannot transfer more than remaining quantity (${remaining} pcs)`);
      return;
    }

    const transfer: ProductionTransfer = {
      id: `TRF-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      fromDepartment: 'Sewing',
      toDepartment: 'Washing',
      buyer: item.buyer,
      style: item.style,
      soNumber: item.soNumber,
      color: item.color,
      quantity: item.quantity,
      lines: item.lines,
      transferBy: currentUser.name,
      transferById: currentUser.id,
      status: 'PENDING'
    };

    mockDb.saveTransfer(transfer);
    
    toast.success(`Transferred ${item.quantity} pcs to Washing`);
    fetchOutputs(); 
    fetchHistory();
  };

  const startEditing = (item: GroupedOutput) => {
    setEditingId(item.id);
    setEditValue(item.quantity);
  };

  const saveEdit = (id: string) => {
    const item = outputs.find(o => o.id === id);
    if (!item) return;

    // Validate edit value against remaining
    const allTransfers = mockDb.getTransfers();
    const alreadyTransferred = allTransfers
      .filter(t => t.buyer === item.buyer && t.style === item.style && t.soNumber === item.soNumber && t.color === item.color)
      .reduce((sum, t) => sum + t.quantity, 0);
    
    const remaining = item.originalQuantity - alreadyTransferred;

    if (editValue > remaining) {
      toast.error(`Quantity exceeds available output (${remaining} pcs)`);
      return;
    }

    setOutputs(prev => prev.map(o => o.id === id ? { ...o, quantity: editValue } : o));
    setEditingId(null);
  };

  const filteredSummaries = summaries.filter(s => 
    s.buyer.toLowerCase().includes(historySearch.toLowerCase()) ||
    s.style.toLowerCase().includes(historySearch.toLowerCase()) ||
    s.soNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
    s.color.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-10">
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sewing Output & Transfer</h1>
            <p className="text-slate-500 text-sm">
              Transfer completed sewing production to Washing department 
              {currentUser.assignedBlockId && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Block: {currentUser.assignedBlockId}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchOutputs}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              title="Refresh"
            >
              <CheckCircle size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Style / SO</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Color</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lines</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Output</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Available to Transfer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">Loading production data...</td>
                  </tr>
                ) : outputs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">No pending output found for transfer</td>
                  </tr>
                ) : outputs.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.buyer}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{item.style}</div>
                      <div className="text-xs text-slate-400">SO: {item.soNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.color}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.lines.map(l => (
                          <span key={l} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{l}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 italic">{item.originalQuantity}</td>
                    <td className="px-6 py-4">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                          />
                          <button onClick={() => saveEdit(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Save size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                          <span className="font-semibold">{item.quantity}</span>
                          <button onClick={() => startEditing(item)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-opacity">
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleTransfer(item)}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                      >
                        Transfer <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading...</div>
            ) : outputs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No pending output</div>
            ) : outputs.map(item => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900">{item.buyer}</h3>
                    <p className="text-sm text-slate-500">{item.style} • {item.color}</p>
                    <p className="text-[10px] text-slate-400">SO: {item.soNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block uppercase tracking-wider">Total Output</span>
                    <span className="font-medium text-slate-600">{item.originalQuantity}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                  <div>
                    <span className="text-xs text-slate-400 block uppercase tracking-wider">Available to Transfer</span>
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="number" 
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-blue-300 rounded text-sm"
                        />
                        <button onClick={() => saveEdit(item.id)} className="p-1 text-green-600"><Save size={18} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-blue-600">{item.quantity}</span>
                        <button onClick={() => startEditing(item)} className="p-1 text-slate-400"><Edit2 size={14} /></button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleTransfer(item)}
                    className="bg-blue-600 text-white p-3 rounded-full shadow-lg active:scale-90 transition-transform"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {item.lines.map(l => (
                    <span key={l} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">{l}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wash Send Summary */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Wash Send Summary</h2>
            <p className="text-slate-500 text-sm">Summary of goods sent to Washing department by Style</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search summary..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Style / SO</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Color</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sent</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Received</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">No send history found</td>
                  </tr>
                ) : filteredSummaries.map((s, idx) => (
                  <tr 
                    key={idx} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedSummary(s)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{s.buyer}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{s.style}</div>
                      <div className="text-xs text-slate-400">SO: {s.soNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{s.color}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{s.totalSent}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${s.pendingQty > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                        {s.pendingQty}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{s.receivedQty}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                        <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSummary && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Send Details</h3>
                <p className="text-sm text-slate-500">{selectedSummary.buyer} • {selectedSummary.style} • {selectedSummary.color}</p>
              </div>
              <button 
                onClick={() => setSelectedSummary(null)}
                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-4">Date / Time</th>
                    <th className="pb-4">Sent By</th>
                    <th className="pb-4 text-right">Quantity</th>
                    <th className="pb-4 text-center">Status</th>
                    <th className="pb-4 pl-6">Lines</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selectedSummary.details.map(d => (
                    <tr key={d.id} className={`text-sm ${d.status === 'PENDING' ? 'bg-red-50/50' : ''}`}>
                      <td className="py-4">
                        <div className="text-slate-900 font-medium">{d.date}</div>
                        <div className="text-[10px] text-slate-400">{new Date(d.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-4 text-slate-900 font-medium">{d.transferBy}</td>
                      <td className="py-4 text-right font-bold text-slate-900">{d.quantity}</td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          d.status === 'PENDING' ? 'bg-red-200 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-4 pl-6">
                        <div className="flex flex-wrap gap-1">
                          {d.lines.map(l => (
                            <span key={l} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">{l}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Sent</span>
                  <span className="text-xl font-black text-slate-900">{selectedSummary.totalSent}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-red-400 uppercase">Pending</span>
                  <span className="text-xl font-black text-red-600">{selectedSummary.pendingQty}</span>
                </div>
              </div>
              {selectedSummary.pendingQty > 0 && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100 animate-pulse">
                  <Clock size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Awaiting Wash Receipt</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SewingOutputTransfer;
