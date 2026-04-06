import React, { useState, useMemo } from 'react';
import { mockDb } from '../services/mockDb';
import { DepartmentType, DailyTarget } from '../types';
import { Target, Calendar, Printer, ArrowLeft, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import ZoomWrapper from '../components/ZoomWrapper';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

// Explicitly define the shape of rows in the report to avoid unknown type issues
interface TargetReportRow extends DailyTarget {
  lastDayTarget: number;
  lastDayPdn: number;
  shortPlus: number;
  lastDayEff: number;
}

const DailyLineTargetReport: React.FC<{ department: DepartmentType }> = ({ department }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Added explicit type ExtendedDailyTarget[] to ensure correct property access in the table
  const targetData = useMemo<TargetReportRow[]>(() => {
    const todayTargets = mockDb.getDailyTargets(department).filter(t => t.date === selectedDate);
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayTargets = mockDb.getDailyTargets(department).filter(t => t.date === yesterdayStr);
    const allProd = mockDb.getProduction(department);

    return todayTargets.map((t: DailyTarget): TargetReportRow => {
      const yTarget = yesterdayTargets.find(yt => yt.lineId === t.lineId && yt.styleNumber === t.styleNumber);
      const yPdn = allProd
        .filter(p => p.date === yesterdayStr && p.lineId === t.lineId && p.styleCode === t.styleNumber)
        .reduce((s, r) => s + r.actual, 0);

      const shortPlus = yTarget ? (yPdn - yTarget.todayTargetPcs) : 0;
      const lastEff = yTarget && yTarget.todayTargetPcs > 0 ? Math.round((yPdn / yTarget.todayTargetPcs) * 100) : 0;

      return {
        ...t,
        lastDayTarget: yTarget?.todayTargetPcs || 0,
        lastDayPdn: yPdn,
        shortPlus,
        lastDayEff: lastEff
      };
    }).sort((a,b) => a.blockId.localeCompare(b.blockId) || a.lineId.localeCompare(b.lineId, undefined, {numeric: true}));
  }, [department, selectedDate]);

  const grandTotals = useMemo(() => {
    return targetData.reduce((acc, curr) => ({
      manpower: acc.manpower + curr.headCount,
      wip: acc.wip + curr.lineWip,
      todayTarget: acc.todayTarget + curr.todayTargetPcs,
      lastDayTarget: acc.lastDayTarget + curr.lastDayTarget,
      lastDayPdn: acc.lastDayPdn + curr.lastDayPdn,
      shortPlus: acc.shortPlus + curr.shortPlus
    }), { manpower: 0, wip: 0, todayTarget: 0, lastDayTarget: 0, lastDayPdn: 0, shortPlus: 0 });
  }, [targetData]);

  const blocks = useMemo(() => [...new Set(targetData.map(t => t.blockId))], [targetData]);

  return (
    <div className="bg-white min-h-screen p-8 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
      <style>{` @media print { @page { size: portrait; margin: 5mm; } body { background: white !important; } .no-print { display: none !important; } table { font-size: 8px !important; } .report-header { margin-bottom: 5px !important; } } .report-table th, .report-table td { border: 1px solid #000; padding: 2px 4px; vertical-align: middle; } .report-table th { background: #f3f4f6; font-size: 7px; font-weight: 900; text-transform: uppercase; text-align: center; } .report-table td { font-size: 9px; font-weight: 600; } `}</style>

      <div className="no-print flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/report`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Daily Line Target report</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-black outline-none" />
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg"><Printer size={16}/> Print Report</button>
        </div>
      </div>

      <ZoomWrapper referenceWidth={1200}>
        <div className="report-sheet text-black">
          <div className="text-center report-header mb-6">
           <h2 className="text-xl font-black uppercase leading-tight">Square Denims Limited(GU)</h2>
           <p className="text-[10px] font-bold uppercase">IT and Workstudy Dept.</p>
           <h3 className="text-lg font-black uppercase underline underline-offset-4 mt-2">Daily Line Target (Sewing)</h3>
           <div className="flex justify-between items-end mt-4 px-1">
              <p className="text-[9px] font-black uppercase">Target Date: <span className="font-bold ml-1">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
              <p className="text-[9px] font-black uppercase text-right">Production Date: <span className="font-bold ml-1">{new Date(new Date(selectedDate).getTime() - 86400000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
           </div>
        </div>

        <table className="report-table w-full border-collapse">
           <thead>
              <tr>
                 <th className="w-6">Block</th><th className="w-10">Line</th><th>Buyer</th><th>Style No</th><th>Product or Item</th><th className="w-10">SAM</th><th className="w-16">Output Start Date</th><th className="w-6">Day</th><th className="w-10">Act. SAM Earner</th><th className="w-10">Today Line WIP</th><th className="w-10">Today Working HR</th><th className="w-10 bg-slate-200">Today's Target</th><th className="w-10 bg-slate-200">Today's Eff %</th><th className="w-10">Last Day Working HR</th><th className="w-10">Last Day Target</th><th className="w-10">Last Day Pdn</th><th className="w-10">Short or Plus</th><th className="w-10">Last Day Eff.</th><th className="w-10">M&M Top Tgt/Hr</th><th className="w-10">Line Cap</th><th className="w-10">Today Tgt/Hr</th><th className="w-32">Remarks</th>
              </tr>
           </thead>
           <tbody>
              {blocks.map(blockId => {
                const blockRows = targetData.filter(t => t.blockId === blockId);
                const blockTotal = blockRows.reduce((acc, curr) => ({
                   mp: acc.mp + curr.headCount, wip: acc.wip + curr.lineWip, target: acc.target + curr.todayTargetPcs, lastTarget: acc.lastTarget + curr.lastDayTarget, lastPdn: acc.lastPdn + curr.lastDayPdn, short: acc.short + curr.shortPlus
                }), { mp: 0, wip: 0, target: 0, lastTarget: 0, lastPdn: 0, short: 0 });
                return (
                  <React.Fragment key={blockId}>
                    {blockRows.map((t, idx) => (
                      <tr key={t.id}>
                        {idx === 0 && <td rowSpan={blockRows.length} className="text-center font-black">{t.blockId.replace('Block-', '')}</td>}
                        <td className="text-center font-black">{t.lineId.replace('Line ', '')}</td>
                        <td className="text-[8px] uppercase">{t.buyer}</td><td className="text-[8px] font-black uppercase">{t.styleNumber}</td><td className="text-[8px] uppercase">{t.productItem}</td><td className="text-center">{t.sam.toFixed(2)}</td><td className="text-center text-[7px]">{t.outputStartDate}</td><td className="text-center">{t.daysRunning}</td><td className="text-center">{t.headCount}</td><td className="text-center">{t.lineWip}</td><td className="text-center">{t.workingHours}</td><td className="text-center font-black bg-slate-50">{t.todayTargetPcs}</td><td className="text-center font-black bg-slate-50">{t.targetEfficiency}%</td><td className="text-center">{t.workingHours}</td><td className="text-center">{t.lastDayTarget}</td><td className="text-center">{t.lastDayPdn}</td><td className={`text-center font-black ${t.shortPlus < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{t.shortPlus}</td><td className="text-center font-black">{t.lastDayEff}%</td><td className="text-center">{t.mmTopTgtHr}</td><td className="text-center">320</td><td className="text-center font-black text-indigo-700">{Math.round(t.todayTargetPcs / (t.workingHours || 1))}</td><td className="text-[7px] italic text-slate-400">{t.remarks}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black">
                       <td colSpan={8} className="text-right uppercase pr-4">Total</td><td className="text-center">{blockTotal.mp}</td><td className="text-center">{blockTotal.wip}</td><td className="text-center">--</td><td className="text-center">{blockTotal.target}</td><td className="text-center">--</td><td className="text-center">--</td><td className="text-center">{blockTotal.lastTarget}</td><td className="text-center">{blockTotal.lastPdn}</td><td className="text-center">{blockTotal.short}</td><td className="text-center">--</td><td colSpan={5}></td>
                    </tr>
                  </React.Fragment>
                );
              })}
              <tr className="bg-slate-900 text-white font-black h-10">
                 <td colSpan={8} className="text-right uppercase pr-4 text-xs italic tracking-widest">Factory Grand Total</td><td className="text-center">{grandTotals.manpower}</td><td className="text-center">{grandTotals.wip}</td><td className="text-center">--</td><td className="text-center text-base">{grandTotals.todayTarget}</td><td className="text-center">--</td><td className="text-center">--</td><td className="text-center">{grandTotals.lastDayTarget}</td><td className="text-center text-base">{grandTotals.lastDayPdn}</td><td className="text-center">{grandTotals.shortPlus}</td><td className="text-center">--</td><td colSpan={5}></td>
              </tr>
           </tbody>
        </table>

        <div className="mt-10 grid grid-cols-12 gap-1 px-1">
           <div className="col-span-3 border border-black p-2">
              <table className="w-full !border-none text-[8px] font-black uppercase">
                 <tbody>
                    <tr><td className="!border-none">Monthly Target</td><td className="!border-none text-right">1058650</td></tr>
                    <tr><td className="!border-none">Req. Avg Pdn/Day</td><td className="!border-none text-right">40717</td></tr>
                    <tr><td className="!border-none">Avg. Pdn/Day</td><td className="!border-none text-right">34883</td></tr>
                    <tr><td className="!border-none">Req. Avg Pdn/Line</td><td className="!border-none text-right">1313</td></tr>
                    <tr><td className="!border-none">Avg. Pdn/Line</td><td className="!border-none text-right">1125</td></tr>
                 </tbody>
              </table>
           </div>
           <div className="col-span-3 border border-black p-2 bg-slate-50">
              <h4 className="text-center text-[9px] font-black border-b border-black mb-1 pb-1">Up to Last Day</h4>
              <table className="w-full !border-none text-[8px] font-bold">
                 <tbody>
                    <tr><td className="!border-none uppercase">Days Run</td><td className="!border-none text-right">17 Days</td></tr>
                    <tr><td className="!border-none uppercase">Plan Target</td><td className="!border-none text-right">659550</td></tr>
                    <tr><td className="!border-none uppercase">IE Target</td><td className="!border-none text-right">659828</td></tr>
                    <tr><td className="!border-none uppercase">Achieve</td><td className="!border-none text-right">593012</td></tr>
                    <tr><td className="!border-none uppercase">Loss/Plan</td><td className="!border-none text-right text-rose-600">-66538</td></tr>
                 </tbody>
              </table>
           </div>
           <div className="col-span-3 flex flex-col gap-2">
              <div className="border border-black p-2 bg-indigo-50 flex flex-col items-center"><p className="text-[8px] font-black uppercase">Today IE Target</p><p className="text-base font-black">44960</p></div>
              <div className="border border-black p-2 bg-amber-50 flex flex-col items-center"><p className="text-[8px] font-black uppercase">Today Plan Target</p><p className="text-base font-black">44200</p></div>
           </div>
           <div className="col-span-3 border border-black p-4 bg-slate-900 text-white flex flex-col items-center justify-center"><p className="text-xs font-black uppercase tracking-widest mb-1">G. Total Production</p><p className="text-4xl font-black">593012</p></div>
        </div>
      </div>
      </ZoomWrapper>
    </div>
  );
};

export default DailyLineTargetReport;