
import React, { useState } from 'react';
import { Lock, User, LogIn, ShieldAlert, HelpCircle } from 'lucide-react';
import { AppUser as UserType } from '../types';
import { mockDb } from '../services/mockDb';
import Logo from '../components/Logo';
import { getAuthService } from '../services/auth';

interface LoginProps {
  onLogin: (user: UserType) => void;
  onGoToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoToSignup }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      console.log("DEBUG: Login attempt with:", `"${employeeId.trim()}"`, `"${password.trim()}"`);
      const authService = getAuthService();
      const user = await authService.login(employeeId.trim(), password.trim());

      if (user) {
        // Map AuthUser to AppUser as expected by onLogin
        // Note: This mapping assumes AuthUser and AppUser compatibility
        onLogin(user as unknown as UserType);
      } else {
        setError('Authentication Failed: Invalid ID or Password.');
      }
    } catch (err) {
      setError('An unexpected error occurred during authentication.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card rounded-[3rem] shadow-2xl border border-border p-10 sm:p-14 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
           <Logo size={60} />
           <div>
             <h1 className="text-xl font-black text-foreground tracking-tight leading-tight uppercase italic">Square Denim Limited<br/>(Garments Unit)</h1>
             <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mt-2">Industrial Engineering Department</p>
           </div>
        </div>

        <div className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Office ID</label>
                 <div className="relative group">
                   <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                   <input 
                     required 
                     className="w-full bg-muted border border-border rounded-2xl pl-12 pr-4 py-4 font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                     value={employeeId} 
                     onChange={e => setEmployeeId(e.target.value)} 
                     placeholder="Employee ID" 
                   />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Password</label>
                 <div className="relative group">
                   <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                   <input 
                     required 
                     type="password"
                     className="w-full bg-muted border border-border rounded-2xl pl-12 pr-4 py-4 font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                     value={password} 
                     onChange={e => setPassword(e.target.value)} 
                     placeholder="••••••••" 
                   />
                 </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 text-rose-600 rounded-2xl border border-rose-500/20 flex items-center gap-3 text-xs font-bold animate-in shake duration-300">
                   <ShieldAlert size={16} /> {error}
                </div>
              )}

              <button type="submit" className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95">
                 <LogIn size={20} /> Authenticate Session
              </button>
           </form>
        </div>

        <div className="pt-6 border-t border-border flex flex-col items-center gap-4">
           <button 
             onClick={() => setShowHelp(!showHelp)}
             className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
           >
             <HelpCircle size={14} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Help</span>
           </button>
           
           {showHelp && (
             <div className="bg-muted p-4 rounded-2xl border border-border animate-in fade-in slide-in-from-top-2 w-full">
                <p className="text-[10px] text-muted-foreground font-bold text-center leading-relaxed">
                   Enter your registered Office ID.<br/>
                   New users must use "Register New Profile" below.
                </p>
             </div>
           )}

           <div className="w-full text-center">
              <p className="text-muted-foreground text-xs font-medium">Don't have an account?</p>
              <button onClick={onGoToSignup} className="text-primary font-black text-xs uppercase tracking-widest mt-1 hover:underline decoration-2 underline-offset-4">Register New Profile</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
