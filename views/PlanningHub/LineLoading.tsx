import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  X,
  Maximize2,
  Minimize2,
  LayoutGrid,
  GripVertical,
  Search,
  TrendingUp,
  TrendingDown,
  CalendarOff,
  Trash2
} from 'lucide-react';
import { 
  DndContext, 
  DragOverlay, 
  useDraggable, 
  useDroppable, 
  DragEndEvent, 
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  DragOverEvent
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  format, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isFriday, 
  addMonths, 
  subMonths,
  differenceInDays,
  startOfDay,
  isWithinInterval
} from 'date-fns';
import { mockDb } from '../../services/mockDb';
import { OrderPoolEntry, LineMapping, StylePlan } from '../../types';
import { useGlobal } from '../../App';

const PLAN_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 
  'bg-rose-500', 'bg-indigo-500', 'bg-violet-500', 
  'bg-cyan-500', 'bg-orange-500', 'bg-teal-500', 'bg-fuchsia-500'
];

const CELL_WIDTH = 40;
const LINE_HEADER_WIDTH = 120;

// --- Helper Components ---

interface DraggableStyleCardProps {
  order: OrderPoolEntry;
  onSplit: (order: OrderPoolEntry) => void;
  onClick: (order: OrderPoolEntry) => void;
}

const DraggableStyleCard: React.FC<DraggableStyleCardProps> = ({ order, onSplit, onClick }) => {
  const [costingData, setCostingData] = useState<any>(null);

  useEffect(() => {
    const data = mockDb.getLatestCosting(order.buyer, order.style);
    if (data) setCostingData(data);
  }, [order.buyer, order.style]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `order-${order.id}`,
    data: { type: 'order', order }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const isPending = !order.isReadyForPlan;

  return (
    <div
      ref={setNodeRef}
      style={typeof style === 'object' ? style : {}}
      {...listeners}
      {...attributes}
      onClick={() => onClick(order)}
      className={`bg-white border ${isPending ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3 group relative`}
    >
      <div className="h-24 bg-slate-100 relative">
        {costingData?.image ? (
          <img 
            src={costingData.image} 
            alt={order.style}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
            <span className="text-[10px] font-black uppercase">{order.item || order.type || 'No Image'}</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${isPending ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'} uppercase tracking-tighter`}>{order.buyer}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <p className={`text-xs font-black ${isPending ? 'text-rose-700' : 'text-slate-900'} truncate`}>{order.style}</p>
          <div className="flex gap-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSplit(order);
              }}
              className="p-1 hover:bg-slate-100 rounded text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Split Order"
            >
              <LayoutGrid size={10} />
            </button>
            <GripVertical size={12} className="text-slate-300 group-hover:text-slate-400" />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-500 uppercase">
          <span>Qty: {order.orderQty.toLocaleString()}</span>
          <span>SMV: {order.smv}</span>
        </div>
        {isPending && (
          <div className="mt-1 text-[8px] font-black text-rose-500 uppercase tracking-tighter">Pending Style</div>
        )}
      </div>
    </div>
  );
};

interface PlanBarProps {
  plan: StylePlan;
  startDate: Date;
  onShowInfo: (plan: StylePlan) => void;
}

const PlanBar: React.FC<PlanBarProps> = ({ plan, startDate, onShowInfo }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `plan-${plan.id}`,
    data: { type: 'plan', plan }
  });

  const sewingSection = plan.sections?.Sewing;
  if (!sewingSection) return null;

  const planStart = new Date(sewingSection.inputDate);
  const planEnd = new Date(sewingSection.outputDate);
  
  // Calculate offset from board start
  const offsetDays = differenceInDays(startOfDay(planStart), startOfDay(startDate));
  const durationDays = differenceInDays(startOfDay(planEnd), startOfDay(planStart)) + 1;

  const style = {
    transform: CSS.Translate.toString(transform),
    left: `${offsetDays * CELL_WIDTH}px`,
    width: `${durationDays * CELL_WIDTH - 2}px`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 10
  };

  const isPending = plan.status === 'PENDING' || plan.isReadyForPlan === false;

  return (
    <div
      ref={setNodeRef}
      style={typeof style === 'object' ? style : {}}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onShowInfo(plan);
      }}
      className={`absolute top-1 bottom-1 ${isPending ? 'bg-rose-600' : (plan.color || 'bg-blue-500')} rounded shadow-sm cursor-grab active:cursor-grabbing flex flex-col justify-center px-2 overflow-hidden group border border-white/20 hover:ring-2 hover:ring-white/50 transition-all`}
    >
      <div className="flex justify-between items-start w-full">
        <p className="text-[7px] font-black text-white/80 truncate leading-none uppercase">
          {format(planStart, 'dd/MM')} - {format(planEnd, 'dd/MM')}
        </p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Remove this plan?')) {
              mockDb.deleteStylePlan(plan.id);
              window.dispatchEvent(new CustomEvent('refresh-planning-data'));
            }
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded transition-opacity"
        >
          <X size={8} className="text-white" />
        </button>
      </div>
      <p className="text-[9px] font-black text-white truncate leading-none uppercase mt-0.5">{plan.styleNumber}</p>
      
      <div className="absolute right-1 bottom-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Info size={8} className="text-white/60" />
      </div>
    </div>
  );
};

