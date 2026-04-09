
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Hammer, Save, CheckCircle, Search, Info, Settings, Trash2, 
  ShieldCheck, Activity, PenTool as Tool, QrCode, ArrowRight, 
  ArrowLeft, Camera, X, List, LayoutGrid, Factory, Monitor, 
  Zap, AlertTriangle, RefreshCcw, Box, Check, Clock
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { DepartmentType, MachineRecord, MachineStatus, BlockConfig, AppUser, MachineAsset } from '../types';

interface MachineSheetProps {
  department: DepartmentType;
  currentUser: AppUser;
  processType?: string;
}

const ScannerOverlay: React.FC<{ 
  onScan: (serial: string) => void; 
  onClose: () => void; 
  mode: 'IN' | 'OUT';
  targetLine?: string;
}> = ({ onScan, onClose, mode, targetLine }) => {
  const [manualSerial, setManualSerial] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
        setIsCameraActive(false);
      }
    }
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSerial.trim()) onScan(manualSerial.trim());
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-[1000] flex flex-col items-center justify-center p-6 animate-in fade-in">
      <button onClick={onClose} className="absolute top-8 right-8 p-4 text-white hover:bg-white/10 rounded-full transition-all">
        <X size={32} />
      </button>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${mode === 'IN' ? 'bg-emerald-500' : 'bg-rose-500'} text-white shadow-2xl animate-pulse`}>
            <QrCode size={32} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Scan Machine {mode}
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            {mode === 'IN' ? `Assigning to ${targetLine}` : 'Removing from Production Line'}
          </p>
        </div>

        <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-[3rem] border-4 border-white/20 shadow-2xl bg-black">
          {isCameraActive ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-4">
              <Camera size={48} />
              <p className="text-xs font-bold">Camera unavailable or access restricted.</p>
            </div>
          )}
          
          <div className="absolute inset-0 border-[40px] border-black/40"></div>
          <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-scanner-line"></div>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
           <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Or Entry Serial Manually</p>
           <div className="flex gap-2">
             <input 
               autoFocus
               className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-center outline-none focus:ring-4 focus:ring-blue-500/10"
               placeholder="M-XXXX-XXXX"
               value={manualSerial}
               onChange={e => setManualSerial(e.target.value.toUpperCase())}
             />
             <button type="submit" className="bg-white text-slate-900 px-6 rounded-2xl font-black">
               <ArrowRight size={20} />
             </button>
           </div>
        </form>
      </div>
    </div>
  );
};

const MachineSheet: React.FC<MachineSheetProps> = ({ department, currentUser, processType }) => {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<BlockConfig[]>([]);
  const [allMachines, setAllMachines] = useState<MachineRecord[]>([]);
  const [selectedBlock, setSelectedBlock] = useState('Block-1');
  const [selectedLine, setSelectedLine] = useState('');
  const [scannerMode, setScannerMode] = useState<'IN' | 'OUT' | null>(null);
  const [message, setMessage] = useState('');

  const config = useMemo(() => mockDb.getSystemConfig(), []);
  
  useEffect(() => {
    setBlocks(mockDb.getBlocks());
    setAllMachines(mockDb.getMachines(department));
  }, [department]);

  useEffect(() => {
    const lines = config.lineMappings.filter(m => m.blockId === selectedBlock && m.sectionId === department);
    if (lines.length > 0) {
      if (!selectedLine || !lines.some(l => l.lineId === selectedLine)) {
        setSelectedLine(lines[0].lineId);
      }
    } else {
      setSelectedLine('');
    }
  }, [selectedBlock, department, config.lineMappings, selectedLine]);

  const lineInventory = useMemo(() => {
    return allMachines.filter(m => m.lineId === selectedLine);
  }, [allMachines, selectedLine]);

  const categorySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    lineInventory.forEach(m => {
      summary[m.machineType] = (summary[m.machineType] || 0) + 1;
    });
    return Object.entries(summary).sort((a,b) => b[1] - a[1]);
  }, [lineInventory]);

  const handleScanComplete = (serial: string) => {
    if (scannerMode === 'IN') {
      if (!selectedLine) { alert("Select a target line first."); return; }
      
      const existing = allMachines.find(m => m.serialNumber === serial);
      const newRec: MachineRecord = {
        id: existing?.id || Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        department,
        blockId: selectedBlock,
        lineId: selectedLine,
        machineType: existing?.machineType || 'Generic Machine',
        serialNumber: serial,
        status: existing?.status || MachineStatus.WORKING,
        reporterId: currentUser.id,
        timestamp: new Date().toISOString()
      };
      
      mockDb.saveMachine(newRec);

      // Also update Registry Asset for Fleet Summary sync
      const sysConfig = mockDb.getSystemConfig();
      const updatedAssets = sysConfig.machineAssets.map(a => a.asset === serial ? { ...a, lineId: selectedLine } : a);
      mockDb.saveSystemConfig({ ...sysConfig, machineAssets: updatedAssets });

      setMessage(`Machine ${serial} assigned to ${selectedLine}.`);
    } else {
      const existing = allMachines.find(m => m.serialNumber === serial);
      if (existing) {
        const updated: MachineRecord = {
          ...existing,
          lineId: 'UNASSIGNED',
          blockId: 'CENTRAL_POOL',
          timestamp: new Date().toISOString()
        };
        mockDb.saveMachine(updated);

        // Also update Registry Asset
        const sysConfig = mockDb.getSystemConfig();
        const updatedAssets = sysConfig.machineAssets.map(a => a.asset === serial ? { ...a, lineId: '' } : a);
        mockDb.saveSystemConfig({ ...sysConfig, machineAssets: updatedAssets });

        setMessage(`Machine ${serial} removed from production.`);
      } else {
        alert("Machine serial not found in registry.");
      }
    }

    setScannerMode(null);
    setAllMachines(mockDb.getMachines(department));
    setTimeout(() => setMessage(''), 3000);
  };

  const updateMachineStatus = (serial: string, newStatus: MachineStatus) => {
    const machine = allMachines.find(m => m.serialNumber === serial);
    if (machine) {
      const updated = { ...machine, status: newStatus, timestamp: new Date().toISOString() };
      mockDb.saveMachine(updated);
      setAllMachines(mockDb.getMachines(department));

      // Sync status with registry
      const sysConfig = mockDb.getSystemConfig();
      let registryStatus: MachineAsset['status'] = 'Operational';
      if (newStatus === MachineStatus.BREAKDOWN || newStatus === MachineStatus.UNDER_MAINTENANCE) {
        registryStatus = 'Under repair';
      }
      const updatedAssets = sysConfig.machineAssets.map(a => a.asset === serial ? { ...a, status: registryStatus } : a);
      mockDb.saveSystemConfig({ ...sysConfig, machineAssets: updatedAssets });
    }
  };

  return (
    <div className="space-y-10 pb-20 max-w-[1700px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/${department.toLowerCase()}/hub`)} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg">
            <Hammer size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
              Machine Registry {processType ? `(${processType})` : ''}
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Industrial Engineering Department</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={() => setScannerMode('OUT')} className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-rose-700 transition-all active:scale-95 flex items-center gap-2">
             <ArrowLeft size={18}/> Machine OUT
           </button>
           <button onClick={() => setScannerMode('IN')} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2">
             <ArrowRight size={18}/> Machine IN
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-6 h-fit">
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Active Block</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black" value={selectedBlock} onChange={e => setSelectedBlock(e.target.value)}>
                    {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Target Line</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black" value={selectedLine} onChange={e => setSelectedLine(e.target.value)}>
                    {config.lineMappings.filter(m => m.blockId === selectedBlock && m.sectionId === department).map(l => <option key={l.lineId} value={l.lineId}>{l.lineId}</option>)}
                  </select>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Machine Fleet Mix</h3>
               <div className="space-y-2">
                  {categorySummary.map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                       <span className="text-[10px] font-black text-slate-500 uppercase">{type}</span>
                       <span className="text-sm font-black text-slate-900">{count}</span>
                    </div>
                  ))}
                  {categorySummary.length === 0 && <p className="text-[10px] text-slate-400 italic">No machines assigned to this line.</p>}
               </div>
            </div>
         </div>

         <div className="xl:col-span-3 bg-white rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[600px]">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-900 uppercase">Line Inventory Registry</h3>
               <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black">{lineInventory.length} Units Assigned</span>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                        <th className="px-8 py-5">Serial No</th>
                        <th className="px-6 py-5">Machine Type</th>
                        <th className="px-6 py-5 text-center">Status</th>
                        <th className="px-6 py-5">Last Movement</th>
                        <th className="px-10 py-5 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {lineInventory.map(m => (
                        <tr key={m.serialNumber} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:text-indigo-600 transition-colors"><QrCode size={18}/></div>
                                 <span className="text-sm font-black text-slate-900">{m.serialNumber}</span>
                              </div>
                           </td>
                           <td className="px-6 py-6"><span className="text-xs font-bold text-slate-500 uppercase">{m.machineType}</span></td>
                           <td className="px-6 py-6 text-center">
                              <select 
                                className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-all ${
                                  m.status === MachineStatus.WORKING ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                  m.status === MachineStatus.BREAKDOWN ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 
                                  'bg-amber-50 text-amber-600 border-amber-100'
                                }`}
                                value={m.status}
                                onChange={e => updateMachineStatus(m.serialNumber, e.target.value as MachineStatus)}
                              >
                                 {Object.values(MachineStatus).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </td>
                           <td className="px-6 py-6">
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">{m.date}</span>
                                 <span className="text-[9px] text-slate-300 font-mono">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                              </div>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <button onClick={() => handleScanComplete(m.serialNumber)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                           </td>
                        </tr>
                     ))}
                     {lineInventory.length === 0 && <tr><td colSpan={5} className="py-40 text-center opacity-30 italic"><Box size={48} className="mx-auto mb-4" /><p className="text-xl font-black text-slate-400">Line is currently vacant</p></td></tr>}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {scannerMode && (
        <ScannerOverlay 
          mode={scannerMode} 
          targetLine={selectedLine} 
          onScan={handleScanComplete} 
          onClose={() => setScannerMode(null)} 
        />
      )}

      {message && (
        <div className="fixed bottom-12 right-12 p-8 bg-emerald-600 text-white rounded-[2.5rem] shadow-4xl font-black flex items-center gap-4 animate-in slide-in-from-right-10 z-[1100] border-4 border-white">
           <div className="bg-white/20 p-2 rounded-full"><CheckCircle size={32}/></div>
           <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default MachineSheet;
