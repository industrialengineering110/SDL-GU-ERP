import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, Users, Hammer, 
  Activity, Zap, Info, ShieldCheck, Database,
  ChevronRight, ArrowUpRight, Scale, Boxes, Cpu, Clock, Filter,
  Layers, Briefcase, Settings2, Monitor, Wrench, Save, Trash2, Plus, PlusCircle, Target,
  CheckCircle, ShieldAlert, SquareUser, RefreshCcw, Search, 
  QrCode, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Edit, List, 
  Layout as LayoutIcon, Calendar, UserX, Timer, FileSpreadsheet as ExcelIcon,
  ChevronDown, GraduationCap, Gauge, Presentation, Check,
  UserPlus, Minus, X, PieChart, MoreHorizontal, ClipboardList, BookOpen, LayoutList, LineChart, FileText,
  Flame, ListTodo, CircleCheck, MousePointer2, Palette, Hash, Shirt, Book, Award, UserMinus, FileStack,
  Star, FlaskConical
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { 
  SystemConfig, ManpowerBudgetEntry, ManpowerStatusEntry, DepartmentType
} from '../types';
import LayoutMaster from './LayoutMaster';
import LayoutBank from './LayoutBank';
import ProcessRegistry from './ProcessRegistry';
import SewingThreadAnalysis from '../components/SewingThreadAnalysis';
import SOPForm from '../components/SOPForm';
import { useGlobal } from '../App';

