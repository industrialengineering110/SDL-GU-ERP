
import { db as dexieDb } from './db.dexie';
const db = dexieDb;
import { syncEngine } from './syncEngine';
import { apiService } from './apiService';
import { 
  AppUser, SystemConfig, WIPRecord, StyleInfo, DailyTarget, 
  ProductionRecord, ManpowerRecord, NPTRecord, StyleConfirmation, 
  LineMapping, Audit5SRecord, HREntry, 
  MachineAsset, LayoutMasterRecord, OTRequest, StylePlan,
  LayoutTemplate, SkillRecord, AppNotification, DefectRecord, TimeStudyRecord, QCORecord,
  MachineMaintenanceRecord, MachineBreakdownRecord, SparePartRecord,
  MachineRecord, SewingCosting, ThreadConsumption, OrderPoolEntry, PreProductionTracker, PlanningOwnership,
  SizeSetPilotRequest, SOP, WashCostingRecord, IEActivityData,
  INITIAL_PERMISSIONS, ProductionTransfer, CoordinationItem, PlanningRevision,
  FabricConsumptionEntry, TrimsConsumptionEntry
} from '../types';

const TODAY = new Date().toISOString().split('T')[0];
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const THIS_MONTH = TODAY.slice(0, 7);

const mockSDLWastage = [
  { id: 'sdl1', minQty: 10, maxQty: 300, allowance: 100 },
  { id: 'sdl2', minQty: 301, maxQty: 600, allowance: 65 },
  { id: 'sdl3', minQty: 601, maxQty: 1200, allowance: 35 },
  { id: 'sdl4', minQty: 1201, maxQty: 2000, allowance: 24 },
  { id: 'sdl5', minQty: 2001, maxQty: 4000, allowance: 17 },
  { id: 'sdl6', minQty: 4001, maxQty: 10000, allowance: 10 },
  { id: 'sdl7', minQty: 10001, maxQty: 20000, allowance: 8 },
  { id: 'sdl8', minQty: 20001, maxQty: 30000, allowance: 7 },
  { id: 'sdl9', minQty: 30001, maxQty: 100000, allowance: 6 },
];

const DEFAULT_CONFIG: SystemConfig = {
  designations: ["Supervisor", "Operator", "Ironman", "Helper", "Quality Inspector", "Line Incharge", "IE Engineer", "Manager"],
  departments: ["IE", "Cutting", "Sewing", "Washing", "Finishing", "Shipment", "Quality", "Maintenance", "Costing", "Planning", "Print & Embroidery"],
  sections: ["Cutting", "Sewing", "Washing", "Finishing", "Print & Embroidery"],
  garmentParts: ["Preparation", "Front Part", "Back Part", "Assembly", "Finishing", "Output", "Sleeve Part", "Collar Part", "Other"],
  availableRoles: ["ADMIN", "DATA_ENTRY", "IE_REPORTER", "MECHANIC", "QUALITY_INSPECTOR", "PRODUCTION_MANAGER", "PLANNING_MANAGER", "IE_COSTING", "VIEWER"],
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
    "Sewing": {
      "MAINTENANCE": ["Machine Breakdown", "Needle Change", "Bobbin Change"],
      "QUALITY": ["Rework", "Defect Analysis", "Quality Audit"],
      "PRODUCTION": ["Wait for Work", "Work Balance", "Meeting"],
      "UTILITY": ["Power Failure", "Compressor Issue"]
    }
  },
  otMapping: {
    "Production Delay": "Production",
    "Technical Breakdown": "Maintenance",
    "Material Shortage": "Cutting",
    "Urgent Shipment": "Shipment",
    "Sample Deadline": "Sample"
  },
  lineMappings: Array.from({length: 20}, (_, i) => ({
    lineId: `Line ${String(i+1).padStart(2, '0')}`,
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
  productCategories: ["Denim Pants", "Chino Pants", "T-Shirt", "Polo Shirt", "Jacket", "Shorts"],
  buyers: ["Jack & jones", "Kmart", "Zara", "G-Star", "Bestseller", "Lidl"],
  stitchTypes: ['Lock stitch', 'Chain Stitch', '3T Overlock', '4T Overlock', '5T Overlock', 'Flatlock', 'Kansai', 'Feed off the arm', 'BT'],
  threadCounts: ['20/2', '20/3', '40/2', '40/3', '50/2', '60/2', '120D'],
  coneSizes: ['1000m', '2500m', '4000m', '5000m'],
  qualityIssues: {
    "Sewing": {
      "defects": ["Broken Stitch", "Skipped Stitch", "Open Seam", "Puckering", "Joint Stitch", "Raw Edge"],
      "rejects": ["Fabric Hole", "Shade Variation", "Oil Stain", "Size Mistake"]
    }
  },
  processConfigs: {
    "Sewing": [
      { id: "1", garmentType: "5-Pocket", part: "Back Part", processName: "Back Pocket Join", machineType: "DNLS", smv: 0.45 },
      { id: "2", garmentType: "5-Pocket", part: "Assembly", processName: "Side Seam", machineType: "4TOL", smv: 0.85 }
    ]
  },
  fiveSQuestions: {
    "Sewing": [
      { key: "S1", label: "Sort: Red Tag items removed?", desc: "Only necessary items on the floor" },
      { key: "S2", label: "Set in Order: Marked aisles?", desc: "Clear paths and floor markings" },
      { key: "S3", label: "Shine: Clean machines?", desc: "Daily cleaning checklist maintained" }
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
    { id: "s1", employeeId: "1001", name: "Operator Alpha", designation: "Operator", department: "Sewing", section: "Sewing", line: "Line 01", joiningDate: "2023-01-01", employeeType: "Worker" }
  ],
  notificationRoutes: [],
  layoutTemplates: [],
  learningCurve: {
    "Sewing": [
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
      { label: 'K', min: 60, max: 75.00, curve: [35, 45, 55, 65, 75, 80, 80] },
    ]
  },
  hrReasons: {
    "Sewing": {
      absent: ["Sickness", "Personal Problem", "Village Visit", "Without Information"],
      late: ["Transport", "Family Issue"],
      turnover: ["Better Opportunity", "Resigned"],
      leave: ["Casual", "Medical", "Earned"],
      halfDay: ["Emergency", "Sick"]
    }
  },
  appraisalConfigs: [],
  appraisalRecords: [],
  otReasons: ["Production Delay", "Urgent Shipment", "Technical Breakdown", "Material Shortage", "Sample Deadline"],
  styles: ["JJ-DENIM-001", "HM-CHINO-402", "LV-511-SLIM", "Z-JACKET-01"],
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
    { id: 'tr-11', buyer: 'Kmart', stitchType: '4T Overlock', pos1Name: '1 Needle', pos1Ratio: 4.9, pos2Name: '3 Looper', pos2Ratio: 18.5 },
    { id: 'tr-12', buyer: 'Kmart', stitchType: '5T Overlock', pos1Name: '1 Chain Needle', pos1Ratio: 3, pos2Name: '1 Chain Looper', pos2Ratio: 4 },
    { id: 'tr-13', buyer: 'Zara', stitchType: 'Lock stitch', pos1Name: 'Needle', pos1Ratio: 1.5, pos2Name: 'Bobbin', pos2Ratio: 1.3 },
    { id: 'tr-14', buyer: 'Zara', stitchType: 'Chain Stitch', pos1Name: 'Needle', pos1Ratio: 2.5, pos2Name: 'Looper', pos2Ratio: 3.75 },
    { id: 'tr-15', buyer: 'Zara', stitchType: '3T Overlock', pos1Name: 'Needle', pos1Ratio: 2.15, pos2Name: 'Looper', pos2Ratio: 14 },
    { id: 'tr-16', buyer: 'Zara', stitchType: '4T Overlock', pos1Name: '1 Needle', pos1Ratio: 2.3, pos2Name: '3 Looper', pos2Ratio: 22.9 },
    { id: 'tr-17', buyer: 'Zara', stitchType: '5T Overlock', pos1Name: '1 Chain Needle', pos1Ratio: 3.25, pos2Name: '1 Needle', pos2Ratio: 3.25 },
    { id: 'tr-18', buyer: 'G-Star', stitchType: 'Lock stitch', pos1Name: 'Needle', pos1Ratio: 1.5, pos2Name: 'Bobbin', pos2Ratio: 1.5 },
    { id: 'tr-19', buyer: 'G-Star', stitchType: 'Chain Stitch', pos1Name: 'Needle', pos1Ratio: 2.0, pos2Name: 'Looper', pos2Ratio: 2.5 },
    { id: 'tr-20', buyer: 'G-Star', stitchType: '4T Overlock', pos1Name: 'Needle', pos1Ratio: 4.0, pos2Name: 'Looper', pos2Ratio: 12.0 },
    { id: 'tr-21', buyer: 'Bestseller', stitchType: 'Lock stitch', pos1Name: 'Needle', pos1Ratio: 1.5, pos2Name: 'Bobbin', pos2Ratio: 1.5 },
    { id: 'tr-22', buyer: 'Bestseller', stitchType: 'Chain Stitch', pos1Name: 'Needle', pos1Ratio: 2.0, pos2Name: 'Looper', pos2Ratio: 2.5 },
    { id: 'tr-23', buyer: 'Bestseller', stitchType: '5T Overlock', pos1Name: 'Needle', pos1Ratio: 5.0, pos2Name: 'Looper', pos2Ratio: 15.0 },
    { id: 'tr-f1', buyer: '', stitchType: 'Lock stitch', pos1Name: 'Needle', pos1Ratio: 1.5, pos2Name: 'Bobbin', pos2Ratio: 1.3 },
    { id: 'tr-f2', buyer: '', stitchType: 'Chain Stitch', pos1Name: 'Needle', pos1Ratio: 2.5, pos2Name: 'Looper', pos2Ratio: 3.5 },
    { id: 'tr-f3', buyer: '', stitchType: '3T Overlock', pos1Name: 'Needle', pos1Ratio: 2.15, pos2Name: 'Looper', pos2Ratio: 14 },
    { id: 'tr-f4', buyer: '', stitchType: '4T Overlock', pos1Name: 'Needle', pos1Ratio: 4.0, pos2Name: 'Looper', pos2Ratio: 12.0 },
    { id: 'tr-f5', buyer: '', stitchType: '5T Overlock', pos1Name: 'Needle', pos1Ratio: 5.0, pos2Name: 'Looper', pos2Ratio: 15.0 },
    { id: 'tr-f6', buyer: '', stitchType: 'Flatlock', pos1Name: 'Needle', pos1Ratio: 4, pos2Name: 'Looper', pos2Ratio: 8.5 },
    { id: 'tr-f7', buyer: '', stitchType: 'Kansai', pos1Name: 'Needle', pos1Ratio: 3.5, pos2Name: 'Looper', pos2Ratio: 5.5 },
    { id: 'tr-f8', buyer: '', stitchType: 'BT', pos1Name: 'Loop Bertack', pos1Ratio: 42, pos2Name: '', pos2Ratio: 0 },
  ],
  wastageData: [
    { name: 'Cutting', value: 2 },
    { name: 'Sewing', value: 15 },
    { name: 'Finishing', value: 1 },
    { name: 'Washing', value: 5 },
  ],
  sdlWastage: mockSDLWastage,
  offDays: [],
};

// --- SEED DATA DEFINITIONS ---

const SEED_LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'lt-1',
    name: 'Basic Denim Pant',
    section: 'Sewing',
    garmentType: 'Denim Pants',
    operations: [
      { id: 'lt-op-1', operationName: 'Front Pocket Join', smv: 0.45, mcType: 'Lock stitch', part: 'Front' },
      { id: 'lt-op-2', operationName: 'Back Pocket Attach', smv: 0.85, mcType: 'Lock stitch', part: 'Back' },
      { id: 'lt-op-3', operationName: 'Side Seam', smv: 1.2, mcType: '5T Overlock', part: 'Assembly' },
      { id: 'lt-op-4', operationName: 'Inseam', smv: 1.1, mcType: 'Feed off the arm', part: 'Assembly' },
      { id: 'lt-op-5', operationName: 'Waistband Attach', smv: 1.5, mcType: 'Kansai', part: 'Assembly' },
    ]
  },
  {
    id: 'lt-2',
    name: 'Basic T-Shirt',
    section: 'Sewing',
    garmentType: 'T-Shirt',
    operations: [
      { id: 'lt-op-6', operationName: 'Shoulder Join', smv: 0.35, mcType: '4T Overlock', part: 'Assembly' },
      { id: 'lt-op-7', operationName: 'Neck Rib Attach', smv: 0.55, mcType: '4T Overlock', part: 'Neck' },
      { id: 'lt-op-8', operationName: 'Sleeve Attach', smv: 0.75, mcType: '4T Overlock', part: 'Sleeve' },
      { id: 'lt-op-9', operationName: 'Bottom Hem', smv: 0.65, mcType: 'Flatlock', part: 'Hem' },
    ]
  }
];

