import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Database, ClipboardList, Activity, TrendingUp, Package, Clock, CheckCircle2, AlertCircle, AlertTriangle, Filter, PauseCircle, Users, BarChart3, Layers } from 'lucide-react';
import { OrderPool } from './OrderPool';
import { PreProductionTracker } from './PreProductionTracker';
import { LineLoading } from './LineLoading';
import { LiveProduction } from './LiveProduction';
import { PlanningOwnership } from './PlanningOwnership';
import { MonthlyPlanStatus } from './MonthlyPlanStatus';
import { CoordinationWall } from './CoordinationWall';
import { RevisionHistory } from './RevisionHistory';
import { ReadyForPlan } from './ReadyForPlan';
import { mockDb } from '../../services/mockDb';
import { OrderPoolEntry, StylePlan, PreProductionTracker as TrackerType } from '../../types';

type TabType = 'dashboard' | 'order-pool' | 'pre-production' | 'line-loading' | 'live-production' | 'planning-ownership' | 'monthly-plan-status' | 'coordination-wall' | 'revision-history' | 'ready-for-plan';

export const PlanningHub = () => {
  const { tabId } = useParams<{ tabId: string }>();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  const activeTab = (tabId as TabType) || 'dashboard';

  const stats = useMemo(() => {
    const allOrders = mockDb.getOrderPoolEntries() as OrderPoolEntry[];
    const allPlans = mockDb.getStylePlans() as StylePlan[];
    const trackers = mockDb.getPreProductionTrackers() as TrackerType[];

    const monthOrders = allOrders.filter(o => {
      if (!o.shipDate) return false;
      return new Date(o.shipDate).getMonth() === selectedMonth;
    });

    const monthTrackers = trackers.filter(t => {
      const order = allOrders.find(o => o.id === t.orderId);
      if (!order || !order.shipDate) return false;
      return new Date(order.shipDate).getMonth() === selectedMonth;
    });

    const monthPlans = allPlans.filter(p => {
      return p.sections?.Sewing?.inputDate && new Date(p.sections.Sewing.inputDate).getMonth() === selectedMonth;
    });

    return {
      totalOrders: monthOrders.length,
      preProdDelay: monthOrders.filter(o => o.preProductionStatus === 'Pending' || o.preProductionStatus === 'In Progress').length,
      readyForPlan: monthOrders.filter(o => o.isReadyForPlan).length,
      blockedStyles: monthOrders.filter(o => !o.isReadyForPlan && o.blockerReason).length,
      sampleIssues: monthTrackers.filter(t => {
        const sampleStage = t.checklist?.['Sample Approval'];
        return sampleStage?.status === 'Pending' || sampleStage?.status === 'Failed';
      }).length,
      shrinkageIssues: monthTrackers.filter(t => t.checklist?.['Fabric Shrinkage']?.status === 'Pending').length,
      fabricHold: monthTrackers.filter(t => t.checklist?.['Fabric Inhouse']?.status === 'Hold').length,
      washingHold: monthTrackers.filter(t => t.checklist?.['Washing Approval']?.status === 'Hold').length,
      recentOrders: monthOrders.slice(0, 3),
      activeLines: Array.from(new Set(monthPlans.map(p => p.lineId))) as string[]
    };
  }, [selectedMonth]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'order-pool', label: 'Order Pool', icon: Database },
    { id: 'pre-production', label: 'Pre-Production', icon: ClipboardList },
    { id: 'ready-for-plan', label: 'Ready for Plan', icon: CheckCircle2 },
    { id: 'line-loading', label: 'Line Loading', icon: TrendingUp },
    { id: 'live-production', label: 'Live Production', icon: Activity },
    { id: 'coordination-wall', label: 'Coordination Wall', icon: Layers },
    { id: 'monthly-plan-status', label: 'Monthly Plan Status', icon: BarChart3 },
    { id: 'planning-ownership', label: 'Planning Ownership', icon: Users },
    { id: 'revision-history', label: 'Revision History', icon: Clock },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'order-pool':
        return <OrderPool view={view} selectedMonth={selectedMonth} />;
      case 'pre-production':
        return <PreProductionTracker view={view} selectedMonth={selectedMonth} />;
      case 'line-loading':
        return <LineLoading view={view} selectedMonth={selectedMonth} />;
      case 'live-production':
        return <LiveProduction view={view} selectedMonth={selectedMonth} />;
      case 'monthly-plan-status':
        return <MonthlyPlanStatus selectedMonth={selectedMonth} />;
      case 'planning-ownership':
        return <PlanningOwnership />;
      case 'coordination-wall':
        return <CoordinationWall />;
      case 'revision-history':
        return <RevisionHistory />;
      case 'ready-for-plan':
        return <ReadyForPlan />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`bg-white p-6 rounded-2xl border transition-all ${view === 'orders' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Package size={20} />
                  </div>
                  <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">Active</span>
                </div>
                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Total Orders</h3>
                <p className="text-2xl font-black">{stats.totalOrders.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-2">↑ 12% from last month</p>
              </div>

              <div className={`bg-white p-6 rounded-2xl border transition-all ${view === 'delay' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                    <Clock size={20} />
                  </div>
                  <span className="text-[10px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-1 rounded">Delay</span>
                </div>
                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Pre-Prod Delay</h3>
                <p className="text-2xl font-black">{stats.preProdDelay} Styles</p>
                <p className="text-[10px] text-red-400 mt-2">Critical: {Math.ceil(stats.preProdDelay * 0.3)} Styles</p>
              </div>

              <div className={`bg-white p-6 rounded-2xl border transition-all ${view === 'ready' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded">Ready</span>
                </div>
                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Ready For Plan</h3>
                <p className="text-2xl font-black">{stats.readyForPlan} Styles</p>
                <p className="text-[10px] text-emerald-500 mt-2">{stats.totalOrders > 0 ? Math.round((stats.readyForPlan / stats.totalOrders) * 100) : 0}% of total styles</p>
              </div>

              <div className={`bg-white p-6 rounded-2xl border transition-all ${view === 'blocked' ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-red-50 rounded-lg text-red-600">
                    <AlertCircle size={20} />
                  </div>
                  <span className="text-[10px] font-black text-red-600 uppercase bg-red-50 px-2 py-1 rounded">Blocked</span>
                </div>
                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Blocked Styles</h3>
                <p className="text-2xl font-black">{stats.blockedStyles} Styles</p>
                <p className="text-[10px] text-red-400 mt-2">Action required</p>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`bg-white p-4 rounded-xl border transition-all ${view === 'sample' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-100 shadow-sm'} flex items-center gap-4`}>
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase">Sample Issues</h4>
                  <p className="text-lg font-black">{stats.sampleIssues} Styles</p>
                </div>
              </div>
              <div className={`bg-white p-4 rounded-xl border transition-all ${view === 'shrinkage' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100 shadow-sm'} flex items-center gap-4`}>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Filter size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase">Shrinkage/Shade</h4>
                  <p className="text-lg font-black">{stats.shrinkageIssues} Styles</p>
                </div>
              </div>
              <div className={`bg-white p-4 rounded-xl border transition-all ${view === 'fabric' ? 'border-purple-500 ring-2 ring-purple-100' : 'border-slate-100 shadow-sm'} flex items-center gap-4`}>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                  <PauseCircle size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase">Fabric Hold</h4>
                  <p className="text-lg font-black">{stats.fabricHold} Styles</p>
                </div>
              </div>
              <div className={`bg-white p-4 rounded-xl border transition-all ${view === 'washing' ? 'border-slate-500 ring-2 ring-slate-100' : 'border-slate-100 shadow-sm'} flex items-center gap-4`}>
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase">Washing Hold</h4>
                  <p className="text-lg font-black">{stats.washingHold} Style</p>
                </div>
              </div>
            </div>

            {/* Recent Activity or Quick View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-tight mb-4">Recent Order Pool</h3>
                <div className="space-y-4">
                  {stats.recentOrders.length > 0 ? stats.recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold">{order.soNo}</p>
                        <p className="text-[10px] text-slate-500">Buyer: {order.buyer} | Style: {order.style}</p>
                      </div>
                      <span className="text-[10px] font-black text-blue-600 uppercase">New</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">No recent orders for this month</p>
                  )}
                </div>
                <a 
                  href="#/planning/order-pool"
                  className="w-full mt-4 text-xs font-black text-blue-600 uppercase hover:underline block text-center"
                >
                  View All Orders
                </a>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-blue-600" />
                  Live Production Pipeline
                </h3>
                <div className="space-y-6">
                  {stats.activeLines.length > 0 ? stats.activeLines.map((lineId: string) => {
                    const linePlans = (mockDb.getStylePlans() as StylePlan[]).filter(p => p.lineId === lineId && p.sections?.Sewing?.inputDate && new Date(p.sections.Sewing.inputDate).getMonth() === selectedMonth);
                    const totalPlan = linePlans.reduce((acc, curr) => acc + curr.planQuantity, 0);
                    
                    return (
                      <div key={lineId} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                          <span>{lineId}</span>
                          <span className="text-slate-400">Total Plan: {totalPlan.toLocaleString()}</span>
                        </div>
                        <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
                          {linePlans.map((plan, idx) => {
                            const width = (plan.planQuantity / totalPlan) * 100;
                            return (
                              <div 
                                key={plan.id} 
                                className={`h-full ${plan.color} flex items-center px-2 border-r border-white/20 shadow-sm`}
                                style={{ width: `${width}%` }}
                              >
                                <span className="text-[8px] font-black text-white truncate">{plan.styleNumber}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">No active production for this month</p>
                  )}
                </div>
                <a 
                  href="#/planning/live-production"
                  className="w-full mt-6 text-xs font-black text-blue-600 uppercase hover:underline block text-center"
                >
                  View Live Production
                </a>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">Planning Hub</h1>
            <p className="text-slate-500 text-xs md:text-sm">Centralized production planning and tracking system</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-full md:w-auto">
            <select 
              className="px-3 py-2 text-[10px] md:text-xs font-black uppercase bg-transparent focus:outline-none w-full md:w-auto"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-fit">
          {tabs.map(tab => (
            <a
              key={tab.id}
              href={`#/planning/${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </a>
          ))}
        </div>

        {/* Main Content Area */}
        <main className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
