import React from 'react';

export const SkillConfigEditor: React.FC<{ config: any[]; onUpdate: (c: any[]) => void }> = ({ config, onUpdate }) => {
  return (
    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
      <h3 className="text-sm font-black uppercase text-slate-900 mb-4">Skill Configuration Editor</h3>
      <p className="text-xs text-slate-500 font-bold italic">Editor interface placeholder</p>
    </div>
  );
};
