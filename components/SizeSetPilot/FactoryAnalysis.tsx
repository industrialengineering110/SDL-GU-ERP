import React, { useState } from 'react';
import { SizeSetPilotRequest } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, PlusCircle, Save } from 'lucide-react';

interface Props {
  requests: SizeSetPilotRequest[];
}

const FactoryAnalysis: React.FC<Props> = ({ requests }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'new-sop'>('analysis');

  const departments = ['Cutting', 'Sewing', 'Quality', 'Wash'];
  
  const failRateData = departments.map(dept => {
    let total = 0;
    let fails = 0;
    requests.forEach(req => {
      const stage = req.stages[dept === 'Cutting' ? 'Cutting Concern' : dept === 'Sewing' ? 'Sewing / Sample Line Concern' : dept === 'Quality' ? 'Quality Team' : 'Wash Sample Concern'];
      if (stage) {
        total += stage.quantityHandled || 0;
        fails += stage.rejectionQty || 0;
      }
    });
    return {
      name: dept,
      failRate: total > 0 ? (fails / total) * 100 : 0
    };
  });

  return (
    <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-2xl shadow-black/5 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Factory Analysis</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Department-wise Performance & SOPs</p>
          </div>
        </div>
        <div className="flex p-1 bg-muted/30 rounded-2xl border border-border/50 gap-1">
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:bg-white/50'}`}
          >
            Analysis
          </button>
          <button 
            onClick={() => setActiveTab('new-sop')}
            className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'new-sop' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:bg-white/50'}`}
          >
            New SOP
          </button>
        </div>
      </div>

      {activeTab === 'analysis' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center justify-between hover:border-primary/50 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-black uppercase">IE PROCESS LAB</h3>
                  <p className="text-xs text-muted-foreground">INDUSTRIAL ENGINEERING</p>
                </div>
              </div>
              <div className="p-2 bg-muted rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </div>

            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center justify-between hover:border-primary/50 transition-all cursor-pointer" onClick={() => setActiveTab('new-sop')}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                  <PlusCircle size={24} />
                </div>
                <div>
                  <h3 className="font-black uppercase">NEW SOP</h3>
                  <p className="text-xs text-muted-foreground">ADD NEW STANDARD OPERATING PROCEDURE</p>
                </div>
              </div>
              <div className="p-2 bg-muted rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-muted/30 p-6 rounded-3xl border border-border">
              <h3 className="text-sm font-black uppercase mb-6">Department-wise Fail Rate (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={failRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="failRate" fill="#f43f5e" name="Fail Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-muted/30 p-6 rounded-3xl border border-border">
              <h3 className="text-sm font-black uppercase mb-6">SOP Documents</h3>
              <div className="space-y-4">
                {['Cutting SOP', 'Sewing SOP', 'Quality SOP', 'Wash SOP'].map(sop => (
                  <div key={sop} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border">
                    <span className="text-xs font-black uppercase">{sop}</span>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase">View</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/30 p-8 rounded-3xl border border-border animate-in fade-in duration-300">
          <h3 className="text-sm font-black uppercase mb-6 flex items-center gap-2">
            <PlusCircle size={18} />
            Add New SOP Document
          </h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SOP Title</label>
              <input type="text" className="w-full p-4 bg-white border border-border/50 rounded-2xl outline-none text-sm font-bold" placeholder="e.g., New Cutting Procedure" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department</label>
              <select className="w-full p-4 bg-white border border-border/50 rounded-2xl outline-none text-sm font-bold">
                <option>Cutting</option>
                <option>Sewing</option>
                <option>Quality</option>
                <option>Wash</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
              <textarea className="w-full p-4 bg-white border border-border/50 rounded-2xl outline-none text-sm font-bold h-32" placeholder="Describe the procedure..." />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:translate-y-[-2px] transition-all flex items-center gap-3">
                <Save size={18} />
                Save SOP
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FactoryAnalysis;
