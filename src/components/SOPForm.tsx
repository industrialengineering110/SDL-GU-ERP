import React from 'react';

const SOPForm: React.FC<{ onSave: (sop: any) => void; onCancel: () => void; type?: string }> = ({ onSave, onCancel, type }) => {
  return (
    <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
      <h2 className="text-xl font-black uppercase italic text-slate-900 mb-4">SOP Form {type ? `(${type})` : ''}</h2>
      <div className="flex justify-end gap-4 mt-6">
        <button onClick={onCancel} className="px-6 py-2 text-xs font-black uppercase text-slate-500">Cancel</button>
        <button onClick={() => onSave({})} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase">Save SOP</button>
      </div>
    </div>
  );
};

export default SOPForm;
