import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  Activity,
  ChevronRight,
  TrendingUp,
  Users
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { OrderPoolEntry, PreProductionTracker } from '../../types';

export const PlanningDashboard: React.FC = () => {
  const [orders, setOrders] = useState<OrderPoolEntry[]>([]);
  const [trackers, setTrackers] = useState<PreProductionTracker[]>([]);

  useEffect(() => {
    setOrders(mockDb.getOrderPoolEntries());
    setTrackers(mockDb.getPreProductionTrackers());
  }, []);

  const totalOrders = orders.length;
  const readyForPlan = orders.filter(o => o.isReadyForPlan).length;
  const blockedStyles = orders.filter(o => !o.isReadyForPlan).length;
  
  const delayedStages = trackers.reduce((acc, tracker) => {
    const delayed = Object.values(tracker.checklist).filter(stage => (stage.delayDays || 0) > 0).length;
    return acc + delayed;
  }, 0);

  const sampleIssues = trackers.reduce((acc, tracker) => {
    const issues = Object.values(tracker.checklist).filter(stage => stage.status === 'Failed' && stage.issueSource === 'Buyer').length;
    return acc + issues;
  }, 0);

  const fabricHold = trackers.reduce((acc, tracker) => {
    const hold = Object.values(tracker.checklist).filter(stage => stage.status === 'Hold' && stage.issueSource === 'Supplier').length;
    return acc + hold;
  }, 0);

  const stats = [
    { label: 'Total Orders', value: totalOrders, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Ready For Plan', value: readyForPlan, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Blocked Styles', value: blockedStyles, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pre-Prod Delay', value: delayedStages, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black uppercase tracking-tight">Planning Dashboard</h2>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
          <Activity size={12} className="text-emerald-500" />
          System Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</h3>
            <p className="text-3xl font-black mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Issues */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Critical Planning Issues</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-500" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Sample Approval Failures</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase">Requires immediate merchant follow-up</p>
                </div>
              </div>
              <span className="text-xl font-black text-red-600">{sampleIssues}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-amber-500" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Fabric Quality Hold</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase">Awaiting shrinkage/shade clearance</p>
                </div>
              </div>
              <span className="text-xl font-black text-amber-600">{fabricHold}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Ready Styles Awaiting Loading</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase">Styles cleared for sewing plan</p>
                </div>
              </div>
              <span className="text-xl font-black text-blue-600">{readyForPlan}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Quick Navigation</h3>
          <div className="space-y-3">
            <Link to="/planning/pool?view=import" className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <BarChart3 size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700">Import New Orders</span>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
            </Link>
            
            <Link to="/planning/pre-prod?view=delay" className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <Clock size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700">View Delayed Stages</span>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
            </Link>

            <Link to="/planning/loading?view=ready" className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700">Plan Ready Styles</span>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
            </Link>

            <Link to="/planning/live" className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-all">
                  <Activity size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700">Live Production</span>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
