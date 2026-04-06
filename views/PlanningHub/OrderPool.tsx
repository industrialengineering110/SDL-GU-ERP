import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCcw, 
  CheckCircle,
  FileSpreadsheet as ExcelIcon,
  Trash2,
  Filter,
  Save,
  X,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { OrderPoolEntry, PlanningOwnership } from '../../types';
import { mockDb } from '../../services/mockDb';
import { useGlobal } from '../../App';

export const OrderPool: React.FC<{ view?: string | null, selectedMonth: number }> = ({ view, selectedMonth }) => {
  const { currentUser } = useGlobal();
  const [orders, setOrders] = useState<OrderPoolEntry[]>([]);
  const [ownerships, setOwnerships] = useState<PlanningOwnership[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [excelImport, setExcelImport] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<OrderPoolEntry>>({});
  const [pastedHeaders, setPastedHeaders] = useState<string[]>([]);
  
  // Duplicate Handling State
  const [duplicates, setDuplicates] = useState<{ new: OrderPoolEntry, existing: OrderPoolEntry }[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<OrderPoolEntry[]>([]);

  const [searchFilters, setSearchFilters] = useState<Record<string, string>>({});
  const [availablePlanners, setAvailablePlanners] = useState<string[]>([]);
  const [buyers, setBuyers] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkOwner, setBulkOwner] = useState('');

  const handleBulkOwnerUpdate = () => {
    if (!bulkOwner || selectedOrders.length === 0) return;
    const updated = orders.map(o => selectedOrders.includes(o.id) ? { ...o, planningOwner: bulkOwner } : o);
    setOrders(updated);
    mockDb.saveOrderPoolEntries(updated);
    setSelectedOrders([]);
    setBulkOwner('');
    setMessage(`Updated planning owner for ${selectedOrders.length} orders.`);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const autoHeaders = [
    { label: 'Planning Owner', key: 'planningOwner' },
    { label: 'Pre-Production Status', key: 'preProductionStatus' },
    { label: 'Ready For Plan', key: 'isReadyForPlan' },
    { label: 'Block Reason', key: 'blockerReason' },
    { label: 'Shipment Left', key: 'shipmentLeft' },
    { label: 'Image', key: 'image' },
    { label: 'Product Types', key: 'type' },
    { label: 'SMV', key: 'smv' },
    { label: 'Marketing Average', key: 'marketingAverage' }
  ];

  useEffect(() => {
    setOrders(mockDb.getOrderPoolEntries());
    setOwnerships(mockDb.getPlanningOwnerships());
    setBuyers(mockDb.getBuyers());
    
    // Get all users with Planning roles for the dropdown
    const users = mockDb.getUsers();
    const planners = users
      .filter((u: any) => u.role === 'PLANNING_MANAGER' || u.role === 'LINE_LOADING_PLANNER' || u.role === 'ADMIN')
      .map((u: any) => u.name);
    setAvailablePlanners(Array.from(new Set(planners)));
  }, []);

  const evaluateReadiness = (order: OrderPoolEntry): OrderPoolEntry => {
    let updated = { ...order };

    // Default Marketing Average calculation if not provided but SMV exists
    if (!updated.marketingAverage && (updated.smv || 0) > 0) {
      // Default: (40 manpower * 10 hours * 60 mins * 0.65 efficiency) / SMV
      updated.marketingAverage = Math.floor((40 * 10 * 60 * 0.65) / updated.smv);
    }

    // Auto-populate Planning Owner based on Buyer if not provided
    if (!updated.planningOwner || updated.planningOwner === 'Unassigned') {
      const ownership = ownerships.find(o => o.buyer.toLowerCase() === (updated.buyer || '').toLowerCase());
      if (ownership) updated.planningOwner = ownership.planningOwner;
      else updated.planningOwner = 'Unassigned';
    }

    const hasCosting = (updated.smv || 0) > 0 && (updated.marketingAverage || 0) > 0;
    const isApproved = updated.preProductionStatus === 'Approved';
    
    // If it was blocked by missing costing, and now has costing, clear that specific blocker
    let currentBlocker = updated.blockerReason || '';
    if (hasCosting && currentBlocker === 'Missing Costing Data') {
      currentBlocker = '';
    }
    
    // If it was blocked by PP, and now approved, clear that specific blocker
    if (isApproved && currentBlocker === 'Pre-Production Pending') {
      currentBlocker = '';
    }

    // Auto-set blockers if not ready
    if (!hasCosting && !currentBlocker) {
      currentBlocker = 'Missing Costing Data';
    } else if (!isApproved && !currentBlocker) {
      currentBlocker = 'Pre-Production Pending';
    }

    const isReady = hasCosting && isApproved && !currentBlocker;

    return {
      ...updated,
      isReadyForPlan: isReady,
      blockerReason: currentBlocker
    };
  };

  const syncWithCosting = (order: OrderPoolEntry) => {
    const latestCosting = mockDb.getLatestCosting(order.buyer, order.style);
    let updated = { ...order };
    if (latestCosting) {
      updated = {
        ...updated,
        image: latestCosting.image || order.image,
        type: latestCosting.productCategory || order.type,
        smv: latestCosting.productionSMV || latestCosting.manualSMV || order.smv,
        marketingAverage: latestCosting.productionAverageTarget || order.marketingAverage
      };
    }
    return evaluateReadiness(updated);
  };

  const handleSyncAllWithCosting = () => {
    const updated = orders.map(o => syncWithCosting(o));
    setOrders(updated);
    mockDb.saveOrderPoolEntries(updated);
    setMessage('Synchronized with Sewing Costing database and re-evaluated readiness.');
    setTimeout(() => setMessage(''), 3000);
  };

  const calculateShipmentLeft = (shipDateStr: string) => {
    if (!shipDateStr) return 'N/A';
    const shipDate = new Date(shipDateStr);
    const today = new Date();
    if (isNaN(shipDate.getTime())) return 'Invalid';
    
    let count = 0;
    let curDate = new Date(today.getTime());
    curDate.setHours(0, 0, 0, 0);
    
    while (curDate <= shipDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 5) { // Exclude Friday
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count > 0 ? `${count} Days` : 'Overdue';
  };

  const handleExcelImport = () => {
    if (!excelImport.trim()) return;
    const lines = excelImport.trim().split('\n');
    if (lines.length === 0) return;

    // Detect headers from the first line
    const firstLine = lines[0].split('\t');
    const isHeader = firstLine.some(cell => 
      cell.toLowerCase().includes('status') || 
      cell.toLowerCase().includes('buyer') || 
      cell.toLowerCase().includes('style') ||
      cell.toLowerCase().includes('so') ||
      cell.toLowerCase().includes('merchandiser')
    );

    let dataLines = lines;
    let headers = [
      'Merchandiser', 'Sourcing', 'Buyer', 'Country', 'Order Confirm Date', 
      'SO', 'Style', 'Wash Color', 'Order Qty', 'Monthly Plan', 'Fabric Mill', 
      'Fabric Inhouse Date', 'Accessories Inhouse Date', 'PP Approval Date', 
      'File Handover Date', 'Ship Date', 'Size Group', 'Fabric Type', 'Item', 
      'Wash Type', 'Print', 'Emb'
    ];

    if (isHeader) {
      headers = firstLine.map(h => h.trim());
      dataLines = lines.slice(1);
      setPastedHeaders(headers);
    } else if (pastedHeaders.length > 0) {
      headers = pastedHeaders;
    } else {
      setPastedHeaders(headers);
    }

    const newOrders: OrderPoolEntry[] = dataLines.map((l, idx) => {
      const parts = l.split(/\t/);
      const entry: any = {
        id: (Date.now() + idx).toString(),
        status: 'Imported',
        preProductionStatus: 'Pending',
        isReadyForPlan: false,
        blockerReason: '',
        image: '',
        type: '',
        smv: 0,
        marketingAverage: 0
      };

      headers.forEach((header, hIdx) => {
        const value = (parts[hIdx] || '').trim();
        const lowerHeader = header.toLowerCase();

        if (lowerHeader.includes('merchandiser')) entry.merchandiser = value;
        else if (lowerHeader.includes('sourcing')) entry.sourcing = value;
        else if (lowerHeader.includes('buyer')) entry.buyer = value;
        else if (lowerHeader.includes('country')) entry.country = value;
        else if (lowerHeader.includes('confirm date')) entry.orderConfirmDate = value;
        else if (lowerHeader.includes('so')) entry.soNo = value;
        else if (lowerHeader.includes('style')) entry.style = value;
        else if (lowerHeader.includes('wash color')) entry.washColor = value;
        else if (lowerHeader.includes('order qty')) entry.orderQty = Number(value.replace(/,/g, '')) || 0;
        else if (lowerHeader.includes('monthly plan') || lowerHeader.includes('month qty')) entry.monthQty = Number(value.replace(/,/g, '')) || 0;
        else if (lowerHeader.includes('fabric mill')) entry.fabricMill = value;
        else if (lowerHeader.includes('fabric inhouse')) entry.fabricInhouseDate = value;
        else if (lowerHeader.includes('accessories inhouse') || lowerHeader.includes('acc inhouse')) entry.accessoriesInhouseDate = value;
        else if (lowerHeader.includes('pp approval')) entry.tentativePPSampleApprovalDate = value;
        else if (lowerHeader.includes('file handover')) entry.fileHandoverDate = value;
        else if (lowerHeader.includes('ship date')) entry.shipDate = value;
        else if (lowerHeader.includes('size group')) entry.sizeGroup = value;
        else if (lowerHeader.includes('fabric type')) entry.fabricType = value;
        else if (lowerHeader.includes('item')) entry.item = value;
        else if (lowerHeader.includes('wash type')) entry.washType = value;
        else if (lowerHeader.includes('print')) entry.print = value;
        else if (lowerHeader.includes('emb')) entry.emb = value;
        else if (lowerHeader.includes('smv')) entry.smv = Number(value) || 0;
        else if (lowerHeader.includes('marketing average')) entry.marketingAverage = Number(value) || 0;
        else if (lowerHeader.includes('product type')) entry.type = value;
        else if (lowerHeader.includes('image')) entry.image = value;
        else if (lowerHeader.includes('block reason')) entry.blockerReason = value;
        else if (lowerHeader.includes('status')) entry.preProductionStatus = value;
        else if (lowerHeader.includes('ready')) entry.isReadyForPlan = value.toLowerCase() === 'yes' || value.toLowerCase() === 'ready';
      });

      // Sync with Costing if available
      const latestCosting = mockDb.getLatestCosting(entry.buyer, entry.style);
      if (latestCosting) {
        entry.image = latestCosting.image || entry.image;
        entry.type = latestCosting.productCategory || entry.type;
        entry.smv = latestCosting.productionSMV || latestCosting.manualSMV || entry.smv;
        entry.marketingAverage = latestCosting.productionAverageTarget || entry.marketingAverage;
      } else {
        // If no costing data, it cannot be ready for plan
        entry.isReadyForPlan = false;
        if (!entry.blockerReason) {
          entry.blockerReason = 'Missing Costing Data';
        }
      }

      // Evaluate readiness
      const evaluated = evaluateReadiness(entry as OrderPoolEntry);
      return evaluated;
    });

    // Check for duplicates
    const foundDuplicates: { new: OrderPoolEntry, existing: OrderPoolEntry }[] = [];
    const nonDuplicates: OrderPoolEntry[] = [];

    newOrders.forEach(newOrder => {
      const existing = orders.find(o => o.style === newOrder.style && o.soNo === newOrder.soNo);
      if (existing) {
        foundDuplicates.push({ new: newOrder, existing });
      } else {
        nonDuplicates.push(newOrder);
      }
    });

    if (foundDuplicates.length > 0) {
      setDuplicates(foundDuplicates);
      setPendingOrders(nonDuplicates);
      setShowDuplicateModal(true);
    } else {
      const updatedOrders = [...orders, ...newOrders];
      setOrders(updatedOrders);
      mockDb.saveOrderPoolEntries(updatedOrders);
      setExcelImport('');
      setMessage(`${newOrders.length} orders synchronized.`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const resolveDuplicates = (action: 'KEEP_EXISTING' | 'REPLACE' | 'KEEP_BOTH') => {
    let baseOrders = [...orders];
    let resolved: OrderPoolEntry[] = [];
    
    if (action === 'KEEP_EXISTING') {
      resolved = []; // Don't add anything from duplicates
    } else if (action === 'REPLACE') {
      // Remove existing ones that are in duplicates
      const existingIds = duplicates.map(d => d.existing.id);
      baseOrders = orders.filter(o => !existingIds.includes(o.id));
      resolved = duplicates.map(d => d.new);
    } else if (action === 'KEEP_BOTH') {
      resolved = duplicates.map(d => ({ ...d.new, id: (Date.now() + Math.random()).toString() }));
    }

    const updatedOrders = [...baseOrders, ...pendingOrders, ...resolved];
    setOrders(updatedOrders);
    mockDb.saveOrderPoolEntries(updatedOrders);
    setShowDuplicateModal(false);
    setDuplicates([]);
    setPendingOrders([]);
    setExcelImport('');
    setMessage(`Data synchronized. ${resolved.length + pendingOrders.length} records processed.`);
    setTimeout(() => setMessage(''), 3000);
  };

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

      const matchesSearch = !searchTerm || 
        o.soNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.buyer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilters = Object.keys(searchFilters).every(key => {
        if (!searchFilters[key]) return true;
        let val = (o as any)[key];
        if (key === 'shipmentLeft') {
          val = calculateShipmentLeft(o.shipDate);
        }
        return val && val.toString().toLowerCase().includes(searchFilters[key].toLowerCase());
      });

      return matchesSearch && matchesFilters;
    });
  }, [orders, searchTerm, searchFilters, currentUser]);

  const handleEdit = (order: OrderPoolEntry) => {
    // Access Control for Editing
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER';
    const isLinePlanner = currentUser?.role === 'LINE_LOADING_PLANNER';
    const isCostingIE = currentUser?.role === 'IE_COSTING';
    const isOwner = order.planningOwner === currentUser?.name;

    if (isAdmin || isLinePlanner || isOwner || isCostingIE) {
      setEditingId(order.id);
      setEditData(order);
    } else {
      setMessage('You do not have permission to edit this order.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const saveEdit = () => {
    if (!editingId) return;
    
    let finalData = evaluateReadiness({ ...editData } as OrderPoolEntry);
    
    const updated = orders.map(o => o.id === editingId ? { ...o, ...finalData } : o);
    setOrders(updated);
    mockDb.saveOrderPoolEntries(updated);
    setEditingId(null);
    setEditData({});
    setMessage('Order updated and readiness re-evaluated.');
    setTimeout(() => setMessage(''), 3000);
  };

  const deleteOrder = (id: string) => {
    if (window.confirm('Are you sure you want to delete this order from the pool?')) {
      const updated = orders.filter(o => o.id !== id);
      setOrders(updated);
      mockDb.saveOrderPoolEntries(updated);
      setMessage('Order deleted from pool.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Excel Import Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-700">
            <ExcelIcon size={20} />
            <h3 className="text-sm font-black uppercase tracking-tighter leading-none italic">Order Pool Excel Paste</h3>
          </div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Paste columns from Excel (Tab separated)
          </div>
        </div>
        <textarea 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] font-mono min-h-[120px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
          placeholder="Copy & Paste from Excel (Include Header Row): Planning Owner | Pre-Prod Status | Ready For Plan | Block Reason | Shipment Left | Image | Image 2 | Merchandiser | Sourcing | Buyer | Country | Confirm Date | SO | Style | Wash Color | Order Qty | Month Qty | Fabric Mill | Fabric Inhouse | Acc Inhouse | PP Approval | File Handover | Ship Date | SMV | Target | Type | Size Group | Fabric Type | Item | Wash Type | Print | Emb"
          value={excelImport}
          onChange={e => setExcelImport(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button 
            onClick={handleSyncAllWithCosting}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
          >
            <RefreshCcw size={14}/> Sync with Costing
          </button>
          <button 
            onClick={handleExcelImport} 
            className="bg-blue-700 text-white px-8 py-2.5 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-blue-200 hover:bg-blue-800 transition-all flex items-center gap-2 active:scale-95"
          >
            <RefreshCcw size={14}/> Synchronize Order Pool
          </button>
          <button 
            onClick={() => {
              mockDb.saveOrderPoolEntries(orders);
              setMessage('Order Pool Saved Successfully!');
              setTimeout(() => setMessage(''), 3000);
            }}
            className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <Save size={14}/> Save All
          </button>
        </div>
      </div>

      {/* Registry Section */}
      <div className="bg-white rounded-2xl border border-slate-900 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter leading-none">Order Pool Registry</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Quick Search..." 
                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {Object.keys(searchFilters).some(k => searchFilters[k]) && (
              <button 
                onClick={() => setSearchFilters({})}
                className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-700 flex items-center gap-1"
              >
                <X size={12} /> Clear Filters
              </button>
            )}
            
            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-left-2">
                <span className="text-[10px] font-black text-blue-700 uppercase">{selectedOrders.length} Selected</span>
                <select 
                  className="bg-white border border-blue-200 rounded px-2 py-1 text-[9px] font-bold outline-none"
                  value={bulkOwner}
                  onChange={e => setBulkOwner(e.target.value)}
                >
                  <option value="">Assign Owner...</option>
                  {availablePlanners.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button 
                  onClick={handleBulkOwnerUpdate}
                  disabled={!bulkOwner}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-[9px] font-black uppercase disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
          <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase shadow-sm tracking-widest">
            {filteredOrders.length} Orders in Pool
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[4000px]">
            <thead className="sticky top-0 z-30">
              <tr className="bg-[#FFCC00] text-black text-[10px] font-[1000] uppercase h-10 border-b border-black">
                <th className="px-4 border-r border-black/20 w-12 text-center sticky left-0 bg-[#FFCC00] z-40">
                  <input 
                    type="checkbox" 
                    className="rounded border-black/20"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 border-r border-black/20 w-12 text-center sticky left-12 bg-[#FFCC00] z-40">SL</th>
                {autoHeaders.map((h, i) => (
                  <th key={i} className={`px-4 border-r border-black/20 ${i > 2 ? 'hidden md:table-cell' : ''}`}>{h.label}</th>
                ))}
                {(pastedHeaders.length > 0 ? pastedHeaders : [
                  'Merchandiser', 'Sourcing', 'Buyer', 'Country', 'Order Confirm Date', 
                  'SO', 'Style', 'Wash Color', 'Order Qty', 'Monthly Plan', 'Fabric Mill', 
                  'Fabric Inhouse Date', 'Accessories Inhouse Date', 'PP Approval Date', 
                  'File Handover Date', 'Ship Date', 'Size Group', 'Fabric Type', 'Item', 
                  'Wash Type', 'Print', 'Emb'
                ]).map((header, idx) => (
                  <th key={idx} className={`px-4 border-r border-black/20 ${idx > 5 ? 'hidden md:table-cell' : ''}`}>{header}</th>
                ))}
                <th className="px-4 text-center">Actions</th>
              </tr>
              {/* Search Filter Row */}
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="px-2 border-r border-slate-200 sticky left-0 bg-slate-100 z-40"></th>
                <th className="px-2 border-r border-slate-200 sticky left-12 bg-slate-100 z-40"></th>
                {autoHeaders.map((h, i) => (
                  <th key={i} className={`px-2 border-r border-slate-200 ${i > 2 ? 'hidden md:table-cell' : ''}`}>
                    <input 
                      type="text"
                      className="w-full px-2 py-1 text-[9px] font-bold border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={`Search ${h.label}...`}
                      value={searchFilters[h.key] || ''}
                      onChange={e => setSearchFilters(prev => ({ ...prev, [h.key]: e.target.value }))}
                    />
                  </th>
                ))}
                {(pastedHeaders.length > 0 ? pastedHeaders : [
                  'Merchandiser', 'Sourcing', 'Buyer', 'Country', 'Order Confirm Date', 
                  'SO', 'Style', 'Wash Color', 'Order Qty', 'Monthly Plan', 'Fabric Mill', 
                  'Fabric Inhouse Date', 'Accessories Inhouse Date', 'PP Approval Date', 
                  'File Handover Date', 'Ship Date', 'Size Group', 'Fabric Type', 'Item', 
                  'Wash Type', 'Print', 'Emb'
                ]).map((header, idx) => {
                  // Map header to entry key for filtering
                  let key = header.toLowerCase().replace(/\s+/g, '');
                  if (key.includes('merchandiser')) key = 'merchandiser';
                  else if (key.includes('sourcing')) key = 'sourcing';
                  else if (key.includes('buyer')) key = 'buyer';
                  else if (key.includes('country')) key = 'country';
                  else if (key.includes('so')) key = 'soNo';
                  else if (key.includes('style')) key = 'style';
                  else if (key.includes('orderqty')) key = 'orderQty';
                  else if (key.includes('shipdate')) key = 'shipDate';
                  
                  return (
                    <th key={idx} className={`px-2 border-r border-slate-200 ${idx > 5 ? 'hidden md:table-cell' : ''}`}>
                      <input 
                        type="text"
                        className="w-full px-2 py-1 text-[9px] font-bold border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={`Search...`}
                        value={searchFilters[key] || ''}
                        onChange={e => setSearchFilters(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    </th>
                  );
                })}
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
              {filteredOrders.map((order, idx) => (
                <tr 
                  key={order.id} 
                  className={`hover:bg-slate-50 transition-colors h-9 text-[10px] ${editingId === order.id ? 'bg-blue-50/50' : ''}`}
                  onDoubleClick={() => handleEdit(order)}
                >
                  <td className="px-4 border-r border-slate-100 text-center sticky left-0 bg-white z-10 group-hover:bg-slate-50">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-200"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                    />
                  </td>
                  <td className="px-4 border-r border-slate-100 text-center text-slate-400 sticky left-12 bg-white z-10 group-hover:bg-slate-50">{idx + 1}</td>
                  
                  {/* Part 1: Auto Data */}
                  <td className="px-4 border-r border-slate-100">
                    {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                      <select 
                        className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                        value={editData.planningOwner || ''}
                        onChange={e => setEditData({ ...editData, planningOwner: e.target.value })}
                      >
                        <option value="">Select Owner</option>
                        {availablePlanners.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                          <User size={10} />
                        </div>
                        <span className="font-black text-blue-700">{order.planningOwner}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 border-r border-slate-100">
                    {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER' || order.planningOwner === currentUser?.name) ? (
                      <select 
                        className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                        value={editData.preProductionStatus || ''}
                        onChange={e => setEditData({ ...editData, preProductionStatus: e.target.value as any })}
                      >
                        {['Pending', 'In Progress', 'Approved', 'Failed', 'Hold', 'Not Required'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        order.preProductionStatus === 'Approved' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {order.preProductionStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-4 border-r border-slate-100 text-center">
                    {order.isReadyForPlan ? (
                      <ShieldCheck size={16} className="text-emerald-500 mx-auto" />
                    ) : (
                      <ShieldAlert size={16} className="text-rose-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 border-r border-slate-100 text-rose-600 italic text-[9px]">{order.blockerReason}</td>
                  <td className="px-4 border-r border-slate-100 text-center font-black text-slate-900">{calculateShipmentLeft(order.shipDate)}</td>
                  <td className="px-4 border-r border-slate-100 hidden md:table-cell">
                    {order.image ? (
                      <img src={order.image} alt="Style" className="w-10 h-10 object-cover rounded border border-slate-200 mx-auto" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 mx-auto flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase">No Image</div>
                    )}
                  </td>
                  <td className="px-4 border-r border-slate-100 hidden md:table-cell">{order.type}</td>
                  <td className="px-4 border-r border-slate-100 text-center font-black hidden md:table-cell">{order.smv}</td>
                  <td className="px-4 border-r border-slate-100 text-center hidden md:table-cell">{order.marketingAverage}</td>

                  {/* Part 2: Excel Data */}
                  {(pastedHeaders.length > 0 ? pastedHeaders : [
                    'Merchandiser', 'Sourcing', 'Buyer', 'Country', 'Order Confirm Date', 
                    'SO', 'Style', 'Wash Color', 'Order Qty', 'Monthly Plan', 'Fabric Mill', 
                    'Fabric Inhouse Date', 'Accessories Inhouse Date', 'PP Approval Date', 
                    'File Handover Date', 'Ship Date', 'Size Group', 'Fabric Type', 'Item', 
                    'Wash Type', 'Print', 'Emb'
                  ]).map((header, hIdx) => {
                    const lowerHeader = header.toLowerCase();
                    
                    if (lowerHeader.includes('merchandiser')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.merchandiser || ''}
                            onChange={e => setEditData({ ...editData, merchandiser: e.target.value })}
                          />
                        ) : order.merchandiser}
                      </td>
                    );
                    if (lowerHeader.includes('sourcing')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.sourcing || ''}
                            onChange={e => setEditData({ ...editData, sourcing: e.target.value })}
                          />
                        ) : order.sourcing}
                      </td>
                    );
                    if (lowerHeader.includes('buyer')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100 uppercase text-slate-500">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER' || currentUser?.role === 'IE_COSTING') ? (
                          <select 
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.buyer || ''}
                            onChange={e => setEditData({ ...editData, buyer: e.target.value })}
                          >
                            <option value="">Select Buyer</option>
                            {buyers.map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        ) : order.buyer}
                      </td>
                    );
                    if (lowerHeader.includes('country')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.country || ''}
                            onChange={e => setEditData({ ...editData, country: e.target.value })}
                          />
                        ) : order.country}
                      </td>
                    );
                    if (lowerHeader.includes('confirm date')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="date"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.orderConfirmDate || ''}
                            onChange={e => setEditData({ ...editData, orderConfirmDate: e.target.value })}
                          />
                        ) : order.orderConfirmDate}
                      </td>
                    );
                    if (lowerHeader.includes('so')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100 font-black text-slate-900">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.soNo || ''}
                            onChange={e => setEditData({ ...editData, soNo: e.target.value })}
                          />
                        ) : order.soNo}
                      </td>
                    );
                    if (lowerHeader.includes('style')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100 text-blue-600 italic">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER' || currentUser?.role === 'IE_COSTING') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.style || ''}
                            onChange={e => setEditData({ ...editData, style: e.target.value })}
                          />
                        ) : order.style}
                      </td>
                    );
                    if (lowerHeader.includes('wash color')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.washColor || ''}
                            onChange={e => setEditData({ ...editData, washColor: e.target.value })}
                          />
                        ) : order.washColor}
                      </td>
                    );
                    if (lowerHeader.includes('order qty')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100 text-right font-black">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="number"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.orderQty || 0}
                            onChange={e => setEditData({ ...editData, orderQty: parseInt(e.target.value) || 0 })}
                          />
                        ) : order.orderQty.toLocaleString()}
                      </td>
                    );
                    if (lowerHeader.includes('monthly plan') || lowerHeader.includes('month qty')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100 text-right">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="number"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.monthQty || 0}
                            onChange={e => setEditData({ ...editData, monthQty: parseInt(e.target.value) || 0 })}
                          />
                        ) : order.monthQty.toLocaleString()}
                      </td>
                    );
                    if (lowerHeader.includes('fabric mill')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.fabricMill || ''}
                            onChange={e => setEditData({ ...editData, fabricMill: e.target.value })}
                          />
                        ) : order.fabricMill}
                      </td>
                    );
                    if (lowerHeader.includes('fabric inhouse')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="date"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.fabricInhouseDate || ''}
                            onChange={e => setEditData({ ...editData, fabricInhouseDate: e.target.value })}
                          />
                        ) : order.fabricInhouseDate}
                      </td>
                    );
                    if (lowerHeader.includes('accessories inhouse') || lowerHeader.includes('acc inhouse')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="date"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.accessoriesInhouseDate || ''}
                            onChange={e => setEditData({ ...editData, accessoriesInhouseDate: e.target.value })}
                          />
                        ) : order.accessoriesInhouseDate}
                      </td>
                    );
                    if (lowerHeader.includes('pp approval')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="date"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.tentativePPSampleApprovalDate || ''}
                            onChange={e => setEditData({ ...editData, tentativePPSampleApprovalDate: e.target.value })}
                          />
                        ) : order.tentativePPSampleApprovalDate}
                      </td>
                    );
                    if (lowerHeader.includes('file handover')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="date"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.fileHandoverDate || ''}
                            onChange={e => setEditData({ ...editData, fileHandoverDate: e.target.value })}
                          />
                        ) : order.fileHandoverDate}
                      </td>
                    );
                    if (lowerHeader.includes('ship date')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="date"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.shipDate || ''}
                            onChange={e => setEditData({ ...editData, shipDate: e.target.value })}
                          />
                        ) : order.shipDate}
                      </td>
                    );
                    if (lowerHeader.includes('size group')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.sizeGroup || ''}
                            onChange={e => setEditData({ ...editData, sizeGroup: e.target.value })}
                          />
                        ) : order.sizeGroup}
                      </td>
                    );
                    if (lowerHeader.includes('fabric type')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.fabricType || ''}
                            onChange={e => setEditData({ ...editData, fabricType: e.target.value })}
                          />
                        ) : order.fabricType}
                      </td>
                    );
                    if (lowerHeader.includes('item')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.item || ''}
                            onChange={e => setEditData({ ...editData, item: e.target.value })}
                          />
                        ) : order.item}
                      </td>
                    );
                    if (lowerHeader.includes('wash type')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.washType || ''}
                            onChange={e => setEditData({ ...editData, washType: e.target.value })}
                          />
                        ) : order.washType}
                      </td>
                    );
                    if (lowerHeader.includes('print')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.print || ''}
                            onChange={e => setEditData({ ...editData, print: e.target.value })}
                          />
                        ) : order.print}
                      </td>
                    );
                    if (lowerHeader.includes('emb')) return (
                      <td key={hIdx} className="px-4 border-r border-slate-100">
                        {editingId === order.id && (currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER') ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-[10px] font-bold"
                            value={editData.emb || ''}
                            onChange={e => setEditData({ ...editData, emb: e.target.value })}
                          />
                        ) : order.emb}
                      </td>
                    );
                    if (lowerHeader.includes('smv')) return <td key={hIdx} className="px-4 border-r border-slate-100 text-center">{order.smv}</td>;
                    if (lowerHeader.includes('marketing average')) return <td key={hIdx} className="px-4 border-r border-slate-100 text-center">{order.marketingAverage}</td>;

                    return <td key={hIdx} className="px-4 border-r border-slate-100 text-slate-400 italic">N/A</td>;
                  })}

                  <td className="px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === order.id ? (
                        <button 
                          onClick={saveEdit}
                          className="text-emerald-500 hover:text-emerald-700 transition-colors"
                          title="Save Changes"
                        >
                          <Save size={14} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleEdit(order)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Edit Order"
                        >
                          <User size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          const qty = prompt('Enter quantity for the new split part:', '10000');
                          if (qty && !isNaN(Number(qty))) {
                            const splitQty = Number(qty);
                            if (splitQty < order.orderQty) {
                              const newOrder = { 
                                ...order, 
                                id: Date.now().toString(), 
                                orderQty: splitQty,
                                originalQty: order.orderQty,
                                status: 'Imported' as const
                              };
                              const updatedOrder = { ...order, orderQty: order.orderQty - splitQty };
                              const updated = orders.map(o => o.id === order.id ? updatedOrder : o);
                              const final = [...updated, newOrder];
                              setOrders(final);
                              mockDb.saveOrderPoolEntries(final);
                              setMessage(`Style split: ${splitQty} separated.`);
                              setTimeout(() => setMessage(''), 3000);
                            } else {
                              alert('Split quantity must be less than current order quantity.');
                            }
                          }
                        }}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="Split Order"
                      >
                        <RefreshCcw size={14} />
                      </button>
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Duplicate Resolution Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-amber-500 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Duplicate Records Detected</h3>
                  <p className="text-xs font-bold opacity-90">{duplicates.length} styles already exist in the registry.</p>
                </div>
              </div>
              <button onClick={() => setShowDuplicateModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                {duplicates.map((dup, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Existing Record</h4>
                      <div className="space-y-1 text-xs">
                        <p><span className="text-slate-500">SO:</span> <span className="font-bold">{dup.existing.soNo}</span></p>
                        <p><span className="text-slate-500">Style:</span> <span className="font-bold">{dup.existing.style}</span></p>
                        <p><span className="text-slate-500">Buyer:</span> <span className="font-bold">{dup.existing.buyer}</span></p>
                        <p><span className="text-slate-500">Qty:</span> <span className="font-bold">{dup.existing.orderQty}</span></p>
                      </div>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <h4 className="text-[10px] font-black text-blue-500 uppercase mb-2">New Record (Pasted)</h4>
                      <div className="space-y-1 text-xs">
                        <p><span className="text-slate-500">SO:</span> <span className="font-bold">{dup.new.soNo}</span></p>
                        <p><span className="text-slate-500">Style:</span> <span className="font-bold">{dup.new.style}</span></p>
                        <p><span className="text-slate-500">Buyer:</span> <span className="font-bold">{dup.new.buyer}</span></p>
                        <p><span className="text-slate-500">Qty:</span> <span className="font-bold">{dup.new.orderQty}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 uppercase italic">Choose how to resolve these duplicates</p>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => resolveDuplicates('KEEP_EXISTING')}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all"
                >
                  Keep Existing
                </button>
                <button 
                  onClick={() => resolveDuplicates('REPLACE')}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all"
                >
                  Replace All
                </button>
                <button 
                  onClick={() => resolveDuplicates('KEEP_BOTH')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
                >
                  Keep Both (Duplicates)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-2xl shadow-2xl font-black z-[1200] animate-in slide-in-from-right-5 border-2 border-white flex items-center gap-2.5 text-xs">
          <CheckCircle size={18}/> {message}
        </div>
      )}
    </div>
  );
};
