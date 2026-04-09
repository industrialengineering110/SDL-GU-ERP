
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Info, User, Building, Lock, Briefcase, Layers, Factory, Phone, AlertCircle, CheckSquare, Square, ChevronDown, Search, X, ShieldCheck, Eye } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { AppUser as UserType, LineMapping, PagePermissions, INITIAL_PERMISSIONS } from '../types';
import Logo from '../components/Logo';

interface RegistrationProps {
  onSuccess: () => void;
  onGoToLogin: () => void;
}

const MultiLineSelect: React.FC<{
  label: string;
  options: LineMapping[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}> = ({ label, options, selectedValues, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.lineId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (lineId: string) => {
    const newValues = selectedValues.includes(lineId)
      ? selectedValues.filter(v => v !== lineId)
      : [...selectedValues, lineId];
    onChange(newValues);
  };

  return (
    <div className={`space-y-2 relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
        <Factory size={10}/> {label}
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-muted border border-border rounded-2xl px-5 py-3.5 font-bold cursor-pointer flex items-center justify-between group hover:border-primary transition-all min-h-[52px]`}
      >
        <div className="flex wrap gap-1.5 flex-1">
          {selectedValues.length > 0 ? (
            selectedValues.map(v => (
              <span key={v} className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1">
                {v}
                <X size={10} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleOption(v); }} />
              </span>
            ))
          ) : (
            <span className="text-muted-foreground font-medium">Select lines...</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-[1.5rem] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
           <div className="p-3 border-b border-border bg-muted/50">
              <div className="relative">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <input 
                    autoFocus
                    className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20" 
                    placeholder="Search lines..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                 />
              </div>
           </div>
           <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredOptions.map((opt) => (
                <div 
                  key={opt.lineId}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(opt.lineId);
                  }}
                  className={`px-5 py-3 text-sm font-bold flex items-center justify-between cursor-pointer transition-colors ${selectedValues.includes(opt.lineId) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                >
                  <span>{opt.lineId} <span className="text-[10px] text-muted-foreground ml-2">({opt.blockId})</span></span>
                  {selectedValues.includes(opt.lineId) ? <CheckSquare size={16} /> : <Square size={16} className="text-muted-foreground/30" />}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-5 py-8 text-center text-xs font-bold text-muted-foreground italic">No lines available</div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const Registration: React.FC<RegistrationProps> = ({ onSuccess, onGoToLogin }) => {
  const config = mockDb.getSystemConfig();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    employeeId: '',
    department: '',
    designation: '',
    section: '',
    mobileNumber: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [selectedLines, setSelectedLines] = useState<string[]>([]);

  const filteredLines = form.section 
    ? config.lineMappings.filter(m => m.sectionId === form.section)
    : [];

  useEffect(() => {
    if (form.section) {
      const validLineIds = new Set(filteredLines.map(l => l.lineId));
      setSelectedLines(prev => prev.filter(id => validLineIds.has(id)));
    }
  }, [form.section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, boolean> = {};
    if (!form.name) newErrors.name = true;
    if (!form.employeeId) newErrors.employeeId = true;
    if (!form.password) newErrors.password = true;
    if (!form.department) newErrors.department = true;
    if (!form.designation) newErrors.designation = true;
    // Section and lines are now optional
    if (!form.mobileNumber || form.mobileNumber.length !== 11) newErrors.mobileNumber = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('Please fill all required fields correctly.');
      return;
    }

    const firstLine = selectedLines[0];
    const lineMapping = firstLine ? config.lineMappings.find(m => m.lineId === firstLine) : null;

    const newUser = {
      id: Date.now().toString(),
      name: form.name.trim(),
      employee_id: form.employeeId.trim(),
      department: form.department,
      designation: form.designation,
      section: form.section || undefined,
      lines: selectedLines.length > 0 ? selectedLines : undefined,
      area: lineMapping?.blockId || '',
      mobileNumber: form.mobileNumber.trim(),
      password: form.password.trim(),
      email: `${form.employeeId.trim()}@sdl-garments.com`,
    };

    try {
      const { apiService } = await import('../services/apiService');
      await apiService.register(newUser);
      setMessage('Profile created! Waiting for Admin verification before system activation.');
      setError('');
      setTimeout(() => {
        setMessage('');
        onGoToLogin();
      }, 4000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  const getInputClass = (field: string) => {
    const base = "w-full bg-muted border rounded-2xl px-5 py-3.5 font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all";
    const border = errors[field] ? "border-rose-500 ring-4 ring-rose-500/10" : "border-border";
    return `${base} ${border}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 sm:p-12">
      <div className="max-w-5xl w-full bg-card rounded-[3rem] shadow-2xl border border-border overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-500">
        <div className="md:w-1/3 bg-slate-900 p-10 text-white flex flex-col justify-between">
           <div>
             <Logo size={40} className="mb-6 bg-white p-2 rounded-xl" showText={false} />
             <h2 className="text-2xl font-black leading-tight mb-4 uppercase text-white">SQUARE<br/>DENIM'S LTD.</h2>
             <p className="text-slate-400 text-sm font-medium leading-relaxed">Industrial Engineering Department<br/>Verification required for access.</p>
           </div>
           <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Support Desk</p>
                 <p className="text-xs text-slate-300 font-bold">Contact Admin for immediate activation.</p>
              </div>
              <button onClick={onGoToLogin} className="text-blue-400 font-black text-xs uppercase tracking-widest text-left hover:text-white transition-colors underline">Back to Login</button>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="md:w-2/3 p-10 sm:p-14 space-y-8 overflow-y-auto max-h-[90vh] custom-scrollbar">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground tracking-tight">Create Profile</h1>
            <p className="text-muted-foreground text-sm font-medium italic">Complete the form to request system access.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2"><User size={10}/> Full Name</label>
              <input className={getInputClass('name')} value={form.name} onChange={e => { setForm({...form, name: e.target.value}); if(errors.name) setErrors({...errors, name: false}); }} placeholder="e.g. Abdullah Al Mamun" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2"><Lock size={10}/> Office ID</label>
              <input className={getInputClass('employeeId')} value={form.employeeId} onChange={e => { setForm({...form, employeeId: e.target.value}); if(errors.employeeId) setErrors({...errors, employeeId: false}); }} placeholder="4200XXXX" />
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2"><Lock size={10}/> Password</label>
              <input type={showPassword ? "text" : "password"} className={getInputClass('password')} value={form.password} onChange={e => { setForm({...form, password: e.target.value}); if(errors.password) setErrors({...errors, password: false}); }} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-9 text-muted-foreground hover:text-primary">
                {showPassword ? <X size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2"><Building size={10}/> Department</label>
              <select className={getInputClass('department')} value={form.department} onChange={e => { setForm({...form, department: e.target.value}); if(errors.department) setErrors({...errors, department: false}); }}>
                <option value="">Select Dept</option>
                {config.departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2"><Briefcase size={10}/> Designation</label>
              <select className={getInputClass('designation')} value={form.designation} onChange={e => { setForm({...form, designation: e.target.value}); if(errors.designation) setErrors({...errors, designation: false}); }}>
                <option value="">Select Position</option>
                {config.designations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2"><Layers size={10}/> Section</label>
              <select 
                className={getInputClass('section')} 
                value={form.section} 
                onChange={e => { setForm({...form, section: e.target.value}); if(errors.section) setErrors({...errors, section: false}); }}
              >
                <option value="">Select Section</option>
                {config.sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
               <div className={errors.lines ? "ring-4 ring-rose-500/10 rounded-[2rem] p-1" : ""}>
                 <MultiLineSelect 
                    label="Station Responsibility" 
                    options={filteredLines} 
                    selectedValues={selectedLines} 
                    onChange={(vals) => { setSelectedLines(vals); if(errors.lines) setErrors({...errors, lines: false}); }} 
                    disabled={!form.section}
                 />
               </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2"><Phone size={10}/> Mobile Number (BD)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">+88</span>
                <input 
                  type="tel"
                  className={getInputClass('mobileNumber')} 
                  style={{ paddingLeft: '3.5rem' }}
                  value={form.mobileNumber} 
                  onChange={e => { setForm({...form, mobileNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 11)}); if(errors.mobileNumber) setErrors({...errors, mobileNumber: false}); }} 
                  placeholder="01XXXXXXXXX" 
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 text-rose-600 rounded-2xl border border-rose-500/20 flex items-center gap-3 text-xs font-bold animate-in shake duration-300">
               <AlertCircle size={16} /> {error}
            </div>
          )}

          {message && (
            <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20 flex items-center gap-3 text-xs font-bold animate-in fade-in duration-300">
               <CheckCircle size={16} /> {message}
            </div>
          )}

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-6 items-center justify-between">
             <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                <Info size={14} className="text-primary" />
                <span>Verification takes ~24 business hours.</span>
             </div>
             <button type="submit" className="w-full sm:w-auto bg-primary text-primary-foreground font-black py-4 px-14 rounded-2xl shadow-2xl active:scale-95 transition-all">
                Register Profile
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;
