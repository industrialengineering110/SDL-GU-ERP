import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  CheckCircle2, 
  Boxes, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Search,
  Filter,
  Download,
  BarChart3,
  Layers
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';

const ProductionFlowChart: React.FC<{ data: any }> = ({ data }) => {
  const { planQty, cuttingQty, sewingQty, washQty, finishingQty, style, lineId } = data;
  
  const stages = [
    { label: 'Plan', value: planQty, color: 'bg-blue-600', textColor: 'text-white', zIndex: 10 },
    { label: 'Cut', value: cuttingQty, color: 'bg-emerald-500', textColor: 'text-white', zIndex: 20 },
    { label: 'Sew', value: sewingQty, color: 'bg-yellow-400', textColor: 'text-slate-900', zIndex: 30 },
    { label: 'Wash', value: washQty, color: 'bg-orange-500', textColor: 'text-white', zIndex: 40 },
    { label: 'F', value: finishingQty, color: 'bg-slate-400', textColor: 'text-white', zIndex: 50 },
  ];

  // Sort stages by value descending so they stack correctly (largest at back)
  // But the user image shows them overlapping from the same start point.
  // We'll use absolute positioning and widths based on percentage of planQty.
  
  return (
    <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{lineId} - {style}</span>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Total Plan: {planQty.toLocaleString()}</span>
      </div>
      
      <div className="relative h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shadow-inner">
        {stages.map((stage, idx) => {
          const widthPercent = (stage.value / planQty) * 100;
          return (
            <div 
              key={idx}
              className={`absolute top-0 left-0 h-full ${stage.color} ${stage.textColor} flex items-center px-3 transition-all duration-500 ease-out border-r border-white/20 shadow-[2px_0_10px_rgba(0,0,0,0.1)]`}
              style={{ 
                width: `${widthPercent}%`, 
                zIndex: stage.zIndex,
              }}
            >
              <span className="text-[9px] font-black whitespace-nowrap overflow-hidden text-ellipsis">
                {stage.label}-{stage.value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LiveProduction: React.FC<{ view?: string | null, selectedMonth: number }> = ({ view, selectedMonth }) => {
  const [productionData, setProductionData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const data = mockDb.getLiveProductionData();
    setProductionData(data);
  }, []);

  const filteredData = productionData.filter(item => {
    // Search filter
    const matchesSearch = item.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lineId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Month filter (using plan date or ship date if available in mock data)
    // For now, we'll assume the data has a timestamp or we'll just mock it
    // In a real app, production data would be linked to a plan which has a date
    const plan = mockDb.getStylePlans().find(p => p.styleNumber === item.style && p.lineId === item.lineId);
    if (plan) {
      const planMonth = new Date(plan.sections.Sewing.inputDate).getMonth();
      if (planMonth !== selectedMonth) return false;
    }

    return true;
  });

  const totalOrderQty = productionData.reduce((acc, curr) => acc + curr.orderQty, 0);
  const totalPlanQty = productionData.reduce((acc, curr) => acc + curr.planQty, 0);
  const totalSewingQty = productionData.reduce((acc, curr) => acc + curr.sewingQty, 0);

  const stats = [
    { label: 'Total Order Qty', value: totalOrderQty.toLocaleString(), icon: Boxes, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Plan Qty', value: totalPlanQty.toLocaleString(), icon: Rocket, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Sewing Output', value: totalSewingQty.toLocaleString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Live Production Dashboard</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Real-time factory floor metrics across all lines</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Live Updates
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</h3>
            <p className="text-3xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Detailed Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            Line-wise Production Details
          </h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Search line, buyer, style..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Line</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Style</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Order Qty</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Plan Qty</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cut Qty</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cut %</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cut WIP</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sew Qty</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sew WIP</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Wash Qty</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Wash WIP</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Fin Qty</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Fin WIP</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Pack Qty</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Rejects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded">{row.lineId}</span>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">{row.buyer}</td>
                  <td className="px-4 py-4 text-xs font-black text-slate-900 uppercase">{row.style}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-600 text-right">{row.orderQty.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs font-bold text-blue-600 text-right">{row.planQty.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-900 text-right">{row.cuttingQty.toLocaleString()}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${row.cuttingPercent}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600">{row.cuttingPercent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-amber-600 text-right">{row.cuttingWip.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs font-black text-slate-900 text-right">{row.sewingQty.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs font-bold text-amber-600 text-right">{row.sewingWip.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-600 text-right">{row.washQty.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs font-bold text-amber-600 text-right">{row.washWip.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-600 text-right">{row.finishingQty.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs font-bold text-amber-600 text-right">{row.finishingWip.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs font-black text-emerald-600 text-right">{row.packQty.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs font-bold text-rose-500 text-right">{row.rejects.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Activity size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-black uppercase tracking-widest">No matching production data found</p>
          </div>
        )}
      </div>

      {/* Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              Niche Production Flow Visualization
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-[8px] font-black uppercase text-slate-400">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div> Plan
              </div>
              <div className="flex items-center gap-1 text-[8px] font-black uppercase text-slate-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Cut
              </div>
              <div className="flex items-center gap-1 text-[8px] font-black uppercase text-slate-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div> Sew
              </div>
              <div className="flex items-center gap-1 text-[8px] font-black uppercase text-slate-400">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div> Wash
              </div>
              <div className="flex items-center gap-1 text-[8px] font-black uppercase text-slate-400">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div> Fin
              </div>
            </div>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredData.length > 0 ? (
              filteredData.map((line, idx) => (
                <ProductionFlowChart key={idx} data={line} />
              ))
            ) : (
              <div className="py-10 text-center text-slate-400 text-xs font-bold uppercase">
                No data to visualize
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-tight mb-6">WIP Summary</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Total Sewing WIP</p>
              <p className="text-2xl font-black">{productionData.reduce((acc, curr) => acc + curr.sewingWip, 0).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Total Wash WIP</p>
              <p className="text-2xl font-black">{productionData.reduce((acc, curr) => acc + curr.washWip, 0).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Total Finishing WIP</p>
              <p className="text-2xl font-black">{productionData.reduce((acc, curr) => acc + curr.finishingWip, 0).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Total Rejects</p>
              <p className="text-2xl font-black text-rose-400">{productionData.reduce((acc, curr) => acc + curr.rejects, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