const DepartmentDropdown = React.memo(({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) => (
  <div className="space-y-1 w-full mb-4 animate-in slide-in-from-top-2 duration-300 px-1">
    <label className="text-[9px] font-black text-foreground uppercase tracking-widest px-1 flex items-center gap-2">
      <Building size={11} className="text-primary" /> {label}
    </label>
    <div className="relative group max-w-xs">
      <select 
        className="w-full bg-card border border-border rounded-xl px-4 py-1.5 text-[11px] font-black text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer appearance-none shadow-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  </div>
));

const Building = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path></svg>;

const ManagementCard = ({ title, sub, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-card p-5 rounded-[2rem] border border-border shadow-sm hover:shadow-2xl hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between h-full min-h-[180px]"
  >
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-xl ${color} text-white shadow-lg group-hover:scale-105 transition-transform`}>
        <Icon size={20} />
      </div>
      <div className="bg-accent p-1.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
        <ChevronRight size={14} />
      </div>
    </div>
    <div>
      <h4 className="text-[11px] font-black text-foreground uppercase tracking-tighter mb-0.5 leading-none">{title}</h4>
      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{sub}</p>
    </div>
  </div>
);

const SubModuleCard = ({ title, sub, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-card p-6 rounded-[2.5rem] border-2 border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer group flex flex-col gap-4 relative overflow-hidden"
  >
    <div className={`absolute -right-4 -bottom-4 w-20 h-20 ${color} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
    <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}>
        <Icon size={24} />
    </div>
    <div>
        <h4 className="text-[12px] font-black text-foreground uppercase tracking-tight mb-1">{title}</h4>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-tight line-clamp-2">{sub}</p>
    </div>
    <div className="mt-2 flex items-center gap-1.5 text-[8px] font-black text-primary uppercase opacity-0 group-hover:opacity-100 transition-all">
        Launch View <ArrowRight size={10} />
    </div>
  </div>
);

const FactoryAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useGlobal();
  const [activeModule, setActiveModule] = useState<'DASHBOARD' | 'MACHINE' | 'IE' | 'SOP' | 'PRE_PROD_SOP'>('DASHBOARD');
  const [ieSub, setIeSub] = useState<'MENU' | 'PROCESS' | 'LAYOUT' | 'CURVE' | 'BANK' | 'THREAD'>('MENU');
  const [preProdSub, setPreProdSub] = useState<'MENU' | 'FABRIC' | 'SAMPLE' | 'SIZE_SET'>('MENU');
  
  const [config, setConfig] = useState(mockDb.getSystemConfig());
  const [selectedDept, setSelectedDept] = useState('Sewing');
  
  const [machineTab, setMachineTab] = useState<'STATUS' | 'BUDGET'>('STATUS');

  const [message, setMessage] = useState('');

  const handleConfigUpdate = useCallback((key: keyof SystemConfig, value: any) => {
    setConfig(prev => {
      const updated = { ...prev, [key]: value };
      mockDb.saveSystemConfig(updated);
      return updated;
    });
  }, []);

  const machineAnalysis = useMemo(() => {
    const assets = config.machineAssets || [];
    const operational = assets.filter(m => m.status === 'Operational').length;
    const running = assets.filter(m => m.lineId).length;
    const repair = assets.filter(m => m.status === 'Under repair').length;
    const disposal = assets.filter(m => m.status === 'Disposal').length;
    return { total: assets.length, operational, running, repair, disposal, idle: assets.length - running };
  }, [config.machineAssets]);

  return (
    <div className="space-y-4 pb-20 max-w-[1800px] mx-auto animate-in fade-in duration-700 px-4">
      {/* HEADER SECTION */}
      {ieSub !== 'LAYOUT' && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl">
              {activeModule === 'DASHBOARD' ? <BarChart3 size={24} /> : (
                  <ArrowLeft 
                      size={24} 
                      className="cursor-pointer" 
                      onClick={() => { 
                          if(activeModule === 'IE' && ieSub !== 'MENU') setIeSub('MENU'); 
                          else if(activeModule === 'PRE_PROD_SOP' && preProdSub !== 'MENU') setPreProdSub('MENU');
                          else setActiveModule('DASHBOARD'); 
                      }} 
                  />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-[1000] tracking-tighter uppercase italic leading-none text-foreground">
                  {activeModule === 'DASHBOARD' ? 'FACTORY ANALYSIS' : activeModule === 'PRE_PROD_SOP' ? 'PRE-PRODUCTION SOP' : `${activeModule} MODULE`}
              </h1>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'DASHBOARD' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <ManagementCard title="IE Process Lab" sub="Industrial Engineering" icon={Monitor} color="bg-indigo-600" onClick={() => setActiveModule('IE')} />
            <ManagementCard title="Pre-production SOP" sub="Fabric, Sample, Size-Set" icon={PlusCircle} color="bg-emerald-600" onClick={() => setActiveModule('PRE_PROD_SOP')} />
        </div>
      )}

      {/* --- PRE-PRODUCTION SOP MODULE --- */}
      {activeModule === 'PRE_PROD_SOP' && preProdSub === 'MENU' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <ManagementCard title="Fabric Process SOP" sub="Fabric SOP" icon={Layers} color="bg-blue-600" onClick={() => setPreProdSub('FABRIC')} />
            <ManagementCard title="Sample SOP" sub="Sample SOP" icon={Layers} color="bg-blue-600" onClick={() => setPreProdSub('SAMPLE')} />
            <ManagementCard title="Size-Set & Pilot SOP" sub="Size-Set & Pilot SOP" icon={Layers} color="bg-blue-600" onClick={() => setPreProdSub('SIZE_SET')} />
        </div>
      )}
      {activeModule === 'PRE_PROD_SOP' && preProdSub !== 'MENU' && (
        <SOPForm 
          type={preProdSub === 'FABRIC' ? 'Fabric' : preProdSub === 'SAMPLE' ? 'Sample' : 'SizeSetPilot'} 
          onSave={() => { setMessage('SOP Saved!'); setPreProdSub('MENU'); }} 
          onCancel={() => setPreProdSub('MENU')} 
        />
      )}

      {/* --- IE MODULE --- */}
      {activeModule === 'IE' && ieSub === 'MENU' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <DepartmentDropdown label="IE METRICS FOCUS (DEPARTMENT)" options={config.sections} value={selectedDept} onChange={setSelectedDept} />
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ManagementCard title="PROCESS LIST" sub="Technical SMV registry" icon={List} color="bg-blue-600" onClick={() => setIeSub('PROCESS')} />
              <ManagementCard title="LAYOUT REGISTRY" sub="Operation breakdown hub" icon={LayoutIcon} color="bg-emerald-600" onClick={() => setIeSub('LAYOUT')} />
              <ManagementCard title="SEWING THREAD" sub="Consumption & Ratio Analysis" icon={FlaskConical} color="bg-violet-600" onClick={() => setIeSub('THREAD')} />
              <ManagementCard title="LEARNING CURVE" sub="Efficiency ramp-up matrix" icon={TrendingUp} color="bg-amber-500/10" onClick={() => setIeSub('CURVE')} />
           </div>
        </div>
      )}

      {activeModule === 'IE' && ieSub === 'PROCESS' && (
        <div className="animate-in zoom-in-95 duration-500">
           <ProcessRegistry 
             department={selectedDept as DepartmentType} 
             currentUser={currentUser!} 
             onBack={() => setIeSub('MENU')}
           />
        </div>
      )}

      {activeModule === 'IE' && ieSub === 'CURVE' && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
           <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
              <div className="p-4 border-b border-border bg-accent/50 flex items-center justify-between">
                 <div className="flex items-center gap-3"><TrendingUp size={16} className="text-foreground"/><h3 className="text-sm font-black uppercase leading-none text-foreground">Learning Curve Matrix Editor</h3></div>
                 <button 
                   onClick={() => {
                       const current = config.learningCurve[selectedDept] || [];
                       const updated = [...current, { label: 'New', min: 0, max: 0, curve: [0, 0, 0, 0, 0, 0, 0] }];
                       handleConfigUpdate('learningCurve', { ...config.learningCurve, [selectedDept]: updated });
                   }}
                   className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                 >
                   Add Group
                 </button>
              </div>
              <div className="max-h-[600px] overflow-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-10">
                       <tr className="bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest h-10">
                          <th className="px-4 py-2 border-r border-primary-foreground/10 w-20">Group</th>
                          <th className="px-4 py-2 border-r border-primary-foreground/10 w-32">Min SMV</th>
                          <th className="px-4 py-2 border-r border-primary-foreground/10 w-32">Max SMV</th>
                          {[1,2,3,4,5,6,7].map(d => <th key={d} className="px-4 py-2 border-r border-primary-foreground/10 text-center">Day {d} (%)</th>)}
                          <th className="px-4 py-2 text-center">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-bold text-muted-foreground text-[10px]">
                       {(config.learningCurve[selectedDept] || []).map((g, i) => (
                         <tr key={i} className="h-10 hover:bg-accent transition-colors">
                            <td className="px-4 border-r border-border">
                               <input 
                                 className="w-full bg-transparent border-none font-black text-primary p-0 focus:ring-0"
                                 value={g.label}
                                 onChange={e => {
                                     const updated = [...(config.learningCurve[selectedDept] || [])];
                                     updated[i] = { ...g, label: e.target.value };
                                     handleConfigUpdate('learningCurve', { ...config.learningCurve, [selectedDept]: updated });
                                 }}
                               />
                            </td>
                            <td className="px-4 border-r border-border">
                               <input 
                                 type="number"
                                 className="w-full bg-transparent border-none font-black p-0 focus:ring-0 text-foreground"
                                 value={g.min}
                                 onChange={e => {
                                     const updated = [...(config.learningCurve[selectedDept] || [])];
                                     updated[i] = { ...g, min: parseFloat(e.target.value) || 0 };
                                     handleConfigUpdate('learningCurve', { ...config.learningCurve, [selectedDept]: updated });
                                 }}
                               />
                            </td>
                            <td className="px-4 border-r border-border">
                               <input 
                                 type="number"
                                 className="w-full bg-transparent border-none font-black p-0 focus:ring-0 text-foreground"
                                 value={g.max}
                                 onChange={e => {
                                     const updated = [...(config.learningCurve[selectedDept] || [])];
                                     updated[i] = { ...g, max: parseFloat(e.target.value) || 0 };
                                     handleConfigUpdate('learningCurve', { ...config.learningCurve, [selectedDept]: updated });
                                 }}
                               />
                            </td>
                            {g.curve.map((eff, idx) => (
                               <td key={idx} className="px-4 border-r border-border">
                                  <input 
                                    type="number"
                                    className="w-full bg-transparent border-none font-black text-center p-0 focus:ring-0 text-foreground"
                                    value={eff}
                                    onChange={e => {
                                        const updated = [...(config.learningCurve[selectedDept] || [])];
                                        const newCurve = [...g.curve];
                                        newCurve[idx] = parseInt(e.target.value) || 0;
                                        updated[i] = { ...g, curve: newCurve };
                                        handleConfigUpdate('learningCurve', { ...config.learningCurve, [selectedDept]: updated });
                                    }}
                                  />
                               </td>
                            ))}
                            <td className="px-4 text-center">
                               <button 
                                 onClick={() => {
                                     const updated = (config.learningCurve[selectedDept] || []).filter((_, idx) => idx !== i);
                                     handleConfigUpdate('learningCurve', { ...config.learningCurve, [selectedDept]: updated });
                                 }}
                                 className="text-rose-500 hover:text-rose-700 transition-colors"
                               >
                                 <X size={14} />
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {activeModule === 'IE' && ieSub === 'LAYOUT' && (
        <div className="animate-in zoom-in-95 duration-500">
           <LayoutMaster 
             department={selectedDept as DepartmentType} 
             currentUser={currentUser!} 
             isTemplateMode={true} 
             onBack={() => setIeSub('MENU')}
           />
        </div>
      )}

      {activeModule === 'IE' && ieSub === 'BANK' && (
        <div className="animate-in zoom-in-95 duration-500">
           <LayoutBank 
             department={selectedDept as DepartmentType} 
             currentUser={currentUser!} 
             onBack={() => setIeSub('MENU')}
           />
        </div>
      )}

      {activeModule === 'IE' && ieSub === 'THREAD' && (
        <div className="animate-in zoom-in-95 duration-500">
           <SewingThreadAnalysis />
        </div>
      )}

      {/* FEEDBACK NOTIFICATION */}
      {message && <div className="fixed bottom-8 right-8 p-4 bg-emerald-600 text-white rounded-2xl shadow-4xl font-black z-[1200] animate-in slide-in-from-right-5 border-2 border-white flex items-center gap-2.5 text-xs"><CheckCircle size={18}/> {message}</div>}
    </div>
  );
};

export default FactoryAnalytics;