import React, { useState, useEffect } from 'react';
import { 
  History, 
  User, 
  Calendar, 
  ArrowRight, 
  Info,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { PlanningRevision } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export const RevisionHistory: React.FC = () => {
  const [revisions, setRevisions] = useState<PlanningRevision[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const data = mockDb.getPlanningRevisions();
    // Sort by date descending
    setRevisions(data.sort((a, b) => new Date(b.revisedAt).getTime() - new Date(a.revisedAt).getTime()));
  }, []);

  const filteredRevisions = revisions.filter(rev => 
    rev.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rev.revisedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rev.newSnapshot.styleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Planning Revision History</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Track all changes made to production plans</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search by reason, planner, or style..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredRevisions.length > 0 ? (
          filteredRevisions.map((rev, idx) => (
            <div key={rev.id} className="relative pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-slate-200 last:before:bottom-8">
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-50 border-4 border-white shadow-sm flex items-center justify-center z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div 
                  className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === rev.id ? null : rev.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400">Revised At</span>
                      <span className="text-xs font-bold text-slate-900">{new Date(rev.revisedAt).toLocaleString()}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400">Revised By</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                          <User size={10} className="text-slate-500" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{rev.revisedBy}</span>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400">Style</span>
                      <span className="text-xs font-black text-blue-600 uppercase">{rev.newSnapshot.styleNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase text-slate-400">Reason</span>
                      <span className="text-xs font-bold text-slate-600 italic">"{rev.reason}"</span>
                    </div>
                    {expandedId === rev.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === rev.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Previous State */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                            Previous Snapshot
                          </h4>
                          <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2 shadow-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Line:</span>
                              <span className="font-bold">{rev.previousSnapshot.lineId || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Plan Qty:</span>
                              <span className="font-bold">{rev.previousSnapshot.planQuantity?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Efficiency:</span>
                              <span className="font-bold">{rev.previousSnapshot.targetEff}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Hours:</span>
                              <span className="font-bold">{rev.previousSnapshot.workingHours}h</span>
                            </div>
                          </div>
                        </div>

                        {/* New State */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            New Snapshot
                          </h4>
                          <div className="bg-white border border-blue-100 rounded-xl p-4 text-xs space-y-2 shadow-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Line:</span>
                              <span className={`font-bold ${rev.newSnapshot.lineId !== rev.previousSnapshot.lineId ? 'text-blue-600' : ''}`}>
                                {rev.newSnapshot.lineId}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Plan Qty:</span>
                              <span className={`font-bold ${rev.newSnapshot.planQuantity !== rev.previousSnapshot.planQuantity ? 'text-blue-600' : ''}`}>
                                {rev.newSnapshot.planQuantity?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Efficiency:</span>
                              <span className={`font-bold ${rev.newSnapshot.targetEff !== rev.previousSnapshot.targetEff ? 'text-blue-600' : ''}`}>
                                {rev.newSnapshot.targetEff}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Hours:</span>
                              <span className={`font-bold ${rev.newSnapshot.workingHours !== rev.previousSnapshot.workingHours ? 'text-blue-600' : ''}`}>
                                {rev.newSnapshot.workingHours}h
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <History size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-black uppercase tracking-widest">No revision history found</p>
          </div>
        )}
      </div>
    </div>
  );
};
