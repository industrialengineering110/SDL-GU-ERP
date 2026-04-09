import React from 'react';
import { SizeSetPilotRequest } from '../../types';

export interface StageProps {
  requests: SizeSetPilotRequest[];
  onUpdate?: (id: string, updates: Partial<SizeSetPilotRequest>) => void;
}

export const EmptyState: React.FC<{title:string; subtitle?:string}> = ({ title, subtitle }) => (
  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
    <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
    <p className="text-sm text-muted-foreground mt-2">{subtitle ?? 'No data available yet.'}</p>
  </div>
);

export const RequestTable: React.FC<StageProps & { stageKey?: string }> = ({ requests, stageKey }) => {
  const rows = requests.map((req) => {
    const stage = stageKey ? req.stages[stageKey as keyof typeof req.stages] : undefined;
    return {
      id: req.id,
      buyer: req.buyer,
      styleNumber: req.styleNumber,
      type: req.requestType,
      quantity: req.requestedQuantity,
      status: stage?.status ?? req.status,
      person: stage?.responsiblePerson ?? req.plannerName,
      remarks: stage?.remarks ?? '',
    };
  });

  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2 min-w-[760px]">
        <thead>
          <tr>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Buyer</th>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Style</th>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qty</th>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Owner</th>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 bg-muted/30 rounded-l-2xl text-xs font-bold">{row.buyer}</td>
              <td className="px-4 py-3 bg-muted/30 text-xs font-bold">{row.styleNumber}</td>
              <td className="px-4 py-3 bg-muted/30 text-xs font-bold">{row.type}</td>
              <td className="px-4 py-3 bg-muted/30 text-xs font-bold">{row.quantity}</td>
              <td className="px-4 py-3 bg-muted/30 text-xs font-bold">{row.person}</td>
              <td className="px-4 py-3 bg-muted/30 text-xs font-bold">{row.status}</td>
              <td className="px-4 py-3 bg-muted/30 rounded-r-2xl text-xs text-muted-foreground">{row.remarks || '-'}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No requests found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
