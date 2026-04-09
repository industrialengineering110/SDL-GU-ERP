import React, { useState, useEffect } from 'react';
import { FileBarChart, Package, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { WIPRecord } from '../types';

const WashingProductionReport = () => {
  const [wipData, setWipData] = useState<WIPRecord[]>([]);

  useEffect(() => {
    const data = mockDb.getWIP('Washing');
    setWipData(data);
  }, []);

  const totalInput = wipData.reduce((sum, item) => sum + item.inputQty, 0);
  const totalOutput = wipData.reduce((sum, item) => sum + item.outputQty, 0);
  const currentWip = totalInput - totalOutput;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Washing Production Report</h1>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <Clock size={14} /> Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Input</span>
            <TrendingUp size={18} className="text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalInput}</div>
          <p className="text-[10px] text-slate-400 mt-1">Total pieces received in Washing</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Output</span>
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalOutput}</div>
          <p className="text-[10px] text-slate-400 mt-1">Total pieces processed and sent out</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current WIP</span>
            <AlertCircle size={18} className="text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{currentWip}</div>
          <p className="text-[10px] text-slate-400 mt-1">Pieces currently in Washing floor</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Efficiency</span>
            <FileBarChart size={18} className="text-purple-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {totalInput > 0 ? Math.round((totalOutput / totalInput) * 100) : 0}%
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Output vs Input ratio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Process Wise Production */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Process Wise Production</h3>
            <FileBarChart className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {[
              { name: 'Wet Process', count: Math.round(totalInput * 0.6), color: 'bg-blue-500' },
              { name: 'Dry Process', count: Math.round(totalInput * 0.3), color: 'bg-indigo-500' },
              { name: 'Finishing', count: Math.round(totalInput * 0.1), color: 'bg-purple-500' },
            ].map(process => (
              <div key={process.name} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>{process.name}</span>
                  <span>{process.count} pcs</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${process.color}`} 
                    style={{ width: totalInput > 0 ? `${(process.count / totalInput) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Production Handover */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Production Handover</h3>
            <Package className="h-5 w-5 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-3">Buyer / Style</th>
                  <th className="pb-3">Color</th>
                  <th className="pb-3 text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {wipData.length === 0 ? (
                  <tr><td colSpan={3} className="py-8 text-center text-slate-400 italic">No handover records found</td></tr>
                ) : wipData.slice(0, 5).map(item => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{item.buyer}</div>
                      <div className="text-slate-500">{item.styleNumber}</div>
                    </td>
                    <td className="py-3 text-slate-600">{item.color}</td>
                    <td className="py-3 text-right font-bold text-slate-900">{item.inputQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WashingProductionReport;
