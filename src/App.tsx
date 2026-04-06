/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  ClipboardList, 
  TrendingUp, 
  Activity, 
  Users, 
  BarChart3, 
  Layers, 
  Clock, 
  CheckCircle2,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  Calculator,
  Droplets,
  Scissors,
  ShieldCheck
} from 'lucide-react';
import { Toaster } from 'sonner';
import { getAuthService } from '../services/auth';
import Login from '../views/Login';
import Registration from '../views/Registration';

// Views
import Dashboard from '../views/Dashboard';
import Costing from '../views/Costing';
import WashCosting from '../views/WashCosting';
import WashCostingHistory from '../views/WashCostingHistory';
import FabricConsumption from '../views/FabricConsumption';
import TrimsConsumption from '../views/TrimsConsumption';
import { PlanningHub } from '../views/PlanningHub';

// Types
import { AppUser, UserRole } from '../types';

interface GlobalContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal must be used within a GlobalProvider');
  return context;
};

const Sidebar = ({ isOpen, toggle, onLogout }: { isOpen: boolean; toggle: () => void; onLogout: () => void }) => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: TrendingUp, label: 'Planning Hub', path: '/planning' },
    { icon: Calculator, label: 'Sewing Costing', path: '/costing' },
    { icon: Droplets, label: 'Wash Costing', path: '/wash-costing' },
    { icon: Scissors, label: 'Fabric Consumption', path: '/fabric-consumption' },
    { icon: Database, label: 'Trims Consumption', path: '/trims-consumption' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggle}
        />
      )}

      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50 transition-all duration-300 ${isOpen ? 'w-64' : 'w-0 lg:w-20'} overflow-hidden flex flex-col`}>
        <div className="p-6 flex items-center gap-4 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
            <TrendingUp size={20} />
          </div>
          <span className={`font-black uppercase italic tracking-tighter text-slate-900 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            ProTrack ERP
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <a
                key={item.path}
                href={`#${item.path}`}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={20} className="shrink-0" />
                <span className={`text-xs font-black uppercase tracking-widest transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden group-hover:opacity-100'}`}>
                  {item.label}
                </span>
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="flex items-center gap-4 p-3 w-full rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
          >
            <LogOut size={20} className="shrink-0" />
            <span className={`text-xs font-black uppercase tracking-widest transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

const Header = ({ toggleSidebar, user }: { toggleSidebar: () => void; user: AppUser | null }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 w-64 lg:w-96">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="bg-transparent border-none outline-none text-xs font-bold w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-900 relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="w-px h-6 bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{user?.designation || 'Member'}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authService = getAuthService();
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user as unknown as AppUser);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    const authService = getAuthService();
    authService.logout();
    setCurrentUser(null);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!currentUser) {
    return (
      <>
        {isRegistering ? (
          <Registration 
            onGoToLogin={() => setIsRegistering(false)} 
            onSuccess={() => {
              setIsRegistering(false);
            }} 
          />
        ) : (
          <Login onLogin={handleLogin} onGoToSignup={() => setIsRegistering(true)} />
        )}
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <GlobalContext.Provider value={{ theme, setTheme, currentUser, setCurrentUser }}>
      <Router>
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
          <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} />
          
          <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
            <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} user={currentUser} />
            
            <main className="p-4 md:p-8">
              <Routes>
                <Route path="/" element={<Dashboard role={currentUser?.role as UserRole || UserRole.ADMIN} />} />
                <Route path="/planning" element={<PlanningHub />} />
                <Route path="/planning/:tabId" element={<PlanningHub />} />
                <Route path="/costing" element={<Costing />} />
                <Route path="/wash-costing" element={<WashCosting />} />
                <Route path="/wash-costing/history" element={<WashCostingHistory />} />
                <Route path="/fabric-consumption" element={<FabricConsumption />} />
                <Route path="/trims-consumption" element={<TrimsConsumption />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
          <Toaster position="top-right" richColors />
        </div>
      </Router>
    </GlobalContext.Provider>
  );
}