interface DroppableLineRowProps {
  line: LineMapping;
  plans: StylePlan[];
  dates: Date[];
  onShowInfo: (plan: StylePlan) => void;
}

const DroppableLineRow: React.FC<DroppableLineRowProps> = ({ line, plans, dates, onShowInfo }) => {
  return (
    <div className="flex border-b border-slate-100 group">
      {/* Line Header */}
      <div className="w-[120px] min-w-[120px] bg-slate-50 border-r border-slate-200 p-2 flex items-center gap-2 sticky left-0 z-20">
        <div className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center text-[10px] font-black">
          {line.lineId.replace('Line ', '')}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{line.lineId}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase">{line.layoutManpower || 0} P</p>
        </div>
      </div>

      {/* Grid Cells */}
      <div 
        className="relative flex flex-1 h-12"
        style={{ width: `${dates.length * CELL_WIDTH}px` }}
      >
        {dates.map((date, idx) => (
          <DroppableCell 
            key={idx} 
            date={date} 
            lineId={line.lineId} 
            isFriday={isFriday(date)} 
          />
        ))}

        {/* Plans on this line */}
        {plans.map(plan => (
          <PlanBar key={plan.id} plan={plan} startDate={dates[0]} onShowInfo={onShowInfo} />
        ))}
      </div>
    </div>
  );
};

