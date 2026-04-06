import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowRight,
  Calendar,
  Package,
  User,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { OrderPoolEntry } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export const ReadyForPlan: React.FC = () => {
  const [orders, setOrders] = useState<OrderPoolEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const allOrders = mockDb.getOrderPoolEntries();
    setOrders(allOrders);
  }, []);

  const checkReadiness = (order: OrderPoolEntry) => {
    const blockers: string[] = [];
    if (!order.soNo) blockers.push('Missing SO No');
    if (order.smv <= 0) blockers.push('Missing SMV');
    if (order.orderQty <= 0) blockers.push('Invalid Order Qty');
    
    // Check for costing data
    const costing = mockDb.getLatestCosting(order.buyer, order.style);
    if (!costing) {
      blockers.push('Missing Costing Data');
    }
    
    return {
      isReady: blockers.length === 0,
      status: blockers.length === 0 ? 'Ready' : 'Blocked',
      blockers
    };
  };

  const filteredOrders = orders.filter(o => 
    o.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.soNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Ready For Plan</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Orders awaiting line loading validation</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search by style, buyer, or SO..."
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

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order) => {
            const readiness = checkReadiness(order);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={order.id}
                className={`bg-white border ${readiness.isReady ? 'border-slate-200' : 'border-rose-100 bg-rose-50/10'} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 p-3">
                  <div className={`${readiness.isReady ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} p-1.5 rounded-lg`}>
                    {readiness.isReady ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${readiness.isReady ? 'bg-slate-100' : 'bg-rose-100'} flex items-center justify-center text-slate-400`}>
                    <Package size={20} className={readiness.isReady ? 'text-slate-400' : 'text-rose-400'} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">{order.style}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{order.buyer} • SO: {order.soNo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Order Qty</span>
                    <span className="text-xs font-black text-slate-900">{order.orderQty.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">SMV</span>
                    <span className="text-xs font-black text-slate-900">{order.smv}</span>
                  </div>
                </div>

                {!readiness.isReady && (
                  <div className="mb-6 p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <span className="text-[9px] font-black uppercase text-rose-600 block mb-1">Blockers</span>
                    <div className="flex flex-wrap gap-1">
                      {readiness.blockers.map((b, i) => (
                        <span key={i} className="text-[9px] font-bold text-rose-500 bg-white px-1.5 py-0.5 rounded border border-rose-100">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-slate-50 mt-auto">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar size={12} />
                      Ship: {new Date(order.shipDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-500">
                      <Clock size={12} />
                      {order.shipmentLeftDate || '25 days left'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                        <User size={10} className="text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">{order.merchandiser}</span>
                    </div>
                    {readiness.isReady && (
                      <button className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:translate-x-1 transition-transform">
                        Go to Board
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <AlertCircle size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-black uppercase tracking-widest">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};
