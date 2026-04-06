import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Clock, Tag, User, Factory, Target, Activity, CheckCircle, Download, ChevronRight, Timer, ShieldAlert, BarChart3, AlertTriangle, TrendingUp, Layers } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { DepartmentType } from '../types';

const BreakdownDetail: React.FC = () => {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialDept = (searchParams.get('dept') as DepartmentType) || 'Sewing';
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [filterMode, setFilterMode] = useState<'Daily' | 'Monthly' | 'Yearly'>('Daily');
  const [segmentMode, setSegmentMode] = useState<'Line' | 'Buyer' | 'Style' | 'Section'>('Line');
  
  const [date, setDate] = useState(initialDate);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [year, setYear] = useState('2024');
  const [searchTerm, setSearchTerm] = useState('');

  const isNptMode = type === 'npt';
  const isQualityMode = type === 'quality';
  const title = `${initialDept} ${type?.toUpperCase()} Analysis`;

  const allProduction = mockDb.getProduction(initialDept);
  const allNpt = mockDb.getNPT(initialDept);
  const allDefects = mockDb.getDefects(initialDept);
  
  const filteredData = useMemo(() => {
    let base = isNptMode ? (allNpt as any[]) : isQualityMode ? (allDefects as any[]) : (allProduction as any[]);
    
    if (filterMode === 'Daily') base = base.filter(p => p.date === date);
    if (filterMode === 'Monthly') base = base.filter(p => p.date && p.date.startsWith(month));
    if (filterMode === 'Yearly') base = base.filter(p => p.date && p.date.startsWith(year));

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      base = base.filter(p => 
        (p.lineId && p.lineId.toLowerCase().includes(s)) || 
        (p.buyer && p.buyer.toLowerCase().includes(s)) || 
        (p.styleCode && p.styleCode.toLowerCase().includes(s)) ||
        (p.issueCategory && p.issueCategory.toLowerCase().includes(s)) ||
        (p.defectType && p.defectType.toLowerCase().includes(s)) ||
        (p.section && p.section.toLowerCase().includes(s))
      );
    }
    return base;
  }, [allProduction, allNpt, allDefects, filterMode, date, month, year, searchTerm, isNptMode, isQualityMode]);

  const aggregatedData = useMemo(() => {
    if (isQualityMode) {
      const map = new Map<string, { defects: number, rejects: number, count: number }>();
      filteredData.forEach(d => {
        const key = segmentMode === 'Line' ? d.lineId : (segmentMode === 'Buyer' ? d.buyer || 'Unknown' : (segmentMode === 'Section' ? d.section || 'General' : d.styleCode || 'Unknown'));
        const existing = map.get(key) || { defects: 0, rejects: 0, count: 0 };
        if (d.isReject) existing.rejects += d.count;
        else existing.defects += d.count;
        existing.count += 1;
        map.set(key, existing);
      });
      return Array.from(map.entries()).map(([key, val]) => ({
        id: key,
        defects: val.defects,
        rejects: val.rejects,
        count: val.count
      })).sort((a, b) => (b.defects + b.rejects) - (a.defects + a.rejects));
    }

    const map = new Map<string, { target: number, actual: number, extraValue?: number, count: number }>();
    filteredData.forEach(p => {
      const key = segmentMode === 'Line' ? p.lineId : (segmentMode === 'Buyer' ? p.buyer || 'Unknown' : (segmentMode === 'Section' ? p.section || 'General' : p.styleCode || p.issueCategory || 'Unknown'));
      const existing = map.get(key) || { target: 0, actual: 0, extraValue: 0, count: 0 };
      if (isNptMode) existing.extraValue = (existing.extraValue || 0) + (p.durationMinutes || 0);
      else { existing.target += (p.target || 0); existing.actual += (p.actual || 0); }
      existing.count += 1;
      map.set(key, existing);
    });
    return Array.from(map.entries()).map(([key, val]) => ({
      id: key,
      target: val.target,
      actual: val.actual,
      extraValue: val.extraValue,
      efficiency: val.target > 0 ? (val.actual / val.target) * 100 : 0,
      count: val.count
    })).sort((a, b) => isNptMode ? (b.extraValue || 0) - (a.extraValue || 0) : b.actual - a.actual);
  }, [filteredData, segmentMode, isNptMode, isQualityMode]);

  const qualityStats = useMemo(() => {
    if (!isQualityMode) return null;
    const defectReasons: Record<string, number> = {};
    const rejectReasons: Record<string, number> = {};
    filteredData.forEach(d => {
      const target = d.isReject ? rejectReasons : defectReasons;
      target[d.defectType] = (target[d.defectType] || 0) + d.count;
    });
    return {
      topDefects: Object.entries(defectReasons).sort((a,b) => b[1] - a[1]),
      topRejects: Object.entries(rejectReasons).sort((a,b) => b[1] - a[1])
    };
  }, [filteredData, isQualityMode]);

  return (
    <div className="space-y-8 pb-20 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
            <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest font-black">Enterprise Diagnostics Mode</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
              {(['Daily', 'Monthly', 'Yearly'] as const).map(m => (
                 <button key={m} onClick={() => setFilterMode(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === m ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>{m}</button>
              ))}
           </div>
           <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm flex items-center gap-3">
              {filterMode === 'Daily' && <input type="date" className="text-xs font-black outline-none bg-transparent" value={date} onChange={e => setDate(e.target.value)} />}
              {filterMode === 'Monthly' && <input type="month" className="text-xs font-black outline-none bg-transparent" value={month} onChange={e => setMonth(e.target.value)} />}
              {filterMode === 'Yearly' && <select className="text-xs font-black outline-none bg-transparent" value={year} onChange={e => setYear(e.target.value)}><option value="2025">2025</option><option value="2024">2024</option></select>}
           </div>
           <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl"><Download size={16} /></button>
        </div>
      </div>

      {isQualityMode && qualityStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><ShieldAlert className="text-amber-500" size={24}/> Department Defect Pareto</h3>
              <div className="space-y-4">
                 {qualityStats.topDefects.slice(0, 8).map(([type, count], i) => (
                    <div key={type} className="space-y-1.5">
                       <div className="flex justify-between text-sm font-bold"><span className="text-slate-600">{type}</span><span className="font-black">{count} Pcs</span></div>
                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${(count / qualityStats.topDefects[0][1]) * 100}%` }}></div></div>
                    </div>
                 ))}
                 {qualityStats.topDefects.length === 0 && <p className="text-center py-20 text-slate-300 italic">No defects recorded for selection.</p>}
              </div>
           </div>
           <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><AlertTriangle className="text-rose-500" size={24}/> Department Reject Pareto</h3>
              <div className="space-y-4">
                 {qualityStats.topRejects.slice(0, 8).map(([type, count], i) => (
                    <div key={type} className="space-y-1.5">
                       <div className="flex justify-between text-sm font-bold"><span className="text-slate-600">{type}</span><span className="font-black text-rose-600">{count} Pcs</span></div>
                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${(count / qualityStats.topRejects[0][1]) * 100}%` }}></div></div>
                    </div>
                 ))}
                 {qualityStats.topRejects.length === 0 && <p className="text-center py-20 text-slate-300 italic">No rejects recorded for selection.</p>}
              </div>
           </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row gap-6">
         <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quick Discovery</label>
            <div className="relative">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
               <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10" placeholder={`Search...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Segment Mode</label>
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
              {(['Line', 'Section', 'Buyer', 'Style'] as const).map(s => (
                <button key={s} onClick={() => setSegmentMode(s)} className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${segmentMode === s ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>{s}</button>
              ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {aggregatedData.map(item => (
          <div key={item.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors"></div>
             <div className="flex items-center justify-between mb-8 relative z-10">
                <div className={`p-4 ${isNptMode ? 'bg-rose-600' : isQualityMode ? 'bg-rose-600' : 'bg-slate-900'} text-white rounded-2xl shadow-lg`}>
                   {segmentMode === 'Line' ? <Factory size={24} /> : (segmentMode === 'Buyer' ? <User size={24} /> : (segmentMode === 'Section' ? <Layers size={24}/> : <Tag size={24} />))}
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isNptMode ? 'Loss Time' : isQualityMode ? 'Total Faults' : 'Efficiency'}</p>
                   <p className={`text-2xl font-black ${isNptMode ? 'text-rose-600' : isQualityMode ? 'text-rose-600' : (item.efficiency >= 80 ? 'text-emerald-500' : 'text-amber-500')}`}>
                      {isNptMode ? `${item.extraValue}m` : isQualityMode ? `${item.defects + item.rejects} Pcs` : `${item.efficiency.toFixed(1)}%`}
                   </p>
                </div>
             </div>
             <div className="relative z-10">
                <h3 className="text-2xl font-black text-slate-900 mb-1 truncate uppercase">{item.id}</h3>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${isNptMode || isQualityMode ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></div>
                   {isNptMode ? 'Monitoring Loss Events' : isQualityMode ? 'Monitoring Loss Quantity' : 'Aggregated Output Metrics'}
                </div>
             </div>
             {isQualityMode ? (
               <div className="mt-10 grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                     <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase mb-1"><ShieldAlert size={12} /> Defect</div>
                     <p className="text-xl font-black text-amber-700">{item.defects}</p>
                  </div>
                  <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                     <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase mb-1"><AlertTriangle size={12} /> Reject</div>
                     <p className="text-xl font-black text-rose-700">{item.rejects}</p>
                  </div>
               </div>
             ) : !isNptMode ? (
               <div className="mt-10 grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-1"><Target size={12} className="text-blue-500" /> Target</div><p className="text-xl font-black text-slate-900">{item.target.toLocaleString()}</p></div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-1"><CheckCircle size={12} className="text-emerald-500" /> Output</div><p className="text-xl font-black text-slate-900">{item.actual.toLocaleString()}</p></div>
               </div>
             ) : (
               <div className="mt-10 p-4 bg-rose-50 rounded-2xl border border-rose-100 relative z-10 text-center"><p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Down Time Duration</p><p className="text-3xl font-black text-rose-900">{item.extraValue} <span className="text-sm">Minutes</span></p></div>
             )}
             <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase italic"><Clock size={12} /> {item.count} Records</div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
             </div>
          </div>
        ))}
        {aggregatedData.length === 0 && <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner"><Activity size={64} className="mx-auto text-slate-100 mb-6" /><p className="text-xl font-black text-slate-400 mb-2">No Records Found</p></div>}
      </div>
    </div>
  );
};

export default BreakdownDetail;