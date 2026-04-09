import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Users, Calendar, ChevronDown, UserCheck, Clock, BookOpen, 
  Search as SearchIcon, ArrowLeftRight, RefreshCcw, FileBarChart, ArrowLeft 
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { DepartmentType, AppUser, TimeStudyRecord } from '../types';

interface SectionReportManpowerProps {
  department: DepartmentType;
  currentUser: AppUser;
}

const SectionReportManpower: React.FC<SectionReportManpowerProps> = ({ department, currentUser }) => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBlock, setSelectedBlock] = useState('Block-1');

  // Lookup Widget States
  const [skillId, setSkillId] = useState('');
  const [attId, setAttId] = useState('');
  const [counselId, setCounselId] = useState('');

  const config = mockDb.getSystemConfig();
  const blocks = useMemo(() => [...new Set(config.lineMappings.filter(m => m.sectionId === department).map(m => m.blockId))], [config, department]);
  
  const manpowerTableData = useMemo(() => {
    const allManpower = mockDb.getManpower(department).filter(item => item.date === startDate);
    const visibleLines = config.lineMappings.filter(m => m.sectionId === department && m.blockId === selectedBlock);

    return visibleLines.map(line => {
        const record = allManpower.find(r => r.lineId === line.lineId);
        return {
            lineId: line.lineId,
            recruit: { op: record?.totalRecruit || 0, hp: 0, iron: 0 },
            budget: { op: line.budgetOp || 0, hp: line.budgetHp || 0, iron: line.budgetIr || 0 },
            present: record ? (record.presentOp + record.presentIr + record.presentHp) : 0,
            headcount: record ? (record.headCount + record.headCountExtra) : 0,
            absent: record?.absent || 0
        };
    });
  }, [department, startDate, selectedBlock, config.lineMappings]);

  const skillDistribution = useMemo(() => {
    const skills = mockDb.getSkills(department);
    const countA = skills.filter(s => s.skillLevel === 'A').length;
    const countB = skills.filter(s => s.skillLevel === 'B').length;
    const countC = skills.filter(s => s.skillLevel === 'C').length;
    return [
      { name: 'Grade A', value: countA, color: '#10b981' },
      { name: 'Grade B', value: countB, color: '#3b82f6' },
      { name: 'Grade C', value: countC, color: '#f59e0b' }
    ];
  }, [department]);

  const hrMovements = useMemo(() => {
    const entries = mockDb.getHREntries();
    const deptLines = config.lineMappings.filter(m => m.sectionId === department).map(m => m.lineId);
    const filtered = entries.filter(e => deptLines.includes(e.lineId) && e.date === startDate);
    const counts = { LEAVE: 0, ABSENT: 0, HALFDAY: 0, TURNOVER: 0 };
    filtered.forEach(e => { if (counts[e.type as keyof typeof counts] !== undefined) counts[e.type as keyof typeof counts]++; });
    return [
      { type: 'Leave', count: counts.LEAVE, color: '#3b82f6' },
      { type: 'Absent', count: counts.ABSENT, color: '#ef4444' },
      { type: 'Half Day', count: counts.HALFDAY, color: '#f59e0b' },
      { type: 'Turnover', count: counts.TURNOVER, color: '#8b5cf6' }
    ];
  }, [department, startDate, config.lineMappings]);

  const staffLedger = useMemo(() => {
    const staff = config.staffDatabase.filter(s => s.department === department);
    const studies = JSON.parse(localStorage.getItem('protrack_time_studies') || '[]') as TimeStudyRecord[];
    return staff.map(s => {
        const latestStudy = studies.filter(st => st.employeeId === s.employeeId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        return {
            line: s.line, id: s.employeeId, name: s.name,
            process: latestStudy?.processName || s.designation,
            capacity: latestStudy?.capacity ? Math.round(latestStudy.capacity) : '--'
        };
    });
  }, [department, config.staffDatabase]);

  const skillLookup = useMemo(() => config.staffDatabase.find(s => s.employeeId === skillId), [skillId, config.staffDatabase]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500 max-w-[1700px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/report`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-teal-600 p-3 rounded-2xl text-white shadow-lg">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">{department} Manpower Details</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Calendar size={18} className="text-slate-400 ml-2" />
          <input type="date" className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 p-0" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-12">
        {/* 1. Manpower Status Table */}
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div className="relative">
                  <select className="bg-white border-2 border-teal-600 rounded-xl px-4 py-2 text-xs font-black outline-none cursor-pointer" value={selectedBlock} onChange={e => setSelectedBlock(e.target.value)}>
                    {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Manpower Status Registry</h3>
             </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                   <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                      <th className="px-8 py-4 border-r border-white/10" rowSpan={2}>Line Identity</th>
                      <th className="px-2 py-2 text-center border-r border-white/10" colSpan={3}>Recruit Pool</th>
                      <th className="px-2 py-2 text-center border-r border-white/10" colSpan={3}>Budgeted Goal</th>
                      <th className="px-6 py-4 text-center border-r border-white/10" rowSpan={2}>Present</th>
                      <th className="px-6 py-4 text-center border-r border-white/10" rowSpan={2}>Headcount</th>
                      <th className="px-8 py-4 text-center" rowSpan={2}>Absentee</th>
                   </tr>
                   <tr className="bg-slate-800 text-white text-[8px] font-bold uppercase tracking-tighter">
                      <th className="px-2 py-2 text-center border-r border-white/10">OP</th>
                      <th className="px-2 py-2 text-center border-r border-white/10">HP</th>
                      <th className="px-2 py-2 text-center border-r border-white/10">Iron</th>
                      <th className="px-2 py-2 text-center border-r border-white/10">OP</th>
                      <th className="px-2 py-2 text-center border-r border-white/10">HP</th>
                      <th className="px-2 py-2 text-center border-r border-white/10">Iron</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                   {manpowerTableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-all text-xs font-bold">
                         <td className="px-8 py-5 border-r border-slate-100 font-black text-slate-900">{row.lineId}</td>
                         <td className="px-2 py-5 border-r border-slate-100 text-center">{row.recruit.op}</td>
                         <td className="px-2 py-5 border-r border-slate-100 text-center text-slate-300">--</td>
                         <td className="px-2 py-5 border-r border-slate-100 text-center text-slate-300">--</td>
                         <td className="px-2 py-5 border-r border-slate-100 text-center bg-slate-50/50">{row.budget.op}</td>
                         <td className="px-2 py-5 border-r border-slate-100 text-center bg-slate-50/50">{row.budget.hp}</td>
                         <td className="px-2 py-5 border-r border-slate-100 text-center bg-slate-50/50">{row.budget.iron}</td>
                         <td className="px-6 py-5 border-r border-slate-100 text-center font-black text-teal-600">{row.present}</td>
                         <td className="px-6 py-5 border-r border-slate-100 text-center font-black text-slate-900">{row.headcount}</td>
                         <td className="px-8 py-5 text-center font-black text-rose-600">{row.absent}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
             <button className="flex items-center gap-2 px-14 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all">
                <ArrowLeftRight size={14}/> Transfer / Movement History
             </button>
          </div>
        </div>

        {/* 2. Interactive ID Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-6">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><UserCheck size={18} className="text-teal-500" /> Manpower Skill Status</h4>
              <div className="space-y-4">
                 <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase">Employee ID:</label><div className="relative"><SearchIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold" placeholder="Input ID..." value={skillId} onChange={e => setSkillId(e.target.value)} /></div></div>
                 <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase">Line:</label><input readOnly className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-500" value={skillLookup?.line || '--'} /></div>
                 <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase">Process:</label><input readOnly className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-500" value={skillLookup?.designation || '--'} /></div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-6">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Clock size={18} className="text-blue-500" /> Attendance status</h4>
              <div className="space-y-4">
                 <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase">Employee ID:</label><div className="relative"><SearchIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold" placeholder="Input ID..." value={attId} onChange={e => setAttId(e.target.value)} /></div></div>
                 <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                    <div className="text-center bg-blue-50 p-4 rounded-3xl"><p className="text-[8px] font-black uppercase text-blue-400 mb-1">Status</p><p className="text-sm font-black text-blue-700">Present</p></div>
                    <div className="text-center bg-rose-50 p-4 rounded-3xl"><p className="text-[8px] font-black uppercase text-rose-400 mb-1">M-M Loss</p><p className="text-sm font-black text-rose-700">600m</p></div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-6">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><BookOpen size={18} className="text-purple-500" /> Counseling status</h4>
              <div className="space-y-4">
                 <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase">Employee ID:</label><div className="relative"><SearchIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold" placeholder="Input ID..." value={counselId} onChange={e => setCounselId(e.target.value)} /></div></div>
                 <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center min-h-[100px] flex items-center justify-center"><p className="text-[10px] text-slate-400 font-bold italic">No records linked.</p></div>
              </div>
           </div>
        </div>

        {/* 3. Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2"><UserCheck className="text-teal-600" /> Skill matrix Grade distribution</h3>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillDistribution}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                       <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                       <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                          {skillDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2"><RefreshCcw className="text-blue-600" /> Day-Wise HR Movement History</h3>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hrMovements} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                       <XAxis type="number" axisLine={false} tickLine={false} hide />
                       <YAxis dataKey="type" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#64748b'}} />
                       <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                       <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={30}>
                          {hrMovements.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* 4. Bottom Technical Ledger Table */}
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Workforce Technical Ledger</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{staffLedger.length} Personnel List</span>
           </div>
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                       <th className="px-8 py-5">Line Identity</th>
                       <th className="px-8 py-5">Staff ID</th>
                       <th className="px-8 py-5">Full Name</th>
                       <th className="px-8 py-5">Active Process</th>
                       <th className="px-8 py-5 text-right">Capacity (PCS/HR)</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {staffLedger.map((s, idx) => (
                       <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-5 text-xs font-black text-teal-600">{s.line}</td>
                          <td className="px-8 py-5 text-xs font-black text-slate-900">{s.id}</td>
                          <td className="px-8 py-5 text-xs uppercase">{s.name}</td>
                          <td className="px-8 py-5 text-xs font-medium italic text-slate-500">{s.process}</td>
                          <td className="px-8 py-5 text-right font-black text-teal-600 tabular-nums">
                             {s.capacity} <span className="text-[8px] uppercase opacity-50 font-black">Studied</span>
                          </td>
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

export default SectionReportManpower;