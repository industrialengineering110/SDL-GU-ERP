
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Calendar, MousePointer2, Info, ArrowLeft
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { DepartmentType, AppUser } from '../types';
import Logo from '../components/Logo';

interface SectionReportQualityProps {
  department: DepartmentType;
  currentUser: AppUser;
}

const SummaryBox = ({ label, daily, monthly, unit = '%' }: { label: string, daily: string | number, monthly: string | number, unit?: string }) => (
  <div className="bg-[#f28c38] p-6 rounded-[2rem] text-white flex flex-col items-center justify-center space-y-2 shadow-lg min-w-[280px]">
    <h3 className="text-xl font-black uppercase tracking-widest border-b border-white/20 pb-1 px-8">{label}</h3>
    <div className="text-center space-y-1">
      <p className="text-sm font-bold opacity-90 uppercase">Daily: <span className="text-lg">{daily}{unit}</span></p>
      <p className="text-sm font-bold opacity-90 uppercase">Monthly: <span className="text-lg">{monthly}{unit}</span></p>
    </div>
  </div>
);

const SectionReportQuality: React.FC<SectionReportQualityProps> = ({ department, currentUser }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const selectedMonth = selectedDate.slice(0, 7);

  const config = mockDb.getSystemConfig();
  
  const userLines = useMemo(() => {
    const allLines = config.lineMappings.filter(m => m.sectionId === department);
    if (currentUser.assignedBlockId) {
      return allLines.filter(l => l.blockId === currentUser.assignedBlockId);
    }
    return allLines;
  }, [config.lineMappings, department, currentUser]);

  const blockId = currentUser.assignedBlockId || 'All Blocks';

  const qualityData = useMemo(() => {
    const allProd = mockDb.getProduction(department);
    const allDefects = mockDb.getDefects(department);

    return userLines.map(line => {
      const dailyProd = allProd.filter(p => p.date === selectedDate && p.lineId === line.lineId);
      const monthlyProd = allProd.filter(p => p.date.startsWith(selectedMonth) && p.lineId === line.lineId);
      
      const dailyDefects = allDefects.filter(d => d.date === selectedDate && d.lineId === line.lineId && !d.isReject);
      const monthlyDefects = allDefects.filter(d => d.date.startsWith(selectedMonth) && d.lineId === line.lineId && !d.isReject);

      const dCheckQty = dailyProd.reduce((s, p) => s + p.actual, 0);
      const mCheckQty = monthlyProd.reduce((s, p) => s + p.actual, 0);

      const dDefectFound = dailyDefects.reduce((s, d) => s + d.count, 0);
      const mDefectFound = monthlyDefects.reduce((s, d) => s + d.count, 0);

      return {
        lineId: line.lineId,
        daily: {
          checkQty: dCheckQty,
          defectFound: dDefectFound,
          dhu: dCheckQty > 0 ? ((dDefectFound / dCheckQty) * 100) : 0
        },
        monthly: {
          checkQty: mCheckQty,
          defectFound: mDefectFound,
          dhu: mCheckQty > 0 ? ((mDefectFound / mCheckQty) * 100) : 0
        }
      };
    });
  }, [userLines, department, selectedDate, selectedMonth]);

  const totals = useMemo(() => {
    const dCheck = qualityData.reduce((s, r) => s + r.daily.checkQty, 0);
    const mCheck = qualityData.reduce((s, r) => s + r.monthly.checkQty, 0);
    const dDefect = qualityData.reduce((s, r) => s + r.daily.defectFound, 0);
    const mDefect = qualityData.reduce((s, r) => s + r.monthly.defectFound, 0);

    const allDefects = mockDb.getDefects(department);
    const dRejects = allDefects.filter(d => d.date === selectedDate && d.isReject && (currentUser.assignedBlockId ? userLines.some(l => l.lineId === d.lineId) : true)).reduce((s, d) => s + d.count, 0);
    const mRejects = allDefects.filter(d => d.date.startsWith(selectedMonth) && d.isReject && (currentUser.assignedBlockId ? userLines.some(l => l.lineId === d.lineId) : true)).reduce((s, d) => s + d.count, 0);

    return {
      dailyDHU: dCheck > 0 ? (dDefect / dCheck * 100).toFixed(1) : "0.0",
      monthlyDHU: mCheck > 0 ? (mDefect / mCheck * 100).toFixed(1) : "0.0",
      dailyRejects: dRejects,
      monthlyRejects: mRejects
    };
  }, [qualityData, selectedDate, selectedMonth, currentUser, userLines, department]);

  const paretoLogic = useMemo(() => {
    const allDefects = mockDb.getDefects(department);
    const lineFilter = selectedLine ? allDefects.filter(d => d.lineId === selectedLine) : allDefects.filter(d => userLines.some(ul => ul.lineId === d.lineId));
    
    const defectMapDaily = new Map<string, number>();
    const defectMapMonthly = new Map<string, number>();
    const rejectMapDaily = new Map<string, number>();
    const rejectMapMonthly = new Map<string, number>();

    lineFilter.forEach(d => {
      const isDaily = d.date === selectedDate;
      const isMonthly = d.date.startsWith(selectedMonth);
      
      if (d.isReject) {
        if (isDaily) rejectMapDaily.set(d.defectType, (rejectMapDaily.get(d.defectType) || 0) + d.count);
        if (isMonthly) rejectMapMonthly.set(d.defectType, (rejectMapMonthly.get(d.defectType) || 0) + d.count);
      } else {
        if (isDaily) defectMapDaily.set(d.defectType, (defectMapDaily.get(d.defectType) || 0) + d.count);
        if (isMonthly) defectMapMonthly.set(d.defectType, (defectMapMonthly.get(d.defectType) || 0) + d.count);
      }
    });

    const getTop5 = (dailyMap: Map<string, number>, monthlyMap: Map<string, number>) => {
      const allNames = Array.from(new Set([...dailyMap.keys(), ...monthlyMap.keys()]));
      return allNames
        .map(name => ({
          name,
          daily: dailyMap.get(name) || 0,
          monthly: monthlyMap.get(name) || 0
        }))
        .sort((a, b) => b.daily - a.daily)
        .slice(0, 5);
    };

    return {
      topDefects: getTop5(defectMapDaily, defectMapMonthly),
      topRejects: getTop5(rejectMapDaily, rejectMapMonthly)
    };
  }, [department, selectedLine, userLines, selectedDate, selectedMonth]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 max-w-[1200px] mx-auto bg-white p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 print:hidden mb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/report`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-lg">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Quality Flow Analysis</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center text-center space-y-2 hidden print:flex">
         <Logo size={40} showText={false} className="mb-2" />
         <h1 className="text-2xl font-black text-slate-900">Square Denim's Ltd</h1>
         <p className="text-sm font-bold text-slate-700">
            Quality report - {department} - {blockId} (Based on user)
         </p>
      </div>

      <div className="flex flex-wrap justify-center gap-8 px-4">
        <SummaryBox label="DHU" daily={totals.dailyDHU} monthly={totals.monthlyDHU} unit="%" />
        <SummaryBox label="Reject" daily={totals.dailyRejects} monthly={totals.monthlyRejects} unit=" Pcs" />
      </div>

      <div className="flex justify-end px-2 print:hidden">
         <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <Calendar size={16} className="text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 p-0" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
            />
         </div>
      </div>

      <div className="border border-black overflow-hidden">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-white border-b border-black">
              <th rowSpan={2} className="border-r border-black p-2 font-black text-sm">Line</th>
              <th colSpan={3} className="bg-[#fde6d8] border-r border-black p-2 font-black text-sm">Daily</th>
              <th colSpan={3} className="bg-[#fef9e7] p-2 font-black text-sm">Monthly</th>
            </tr>
            <tr className="bg-white border-b border-black text-xs font-black">
              <th className="border-r border-black p-2 w-[14%]">Check Qty</th>
              <th className="border-r border-black p-2 w-[14%]">Defect found</th>
              <th className="border-r border-black p-2 w-[14%]">Day DHU</th>
              <th className="border-r border-black p-2 w-[14%]">Check Qty</th>
              <th className="border-r border-black p-2 w-[14%]">Defect found</th>
              <th className="p-2 w-[14%]">Day DHU</th>
            </tr>
          </thead>
          <tbody>
            {qualityData.map((row) => (
              <tr 
                key={row.lineId} 
                onClick={() => setSelectedLine(selectedLine === row.lineId ? null : row.lineId)}
                className={`border-b border-black cursor-pointer hover:bg-blue-50 transition-colors ${selectedLine === row.lineId ? 'bg-blue-100/50' : ''}`}
              >
                <td className="border-r border-black p-2 font-bold text-xs flex items-center justify-center gap-1">
                  {row.lineId}
                  {selectedLine === row.lineId && <MousePointer2 size={10} className="text-blue-600" />}
                </td>
                <td className="border-r border-black p-2 text-xs">{row.daily.checkQty || ''}</td>
                <td className="border-r border-black p-2 text-xs">{row.daily.defectFound || ''}</td>
                <td className="border-r border-black p-2 text-xs">{row.daily.checkQty > 0 ? `${row.daily.dhu.toFixed(1)}%` : ''}</td>
                <td className="border-r border-black p-2 text-xs">{row.monthly.checkQty || ''}</td>
                <td className="border-r border-black p-2 text-xs">{row.monthly.defectFound || ''}</td>
                <td className="p-2 text-xs">{row.monthly.checkQty > 0 ? `${row.monthly.dhu.toFixed(1)}%` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <div className="bg-[#f8fafc] border border-black p-2 text-center">
          <p className="text-xs font-black uppercase">
            Top-5 Defect {blockId} (Based on user) / {selectedLine || 'All Lines'} (If click on line)
          </p>
        </div>
        <div className="flex justify-center gap-4 py-2 print:hidden">
           <button className="bg-[#10b981] text-white px-8 py-1 rounded-lg text-xs font-bold shadow-md">Daily</button>
           <button className="bg-[#10b981] text-white px-8 py-1 rounded-lg text-xs font-bold shadow-md">Monthly</button>
        </div>
        <div className="border border-black overflow-hidden">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-white border-b border-black text-xs font-black">
                <th className="border-r border-black p-2 w-[10%]">SL</th>
                <th className="border-r border-black p-2 text-left px-4">Defect Name</th>
                <th className="border-r border-black p-2 w-[15%]">Day Qty</th>
                <th className="p-2 w-[15%]">Month Qty</th>
              </tr>
            </thead>
            <tbody>
              {paretoLogic.topDefects.length > 0 ? paretoLogic.topDefects.map((d, i) => (
                <tr key={i} className="border-b border-black text-xs">
                  <td className="border-r border-black p-2">{i + 1}</td>
                  <td className="border-r border-black p-2 text-left px-4 font-medium">{d.name}</td>
                  <td className="border-r border-black p-2">{d.daily || ''}</td>
                  <td className="p-2">{d.monthly || ''}</td>
                </tr>
              )) : (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-black text-xs h-8">
                    <td className="border-r border-black p-2">{i+1}</td>
                    <td className="border-r border-black p-2"></td>
                    <td className="border-r border-black p-2"></td>
                    <td className="p-2"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="bg-[#f8fafc] border border-black p-2 text-center">
          <p className="text-xs font-black uppercase">
            Top-5 Reject {blockId} (Based on user) / {selectedLine || 'All Lines'} (If click on line)
          </p>
        </div>
        <div className="flex justify-center gap-4 py-2 print:hidden">
           <button className="bg-[#10b981] text-white px-8 py-1 rounded-lg text-xs font-bold shadow-md">Daily</button>
           <button className="bg-[#10b981] text-white px-8 py-1 rounded-lg text-xs font-bold shadow-md">Monthly</button>
        </div>
        <div className="border border-black overflow-hidden">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-white border-b border-black text-xs font-black">
                <th className="border-r border-black p-2 w-[10%]">SL</th>
                <th className="border-r border-black p-2 text-left px-4">Reject</th>
                <th className="border-r border-black p-2 w-[15%]">Day Qty</th>
                <th className="p-2 w-[15%]">Month Qty</th>
              </tr>
            </thead>
            <tbody>
              {paretoLogic.topRejects.length > 0 ? paretoLogic.topRejects.map((r, i) => (
                <tr key={i} className="border-b border-black text-xs">
                  <td className="border-r border-black p-2">{i + 1}</td>
                  <td className="border-r border-black p-2 text-left px-4 font-medium">{r.name}</td>
                  <td className="border-r border-black p-2">{r.daily || ''}</td>
                  <td className="p-2">{r.monthly || ''}</td>
                </tr>
              )) : (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-black text-xs h-8">
                    <td className="border-r border-black p-2">{i+1}</td>
                    <td className="border-r border-black p-2"></td>
                    <td className="border-r border-black p-2"></td>
                    <td className="p-2"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-10 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase print:hidden">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-blue-500" />
          <span>Click on a Line to filter Pareto tables</span>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-slate-900 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-black transition-all"
        >
          Print Page
        </button>
      </div>

      <style>{`
        @media print {
          @page { margin: 10mm; }
          body { background: white !important; padding: 0 !important; }
          .print-hidden, header, nav, aside { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .max-w-[1200px] { max-width: none !important; width: 100% !important; padding: 0 !important; }
          table { font-size: 9px !important; }
          th, td { border: 0.5pt solid black !important; }
        }
      `}</style>
    </div>
  );
};

export default SectionReportQuality;
