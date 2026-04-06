import React, { useState } from 'react';
import { SizeSetPilotRequest } from '../../types';
import { FileText, Download, Filter, Printer, X, Save } from 'lucide-react';

interface Props {
  requests: SizeSetPilotRequest[];
}

const FullReport: React.FC<Props> = ({ requests }) => {
  const [selectedReq, setSelectedReq] = useState<SizeSetPilotRequest | null>(null);
  const [editedRemarks, setEditedRemarks] = useState<Record<string, string>>({});

  const exportCSV = () => {
    // ... (existing exportCSV logic)
    const headers = ['Style', 'Buyer', 'Type', 'Planner Qty', 'Cutting Qty', 'Sewing Qty', 'Quality Passed', 'Quality Rejects', 'Wash Qty', 'Status'];
    const rows = requests.map(req => [
      req.styleNumber,
      req.buyer,
      req.requestType,
      req.requestedQuantity,
      req.stages['Cutting Concern'].quantityHandled,
      req.stages['Sewing / Sample Line Concern'].quantityHandled,
      req.stages['Quality Team'].quantityHandled,
      req.stages['Quality Team'].rejectionQty,
      req.stages['Wash Sample Concern'].quantityHandled,
      req.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `size_set_pilot_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600/10 rounded-lg text-indigo-600">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Full Style Report</h2>
            <p className="text-xs text-muted-foreground font-bold">Comprehensive pre-production workflow history</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-xl text-xs font-bold hover:bg-muted/80 transition-all">
            <Printer size={14} /> Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-xl text-xs font-bold hover:bg-muted/80 transition-all">
            <Filter size={14} /> Filter
          </button>
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Style Details</th>
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Planner</th>
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cutting</th>
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sewing</th>
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Quality</th>
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Wash</th>
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Risk & Remarks</th>
              <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Final Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedReq(req)}>
                <td className="p-4">
                  <p className="text-xs font-black uppercase">{req.styleNumber}</p>
                  <p className="text-[10px] text-muted-foreground font-bold">{req.buyer} • {req.requestType}</p>
                </td>
                <td className="p-4">
                  <p className="text-xs font-bold">{req.requestedQuantity} Pcs</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(req.requestDate).toLocaleDateString()}</p>
                </td>
                <td className="p-4">
                  <p className="text-xs font-bold">{req.stages['Cutting Concern'].quantityHandled} Pcs</p>
                  <p className={`text-[10px] font-bold ${req.stages['Cutting Concern'].status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {req.stages['Cutting Concern'].status}
                  </p>
                </td>
                <td className="p-4">
                  <p className="text-xs font-bold">{req.stages['Sewing / Sample Line Concern'].quantityHandled} Pcs</p>
                  <p className={`text-[10px] font-bold ${req.stages['Sewing / Sample Line Concern'].status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {req.stages['Sewing / Sample Line Concern'].status}
                  </p>
                </td>
                <td className="p-4">
                  <p className="text-xs font-bold">{req.stages['Quality Team'].quantityHandled} Pcs</p>
                  <p className="text-[10px] text-rose-500 font-bold">{req.stages['Quality Team'].rejectionQty} Rejects</p>
                </td>
                <td className="p-4">
                  <p className="text-xs font-bold">{req.stages['Wash Sample Concern'].quantityHandled} Pcs</p>
                  <p className={`text-[10px] font-bold ${req.stages['Wash Sample Concern'].status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {req.stages['Wash Sample Concern'].status}
                  </p>
                </td>
                <td className="p-4 max-w-[200px]">
                  <div className="space-y-1">
                    {Object.entries(req.stages).map(([name, data]) => (
                      data.issueNotes || data.remarks ? (
                        <div key={name} className="text-[9px] leading-tight">
                          <span className="font-black uppercase text-primary">{name.split(' ')[0]}:</span>
                          <span className="text-muted-foreground"> {data.issueNotes} {data.remarks}</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                    req.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {req.status}
                  </span>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground italic">No data available for report.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedReq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-8 rounded-3xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase">Detailed Report: {selectedReq.styleNumber}</h3>
              <button onClick={() => setSelectedReq(null)} className="p-2 hover:bg-muted rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(selectedReq.stages).map(([name, data]) => (
                <div key={name} className="p-4 bg-muted/30 rounded-2xl border border-border">
                  <h4 className="text-sm font-black uppercase mb-2">{name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <p><span className="font-bold">Status:</span> {data.status}</p>
                    <p><span className="font-bold">Qty:</span> {data.quantityHandled}</p>
                    <div className="col-span-2">
                      <label className="font-bold">Remarks:</label>
                      <input 
                        className="w-full p-2 bg-white rounded-xl border border-border mt-1"
                        value={editedRemarks[name] || data.remarks || ''}
                        onChange={e => setEditedRemarks({...editedRemarks, [name]: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="font-bold">Risk Points:</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {data.riskPoints?.map((point, index) => (
                          <span key={index} className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 text-rose-600 rounded-full text-[10px] font-black uppercase">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end gap-2">
              <button onClick={() => setSelectedReq(null)} className="px-6 py-3 bg-muted rounded-2xl text-xs font-black uppercase">Cancel</button>
              <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase">
                <Save size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullReport;
