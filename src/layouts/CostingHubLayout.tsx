import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { COSTING_MENU } from '../constants/costing';

const CostingHubLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 overflow-x-auto">
        {COSTING_MENU.map((item) => {
          if (item.items) {
            return item.items.map((subItem) => (
              <NavLink
                key={subItem.to}
                to={subItem.to}
                className={({ isActive }) => `
                  px-4 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap
                  ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                `}
              >
                {subItem.label}
              </NavLink>
            ));
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                px-4 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap
                ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
              `}
            >
              {item.label}
            </NavLink>
          );
        })}
      </div>
      
      {/* Body */}
      <div className="animate-in fade-in duration-500">
        <Outlet />
      </div>
    </div>
  );
};

export default CostingHubLayout;