const SEED_STYLES: StyleInfo[] = [
  {
    id: 's-1', buyer: "Jack & jones", styleNumber: 'JJ-DENIM-001', styleCode: 'JJ-2024-01', styleName: 'Slim Fit Jeans', productCategory: '5-Pocket',
    numberOfStyling: 1, numberOfStyle: 1, numberOfColor: 2, marketingOrderQty: 50000, lineConsideration: 4, description: '',
    createdAt: TODAY, smv: 18.50, marketingSmv: 18.00, marketingTop: 450, marketingAverage: 380, marketingEfficiency: 85,
    productionTopTarget: 420, productionAverageTarget: 360, productionTargetEfficiency: 82, remarks: 'Standard Slim Fit', history: []
  },
  {
    id: 's-2', buyer: 'Zara', styleNumber: 'ZR-CHINO-402', styleCode: 'ZR-2024-02', styleName: 'Regular Chino', productCategory: 'Chino',
    numberOfStyling: 1, numberOfStyle: 1, numberOfColor: 1, marketingOrderQty: 30000, lineConsideration: 3, description: '',
    createdAt: TODAY, smv: 22.50, marketingSmv: 22.00, marketingTop: 380, marketingAverage: 320, marketingEfficiency: 80,
    productionTopTarget: 350, productionAverageTarget: 300, productionTargetEfficiency: 78, remarks: 'Heavy Denim Chino', history: []
  },
  {
    id: 's-3', buyer: "G-Star", styleNumber: 'GS-3301-ST', styleCode: 'GS-2024-03', styleName: '3301 Straight', productCategory: '5-Pocket',
    numberOfStyling: 1, numberOfStyle: 1, numberOfColor: 3, marketingOrderQty: 100000, lineConsideration: 5, description: '',
    createdAt: TODAY, smv: 19.20, marketingSmv: 19.00, marketingTop: 480, marketingAverage: 400, marketingEfficiency: 88,
    productionTopTarget: 460, productionAverageTarget: 380, productionTargetEfficiency: 85, remarks: 'Global Best Seller', history: []
  }
];

const SEED_SEWING_COSTINGS: SewingCosting[] = [
  {
    id: 'sc-1',
    buyer: 'Jack & jones',
    styleNumber: 'JJ-DENIM-001',
    styleCode: 'JJ-2024-01',
    productCategory: '5-Pocket',
    size: '32',
    fabrication: '12oz Denim',
    numStyling: 1,
    numStyle: 1,
    numColor: 2,
    marketingOrderQty: 50000,
    lineConsideration: 4,
    operations: [
      { id: 'op-1', name: 'Front Pocket Join', smv: 0.45, machineType: 'Plain Machine' },
      { id: 'op-2', name: 'Back Yoke Join', smv: 0.65, machineType: 'Feed of the Arm' },
      { id: 'op-3', name: 'Side Seam', smv: 0.85, machineType: 'Overlock' }
    ],
    dailyTargets: [{ day: 1, target: 300 }, { day: 2, target: 450 }],
    topTargetDay: 2,
    createdAt: TODAY,
    updatedAt: TODAY,
    user: 'Admin',
    history: []
  },
  {
    id: 'sc-2',
    buyer: 'Zara',
    styleNumber: 'ZR-CHINO-402',
    styleCode: 'ZR-2024-02',
    productCategory: 'Chino',
    size: '34',
    fabrication: 'Twill',
    numStyling: 1,
    numStyle: 1,
    numColor: 1,
    marketingOrderQty: 30000,
    lineConsideration: 3,
    operations: [],
    dailyTargets: [{ day: 1, target: 250 }, { day: 2, target: 400 }],
    topTargetDay: 2,
    createdAt: TODAY,
    updatedAt: TODAY,
    user: 'Admin',
    history: []
  },
  {
    id: 'sc-3',
    buyer: "G-Star",
    styleNumber: 'GS-3301-ST',
    styleCode: 'GS-2024-03',
    productCategory: '5-Pocket',
    size: '32',
    fabrication: 'Stretch Denim',
    numStyling: 1,
    numStyle: 1,
    numColor: 3,
    marketingOrderQty: 100000,
    lineConsideration: 5,
    operations: [],
    dailyTargets: [{ day: 1, target: 400 }, { day: 2, target: 600 }],
    topTargetDay: 2,
    createdAt: TODAY,
    updatedAt: TODAY,
    user: 'Admin',
    history: []
  }
];

