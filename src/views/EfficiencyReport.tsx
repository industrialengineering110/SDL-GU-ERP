
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Calendar, Clock, Printer, RefreshCcw, Info, ArrowLeft,
  Maximize2, Minimize2, RotateCcw
} from 'lucide-react';
import ZoomWrapper from '../components/ZoomWrapper';
import { mockDb } from '../services/mockDb';
import { DepartmentType, DailyTarget } from '../types';

interface ReportLine extends DailyTarget {
  targetPerHr: number;
  hourlyActuals: Record<number, number>;
  totalActual: number;
  totalGap: number;
  efficiency: number;
}

interface ReportBlock {
  blockId: string;
  lines: ReportLine[];
}

const EfficiencyReport: React.FC<{ department: DepartmentType }> = ({ department }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const reportData = useMemo<ReportBlock[]>(() => {
    const dailyTargets = mockDb.getDailyTargets(department).filter(t => t.date === selectedDate) as DailyTarget[];
    const production = mockDb.getProduction(department).filter(p => p.date === selectedDate);
    const blocks = Array.from(new Set(dailyTargets.map(t => t.blockId))).sort() as string[];

    return blocks.map(blockId => {
      const blockTargets = dailyTargets.filter(t => t.blockId === blockId);
      const lineDetails = blockTargets.map((target: DailyTarget): ReportLine => {
        const lineProd = production.filter(p => p.lineId === target.lineId && p.styleCode === target.styleNumber);
        const targetPerHr = target.workingHours > 0 ? Math.round(target.todayTargetPcs / target.workingHours) : 0;
        const hourlyActuals: Record<number, number> = {};
        let totalActual = 0;
        
        for (let h = 8; h <= 17; h++) {
          const actual = lineProd.filter(p => p.hour === h).reduce((s, r) => s + r.actual, 0);
          const displayHour = h - 7;
          hourlyActuals[displayHour] = actual;
          totalActual += actual;
        }

        const totalTarget = target.todayTargetPcs;
        return {
          ...target,
          targetPerHr,
          hourlyActuals,
          totalActual,
          totalGap: totalActual - totalTarget,
          efficiency: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0
        };
      }).sort((a, b) => a.lineId.localeCompare(b.lineId, undefined, { numeric: true }));

      return { blockId, lines: lineDetails };
    });
  }, [department, selectedDate]);

  const grandTotals = useMemo(() => {
    let target = 0;
    let actual = 0;
    reportData.forEach(b => {
      b.lines.forEach(l => {
        target += l.todayTargetPcs;
        actual += l.totalActual;
      });
    });
    return { target, actual, gap: actual - target, eff: target > 0 ? (actual / target) * 100 : 0 };
  }, [reportData]);

  return (
    <div className="space-y-8 pb-20 max-w-[1850px] mx-auto animate-in fade-in duration-500 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/report`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
            <Clock size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Hourly Monitoring Sheet</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Calendar size={18} className="text-slate-400 ml-2" />
            <input type="date" className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 p-0" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all flex items-center gap-2"><Printer size={16}/> Print Sheet</button>
        </div>
      </div>

      <ZoomWrapper referenceWidth={1800}>
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[1800px] text-center">
          <thead>
            <tr className="bg-slate-900 text-white h-20">
              <th className="w-16 border-r border-white/10 p-2 font-black uppercase tracking-widest text-[10px]">Block</th>
              <th className="w-16 border-r border-white/10 p-2 font-black uppercase tracking-widest text-[10px]">Line</th>
              <th className="w-48 border-r border-white/10 p-2 font-black uppercase tracking-widest text-[10px] text-left">Style Detail</th>
              <th className="w-20 border-r border-white/10 p-2 font-black uppercase tracking-widest text-[10px] bg-slate-800 text-amber-400">Tgt/Hr</th>
              {[...Array(10)].map((_, i) => (<th key={i} className="w-20 border-r border-white/10 p-2 font-black uppercase tracking-widest text-[10px]">H{i+1}</th>))}
              <th className="w-24 border-r border-white/10 p-2 font-black uppercase tracking-widest text-[10px] bg-emerald-900/40">Total Act.</th>
              <th className="w-24 border-r border-white/10 p-2 font-black uppercase tracking-widest text-[10px] bg-indigo-900/40">Total Tgt</th>
              <th className="w-24 border-r border-white/10 p-2 font-black uppercase tracking-widest text-[10px] bg-slate-800">Gap</th>
              <th className="w-20 p-2 font-black uppercase tracking-widest text-[10px]">Eff%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportData.map((block) => (
              <React.Fragment key={block.blockId}>
                {block.lines.map((line, idx) => (
                  <tr key={line.lineId} className="h-16 hover:bg-indigo-50 transition-colors group">
                    {idx === 0 && (<td rowSpan={block.lines.length} className="bg-slate-100 border-r border-slate-200 font-black text-slate-400 text-sm uppercase tracking-tighter"><div className="rotate-180 [writing-mode:vertical-lr] whitespace-nowrap py-4">{block.blockId}</div></td>)}
                    <td className="border-r border-slate-200 font-black text-lg text-indigo-600 bg-slate-50/50 group-hover:bg-indigo-100">{line.lineId.split(' ')[1]}</td>
                    <td className="border-r border-slate-200 px-4 text-left"><p className="text-[10px] font-black text-slate-900 uppercase truncate leading-none mb-1">{line.buyer}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate leading-none">{line.styleNumber}</p></td>
                    <td className="border-r border-slate-200 font-black text-base bg-amber-50 text-amber-900">{line.targetPerHr}</td>
                    {[...Array(10)].map((_, i) => {
                      const val = (line.hourlyActuals as Record<number, number>)[i+1] || 0;
                      return (<td key={i} className={`border-r border-slate-100 font-black text-sm ${val === 0 ? 'text-slate-200' : (val < line.targetPerHr * 0.8 ? 'text-rose-500' : 'text-slate-900')}`}>{val || '--'}</td>);
                    })}
                    <td className="border-r border-slate-200 font-[1000] text-lg bg-emerald-50 text-emerald-900">{line.totalActual}</td>
                    <td className="border-r border-slate-200 font-black text-base bg-indigo-50 text-indigo-900">{line.todayTargetPcs}</td>
                    <td className={`border-r border-slate-200 font-[1000] text-base ${line.totalGap >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-50 text-rose-600'}`}>{line.totalGap > 0 ? '+' : ''}{line.totalGap}</td>
                    <td className="font-black text-xs"><span className={`px-2 py-1 rounded-lg border ${line.efficiency >= 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{line.efficiency.toFixed(0)}%</span></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr className="bg-slate-900 text-white h-20 font-[1000] shadow-2xl">
               <td colSpan={3} className="text-right px-10 uppercase tracking-[0.4em] italic text-sm">Grand Total Summary</td>
               <td className="bg-amber-600">{reportData.reduce((s, b) => s + b.lines.reduce((sl, l) => sl + l.targetPerHr, 0), 0)}</td>
               {[...Array(10)].map((_, i) => (<td key={i} className="border-r border-white/5 text-lg">{reportData.reduce((s, b) => s + b.lines.reduce((sl, l) => sl + (l.hourlyActuals[i+1] || 0), 0), 0)}</td>))}
               <td className="bg-emerald-600 text-2xl">{grandTotals.actual.toLocaleString()}</td>
               <td className="bg-indigo-600 text-2xl">{grandTotals.target.toLocaleString()}</td>
               <td className={`text-2xl ${grandTotals.gap >= 0 ? 'bg-blue-600' : 'bg-rose-600'}`}>{grandTotals.gap.toLocaleString()}</td>
               <td className="bg-slate-800 text-lg">{grandTotals.eff.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      </ZoomWrapper>
    </div>
  );
};

export default EfficiencyReport;