const DroppableCell: React.FC<{ date: Date, lineId: string, isFriday: boolean }> = ({ date, lineId, isFriday }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${lineId}-${format(date, 'yyyy-MM-dd')}`,
    data: { lineId, date: format(date, 'yyyy-MM-dd') }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`w-[40px] min-w-[40px] border-r border-slate-100 h-full transition-colors ${isOver ? 'bg-blue-100/50' : ''} ${isFriday ? 'bg-slate-100/50' : ''}`}
    />
  );
};

// --- Main Component ---

export const LineLoading: React.FC<{ view?: string | null, selectedMonth: number }> = ({ view, selectedMonth }) => {
  const { currentUser } = useGlobal();
  const [orders, setOrders] = useState<OrderPoolEntry[]>([]);
  const [lines, setLines] = useState<LineMapping[]>([]);
  const [plans, setPlans] = useState<StylePlan[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPlan, setSelectedPlan] = useState<StylePlan | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [sortBy, setSortBy] = useState<'shipDate' | 'buyer' | 'item'>('shipDate');
  const [offDays, setOffDays] = useState<string[]>([]);

  const topScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTopScroll = () => {
    if (topScrollRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBoardScroll = () => {
    if (topScrollRef.current && scrollContainerRef.current) {
      topScrollRef.current.scrollLeft = scrollContainerRef.current.scrollLeft;
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER';
  const isLinePlanner = currentUser?.role === 'LINE_LOADING_PLANNER';
  const canEdit = isAdmin || isLinePlanner;

  // Date Range Generation
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(addMonths(currentMonth, 2)); // Show 3 months for better scrolling
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    refreshData();
    
    // Listen for custom refresh events from sub-components
    const handleRefresh = () => refreshData();
    window.addEventListener('refresh-planning-data', handleRefresh);
    return () => window.removeEventListener('refresh-planning-data', handleRefresh);
  }, [currentUser, showPending, selectedMonth, currentMonth]);

  // Scroll to today on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      const today = new Date();
      const todayIdx = dates.findIndex(d => isSameDay(d, today));
      if (todayIdx !== -1) {
        scrollContainerRef.current.scrollLeft = todayIdx * CELL_WIDTH - 200;
      }
    }
  }, [dates.length]);

  const refreshData = () => {
    const allOrders = mockDb.getOrderPoolEntries();
    const allPlans = mockDb.getStylePlans();
    
    // Filter orders that are ready but not yet fully planned
    const plannedQtyMap: Record<string, number> = {};
    allPlans.forEach(p => {
      const key = p.orderId || `${p.soNumber}-${p.styleNumber}`;
      plannedQtyMap[key] = (plannedQtyMap[key] || 0) + p.planQuantity;
    });

    let availableOrders = allOrders.filter(o => {
      if (!showPending && !o.isReadyForPlan) return false;
      
      // Month filter
      if (o.shipDate) {
        const shipMonth = new Date(o.shipDate).getMonth();
        if (shipMonth !== selectedMonth) return false;
      }

      // Costing Data Check
      const costing = mockDb.getLatestCosting(o.buyer, o.style);
      if (!costing) return false;

      const key = o.id;
      const planned = plannedQtyMap[key] || 0;
      return planned < o.orderQty;
    }).map(o => {
      const key = o.id;
      const planned = plannedQtyMap[key] || 0;
      return { ...o, orderQty: o.orderQty - planned };
    });

    // Access Control: Filter visibility
    if (!isAdmin && !isLinePlanner) {
      availableOrders = availableOrders.filter(o => o.planningOwner === currentUser?.name);
    }

    setOrders(availableOrders);
    const config = mockDb.getSystemConfig();
    setLines(config.lineMappings || []);
    setOffDays(config.offDays || []);
    setPlans(allPlans);
  };

  const handleSplitOrder = (order: OrderPoolEntry) => {
    const splitAmount = prompt(`Enter quantity to split from ${order.orderQty.toLocaleString()}:`, Math.floor(order.orderQty / 2).toString());
    if (!splitAmount) return;
    
    const qty = parseInt(splitAmount);
    if (isNaN(qty) || qty <= 0 || qty >= order.orderQty) {
      alert('Invalid split quantity');
      return;
    }

    // In a real DB we'd create a new entry or handle this differently.
    // For mockDb, we'll just simulate it by creating a new entry with a suffix.
    const newOrder: OrderPoolEntry = {
      ...order,
      id: `split-${Date.now()}`,
      orderQty: qty,
      originalQty: order.orderQty,
      style: `${order.style} (Split)`
    };

    const updatedOrder = { ...order, orderQty: order.orderQty - qty };
    
    const allOrders = mockDb.getOrderPoolEntries();
    const updatedAll = allOrders.map(o => o.id === order.id ? updatedOrder : o);
    updatedAll.push(newOrder);
    
    mockDb.saveOrderPoolEntries(updatedAll);
    refreshData();
  };

  const handleUpdatePlanDetails = (planId: string, updates: { qty: number, hours: number, eff: number }) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (updates.qty <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    // Recalculate duration
    const sewingSection = plan.sections?.Sewing;
    if (sewingSection) {
      const targetPerDay = Math.floor((plan.manpower * updates.hours * 60 * (updates.eff / 100)) / plan.smv);
      const durationDays = Math.ceil(updates.qty / targetPerDay);
      const planStartDate = new Date(sewingSection.inputDate);
      const planEndDate = calculateEndDateWithOffDays(planStartDate, durationDays);

      const updatedPlan: StylePlan = {
        ...plan,
        planQuantity: updates.qty,
        workingHours: updates.hours,
        targetEff: updates.eff,
        sections: {
          ...plan.sections,
          Sewing: {
            ...sewingSection,
            workingDays: durationDays,
            requiredPcsPerDay: targetPerDay,
            outputDate: format(planEndDate, 'yyyy-MM-dd')
          }
        }
      };

      mockDb.saveStylePlan(updatedPlan);
      refreshData();
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!canEdit) return;
    setActiveId(event.active.id as string);
  };

  const calculateEndDateWithOffDays = (start: Date, durationDays: number) => {
    let current = new Date(start);
    let daysAdded = 0;
    // If duration is 1 day, it ends on the same day
    if (durationDays <= 1) return current;

    while (daysAdded < durationDays - 1) {
      current = addDays(current, 1);
      const dateStr = format(current, 'yyyy-MM-dd');
      if (!offDays.includes(dateStr)) {
        daysAdded++;
      }
    }
    return current;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canEdit) return;
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const overData = over.data.current;
    const activeData = active.data.current;

    if (!overData || !activeData) return;

    // Case 1: Dragging from List to Board (Specific Cell)
    if (activeData.type === 'order' && overData.lineId && overData.date) {
      const order = activeData.order as OrderPoolEntry;
      const lineId = overData.lineId;
      const dropDate = new Date(overData.date);

      // Prevent duplicate plans if already fully planned (extra safety)
      const allPlans = mockDb.getStylePlans();
      const key = `${order.soNo}-${order.style}`;
      const alreadyPlannedQty = allPlans
        .filter(p => `${p.soNumber}-${p.styleNumber}` === key)
        .reduce((sum, p) => sum + p.planQuantity, 0);
      
      if (alreadyPlannedQty >= order.originalQty && order.originalQty > 0) {
        alert('This style is already fully planned.');
        return;
      }

      // Check if there's already a plan at this date on this line
      const existingPlansOnLine = plans.filter(p => p.lineId === lineId);
      let planStartDate = dropDate;

      // If there's a plan overlapping, find the next available date
      existingPlansOnLine.forEach(p => {
        const pStart = new Date(p.sections.Sewing.inputDate);
        const pEnd = new Date(p.sections.Sewing.outputDate);
        if (isWithinInterval(planStartDate, { start: pStart, end: pEnd })) {
          planStartDate = addDays(pEnd, 1);
          while (isFriday(planStartDate)) {
            planStartDate = addDays(planStartDate, 1);
          }
        }
      });

      // Calculate duration based on marketing average (Target per day)
      const efficiency = 0.65;
      const line = lines.find(l => l.lineId === lineId);
      const manpower = line?.layoutManpower || 40;
      const targetPerDay = Math.floor((manpower * 10 * 60 * efficiency) / order.smv);
      const durationDays = Math.ceil(order.orderQty / targetPerDay);

      const planEndDate = calculateEndDateWithOffDays(planStartDate, durationDays);

      const newPlan: StylePlan = {
        id: `plan-${Date.now()}`,
        orderId: order.id,
        soNumber: order.soNo,
        buyer: order.buyer,
        styleNumber: order.style,
        smv: order.smv,
        orderQuantity: order.orderQty,
        planQuantity: order.orderQty,
        targetEff: 65,
        manpower: manpower,
        workingHours: 10,
        lineId: lineId,
        isReadyForPlan: order.isReadyForPlan,
        sections: {
          Sewing: {
            inputDate: format(planStartDate, 'yyyy-MM-dd'),
            outputDate: format(planEndDate, 'yyyy-MM-dd'),
            workingDays: durationDays,
            requiredPcsPerDay: targetPerDay,
            status: 'PLANNING'
          }
        },
        sampleStatus: 'Approved',
        fileHandoverStatus: 'Completed',
        fabricStatus: 'In-house',
        accessoriesStatus: 'In-house',
        printEmbStatus: 'N/A',
        shipmentDate: order.shipDate,
        priority: 'Normal',
        status: 'Active',
        isComplete: false,
        timestamp: new Date().toISOString(),
        color: PLAN_COLORS[plans.length % PLAN_COLORS.length],
        selectedPos: [],
        selectedColors: []
      } as any;

      mockDb.saveStylePlan(newPlan);
      refreshData();
    }

    // Case 2: Moving plan between lines/dates
    if (activeData.type === 'plan' && overData.lineId && overData.date) {
      const plan = activeData.plan as StylePlan;
      const newLineId = overData.lineId;
      const newDate = overData.date;

      if (plan.lineId !== newLineId || plan.sections.Sewing.inputDate !== newDate) {
        const durationDays = plan.sections.Sewing.workingDays;
        const planStartDate = new Date(newDate);
        const planEndDate = calculateEndDateWithOffDays(planStartDate, durationDays);

        const updatedPlan: StylePlan = { 
          ...plan, 
          lineId: newLineId,
          manpower: lines.find(l => l.lineId === newLineId)?.layoutManpower || plan.manpower,
          sections: {
            ...plan.sections,
            Sewing: {
              ...plan.sections.Sewing,
              inputDate: newDate,
              outputDate: format(planEndDate, 'yyyy-MM-dd')
            }
          }
        };
        mockDb.saveStylePlan(updatedPlan);
        refreshData();
      }
    }

    // Case 3: Dragging from Board back to List
    if (activeData.type === 'plan' && over.id === 'style-list') {
      const plan = activeData.plan as StylePlan;
      mockDb.deleteStylePlan(plan.id);
      refreshData();
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortBy === 'shipDate') {
      return new Date(a.shipDate).getTime() - new Date(b.shipDate).getTime();
    }
    if (sortBy === 'buyer') {
      return a.buyer.localeCompare(b.buyer);
    }
    if (sortBy === 'item') {
      return (a.item || '').localeCompare(b.item || '');
    }
    return 0;
  });

  const filteredOrders = sortedOrders.filter(o => 
    o.style.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.buyer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`h-full flex flex-col bg-slate-50 overflow-hidden ${isFullScreen ? 'fixed inset-0 z-[1000]' : ''}`}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 z-50 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Line Loading Board</h1>
          <p className="text-xs font-bold text-slate-400 uppercase">
            {canEdit ? 'Drag & Drop Planning Interface' : 'View Only Mode'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] font-black text-slate-500 uppercase">Pending</span>
            <button 
              onClick={() => setShowPending(!showPending)}
              className={`w-8 h-4 rounded-full relative transition-colors ${showPending ? 'bg-rose-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showPending ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 text-xs font-black uppercase tracking-widest text-slate-600 min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen Mode"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          
          <div className="hidden lg:flex gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
              <div className="w-3 h-3 bg-slate-100 border border-slate-200 rounded"></div>
              <span>Friday</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Left Sidebar: Style List */}
          <div className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-white flex flex-col h-1/3 md:h-full">
            <StyleListDroppable 
              orders={filteredOrders} 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm} 
              onSplit={handleSplitOrder}
              onClick={(order) => {
              // Create a temporary plan object to show in modal
              const tempPlan: StylePlan = {
                id: `temp-${order.id}`,
                soNumber: order.soNo,
                buyer: order.buyer,
                styleNumber: order.style,
                smv: order.smv,
                orderQuantity: order.orderQty,
                planQuantity: order.orderQty,
                targetEff: 65,
                manpower: 40,
                workingHours: 10,
                lineId: 'Unassigned',
                isReadyForPlan: order.isReadyForPlan,
                sections: {
                  Sewing: {
                    inputDate: format(new Date(), 'yyyy-MM-dd'),
                    outputDate: format(new Date(), 'yyyy-MM-dd'),
                    workingDays: 1,
                    requiredPcsPerDay: 0,
                    status: 'PLANNING'
                  }
                },
                sampleStatus: 'Approved',
                fileHandoverStatus: 'Completed',
                fabricStatus: 'In-house',
                accessoriesStatus: 'In-house',
                printEmbStatus: 'N/A',
                shipmentDate: order.shipDate,
                priority: 'Normal',
                status: 'Active',
                isComplete: false,
                timestamp: new Date().toISOString(),
                selectedPos: [],
                selectedColors: []
              };
              setSelectedPlan(tempPlan);
            }}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
          </div>

          {/* Right Content: Planning Board */}
          <div className="flex-1 overflow-hidden flex flex-col bg-white h-2/3 md:h-full">
            {/* Top Scrollbar Sync - Always visible at top of board */}
            <div className="bg-slate-50 border-b border-slate-200 flex shrink-0 z-40">
              <div className="w-[120px] min-w-[120px] border-r border-slate-200" />
              <div 
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className="flex-1 overflow-x-auto overflow-y-hidden h-4 custom-scrollbar"
              >
                <div style={{ width: dates.length * CELL_WIDTH, height: '1px' }} />
              </div>
            </div>

            <div 
              ref={scrollContainerRef}
              onScroll={handleBoardScroll}
              className="flex-1 overflow-auto relative custom-scrollbar scroll-smooth min-w-full md:min-w-[800px]"
            >
              <div className="inline-block min-w-full">
                {/* Board Header: Dates */}
                <div className="flex sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                  <div className="w-[120px] min-w-[120px] bg-slate-100 border-r border-slate-200 p-3 flex items-center sticky left-0 z-40">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lines</span>
                  </div>
                  <div className="flex">
                    {dates.map((date, idx) => (
                      <div 
                        key={idx} 
                        className={`w-[40px] min-w-[40px] border-r border-slate-100 py-3 flex flex-col items-center justify-center relative group/date ${offDays.includes(format(date, 'yyyy-MM-dd')) ? 'bg-rose-50' : isFriday(date) ? 'bg-slate-100/50' : ''} ${isSameDay(date, new Date()) ? 'bg-blue-50/30' : ''}`}
                      >
                        <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{format(date, 'EEE')}</span>
                        <span className={`text-[10px] font-black leading-none ${isSameDay(date, new Date()) ? 'text-blue-600' : 'text-slate-900'}`}>
                          {format(date, 'd')}
                        </span>
                        
                        {canEdit && (
                          <button 
                            onClick={() => {
                              mockDb.toggleOffDay(format(date, 'yyyy-MM-dd'));
                              refreshData();
                            }}
                            className="absolute -bottom-1 opacity-0 group-hover/date:opacity-100 transition-opacity bg-white rounded-full shadow-sm p-0.5 border border-slate-200 z-50"
                            title="Toggle Off Day"
                          >
                            <CalendarOff size={10} className={offDays.includes(format(date, 'yyyy-MM-dd')) ? 'text-rose-500' : 'text-slate-400'} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Board Body: Line Rows */}
                <div className="bg-white min-h-full pb-20">
                  {lines.map(line => (
                    <DroppableLineRow 
                      key={line.lineId} 
                      line={line} 
                      plans={plans.filter(p => p.lineId === line.lineId)} 
                      dates={dates}
                      onShowInfo={(plan) => setSelectedPlan(plan)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Bar */}
            <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex gap-8">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Lines</p>
                  <p className="text-sm font-black text-slate-900">{lines.length}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Plans</p>
                  <p className="text-sm font-black text-blue-600">{plans.length}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Planned Qty</p>
                  <p className="text-sm font-black text-emerald-600">{plans.reduce((s, p) => s + p.planQuantity, 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      const today = new Date();
                      const todayIdx = dates.findIndex(d => isSameDay(d, today));
                      if (todayIdx !== -1) {
                        scrollContainerRef.current.scrollTo({
                          left: todayIdx * CELL_WIDTH - 200,
                          behavior: 'smooth'
                        });
                      }
                    }
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                >
                  <Calendar size={14} />
                  Jump to Today
                </button>
              </div>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeId ? (
            activeId.startsWith('order-') ? (
              <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-xl w-64 rotate-3">
                <p className="text-xs font-black text-slate-900">{orders.find(o => `order-${o.id}` === activeId)?.style}</p>
              </div>
            ) : (
              <div className={`h-10 rounded shadow-xl flex items-center px-3 text-white font-black text-[10px] w-40 ${plans.find(p => `plan-${p.id}` === activeId)?.color || 'bg-blue-500'}`}>
                {plans.find(p => `plan-${p.id}` === activeId)?.styleNumber}
              </div>
            )
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Style Info Modal */}
      {selectedPlan && (
        <StyleInfoModal 
          plan={selectedPlan} 
          onClose={() => setSelectedPlan(null)} 
          onUpdate={(id, updates) => handleUpdatePlanDetails(id, updates)}
          onCancel={(id) => {
            mockDb.deleteStylePlan(id);
            refreshData();
          }}
          canEdit={canEdit}
          lines={lines}
          onPlanNow={(orderId, lineId, date, qty, hours, eff) => {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;

            const planStartDate = new Date(date);
            const lineManpower = lines.find(l => l.lineId === lineId)?.layoutManpower || 40;
            const targetPerDay = Math.floor((lineManpower * hours * 60 * (eff / 100)) / order.smv);
            const durationDays = Math.ceil(qty / targetPerDay);
            const planEndDate = calculateEndDateWithOffDays(planStartDate, durationDays);

            const newPlan: StylePlan = {
              id: `plan-${Date.now()}`,
              orderId: order.id,
              soNumber: order.soNo,
              buyer: order.buyer,
              styleNumber: order.style,
              smv: order.smv,
              orderQuantity: order.orderQty,
              planQuantity: qty,
              targetEff: eff,
              manpower: lineManpower,
              workingHours: hours,
              lineId: lineId,
              isReadyForPlan: order.isReadyForPlan,
              sections: {
                Sewing: {
                  inputDate: date,
                  outputDate: format(planEndDate, 'yyyy-MM-dd'),
                  workingDays: durationDays,
                  requiredPcsPerDay: targetPerDay,
                  status: 'PLANNING'
                }
              },
              sampleStatus: 'Approved',
              fileHandoverStatus: 'Completed',
              fabricStatus: 'In-house',
              accessoriesStatus: 'In-house',
              printEmbStatus: 'N/A',
              shipmentDate: order.shipDate,
              priority: 'Normal',
              status: 'Active',
              isComplete: false,
              timestamp: new Date().toISOString(),
              color: PLAN_COLORS[plans.length % PLAN_COLORS.length],
              selectedPos: [],
              selectedColors: []
            } as any;

            mockDb.saveStylePlan(newPlan);
            refreshData();
          }}
        />
      )}
    </div>
  );
};

const StyleListDroppable: React.FC<{ 
  orders: OrderPoolEntry[], 
  searchTerm: string, 
  setSearchTerm: (s: string) => void,
  onSplit: (order: OrderPoolEntry) => void,
  onClick: (order: OrderPoolEntry) => void,
  sortBy: 'shipDate' | 'buyer' | 'item',
  setSortBy: (s: 'shipDate' | 'buyer' | 'item') => void
}> = ({ orders, searchTerm, setSearchTerm, onSplit, onClick, sortBy, setSortBy }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'style-list',
  });

  return (
    <div 
      ref={setNodeRef}
      className={`w-72 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 transition-all duration-200 ${isOver ? 'bg-rose-50 ring-2 ring-rose-500 ring-inset' : ''}`}
    >
      <div className="p-4 border-b border-slate-200 bg-white space-y-3">
        {isOver ? (
          <div className="flex flex-col items-center justify-center py-4 text-rose-600 animate-pulse">
            <Trash2 size={24} className="mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">Drop here to remove plan</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Search styles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[9px] font-black text-blue-600 uppercase outline-none cursor-pointer"
              >
                <option value="shipDate">Ship Date</option>
                <option value="buyer">Buyer</option>
                <option value="item">Product</option>
              </select>
            </div>
          </>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ready to Plan ({orders.length})</h3>
        {orders.length === 0 ? (
          <div className="text-center py-10">
            <LayoutGrid size={32} className="mx-auto text-slate-200 mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase">No styles available</p>
          </div>
        ) : (
          orders.map(order => (
            <DraggableStyleCard key={order.id} order={order} onSplit={onSplit} onClick={onClick} />
          ))
        )}
      </div>
    </div>
  );
};

const StyleInfoModal: React.FC<{ 
  plan: StylePlan, 
  onClose: () => void,
  onUpdate: (id: string, updates: { qty: number, hours: number, eff: number }) => void,
  onCancel: (id: string) => void,
  canEdit: boolean,
  lines: LineMapping[],
  onPlanNow: (orderId: string, lineId: string, date: string, qty: number, hours: number, eff: number) => void
}> = ({ plan, onClose, onUpdate, onCancel, canEdit, lines, onPlanNow }) => {
  const [tempQty, setTempQty] = useState(plan.planQuantity.toString());
  const [workingHours, setWorkingHours] = useState(plan.workingHours || 10);
  const [efficiency, setEfficiency] = useState(plan.targetEff || 65);
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [costingData, setCostingData] = useState<any>(null);

  useEffect(() => {
    const data = mockDb.getLatestCosting(plan.buyer, plan.styleNumber);
    if (data) setCostingData(data);
  }, [plan.buyer, plan.styleNumber]);

  const isTemp = plan.id.startsWith('temp-');
  const manpower = isTemp ? (lines.find(l => l.lineId === selectedLine)?.layoutManpower || 40) : plan.manpower;

  // marketing average = (manpower * workingHours * 60 * efficiency) / smv
  const mktAverage = Math.floor((manpower * workingHours * 60 * (efficiency / 100)) / plan.smv);
  const mktAvgPerHour = Math.floor(mktAverage / workingHours);
  const requiredDays = Math.ceil(parseInt(tempQty) / mktAverage) || 0;

  const sewingSection = plan.sections?.Sewing;
  const startDate = isTemp ? selectedDate : sewingSection?.inputDate;
  const endDate = isTemp ? null : sewingSection?.outputDate;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col md:flex-row h-auto md:min-h-[550px]">
          {/* Image Section */}
          <div className="w-full md:w-2/5 bg-slate-100 relative h-64 md:h-auto">
            {costingData?.image ? (
              <img 
                src={costingData.image} 
                alt={plan.styleNumber}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-400 p-12 text-center">
                <LayoutGrid size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-black uppercase tracking-widest">{plan.productCategory || 'No Image Available'}</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">{plan.buyer}</span>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{plan.styleNumber}</h2>
              {plan.productCategory && (
                <span className="text-[10px] font-bold text-white/50 uppercase mt-2">{plan.productCategory}</span>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="w-full md:w-3/5 p-8 flex flex-col overflow-y-auto custom-scrollbar max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SO Number</p>
                <p className="text-lg font-black text-slate-900">{plan.soNumber}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {startDate && (
              <div className="flex gap-4 mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex-1">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Start Date</p>
                  <p className="text-sm font-black text-blue-900">{format(new Date(startDate), 'dd MMM yyyy')}</p>
                </div>
                {endDate && (
                  <>
                    <div className="w-px bg-blue-200 self-stretch"></div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">End Date</p>
                      <p className="text-sm font-black text-blue-900">{format(new Date(endDate), 'dd MMM yyyy')}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan Qty</p>
                <input 
                  type="number"
                  value={tempQty}
                  onChange={(e) => setTempQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Working Hours</p>
                <input 
                  type="number"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SMV</p>
                <p className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">{plan.smv}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency (%)</p>
                <input 
                  type="number"
                  value={efficiency}
                  onChange={(e) => setEfficiency(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Line Manpower</p>
                <p className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">{manpower} Persons</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mkt. Avg / Hr</p>
                <p className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">{mktAvgPerHour}</p>
              </div>
            </div>

            {isTemp && (
              <div className="grid grid-cols-2 gap-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Select Line</p>
                  <select 
                    value={selectedLine}
                    onChange={(e) => setSelectedLine(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  >
                    <option value="">Select Line...</option>
                    {lines.map(l => (
                      <option key={l.lineId} value={l.lineId}>{l.lineId}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="bg-slate-900 rounded-2xl p-6 text-white mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Required Days</span>
                <span className="text-2xl font-black">{requiredDays} Days</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (requiredDays / 30) * 100)}%` }} />
              </div>
              <p className="text-[9px] font-bold mt-2 opacity-40 uppercase">Based on {mktAverage} pcs daily target ({mktAvgPerHour} pcs/hr)</p>
            </div>

            {canEdit && (
              <div className="flex gap-3">
                {isTemp ? (
                  <button 
                    disabled={!selectedLine}
                    onClick={() => {
                      const orderId = plan.id.replace('temp-', '');
                      onPlanNow(orderId, selectedLine, selectedDate, parseInt(tempQty), workingHours, efficiency);
                      onClose();
                    }}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Plan Now
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        onUpdate(plan.id, { qty: parseInt(tempQty), hours: workingHours, eff: efficiency });
                        onClose();
                      }}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
                    >
                      Update Planning
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this plan and move it back to Ready to Plan?')) {
                          onCancel(plan.id);
                          onClose();
                        }
                      }}
                      className="px-6 bg-rose-50 text-rose-600 border border-rose-100 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-[0.98]"
                      title="Cancel Plan & Revert"
                    >
                      <CalendarOff size={20} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
