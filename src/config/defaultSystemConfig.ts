import type { SystemConfig } from '../types';
import { INITIAL_PERMISSIONS } from '../types';

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  designations: ['Supervisor', 'Operator', 'Ironman', 'Helper', 'Quality Inspector', 'Line Incharge', 'IE Engineer', 'Manager'],
  departments: ['IE', 'Cutting', 'Sewing', 'Washing', 'Finishing', 'Shipment', 'Quality', 'Maintenance', 'Costing', 'Planning', 'Print & Embroidery'],
  sections: ['Cutting', 'Sewing', 'Washing', 'Finishing', 'Print & Embroidery'],
  garmentParts: ['Preparation', 'Front Part', 'Back Part', 'Assembly', 'Finishing', 'Output', 'Sleeve Part', 'Collar Part', 'Other'],
  availableRoles: ['ADMIN', 'DATA_ENTRY', 'IE_REPORTER', 'MECHANIC', 'QUALITY_INSPECTOR', 'PRODUCTION_MANAGER', 'PLANNING_MANAGER', 'IE_COSTING', 'VIEWER'],
  accessTiers: [
    {
      id: 'tier-1',
      name: 'Full Access Admin',
      description: 'Complete system access for administrators',
      permissions: { ...INITIAL_PERMISSIONS }
    },
    {
      id: 'tier-2',
      name: 'Costing IE',
      description: 'Access to costing tabs, sheets, and charts',
      permissions: {
        ...INITIAL_PERMISSIONS,
        dashboard: 'VIEW_ONLY',
        governance: 'NONE',
        styleMaster: 'VIEW_ONLY',
        styleConfirmation: 'VIEW_ONLY'
      }
    },
    {
      id: 'tier-3',
      name: 'Production Reporter',
      description: 'Access for data entry in production lines',
      permissions: {
        ...INITIAL_PERMISSIONS,
        dashboard: 'VIEW_ONLY',
        governance: 'NONE',
        analytics: 'NONE',
        styleMaster: 'NONE'
      }
    }
  ],
  nptHierarchy: {},
  nptConfig: {
    Sewing: {
      MAINTENANCE: ['Machine Breakdown', 'Needle Change', 'Bobbin Change'],
      QUALITY: ['Rework', 'Defect Analysis', 'Quality Audit'],
      PRODUCTION: ['Wait for Work', 'Work Balance', 'Meeting'],
      UTILITY: ['Power Failure', 'Compressor Issue']
    }
  },
  otMapping: {
    'Production Delay': 'Production',
    'Technical Breakdown': 'Maintenance',
    'Material Shortage': 'Cutting',
    'Urgent Shipment': 'Shipment',
    'Sample Deadline': 'Sample'
  },
  lineMappings: Array.from({ length: 20 }, (_, i) => ({
    lineId: `Line ${String(i + 1).padStart(2, '0')}`,
    blockId: i < 10 ? 'Block-1' : 'Block-2',
    sectionId: 'Sewing',
    category: (i % 10) < 3 ? 'Governance' : (i % 10) < 6 ? 'Config' : 'Lines',
    layoutManpower: 67,
    budgetOp: 45,
    budgetIr: 4,
    budgetHp: 18
  })),
  manpowerBudgets: [],
  manpowerStatus: [
    { id: '1', employeeId: '42001001', name: 'Mamun Khan', designation: 'Operator', department: 'Sewing', section: 'Sewing', location: 'Floor-1', joined: '2022-01-10', type: 'Worker', grade: 'A', religion: 'Islam', gender: 'M' },
    { id: '2', employeeId: '42001002', name: 'Sumi Akter', designation: 'Helper', department: 'Sewing', section: 'Sewing', location: 'Floor-1', joined: '2023-05-15', type: 'Worker', grade: 'B', religion: 'Islam', gender: 'F' }
  ],
  productCategories: ['Denim Pants', 'Chino Pants', 'T-Shirt', 'Polo Shirt', 'Jacket', 'Shorts'],
  buyers: ['Jack & jones', 'Kmart', 'Zara', 'G-Star', 'Bestseller', 'Lidl'],
  stitchTypes: ['Lock stitch', 'Chain Stitch', '3T Overlock', '4T Overlock', '5T Overlock', 'Flatlock', 'Kansai', 'Feed off the arm', 'BT'],
  threadCounts: ['20/2', '20/3', '40/2', '40/3', '50/2', '60/2', '120D'],
  coneSizes: ['1000m', '2500m', '4000m', '5000m'],
  qualityIssues: {
    Sewing: {
      defects: ['Broken Stitch', 'Skipped Stitch', 'Open Seam', 'Puckering', 'Joint Stitch', 'Raw Edge'],
      rejects: ['Fabric Hole', 'Shade Variation', 'Oil Stain', 'Size Mistake']
    }
  },
  processConfigs: {
    Sewing: [
      { id: '1', garmentType: '5-Pocket', part: 'Back Part', processName: 'Back Pocket Join', machineType: 'DNLS', smv: 0.45 },
      { id: '2', garmentType: '5-Pocket', part: 'Assembly', processName: 'Side Seam', machineType: '4TOL', smv: 0.85 }
    ]
  },
  fiveSQuestions: {
    Sewing: [
      { key: 'S1', label: 'Sort: Red Tag items removed?', desc: 'Only necessary items on the floor' },
      { key: 'S2', label: 'Set in Order: Marked aisles?', desc: 'Clear paths and floor markings' },
      { key: 'S3', label: 'Shine: Clean machines?', desc: 'Daily cleaning checklist maintained' }
    ]
  },
  machineAssets: [
    { id: 'm1', machineName: 'JUKI DDL-9000C', mcId: 'MC-SW-001', asset: 'SN-992001', subNumber: '000', capitalizedOn: '2023-01-15', qrIdPrefix: 'SDL', assetDescription: 'Direct Drive High Speed Lockstitch', machineType: 'DNLS', status: 'Operational' },
    { id: 'm2', machineName: 'BROTHER S-7300A', mcId: 'MC-SW-002', asset: 'SN-992002', subNumber: '000', capitalizedOn: '2023-02-10', qrIdPrefix: 'SDL', assetDescription: 'Electronic Feed Lockstitch', machineType: 'DNLS', status: 'Operational' },
    { id: 'm3', machineName: 'PEGASUS M900', mcId: 'MC-SW-003', asset: 'SN-992003', subNumber: '000', capitalizedOn: '2023-03-05', qrIdPrefix: 'SDL', assetDescription: 'High Speed Overlock', machineType: '4TOL', status: 'Under repair' },
    { id: 'm4', machineName: 'YAMATO VG2700', mcId: 'MC-SW-004', asset: 'SN-992004', subNumber: '000', capitalizedOn: '2023-04-20', qrIdPrefix: 'SDL', assetDescription: 'Cylinder Bed Interlock', machineType: 'FOA', status: 'Operational' },
    { id: 'm5', machineName: 'KANSAI SPECIAL', mcId: 'MC-SW-005', asset: 'SN-992005', subNumber: '000', capitalizedOn: '2023-05-12', qrIdPrefix: 'SDL', assetDescription: 'Multi-needle Chainstitch', machineType: 'WST', status: 'Operational' }
  ],
  machineRequirements: [],
  staffDatabase: [
    { id: 's1', employeeId: '1001', name: 'Operator Alpha', designation: 'Operator', department: 'Sewing', section: 'Sewing', line: 'Line 01', joiningDate: '2023-01-01', employeeType: 'Worker' }
  ],
  notificationRoutes: [],
  layoutTemplates: [],
  learningCurve: {
    Sewing: [
      { label: 'A', min: 5, max: 10.99, curve: [60, 70, 80, 85, 85, 85, 85] },
      { label: 'B', min: 11, max: 14.99, curve: [60, 70, 80, 80, 80, 80, 80] },
      { label: 'C', min: 15, max: 17.99, curve: [60, 70, 80, 85, 85, 90, 90] },
      { label: 'D', min: 18, max: 22.99, curve: [50, 60, 70, 80, 80, 85, 85] },
      { label: 'E', min: 23, max: 27.99, curve: [45, 60, 70, 80, 85, 85, 85] },
      { label: 'F', min: 28, max: 35.99, curve: [40, 60, 70, 80, 85, 85, 85] },
      { label: 'G', min: 36, max: 42.99, curve: [40, 55, 70, 80, 85, 85, 85] },
      { label: 'H', min: 43, max: 48.99, curve: [40, 55, 65, 75, 80, 85, 85] },
      { label: 'I', min: 49, max: 54.99, curve: [40, 50, 65, 75, 80, 85, 85] },
      { label: 'J', min: 55, max: 59.99, curve: [40, 50, 60, 70, 75, 80, 80] },
      { label: 'K', min: 60, max: 75, curve: [35, 45, 55, 65, 75, 80, 80] }
    ]
  },
  hrReasons: {
    Sewing: {
      absent: ['Sickness', 'Personal Problem', 'Village Visit', 'Without Information'],
      late: ['Transport', 'Family Issue'],
      turnover: ['Better Opportunity', 'Resigned'],
      leave: ['Casual', 'Medical', 'Earned'],
      halfDay: ['Emergency', 'Sick']
    }
  },
  appraisalConfigs: [],
  appraisalRecords: [],
  otReasons: ['Production Delay', 'Urgent Shipment', 'Technical Breakdown', 'Material Shortage', 'Sample Deadline'],
  styles: ['JJ-DENIM-001', 'HM-CHINO-402', 'LV-511-SLIM', 'Z-JACKET-01'],
  threadRatios: [
    { id: 'tr-1', buyer: 'Jack & jones', stitchType: 'Lock stitch', pos1Name: 'Needle', pos1Ratio: 1.6, pos2Name: 'Bobbin', pos2Ratio: 1.3 },
    { id: 'tr-2', buyer: 'Jack & jones', stitchType: 'Chain Stitch', pos1Name: 'Needle', pos1Ratio: 2.8, pos2Name: 'Looper', pos2Ratio: 3.45 },
    { id: 'tr-3', buyer: 'Jack & jones', stitchType: '3T Overlock', pos1Name: 'Needle', pos1Ratio: 2.15, pos2Name: 'Looper', pos2Ratio: 14 },
    { id: 'tr-4', buyer: 'Jack & jones', stitchType: '4T Overlock', pos1Name: '1 Needle', pos1Ratio: 2.15, pos2Name: '3 Looper', pos2Ratio: 22.35 },
    { id: 'tr-5', buyer: 'Jack & jones', stitchType: '5T Overlock', pos1Name: '1 Chain Needle', pos1Ratio: 2.24, pos2Name: '1 Chain Looper', pos2Ratio: 3.94 },
    { id: 'tr-6', buyer: 'Jack & jones', stitchType: 'BT', pos1Name: 'Loop Bertack', pos1Ratio: 42, pos2Name: '', pos2Ratio: 0 },
    { id: 'tr-7', buyer: 'Jack & jones', stitchType: 'Flatlock', pos1Name: 'Needle', pos1Ratio: 4, pos2Name: 'Looper', pos2Ratio: 8.5 },
    { id: 'tr-8', buyer: 'Kmart', stitchType: 'Lock stitch', pos1Name: 'Needle', pos1Ratio: 1.5, pos2Name: 'Bobbin', pos2Ratio: 1.4 },
    { id: 'tr-9', buyer: 'Kmart', stitchType: 'Chain Stitch', pos1Name: 'Needle', pos1Ratio: 2.3, pos2Name: 'Looper', pos2Ratio: 4.3 },
    { id: 'tr-10', buyer: 'Kmart', stitchType: '3T Overlock', pos1Name: 'Needle', pos1Ratio: 2.15, pos2Name: 'Looper', pos2Ratio: 14 },
    { id: 'tr-11', buyer: 'Kmart', stitchType: '4T Overlock', pos1Name: '1 Needle', pos1Ratio: 4.9, pos2Name: '3 Looper', pos2Ratio: 18.5 }
  ],
  wastageData: [],
  sdlWastage: [
    { id: 'sdl1', minQty: 10, maxQty: 300, allowance: 100 },
    { id: 'sdl2', minQty: 301, maxQty: 600, allowance: 65 },
    { id: 'sdl3', minQty: 601, maxQty: 1200, allowance: 35 },
    { id: 'sdl4', minQty: 1201, maxQty: 2000, allowance: 24 },
    { id: 'sdl5', minQty: 2001, maxQty: 4000, allowance: 17 },
    { id: 'sdl6', minQty: 4001, maxQty: 10000, allowance: 10 },
    { id: 'sdl7', minQty: 10001, maxQty: 20000, allowance: 8 },
    { id: 'sdl8', minQty: 20001, maxQty: 30000, allowance: 7 },
    { id: 'sdl9', minQty: 30001, maxQty: 100000, allowance: 6 }
  ]
};
