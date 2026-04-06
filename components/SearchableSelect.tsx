
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface SearchableSelectProps {
  value: string;
  options: { id: string; name: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
  isInvalid?: boolean;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  value, 
  options, 
  onChange, 
  placeholder = "Search...", 
  isInvalid,
  disabled,
  className = "",
  dropdownClassName = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className={`relative w-full h-full min-h-[36px] ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3 py-2 cursor-pointer h-full w-full rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/50 ${isInvalid ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' : ''} ${disabled ? 'cursor-not-allowed bg-muted' : ''}`}
      >
        <span className={`truncate font-bold text-[11px] uppercase tracking-tight ${!value || value === 'Select Operation' ? 'text-muted-foreground' : 'text-foreground'}`}>
          {value || "Select..."}
        </span>
        <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />
      </div>

      {isOpen && (
        <div className={`absolute left-0 top-full mt-1 w-full min-w-[250px] bg-popover border-2 border-foreground shadow-2xl z-[1000] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 no-print ${dropdownClassName}`}>
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
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-tight cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${value === opt.name ? 'bg-accent text-accent-foreground' : 'text-foreground'}`}
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

export default SearchableSelect;
