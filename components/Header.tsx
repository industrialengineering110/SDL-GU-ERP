
import React, { useState, useEffect } from 'react';
import { Menu, X, User as UserIcon, Bell, ChevronDown, CheckCheck, AlertCircle, Cpu, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { UserRole, AppUser as UserType, AppNotification as NotificationType } from '../types';
import { mockDb } from '../services/mockDb';
import { apiService } from '../services/apiService';
import { useGlobal } from '../App';

interface HeaderProps {
  user: UserType;
  onUserChange: (user: UserType) => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onUserChange, toggleSidebar, isSidebarOpen }) => {
  const { theme, toggleTheme } = useGlobal();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const roles = Object.values(UserRole);

  useEffect(() => {
    const checkConnection = async () => {
      const status = await apiService.checkHealth();
      setIsLive(status);
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNotifs = () => {
      try {
        const all = mockDb.getNotifications();
        const filtered = all.filter(n => 
          (n.toDepartment === 'ALL' || n.toDepartment === user.department) &&
          (!n.toRole || n.toRole === user.role)
        );
        setNotifications(filtered);
      } catch (e) {
        console.warn("Notification sync failed", e);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.readBy.includes(user.id)).length;

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    onUserChange({
      ...user,
      role: newRole,
      name: `${newRole.charAt(0) + newRole.slice(1).toLowerCase()} User`
    });
  };

  const markRead = (id: string) => {
    mockDb.markNotificationRead(id, user.id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readBy: [...n.readBy, user.id] } : n));
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-sm transition-colors bg-card text-foreground">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-xl transition-colors hover:bg-accent text-muted-foreground"
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="hidden md:flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="font-black leading-tight tracking-tight uppercase italic text-foreground">
              SQUARE DENIM'S LTD. (GU)
            </h2>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isLive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-muted border-border text-muted-foreground'}`}>
               {isLive ? <Wifi size={10} /> : <WifiOff size={10} />}
               <span className="text-[8px] font-black uppercase tracking-widest">{isLive ? 'Live API' : 'Demo Mode'}</span>
            </div>
          </div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] leading-none">
            Industrial Engineering Department
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl transition-all relative group bg-muted text-foreground hover:bg-accent"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-500" />}
        </button>

        <div className="relative">
           <button 
             onClick={() => setShowNotifications(!showNotifications)}
             className="p-2.5 rounded-2xl transition-all relative group bg-muted text-muted-foreground hover:bg-accent"
           >
              <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 border-2 border-background rounded-full text-[8px] font-black text-white flex items-center justify-center">
                   {unreadCount}
                </span>
              )}
           </button>

           {showNotifications && (
             <>
               <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
               <div className="absolute right-0 mt-3 w-80 rounded-[2rem] border border-border shadow-2xl z-20 overflow-hidden animate-in slide-in-from-top-2 bg-popover text-popover-foreground">
                  <div className="p-5 border-b border-border flex items-center justify-between bg-muted/50">
                     <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Enterprise Alerts</h3>
                     <span className="text-[10px] font-bold text-muted-foreground">{unreadCount} New</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                     {notifications.map(n => (
                       <div key={n.id} className={`p-5 border-b border-border transition-colors ${n.readBy.includes(user.id) ? 'bg-popover opacity-60' : 'bg-blue-500/10'}`}>
                          <div className="flex gap-4">
                             <div className={`p-2 rounded-xl h-fit ${n.type === 'ALERT' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                <AlertCircle size={16} />
                             </div>
                             <div className="flex-1 space-y-1">
                                <p className="text-xs font-bold leading-relaxed text-foreground">{n.message}</p>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{n.from} • {new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                {!n.readBy.includes(user.id) && (
                                   <button onClick={() => markRead(n.id)} className="text-[9px] font-black text-blue-600 uppercase mt-2 flex items-center gap-1 hover:underline">
                                      <CheckCheck size={10} /> Mark read
                                   </button>
                                )}
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
             </>
           )}
        </div>

        <div className="h-8 w-px hidden sm:block bg-border"></div>

        <div className="flex flex-col items-end">
           <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Access Tier</span>
           <select 
             value={user.role as string} 
             onChange={handleRoleChange}
             className="text-xs sm:text-sm font-black text-blue-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 appearance-none dark:text-blue-400"
           >
             {roles.map(r => <option key={r as string} value={r as string} className="bg-popover text-popover-foreground">{(r as string).replace('_', ' ')}</option>)}
           </select>
        </div>

        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black leading-none text-foreground">{user.name}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1">{user.department}</p>
          </div>
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center transition-colors bg-foreground text-background border border-border">
            <UserIcon size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
