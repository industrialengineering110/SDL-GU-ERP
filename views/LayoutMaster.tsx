
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Save, Printer, ArrowLeft, Plus, Trash2, Info, CheckCircle, RefreshCcw, Sparkles, FolderOpen, Edit3, ChevronRight, Layout, BookOpen, AlertTriangle,
  Maximize2, Minimize2, RotateCcw, Search, ChevronDown
} from 'lucide-react';
import ZoomWrapper from '../components/ZoomWrapper';
import { mockDb } from '../services/mockDb';
import { 
  DepartmentType, AppUser, StyleConfirmation, ProcessConfig, 
  LayoutMasterRecord, LayoutMasterOperation, LayoutTemplate, LearningCurveGroup 
} from '../types';
import Logo from '../components/Logo';

const SearchableSelect: React.FC<{
  value: string;
  options: { id: string; name: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
  isInvalid?: boolean;
}> = ({ value, options, onChange, placeholder = "Search...", isInvalid }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full h-full min-h-[36px]" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-2 py-2 cursor-pointer h-full w-full ${isInvalid && value === 'Select Operation' ? 'text-white' : 'text-slate-900'}`}
      >
        <span className="truncate font-bold text-[13px]">{value}</span>
        <ChevronDown size={14} className="opacity-40 flex-shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[250px] bg-card border-2 border-border shadow-2xl z-[1000] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 no-print">
          <div className="p-2 border-b border-border bg-muted flex items-center gap-2">
            <Search size={14} className="text-muted-foreground" />
            <input 
              autoFocus
              className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold p-1 text-foreground"
              placeholder={placeholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.name);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`px-3 py-2 text-xs font-bold cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${value === opt.name ? 'bg-accent text-accent-foreground' : 'text-foreground'}`}
                >
                  {opt.name}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-[10px] italic text-muted-foreground">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LayoutHeaderChart: React.FC<{ 
  record: any, 
  workstationSummary: any, 
  totalSMV: number, 
  efficiency: number, 
  learningCurve: LearningCurveGroup[],
  productCategories: string[],
  buyers: string[],
  stylesForBuyer: string[],
  currentUser: AppUser,
  isTemplateMode: boolean,
  existingTemplates: LayoutTemplate[],
  onUpdateTargetHr: (val: number) => void,
  onUpdateGarmentType: (val: string) => void,
  onUpdateTemplateName: (val: string) => void,
  onUpdateField: (field: string, value: any) => void,
  errors?: string[]
}> = ({ 
  record, 
  workstationSummary, 
  totalSMV, 
  efficiency, 
  learningCurve, 
  productCategories,
  buyers,
  stylesForBuyer,
  currentUser,
  isTemplateMode,
  existingTemplates,
  onUpdateTargetHr,
  onUpdateGarmentType,
  onUpdateTemplateName,
  onUpdateField,
  errors = []
}) => {
  const target10 = (record.targetHr || 0) * 10;
  const pitchTime = totalSMV / (workstationSummary.total || 1);
  const balanceLoss = 100 - efficiency;

  // Find appropriate learning curve based on SMV
  const curveGroup = learningCurve.find(g => totalSMV >= g.min && totalSMV <= g.max) || learningCurve[0] || { curve: [] };
  
  const getCurveTarget = (pct: number) => {
    if (!record.targetHr || !efficiency) return 0;
    const target100 = record.targetHr / (efficiency / 100);
    return Math.round((target100 * pct) / 100);
  };

  const isError = (field: string) => errors.includes(field);

  return (
    <div className="grid grid-cols-4 gap-4 mb-8 text-foreground">
      {/* Basic Info */}
      <div className="border-2 border-foreground divide-y-2 divide-foreground">
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Buyer:</div>
          <div className={`p-0 font-black text-[11px] text-center flex items-center ${isError('buyer') ? 'bg-destructive text-destructive-foreground' : ''}`}>
            <select 
              className={`w-full h-full bg-transparent border-none focus:ring-0 text-center font-black text-[11px] cursor-pointer ${isError('buyer') ? 'text-destructive-foreground' : 'text-foreground'}`}
              value={record.buyer}
              onChange={e => onUpdateField('buyer', e.target.value)}
            >
              <option value="" className="text-foreground bg-card">Select...</option>
              {buyers.map(b => <option key={b} value={b} className="text-foreground bg-card">{b}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Style:</div>
          <div className={`p-0 font-black text-[11px] text-center flex items-center ${isError('style') ? 'bg-destructive text-destructive-foreground' : ''}`}>
            <select 
              className={`w-full h-full bg-transparent border-none focus:ring-0 text-center font-black text-[11px] cursor-pointer ${isError('style') ? 'text-destructive-foreground' : 'text-foreground'}`}
              value={record.style}
              onChange={e => onUpdateField('style', e.target.value)}
            >
              <option value="" className="text-foreground bg-card">Select...</option>
              {stylesForBuyer.map(s => <option key={s} value={s} className="text-foreground bg-card">{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Description:</div>
          <div className={`p-0 font-black text-[11px] text-center flex items-center ${isError('garmentType') ? 'bg-destructive text-destructive-foreground' : ''}`}>
            <select 
              className={`w-full h-full bg-transparent border-none focus:ring-0 text-center font-black text-[11px] cursor-pointer ${isError('garmentType') ? 'text-destructive-foreground' : 'text-foreground'}`}
              value={record.garmentType}
              onChange={e => onUpdateGarmentType(e.target.value)}
            >
              {productCategories.map(c => <option key={c} value={c} className="text-foreground bg-card">{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-amber-400 dark:bg-amber-600 border-r-2 border-foreground">Approx Input date:</div>
          <div className={`p-0 font-black text-[11px] text-center flex items-center ${isError('approxInputDate') ? 'bg-destructive text-destructive-foreground' : ''}`}>
            <input 
              type="date"
              className={`w-full h-full bg-transparent border-none focus:ring-0 text-center font-black text-[11px] ${isError('approxInputDate') ? 'text-destructive-foreground' : 'text-foreground'}`}
              value={record.approxInputDate}
              onChange={e => onUpdateField('approxInputDate', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Line No:</div>
          <div className={`p-0 font-black text-[11px] text-center flex items-center ${isError('lineNo') ? 'bg-destructive text-destructive-foreground' : ''}`}>
            <input 
              className={`w-full h-full bg-transparent border-none focus:ring-0 text-center font-black text-[11px] ${isError('lineNo') ? 'text-destructive-foreground' : 'text-foreground'}`}
              value={record.lineNo}
              onChange={e => onUpdateField('lineNo', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Order Qty:</div>
          <div className={`p-0 font-black text-[11px] text-center flex items-center ${isError('orderQty') ? 'bg-destructive text-destructive-foreground' : ''}`}>
            <input 
              type="number"
              className={`w-full h-full bg-transparent border-none focus:ring-0 text-center font-black text-[11px] ${isError('orderQty') ? 'text-destructive-foreground' : 'text-foreground'}`}
              value={record.orderQty}
              onChange={e => onUpdateField('orderQty', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Template Label:</div>
          <div className={`p-0 font-black text-[11px] text-center flex items-center ${isError('templateName') ? 'bg-destructive text-destructive-foreground' : ''}`}>
            {!isTemplateMode ? (
              <SearchableSelect 
                value={record.templateName || "Select Template..."}
                options={existingTemplates
                  .filter(t => t.garmentType === record.garmentType)
                  .map(t => ({ id: t.id, name: t.name }))}
                onChange={val => onUpdateTemplateName(val)}
                placeholder="Search Template..."
                isInvalid={isError('templateName')}
              />
            ) : (
              <input 
                className={`w-full h-full bg-transparent border-none focus:ring-0 text-center font-black text-[11px] ${isError('templateName') ? 'text-destructive-foreground placeholder-destructive-foreground/50' : 'text-foreground placeholder-muted-foreground'}`}
                placeholder="e.g. 5-Pocket Basic"
                value={record.templateName}
                onChange={e => onUpdateTemplateName(e.target.value)}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Remarks:</div>
          <div className="p-0 font-black text-[11px] text-center flex items-center">
            <input 
              className="w-full h-full bg-transparent border-none focus:ring-0 text-center font-black text-[11px] text-foreground"
              placeholder="Layout remarks..."
              value={record.remarks}
              onChange={e => onUpdateField('remarks', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Target & Efficiency */}
      <div className="border-2 border-foreground divide-y-2 divide-foreground">
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Target/Hr:</div>
          <div className="p-0 font-[1000] text-sm text-center flex items-center justify-center">
            <input 
              type="number" 
              className="w-full h-full text-center bg-transparent border-none focus:ring-0 font-[1000] text-sm text-foreground"
              value={record.targetHr}
              onChange={e => onUpdateTargetHr(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Tgt/10hrs:</div>
          <div className="p-2 font-[1000] text-sm text-center">{target10}</div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">SMV:</div>
          <div className="p-2 font-[1000] text-sm text-center">{totalSMV.toFixed(2)}</div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Efficiency:</div>
          <div className="p-2 font-[1000] text-sm text-center">{Math.round(efficiency)}%</div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Pitch Time:</div>
          <div className="p-2 font-[1000] text-sm text-center">{pitchTime.toFixed(2)}</div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-2 font-black text-[11px] bg-muted border-r-2 border-foreground">Prepared By:</div>
          <div className="p-2 font-black text-[11px] text-center truncate">{currentUser.name}</div>
        </div>
      </div>

      {/* Workstation Details */}
      <div className="space-y-4">
        <div className="border-2 border-foreground divide-y-2 divide-foreground">
          <div className="p-1 text-center font-black text-[10px] bg-muted uppercase tracking-tighter">Workstation Details</div>
          <div className="grid grid-cols-2">
            <div className="p-2 font-black text-[11px] border-r-2 border-foreground">Operators:</div>
            <div className="p-2 font-[1000] text-sm text-center">{workstationSummary.ops}</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="p-2 font-black text-[11px] border-r-2 border-foreground">CPU Operators:</div>
            <div className="p-2 font-[1000] text-sm text-center">{workstationSummary.cpu}</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="p-2 font-black text-[11px] border-r-2 border-foreground">Helpers:</div>
            <div className="p-2 font-[1000] text-sm text-center">{workstationSummary.helpers}</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="p-2 font-black text-[11px] border-r-2 border-foreground">Iron Man:</div>
            <div className="p-2 font-[1000] text-sm text-center">{workstationSummary.iron}</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="p-2 font-black text-[11px] border-r-2 border-foreground">Total Man:</div>
            <div className="p-2 font-[1000] text-sm text-center">{workstationSummary.total}</div>
          </div>
        </div>
        <div className="border-2 border-foreground p-2 text-center">
          <div className="text-[10px] font-black uppercase">Layout Balance loss</div>
          <div className="text-xl font-[1000]">{balanceLoss.toFixed(2)}%</div>
        </div>
      </div>

      {/* Learning Curve */}
      <div className="border-2 border-foreground divide-y-2 divide-foreground">
        <div className="p-1 text-center font-black text-[10px] bg-muted uppercase tracking-tighter">Learning Curve</div>
        {[100, 90, 85, 80, 75, 70, 65, 60].map(pct => (
          <div key={pct} className="grid grid-cols-2">
            <div className="p-1.5 font-black text-[11px] text-center border-r-2 border-foreground">{pct}%</div>
            <div className="p-1.5 font-[1000] text-sm text-center">{getCurveTarget(pct)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LayoutMasterProps {
  department: DepartmentType;
  currentUser: AppUser;
  isTemplateMode?: boolean; 
  onBack?: () => void;
}

const LayoutMaster: React.FC<LayoutMasterProps> = ({ department, currentUser, isTemplateMode = false, onBack }) => {
  const navigate = useNavigate();
  const [styleConfirmations, setStyleConfirmations] = useState<StyleConfirmation[]>([]);
  const [availableProcesses, setAvailableProcesses] = useState<ProcessConfig[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [learningCurve, setLearningCurve] = useState<LearningCurveGroup[]>([]);
  const [existingTemplates, setExistingTemplates] = useState<LayoutTemplate[]>([]);
  const [garmentParts, setGarmentParts] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [headerErrors, setHeaderErrors] = useState<string[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [originalSmvs, setOriginalSmvs] = useState<Record<string, number>>({});
  const reportRef = React.useRef<HTMLDivElement>(null);

  // Local State for current working document
  const [record, setRecord] = useState<Partial<LayoutMasterRecord & { templateName: string, garmentType: string }>>({
    templateName: '',
    garmentType: '5-Pocket',
    productCategory: '5-Pocket',
    remarks: '',
    preparedDate: new Date().toISOString().split('T')[0],
    buyer: '',
    style: '',
    description: '',
    approxInputDate: '',
    lineNo: '',
    orderQty: 0,
    targetHr: 162,
    efficiency: 0,
    operations: [
      { id: '1', operationId: '', operationName: 'Select Operation', part: 'Back Part', smv: 0, mcType: '', folderAttachment: '', needle: '', actualMan: 1, actualMc: 1, remarks: '', balanceWithId: '' }
    ]
  });

  useEffect(() => {
    const config = mockDb.getSystemConfig();
    setStyleConfirmations(mockDb.getStyleConfirmations());
    setAvailableProcesses(config.processConfigs[department] || []);
    setProductCategories(config.productCategories || []);
    setGarmentParts(config.garmentParts || []);
    setExistingTemplates(mockDb.getLayoutTemplates(department));
    
    // Flatten learning curve data
    const curves: LearningCurveGroup[] = [];
    Object.values(config.learningCurve).forEach(groupList => {
      curves.push(...groupList);
    });
    setLearningCurve(curves);
  }, [department]);

  const buyers = useMemo(() => Array.from(new Set(styleConfirmations.map(c => c.buyer))).sort(), [styleConfirmations]);
  const stylesForBuyer = useMemo(() => styleConfirmations.filter(c => c.buyer === record.buyer).map(c => c.styleNumber).sort(), [styleConfirmations, record.buyer]);

  const totalSMV = useMemo(() => (record.operations || []).reduce((s, o) => s + (o.smv || 0), 0), [record.operations]);
  
  const workstationSummary = useMemo(() => {
    let ops = 0, helpers = 0, iron = 0, cpu = 0;
    (record.operations || []).forEach(op => {
      const mc = (op.mcType || '').toUpperCase();
      const actual = op.actualMan || 0;
      if (mc.includes('HELPER')) helpers += actual;
      else if (mc.includes('IRON') || mc.includes('PRESS')) iron += actual;
      else if (mc.includes('CPU')) cpu += actual;
      else ops += actual;
    });
    return { ops, helpers, iron, cpu, total: ops + helpers + iron + cpu };
  }, [record.operations]);

  const groupedOperations = useMemo(() => {
    const groups: { [key: string]: LayoutMasterOperation[] } = {};
    (record.operations || []).forEach(op => {
      const part = op.part || 'Other';
      if (!groups[part]) groups[part] = [];
      groups[part].push(op);
    });
    return groups;
  }, [record.operations]);

  const efficiency = useMemo(() => {
    const target = record.targetHr || 0;
    const totalMan = workstationSummary.total || 1;
    if (target === 0 || totalSMV === 0) return 0;
    return ((target * totalSMV) / (totalMan * 60)) * 100;
  }, [record.targetHr, totalSMV, workstationSummary.total]);

  // Behavior: Load Demo Layout when Product Category changes (In Live Mode)
  const handleCategoryChange = (cat: string) => {
    setRecord(prev => ({ ...prev, garmentType: cat, productCategory: cat, templateName: '' }));
    if (!isTemplateMode) {
      const templates = mockDb.getLayoutTemplates(department);
      const matchingTemplates = templates.filter(t => t.garmentType === cat);
      
      if (matchingTemplates.length > 0) {
        // Load the first one by default
        const firstTemplate = matchingTemplates[0];
        const newOps = firstTemplate.operations.map(o => ({ ...o, id: Math.random().toString() }));
        const smvMap: Record<string, number> = {};
        newOps.forEach(o => smvMap[o.id] = o.smv);
        
        setRecord(prev => ({ 
          ...prev, 
          garmentType: cat,
          productCategory: cat,
          templateName: firstTemplate.name,
          operations: newOps
        }));
        setOriginalSmvs(smvMap);
        setMessage(`Default Demo "${firstTemplate.name}" loaded for ${cat}.`);
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  const handleTemplateLabelChange = (templateName: string) => {
    if (!isTemplateMode) {
      const templates = mockDb.getLayoutTemplates(department);
      const template = templates.find(t => t.garmentType === record.garmentType && t.name === templateName);
      
      if (template) {
        const newOps = template.operations.map(o => ({ ...o, id: Math.random().toString() }));
        const smvMap: Record<string, number> = {};
        newOps.forEach(o => smvMap[o.id] = o.smv);
        
        setRecord(prev => ({ 
          ...prev, 
          templateName: templateName,
          operations: newOps
        }));
        setOriginalSmvs(smvMap);
        setMessage(`Demo Layout "${templateName}" loaded.`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setRecord(prev => ({ ...prev, templateName }));
      }
    } else {
      setRecord(prev => ({ ...prev, templateName }));
    }
  };

  const loadExistingTemplate = (template: LayoutTemplate) => {
    const newOps = template.operations.map(o => ({ ...o, id: Math.random().toString() }));
    const smvMap: Record<string, number> = {};
    newOps.forEach(o => smvMap[o.id] = o.smv);

    setRecord(prev => ({
        ...prev,
        templateName: template.name,
        garmentType: template.garmentType,
        operations: newOps
    }));
    setEditingTemplateId(template.id);
    setOriginalSmvs(smvMap);
    setMessage(`Editing ${template.name}...`);
    setTimeout(() => setMessage(''), 2000);
  };

  const deleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      mockDb.deleteLayoutTemplate(confirmDeleteId);
      setExistingTemplates(mockDb.getLayoutTemplates(department));
      setConfirmDeleteId(null);
      setMessage("Template deleted.");
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const addOperation = (part: string = 'Assembly') => {
    const newOp: LayoutMasterOperation & { balanceWithId?: string } = {
      id: Date.now().toString(), operationId: '', operationName: 'Select Operation',
      part: part, smv: 0, mcType: '', folderAttachment: '',
      needle: '', actualMan: 1, actualMc: 1, remarks: '', balanceWithId: ''
    };
    setRecord(prev => ({ ...prev, operations: [...(prev.operations || []), newOp] }));
  };

  const addSection = (sectionName: string) => {
    addOperation(sectionName);
  };

  const updateOperation = (id: string, updates: Partial<LayoutMasterOperation>) => {
    setRecord(prev => ({
      ...prev,
      operations: (prev.operations || []).map(op => {
        if (op.id !== id) return op;
        const newOp = { ...op, ...updates };
        if (updates.operationName && updates.operationName !== 'Select Operation') {
           const processMeta = availableProcesses.find(p => p.processName === updates.operationName);
           if (processMeta) {
              newOp.smv = processMeta.smv;
              newOp.mcType = processMeta.machineType;
              newOp.part = processMeta.part;
              
              // Update original SMV for this new operation
              setOriginalSmvs(prevSmvs => ({ ...prevSmvs, [id]: processMeta.smv }));
           }
        }
        return newOp;
      })
    }));
    // Clear validation error for this op if it was updated
    setValidationErrors(prev => prev.filter(errId => errId !== id));
  };

  const handleSave = () => {
    const hErrors: string[] = [];
    const opErrors: string[] = [];

    if (isTemplateMode) {
      if (!record.templateName) hErrors.push('templateName');
      if (!record.garmentType) hErrors.push('garmentType');
    } else {
      if (!record.buyer) hErrors.push('buyer');
      if (!record.style) hErrors.push('style');
      if (!record.approxInputDate) hErrors.push('approxInputDate');
      if (!record.lineNo) hErrors.push('lineNo');
    }

    (record.operations || []).forEach(op => {
      if (op.operationName === 'Select Operation' || !op.mcType || op.smv <= 0) {
        opErrors.push(op.id);
      }
    });

    if (hErrors.length > 0 || opErrors.length > 0) {
      setHeaderErrors(hErrors);
      setValidationErrors(opErrors);
      setAlertMsg("Please fill all required fields highlighted in red.");
      return;
    }

    setHeaderErrors([]);
    setValidationErrors([]);

    if (isTemplateMode) {
      const loadedTemplate = editingTemplateId ? existingTemplates.find(t => t.id === editingTemplateId) : null;
      
      // If name or type changed compared to loaded one, it's a new template
      const isMetadataChanged = loadedTemplate && (loadedTemplate.name !== record.templateName || loadedTemplate.garmentType !== record.garmentType);
      
      let targetId = Date.now().toString();
      let isUpdate = false;

      if (loadedTemplate && !isMetadataChanged) {
        // Same metadata as loaded file -> Overwrite
        targetId = loadedTemplate.id;
        isUpdate = true;
      } else {
        // Metadata changed or starting fresh -> check if this new combination already exists elsewhere
        const matchByNameType = existingTemplates.find(t => t.name === record.templateName && t.garmentType === record.garmentType);
        if (matchByNameType) {
          targetId = matchByNameType.id;
          isUpdate = true;
        }
      }
      
      const template: LayoutTemplate = {
        id: targetId,
        name: record.templateName!,
        garmentType: record.garmentType!,
        section: department,
        operations: record.operations || []
      };
      mockDb.saveLayoutTemplate(template);
      setExistingTemplates(mockDb.getLayoutTemplates(department));
      setEditingTemplateId(template.id);
      setMessage(isUpdate ? `Standard Demo updated.` : `New Demo Layout committed.`);
    } else {
      mockDb.saveLayoutMaster({ 
        ...record as LayoutMasterRecord, 
        id: Date.now().toString(), 
        timestamp: new Date().toISOString(), 
        preparedBy: currentUser.name, 
        efficiency,
        productCategory: record.garmentType || record.productCategory
      });
      setMessage("Production Layout Archived successfully.");
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-[1600px] mx-auto bg-background min-h-screen">
      <style>{`
        .layout-table th, .layout-table td { border: 1px solid var(--foreground); padding: 6px 10px; font-size: 13px; vertical-align: middle; }
        .layout-table th { background: var(--muted); font-weight: 900; text-transform: uppercase; text-align: center; color: var(--foreground); }
        .layout-table .section-header { background: var(--accent); font-weight: 900; text-align: left; font-size: 15px; color: var(--accent-foreground); }
        .layout-table select { border: none; background: transparent; width: 100%; font-weight: 700; cursor: pointer; color: var(--foreground); font-size: 13px; }
        .layout-table input { border: none; background: transparent; width: 100%; text-align: center; font-weight: 600; font-size: 13px; color: var(--foreground); }
        .layout-table .numeric { font-family: 'JetBrains Mono', monospace; }
        @media print {
          @page { size: landscape; margin: 5mm; }
          .no-print { display: none !important; }
          .report-canvas { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 5mm !important; }
        }
      `}</style>

      {/* Action Header */}
      <div className="no-print flex items-center justify-between p-6 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onBack ? onBack() : navigate(`/${department.toLowerCase()}/ie-activity`)} 
            className="p-2.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm hover:shadow-md"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight uppercase italic leading-none">
              {isTemplateMode ? 'Technical Demo Blueprinting' : 'Industrial Layout Master'}
            </h2>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">
              Industrial Engineering Department
            </p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => window.print()} className="bg-foreground text-background px-4 sm:px-8 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2 transition-all hover:opacity-90 active:scale-95"><Printer size={16}/> <span className="hidden sm:inline">Print</span></button>
          <button onClick={handleSave} className="bg-primary text-primary-foreground px-4 sm:px-10 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2 hover:bg-primary/90 active:scale-95"><Save size={16}/> <span className="hidden sm:inline">{isTemplateMode ? 'Commit Standard' : 'Save Worksheet'}</span></button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mx-4">
        {/* Template Manager Panel (Registry Mode Only) */}
        {isTemplateMode && (
          <div className="col-span-3 space-y-6 no-print animate-in slide-in-from-left-4 duration-500">
              <div className="bg-card border border-border text-foreground p-8 rounded-[2.5rem] shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl"><BookOpen size={20}/></div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Demo Library</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingTemplateId(null);
                      setRecord({
                        ...record,
                        templateName: '',
                        operations: [{ id: '1', operationId: '', operationName: 'Select Operation', part: 'Back Part', smv: 0, mcType: '', folderAttachment: '', needle: '', actualMan: 1, actualMc: 1, remarks: '', balanceWithId: '' }]
                      });
                      setMessage("Started fresh template.");
                      setTimeout(() => setMessage(''), 2000);
                    }}
                    className="p-2 bg-muted hover:bg-accent rounded-lg transition-all"
                    title="New Template"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                   {existingTemplates.map(t => (
                      <div key={t.id} onClick={() => loadExistingTemplate(t)} className="p-4 bg-muted/50 border border-border rounded-2xl cursor-pointer hover:bg-muted transition-all group relative">
                         <p className="text-[10px] font-black text-primary uppercase mb-1">{t.garmentType}</p>
                         <p className="text-xs font-bold truncate group-hover:text-primary transition-colors pr-6">{t.name}</p>
                         <div className="flex justify-between items-center mt-3 text-[8px] font-black text-muted-foreground uppercase">
                            <span>{t.operations.length} Steps</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Edit3 size={10} />
                               <button 
                                 onClick={(e) => deleteTemplate(t.id, e)}
                                 className="text-destructive hover:text-destructive/80"
                               >
                                 <Trash2 size={10} />
                               </button>
                            </div>
                         </div>
                      </div>
                   ))}
                   {existingTemplates.length === 0 && (
                      <div className="py-10 text-center opacity-30 italic text-[10px] text-muted-foreground">No standard demos registered.</div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* MAIN REPORT CANVAS */}
        <div className={`col-span-12 ${isTemplateMode ? 'md:col-span-9' : 'md:col-span-12'}`}>
          <ZoomWrapper referenceWidth={1100}>
            <div 
              ref={reportRef}
              className={`report-canvas bg-card p-6 sm:p-12 border border-border shadow-2xl rounded-[2rem] sm:rounded-[3rem] space-y-10`}
            >
              {/* Top Branding Header */}
          <div className="flex items-center justify-between border-b-4 border-foreground pb-6">
              <Logo size={56} showText={false} />
              <div className="text-center">
                <h2 className="text-4xl font-[1000] uppercase italic tracking-tighter leading-none text-foreground">SQUARE DENIMS LIMITED</h2>
                <h3 className="text-xl font-black uppercase underline decoration-2 underline-offset-8 mt-3 tracking-widest text-foreground">
                    {isTemplateMode ? 'STANDARD DEMO LAYOUT' : 'OPERATION BREAKDOWN'}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-foreground">{new Date().toLocaleDateString('en-GB')}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">IE Section: {department}</p>
              </div>
          </div>

          <LayoutHeaderChart 
            record={record} 
            workstationSummary={workstationSummary} 
            totalSMV={totalSMV} 
            efficiency={efficiency} 
            learningCurve={learningCurve} 
            productCategories={productCategories}
            buyers={buyers}
            stylesForBuyer={stylesForBuyer}
            currentUser={currentUser}
            isTemplateMode={isTemplateMode}
            existingTemplates={existingTemplates}
            onUpdateTargetHr={(val) => setRecord({...record, targetHr: val})}
            onUpdateGarmentType={handleCategoryChange}
            onUpdateTemplateName={handleTemplateLabelChange}
            onUpdateField={(field, val) => {
              setRecord({...record, [field]: val});
              setHeaderErrors(prev => prev.filter(f => f !== field));
            }}
            errors={headerErrors}
          />

          {/* Sequence Table */}
          <div className="space-y-6">
            <div className="border-2 border-slate-900 overflow-hidden shadow-lg bg-white relative">
              <div className="overflow-x-auto no-scrollbar">
                <table className="layout-table w-full border-collapse min-w-[1300px]">
                  <thead>
                      <tr>
                        <th className="w-10">SL</th>
                        <th className="text-left">Operation</th>
                        <th className="w-16">SMV</th>
                        <th className="w-20">M/C</th>
                        <th className="w-32">Folder/ Attachment</th>
                        <th className="w-16">Trg./ Hr.</th>
                        <th className="w-16">Required Man</th>
                        <th className="w-16">Actual Man</th>
                        <th className="w-16">Actual M/C</th>
                        <th className="w-16">Balance %</th>
                        <th className="w-16">Idle Time (min)</th>
                        <th className="text-left">Remarks</th>
                        <th className="w-32 no-print">Balance With</th>
                        <th className="w-10 no-print">Action</th>
                      </tr>
                  </thead>
                  <tbody className="text-slate-900">
                      {(() => {
                        let slCounter = 0;
                        return Object.entries(groupedOperations).map(([partName, ops]) => {
                          const sectionReqMan = ops.reduce((sum, op) => sum + ((record.targetHr || 0) * (op.smv || 0) / 60), 0);
                          const sectionActMan = ops.reduce((sum, op) => sum + (op.actualMan || 0), 0);
                          const sectionActMc = ops.reduce((sum, op) => sum + (op.actualMc || 0), 0);

                          return (
                            <React.Fragment key={partName}>
                              <tr className="section-header group">
                                <td className="text-center">
                                  <select 
                                    className="w-full text-center bg-transparent border-none font-black cursor-pointer"
                                    value={partName}
                                    onChange={(e) => {
                                      const newPart = e.target.value;
                                      setRecord(prev => ({
                                        ...prev,
                                        operations: prev.operations?.map(op => op.part === partName ? { ...op, part: newPart } : op)
                                      }));
                                    }}
                                  >
                                    {garmentParts.map(s => <option key={s} value={s}>{s === partName ? '▼' : s}</option>)}
                                  </select>
                                </td>
                                <td colSpan={5} className="px-4 py-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-black">{partName}</span>
                                    <div className="flex gap-2 no-print">
                                      <button 
                                        onClick={() => addOperation(partName)}
                                        className="p-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-all opacity-0 group-hover:opacity-100"
                                        title={`Add operation to ${partName}`}
                                      >
                                        <Plus size={12} />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center numeric font-black text-foreground">{Math.round(sectionReqMan)}</td>
                                <td className="text-center numeric font-black text-foreground">{sectionActMan}</td>
                                <td className="text-center numeric font-black text-foreground">{sectionActMc}</td>
                                <td colSpan={5} className="bg-muted/50"></td>
                              </tr>
                              {ops.map((op, i) => {
                                slCounter++;
                                const reqMan = (record.targetHr || 0) * (op.smv || 0) / 60;
                                const trgHr = op.smv > 0 ? (60 / op.smv) : 0;
                                const balance = reqMan > 0 ? ((op.actualMan || 0) / reqMan) * 100 : 0;
                                
                                // Idle time calculation fix: 0 if no operation or smv
                                const isOpValid = op.operationName !== 'Select Operation' && op.smv > 0 && op.actualMan > 0;
                                const rawIdleTime = isOpValid ? ((op.actualMan || 0) * (60 / (record.targetHr || 1)) - op.smv) * 60 : 0;
                                
                                // Work balancing logic
                                let balancedIdleTime = rawIdleTime;
                                let isBalanced = false;
                                if (op.balanceWithId && isOpValid) {
                                  const targetOp = record.operations?.find(x => x.id === op.balanceWithId);
                                  if (targetOp) {
                                    const targetIsOpValid = targetOp.operationName !== 'Select Operation' && targetOp.smv > 0 && targetOp.actualMan > 0;
                                    const targetRawIdleTime = targetIsOpValid ? ((targetOp.actualMan || 0) * (60 / (record.targetHr || 1)) - targetOp.smv) * 60 : 0;
                                    balancedIdleTime = rawIdleTime + targetRawIdleTime;
                                    isBalanced = true;
                                  }
                                }

                                // Check if this operation is being balanced BY another operation
                                const balancedBy = record.operations?.find(x => x.balanceWithId === op.id);
                                if (balancedBy && !op.balanceWithId) {
                                  balancedIdleTime = 0; // It's covered by the other op
                                  isBalanced = true;
                                }

                                const isInvalid = validationErrors.includes(op.id);
                                const isSmvChanged = !isTemplateMode && originalSmvs[op.id] !== undefined && op.smv !== originalSmvs[op.id];

                                return (
                                  <tr key={op.id} className={`hover:bg-muted/50 transition-colors ${isInvalid ? 'bg-destructive/10' : ''}`}>
                                    <td className="text-center font-bold">{slCounter}</td>
                                    <td className={`p-0 ${isInvalid && op.operationName === 'Select Operation' ? 'bg-destructive text-destructive-foreground' : ''}`}>
                                      <SearchableSelect 
                                        value={op.operationName} 
                                        isInvalid={isInvalid}
                                        options={availableProcesses
                                          .filter(p => p.part === partName || !p.part || p.part === 'Other')
                                          .map(p => ({ id: p.id, name: p.processName }))}
                                        onChange={val => updateOperation(op.id, { operationName: val })}
                                      />
                                    </td>
                                    <td className={`p-0 ${isInvalid && op.smv <= 0 ? 'bg-destructive text-destructive-foreground' : ''}`}><input className={`numeric ${isSmvChanged ? 'text-rose-600 font-black' : ''} ${isInvalid && op.smv <= 0 ? 'text-destructive-foreground' : ''}`} type="number" step="0.01" value={op.smv} onChange={e => updateOperation(op.id, { smv: parseFloat(e.target.value) || 0 })} /></td>
                                    <td className={`p-0 ${isInvalid && !op.mcType ? 'bg-destructive text-destructive-foreground' : ''}`}><input className={`uppercase ${isInvalid && !op.mcType ? 'placeholder-destructive-foreground text-destructive-foreground' : ''}`} placeholder={isInvalid && !op.mcType ? 'Required' : ''} value={op.mcType} onChange={e => updateOperation(op.id, { mcType: e.target.value })} /></td>
                                    <td className="p-0"><input className="text-xs italic" value={op.folderAttachment} onChange={e => updateOperation(op.id, { folderAttachment: e.target.value })} /></td>
                                    <td className="text-center numeric">{Math.round(trgHr)}</td>
                                    <td className="text-center numeric">{reqMan.toFixed(2)}</td>
                                    <td className="p-0"><input className="numeric font-bold text-primary" type="number" step="0.1" value={op.actualMan} onChange={e => updateOperation(op.id, { actualMan: parseFloat(e.target.value) || 0 })} /></td>
                                    <td className="p-0"><input className="numeric" type="number" step="0.1" value={op.actualMc} onChange={e => updateOperation(op.id, { actualMc: parseFloat(e.target.value) || 0 })} /></td>
                                    <td className={`text-center numeric font-bold ${balance > 110 ? 'text-rose-600' : balance < 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                      {Math.round(balance)}%
                                    </td>
                                    <td className={`text-center numeric font-bold ${isBalanced ? 'bg-primary/10 text-primary' : balancedIdleTime > 10 ? 'bg-destructive/10 text-destructive' : balancedIdleTime < 0 ? 'bg-amber-500/10 text-amber-500' : ''}`}>
                                      {isBalanced && balancedBy ? 'Balanced' : Math.round(balancedIdleTime)}
                                    </td>
                                    <td className="p-0"><input className="text-left px-2" value={op.remarks} onChange={e => updateOperation(op.id, { remarks: e.target.value })} /></td>
                                    <td className="p-0 no-print">
                                      <SearchableSelect 
                                        value={op.balanceWithId ? (record.operations?.find(x => x.id === op.balanceWithId)?.operationName || 'None') : 'None'}
                                        options={[
                                          { id: 'none', name: 'None' },
                                          ...(record.operations?.filter(x => x.id !== op.id && x.part === op.part).map(x => ({
                                            id: x.id,
                                            name: `${record.operations?.indexOf(x)! + 1}. ${x.operationName}`
                                          })) || [])
                                        ]}
                                        onChange={val => {
                                          if (val === 'None') {
                                            updateOperation(op.id, { balanceWithId: '' });
                                          } else {
                                            const selectedOp = record.operations?.find(x => `${record.operations?.indexOf(x)! + 1}. ${x.operationName}` === val);
                                            if (selectedOp) updateOperation(op.id, { balanceWithId: selectedOp.id });
                                          }
                                        }}
                                      />
                                    </td>
                                    <td className="text-center no-print">
                                      <button onClick={() => setRecord(prev => ({ ...prev, operations: prev.operations?.filter(x => x.id !== op.id) }))} className="p-1 text-muted-foreground hover:text-destructive transition-all"><Trash2 size={14}/></button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        });
                      })()}
                  </tbody>
                </table>
              </div>
            <div className="p-4 bg-muted/50 border-t border-border flex items-center justify-center gap-4 no-print">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Add New Section:</span>
                <select 
                  className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary text-foreground"
                  onChange={(e) => {
                    if (e.target.value) {
                      addSection(e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Select Area...</option>
                  {garmentParts.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="h-6 w-px bg-border"></div>
              <button onClick={() => addOperation()} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-black uppercase hover:bg-primary/90 transition-all shadow-md">
                <Plus size={16}/> Add Operation
              </button>
            </div>
          </div>

          {/* Machine Summary & Signatures */}
          <div className="grid grid-cols-2 gap-12 mt-12">
            <div className="space-y-4">
              <table className="w-full border-2 border-foreground text-[11px]">
                <thead>
                  <tr>
                    <th colSpan={6} className="p-2 text-lg font-black border-b-2 border-foreground text-center bg-muted">Machine Requirement:</th>
                  </tr>
                  <tr className="bg-muted font-black border-b-2 border-foreground">
                    <th className="border-r-2 border-foreground w-10 p-1">SL</th>
                    <th className="border-r-2 border-foreground p-1 text-left">M/C Name</th>
                    <th className="border-r-2 border-foreground w-16 p-1">No of M/C</th>
                    <th className="border-r-2 border-foreground w-10 p-1">SL</th>
                    <th className="border-r-2 border-foreground p-1 text-left">M/C Name</th>
                    <th className="p-1 w-16">No of M/C</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {(() => {
                    const mcMap: Record<string, number> = {};
                    (record.operations || []).forEach(op => {
                      if (op.mcType && !op.mcType.toUpperCase().includes('HELPER') && !op.mcType.toUpperCase().includes('IRON')) {
                        mcMap[op.mcType] = (mcMap[op.mcType] || 0) + (op.actualMc || 0);
                      }
                    });
                    const mcList = Object.entries(mcMap).sort((a, b) => b[1] - a[1]);
                    const rowCount = Math.max(10, Math.ceil(mcList.length / 2));
                    const rows = [];
                    for (let i = 0; i < rowCount; i++) {
                      const mc1 = mcList[i];
                      const mc2 = mcList[i + rowCount];
                      rows.push(
                        <tr key={i} className="border-b border-foreground">
                          <td className="border-r-2 border-foreground text-center font-bold p-1">{i + 1}</td>
                          <td className="border-r-2 border-foreground p-1 font-black">{mc1 ? mc1[0] : ''}</td>
                          <td className="border-r-2 border-foreground text-center font-black p-1">{mc1 ? mc1[1] : ''}</td>
                          <td className="border-r-2 border-foreground text-center font-bold p-1">{i + rowCount + 1}</td>
                          <td className="border-r-2 border-foreground p-1 font-black">{mc2 ? mc2[0] : ''}</td>
                          <td className="text-center font-black p-1">{mc2 ? mc2[1] : ''}</td>
                        </tr>
                      );
                    }
                    return rows;
                  })()}
                </tbody>
              </table>
              
              <div className="grid grid-cols-2 border-2 border-foreground divide-x-2 divide-foreground text-foreground">
                <div className="p-2 flex justify-between items-center">
                  <span className="font-black text-[11px]">Total M/C:</span>
                  <span className="font-black text-sm">{workstationSummary.total - workstationSummary.helpers - workstationSummary.iron}</span>
                </div>
                <div className="p-2 flex justify-between items-center">
                  <span className="font-black text-[11px]">Special M/C:</span>
                  <span className="font-black text-sm">0</span>
                </div>
              </div>
              <div className="border-2 border-foreground p-2 flex justify-between items-center text-foreground">
                <span className="font-black text-[11px]">Total Operator:</span>
                <span className="font-black text-sm">{workstationSummary.ops + workstationSummary.cpu}</span>
              </div>
              <div className="grid grid-cols-2 border-2 border-foreground divide-x-2 divide-foreground text-foreground">
                <div className="p-2 flex justify-between items-center">
                  <span className="font-black text-[11px]">Iron:</span>
                  <span className="font-black text-sm">{workstationSummary.iron}</span>
                </div>
                <div className="p-2 flex justify-between items-center">
                  <span className="font-black text-[11px]">Helper:</span>
                  <span className="font-black text-sm">{workstationSummary.helpers}</span>
                </div>
              </div>
              <div className="border-2 border-foreground p-2 flex justify-between items-center bg-muted text-foreground">
                <span className="font-black text-sm">Total Manpower:</span>
                <span className="font-black text-lg">{workstationSummary.total}</span>
              </div>
            </div>

            <div className="flex flex-col justify-between py-4 text-foreground">
              <div className="grid grid-cols-2 gap-12">
                <div className="text-center space-y-2">
                  <div className="border-t-2 border-foreground pt-2 font-black text-xs">Prepared by- IE</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="border-t-2 border-foreground pt-2 font-black text-xs">Production Concern</div>
                </div>
              </div>
              
              <div className="text-center space-y-2 max-w-xs mx-auto">
                <div className="border-t-2 border-foreground pt-2 font-black text-xs">Maintenance Concern sign with date</div>
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="text-center space-y-2">
                  <div className="border-t-2 border-foreground pt-2 font-black text-xs">IE-Manager/Incharge</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="border-t-2 border-foreground pt-2 font-black text-xs">Production Manager</div>
                </div>
              </div>
            </div>
          </div>
        </div>

          </div>
        </ZoomWrapper>
      </div>

      {/* Custom Alert Modal */}
      {alertMsg && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-card rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-border">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-destructive/10 text-destructive rounded-full">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-foreground uppercase italic">Attention Required</h3>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">{alertMsg}</p>
              <button 
                onClick={() => setAlertMsg(null)}
                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-card rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-border">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-destructive/10 text-destructive rounded-full">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-foreground uppercase italic">Confirm Deletion</h3>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">Are you sure you want to delete this template? This action cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 bg-muted text-muted-foreground py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-destructive text-destructive-foreground py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-destructive/90 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
    {message && <div className="fixed bottom-12 right-12 p-8 bg-primary text-primary-foreground rounded-[2.5rem] shadow-4xl font-black flex items-center gap-4 animate-in slide-in-from-right-10 z-[1200] border-4 border-background"><CheckCircle size={32}/> {message}</div>}
  </div>
  );
};

export default LayoutMaster;
