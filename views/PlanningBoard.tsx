import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, CheckCircle2, AlertCircle, Clock, Tag, User, Factory, 
  ArrowRight, TrendingUp, Info, Bell, Activity, Target, Boxes, Ship, AlertTriangle, RefreshCcw, LayoutList, Scissors, Shirt, Sparkle, Truck, Layers, ArrowLeft
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { DepartmentType, StylePlan, AppUser, ProductionRecord, AppNotification } from '../types';

interface PlanningBoardProps {
  department: DepartmentType;
  currentUser: AppUser;
}

const PlanningBoard: React.FC<PlanningBoardProps> = ({ department, currentUser }) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StylePlan[]>([]);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  const refreshData = () => {
    setPlans(mockDb.getStylePlans());
    setProduction(mockDb.getProduction(department));
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 60000); // Live update every minute
    return () => clearInterval(interval);
  }, [department]);

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
        const sectionContext = p.sections[department as keyof typeof p.sections];
        return sectionContext && (sectionContext.inputDate || sectionContext.status !== 'PENDING');
    });
  }, [plans, department]);

  const getActualTotal = (so: string, style: string) => {
    return production
      .filter(p => p.soNumber === so && p.styleCode === style)
      .reduce((sum, p) => sum + p.actual, 0);
  };

  // Automated notification generator logic
  useEffect(() => {
    if (filteredPlans.length === 0) return;

    filteredPlans.forEach(p => {
        const actual = getActualTotal(p.soNumber, p.styleNumber);
        const daysToShip = Math.ceil((new Date(p.shipmentDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        
        let alertMsg = "";
        let alertType: 'ALERT' | 'INFO' = 'INFO';

        // Fix: accessing requiredPcsPerDay from the department-specific section object
        const sectionTarget = p.sections[department]?.requiredPcsPerDay || 0;

        if (actual < sectionTarget * 0.7 && p.status === 'ACTIVE') {
            alertMsg = `PRODUCTION LAG: Line ${p.lineId} is significantly behind daily plan for Style ${p.styleNumber}.`;
            alertType = 'ALERT';
        } else if (daysToShip >= 0 && daysToShip < 5 && actual < sectionTarget) {
            alertMsg = `SHIPMENT TIGHT: Style ${p.styleNumber} ships in ${daysToShip} days. Capacity critical.`;
            alertType = 'ALERT';
        } else if (p.fabricStatus === 'SHORTAGE' || p.accessoriesStatus === 'SHORTAGE') {
            alertMsg = `MATERIAL ALERT: Resource shortage for SO #${p.soNumber}. Monitor flow closely.`;
            alertType = 'ALERT';
        }

        if (alertMsg) {
            const existing = mockDb.getNotifications().find(n => n.message === alertMsg && n.toDepartment === department);
            if (!existing) {
                const notif: AppNotification = {
                    id: Date.now().toString() + Math.random(),
                    timestamp: new Date().toISOString(),
                    from: "Planning Monitor",
                    toDepartment: department,
                    message: alertMsg,
                    readBy: [],
                    type: alertType
                };
                mockDb.saveNotification(notif);
            }
        }
    });
  }, [filteredPlans, production, department]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/report`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
            <LayoutList size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">{department} Planning Monitor</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                <RefreshCcw size={16} className="text-blue-500 animate-spin-slow" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Status: {lastRefreshed}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 px-6">
                <Calendar size={18} className="text-slate-400" />
                <span className="text-xs font-black text-slate-900">{new Date().toLocaleDateString()}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredPlans.map(p => {
          const actual = getActualTotal(p.soNumber, p.styleNumber);
          const sectionMeta = p.sections[department as keyof typeof p.sections];
          // Fix: accessing requiredPcsPerDay from the section meta instead of root StylePlan
          const sectionTarget = sectionMeta?.requiredPcsPerDay || 0;
          const progress = Math.min((actual / (sectionTarget || 1)) * 100, 100);
          const isLagging = actual < sectionTarget * 0.85;

          return (
            <div key={p.id} className={`bg-white p-8 rounded-[3.5rem] border-2 shadow-sm transition-all group relative overflow-hidden ${isLagging ? 'border-rose-100 hover:shadow-rose-100' : 'border-slate-100 hover:shadow-indigo-100'} hover:shadow-2xl hover:-translate-y-1`}>
                {isLagging && <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500"></div>}
                
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isLagging ? 'bg-rose-100 text-rose-600' : 'bg-indigo-600 text-white shadow-lg'}`}>
                            {p.lineId}
                        </span>
                        <h3 className="text-2xl font-black text-slate-900 mt-4">#{p.soNumber}</h3>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] font-black text-slate-400 uppercase">{p.buyer}</span>
                           <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                           <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{p.styleNumber}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Eff.</p>
                        <p className={`text-2xl font-black ${p.targetEff >= 85 ? 'text-emerald-500' : 'text-amber-500'}`}>{p.targetEff.toFixed(1)}%</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Target size={12}/> 10H Plan</p>
                            {/* Fix: accessing requiredPcsPerDay from the department section */}
                            <p className="text-2xl font-black text-slate-900">{sectionTarget.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Daily Target</p>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Activity size={12}/> Output</p>
                            <p className={`text-2xl font-black ${isLagging ? 'text-rose-600' : 'text-emerald-600'}`}>{actual.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Actual PCS</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Completion</p>
                            <p className={`text-sm font-black ${isLagging ? 'text-rose-600' : 'text-slate-900'}`}>{progress.toFixed(1)}%</p>
                        </div>
                        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className={`h-full transition-all duration-1000 shadow-sm ${isLagging ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 border-t border-slate-50 pt-8">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Material</p>
                            <div className="flex gap-2">
                                <div title="Fabric" className={`p-2.5 rounded-xl border-2 ${p.fabricStatus === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}><Scissors size={14}/></div>
                                <div title="Print/EMB" className={`p-2.5 rounded-xl border-2 ${p.printEmbStatus === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}><Sparkle size={14}/></div>
                                <div title="Accessories" className={`p-2.5 rounded-xl border-2 ${p.accessoriesStatus === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}><Boxes size={14}/></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Section Milestones</p>
                            <p className="text-xs font-black text-slate-700 uppercase">IN: {sectionMeta?.inputDate || '--'}</p>
                            <p className="text-xs font-black text-indigo-600 uppercase">OUT: {sectionMeta?.outputDate || '--'}</p>
                        </div>
                    </div>
                </div>

                {isLagging && (
                   <div className="mt-8 p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3 animate-pulse">
                      <AlertTriangle size={18} className="text-rose-600" />
                      <p className="text-[10px] font-black text-rose-900 uppercase">Production Lag detected</p>
                   </div>
                )}
            </div>
          );
        })}
        
        {filteredPlans.length === 0 && (
          <div className="col-span-full py-48 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner">
             <Layers size={64} className="mx-auto text-slate-100 mb-6" />
             <p className="text-xl font-black text-slate-400 mb-2">No Active Order Plans for {department}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningBoard;
