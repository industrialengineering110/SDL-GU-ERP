
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppUser as User, UserRole } from './types';
import { ENV } from './config/env';
import { apiService } from './services/apiService';
import { syncEngine } from './services/syncEngine';
import { mockDb } from './services/mockDb';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import Login from './views/Login';
import Registration from './views/Registration';
import AdminRegistration from './views/AdminRegistration';
import Dashboard from './views/Dashboard';
import SectionReport from './views/SectionReport';
import DefectInput from './views/DefectInput';
import AdminManagement from './views/AdminManagement';
import AdminUserManagement from './views/AdminUserManagement';
import FactoryAnalytics from './views/FactoryAnalytics'; // New import
import EfficiencyReport from './views/EfficiencyReport';
import SewingConsumption from './views/SewingConsumption';
import FabricConsumption from './views/FabricConsumption';
import TrimsConsumption from './views/TrimsConsumption';
import WIPEntry from './views/WIPEntry';
import OTAnalysis from './views/OTAnalysis';
import ManpowerSheet from './views/ManpowerSheet';
import MachineSheet from './views/MachineSheet';
import NPTInput from './views/NPTInput';
import Audit5S from './views/Audit5S';
import IEActivity from './views/IEActivity';
import ProductionStudy from './views/ProductionStudy';
import QCOHub from './views/QCOHub';
import DailyLineTargetReport from './views/DailyLineTargetReport';

import SectionReportManpower from './views/SectionReportManpower';
import SectionReportQuality from './views/SectionReportQuality';
import SectionReportWIP from './views/SectionReportWIP';
import SkillMatrix from './views/SkillMatrix';
import LayoutMaster from './views/LayoutMaster';
import LayoutBank from './views/LayoutBank';
import ProcessRegistry from './views/ProcessRegistry';
import TargetSheet from './views/TargetSheet';
import ProductionPlanningView from './views/ProductionPlanning';
import MachineAnalysis from './views/MachineAnalysis';
import ManpowerAnalysis from './views/ManpowerAnalysis';
import DepartmentHub from './views/DepartmentHub';
import Costing from './views/Costing';
import CostingDashboard from './views/CostingDashboard';
import WashCosting from './views/WashCosting';
import WashCostingHistory from './views/WashCostingHistory';
import SewingOutputTransfer from './views/SewingOutputTransfer';
import WashingInput from './views/WashingInput';
import Washing from './views/Washing';
import WashingProcessView from './views/WashingProcessView';
import WashingProductionReport from './views/WashingProductionReport';
import StoreInventory from './views/StoreInventory';
import NoticeBoard from './views/NoticeBoard';
import SizeSetPilot from './views/SizeSetPilot';
import { 
  LiveProduction, 
  CoordinationWall, 
  RevisionHistory, 
  PlanningDashboard, 
  OrderPool, 
  PreProductionTracker, 
  ReadyForPlan, 
  LineLoading,
  PlanningHub
} from './views/PlanningHub';

interface GlobalContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLive: boolean;
  logout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const GlobalContext = createContext<GlobalContextType | null>(null);