const SEED_THREAD_CONSUMPTIONS: ThreadConsumption[] = [
  {
    id: 'tc-1',
    type: 'SHORT',
    styleNumber: 'JJ-DENIM-001',
    styleCode: 'JJ-001',
    buyer: 'Jack & jones',
    productCategory: 'Denim',
    productType: '5-Pocket',
    color: 'Indigo',
    date: TODAY,
    allowancePercent: 15,
    orderQuantity: 50000,
    coneSizeMeters: 4000,
    threadSpecs: [{ count: '20/2', shade: 'S-101', coneSize: '4000m' }],
    operations: [
      { id: 'r-1', stitchType: 'Lock stitch', pos1Factor: 1.5, pos2Factor: 1.3, seamLengthCm: 120, threadMeters: 3.36, count: '20/2', shade: 'S-101' }
    ],
    totalThreadMeters: 3.36,
    finalThreadMeters: 3.86,
    totalCones: 0.001,
    totalFabricConsumption: 1200,
    totalThreadConsumption: 450,
    bookedFabricQuantity: 1300,
    bookedThreadQuantity: 500,
    inhouseFabricQuantity: 1250,
    inhouseThreadQuantity: 480,
    createdAt: TODAY,
    updatedAt: TODAY,
    user: 'admin'
  },
  {
    id: 'tc-2',
    type: 'SHORT',
    styleNumber: 'GS-3301-ST',
    styleCode: 'GS-3301',
    buyer: 'G-Star',
    productCategory: 'Denim',
    productType: '5-Pocket',
    color: 'Dark Blue',
    date: TODAY,
    allowancePercent: 15,
    orderQuantity: 30000,
    coneSizeMeters: 4000,
    threadSpecs: [{ count: '20/2', shade: 'S-105', coneSize: '4000m' }],
    operations: [
      { id: 'r-2', stitchType: 'Lock stitch', pos1Factor: 1.5, pos2Factor: 1.3, seamLengthCm: 120, threadMeters: 3.36, count: '20/2', shade: 'S-105' }
    ],
    totalThreadMeters: 3.36,
    finalThreadMeters: 3.86,
    totalCones: 0.001,
    totalFabricConsumption: 800,
    totalThreadConsumption: 300,
    bookedFabricQuantity: 1200,
    bookedThreadQuantity: 600,
    inhouseFabricQuantity: 1000,
    inhouseThreadQuantity: 500,
    createdAt: TODAY,
    updatedAt: TODAY,
    user: 'admin'
  },
  {
    id: 'tc-3',
    type: 'SHORT',
    styleNumber: 'ZARA-CHINO-003',
    styleCode: 'Z-003',
    buyer: 'Zara',
    productCategory: 'Chino',
    productType: 'Slim Fit',
    color: 'Beige',
    date: TODAY,
    allowancePercent: 12,
    orderQuantity: 30000,
    coneSizeMeters: 5000,
    threadSpecs: [{ count: '40/2', shade: 'B-202', coneSize: '5000m' }],
    operations: [
      { id: 'r-3', stitchType: 'Overlock', pos1Factor: 1.8, pos2Factor: 1.5, seamLengthCm: 150, threadMeters: 4.95, count: '40/2', shade: 'B-202' }
    ],
    totalThreadMeters: 4.95,
    finalThreadMeters: 5.54,
    totalCones: 0.001,
    totalFabricConsumption: 2500,
    totalThreadConsumption: 900,
    bookedFabricQuantity: 3500,
    bookedThreadQuantity: 1500,
    inhouseFabricQuantity: 3000,
    inhouseThreadQuantity: 1200,
    createdAt: TODAY,
    updatedAt: TODAY,
    user: 'admin'
  }
];

const SEED_CONFIRMATIONS: StyleConfirmation[] = [
  {
    id: 'c-1', buyer: "Jack & jones", styleNumber: 'JJ-DENIM-001', soNumber: '100220', mpo: 'MPO-101', confirmedBy: 'Admin', timestamp: TODAY, status: 'ACTIVE',
    variants: [{ po: 'PO-01', color: 'Dark Blue', quantity: 25000 }, { po: 'PO-02', color: 'Light Blue', quantity: 25000 }]
  }
];

const SEED_PLANS: StylePlan[] = [
  {
    id: 'p-1', soNumber: '100220', buyer: "Levi's", styleNumber: 'LV-511-SLIM', planQuantity: 12000, orderQuantity: 50000,
    selectedPos: ['PO-01'], selectedColors: ['Dark Blue'], smv: 18.5, targetEff: 85, manpower: 67, workingHours: 10,
    lineId: 'Line 01', shipmentDate: '2026-05-10', priority: 'NORMAL', status: 'ACTIVE', isComplete: true, timestamp: TODAY,
    sections: {
      Sewing: { inputDate: TODAY, outputDate: '2026-04-15', workingDays: 20, requiredPcsPerDay: 450, status: 'ACTIVE' },
      Cutting: { inputDate: YESTERDAY, outputDate: TODAY, workingDays: 2, requiredPcsPerDay: 6000, status: 'COMPLETED' },
      Washing: { inputDate: '2026-04-16', outputDate: '2026-04-20', workingDays: 4, requiredPcsPerDay: 3000, status: 'PLANNING' },
      Finishing: { inputDate: '2026-04-21', outputDate: '2026-04-25', workingDays: 4, requiredPcsPerDay: 3000, status: 'PLANNING' }
    },
    fabricStatus: 'In-house', accessoriesStatus: 'In-house', sampleStatus: 'In-house', fileHandoverStatus: 'In-house', printEmbStatus: 'In-house'
  }
];

const SEED_WIP: WIPRecord[] = [
  { id: 'w-1', date: TODAY, time: '08:00', department: 'Sewing', section: 'Sewing', blockId: 'Block-1', lineId: 'Line 01', soNumber: '100220', buyer: "Levi's", styleNumber: 'LV-511-SLIM', color: 'Dark Blue', inputQty: 2000, outputQty: 0, reporterRole: 'PRODUCTION_INPUT', reporterId: 'admin', timestamp: TODAY }
];

const SEED_PRODUCTION: ProductionRecord[] = [
  { id: 'pr-1', date: TODAY, time: '09:00', timestamp: TODAY, department: 'Sewing', section: 'Sewing', blockId: 'Block-1', lineId: 'Line 01', soNumber: '100220', buyer: "Levi's", styleCode: 'LV-511-SLIM', color: 'Dark Blue', actual: 45, target: 45, hour: 9, reporterId: 'admin' },
  { id: 'pr-2', date: TODAY, time: '10:00', timestamp: TODAY, department: 'Sewing', section: 'Sewing', blockId: 'Block-1', lineId: 'Line 01', soNumber: '100220', buyer: "Levi's", styleCode: 'LV-511-SLIM', color: 'Dark Blue', actual: 48, target: 45, hour: 10, reporterId: 'admin' }
];

const SEED_DEFECTS: DefectRecord[] = [
  { id: 'd-1', date: TODAY, time: '10:15', timestamp: TODAY, department: 'Sewing', section: 'Sewing', blockId: 'Block-1', lineId: 'Line 01', soNumber: '100220', buyer: "Levi's", styleCode: 'LV-511-SLIM', color: 'Dark Blue', defectType: 'Broken Stitch', count: 5, isReject: false, reporterId: 'admin' },
  { id: 'd-2', date: TODAY, time: '10:30', timestamp: TODAY, department: 'Sewing', section: 'Sewing', blockId: 'Block-1', lineId: 'Line 01', soNumber: '100220', buyer: "Levi's", styleCode: 'LV-511-SLIM', color: 'Dark Blue', defectType: 'Fabric Hole', count: 2, isReject: true, reporterId: 'admin' }
];

const SEED_MANPOWER: ManpowerRecord[] = [
  { id: 'm-1', date: TODAY, department: 'Sewing', blockId: 'Block-1', lineId: 'Line 01', totalSupervisor: 1, presentOp: 45, presentIr: 4, presentHp: 18, headCount: 67, headCountExtra: 0, budgetOp: 45, budgetIr: 4, budgetHp: 18, totalRecruit: 67, closeOp: 0, closeHpIr: 0, actualRecruit: 67, absent: 0, layoutManpower: 67, layoutExtra: 0, timestamp: TODAY, reporterId: 'admin' }
];

const SEED_OT: OTRequest[] = [
  { id: 'ot-1', date: TODAY, department: 'Sewing', blockId: 'Block-1', lineId: 'Line 01', buyer: "Levi's", style: 'LV-511-SLIM', headcount8hr: 67, hourlyOTManpower: { "9Hr": 67, "10Hr": 67, "11Hr": 40, "12Hr": 0, "13Hr": 0, "14Hr": 0, "15Hr": 0 }, reason: 'Production Delay', responsibleDept: 'Production', comments: '', status: 'APPROVED', requestedBy: 'Supervisor', timestamp: TODAY }
];

const SEED_TARGETS: DailyTarget[] = [
  { id: 't-1', date: TODAY, department: 'Sewing', lineId: 'Line 01', blockId: 'Block-1', styleNumber: 'LV-511-SLIM', productItem: '5-Pocket', buyer: "Levi's", sam: 18.5, outputStartDate: TODAY, daysRunning: 1, actualSamEarner: 67, lineWip: 2000, workingHours: 10, headCount: 67, todayTargetPcs: 450, targetEfficiency: 85, mmTopTgtHr: 420, lineCapacity: 320, lineHrPrdn: 45, remarks: 'High Priority' }
];

