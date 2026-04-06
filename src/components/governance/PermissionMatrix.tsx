import React from 'react';
import { ChevronDown, Settings, LayoutDashboard, FileText, Shield, Bell } from 'lucide-react';
import { Module, PermissionAction } from '../../types/governance';

interface PermissionMatrixProps {
  modules: Module[];
  onTogglePermission: (moduleId: string, subId: string, componentId: string, action: PermissionAction) => void;
}

const getIcon = (name: string) => {
  switch (name) {
    case 'Dashboard': return <LayoutDashboard size={16} />;
    case 'Washing': case 'Finishing': case 'Shipment': return <FileText size={16} />;
    case 'Governance': return <Shield size={16} />;
    case 'Notice Board': return <Bell size={16} />;
    default: return <Settings size={16} />;
  }
};

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ modules, onTogglePermission }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Permission Management</h2>
      </div>

      <div className="w-full">
        {/* Header */}
        <div className="grid grid-cols-[1fr,repeat(5,80px)] gap-4 pb-4 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div>Module / Sub-Module / Component</div>
          {['View', 'Create', 'Edit', 'Delete', 'Approve'].map(a => <div key={a} className="text-center">{a}</div>)}
        </div>

        {/* Modules */}
        {modules.map(module => (
          <div key={module.id} className="py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 font-bold text-blue-900 mb-2 bg-blue-50 p-2 rounded-lg">
              {getIcon(module.name)}
              {module.name}
            </div>
            {module.submodules.map(sub => (
              <div key={sub.id} className="pl-4">
                <div className="font-semibold text-gray-800 py-2">{sub.name}</div>
                {sub.components.map(comp => (
                  <div key={comp.id} className="grid grid-cols-[1fr,repeat(5,80px)] gap-4 py-2 items-center hover:bg-gray-50 rounded-lg px-2">
                    <div className="pl-8 text-sm text-gray-700 font-medium flex items-center gap-2">
                      {comp.name}
                    </div>
                    {(['view', 'create', 'edit', 'delete', 'approve'] as PermissionAction[]).map(action => (
                      <div key={action} className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={comp.permissions[action]}
                          onChange={() => onTogglePermission(module.id, sub.id, comp.id, action)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PermissionMatrix;
