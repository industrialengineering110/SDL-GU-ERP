import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface SearchableOption {
  id: string;
  name: string;
}

export interface SearchableSelectProps {
  label?: string;
  options: (string | SearchableOption)[];
  value: string;
  placeholder: string;
  icon?: any;
  onChange: (val: string) => void;
  disabled?: boolean;
  accentColor?: "rose" | "blue" | "emerald" | "indigo";
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, 
  options, 
  value, 
  placeholder, 
  icon: Icon, 
  onChange, 
  disabled, 
  accentColor = "rose" 
}) => {
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

  const normalizedOptions: SearchableOption[] = (options || []).map(opt => 
    typeof opt === 'string' ? { id: opt, name: opt } : opt
  );

  const filteredOptions = normalizedOptions.filter(opt => 
    opt && opt.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const getBorderColor = () => {
    switch(accentColor) {
      case 'rose': return 'hover:border-rose-400';
      case 'emerald': return 'hover:border-emerald-400';
      case 'indigo': return 'hover:border-indigo-400';
      default: return 'hover:border-blue-400';
    }
  };

  const selectedOption = normalizedOptions.find(o => o.id === value);
  const displayValue = selectedOption ? selectedOption.name : value;

  return (
    <div className={`space-y-2 relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border border-slate-200 rounded-2xl ${Icon ? 'pl-12' : 'pl-5'} pr-5 py-4 text-slate-900 font-black cursor-pointer flex items-center justify-between group transition-colors shadow-sm ${getBorderColor()}`}
      >
        {Icon && <Icon size={18} className="absolute left-5 text-slate-400 group-hover:text-blue-600 transition-colors" />}
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>{displayValue || placeholder}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2">
           <div className="p-3 border-b border-slate-50 bg-slate-50/50">
              <div className="relative">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input autoFocus className="w-full bg-white border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} />
              </div>
           </div>
           <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredOptions.map((o, i) => <div key={i} onClick={() => { onChange(o.id); setIsOpen(false); setSearchTerm(''); }} className="px-5 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors">{o.name}</div>)}
              {filteredOptions.length === 0 && <div className="px-5 py-3 text-xs text-slate-400 italic">No results found</div>}
           </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
