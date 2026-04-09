import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDb } from '../services/mockDb';
import { WashCostingRecord } from '../types';
import { Search, Printer, Edit, Eye, ArrowLeft } from 'lucide-react';

const WashCostingHistory: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<WashCostingRecord[]>(mockDb.getWashCostingRecords());
  const [search, setSearch] = useState('');

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.styleNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.buyer.toLowerCase().includes(search.toLowerCase()) ||
      r.color.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><ArrowLeft size={20} /></button>
          <h1 className="text-2xl font-black uppercase italic">Wash Costing History</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by buyer, style, color..."
            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-bold"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 uppercase font-black text-slate-500">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Buyer</th>
              <th className="p-4">Style</th>
              <th className="p-4">Color</th>
              <th className="p-4">Total Cost</th>
              <th className="p-4">User</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold">{new Date(r.date).toLocaleDateString()}</td>
                <td className="p-4 font-bold">{r.buyer}</td>
                <td className="p-4 font-bold">{r.styleNumber}</td>
                <td className="p-4 font-bold">{r.color}</td>
                <td className="p-4 font-black text-emerald-600">${r.totalCost.toFixed(2)}</td>
                <td className="p-4 font-bold">{r.user}</td>
                <td className="p-4 flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-cyan-500"><Eye size={16} /></button>
                  <button className="p-2 text-slate-400 hover:text-amber-500"><Edit size={16} /></button>
                  <button className="p-2 text-slate-400 hover:text-slate-900"><Printer size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WashCostingHistory;
