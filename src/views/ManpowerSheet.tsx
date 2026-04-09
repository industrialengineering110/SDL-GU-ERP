
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Save, CheckCircle, Activity, Calendar, Download, 
  Lock, Timer, UserMinus, RefreshCcw, X, User as UserIcon, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { DepartmentType, ManpowerRecord, AppUser, UserRole, HREntry } from '../types';

const GroupHeader = ({ label, color, span }: { label: string, color: string, span: number }) => (
  <th colSpan={span} className={`${color} text-white font-black text-[9px] uppercase tracking-wider text-center border-x border-white/10 py-2 shadow-inner leading-none sticky top-0 z-20`}>
    {label}
  </th>
);

type HRModalType = 'LEAVE' | 'ABSENT' | 'HALFDAY' | 'TURNOVER' | null;

const ManpowerSheet: React.FC<{ department: DepartmentType; currentUser: AppUser; processType?: string }> = ({ department, currentUser, processType }) => {
  const navigate = useNavigate();
  const [config] = useState(mockDb.getSystemConfig());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<ManpowerRecord[]>([]);
  const [modalType, setModalType] = useState<HRModalType>(null);
  const [message, setMessage] = useState('');

  const isShiftClosed = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (date < todayStr) return true;
    if (date === todayStr && now.getHours() >= 22) return true;
    return false;
  }, [date]);

  const [hrForm, setHRForm] = useState({
    employeeId: '',
    employeeName: '',
    lineId: '',
    designation: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    details: ''
  });

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isIE = currentUser.role === UserRole.IE_REPORTER || isAdmin;
  const isReporter = currentUser.role === UserRole.DATA_ENTRY || isAdmin;

  const visibleLines = useMemo(() => {
    if (isAdmin) return config.lineMappings.filter(m => m.sectionId === department);
    if (currentUser.lines && currentUser.lines.length > 0) {
      return config.lineMappings.filter(m => currentUser.lines?.includes(m.lineId));
    }
    return config.lineMappings.filter(m => m.sectionId === department);
  }, [config.lineMappings, currentUser, department, isAdmin]);

  const blocks = useMemo(() => {
    const bSet = new Set(visibleLines.map(l => l.blockId));
    return Array.from(bSet).sort();
  }, [visibleLines]);

  useEffect(() => {
    const data = mockDb.getManpower(department).filter(r => r.date === date);
    setRecords(data);
  }, [department, date]);

  useEffect(() => {
    if (hrForm.employeeId.length >= 4) {
      const staff = config.staffDatabase.find(s => s.employeeId === hrForm.employeeId);
      if (staff) {
        setHRForm(prev => ({
          ...prev,
          employeeName: staff.name,
          lineId: staff.line,
          designation: staff.designation
        }));
      }
    }
  }, [hrForm.employeeId, config.staffDatabase]);

  const handleUpdateRecord = (lineId: string, field: keyof ManpowerRecord, val: number) => {
    const existing = records.find(r => r.lineId === lineId);
    const lineMap = config.lineMappings.find(m => m.lineId === lineId);
    
    const base: ManpowerRecord = existing || {
      id: Date.now().toString(),
      date,
      department,
      blockId: lineMap?.blockId || 'Unknown',
      lineId,
      totalSupervisor: 0,
      presentOp: 0, presentIr: 0, presentHp: 0,
      headCount: 0, headCountExtra: 0,
      budgetOp: lineMap?.budgetOp || 0,
      budgetIr: lineMap?.budgetIr || 0,
      budgetHp: lineMap?.budgetHp || 0,
      totalRecruit: 0, closeOp: 0, closeHpIr: 0, actualRecruit: 0, absent: 0,
      layoutManpower: lineMap?.layoutManpower || 0,
      layoutExtra: lineMap?.layoutExtra || 0,
      timestamp: new Date().toISOString(),
      reporterId: currentUser.id
    };

    const updatedDraft = { ...base, [field]: val };
    const calculatedActualRecruit = (updatedDraft.totalRecruit || 0) - (updatedDraft.closeOp || 0) - (updatedDraft.closeHpIr || 0);

    const updated = { 
      ...updatedDraft, 
      actualRecruit: calculatedActualRecruit,
      timestamp: new Date().toISOString() 
    };
    
    mockDb.saveManpower(updated);
    setRecords(prev => {
      const filtered = prev.filter(r => r.lineId !== lineId);
      return [...filtered, updated];
    });
  };

  const handleSaveHREntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hrForm.employeeId || !hrForm.employeeName || !modalType) return;

    const entry: HREntry = {
      id: Date.now().toString(),
      type: modalType,
      ...hrForm,
      timestamp: new Date().toISOString(),
      reportedBy: currentUser.name
    };

    mockDb.saveHREntry(entry);
    setModalType(null);
    setHRForm({
      employeeId: '', employeeName: '', lineId: '', designation: '', 
      date: new Date().toISOString().split('T')[0], reason: '', details: ''
    });
    setMessage(`${modalType} record synchronized.`);
    setTimeout(() => setMessage(''), 3000);
  };

  const canEditField = (group: string): boolean => {
    if (isShiftClosed && !isAdmin) return false;
    if (isAdmin) return true;
    if (group === 'present' || group === 'headcount' || group === 'recruit') return isReporter;
    if (group === 'layout') return isIE;
    return false;
  };

  const renderInput = (lineId: string, field: keyof ManpowerRecord, group: string, value: number) => {
    const editable = canEditField(group);
    return (
      <input 
        type="number" 
        className={`w-full h-full bg-transparent text-center font-black text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all ${!editable ? 'cursor-not-allowed opacity-40' : 'hover:bg-white/50'}`}
        value={value || ''}
        readOnly={!editable}
        onChange={e => handleUpdateRecord(lineId, field, parseInt(e.target.value) || 0)}
      />
    );
  };

  const getBlockTotals = (blockId: string) => {
    const blockLines = visibleLines.filter(l => l.blockId === blockId);
    return blockLines.reduce((acc, line) => {
      const r = records.find(rec => rec.lineId === line.lineId) || {
        totalSupervisor: 0, presentOp: 0, presentIr: 0, presentHp: 0,
        headCount: 0, headCountExtra: 0,
        budgetOp: line.budgetOp || 0,
        budgetIr: line.budgetIr || 0,
        budgetHp: line.budgetHp || 0,
        totalRecruit: 0, closeOp: 0, closeHpIr: 0, actualRecruit: 0,
        layoutManpower: line.layoutManpower || 0,
        layoutExtra: line.layoutExtra || 0
      };

      const actPres = (r.presentOp || 0) + (r.presentIr || 0) + (r.presentHp || 0);
      const hcTotal = (r.headCount || 0) + (r.headCountExtra || 0);
      const bTotal = (r.budgetOp || 0) + (r.budgetIr || 0) + (r.budgetHp || 0);
      const lTotal = (r.layoutManpower || 0) + (r.layoutExtra || 0);
      const actRecruit = (r.totalRecruit || 0) - ((r.closeOp || 0) + (r.closeHpIr || 0));

      return {
        super: acc.super + (r.totalSupervisor || 0),
        op: acc.op + (r.presentOp || 0),
        ir: acc.ir + (r.presentIr || 0),
        hp: acc.hp + (r.presentHp || 0),
        actPres: acc.actPres + actPres,
        hc: acc.hc + (r.headCount || 0),
        extra: acc.extra + (r.headCountExtra || 0),
        hcTotal: acc.hcTotal + hcTotal,
        bOp: acc.bOp + (r.budgetOp || 0),
        bIr: acc.bIr + (r.budgetIr || 0),
        bHp: acc.bHp + (r.budgetHp || 0),
        bTotal: acc.bTotal + bTotal,
        recruit: acc.recruit + (r.totalRecruit || 0),
        closeOp: acc.closeOp + (r.closeOp || 0),
        closeHpIr: acc.closeHpIr + (r.closeHpIr || 0),
        actualRecruit: acc.actualRecruit + actRecruit,
        absent: acc.absent + (hcTotal - actPres),
        layout: acc.layout + (r.layoutManpower || 0),
        layoutEx: acc.layoutEx + (r.layoutExtra || 0),
        layoutTotal: acc.layoutTotal + lTotal
      };
    }, {
      super: 0, op: 0, ir: 0, hp: 0, actPres: 0, hc: 0, extra: 0, hcTotal: 0, 
      bOp: 0, bIr: 0, bHp: 0, bTotal: 0, recruit: 0, closeOp: 0, closeHpIr: 0,
      actualRecruit: 0, absent: 0, layout: 0, layoutEx: 0, layoutTotal: 0
    });
  };

  const getReasonOptions = () => {
    if (!modalType) return [];
    const deptReasons = config.hrReasons[department] || { absent: [], late: [], turnover: [], leave: [], halfDay: [] };
    switch(modalType) {
      case 'LEAVE': return deptReasons.leave;
      case 'ABSENT': return deptReasons.absent;
      case 'HALFDAY': return deptReasons.halfDay;
      case 'TURNOVER': return deptReasons.turnover;
      default: return [];
    }
  };

  return (
    <div className="space-y-4 pb-10 max-w-[1950px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/hub`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl border border-slate-800">
            <Users size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
                Manpower Registry {processType ? `(${processType})` : ''}
              </h1>
              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border tracking-widest ${
                isShiftClosed ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200 animate-pulse'
              }`}>
                {isShiftClosed ? 'Locked' : 'Live'}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 px-4">
                <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black text-slate-400 uppercase leading-none">Sync Date</span>
                    <input 
                        type="date" 
                        className="bg-transparent border-none text-[11px] font-black text-slate-900 focus:ring-0 p-0 cursor-pointer h-5"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </div>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-lg flex items-center gap-2 hover:bg-black transition-all">
              <Download size={14}/> Export
            </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden mx-2">
        <div className="max-h-[650px] overflow-auto custom-scrollbar relative">
          <table className="w-full border-collapse min-w-[1900px] table-fixed">
            <thead className="sticky top-0 z-30">
              <tr className="bg-slate-900 h-10">
                <th className="w-12 border-r border-white/10 text-white p-1 font-black uppercase tracking-tighter text-[9px] text-center sticky top-0 z-40 bg-slate-900" rowSpan={2}>Block</th>
                <th className="w-14 border-r border-white/10 text-white p-1 font-black uppercase tracking-tighter text-[9px] text-center sticky top-0 z-40 bg-slate-900" rowSpan={2}>Line</th>
                <th className="w-10 border-r border-white/10 text-white p-1 font-black uppercase tracking-tighter text-[9px] text-center sticky top-0 z-40 bg-slate-900" rowSpan={2}>S/V</th>
                <GroupHeader label="Shift Presence" color="bg-emerald-700" span={4} />
                <GroupHeader label="Registry HC" color="bg-cyan-700" span={3} />
                <GroupHeader label="Budget" color="bg-rose-700" span={4} />
                <GroupHeader label="Movement" color="bg-fuchsia-700" span={5} />
                <GroupHeader label="IE Baseline" color="bg-orange-700" span={3} />
                <GroupHeader label="Delta" color="bg-slate-800" span={3} />
              </tr>
              <tr className="bg-slate-100 text-slate-600 font-black uppercase text-[9px] border-b border-slate-200 h-8 sticky top-10 z-30 shadow-md">
                <th className="px-0.5 border-x border-slate-200 w-10">Op</th>
                <th className="px-0.5 border-x border-slate-200 w-10">IR</th>
                <th className="px-0.5 border-x border-slate-200 w-10">HP</th>
                <th className="px-0.5 border-x border-slate-200 bg-emerald-50 text-emerald-900 w-12">Pres</th>
                <th className="px-0.5 border-x border-slate-200 w-10">Base</th>
                <th className="px-0.5 border-x border-slate-200 w-10">Ex</th>
                <th className="px-0.5 border-x border-slate-200 bg-cyan-50 text-cyan-900 w-12">T. HC</th>
                <th className="px-0.5 border-x border-slate-200 w-10">OP</th>
                <th className="px-0.5 border-x border-slate-200 w-10">IR</th>
                <th className="px-0.5 border-x border-slate-200 w-10">HP</th>
                <th className="px-0.5 border-x border-slate-200 bg-rose-50 text-rose-900 w-12">Bgt</th>
                <th className="px-0.5 border-x border-slate-200 w-10">Rec</th>
                <th className="px-0.5 border-x border-slate-200 w-10">C.Op</th>
                <th className="px-0.5 border-x border-slate-200 w-10">C.Hp</th>
                <th className="px-0.5 border-x border-slate-200 bg-fuchsia-50 text-fuchsia-900 w-12">A.Rec</th>
                <th className="px-0.5 border-x border-slate-200 text-rose-600 w-10">Abs</th>
                <th className="px-0.5 border-x border-slate-200 w-10">MP</th>
                <th className="px-0.5 border-x border-slate-200 w-10">Ex</th>
                <th className="px-0.5 border-x border-slate-200 bg-orange-50 text-orange-900 w-12">T.Lay</th>
                <th className="px-0.5 border-x border-slate-200 w-10">E.HC</th>
                <th className="px-0.5 border-x border-slate-200 w-10">E.Pr</th>
                <th className="px-0.5 border-x border-slate-200 w-10">Var</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blocks.map(blockId => {
                const blockLines = visibleLines.filter(l => l.blockId === blockId);
                const totals = getBlockTotals(blockId);
                const isAlert = totals.actPres > totals.hcTotal;

                return (
                  <React.Fragment key={blockId}>
                    {blockLines.map((l, idx) => {
                      const r = records.find(rec => rec.lineId === l.lineId) || {
                        totalSupervisor: 0, presentOp: 0, presentIr: 0, presentHp: 0,
                        headCount: 0, headCountExtra: 0,
                        budgetOp: l.budgetOp || 0, budgetIr: l.budgetIr || 0, budgetHp: l.budgetHp || 0,
                        totalRecruit: 0, closeOp: 0, closeHpIr: 0, actualRecruit: 0,
                        layoutManpower: l.layoutManpower || 0,
                        layoutExtra: l.layoutExtra || 0
                      };

                      const actPres = (r.presentOp || 0) + (r.presentIr || 0) + (r.presentHp || 0);
                      const hcTotal = (r.headCount || 0) + (r.headCountExtra || 0);
                      const bTotal = (r.budgetOp || 0) + (r.budgetIr || 0) + (r.budgetHp || 0);
                      const lTotal = (r.layoutManpower || 0) + (r.layoutExtra || 0);
                      
                      const exHc = hcTotal - lTotal;
                      const exPres = actPres - lTotal;
                      const exHrpL = lTotal - bTotal;
                      
                      const actualRecruitValue = (r.totalRecruit || 0) - ((r.closeOp || 0) + (r.closeHpIr || 0));

                      return (
                        <tr key={l.lineId} className="hover:bg-blue-50 transition-colors group h-9">
                          {idx === 0 && (
                            <td rowSpan={blockLines.length + 1} className="bg-slate-200 border-r border-slate-300 text-center font-black text-[10px] uppercase tracking-tighter text-slate-600 whitespace-nowrap sticky left-0 z-10">
                              {blockId}
                            </td>
                          )}
                          <td className="border-r border-slate-200 text-center font-black text-indigo-600 text-xs bg-slate-50 group-hover:bg-indigo-50 leading-none sticky left-12 z-10">{l.lineId.split(' ')[1]}</td>
                          <td className="border-r border-slate-200 text-center">{renderInput(l.lineId, 'totalSupervisor', 'admin', r.totalSupervisor)}</td>
                          
                          <td className="border-r border-slate-200 text-center bg-emerald-50/10">{renderInput(l.lineId, 'presentOp', 'present', r.presentOp)}</td>
                          <td className="border-r border-slate-200 text-center bg-emerald-50/10">{renderInput(l.lineId, 'presentIr', 'present', r.presentIr)}</td>
                          <td className="border-r border-slate-200 text-center bg-emerald-50/10">{renderInput(l.lineId, 'presentHp', 'present', r.presentHp)}</td>
                          <td className="border-r border-slate-200 text-center font-black bg-amber-400 text-slate-900 text-sm leading-none">{actPres}</td>

                          <td className="border-r border-slate-200 text-center bg-cyan-50/10">{renderInput(l.lineId, 'headCount', 'headcount', r.headCount)}</td>
                          <td className="border-r border-slate-200 text-center bg-cyan-50/10">{renderInput(l.lineId, 'headCountExtra', 'headcount', r.headCountExtra)}</td>
                          <td className="border-r border-slate-200 text-center font-black bg-cyan-600 text-white text-sm leading-none">{hcTotal}</td>

                          <td className="border-r border-slate-200 text-center bg-rose-50/10">{renderInput(l.lineId, 'budgetOp', 'admin', r.budgetOp)}</td>
                          <td className="border-r border-slate-200 text-center bg-rose-50/10">{renderInput(l.lineId, 'budgetIr', 'admin', r.budgetIr)}</td>
                          <td className="border-r border-slate-200 text-center bg-rose-50/10">{renderInput(l.lineId, 'budgetHp', 'admin', r.budgetHp)}</td>
                          <td className="border-r border-slate-200 text-center font-black bg-slate-100 text-slate-400 text-xs leading-none">{bTotal}</td>

                          <td className="border-r border-slate-200 text-center bg-fuchsia-50/10">{renderInput(l.lineId, 'totalRecruit', 'recruit', r.totalRecruit)}</td>
                          <td className="border-r border-slate-200 text-center bg-fuchsia-50/10">{renderInput(l.lineId, 'closeOp', 'recruit', r.closeOp)}</td>
                          <td className="border-r border-slate-200 text-center bg-fuchsia-50/10">{renderInput(l.lineId, 'closeHpIr', 'recruit', r.closeHpIr)}</td>
                          <td className="border-r border-slate-200 text-center font-black bg-emerald-400 text-white text-xs leading-none">{r.totalRecruit}</td>
                          <td className="border-r border-slate-200 text-center font-black bg-fuchsia-100 text-fuchsia-900 text-xs leading-none">{actualRecruitValue}</td>

                          <td className="border-r border-slate-200 text-center bg-orange-50/10">{renderInput(l.lineId, 'layoutManpower', 'layout', r.layoutManpower)}</td>
                          <td className="border-r border-slate-200 text-center bg-orange-50/10">{renderInput(l.lineId, 'layoutExtra', 'admin', r.layoutExtra)}</td>
                          <td className="border-r border-slate-200 text-center font-black bg-slate-100 text-sm leading-none">{lTotal}</td>

                          <td className={`border-r border-slate-200 text-center font-black text-xs leading-none ${exHc > 0 ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-900'}`}>{exHc}</td>
                          <td className={`border-r border-slate-200 text-center font-black text-xs leading-none ${exPres > 0 ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-900'}`}>{exPres}</td>
                          <td className={`border-r border-slate-200 text-center font-black text-xs leading-none ${exHrpL > 0 ? 'bg-rose-200 text-rose-900' : 'bg-blue-100 text-blue-900'}`}>{exHrpL}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-900 text-white font-black h-10 border-t-2 border-slate-600 shadow-2xl sticky bottom-0 z-20">
                      <td className="border-r border-white/20 text-center uppercase tracking-tighter text-[9px] leading-none sticky left-12 z-20 bg-slate-900">Total</td>
                      <td className="border-r border-white/20 text-center text-lg leading-none">{totals.super}</td>
                      <td className="border-r border-white/20 text-center text-xs">{totals.op}</td>
                      <td className="border-r border-white/20 text-center text-xs">{totals.ir}</td>
                      <td className="border-r border-white/20 text-center text-xs">{totals.hp}</td>
                      <td className={`border-r border-white/20 text-center text-xl leading-none transition-colors duration-500 ${isAlert ? 'bg-rose-600 animate-pulse' : 'bg-emerald-700/50'}`}>
                         {totals.actPres}
                      </td>
                      <td className="border-r border-white/20 text-center text-xs">{totals.hc}</td>
                      <td className="border-r border-white/20 text-center text-xs">{totals.extra}</td>
                      <td className={`border-r border-white/20 text-center text-xl leading-none transition-colors duration-500 ${isAlert ? 'bg-rose-600 animate-pulse' : 'bg-cyan-700/50'}`}>
                         {totals.hcTotal}
                      </td>
                      <td className="border-r border-white/20 text-center text-xs">{totals.bOp}</td>
                      <td className="border-r border-white/20 text-center text-xs">{totals.bIr}</td>
                      <td className="border-r border-white/20 text-center text-xs">{totals.bHp}</td>
                      <td className="border-r border-white/20 text-center bg-rose-900/50 text-lg leading-none">{totals.bTotal}</td>
                      <td className="border-r border-white/20 text-center" colSpan={3}>
                         {isAlert && <div className="flex items-center justify-center gap-1 text-rose-300 animate-bounce uppercase text-[8px] tracking-widest font-black"><AlertTriangle size={10}/> EXCESS</div>}
                      </td>
                      <td className="border-r border-white/20 text-center bg-fuchsia-700/50 text-sm">{totals.recruit}</td>
                      <td className="border-r border-white/20 text-center bg-fuchsia-900/50 text-xl leading-none">{totals.actualRecruit}</td>
                      <td className="border-r border-white/20 text-center text-xs">{totals.layout}</td>
                      <td className="border-r border-white/20 text-center text-xs">{totals.layoutEx}</td>
                      <td className="border-r border-white/20 text-center bg-orange-700/50 text-xl leading-none">{totals.layoutTotal}</td>
                      
                      <td className="border-r border-white/20 text-center bg-slate-700 text-xs">{totals.hcTotal - totals.layoutTotal}</td>
                      <td className="border-r border-white/20 text-center bg-slate-700 text-xs">{totals.actPres - totals.layoutTotal}</td>
                      <td className="border-r border-white/20 text-center bg-slate-700 text-xs">{totals.layoutTotal - totals.bTotal}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!isShiftClosed && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 px-2">
            <button onClick={() => setModalType('LEAVE')} className="flex flex-col items-center justify-center gap-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all active:scale-95 border-b-4 border-blue-900 group">
                <Calendar size={18} className="group-hover:rotate-6 transition-transform" /> 
                <span className="text-[10px]">Leave</span>
            </button>
            <button onClick={() => setModalType('ABSENT')} className="flex flex-col items-center justify-center gap-1 bg-rose-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all active:scale-95 border-b-4 border-rose-900 group">
                <UserMinus size={18} className="group-hover:rotate-6 transition-transform" /> 
                <span className="text-[10px]">Absent</span>
            </button>
            <button onClick={() => setModalType('HALFDAY')} className="flex flex-col items-center justify-center gap-1 bg-amber-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-amber-600 transition-all active:scale-95 border-b-4 border-amber-800 group">
                <Timer size={18} className="group-hover:rotate-6 transition-transform" /> 
                <span className="text-[10px]">Half Day</span>
            </button>
            <button onClick={() => setModalType('TURNOVER')} className="flex flex-col items-center justify-center gap-1 bg-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-purple-700 transition-all active:scale-95 border-b-4 border-purple-900 group">
                <RefreshCcw size={18} className="group-hover:rotate-6 transition-transform" /> 
                <span className="text-[10px]">Turnover</span>
            </button>
        </div>
      )}

      {modalType && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-8">
          <form onSubmit={handleSaveHREntry} className="bg-white w-full max-w-lg rounded-[3rem] shadow-4xl p-10 space-y-8 animate-in zoom-in-95 duration-300 my-auto">
            <div className="flex items-center justify-between border-b-2 border-slate-50 pb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl text-white shadow-xl ${
                  modalType === 'LEAVE' ? 'bg-blue-600' : 
                  modalType === 'ABSENT' ? 'bg-rose-600' : 
                  modalType === 'HALFDAY' ? 'bg-amber-500' : 'bg-purple-600'
                }`}>
                  {modalType === 'LEAVE' && <Calendar size={20}/>}
                  {modalType === 'ABSENT' && <UserMinus size={20}/>}
                  {modalType === 'HALFDAY' && <Timer size={20}/>}
                  {modalType === 'TURNOVER' && <RefreshCcw size={20}/>}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{modalType} Entry</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Labor Movement Ledger</p>
                </div>
              </div>
              <button type="button" onClick={() => setModalType(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-300 transition-all active:scale-90"><X size={28}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Operator ID</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none" 
                    placeholder="SCAN ID..." 
                    value={hrForm.employeeId}
                    onChange={e => setHRForm({...hrForm, employeeId: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Name</label>
                <div className="relative">
                  <UserIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input readOnly className="w-full bg-slate-100 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-black text-slate-400 cursor-not-allowed" value={hrForm.employeeName} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Reason</label>
                <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 text-sm font-black text-slate-900" value={hrForm.reason} onChange={e => setHRForm({...hrForm, reason: e.target.value})}>
                  <option value="">Select...</option>
                  {getReasonOptions().map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Effective Date</label>
                <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 text-sm font-black text-slate-900" value={hrForm.date} onChange={e => setHRForm({...hrForm, date: e.target.value})} />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button type="button" onClick={() => setModalType(null)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest">Discard</button>
              <button type="submit" className="flex-[2] bg-slate-900 text-white py-4 rounded-[1.5rem] font-black text-xs uppercase shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 border-b-4 border-black">
                <Save size={18}/> Commit Registry
              </button>
            </div>
          </form>
        </div>
      )}

      {message && (
        <div className="fixed bottom-8 right-8 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl font-black flex items-center gap-3 animate-in slide-in-from-right-4 z-[300] border-2 border-emerald-500">
           <div className="bg-white/20 p-1.5 rounded-full"><CheckCircle size={20}/></div>
           <div className="flex flex-col">
              <span className="text-[10px] uppercase leading-none tracking-tight">Synchronized</span>
              <span className="text-[7px] opacity-80 mt-1 uppercase leading-none">{message}</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default ManpowerSheet;
