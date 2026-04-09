import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Calendar, Printer, X, FileText, Search, Filter, 
  ArrowDownCircle, ArrowUpCircle, Scale, Download, Info, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { DepartmentType, AppUser, WIPRecord, ProductionRecord, DefectRecord } from '../types';

interface SectionReportWIPProps {
  department: DepartmentType;
  currentUser: AppUser;
}

const SectionReportWIP: React.FC<SectionReportWIPProps> = ({ department, currentUser }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Data Aggregation Engine
  const reportData = useMemo(() => {
    const allWip = mockDb.getWIP(department);
    const allProd = mockDb.getProduction(department);
    const allDefects = mockDb.getDefects(department);

    // Grouping keys to find unique flows: Line + Buyer + Style + SO + Color
    const uniqueKeys = new Set<string>();
    
    allWip.forEach(w => uniqueKeys.add(`${w.lineId}|${w.buyer}|${w.styleNumber}|${w.soNumber}|${w.color}`));
    allProd.forEach(p => uniqueKeys.add(`${p.lineId}|${p.buyer}|${p.styleCode}|${p.soNumber}|${p.color}`));
    allDefects.forEach(d => uniqueKeys.add(`${d.lineId}|${d.buyer}|${d.styleCode}|${d.soNumber}|${d.color}`));

    return Array.from(uniqueKeys).map(key => {
      const [lineId, buyer, style, so, color] = key.split('|');

      // Filter WIP for this specific flow
      const wipEntries = allWip.filter(w => 
        w.lineId === lineId && w.buyer === buyer && w.styleNumber === style && 
        w.soNumber === so && w.color === color
      );

      // Filter Production for this specific flow (Includes Rectifications)
      const prodEntries = allProd.filter(p => 
        p.lineId === lineId && p.buyer === buyer && p.styleCode === style && 
        p.soNumber === so && p.color === color
      );

      // Filter Rejects for this specific flow (Net rejects = Rejects - Rectifications)
      const rejectEntries = allDefects.filter(d => 
        d.lineId === lineId && d.buyer === buyer && d.styleCode === style && 
        d.soNumber === so && d.color === color && d.isReject
      );

      // Calculations
      const dailyInput = wipEntries.filter(w => w.date === selectedDate).reduce((s, w) => s + w.inputQty, 0);
      const totalInput = wipEntries.filter(w => w.date <= selectedDate).reduce((s, w) => s + w.inputQty, 0);
      
      const dailyOutput = prodEntries.filter(p => p.date === selectedDate).reduce((s, p) => s + p.actual, 0);
      const totalOutput = prodEntries.filter(p => p.date <= selectedDate).reduce((s, p) => s + p.actual, 0);

      const dailyRejects = rejectEntries.filter(d => d.date === selectedDate).reduce((s, d) => s + d.count, 0);
      const totalRejects = rejectEntries.filter(d => d.date <= selectedDate).reduce((s, d) => s + d.count, 0);

      // Line Balance = Total Input - Total Output - Total Net Rejects
      const lineBalance = totalInput - totalOutput - totalRejects;

      return {
        lineId, buyer, style, so, color,
        dailyInput, totalInput,
        dailyOutput, totalOutput,
        dailyRejects, totalRejects,
        lineBalance
      };
    })
    .filter(row => {
      // Show if there is activity today OR if there is a remaining balance
      const hasActivity = row.dailyInput > 0 || row.dailyOutput > 0 || row.dailyRejects > 0;
      const hasBalance = row.lineBalance > 0 || row.totalInput > 0 || row.totalRejects > 0;
      const matchesSearch = !searchTerm || 
        row.lineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.so.toLowerCase().includes(searchTerm.toLowerCase());
      
      return (hasActivity || hasBalance) && matchesSearch;
    })
    .sort((a, b) => a.lineId.localeCompare(b.lineId, undefined, { numeric: true }));
  }, [department, selectedDate, searchTerm]);

  const totals = useMemo(() => {
    return reportData.reduce((acc, curr) => ({
      dailyInput: acc.dailyInput + curr.dailyInput,
      totalInput: acc.totalInput + curr.totalInput,
      dailyOutput: acc.dailyOutput + curr.dailyOutput,
      totalOutput: acc.totalOutput + curr.totalOutput,
      dailyRejects: acc.dailyRejects + curr.dailyRejects,
      totalRejects: acc.totalRejects + curr.totalRejects,
      balance: acc.balance + curr.lineBalance
    }), { dailyInput: 0, totalInput: 0, dailyOutput: 0, totalOutput: 0, dailyRejects: 0, totalRejects: 0, balance: 0 });
  }, [reportData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-[1700px] mx-auto">
      {/* Header UI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/report`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-blue-700 p-3 rounded-2xl text-white shadow-lg">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">WIP Flow Analysis</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Calendar size={18} className="text-slate-400 ml-2" />
            <input 
              type="date" 
              className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 p-0" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
            />
          </div>
          <button 
            onClick={handlePrint}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all flex items-center gap-2"
          >
            <Printer size={16}/> Print Report
          </button>
        </div>
      </div>

      {/* Filter Control */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 print:hidden mx-2">
         <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
               className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-xs font-bold"
               placeholder="Search by Line, Buyer, Style or SO..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 whitespace-nowrap">
            <Filter size={14} /> Total Rows: {reportData.length}
         </div>
      </div>

      {/* Report Canvas */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* Printable Header Section */}
        <div className="p-8 border-b border-slate-100 flex flex-col items-center text-center space-y-2">
           <div className="hidden print:block mb-4">
              <div className="flex items-center justify-center gap-4">
                  <div className="w-10 h-10 bg-black flex items-center justify-center p-1">
                    <div className="grid grid-cols-3 gap-0.5">
                      {[...Array(9)].map((_,i) => <div key={i} className="w-2 h-2 bg-white"></div>)}
                    </div>
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-black uppercase leading-none">Square Denims Limited (GU)</h2>
                    <p className="text-[10px] font-bold text-slate-500">Dubaliapara, Hobirbari, Bhaluka, Mymensingh</p>
                  </div>
              </div>
           </div>
           <h3 className="text-xl font-black text-slate-900 uppercase underline decoration-2 underline-offset-8">Daily {department} Production Report</h3>
           <p className="text-sm font-bold text-slate-600">Reporting Date: {new Date(selectedDate).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'2-digit' })}</p>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse print:text-[11px]">
            <thead>
              <tr className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-tighter">
                <th className="px-3 py-4 border border-white/20 text-center">Line</th>
                <th className="px-3 py-4 border border-white/20">Buyer</th>
                <th className="px-3 py-4 border border-white/20">Style</th>
                <th className="px-3 py-4 border border-white/20 text-center">SO</th>
                <th className="px-3 py-4 border border-white/20">Color</th>
                <th className="px-2 py-4 border border-white/20 text-center bg-blue-900/50">Daily Input</th>
                <th className="px-2 py-4 border border-white/20 text-center bg-blue-900/50">Total Input</th>
                <th className="px-2 py-4 border border-white/20 text-center bg-emerald-900/50">Daily Output</th>
                <th className="px-2 py-4 border border-white/20 text-center bg-emerald-900/50">Total Output</th>
                <th className="px-4 py-4 border border-white/20 text-center bg-amber-900/50">Line Balance</th>
                <th className="px-2 py-4 border border-white/20 text-center bg-rose-900/50">Reject Qty</th>
                <th className="px-4 py-4 border border-white/20">Remarks</th>
              </tr>
            </thead>
            <tbody className="font-bold text-slate-700 divide-y divide-slate-200">
              {reportData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 border border-slate-200 text-center font-black">{row.lineId}</td>
                  <td className="px-3 py-3 border border-slate-200 uppercase text-xs truncate max-w-[120px]">{row.buyer}</td>
                  <td className="px-3 py-3 border border-slate-200 uppercase text-[11px] truncate max-w-[150px]">{row.style}</td>
                  <td className="px-3 py-3 border border-slate-200 text-center text-blue-600">{row.so}</td>
                  <td className="px-3 py-3 border border-slate-200 uppercase text-[10px] italic text-slate-500">{row.color}</td>
                  
                  <td className="px-2 py-3 border border-slate-200 text-center bg-blue-50/20">{row.dailyInput || '--'}</td>
                  <td className="px-2 py-3 border border-slate-200 text-center bg-blue-50/50 text-blue-700">{row.totalInput}</td>
                  
                  <td className="px-2 py-3 border border-slate-200 text-center bg-emerald-50/20">{row.dailyOutput || '--'}</td>
                  <td className="px-2 py-3 border border-slate-200 text-center bg-emerald-50/50 text-emerald-700">{row.totalOutput}</td>
                  
                  <td className="px-4 py-3 border border-slate-200 text-center bg-amber-50/50 text-slate-900 text-lg font-black">{row.lineBalance}</td>
                  
                  <td className="px-2 py-3 border border-slate-200 text-center bg-rose-50/50 text-rose-600">
                    <div className="flex flex-col items-center">
                      <span className="text-base font-black">{row.totalRejects}</span>
                      {row.dailyRejects > 0 && <span className="text-[8px] font-bold text-rose-400">+{row.dailyRejects} Today</span>}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 border border-slate-200 text-[10px] text-slate-400 italic">
                    {row.totalRejects > 0 ? `Net Rejects (Subsequent stages included)` : '--'}
                  </td>
                </tr>
              ))}
              {/* Summary Total Row */}
              <tr className="bg-slate-50 font-black text-slate-900 text-sm">
                <td colSpan={5} className="px-6 py-5 text-right border border-slate-200 uppercase tracking-widest">Grand Total</td>
                <td className="px-2 py-5 border border-slate-200 text-center text-blue-600">{totals.dailyInput.toLocaleString()}</td>
                <td className="px-2 py-5 border border-slate-200 text-center text-blue-900">{totals.totalInput.toLocaleString()}</td>
                <td className="px-2 py-5 border border-slate-200 text-center text-emerald-600">{totals.dailyOutput.toLocaleString()}</td>
                <td className="px-2 py-5 border border-slate-200 text-center text-emerald-900">{totals.totalOutput.toLocaleString()}</td>
                <td className="px-4 py-5 border border-slate-200 text-center bg-amber-100 text-xl">{totals.balance.toLocaleString()}</td>
                <td className="px-2 py-5 border border-slate-200 text-center bg-rose-100 text-rose-700 text-xl">{totals.totalRejects.toLocaleString()}</td>
                <td className="px-4 py-5 border border-slate-200"></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {reportData.length === 0 && (
          <div className="py-32 text-center space-y-4">
             <Box size={64} className="mx-auto text-slate-200 opacity-50" />
             <p className="text-xl font-black text-slate-400">No activity records found for this date.</p>
             <p className="text-sm font-medium text-slate-300">Try selecting a different reporting period.</p>
          </div>
        )}

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 print:hidden">
           <div className="flex items-center gap-3 text-slate-400">
              <Info size={18} />
              <p className="text-xs font-bold uppercase tracking-widest">WIP Balance reflects total Input minus successful Output and Net Rejects.</p>
           </div>
           <div className="flex gap-4">
              <button className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100 shadow-sm transition-all">
                 <Download size={14} /> Export Excel
              </button>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          header, nav, aside, .print-hidden { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          main { padding: 0 !important; margin: 0 !important; display: block !important; width: 100% !important; height: auto !important; position: static !important; }
          .max-w-[1700px] { max-width: none !important; margin: 0 !important; width: 100% !important; }
          table { width: 100% !important; table-layout: fixed !important; font-size: 8px !important; }
          th, td { padding: 4px 1px !important; border: 1pt solid black !important; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default SectionReportWIP;