const SEED_MAINTENANCE: MachineMaintenanceRecord[] = [
  { id: 'maint-1', machineId: 'm1', mcId: 'MC-SW-001', machineName: 'JUKI DDL-9000C', type: 'PREVENTIVE', scheduledDate: TODAY, technicianId: 'tech-1', technicianName: 'Rahim Uddin', status: 'PENDING' },
  { id: 'maint-2', machineId: 'm2', mcId: 'MC-SW-002', machineName: 'BROTHER S-7300A', type: 'PREVENTIVE', scheduledDate: TODAY, technicianId: 'tech-2', technicianName: 'Karim Ali', status: 'PENDING' }
];

const SEED_BREAKDOWNS: MachineBreakdownRecord[] = [
  { id: 'brk-1', machineId: 'm3', mcId: 'MC-SW-003', machineName: 'PEGASUS M900', lineId: 'Line 01', startTime: `${TODAY}T08:30:00`, issueType: 'Needle Break', status: 'OPEN', technicianId: 'tech-1', technicianName: 'Rahim Uddin' },
  { id: 'brk-2', machineId: 'm4', mcId: 'MC-SW-004', machineName: 'YAMATO VG2700', lineId: 'Line 02', startTime: `${TODAY}T09:15:00`, issueType: 'Motor Issue', status: 'IN_PROGRESS', technicianId: 'tech-2', technicianName: 'Karim Ali' }
];

const SEED_SPARES: SparePartRecord[] = [
  { id: 'sp-1', partName: 'Needle (DBx1)', partNumber: 'N-001', category: 'Needle', stockQty: 150, minStockQty: 50, unit: 'Pkt' },
  { id: 'sp-2', partName: 'Bobbin Case', partNumber: 'B-002', category: 'Bobbin', stockQty: 45, minStockQty: 20, unit: 'Pcs' },
  { id: 'sp-3', partName: 'Looper', partNumber: 'L-003', category: 'Overlock', stockQty: 12, minStockQty: 15, unit: 'Pcs' }
];

const SEED_LAYOUT_MASTERS: LayoutMasterRecord[] = [
  {
    id: 'lm-1',
    preparedDate: '2024-05-15',
    buyer: "Levi's",
    style: 'LV-511-SLIM',
    description: 'Slim Fit Denim',
    approxInputDate: '2024-05-20',
    lineNo: 'Line 01',
    orderQty: 50000,
    targetHr: 450,
    efficiency: 85,
    operators: 45,
    cpuOperators: 0,
    helpers: 18,
    ironMan: 4,
    productCategory: '5-Pocket',
    remarks: 'Standard Layout',
    operations: [],
    timestamp: '2024-05-15T10:00:00Z',
    preparedBy: 'Admin'
  },
  {
    id: 'lm-2',
    preparedDate: '2024-05-20',
    buyer: 'G-Star',
    style: 'GS-3301-ST',
    description: 'Heavy Denim Chino',
    approxInputDate: '2024-05-25',
    lineNo: 'Line 02',
    orderQty: 30000,
    targetHr: 380,
    efficiency: 80,
    operators: 40,
    cpuOperators: 0,
    helpers: 15,
    ironMan: 3,
    productCategory: 'Chino',
    remarks: 'Urgent Style',
    operations: [],
    timestamp: '2024-05-20T14:30:00Z',
    preparedBy: 'IE-User-1'
  },
  {
    id: 'lm-3',
    preparedDate: '2024-06-05',
    buyer: 'Zara',
    style: 'Z-JACKET-01',
    description: 'Denim Jacket',
    approxInputDate: '2024-06-10',
    lineNo: 'Line 03',
    orderQty: 20000,
    targetHr: 320,
    efficiency: 75,
    operators: 55,
    cpuOperators: 0,
    helpers: 20,
    ironMan: 5,
    productCategory: 'Jacket',
    remarks: 'Complex Style',
    operations: [],
    timestamp: '2024-06-05T09:15:00Z',
    preparedBy: 'Admin'
  }
];

const SEED_PRE_PROD: PreProductionTracker[] = [
  {
    id: 'pp-1',
    orderId: '100220',
    isReadyForPlan: false,
    overallBlockerReason: 'Fabric Inhouse Pending, Shrinkage Test Pending',
    checklist: {
      ppMeeting: { applicability: 'Required', status: 'Approved', targetDate: '2026-03-01', actualDate: '2026-03-02', delayDays: 1 },
      pilotSample: { applicability: 'Required', status: 'Approved', targetDate: '2026-03-05', actualDate: '2026-03-05', delayDays: 0 },
      fabricInhouse: { applicability: 'Required', status: 'In Progress', targetDate: '2026-03-10', delayDays: 2, blockerReason: 'Supplier Delay', issueSource: 'Supplier' },
      shrinkageTest: { applicability: 'Required', status: 'Pending', targetDate: '2026-03-12', delayDays: 0 },
      shadeApproval: { applicability: 'Required', status: 'Pending', targetDate: '2026-03-12', delayDays: 0 },
    }
  }
];

const SEED_ORDER_POOL: OrderPoolEntry[] = [
  {
    id: '1',
    merchandiser: 'Rahim',
    sourcing: 'Karim',
    buyer: "H&M",
    country: 'Sweden',
    orderConfirmDate: '2026-02-15',
    soNo: '200301',
    style: 'HM-DENIM-501',
    washColor: 'Mid Blue',
    orderQty: 25000,
    monthQty: 8000,
    fabricMill: 'Mill C',
    fabricInhouseDate: '2026-03-20',
    accessoriesInhouseDate: '2026-03-25',
    tentativePPSampleApprovalDate: '2026-04-01',
    fileHandoverDate: '2026-04-05',
    shipDate: '2026-06-15',
    smv: 16.5,
    marketingTarget: 500,
    type: 'Pants',
    sizeGroup: 'Adult',
    fabricType: 'Denim',
    item: 'Pants',
    washType: 'Mid Wash',
    print: 'None',
    emb: 'None',
    status: 'Imported',
    planningOwner: 'Zaman',
    preProductionStatus: 'Approved',
    isReadyForPlan: true,
    blockerReason: ''
  },
  {
    id: '2',
    merchandiser: 'Sumi',
    sourcing: 'Abid',
    buyer: 'Zara',
    country: 'Spain',
    orderConfirmDate: '2026-02-20',
    soNo: '200302',
    style: 'ZR-JACKET-09',
    washColor: 'Black',
    orderQty: 15000,
    monthQty: 5000,
    fabricMill: 'Mill D',
    fabricInhouseDate: '2026-03-25',
    accessoriesInhouseDate: '2026-03-30',
    tentativePPSampleApprovalDate: '2026-04-05',
    fileHandoverDate: '2026-04-10',
    shipDate: '2026-06-20',
    smv: 28.0,
    marketingTarget: 300,
    type: 'Jacket',
    sizeGroup: 'Adult',
    fabricType: 'Denim',
    item: 'Jacket',
    washType: 'Black Wash',
    print: 'None',
    emb: 'None',
    status: 'Imported',
    planningOwner: 'Zaman',
    preProductionStatus: 'In Progress',
    isReadyForPlan: false,
    blockerReason: 'Accessories Inhouse Pending'
  }
];