export const useGlobal = () => useContext(GlobalContext)!;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showAdminRegistration, setShowAdminRegistration] = useState(false);
  const [authView, setAuthView] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('protrack_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('protrack_theme', newTheme);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initializeApp = useCallback(async () => {
    console.log("DEBUG: App Initialization Config:", ENV);
    try {
      // Check for admin via Backend API
      const hasAdmin = await apiService.hasAdmin();
      if (!hasAdmin) {
        setShowAdminRegistration(true);
        setIsReady(true);
        return;
      }

      // Critical: Load session
      const savedSession = localStorage.getItem('protrack_session');
      if (savedSession) {
        // Revalidate session
        try {
          const user = await apiService.getCurrentUser();
          setCurrentUser(user);
          localStorage.setItem('protrack_session', JSON.stringify(user));
        } catch (e) {
          console.warn("Session revalidation failed, clearing session:", e);
          localStorage.clear();
          setCurrentUser(null);
        }
      }
      
      // Non-critical: Backend health and sync
      apiService.checkHealth().then(backendAlive => {
        setIsLive(backendAlive);
        if (backendAlive) syncEngine.startSync();
      });
    } catch (e) {
      console.warn("Init error:", e);
      setIsLive(false);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    initializeApp();
    const interval = setInterval(() => syncEngine.startSync(), 30000);
    return () => clearInterval(interval);
  }, [initializeApp]);

  const handleLoginSuccess = useCallback((user: any) => {
    localStorage.setItem('protrack_session', JSON.stringify(user));
    if (user.access_token) {
      localStorage.setItem('protrack_token', user.access_token);
      localStorage.setItem('protrack_session', JSON.stringify(user.user));
      setCurrentUser(user.user);
    } else {
      setCurrentUser(user);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
  };

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-foreground text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Data Engine...</p>
      </div>
    );
  }

  if (showAdminRegistration) {
    return (
      <div className="bg-background text-foreground min-h-screen">
        <AdminRegistration onSuccess={() => { setShowAdminRegistration(false); window.location.reload(); }} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-background text-foreground min-h-screen">
        {authView === 'LOGIN' ? (
          <Login onLogin={handleLoginSuccess} onGoToSignup={() => setAuthView('SIGNUP')} />
        ) : (
          <Registration onSuccess={() => setAuthView('LOGIN')} onGoToLogin={() => setAuthView('LOGIN')} />
        )}
      </div>
    );
  }

  return (
    <GlobalContext.Provider value={{ currentUser, setCurrentUser, isLive, logout: handleLogout, theme, toggleTheme }}>
      <HashRouter>
        <div className="flex h-screen overflow-hidden font-inter relative bg-background text-foreground transition-colors duration-300">
          <Sidebar 
            isOpen={window.innerWidth > 768 ? isSidebarOpen : isMobileDrawerOpen} 
            user={currentUser} 
            onClose={() => window.innerWidth > 768 ? setIsSidebarOpen(false) : setIsMobileDrawerOpen(false)} 
          />
          
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <Header 
              user={currentUser} 
              onUserChange={setCurrentUser} 
              toggleSidebar={() => window.innerWidth > 768 ? setIsSidebarOpen(!isSidebarOpen) : setIsMobileDrawerOpen(!isMobileDrawerOpen)} 
              isSidebarOpen={window.innerWidth > 768 ? isSidebarOpen : isMobileDrawerOpen} 
            />
            
            <MobileNav />
            
            <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar overflow-x-hidden">
              <div className="min-w-0 w-full">
                <Routes>
                <Route path="/" element={<Dashboard role={currentUser.role as UserRole} />} />
                <Route path="/:dept/hub" element={<DepartmentHub />} />
                <Route path="/sewing/output-transfer" element={<SewingOutputTransfer currentUser={currentUser} />} />
                <Route path="/washing/input" element={<WashingInput currentUser={currentUser} />} />
                <Route path="/washing/production-report" element={<WashingProductionReport />} />
                <Route path="/washing/wet-process" element={<WashingProcessView />} />
                <Route path="/washing/dry-process" element={<WashingProcessView />} />
                <Route path="/washing/:process" element={<Washing />} />
                <Route path="/store/fabric" element={<StoreInventory />} />
                <Route path="/store/accessories" element={<StoreInventory />} />
                <Route path="/:dept/report" element={<DepartmentWrapper Component={SectionReport} currentUser={currentUser} />} />
                <Route path="/:dept/report/efficiency" element={<DepartmentWrapper Component={EfficiencyReport} currentUser={currentUser} />} />
                <Route path="/:dept/report/daily-target" element={<DepartmentWrapper Component={DailyLineTargetReport} currentUser={currentUser} />} />
                <Route path="/:dept/report/manpower" element={<DepartmentWrapper Component={SectionReportManpower} currentUser={currentUser} />} />
                <Route path="/:dept/report/quality" element={<DepartmentWrapper Component={SectionReportQuality} currentUser={currentUser} />} />
                <Route path="/:dept/report/wip" element={<DepartmentWrapper Component={SectionReportWIP} currentUser={currentUser} />} />
                <Route path="/:dept/input/wip" element={<DepartmentWrapper Component={WIPEntry} currentUser={currentUser} />} />
                <Route path="/:dept/input/defects" element={<DepartmentWrapper Component={DefectInput} currentUser={currentUser} />} />
                <Route path="/:dept/input/manpower" element={<DepartmentWrapper Component={ManpowerSheet} currentUser={currentUser} />} />
                <Route path="/:dept/input/manpower/:process" element={<DepartmentWrapper Component={ManpowerSheet} currentUser={currentUser} />} />
                <Route path="/:dept/input/machines" element={<DepartmentWrapper Component={MachineSheet} currentUser={currentUser} />} />
                <Route path="/:dept/input/machines/:process" element={<DepartmentWrapper Component={MachineSheet} currentUser={currentUser} />} />
                <Route path="/:dept/input/npt" element={<DepartmentWrapper Component={NPTInput} currentUser={currentUser} />} />
                <Route path="/:dept/input/skills" element={<DepartmentWrapper Component={SkillMatrix} currentUser={currentUser} />} />
                <Route path="/:dept/audit/5s" element={<DepartmentWrapper Component={Audit5S} currentUser={currentUser} />} />
                <Route path="/:dept/audit/5s/:process" element={<DepartmentWrapper Component={Audit5S} currentUser={currentUser} />} />
                <Route path="/:dept/ie-activity" element={<DepartmentWrapper Component={IEActivity} currentUser={currentUser} />} />
                <Route path="/ot-analysis/:tab" element={<OTAnalysis />} />
                <Route path="/:dept/study/production" element={<DepartmentWrapper Component={ProductionStudy} currentUser={currentUser} />} />
                <Route path="/:dept/ie/qco-hub" element={<DepartmentWrapper Component={QCOHub} currentUser={currentUser} />} />
                <Route path="/:dept/ie/layout-master" element={<DepartmentWrapper Component={LayoutMaster} currentUser={currentUser} isTemplateMode={false} />} />
                <Route path="/:dept/ie/layout-bank" element={<DepartmentWrapper Component={LayoutBank} currentUser={currentUser} />} />
                <Route path="/admin/ie/layout-registry/:dept" element={<DepartmentWrapper Component={LayoutMaster} currentUser={currentUser} isTemplateMode={true} />} />
                <Route path="/:dept/ie/process-registry" element={<DepartmentWrapper Component={ProcessRegistry} currentUser={currentUser} />} />
                <Route path="/:dept/machine-analysis" element={<DepartmentWrapper Component={MachineAnalysis} currentUser={currentUser} />} />
                <Route path="/:dept/machine-analysis/:tab" element={<DepartmentWrapper Component={MachineAnalysis} currentUser={currentUser} />} />
                <Route path="/:dept/manpower-analysis" element={<DepartmentWrapper Component={ManpowerAnalysis} currentUser={currentUser} />} />
                <Route path="/:dept/manpower-analysis/:tab" element={<DepartmentWrapper Component={ManpowerAnalysis} currentUser={currentUser} />} />
                <Route path="/factory/costing/fabric-consumption" element={<FabricConsumption />} />
                <Route path="/factory/costing/sewing-thread-consumption" element={<SewingConsumption />} />
                <Route path="/factory/costing/trims-consumption" element={<TrimsConsumption />} />
                <Route path="/factory/costing/dashboard" element={<CostingDashboard />} />
                <Route path="/factory/costing/sewing-costing" element={<DepartmentWrapper Component={Costing} currentUser={currentUser} />} />
                <Route path="/factory/costing/wash-costing" element={<WashCosting />} />
                <Route path="/factory/costing/wash-costing/history" element={<WashCostingHistory />} />
                <Route path="/size-set-pilot/*" element={<SizeSetPilot />} />
                <Route path="/factory/costing/:dept/:sub" element={<DepartmentWrapper Component={Costing} currentUser={currentUser} />} />
                <Route path="/:dept/config/targets" element={<DepartmentWrapper Component={TargetSheet} currentUser={currentUser} role={currentUser.role} />} />
                <Route path="/config/planning" element={<ProductionPlanningView currentUser={currentUser} />} />
                <Route path="/planning/:tabId" element={<DepartmentWrapper Component={PlanningHub} currentUser={currentUser} />} />
                <Route path="/planning" element={<Navigate to="/planning/dashboard" replace />} />
                <Route path="/admin/analytics" element={currentUser.role === 'ADMIN' ? <FactoryAnalytics /> : <Navigate to="/" />} />
                <Route path="/admin/management" element={currentUser.role === 'ADMIN' ? <AdminManagement /> : <Navigate to="/" />} />
                <Route path="/admin/user-management" element={currentUser.role === 'ADMIN' ? <AdminUserManagement /> : <Navigate to="/" />} />
                <Route path="/enterprise/notice-board" element={<NoticeBoard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </div>
            </main>
          </div>
        </div>
      </HashRouter>
    </GlobalContext.Provider>
  );
};

const DepartmentWrapper: React.FC<any> = ({ Component, currentUser, ...extraProps }) => {
  const { dept, process, sub } = useParams();
  let formattedDept = dept ? (dept.charAt(0).toUpperCase() + dept.slice(1)) : 'Sewing';
  
  if (dept === 'print-embroidery') formattedDept = 'Print & Embroidery';
  
  return <Component currentUser={currentUser} department={formattedDept as any} processType={process} subType={sub} {...extraProps} />;
};

export default App;
