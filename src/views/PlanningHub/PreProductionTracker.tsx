import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PauseCircle, 
  XCircle, 
  MinusCircle,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  ClipboardList as ClipboardIcon
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { 
  OrderPoolEntry, 
  PreProductionTracker as IPreProductionTracker, 
  PreProductionStage,
  PreProdStatus,
  PreProdApplicability,
  IssueSource
} from '../../types';
import { useGlobal } from '../../App';

const STAGE_LABELS: Record<string, string> = {
  fileHandover: 'Merchandiser File Handover',
  ppSampleSubmitted: 'PP Sample Submitted',
  ppSampleApproved: 'PP Sample Approved',
  sizeSetSample: 'Size Set Sample',
  pilotSample: 'Pilot Sample',
  sampleQualityStatus: 'Sample Quality Status',
  fabricInhouse: 'Fabric Inhouse',
  accessoriesInhouse: 'Accessories Inhouse',
  shrinkageTest: 'Shrinkage Test',
  shadeApproval: 'Shade Approval',
  fabricQualityClearance: 'Fabric Quality Clearance',
  washingClearance: 'Washing Clearance',
  patternReady: 'Pattern Ready',
  markerReady: 'Marker Ready',
};

function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

const STATUS_COLORS: Record<PreProdStatus, string> = {
  'Pending': 'text-slate-400 bg-slate-50 border-slate-200',
  'In Progress': 'text-blue-600 bg-blue-50 border-blue-200',
  'Approved': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'Failed': 'text-red-600 bg-red-50 border-red-200',
  'Hold': 'text-amber-600 bg-amber-50 border-amber-200',
  'Not Required': 'text-slate-300 bg-slate-50 border-slate-100',
};

const STATUS_ICONS: Record<PreProdStatus, any> = {
  'Pending': Clock,
  'In Progress': ActivityIcon,
  'Approved': CheckCircle2,
  'Failed': XCircle,
  'Hold': PauseCircle,
  'Not Required': MinusCircle,
};

