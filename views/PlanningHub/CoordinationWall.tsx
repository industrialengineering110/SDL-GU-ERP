import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Filter, 
  Search,
  ArrowRight,
  User,
  Tag
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { CoordinationItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export const CoordinationWall: React.FC = () => {
  const [items, setItems] = useState<CoordinationItem[]>([]);
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newThread, setNewThread] = useState<Partial<CoordinationItem>>({
    title: '',
    description: '',
    fromDept: 'Planning',
    toDept: 'Cutting',
    priority: 'MEDIUM',
    status: 'OPEN',
    buyer: '',
    styleNumber: ''
  });

  useEffect(() => {
    const data = mockDb.getCoordinationItems();
    setItems(data);
  }, []);

  const handleCreateThread = () => {
    if (!newThread.title || !newThread.description) return;

    const item: CoordinationItem = {
      id: Date.now().toString(),
      title: newThread.title!,
      description: newThread.description!,
      fromDept: newThread.fromDept!,
      toDept: newThread.toDept!,
      priority: newThread.priority as any,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      buyer: newThread.buyer,
      styleNumber: newThread.styleNumber,
      assignedTo: ''
    };

    mockDb.saveCoordinationItem(item);
    setItems(prev => [item, ...prev]);
    setShowAddModal(false);
    setNewThread({
      title: '',
      description: '',
      fromDept: 'Planning',
      toDept: 'Cutting',
      priority: 'MEDIUM',
      status: 'OPEN',
      buyer: '',
      styleNumber: ''
    });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.styleNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = filterDept === 'All' || item.fromDept === filterDept || item.toDept === filterDept;
    const matchesPriority = filterPriority === 'All' || item.priority === filterPriority;

    return matchesSearch && matchesDept && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'HIGH': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'MEDIUM': return 'bg-blue-100 text-blue-600 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'IN_PROGRESS': return <Clock size={16} className="text-amber-500" />;
      default: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Coordination Wall</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Inter-departmental communication & issue tracking</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={16} />
          New Thread
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search threads, styles, buyers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Departments</option>
            <option value="Planning">Planning</option>
            <option value="Cutting">Cutting</option>
            <option value="Sewing">Sewing</option>
            <option value="Sample">Sample</option>
            <option value="Merchandising">Merchandising</option>
          </select>

          <select 
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-[8px] font-black uppercase border ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </span>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(item.status)}
                  <span className="text-[9px] font-black uppercase text-slate-400">{item.status}</span>
                </div>
              </div>

              <h3 className="text-sm font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-3 mb-4 flex-grow">{item.description}</p>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <User size={12} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{item.assignedTo || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Clock size={12} />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">
                    {item.fromDept}
                  </div>
                  <ArrowRight size={12} className="text-slate-300" />
                  <div className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase">
                    {item.toDept}
                  </div>
                </div>

                {item.styleNumber && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                    <Tag size={12} />
                    {item.buyer} / {item.styleNumber}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <MessageSquare size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-black uppercase tracking-widest">No active threads found</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl">
                    <Plus size={20} />
                  </div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">New Coordination Thread</h3>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <ArrowRight size={20} className="rotate-45" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={newThread.title}
                      onChange={e => setNewThread({ ...newThread, title: e.target.value })}
                      placeholder="Brief summary of the issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={newThread.priority}
                      onChange={e => setNewThread({ ...newThread, priority: e.target.value as any })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[120px]"
                    value={newThread.description}
                    onChange={e => setNewThread({ ...newThread, description: e.target.value })}
                    placeholder="Provide more details about the coordination required..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From Department</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={newThread.fromDept}
                      onChange={e => setNewThread({ ...newThread, fromDept: e.target.value })}
                    >
                      <option value="Planning">Planning</option>
                      <option value="Cutting">Cutting</option>
                      <option value="Sewing">Sewing</option>
                      <option value="Sample">Sample</option>
                      <option value="Merchandising">Merchandising</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Department</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={newThread.toDept}
                      onChange={e => setNewThread({ ...newThread, toDept: e.target.value })}
                    >
                      <option value="Planning">Planning</option>
                      <option value="Cutting">Cutting</option>
                      <option value="Sewing">Sewing</option>
                      <option value="Sample">Sample</option>
                      <option value="Merchandising">Merchandising</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={newThread.buyer}
                      onChange={e => setNewThread({ ...newThread, buyer: e.target.value })}
                      placeholder="e.g. LEVI'S"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Style Number</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={newThread.styleNumber}
                      onChange={e => setNewThread({ ...newThread, styleNumber: e.target.value })}
                      placeholder="e.g. DMN-5544"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateThread}
                  className="bg-blue-600 text-white px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
                >
                  Create Thread
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
