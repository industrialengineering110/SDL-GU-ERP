import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Save,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { PlanningOwnership as IPlanningOwnership, AppUser } from '../../types';
import { useGlobal } from '../../App';

export const PlanningOwnership: React.FC = () => {
  const { currentUser } = useGlobal();
  const [ownerships, setOwnerships] = useState<IPlanningOwnership[]>([]);
  const [linePlanners, setLinePlanners] = useState<string[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [buyers, setBuyers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setOwnerships(mockDb.getPlanningOwnerships());
    setLinePlanners(mockDb.getLineLoadingPlanners());
    setUsers(mockDb.getUsers());
    setBuyers(mockDb.getBuyers());
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PLANNING_MANAGER';

  const handleSaveOwnership = (ownership: IPlanningOwnership) => {
    if (!isAdmin) return;
    mockDb.savePlanningOwnership({ ...ownership, updatedAt: new Date().toISOString() });
    setOwnerships(mockDb.getPlanningOwnerships());
    setMessage('Ownership updated successfully');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteOwnership = (id: string) => {
    if (!isAdmin) return;
    const updated = ownerships.filter(o => o.id !== id);
    localStorage.setItem('protrack_planning_ownerships', JSON.stringify(updated));
    setOwnerships(updated);
  };

  const handleSavePlanners = (newList: string[]) => {
    if (!isAdmin) return;
    mockDb.saveLineLoadingPlanners(newList);
    setLinePlanners(newList);
    setMessage('Planners list updated');
    setTimeout(() => setMessage(''), 3000);
  };

  const addNewOwnership = () => {
    if (!isAdmin) return;
    const newOwnership: IPlanningOwnership = {
      id: Date.now().toString(),
      buyer: '',
      planningOwner: '',
      lineLoadingPlanner: '',
      updatedAt: new Date().toISOString()
    };
    setOwnerships([newOwnership, ...ownerships]);
  };

  const filteredOwnerships = ownerships.filter(o => 
    o.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.planningOwner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Chart 1: Buyer & Planning Owner */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Buyer Planning Ownership</h2>
            <p className="text-slate-500 text-xs font-medium">Assign Planning Owners to specific Buyers</p>
          </div>
          {isAdmin && (
            <button 
              onClick={addNewOwnership}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <UserPlus size={14} /> Add New Buyer Assignment
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search by Buyer or Owner..." 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase h-12">
                  <th className="px-6">Buyer</th>
                  <th className="px-6">Planning Owner</th>
                  <th className="px-6">Last Update</th>
                  <th className="px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOwnerships.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <select 
                        disabled={!isAdmin}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                        value={o.buyer}
                        onChange={(e) => {
                          const updated = ownerships.map(item => item.id === o.id ? { ...item, buyer: e.target.value } : item);
                          setOwnerships(updated);
                        }}
                      >
                        <option value="">Select Buyer</option>
                        {buyers.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        disabled={!isAdmin}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                        value={o.planningOwner}
                        onChange={(e) => {
                          const updated = ownerships.map(item => item.id === o.id ? { ...item, planningOwner: e.target.value } : item);
                          setOwnerships(updated);
                        }}
                      >
                        <option value="">Select Planning Owner</option>
                        {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                      {new Date(o.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleSaveOwnership(o)}
                              className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Save Changes"
                            >
                              <Save size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteOwnership(o.id)}
                              className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Delete Assignment"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Chart 2: Line Loading Planners */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Line Loading Planners</h2>
            <p className="text-slate-500 text-xs font-medium">Authorized personnel for Line Loading Board management</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => {
                const newList = [...linePlanners, ''];
                setLinePlanners(newList);
              }}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <UserPlus size={14} /> Add Planner
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase h-12">
                  <th className="px-6">Line Loading Planner</th>
                  <th className="px-6">Last Update</th>
                  <th className="px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linePlanners.map((planner, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <select 
                        disabled={!isAdmin}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                        value={planner}
                        onChange={(e) => {
                          const newList = [...linePlanners];
                          newList[idx] = e.target.value;
                          setLinePlanners(newList);
                        }}
                      >
                        <option value="">Select User</option>
                        {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                      {new Date().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleSavePlanners(linePlanners)}
                              className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Save List"
                            >
                              <Save size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                const newList = linePlanners.filter((_, i) => i !== idx);
                                handleSavePlanners(newList);
                              }}
                              className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Remove Planner"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {linePlanners.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No planners authorized yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {message && (
        <div className="fixed bottom-8 right-8 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl font-black z-[1200] animate-in slide-in-from-right-5 border-2 border-white flex items-center gap-2.5 text-xs">
          <CheckCircle size={18}/> {message}
        </div>
      )}
    </div>
  );
};
