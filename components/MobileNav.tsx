
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Store as StoreIcon, Scissors, Shirt, Droplets, Sparkle, Truck, 
  Banknote, ListTodo, Layout, Home
} from 'lucide-react';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const items = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/store/hub', icon: StoreIcon, label: 'Store' },
    { to: '/sample/hub', icon: Layout, label: 'Sample' },
    { to: '/cutting/hub', icon: Scissors, label: 'Cutting' },
    { to: '/sewing/hub', icon: Shirt, label: 'Sewing' },
    { to: '/washing/hub', icon: Droplets, label: 'Washing' },
    { to: '/finishing/hub', icon: Sparkle, label: 'Finishing' },
    { to: '/shipment/hub', icon: Truck, label: 'Shipment' },
    { to: '/costing/hub', icon: Banknote, label: 'Costing' },
    { to: '/planning/hub', icon: ListTodo, label: 'Planning' },
  ];

  return (
    <div className="md:hidden bg-white border-b border-slate-200 sticky top-16 z-30 overflow-x-auto no-scrollbar shadow-sm">
      <div className="flex items-center px-4 py-2 gap-5 min-w-max">
        {items.map((item, idx) => (
          <NavLink 
            key={idx}
            to={item.to}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 transition-all min-w-[50px]
              ${isActive ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`
                  p-2 rounded-xl transition-all
                  ${isActive ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100' : 'bg-slate-50'}
                `}>
                  <item.icon size={16} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
