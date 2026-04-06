import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Scissors, Boxes, Box, ArrowLeft, Search, Filter, Plus } from 'lucide-react';

export default function StoreInventory() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'fabric' | 'accessories'>('fabric');

  // Set active tab based on URL path
  useEffect(() => {
    if (location.pathname.includes('accessories')) {
      setActiveTab('accessories');
    } else {
      setActiveTab('fabric');
    }
  }, [location]);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/store/hub')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Store Inventory</h1>
            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase mt-1">Manage Materials & Trims</p>
          </div>
        </div>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
          <Plus size={16} />
          Add Item
        </button>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button 
            onClick={() => {
              setActiveTab('fabric');
              navigate('/store/fabric');
            }}
            className={`flex-1 py-5 text-sm font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-3 ${
              activeTab === 'fabric' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            <Scissors size={18} />
            Fabric
          </button>
          <button 
            onClick={() => {
              setActiveTab('accessories');
              navigate('/store/accessories');
            }}
            className={`flex-1 py-5 text-sm font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-3 ${
              activeTab === 'accessories' 
                ? 'text-amber-600 border-b-2 border-amber-600 bg-white' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            <Boxes size={18} />
            Accessories
          </button>
        </div>
        
        <div className="p-6 border-b border-slate-100 flex gap-4 bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
          <button className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-bold uppercase tracking-wider text-xs flex items-center gap-2 hover:bg-slate-100 transition-colors">
            <Filter size={16} />
            Filter
          </button>
        </div>

        <div className="p-12 text-center min-h-[400px] flex flex-col items-center justify-center bg-slate-50/50">
          {activeTab === 'fabric' ? (
            <>
              <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Scissors className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Fabric Inventory</h3>
              <p className="text-slate-500 max-w-md mx-auto font-medium">
                Manage your fabric rolls, track yardage, and monitor stock levels for different materials and colors.
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Box className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Accessories Inventory</h3>
              <p className="text-slate-500 max-w-md mx-auto font-medium">
                Track buttons, zippers, threads, labels, and other essential garment accessories.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