const SEED_SIZE_SET_PILOT: SizeSetPilotRequest[] = [
  {
    id: 'demo-1',
    requestType: 'Size Set',
    requestedQuantity: 120,
    styleNumber: 'HM-DENIM-501',
    buyer: 'H&M',
    productItem: 'Pants',
    plannerName: 'Zaman',
    requestDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    stages: {
      'Planner Request': { responsiblePerson: 'Zaman', startTime: new Date(Date.now() - 86400000 * 2).toISOString(), endTime: new Date(Date.now() - 86400000 * 2).toISOString(), quantityHandled: 120, riskPoints: [], issueNotes: '', remarks: 'Urgent requirement', status: 'Completed' },
      'Cutting Concern': { responsiblePerson: 'Asad', startTime: new Date(Date.now() - 86400000 * 1.5).toISOString(), endTime: new Date(Date.now() - 86400000 * 1.5).toISOString(), quantityHandled: 120, riskPoints: ['Fabric shade variation'], issueNotes: 'Minor shade diff', remarks: 'Proceeded with caution', status: 'Completed' },
      'Sewing / Sample Line Concern': { responsiblePerson: 'Musa', startTime: new Date(Date.now() - 86400000).toISOString(), endTime: '', quantityHandled: 120, riskPoints: [], issueNotes: '', remarks: '', status: 'In Progress' },
      'Quality Team': { responsiblePerson: '', startTime: '', endTime: '', quantityHandled: 0, riskPoints: [], issueNotes: '', remarks: '', status: 'Pending' },
      'Wash Sample Concern': { responsiblePerson: '', startTime: '', endTime: '', quantityHandled: 0, riskPoints: [], issueNotes: '', remarks: '', status: 'Pending' },
      'Final Inspection': { responsiblePerson: '', startTime: '', endTime: '', quantityHandled: 0, riskPoints: [], issueNotes: '', remarks: '', status: 'Pending' },
      'Full Dashboard and Style Report': { responsiblePerson: '', startTime: '', endTime: '', quantityHandled: 0, riskPoints: [], issueNotes: '', remarks: '', status: 'Pending' }
    },
    currentStage: 'Sewing / Sample Line Concern',
    status: 'Active'
  },
  {
    id: 'demo-2',
    requestType: 'Pilot',
    requestedQuantity: 500,
    styleNumber: 'ZR-JACKET-09',
    buyer: 'Zara',
    productItem: 'Jacket',
    plannerName: 'Zaman',
    requestDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    stages: {
      'Planner Request': { responsiblePerson: 'Zaman', startTime: new Date(Date.now() - 86400000 * 5).toISOString(), endTime: new Date(Date.now() - 86400000 * 5).toISOString(), quantityHandled: 500, riskPoints: [], issueNotes: '', remarks: 'New season launch', status: 'Completed' },
      'Cutting Concern': { responsiblePerson: 'Asad', startTime: new Date(Date.now() - 86400000 * 4).toISOString(), endTime: new Date(Date.now() - 86400000 * 4).toISOString(), quantityHandled: 500, riskPoints: [], issueNotes: '', remarks: '', status: 'Completed' },
      'Sewing / Sample Line Concern': { responsiblePerson: 'Musa', startTime: new Date(Date.now() - 86400000 * 3).toISOString(), endTime: new Date(Date.now() - 86400000 * 3).toISOString(), quantityHandled: 500, riskPoints: [], issueNotes: '', remarks: '', status: 'Completed' },
      'Quality Team': { responsiblePerson: 'Rahim', startTime: new Date(Date.now() - 86400000 * 2).toISOString(), endTime: new Date(Date.now() - 86400000 * 2).toISOString(), quantityHandled: 495, rejectionQty: 5, riskPoints: ['Stitch skip'], issueNotes: '5 pcs rejected due to skip', remarks: 'Rest ok', status: 'Completed' },
      'Wash Sample Concern': { responsiblePerson: 'Salim', startTime: new Date(Date.now() - 86400000).toISOString(), endTime: new Date(Date.now() - 86400000).toISOString(), quantityHandled: 495, riskPoints: [], issueNotes: '', remarks: 'Wash look approved', status: 'Completed' },
      'Final Inspection': { responsiblePerson: 'Admin', startTime: new Date(Date.now() - 86400000).toISOString(), endTime: new Date(Date.now() - 86400000).toISOString(), quantityHandled: 495, riskPoints: [], issueNotes: '', remarks: 'Final inspection passed', status: 'Completed' },
      'Full Dashboard and Style Report': { responsiblePerson: 'Admin', startTime: TODAY, endTime: TODAY, quantityHandled: 495, riskPoints: [], issueNotes: '', remarks: 'Final report generated', status: 'Completed' }
    },
    currentStage: 'Full Dashboard and Style Report',
    status: 'Completed'
  }
];

