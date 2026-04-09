import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, MapPin, Clock, User, ArrowDownCircle, Search, ArrowRight, X } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { AppUser, ProductionTransfer, WIPRecord } from '../types';
import { toast } from 'sonner';

interface WashingInputProps {
  currentUser: AppUser;
}

interface ReceivedSummary {
  buyer: string;
  style: string;
  soNumber: string;
  color: string;
  totalQuantity: number;
  details: ProductionTransfer[];
}

const WashingInput: React.FC<WashingInputProps> = ({ currentUser }) => {
  const [pendingTransfers, setPendingTransfers] = useState<ProductionTransfer[]>([]);
  const [receivedList, setReceivedList] = useState<ProductionTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSummary, setSelectedSummary] = useState<ReceivedSummary | null>(null);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = () => {
    setLoading(true);
    try {
      const allTransfers = mockDb.getTransfers();
      setPendingTransfers(allTransfers.filter(t => t.status === 'PENDING'));
      setReceivedList(allTransfers.filter(t => t.status === 'RECEIVED'));
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = (transfer: ProductionTransfer) => {
    const updatedTransfer: ProductionTransfer = {
      ...transfer,
      status: 'RECEIVED',
      receivedBy: currentUser.name,
      receivedById: currentUser.id,
      receivedTimestamp: new Date().toISOString()
    };

    mockDb.saveTransfer(updatedTransfer);

    // Also create a WIPRecord for Washing department
    const wipRecord: WIPRecord = {
      id: `WIP-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      department: 'Washing',
      section: 'Washing',
      blockId: 'Block-1', // Default or derived
      lineId: transfer.lines[0] || 'Line 01',
      soNumber: transfer.soNumber,
      buyer: transfer.buyer,
      styleNumber: transfer.style,
      color: transfer.color,
      inputQty: transfer.quantity,
      outputQty: 0,
      reporterRole: currentUser.role,
      reporterId: currentUser.id,
      timestamp: new Date().toISOString()
    };
    mockDb.saveWIP(wipRecord);

    toast.success(`Received ${transfer.quantity} pcs from ${transfer.transferBy}`);
    fetchTransfers();
  };

  const updateLocation = (transfer: ProductionTransfer, location: string) => {
    const updatedTransfer = { ...transfer, storageLocation: location };
    mockDb.saveTransfer(updatedTransfer);
    setReceivedList(prev => prev.map(t => t.id === transfer.id ? updatedTransfer : t));
  };

  const filteredPending = pendingTransfers.filter(t => 
    t.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.color.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group received transfers for summary
  const summaryMap: Record<string, ReceivedSummary> = {};
  receivedList.forEach(t => {
    const key = `${t.buyer}-${t.style}-${t.soNumber}-${t.color}`;
    if (!summaryMap[key]) {
      summaryMap[key] = {
        buyer: t.buyer,
        style: t.style,
        soNumber: t.soNumber,
        color: t.color,
        totalQuantity: 0,
        details: []
      };
    }
    summaryMap[key].totalQuantity += t.quantity;
    summaryMap[key].details.push(t);
  });

  const summaries = Object.values(summaryMap);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Washing Input</h1>
          <p className="text-slate-500 text-sm">Receive and manage production transfers from Sewing</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search transfers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>
      
      {/* Pending Transfers */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <ArrowDownCircle size={18} className="text-blue-500" />
            Pending Transfers from Sewing
          </h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
            {filteredPending.length} Pending
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-3">Transfer Info</th>
                <th className="px-6 py-3">Buyer / Style / SO</th>
                <th className="px-6 py-3">Quantity</th>
                <th className="px-6 py-3">Lines</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : filteredPending.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No pending transfers found</td></tr>
              ) : filteredPending.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-900 flex items-center gap-1">
                        <User size={12} className="text-slate-400" /> {t.transferBy}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> {new Date(t.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{t.buyer}</span>
                      <span className="text-xs text-slate-500">{t.style} • {t.color}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">SO: {t.soNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-black text-blue-600">{t.quantity}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {t.lines.map(l => (
                        <span key={l} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{l}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleReceive(t)} 
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                      Receive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Received Summary Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Received Production Summary</h2>
          <p className="text-slate-500 text-sm">Total received quantities by Buyer, Style, and Color</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4">Style / SO</th>
                  <th className="px-6 py-4">Color</th>
                  <th className="px-6 py-4">Total Received</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summaries.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No received production yet</td></tr>
                ) : summaries.map((s, idx) => (
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
                    <td className="px-6 py-4 font-bold text-emerald-600">{s.totalQuantity}</td>
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

      {/* Detail Modal/Overlay */}
      {selectedSummary && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Receive Details</h3>
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
                  <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Received By</th>
                    <th className="pb-4 text-right">Quantity</th>
                    <th className="pb-4 pl-6">Storage Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selectedSummary.details.map(d => (
                    <tr key={d.id} className="text-sm">
                      <td className="py-4 text-slate-600">{new Date(d.receivedTimestamp || '').toLocaleDateString()}</td>
                      <td className="py-4 text-slate-900 font-medium">{d.receivedBy}</td>
                      <td className="py-4 text-right font-bold text-slate-900">{d.quantity}</td>
                      <td className="py-4 pl-6">
                        <div className="relative max-w-[200px]">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Set location..."
                            defaultValue={d.storageLocation || ''}
                            onBlur={(e) => updateLocation(d, e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Total Received</span>
              <span className="text-2xl font-black text-emerald-600">{selectedSummary.totalQuantity}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WashingInput;
