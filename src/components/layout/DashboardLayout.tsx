import React from 'react';
import { LayoutDashboard, Shield, Users, FileText, Settings, Bell, Search } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Washing', icon: FileText },
  { name: 'Finishing', icon: FileText },
  { name: 'Shipment', icon: FileText },
  { name: 'Governance', icon: Shield },
  { name: 'Notice Board', icon: Bell },
];

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6">
        <div className="text-xl font-black text-blue-900 mb-10">SQUARE DENIMS</div>
        <nav className="space-y-2">
          {menuItems.map(item => (
            <a key={item.name} href="#" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${item.name === 'Governance' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <item.icon size={20} />
              {item.name}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input className="bg-gray-100 rounded-full pl-10 pr-4 py-2 text-sm w-64" placeholder="Search..." />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold">System Admin</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">SA</div>
          </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
