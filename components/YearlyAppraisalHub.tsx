import React, { useState, useMemo } from 'react';
import { AppraisalRecord, SystemConfig } from '../types';
import { Printer, Edit, Search, Filter } from 'lucide-react';

interface Props {
  config: SystemConfig;
  department: string;
}

export const YearlyAppraisalHub: React.FC<Props> = ({ config, department }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('');

  const records = useMemo(() => {
    return config.appraisalRecords.filter(r => r.section === department);
  }, [config.appraisalRecords, department]);

  const calculatedRecords = useMemo(() => {
    return records.map(record => {
      const rule = config.appraisalConfigs.find(c => c.section === record.section && c.designation === record.designation);
      if (!rule) return { ...record, effScore: 0, absScore: 0, machScore: 0, totalMarks: 0 };

      const effScore = rule.efficiencyRules.find(r => record.efficiency >= r.minEff && record.efficiency <= r.maxEff)?.score || 0;
      const absScore = rule.absenteeismRules.find(r => record.absentPercentage <= r.maxAbsentPercent)?.score || 0;
      const machScore = rule.machineCountRules.find(r => record.numMachines >= r.minMachines)?.score || 0;

      const totalMarks = (record.skillScore * rule.totalWeight.skill) +
                         (effScore * rule.totalWeight.efficiency) +
                         (absScore * rule.totalWeight.absenteeism) +
                         (machScore * rule.totalWeight.machines);

      return { ...record, effScore, absScore, machScore, totalMarks };
    });
  }, [records, config.appraisalConfigs]);

  const filteredRecords = useMemo(() => {
    return calculatedRecords.filter(r => 
      (r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || r.employeeId.includes(searchTerm)) &&
      (filterSection === '' || r.section === filterSection) &&
      (filterDesignation === '' || r.designation === filterDesignation)
    );
  }, [calculatedRecords, searchTerm, filterSection, filterDesignation]);

  const sections = useMemo(() => Array.from(new Set(records.map(r => r.section))), [records]);
  const designations = useMemo(() => Array.from(new Set(records.map(r => r.designation))), [records]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-tighter text-slate-900">Yearly Appraisal Hub - {department}</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input className="bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold w-64" placeholder="Search Name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
            <option value="">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" value={filterDesignation} onChange={e => setFilterDesignation(e.target.value)}>
            <option value="">All Designations</option>
            {designations.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="border border-slate-200 overflow-hidden rounded-[2rem] shadow-lg bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest h-12">
              <th className="px-6">Employee</th>
              <th className="px-6">Designation</th>
              <th className="px-6">Section</th>
              <th className="px-6 text-center">Skill</th>
              <th className="px-6 text-center">Absent %</th>
              <th className="px-6 text-center">Machines</th>
              <th className="px-6 text-center">Eff %</th>
              <th className="px-6 text-center">Total</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold text-slate-700 divide-y">
            {filteredRecords.map(record => (
              <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-black text-slate-900">{record.employeeName} ({record.employeeId})</td>
                <td className="px-6 py-4">{record.designation}</td>
                <td className="px-6 py-4">{record.section}</td>
                <td className="px-6 py-4 text-center">{record.skillScore}</td>
                <td className="px-6 py-4 text-center">{record.absentPercentage}%</td>
                <td className="px-6 py-4 text-center">{record.numMachines}</td>
                <td className="px-6 py-4 text-center">{record.efficiency}%</td>
                <td className="px-6 py-4 text-center font-black text-blue-600">{record.totalMarks.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