export const mockDb = {
  saveSizeSetPilotRequests: (reqs: SizeSetPilotRequest[]) => {
    localStorage.setItem('sizeSetPilotRequests', JSON.stringify(reqs));
  },
  getUsers: () => {
    try {
      const local = localStorage.getItem('protrack_users');
      if (!local) {
        const initialUsers: AppUser[] = [
          {
            id: 'user-1',
            name: 'Abdullah Al Mamun',
            employee_id: '42001234',
            department: 'IE',
            designation: 'IE Engineer',
            section: 'Sewing',
            lines: ['Line 01', 'Line 02'],
            mobileNumber: '01712345678',
            password: 'password123',
            email: '42001234@sdl-garments.com',
            status: 'PENDING',
            role: 'DATA_ENTRY',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 'user-2',
            name: 'Sabbir Ahmed',
            employee_id: '42005678',
            department: 'Production',
            designation: 'Manager',
            section: 'Sewing',
            lines: ['Line 05'],
            mobileNumber: '01812345678',
            password: 'adminPass789',
            email: '42005678@sdl-garments.com',
            status: 'APPROVED',
            role: 'Full Access Admin',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            approvedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        localStorage.setItem('protrack_users', JSON.stringify(initialUsers));
        return initialUsers;
      }
      return JSON.parse(local);
    } catch (e) {
      console.error("Failed to parse users from localStorage:", e);
      return [];
    }
  },
  
  getSystemConfig: (): SystemConfig => {
    const local = localStorage.getItem('protrack_system_config');
    if (!local) return DEFAULT_CONFIG;
    
    try {
      const parsed = JSON.parse(local);
      return { 
        ...DEFAULT_CONFIG, 
        ...parsed,
        machineAssets: (parsed.machineAssets && parsed.machineAssets.length > 0) ? parsed.machineAssets : DEFAULT_CONFIG.machineAssets,
        machineRequirements: (parsed.machineRequirements && parsed.machineRequirements.length > 0) ? parsed.machineRequirements : DEFAULT_CONFIG.machineRequirements
      };
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  },

  saveSystemConfig: async (newConfig: SystemConfig) => {
    localStorage.setItem('protrack_system_config', JSON.stringify(newConfig));
    apiService.saveRemoteConfig(newConfig).catch(console.error);
  },

  saveSOP: (sop: SOP) => {
    const sops = JSON.parse(localStorage.getItem('protrack_sops') || '[]');
    sops.push(sop);
    localStorage.setItem('protrack_sops', JSON.stringify(sops));
  },
  getSOPs: () => JSON.parse(localStorage.getItem('protrack_sops') || '[]'),

  toggleOffDay: (date: string) => {
    const config = mockDb.getSystemConfig();
    const offDays = config.offDays || [];
    const index = offDays.indexOf(date);
    if (index === -1) {
      offDays.push(date);
    } else {
      offDays.splice(index, 1);
    }
    mockDb.saveSystemConfig({ ...config, offDays });
  },

  repairSystemConfig: () => {
    localStorage.removeItem('protrack_system_config');
    window.location.reload();
  },

  registerUser: (user: AppUser) => {
    const users = JSON.parse(localStorage.getItem('protrack_users') || '[]');
    console.log("Registering user:", user);
    console.log("Current users:", users);
    const idx = users.findIndex((u: any) => u.employee_id === user.employee_id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push({ ...user, createdAt: new Date().toISOString() });
    }
    localStorage.setItem('protrack_users', JSON.stringify(users));
    console.log("Users after registration:", JSON.parse(localStorage.getItem('protrack_users') || '[]'));
  },

  approveUser: (userId: string, updatedDetails: Partial<AppUser>, accessTierId: string) => {
    const users = JSON.parse(localStorage.getItem('protrack_users') || '[]');
    const userIdx = users.findIndex((u: any) => u.id === userId);
    if (userIdx === -1) return;

    const config = mockDb.getSystemConfig();
    const accessTier = config.accessTiers?.find(t => t.id === accessTierId);
    
    if (!accessTier) return;

    users[userIdx] = {
      ...users[userIdx],
      ...updatedDetails,
      status: 'APPROVED',
      pagePermissions: accessTier.permissions,
      approvedAt: new Date().toISOString()
    };

    localStorage.setItem('protrack_users', JSON.stringify(users));
  },

  // DATA PERSISTENCE VIA DEXIE
  saveProduction: async (rec: ProductionRecord) => {
    await db.production.put({ ...rec, _status: 'pending' });
    const all = JSON.parse(localStorage.getItem('protrack_production') || '[]');
    localStorage.setItem('protrack_production', JSON.stringify([rec, ...all]));
    syncEngine.startSync();
  },

  getProduction: (dept?: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_production') || '[]');
    const data = all.length > 0 ? all : SEED_PRODUCTION;
    return dept ? data.filter((r: any) => r.department === dept) : data;
  },

  saveWIP: async (rec: WIPRecord) => {
    await db.wip.add({ ...rec, _status: 'pending' });
    const all = JSON.parse(localStorage.getItem('protrack_wip') || '[]');
    localStorage.setItem('protrack_wip', JSON.stringify([rec, ...all]));
    syncEngine.startSync();
  },

  getWIP: (dept?: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_wip') || '[]');
    const data = all.length > 0 ? all : SEED_WIP;
    return dept ? data.filter((r: any) => r.department === dept) : data;
  },

  saveNPT: async (rec: NPTRecord) => {
    await db.npt.put({ ...rec, _status: 'pending' });
    const all = JSON.parse(localStorage.getItem('protrack_npt') || '[]');
    const idx = all.findIndex((r: any) => r.id === rec.id);
    if (idx >= 0) all[idx] = rec;
    else all.push(rec);
    localStorage.setItem('protrack_npt', JSON.stringify(all));
    syncEngine.startSync();
  },

  getNPT: (dept?: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_npt') || '[]');
    return dept ? all.filter((r: any) => r.department === dept) : all;
  },

  saveManpower: async (rec: ManpowerRecord) => {
    await db.manpower.put({ ...rec, _status: 'pending' });
    const all = JSON.parse(localStorage.getItem('protrack_manpower') || '[]');
    const idx = all.findIndex((r: any) => r.lineId === rec.lineId && r.date === rec.date);
    if (idx >= 0) all[idx] = rec;
    else all.push(rec);
    localStorage.setItem('protrack_manpower', JSON.stringify(all));
    syncEngine.startSync();
  },

  getManpower: (dept?: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_manpower') || '[]');
    const data = all.length > 0 ? all : SEED_MANPOWER;
    return dept ? data.filter((r: any) => r.department === dept) : data;
  },

  saveStylePlan: async (plan: StylePlan) => {
    await db.stylePlans.put({ ...plan, _status: 'pending' });
    const all = JSON.parse(localStorage.getItem('protrack_style_plans') || '[]');
    const idx = all.findIndex((p: any) => p.id === plan.id);
    if (idx >= 0) all[idx] = plan;
    else all.push(plan);
    localStorage.setItem('protrack_style_plans', JSON.stringify(all));
    syncEngine.startSync();
  },

  getStylePlans: () => {
    const all = JSON.parse(localStorage.getItem('protrack_style_plans') || '[]');
    return all.length > 0 ? all : SEED_PLANS;
  },

  getLiveProductionData: () => {
    const plans = mockDb.getStylePlans();
    return plans.map(plan => {
      // Simulate some data based on plan quantity
      const orderQty = plan.orderQuantity;
      const planQty = plan.planQuantity;
      
      const cuttingQty = Math.floor(planQty * (0.8 + Math.random() * 0.2));
      const sewingQty = Math.floor(cuttingQty * (0.7 + Math.random() * 0.2));
      const washQty = Math.floor(sewingQty * (0.9 + Math.random() * 0.1));
      const finishingQty = Math.floor(washQty * (0.95 + Math.random() * 0.05));
      const packQty = Math.floor(finishingQty * (0.98 + Math.random() * 0.02));
      const rejects = Math.floor(sewingQty * 0.02);

      return {
        lineId: plan.lineId,
        buyer: plan.buyer,
        style: plan.styleNumber,
        orderQty,
        planQty,
        cuttingQty,
        cuttingPercent: Math.round((cuttingQty / planQty) * 100),
        cuttingWip: cuttingQty - sewingQty,
        sewingQty,
        sewingWip: sewingQty - washQty,
        washQty,
        washWip: washQty - finishingQty,
        finishingQty,
        finishingWip: finishingQty - packQty,
        packQty,
        packWip: packQty, // Assuming pack WIP is what's ready to ship
        rejects
      };
    });
  },

  deleteStylePlan: async (id: string) => {
    await db.stylePlans.delete(id);
    const all = JSON.parse(localStorage.getItem('protrack_style_plans') || '[]');
    localStorage.setItem('protrack_style_plans', JSON.stringify(all.filter((p: any) => p.id !== id)));
  },

  getBlocks: () => {
    const config = mockDb.getSystemConfig();
    const blocks = new Set(config.lineMappings?.map(m => m.blockId) || []);
    return Array.from(blocks).map(b => ({ id: b, name: b, lineIds: [] }));
  },
  
  getBuyers: () => mockDb.getSystemConfig().buyers || [],

  getStyleConfirmations: () => {
    const all = JSON.parse(localStorage.getItem('protrack_style_confirmations') || '[]');
    return all.length > 0 ? all : SEED_CONFIRMATIONS;
  },
  
  saveStyleConfirmation: (conf: StyleConfirmation) => {
    const all = JSON.parse(localStorage.getItem('protrack_style_confirmations') || '[]');
    const idx = all.findIndex((c: any) => c.id === conf.id);
    if (idx >= 0) all[idx] = conf;
    else all.push(conf);
    localStorage.setItem('protrack_style_confirmations', JSON.stringify(all));
  },
  
  deleteStyleConfirmation: (id: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_style_confirmations') || '[]');
    localStorage.setItem('protrack_style_confirmations', JSON.stringify(all.filter((c: any) => c.id !== id)));
  },
  
  getStyles: () => {
    const all = JSON.parse(localStorage.getItem('protrack_styles') || '[]');
    return all.length > 0 ? all : SEED_STYLES;
  },
  
  saveStyle: (style: StyleInfo) => {
    const all = JSON.parse(localStorage.getItem('protrack_styles') || '[]');
    localStorage.setItem('protrack_styles', JSON.stringify([style, ...all]));
  },
  
  updateStyle: (style: StyleInfo) => {
    const all = JSON.parse(localStorage.getItem('protrack_styles') || '[]');
    const idx = all.findIndex((s: any) => s.id === style.id);
    if (idx >= 0) all[idx] = style;
    else all.push(style);
    localStorage.setItem('protrack_styles', JSON.stringify(all));
  },

  getHREntries: () => JSON.parse(localStorage.getItem('protrack_hr_entries') || '[]'),
  saveHREntry: (e: any) => {
    const all = JSON.parse(localStorage.getItem('protrack_hr_entries') || '[]');
    localStorage.setItem('protrack_hr_entries', JSON.stringify([e, ...all]));
  },

  getNotifications: () => JSON.parse(localStorage.getItem('protrack_notifications') || '[]'),
  
  markNotificationRead: (id: string, userId: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_notifications') || '[]');
    const updated = all.map((n: any) => n.id === id ? { ...n, readBy: [...(n.readBy || []), userId] } : n);
    localStorage.setItem('protrack_notifications', JSON.stringify(updated));
  },
  
  addNotification: (n: AppNotification) => {
    const all = JSON.parse(localStorage.getItem('protrack_notifications') || '[]');
    localStorage.setItem('protrack_notifications', JSON.stringify([n, ...all]));
  },

  saveNotification: (n: AppNotification) => {
    const all = JSON.parse(localStorage.getItem('protrack_notifications') || '[]');
    localStorage.setItem('protrack_notifications', JSON.stringify([n, ...all]));
  },

  deleteNotification: (id: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_notifications') || '[]');
    localStorage.setItem('protrack_notifications', JSON.stringify(all.filter((n: any) => n.id !== id)));
  },

  getNotificationRoutes: () => [],
  
  get5SAudits: (dept?: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_5s_audits') || '[]');
    return dept ? all.filter((a: any) => a.department === dept) : all;
  },
  
  save5SAudit: (audit: Audit5SRecord) => {
    const all = JSON.parse(localStorage.getItem('protrack_5s_audits') || '[]');
    localStorage.setItem('protrack_5s_audits', JSON.stringify([audit, ...all]));
  },

  getLineWIP: (lineId: string, dept: string) => {
    const wip = mockDb.getWIP(dept).filter(w => w.lineId === lineId);
    const prod = mockDb.getProduction(dept).filter(p => p.lineId === lineId);
    const totalIn = wip.reduce((s, w) => s + w.inputQty, 0);
    const totalOut = prod.reduce((s, p) => s + p.actual, 0);
    return totalIn - totalOut;
  },

  getDailyTargets: (dept?: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_daily_targets') || '[]');
    const data = all.length > 0 ? all : SEED_TARGETS;
    return dept ? data.filter((t: any) => t.department === dept) : data;
  },
  
  saveDailyTarget: (target: DailyTarget) => {
    const all = JSON.parse(localStorage.getItem('protrack_daily_targets') || '[]');
    const idx = all.findIndex((t: any) => t.id === target.id || (t.date === target.date && t.lineId === target.lineId));
    if (idx >= 0) all[idx] = target;
    else all.push(target);
    localStorage.setItem('protrack_daily_targets', JSON.stringify(all));
  },

  getOTRequests: (dept?: string): OTRequest[] => {
    const all = JSON.parse(localStorage.getItem('protrack_ot_requests') || '[]');
    const data = all.length > 0 ? all : SEED_OT;
    return dept ? data.filter((r: any) => r.department === dept) : data;
  },
  
  saveOTRequest: (req: OTRequest) => {
    const all = JSON.parse(localStorage.getItem('protrack_ot_requests') || '[]');
    const idx = all.findIndex((r: any) => r.id === req.id);
    if (idx >= 0) all[idx] = req;
    else all.push(req);
    localStorage.setItem('protrack_ot_requests', JSON.stringify(all));
  },

  getMachines: (dept?: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_machines') || '[]');
    return dept ? all.filter((m: any) => m.department === dept) : all;
  },
  
  saveMachine: (machine: MachineRecord) => {
    const all = JSON.parse(localStorage.getItem('protrack_machines') || '[]');
    const idx = all.findIndex((m: any) => m.serialNumber === machine.serialNumber);
    if (idx >= 0) all[idx] = machine;
    else all.push(machine);
    localStorage.setItem('protrack_machines', JSON.stringify(all));
  },

  getQCO: (dept?: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_qco') || '[]');
    return dept ? all.filter((q: any) => q.department === dept) : all;
  },
  
  saveQCO: (qco: QCORecord) => {
    const all = JSON.parse(localStorage.getItem('protrack_qco') || '[]');
    const idx = all.findIndex((q: any) => q.id === qco.id);
    if (idx >= 0) all[idx] = qco;
    else all.push(qco);
    localStorage.setItem('protrack_qco', JSON.stringify(all));
  },

  getDefectCategories: (dept: string, isReject: boolean) => {
    const config = mockDb.getSystemConfig();
    const issues = config.qualityIssues[dept] || { defects: [], rejects: [] };
    return isReject ? issues.rejects : issues.defects;
  },

  getDefects: (dept?: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_defects') || '[]');
    const data = all.length > 0 ? all : SEED_DEFECTS;
    return dept ? data.filter((d: any) => d.department === dept) : data;
  },
  
  saveDefect: (defect: DefectRecord) => {
    const all = JSON.parse(localStorage.getItem('protrack_defects') || '[]');
    localStorage.setItem('protrack_defects', JSON.stringify([defect, ...all]));
  },

  getSkills: (dept?: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_skills') || '[]');
    return dept ? all.filter((s: any) => s.department === dept) : all;
  },
  
  saveSkillManual: (skill: SkillRecord) => {
    const all = JSON.parse(localStorage.getItem('protrack_skills') || '[]');
    const idx = all.findIndex((s: any) => s.operatorId === skill.operatorId);
    if (idx >= 0) all[idx] = skill;
    else all.push(skill);
    localStorage.setItem('protrack_skills', JSON.stringify(all));
  },

  saveTimeStudy: (study: TimeStudyRecord) => {
    const all = JSON.parse(localStorage.getItem('protrack_time_studies') || '[]');
    localStorage.setItem('protrack_time_studies', JSON.stringify([study, ...all]));
  },

  getDepartmentSummary: (dept: string, filters: any = {}) => {
    const prod = mockDb.getProduction(dept).filter(p => {
      if (filters.date) return p.date === filters.date;
      if (filters.month) return p.date.startsWith(filters.month);
      return true;
    });
    const target = prod.reduce((s, r) => s + (r.target || 0), 0);
    const actual = prod.reduce((s, r) => s + (r.actual || 0), 0);
    
    const mp = mockDb.getManpower(dept).filter(m => filters.date ? m.date === filters.date : true);
    const present = mp.reduce((s, m) => s + m.presentOp + m.presentIr + m.presentHp, 0);
    
    const config = mockDb.getSystemConfig();
    const totalHC = config.lineMappings.filter(l => l.sectionId === dept).reduce((s, l) => s + (l.layoutManpower || 0), 0);

    const defects = mockDb.getDefects(dept).filter(d => filters.date ? d.date === filters.date : true);
    const totalDefects = defects.reduce((s, d) => s + (d.isReject ? 0 : d.count), 0);

    const machines = mockDb.getMachines(dept);

    return { 
      efficiency: target > 0 ? (actual / target) * 100 : 0, 
      totalActual: actual, 
      totalTarget: target, 
      dhu: actual > 0 ? (totalDefects / actual) * 100 : 0, 
      fiveS: 0, 
      presentMP: present, 
      totalMP: totalHC, 
      workingMc: machines.filter(m => m.status === 'WORKING').length, 
      totalMc: machines.length 
    };
  },

  getLinePerformance: (dept: string, date: string) => {
    const targets = mockDb.getDailyTargets(dept).filter(t => t.date === date);
    const prods = mockDb.getProduction(dept).filter(p => p.date === date);
    const defects = mockDb.getDefects(dept).filter(d => d.date === date);

    return targets.map(t => {
      const lineProd = prods.filter(p => p.lineId === t.lineId);
      const actual = lineProd.reduce((s, r) => s + r.actual, 0);
      const lineDefects = defects.filter(d => d.lineId === t.lineId);
      const rejects = lineDefects.filter(d => d.isReject).reduce((s, d) => s + d.count, 0);
      const dhuCount = lineDefects.filter(d => !d.isReject).reduce((s, d) => s + d.count, 0);

      return {
        lineId: t.lineId,
        blockId: t.blockId,
        actual,
        target: t.todayTargetPcs,
        efficiency: t.todayTargetPcs > 0 ? (actual / t.todayTargetPcs) * 100 : 0,
        pmp: t.headCount > 0 ? actual / t.headCount : 0,
        dhu: actual > 0 ? (dhuCount / actual) * 100 : 0,
        rejects,
        changeovers: 0
      };
    });
  },

  getStyleAchievement: (styleNumber: string) => {
    const summaries = JSON.parse(localStorage.getItem('protrack_production_summaries') || '[]');
    const relevant = summaries.filter((s: any) => s.styleNumber === styleNumber);
    return {
        totalOutput: relevant.reduce((s: number, r: any) => s + r.totalOutput, 0),
        totalHours: relevant.reduce((s: number, r: any) => s + r.actualWorkingHours, 0),
        avgManpower: relevant.length > 0 ? relevant.reduce((s: number, r: any) => s + r.actualManpower, 0) / relevant.length : 67
    };
  },

  saveProductionSummary: (sum: any) => {
    const all = JSON.parse(localStorage.getItem('protrack_production_summaries') || '[]');
    localStorage.setItem('protrack_production_summaries', JSON.stringify([sum, ...all]));
  },

  getLayoutTemplates: (dept?: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_layout_templates') || '[]');
    const templates = all.length > 0 ? all : SEED_LAYOUT_TEMPLATES;
    return dept ? templates.filter((t: any) => t.section === dept) : templates;
  },

  saveLayoutTemplate: (template: LayoutTemplate) => {
    const all = JSON.parse(localStorage.getItem('protrack_layout_templates') || '[]');
    const idx = all.findIndex((t: any) => t.id === template.id);
    if (idx >= 0) {
      all[idx] = template;
    } else {
      all.unshift(template);
    }
    localStorage.setItem('protrack_layout_templates', JSON.stringify(all));
  },

  deleteLayoutTemplate: (id: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_layout_templates') || '[]');
    localStorage.setItem('protrack_layout_templates', JSON.stringify(all.filter((t: any) => t.id !== id)));
  },
  
  saveLayoutMaster: (record: LayoutMasterRecord) => {
    const all = JSON.parse(localStorage.getItem('protrack_layout_masters') || '[]');
    localStorage.setItem('protrack_layout_masters', JSON.stringify([record, ...all]));
  },

  getLayoutMasters: (): LayoutMasterRecord[] => {
    const all = JSON.parse(localStorage.getItem('protrack_layout_masters') || '[]');
    return all.length > 0 ? all : SEED_LAYOUT_MASTERS;
  },

  getMaintenance: (): MachineMaintenanceRecord[] => {
    const all = JSON.parse(localStorage.getItem('protrack_machine_maintenance') || '[]');
    return all.length > 0 ? all : SEED_MAINTENANCE;
  },

  getBreakdowns: (): MachineBreakdownRecord[] => {
    const all = JSON.parse(localStorage.getItem('protrack_machine_breakdowns') || '[]');
    return all.length > 0 ? all : SEED_BREAKDOWNS;
  },

  getSpares: (): SparePartRecord[] => {
    const all = JSON.parse(localStorage.getItem('protrack_machine_spares') || '[]');
    return all.length > 0 ? all : SEED_SPARES;
  },

  saveMaintenances: (recs: MachineMaintenanceRecord[]) => {
    localStorage.setItem('protrack_machine_maintenance', JSON.stringify(recs));
  },

  saveBreakdowns: (recs: MachineBreakdownRecord[]) => {
    localStorage.setItem('protrack_machine_breakdowns', JSON.stringify(recs));
  },

  saveSpares: (recs: SparePartRecord[]) => {
    localStorage.setItem('protrack_machine_spares', JSON.stringify(recs));
  },

  getSewingCostingList: (): SewingCosting[] => {
    const all = JSON.parse(localStorage.getItem('protrack_sewing_costing') || '[]');
    return all.length > 0 ? all : SEED_SEWING_COSTINGS;
  },

  getLatestCosting: (buyer: string, style: string): SewingCosting | undefined => {
    const all = mockDb.getSewingCostingList();
    return all
      .filter(c => c.buyer.toLowerCase() === buyer.toLowerCase() && c.styleNumber.toLowerCase() === style.toLowerCase())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  },

  saveSewingCosting: (costing: SewingCosting) => {
    const all = JSON.parse(localStorage.getItem('protrack_sewing_costing') || '[]');
    const idx = all.findIndex((c: any) => c.id === costing.id);
    if (idx >= 0) all[idx] = costing;
    else all.unshift(costing);
    localStorage.setItem('protrack_sewing_costing', JSON.stringify(all));
  },

  deleteSewingCosting: (id: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_sewing_costing') || '[]');
    localStorage.setItem('protrack_sewing_costing', JSON.stringify(all.filter((c: any) => c.id !== id)));
  },

  getThreadConsumptions: (): ThreadConsumption[] => {
    const all = JSON.parse(localStorage.getItem('protrack_thread_consumption') || '[]');
    return all.length > 0 ? all : SEED_THREAD_CONSUMPTIONS;
  },

  saveThreadConsumption: (record: ThreadConsumption) => {
    const all = JSON.parse(localStorage.getItem('protrack_thread_consumption') || '[]');
    const idx = all.findIndex((c: any) => c.id === record.id);
    if (idx >= 0) all[idx] = record;
    else all.unshift(record);
    localStorage.setItem('protrack_thread_consumption', JSON.stringify(all));
  },

  deleteThreadConsumption: (id: string) => {
    const all = JSON.parse(localStorage.getItem('protrack_thread_consumption') || '[]');
    localStorage.setItem('protrack_thread_consumption', JSON.stringify(all.filter((c: any) => c.id !== id)));
  },

  updateThreadCounts: (counts: string[]) => {
    const config = mockDb.getSystemConfig();
    mockDb.saveSystemConfig({ ...config, threadCounts: counts });
  },

  updateConeSizes: (sizes: string[]) => {
    const config = mockDb.getSystemConfig();
    mockDb.saveSystemConfig({ ...config, coneSizes: sizes });
  },

  getOrderPoolEntries: (): OrderPoolEntry[] => {
    const all = JSON.parse(localStorage.getItem('protrack_order_pool') || '[]');
    return all.length > 0 ? all : SEED_ORDER_POOL;
  },

  saveOrderPoolEntries: (orders: OrderPoolEntry[]) => {
    localStorage.setItem('protrack_order_pool', JSON.stringify(orders));
  },

  getPreProductionTrackers: (): PreProductionTracker[] => {
    const all = JSON.parse(localStorage.getItem('protrack_pre_prod_trackers') || '[]');
    return all.length > 0 ? all : SEED_PRE_PROD;
  },

  savePreProductionTracker: (tracker: PreProductionTracker) => {
    const all = JSON.parse(localStorage.getItem('protrack_pre_prod_trackers') || '[]');
    const idx = all.findIndex((t: any) => t.id === tracker.id);
    if (idx >= 0) all[idx] = tracker;
    else all.push(tracker);
    localStorage.setItem('protrack_pre_prod_trackers', JSON.stringify(all));
  },
  
  getPlanningOwnerships: (): PlanningOwnership[] => {
    return JSON.parse(localStorage.getItem('protrack_planning_ownerships') || '[]');
  },

  savePlanningOwnership: (ownership: PlanningOwnership) => {
    const all = JSON.parse(localStorage.getItem('protrack_planning_ownerships') || '[]');
    const idx = all.findIndex((o: any) => o.id === ownership.id || (ownership.buyer && o.buyer === ownership.buyer));
    if (idx >= 0) all[idx] = ownership;
    else all.push(ownership);
    localStorage.setItem('protrack_planning_ownerships', JSON.stringify(all));
  },

  getLineLoadingPlanners: (): string[] => {
    return JSON.parse(localStorage.getItem('protrack_line_loading_planners') || '[]');
  },

  saveLineLoadingPlanners: (planners: string[]) => {
    localStorage.setItem('protrack_line_loading_planners', JSON.stringify(planners));
  },

  getSizeSetPilotRequests: (): SizeSetPilotRequest[] => {
    return JSON.parse(localStorage.getItem('protrack_size_set_pilot_requests') || '[]');
  },

  saveSizeSetPilotRequest: (request: SizeSetPilotRequest) => {
    const requests = JSON.parse(localStorage.getItem('protrack_size_set_pilot_requests') || '[]');
    const index = requests.findIndex((r: SizeSetPilotRequest) => r.id === request.id);
    if (index > -1) {
      requests[index] = request;
    } else {
      requests.push(request);
    }
    localStorage.setItem('protrack_size_set_pilot_requests', JSON.stringify(requests));
  },

  deleteSizeSetPilotRequest: (id: string) => {
    const requests = JSON.parse(localStorage.getItem('protrack_size_set_pilot_requests') || '[]');
    localStorage.setItem('protrack_size_set_pilot_requests', JSON.stringify(requests.filter((r: SizeSetPilotRequest) => r.id !== id)));
  },

  getWashCostingRecords: (): WashCostingRecord[] => {
    return JSON.parse(localStorage.getItem('protrack_wash_costing_records') || '[]');
  },

  saveWashCostingRecord: (record: WashCostingRecord) => {
    const records = JSON.parse(localStorage.getItem('protrack_wash_costing_records') || '[]');
    const index = records.findIndex((r: WashCostingRecord) => r.id === record.id);
    if (index > -1) {
      records[index] = record;
    } else {
      records.push(record);
    }
    localStorage.setItem('protrack_wash_costing_records', JSON.stringify(records));
  },

  deleteWashCostingRecord: (id: string) => {
    const records = JSON.parse(localStorage.getItem('protrack_wash_costing_records') || '[]');
    localStorage.setItem('protrack_wash_costing_records', JSON.stringify(records.filter((r: any) => r.id !== id)));
  },

  getIEActivityData: (): IEActivityData[] => {
    return JSON.parse(localStorage.getItem('protrack_ie_activity_data') || '[]');
  },

  saveIEActivityData: (data: IEActivityData) => {
    const activityData = JSON.parse(localStorage.getItem('protrack_ie_activity_data') || '[]');
    const index = activityData.findIndex((a: IEActivityData) => a.id === data.id);
    if (index > -1) {
      activityData[index] = data;
    } else {
      activityData.push(data);
    }
    localStorage.setItem('protrack_ie_activity_data', JSON.stringify(activityData));
  },

  getTransfers: (): ProductionTransfer[] => {
    return JSON.parse(localStorage.getItem('protrack_production_transfers') || '[]');
  },

  saveTransfer: (transfer: ProductionTransfer) => {
    const transfers = JSON.parse(localStorage.getItem('protrack_production_transfers') || '[]');
    const index = transfers.findIndex((t: ProductionTransfer) => t.id === transfer.id);
    if (index > -1) {
      transfers[index] = transfer;
    } else {
      transfers.push(transfer);
    }
    localStorage.setItem('protrack_production_transfers', JSON.stringify(transfers));
  },

  getCoordinationItems: (): CoordinationItem[] => {
    const items = JSON.parse(localStorage.getItem('protrack_coordination_items') || '[]');
    if (items.length === 0) {
      return [
        {
          id: 'coord-1',
          title: 'Fabric Delay for JJ-DENIM-001',
          description: 'Fabric in-house date delayed by 3 days. Need to adjust cutting plan.',
          fromDept: 'Planning',
          toDept: 'Cutting',
          priority: 'HIGH',
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          styleNumber: 'JJ-DENIM-001',
          buyer: 'Jack & jones'
        },
        {
          id: 'coord-2',
          title: 'Sample Approval Pending',
          description: 'PP sample still with buyer. Production start might be affected.',
          fromDept: 'Sample',
          toDept: 'Planning',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          styleNumber: 'ZR-CHINO-402',
          buyer: 'Zara'
        }
      ];
    }
    return items;
  },

  saveCoordinationItem: (item: CoordinationItem) => {
    const items = mockDb.getCoordinationItems();
    const index = items.findIndex(i => i.id === item.id);
    if (index > -1) {
      items[index] = item;
    } else {
      items.push(item);
    }
    localStorage.setItem('protrack_coordination_items', JSON.stringify(items));
  },

  getPlanningRevisions: (): PlanningRevision[] => {
    return JSON.parse(localStorage.getItem('protrack_planning_revisions') || '[]');
  },

  savePlanningRevision: (revision: PlanningRevision) => {
    const revisions = mockDb.getPlanningRevisions();
    revisions.push(revision);
    localStorage.setItem('protrack_planning_revisions', JSON.stringify(revisions));
  },

  getFabricConsumptions: (): FabricConsumptionEntry[] => {
    return JSON.parse(localStorage.getItem('protrack_fabric_consumption') || '[]');
  },

  saveFabricConsumption: (entry: FabricConsumptionEntry) => {
    const all = mockDb.getFabricConsumptions();
    const idx = all.findIndex(e => e.id === entry.id);
    if (idx >= 0) all[idx] = entry;
    else all.unshift(entry);
    localStorage.setItem('protrack_fabric_consumption', JSON.stringify(all));
  },

  getTrimsConsumptions: (): TrimsConsumptionEntry[] => {
    return JSON.parse(localStorage.getItem('protrack_trims_consumption') || '[]');
  },

  saveTrimsConsumption: (entry: TrimsConsumptionEntry) => {
    const all = mockDb.getTrimsConsumptions();
    const idx = all.findIndex(e => e.id === entry.id);
    if (idx >= 0) all[idx] = entry;
    else all.unshift(entry);
    localStorage.setItem('protrack_trims_consumption', JSON.stringify(all));
  },

};