export const PreProductionTracker: React.FC<{ view?: string | null, selectedMonth: number }> = ({ view, selectedMonth }) => {
  const { currentUser } = useGlobal();
  const [orders, setOrders] = useState<OrderPoolEntry[]>([]);
  const [trackers, setTrackers] = useState<IPreProductionTracker[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const Switch = ({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label: string }) => (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(!checked)}>
      <div className={`w-8 h-4 rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}>
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${checked ? 'left-4.5' : 'left-0.5'}`} />
      </div>
      <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
    </div>
  );

  useEffect(() => {
    setOrders(mockDb.getOrderPoolEntries());
    setTrackers(mockDb.getPreProductionTrackers());
  }, []);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const selectedTracker = trackers.find(t => t.orderId === selectedOrderId);

  // Sync target dates from order if they are missing in tracker
  useEffect(() => {
    if (selectedOrder && selectedTracker) {
      let needsUpdate = false;
      const updatedChecklist = { ...selectedTracker.checklist };

      const syncDate = (key: string, orderDate: string | undefined) => {
        if (orderDate && updatedChecklist[key] && !updatedChecklist[key].targetDate) {
          updatedChecklist[key].targetDate = orderDate;
          needsUpdate = true;
        }
      };

      syncDate('fileHandover', selectedOrder.fileHandoverDate);
      syncDate('ppSampleApproved', selectedOrder.tentativePPSampleApprovalDate);
      syncDate('fabricInhouse', selectedOrder.fabricInhouseDate);
      syncDate('accessoriesInhouse', selectedOrder.accessoriesInhouseDate);

      if (needsUpdate) {
        const newTracker = {
          ...selectedTracker,
          checklist: updatedChecklist,
          lastUpdated: new Date().toISOString()
        };
        setTrackers(prev => prev.map(t => t.id === newTracker.id ? newTracker : t));
        (mockDb as any).savePreProductionTracker(newTracker);
      }
    }
  }, [selectedOrderId, selectedOrder, !!selectedTracker]);

  // Auto-initialize tracker if it doesn't exist for a selected order
  useEffect(() => {
    if (selectedOrderId && !selectedTracker && selectedOrder) {
      const newTracker: IPreProductionTracker = {
        id: `pp-${Date.now()}`,
        orderId: selectedOrderId,
        isReadyForPlan: false,
        lastUpdated: new Date().toISOString(),
        checklist: {
          fileHandover: { status: 'Pending', applicability: 'Required', targetDate: selectedOrder.fileHandoverDate, delayDays: 0 },
          ppSampleSubmitted: { status: 'Pending', applicability: 'Required', delayDays: 0 },
          ppSampleApproved: { status: 'Pending', applicability: 'Required', targetDate: selectedOrder.tentativePPSampleApprovalDate, delayDays: 0 },
          sizeSetSample: { status: 'Pending', applicability: 'Required', delayDays: 0 },
          pilotSample: { status: 'Pending', applicability: 'Required', delayDays: 0 },
          sampleQualityStatus: { status: 'Pending', applicability: 'Required', delayDays: 0 },
          fabricInhouse: { status: 'Pending', applicability: 'Required', targetDate: selectedOrder.fabricInhouseDate, delayDays: 0 },
          accessoriesInhouse: { status: 'Pending', applicability: 'Required', targetDate: selectedOrder.accessoriesInhouseDate, delayDays: 0 },
          shrinkageTest: { status: 'Pending', applicability: 'Required', delayDays: 0 },
          shadeApproval: { status: 'Pending', applicability: 'Required', delayDays: 0 },
          fabricQualityClearance: { status: 'Pending', applicability: 'Required', delayDays: 0 },
          washingClearance: { status: 'Pending', applicability: 'Required', delayDays: 0 },
          patternReady: { status: 'Pending', applicability: 'Required', delayDays: 0 },
          markerReady: { status: 'Pending', applicability: 'Required', delayDays: 0 },
        }
      };
      setTrackers(prev => [...prev, newTracker]);
      (mockDb as any).savePreProductionTracker(newTracker);
    }
  }, [selectedOrderId, selectedTracker, selectedOrder]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Access Control Logic
      const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER';
      const isPlanner = currentUser?.role === 'PLANNING_MANAGER' || currentUser?.role === 'LINE_LOADING_PLANNER';
      
      // If specific planning owner, only see their styles
      if (!isAdmin && !isPlanner && o.planningOwner !== currentUser?.name) {
        return false;
      }

      // Month filter
      if (o.shipDate) {
        const shipMonth = new Date(o.shipDate).getMonth();
        if (shipMonth !== selectedMonth) return false;
      }

      return o.soNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
             o.style.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [orders, searchTerm, currentUser, selectedMonth]);

  const canEdit = useMemo(() => {
    if (!selectedOrder) return false;
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER';
    const isOwner = selectedOrder.planningOwner === currentUser?.name;
    return isAdmin || isOwner;
  }, [selectedOrder, currentUser]);

  const getFilteredChecklist = (checklist: Record<string, PreProductionStage>) => {
    if (!view) return Object.entries(checklist);

    switch (view) {
      case 'sample':
        return Object.entries(checklist).filter(([key]) => 
          ['ppSampleSubmitted', 'ppSampleApproved', 'sizeSetSample', 'pilotSample', 'sampleQualityStatus'].includes(key)
        );
      case 'shrinkage':
        return Object.entries(checklist).filter(([key]) => key === 'shrinkageTest');
      case 'shade':
        return Object.entries(checklist).filter(([key]) => key === 'shadeApproval');
      case 'delay':
        return Object.entries(checklist).filter(([_, stage]) => (stage.delayDays || 0) > 0);
      default:
        return Object.entries(checklist);
    }
  };

  const calculateReadiness = (tracker: IPreProductionTracker) => {
    const { checklist } = tracker;
    
    const isApproved = (stage?: PreProductionStage) => 
      stage ? (stage.applicability === 'Not Applicable' || stage.status === 'Approved') : false;
    
    const isNotFailed = (stage?: PreProductionStage) => 
      stage ? (stage.status !== 'Failed') : true;

    const hasDate = (stage?: PreProductionStage) => !!stage?.actualDate;

    const conditions = [
      { name: 'File Handover', met: isApproved(checklist.fileHandover), hasDate: hasDate(checklist.fileHandover) },
      { name: 'Samples Approved', met: isApproved(checklist.ppSampleApproved), hasDate: hasDate(checklist.ppSampleApproved) },
      { name: 'Quality Status', met: isNotFailed(checklist.sampleQualityStatus), hasDate: true }, // Not date based
      { name: 'Shrinkage Resolved', met: isNotFailed(checklist.shrinkageTest), hasDate: true }, // Not date based
      { name: 'Shade Resolved', met: isNotFailed(checklist.shadeApproval), hasDate: true }, // Not date based
      { name: 'Fabric Inhouse', met: isApproved(checklist.fabricInhouse), hasDate: hasDate(checklist.fabricInhouse) },
      { name: 'Accessories Inhouse', met: isApproved(checklist.accessoriesInhouse), hasDate: hasDate(checklist.accessoriesInhouse) },
    ];

    const ready = conditions.every(c => c.met) && (orders.find(o => o.id === tracker.orderId) ? !!mockDb.getLatestCosting(orders.find(o => o.id === tracker.orderId)!.buyer, orders.find(o => o.id === tracker.orderId)!.style) : true);
    const blockers = conditions.filter(c => !c.met).map(c => c.name);
    if (orders.find(o => o.id === tracker.orderId) && !mockDb.getLatestCosting(orders.find(o => o.id === tracker.orderId)!.buyer, orders.find(o => o.id === tracker.orderId)!.style)) {
      blockers.push('Costing Data');
    }
    const missingDates = conditions.filter(c => !c.hasDate && c.name !== 'Quality Status' && c.name !== 'Shrinkage Resolved' && c.name !== 'Shade Resolved').map(c => c.name);

    return { ready, blockers, missingDates };
  };

  const updateStage = (orderId: string, stageKey: string, updates: Partial<PreProductionStage>) => {
    if (!canEdit) return;

    const updatedTrackers = trackers.map(t => {
      if (t.orderId === orderId) {
        const stage = t.checklist[stageKey];
        if (!stage) return t;
        const updatedStage = { ...stage, ...updates };
        
        // Calculate delay if actual date is set
        if (updatedStage.actualDate && updatedStage.targetDate) {
          const target = new Date(updatedStage.targetDate);
          const actual = new Date(updatedStage.actualDate);
          const diffTime = actual.getTime() - target.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          updatedStage.delayDays = diffDays > 0 ? diffDays : 0;
        }

        const newTracker = {
          ...t,
          checklist: { ...t.checklist, [stageKey]: updatedStage },
          lastUpdated: new Date().toISOString()
        };

        // After updating stage, check if overall order status needs update
        const readiness = calculateReadiness(newTracker);
        const updatedOrders = orders.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              isReadyForPlan: readiness.ready,
              blockerReason: readiness.ready ? '' : `Blocked: ${readiness.blockers.join(', ')}`,
              preProductionStatus: readiness.ready ? 'Approved' : 'In Progress'
            };
          }
          return o;
        });
        
        setOrders(updatedOrders);
        mockDb.saveOrderPoolEntries(updatedOrders);
        (mockDb as any).savePreProductionTracker(newTracker);
        
        return newTracker;
      }
      return t;
    });
    setTrackers(updatedTrackers as any);
  };

  const summary = useMemo(() => {
    const stats = {
      total: orders.length,
      ready: 0,
      blocked: 0,
      missingFabric: 0,
      missingAcc: 0,
      missingPP: 0,
      missingFile: 0
    };

    trackers.forEach(t => {
      const readiness = calculateReadiness(t);
      if (readiness.ready) stats.ready++;
      else stats.blocked++;

      if (!t.checklist.fabricInhouse?.actualDate) stats.missingFabric++;
      if (!t.checklist.accessoriesInhouse?.actualDate) stats.missingAcc++;
      if (!t.checklist.ppSampleApproved?.actualDate) stats.missingPP++;
      if (!t.checklist.fileHandover?.actualDate) stats.missingFile++;
    });

    return stats;
  }, [orders, trackers]);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-200px)]">
      {/* Dashboard Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
          <p className="text-2xl font-black text-slate-900">{summary.total}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Ready to Plan</p>
          <p className="text-2xl font-black text-emerald-700">{summary.ready}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Missing Fabric</p>
          <p className="text-2xl font-black text-rose-700">{summary.missingFabric}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Missing Acc.</p>
          <p className="text-2xl font-black text-rose-700">{summary.missingAcc}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Missing PP App.</p>
          <p className="text-2xl font-black text-rose-700">{summary.missingPP}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Missing File</p>
          <p className="text-2xl font-black text-rose-700">{summary.missingFile}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
      {/* Sidebar: Order List */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search Style or SO..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredOrders.map(order => {
                  const tracker = trackers.find(t => t.orderId === order.id);
                  const readiness = tracker ? calculateReadiness(tracker) : { ready: false, blockers: [], missingDates: [] };
                  const hasCriticalMissing = readiness.missingDates.length > 0;
                  
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all border ${
                        selectedOrderId === order.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                          : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                      } ${hasCriticalMissing && selectedOrderId !== order.id ? 'border-rose-100 bg-rose-50/30' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-black uppercase tracking-widest opacity-70">{order.buyer}</span>
                        <div className="flex gap-1">
                          {hasCriticalMissing && (
                            <span className="text-[8px] font-black uppercase bg-rose-500 text-white px-1.5 py-0.5 rounded animate-pulse">Missing Dates</span>
                          )}
                          {readiness.ready ? (
                            <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded">Ready</span>
                          ) : (
                            <span className="text-[10px] font-black uppercase bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded">Pending</span>
                          )}
                        </div>
                      </div>
                <p className="font-bold text-sm">{order.soNo} - {order.style}</p>
                <div className="flex items-center gap-3 mt-2 opacity-60 text-[10px] font-medium uppercase">
                  <span>Qty: {order.orderQty}</span>
                  <span>Ship: {order.shipDate}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Checklist */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {selectedOrder && selectedTracker ? (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">{selectedOrder.style}</h2>
                <p className="text-xs text-slate-500 font-medium">SO: {selectedOrder.soNo} | Buyer: {selectedOrder.buyer}</p>
              </div>
              <div className="flex items-center gap-4">
                {calculateReadiness(selectedTracker).ready ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <CheckCircle2 size={18} />
                    <span className="text-xs font-black uppercase">Ready For Plan</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                    <AlertTriangle size={18} />
                    <span className="text-xs font-black uppercase">Blocked</span>
                  </div>
                )}
              </div>
            </div>

            {!calculateReadiness(selectedTracker).ready && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center gap-3">
                <AlertCircle className="text-red-500" size={16} />
                <p className="text-[10px] font-black text-red-600 uppercase tracking-wider">
                  Blockers: {calculateReadiness(selectedTracker).blockers.join(', ')}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-4">
                {getFilteredChecklist(selectedTracker.checklist).map(([key, stage]) => {
                  const Icon = STATUS_ICONS[stage.status];
                  const isDelayed = (stage.delayDays || 0) > 0;

                  return (
                    <div key={key} className={`group bg-white border ${!stage?.actualDate && ['fabricInhouse', 'accessoriesInhouse', 'ppSampleApproved', 'fileHandover'].includes(key) ? 'border-rose-200 bg-rose-50/10' : 'border-slate-100'} rounded-2xl p-4 hover:border-slate-200 transition-all hover:shadow-sm ${!canEdit ? 'opacity-80 pointer-events-none' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl border ${STATUS_COLORS[stage.status]} relative`}>
                          <Icon size={20} />
                          {!stage?.actualDate && ['fabricInhouse', 'accessoriesInhouse', 'ppSampleApproved', 'fileHandover'].includes(key) && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-bounce" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-slate-900">{STAGE_LABELS[key] || key}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <select 
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border focus:outline-none ${STATUS_COLORS[stage.status]}`}
                                  value={stage.status}
                                  onChange={(e) => updateStage(selectedOrder.id, key, { status: e.target.value as PreProdStatus })}
                                  disabled={!canEdit || stage.applicability === 'Not Applicable'}
                                >
                                  {Object.keys(STATUS_COLORS).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                  ))}
                                </select>
                                <Switch 
                                  checked={stage.applicability !== 'Not Applicable'}
                                  onChange={(val) => updateStage(selectedOrder.id, key, { applicability: val ? 'Required' : 'Not Applicable' })}
                                  label={stage.applicability === 'Not Applicable' ? 'Off' : 'On'}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Target</p>
                                <input 
                                  type="date" 
                                  className="text-[10px] font-bold text-slate-600 border border-slate-100 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  value={stage.targetDate || ''}
                                  onChange={(e) => updateStage(selectedOrder.id, key, { targetDate: e.target.value })}
                                  disabled={!canEdit}
                                />
                              </div>
                              <div className="text-right">
                                <p className={`text-[10px] font-black uppercase mb-1 ${isDelayed ? 'text-red-500' : 'text-slate-400'}`}>Actual</p>
                                <input 
                                  type="date" 
                                  className={`text-[10px] font-bold border rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    isDelayed ? 'text-red-600 border-red-100 bg-red-50' : 'text-slate-600 border-slate-100'
                                  }`}
                                  value={stage.actualDate || ''}
                                  onChange={(e) => updateStage(selectedOrder.id, key, { actualDate: e.target.value })}
                                  disabled={!canEdit}
                                />
                              </div>
                              {isDelayed && (
                                <div className="bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 text-[10px] font-black uppercase">
                                  {stage.delayDays}D Delay
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <AlertCircle size={12} className="text-amber-500" />
                              <input 
                                type="text"
                                placeholder="Blocker Reason..."
                                className="text-[10px] font-bold text-slate-500 uppercase bg-transparent border-none focus:outline-none w-40"
                                value={stage.blockerReason || ''}
                                onChange={(e) => updateStage(selectedOrder.id, key, { blockerReason: e.target.value })}
                                disabled={!canEdit}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Filter size={12} className="text-blue-500" />
                              <select 
                                className="text-[10px] font-bold text-slate-500 uppercase bg-transparent border-none focus:outline-none"
                                value={stage.issueSource || ''}
                                onChange={(e) => updateStage(selectedOrder.id, key, { issueSource: e.target.value as IssueSource })}
                                disabled={!canEdit}
                              >
                                <option value="">No Issue</option>
                                <option value="Fabric">Fabric</option>
                                <option value="Sample">Sample</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Washing">Washing</option>
                                <option value="Quality">Quality</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <ClipboardIcon size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Select an Order</h3>
            <p className="text-sm max-w-xs mt-2">Choose an order from the list to view and manage its pre-production checklist.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);
};
