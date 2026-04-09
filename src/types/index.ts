
export enum UserRole {
  ADMIN = 'ADMIN',
  DATA_ENTRY = 'DATA_ENTRY',
  IE_REPORTER = 'IE_REPORTER',
  MECHANIC = 'MECHANIC',
  QUALITY_INSPECTOR = 'QUALITY_INSPECTOR',
  PRODUCTION_MANAGER = 'PRODUCTION_MANAGER',
  PLANNING_MANAGER = 'PLANNING_MANAGER',
  IE_COSTING = 'IE_COSTING',
  VIEWER = 'VIEWER'
}

export enum MachineStatus {
  WORKING = 'WORKING',
  BREAKDOWN = 'BREAKDOWN',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE'
}

export type DepartmentType = 'IE' | 'Production' | 'Maintenance' | 'Quality' | 'Cutting' | 'Finishing' | 'Sample' | 'Sewing' | 'Washing' | 'Shipment' | 'Costing' | 'Planning';

export interface LineMapping {
  lineId: string;
  blockId: string;
  sectionId: string;
  category?: 'Governance' | 'Config' | 'Lines';
  area?: string;
  floor?: string;
  building?: string;
  manpower?: number;
  blockIncharge?: string;
  remarks?: string;
  budgetOp?: number;
  budgetIr?: number;
  budgetHp?: number;
  layoutManpower?: number;
  layoutExtra?: number;
}

export interface OrderPoolEntry {
  id: string;
  planningOwner?: string;
  preProductionStatus?: string;
  isReadyForPlan?: boolean;
  blockerReason?: string;
  shipmentLeftDate?: string; // Days left for shipment
  image?: string;
  image2?: string;
  merchandiser: string;
  sourcing: string;
  buyer: string;
  country: string;
  orderConfirmDate: string;
  soNo: string;
  style: string;
  washColor: string;
  orderQty: number;
  monthQty: number;
  fabricMill: string;
  fabricInhouseDate: string;
  accessoriesInhouseDate: string;
  tentativePPSampleApprovalDate: string;
  fileHandoverDate: string; // Initial-Approved File/Trims Card Handover Date
  shipDate: string;
  smv: number;
  marketingTarget: number;
  marketingAverage?: number;
  type: string;
  sizeGroup: string;
  fabricType: string;
  item: string;
  productCategory?: string;
  originalQty?: number; // To track original quantity if split
  washType: string;
  print: string;
  emb: string;
  status: 'New' | 'Validated' | 'Need Correction' | 'Imported';
  planningMemberId?: string;
}

export type PreProdStatus = 'Pending' | 'In Progress' | 'Approved' | 'Failed' | 'Hold' | 'Not Required';
export type PreProdApplicability = 'Required' | 'Optional' | 'Not Applicable';
export type IssueSource = 'Factory' | 'Buyer' | 'Supplier' | 'Third Party';

export interface PreProductionStage {
  applicability: PreProdApplicability;
  status: PreProdStatus;
  targetDate?: string;
  actualDate?: string;
  delayDays: number;
  blockerReason?: string;
  issueSource?: IssueSource;
  remarks?: string;
}

export interface PreProductionTracker {
  id: string;
  orderId: string;
  checklist: Record<string, PreProductionStage>;
  isReadyForPlan: boolean;
  overallBlockerReason?: string;
  lastUpdated?: string;
}

export interface PlanningOwnership {
  id: string;
  buyer: string;
  planningOwner: string;
  lineLoadingPlanner: string;
  updatedAt: string;
}

export interface StyleConfirmationVariant {
  po: string;
  color: string;
  quantity: number;
}

export interface StyleConfirmation {
  id: string;
  buyer: string;
  styleNumber: string; // Used as the key for Dynamic Linking
  soNumber: string;
  mpo: string;
  variants: StyleConfirmationVariant[];
  confirmedBy: string;
  timestamp: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface SectionMilestone {
  inputDate: string;
  outputDate: string;
  workingDays: number;
  requiredPcsPerDay: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PLANNING';
  machineId?: string;
}

export interface StylePlan {
  id: string;
  soNumber: string;
  buyer: string;
  styleNumber: string;
  productCategory?: string;
  mpo?: string;
  selectedPos: string[];
  selectedColors: string[];
  smv: number;
  marketingSmv?: number;
  marketingTop?: number;
  marketingEff?: number;
  marketingLines?: number;
  orderQuantity: number;
  planQuantity: number;
  targetEff: number;
  manpower: number;
  workingHours: number;
  lineId: string;
  isReadyForPlan?: boolean;
  sections: Record<string, SectionMilestone>;
  sampleStatus: string;
  sampleDate?: string;
  fileHandoverStatus: string;
  fileHandoverDate?: string;
  fabricStatus: string;
  fabricDate?: string;
  accessoriesStatus: string;
  accessoriesDate?: string;
  printEmbStatus: string;
  printEmbDate?: string;
  sewingThreadInhouse?: boolean;
  shipmentDate: string;
  priority: string;
  status: string;
  isComplete: boolean;
  timestamp: string;
  color?: string;
  // UI helpers
  _variantKeys?: string[];
}

export interface ProductionRecord {
  id: string;
  date: string;
  time: string;
  timestamp: string;
  department: string;
  section: string;
  blockId: string;
  lineId: string;
  soNumber: string;
  buyer: string;
  styleCode: string;
  color: string;
  size?: string;
  actual: number;
  target: number;
  hour: number;
  reporterId: string;
  isRectification?: boolean;
}

export interface WIPRecord {
  id: string;
  date: string;
  time: string;
  department: string;
  section: string;
  blockId: string;
  lineId: string;
  soNumber: string;
  buyer: string;
  styleNumber: string;
  color: string;
  inputQty: number;
  outputQty: number;
  reporterRole: string;
  reporterId: string;
  timestamp: string;
}

export interface StyleHistoryEntry {
  timestamp: string;
  note: string; // The "Reason" for change
  buyer: string;
  styleNumber: string;
  styleCode: string;
  styleName: string;
  description: string;
  remarks: string;
  smv: number;
  productionTopTarget: number;
  productionAverageTarget: number;
  productionTargetEfficiency: number;
  marketingSmv: number;
  marketingTop: number;
  marketingAverage: number;
  marketingEfficiency: number;
  marketingOrderQty: number;
  lineConsideration: number;
  numberOfStyling: number;
  numberOfStyle: number;
  numberOfColor: number;
  productCategory: string;
}

export interface StyleInfo {
  id: string;
  buyer: string;
  styleNumber: string;
  styleCode: string;
  styleName: string;
  description: string;
  productCategory: string;
  numberOfStyling: number;
  numberOfStyle: number;
  numberOfColor: number;
  marketingOrderQty: number;
  lineConsideration: number;
  smv: number;
  marketingSmv: number;
  marketingTop: number;
  marketingAverage: number;
  marketingEfficiency: number;
  productionTopTarget: number;
  productionAverageTarget: number;
  productionTargetEfficiency: number;
  remarks: string;
  history: StyleHistoryEntry[];
  createdAt: string;
  modificationDate?: string;
  modificationNote?: string; // Reason for last edit
}

export interface DailyTarget {
  id: string;
  date: string;
  department: string;
  lineId: string;
  blockId: string;
  styleNumber: string;
  productItem: string;
  buyer: string;
  sam: number;
  outputStartDate: string;
  daysRunning: number;
  actualSamEarner: number;
  lineWip: number;
  workingHours: number;
  headCount: number;
  todayTargetPcs: number;
  targetEfficiency: number;
  efficiencyAdjustment?: number;
  actualPcs?: number;
  mmTopTgtHr: number;
  lineCapacity: number;
  lineHrPrdn: number;
  lastDayWorkHr?: number;
  lastDayTarget?: number;
  lastDayAchieve?: number;
  gapRemarks?: string;
  remarks: string;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  from: string;
  toDepartment: string;
  toRole?: string;
  message: string;
  readBy: string[];
  type: 'ALERT' | 'INFO';
  image?: string;
}

export interface MachineRecord {
  id: string;
  date: string;
  department: string;
  blockId: string;
  lineId: string;
  machineType: string;
  serialNumber: string;
  status: MachineStatus;
  reporterId: string;
  timestamp: string;
}

export interface TimeStudyRecord {
  id: string;
  department: string;
  employeeId: string;
  operatorName: string;
  designation: string;
  lineId: string;
  processName: string;
  machineType: string;
  productionCycles: number[];
  othersCycles: { category: string; time: number }[];
  avgProductionTime: number;
  avgOthersTime: number;
  capacity: number;
  comments: string;
  workMotion: string;
  workMethod: string;
  studyBy: string;
  timestamp: string;
  startTime: string;
  endTime: string;
  buyer: string;
  styleNumber: string;
  unit: string;
  efficiency: number;
  proofImageUrl?: string;
}

export interface DefectRecord {
  id: string;
  date: string;
  time: string;
  timestamp: string;
  department: string;
  section: string;
  blockId: string;
  lineId: string;
  soNumber: string;
  buyer: string;
  styleCode: string;
  color: string;
  size?: string;
  defectType: string;
  count: number;
  isReject: boolean;
  reporterId: string;
}

export interface NPTRecord {
  id: string;
  date: string;
  department: string;
  lineId: string;
  issueCategory: string;
  buyer: string;
  styleNumber: string;
  reason: string;
  details: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  status: 'PENDING' | 'RESOLVED';
  reporterId: string;
  timestamp: string;
  affectedManpower?: number;
}

export interface Audit5SRecord {
  id: string;
  date: string;
  department: string;
  lineId: string;
  scores: Record<string, number>;
  totalScore: number;
  auditorId: string;
  remarks: string;
  timestamp: string;
}

export interface ManpowerRecord {
  id: string;
  date: string;
  department: string;
  blockId: string;
  lineId: string;
  totalSupervisor: number;
  presentOp: number;
  presentIr: number;
  presentHp: number;
  headCount: number;
  headCountExtra: number;
  budgetOp: number;
  budgetIr: number;
  budgetHp: number;
  totalRecruit: number;
  closeOp: number;
  closeHpIr: number;
  actualRecruit: number;
  absent: number;
  layoutManpower: number;
  layoutExtra: number;
  timestamp: string;
  reporterId: string;
}

export interface SkillRecord {
  id: string;
  department: string;
  operatorId: string;
  operatorName: string;
  processName: string;
  lineId: string;
  skillLevel: 'A' | 'B' | 'C';
  efficiency: number;
  lastStudyDate: string;
}

export interface BlockConfig {
  id: string;
  name: string;
  lineIds: string[];
}

export interface QCORecord {
  id: string;
  date: string;
  department: string;
  lineId: string;
  oldStyle: string;
  newStyle: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  status: 'PENDING' | 'RESOLVED';
  checklist: any;
  remarks?: string;
  reporterId: string;
  timestamp: string;
}

export interface OTRequest {
  id: string;
  date: string;
  department: string;
  blockId: string;
  lineId: string;
  buyer: string;
  style: string;
  headcount8hr: number;
  hourlyOTManpower: Record<string, number>; // Keys: "9Hr", "10Hr", "11Hr", "12Hr", "13Hr", "14Hr", "15Hr"
  reason: string;
  responsibleDept: string;
  comments: string;
  status: 'PENDING' | 'APPROVED' | 'QUERIED' | 'REJECTED';
  queryMessage?: string;
  queryResponse?: string;
  requestedBy: string;
  approvedBy?: string;
  timestamp: string;
}

export type AccessLevel = 'DATA_ENTRY' | 'VIEW_ONLY' | 'NONE';

export type PagePermissions = Record<string, AccessLevel>;

export const INITIAL_PERMISSIONS: PagePermissions = {
  dashboard: 'DATA_ENTRY',
  inputChalan: 'DATA_ENTRY',
  manpower: 'DATA_ENTRY',
  machinery: 'DATA_ENTRY',
  targetPlan: 'DATA_ENTRY',
  efficiencyReport: 'DATA_ENTRY',
  skillMatrix: 'DATA_ENTRY',
  workStudy: 'DATA_ENTRY',
  qcOutput: 'DATA_ENTRY',
  downtime: 'DATA_ENTRY',
  styleMaster: 'DATA_ENTRY',
  styleConfirmation: 'DATA_ENTRY',
  analytics: 'DATA_ENTRY',
  governance: 'DATA_ENTRY',
  audit5s: 'DATA_ENTRY',
  planningBoard: 'DATA_ENTRY',
  otSchedule: 'DATA_ENTRY',
  otApproval: 'DATA_ENTRY',
  // New permissions
  sewingCosting: 'NONE',
  costingEntry: 'NONE',
  database: 'NONE',
  consumption: 'NONE',
  washConsumption: 'NONE',
  stone: 'NONE',
  planning: 'NONE',
  sample: 'NONE',
  cutting: 'NONE',
  sizeSetPilot: 'DATA_ENTRY',
};

export const FULL_PERMISSIONS: PagePermissions = Object.keys(INITIAL_PERMISSIONS).reduce((acc, key) => {
  acc[key] = 'DATA_ENTRY';
  return acc;
}, {} as PagePermissions);

export interface CostingDailyTarget {
  day: number;
  target: number;
}

export interface Operation {
  id: string;
  name: string;
  smv: number;
  machineType: string;
  partContext?: string;
  folderAttachment?: string;
  requiredMan?: number;
  actualMan?: number;
  actualMc?: number;
  balancePercent?: number;
  idleTime?: number;
  remarks?: string;
}

export interface ThreadRatio {
  id: string;
  buyer: string;
  stitchType: string;
  pos1Name: string;
  pos1Ratio: number;
  pos2Name: string;
  pos2Ratio: number;
}

export interface WastageData {
  name: string;
  value: number;
}

export interface SDLWastage {
  id: string;
  minQty: number;
  maxQty: number;
  allowance: number;
}

export interface ThreadSpec {
  count: string;
  shade: string;
  coneSize: string;
}

export interface ThreadConsumptionRow {
  id: string;
  operation?: string; // Only for process consumption
  stitchType: string;
  count?: string;
  shade?: string;
  pos1Name?: string;
  pos1Factor: number;
  pos2Name?: string;
  pos2Factor: number;
  seamLengthCm: number;
  threadMeters: number;
}

export interface ThreadConsumptionHistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  remark: string;
  snapshot: Partial<ThreadConsumption>;
}

export interface ThreadConsumption {
  id: string;
  user: string;
  type: 'SHORT' | 'PROCESS';
  styleNumber: string;
  styleCode: string; // Added for alignment
  buyer: string;
  productCategory: string; // Added for alignment
  productType?: string;
  color?: string;
  date: string;
  allowancePercent: number;
  orderQuantity?: number;
  coneSizeMeters?: number;
  threadSpecs: ThreadSpec[];
  operations: ThreadConsumptionRow[]; // Renamed from rows
  totalThreadMeters: number;
  finalThreadMeters: number;
  totalCones: number;
  totalFabricConsumption?: number;
  totalThreadConsumption?: number;
  bookedFabricQuantity?: number;
  bookedThreadQuantity?: number;
  inhouseFabricQuantity?: number;
  inhouseThreadQuantity?: number;
  remarks?: string;
  history?: ThreadConsumptionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CostingHistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  remark: string;
  snapshot: Partial<SewingCosting>;
}

export interface SewingCosting {
  id: string;
  // Step 1: Style Profile
  buyer: string;
  styleNumber: string;
  styleCode: string;
  productCategory: string;
  size: string;
  fabrication: string;
  numStyling: number;
  numStyle: number;
  numColor: number;
  marketingOrderQty: number;
  lineConsideration: number;
  
  // Step 2: Operations
  operations: Operation[];
  manualSMV?: number;
  
  // Step 3: Production Targets & Image
  dailyTargets: CostingDailyTarget[];
  topTargetDay: number; 
  image?: string;
  images?: string[];
  othersSMV?: number;
  afterWashSMV?: number;
  finishingSMV?: number;
  remarks?: string;
  productionSMV?: number;
  productionTopTarget?: number;
  productionAverageTarget?: number;
  
  createdAt: string;
  updatedAt: string;
  user: string;
  history?: CostingHistoryEntry[];
}

export interface SOP {
  id: string;
  type: 'Fabric' | 'Sample' | 'SizeSetPilot';
  department: string;
  title: string;
  processTime: number; // in minutes
  procedure: string;
  rules: string[];
  timestamp: string;
}

export interface AppUser {
  id: string;
  name: string;
  employee_id: string;
  department: string;
  designation: string;
  section?: string;
  lines?: string[];
  area?: string;
  mobileNumber: string;
  password?: string;
  email?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  role: UserRole | string;
  isViewOnly?: boolean;
  pagePermissions?: PagePermissions;
  assignedBlockId?: string;
  createdAt?: string;
  approvedAt?: string;
}

export interface HREntry {
  id: string;
  type: string;
  employeeId: string;
  employeeName: string;
  lineId: string;
  designation: string;
  date: string;
  reason: string;
  details: string;
  timestamp: string;
  reportedBy: string;
}

export interface ProcessConfig {
  id: string;
  garmentType: string;
  part: string;
  processName: string;
  machineType: string;
  smv: number;
  exceptionalBuyer?: string;
  remarks?: string;
}

export interface MachineAsset {
  id: string;
  asset: string;
  subNumber: string;
  capitalizedOn: string;
  machineName: string;
  qrIdPrefix: string;
  mcId: string;
  assetDescription: string;
  status?: 'Operational' | 'Under repair' | 'Converted' | 'Disposal';
  lineId?: string;
  machineType?: string;
}

export interface StaffMember {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  section: string;
  line: string;
  joiningDate: string;
  employeeType: string;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  garmentType: string;
  section: DepartmentType | string;
  operations: any[];
}

export interface LayoutMasterOperation {
  id: string;
  operationId: string;
  operationName: string;
  part: string;
  smv: number;
  mcType: string;
  folderAttachment: string;
  needle: string;
  actualMan: number;
  actualMc: number;
  remarks: string;
  balanceWithId?: string;
}

export interface LayoutMasterRecord {
  id: string;
  preparedDate: string;
  buyer: string;
  style: string;
  description: string;
  approxInputDate: string;
  lineNo: string;
  orderQty: number;
  targetHr: number;
  efficiency: number;
  operators: number;
  cpuOperators: number;
  helpers: number;
  ironMan: number;
  productCategory?: string;
  remarks?: string;
  operations: LayoutMasterOperation[];
  timestamp: string;
  preparedBy: string;
}

export interface WashProcess {
  id: string;
  name: string;
  type: 'WET' | 'DRY';
  machineType: string;
  timeMinutes: number;
  chemicals: { name: string; dosage: number; unit: string; costPerUnit: number }[];
  utilityCost: number;
  laborCost: number;
  remarks: string;
}

export interface WashCostingRecord {
  id: string;
  styleNumber: string;
  buyer: string;
  garmentType: string;
  color: string;
  orderQty: number;
  processes: WashProcess[];
  totalCost: number;
  date: string;
  user: string;
  history?: {
    date: string;
    user: string;
    remark: string;
  }[];
}

export interface IEActivityData {
  id: string;
  department: 'WET' | 'DRY';
  type: 'RECIPE' | 'TARGET' | 'EFFICIENCY' | 'UTILIZATION' | 'SKILL_MATRIX' | 'SMV_BANK';
  data: any;
  timestamp: string;
}

export interface NotificationRoute {
  id: string;
  fromDepartment: string;
  issueType: string;
  toDepartment: string;
  toRole?: string;
}

export interface LearningCurveGroup {
  label: string;
  min: number;
  max: number;
  curve: number[];
}

export interface QualityIssueConfig {
  defects: string[];
  rejects: string[];
}

export interface HRReasons {
  absent: string[];
  late: string[];
  turnover: string[];
  leave: string[];
  halfDay: string[];
}

export interface ManpowerBudgetEntry {
  id: string;
  department: string;
  section: string;
  area: string;
  designation: string;
  category: 'MANAGEMENT' | 'NON-MANAGEMENT';
  type: string;
  budgetPerLine: number;
  numLines: number;
  totalBudget: number;
  remarks: string;
  existing: number;
}

export interface ManpowerStatusEntry {
    id: string;
    employeeId: string;
    name: string;
    designation: string;
    department: string;
    section: string;
    location: string;
    joined: string;
    type: string;
    grade: string;
    religion: string;
    gender: string;
}

export interface MachineRequirement {
    id: string;
    category: string;
    lines: number;
    requirements: Record<string, number>;
}

export interface MachineMaintenanceRecord {
  id: string;
  machineId: string;
  mcId: string;
  machineName: string;
  type: 'PREVENTIVE' | 'CORRECTIVE';
  scheduledDate: string;
  completedDate?: string;
  technicianId: string;
  technicianName: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  remarks?: string;
}

export interface MachineBreakdownRecord {
  id: string;
  machineId: string;
  mcId: string;
  machineName: string;
  lineId: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  issueType: string;
  technicianId?: string;
  technicianName?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  remarks?: string;
}

export interface SparePartRecord {
  id: string;
  partName: string;
  partNumber: string;
  category: string;
  stockQty: number;
  minStockQty: number;
  unit: string;
  price?: number;
}

export interface PlanningMember {
  id: string;
  name: string;
  assignedBuyers: string[];
}

export interface AccessTier {
  id: string;
  name: string;
  description: string;
  permissions: PagePermissions;
}

export interface AppraisalConfig {
  id: string;
  section: string;
  designation: string;
  efficiencyRules: { minEff: number; maxEff: number; score: number }[];
  absenteeismRules: { maxAbsentPercent: number; score: number }[];
  machineCountRules: { minMachines: number; score: number }[];
  processCountRules: { minProcesses: number; score: number }[];
  totalWeight: {
    skill: number;
    efficiency: number;
    absenteeism: number;
    machines: number;
  };
}

export interface AppraisalRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  section: string;
  skillScore: number;
  efficiency: number;
  absentPercentage: number;
  numMachines: number;
  totalMarks: number;
  date: string;
}

export interface SystemConfig {
  designations: string[];
  departments: string[];
  sections: string[];
  availableRoles: string[];
  accessTiers?: AccessTier[];
  nptHierarchy: Record<string, any>;
  nptConfig: Record<string, Record<string, string[]>>;
  otMapping: Record<string, string>; // Mapping of OT Reason to Default Responsible Dept
  lineMappings: LineMapping[];
  offDays?: string[]; // Array of YYYY-MM-DD
  manpowerBudgets: ManpowerBudgetEntry[];
  manpowerStatus: ManpowerStatusEntry[];
  productCategories: string[];
  buyers: string[];
  qualityIssues: Record<string, QualityIssueConfig>;
  processConfigs: Record<string, ProcessConfig[]>;
  fiveSQuestions: Record<string, { key: string; label: string; desc: string }[]>;
  machineAssets: MachineAsset[];
  machineRequirements: MachineRequirement[];
  staffDatabase: StaffMember[];
  notificationRoutes: NotificationRoute[];
  layoutTemplates: LayoutTemplate[];
  learningCurve: Record<string, LearningCurveGroup[]>;
  hrReasons: Record<string, HRReasons>;
  appraisalConfigs: AppraisalConfig[];
  appraisalRecords: AppraisalRecord[];
  otReasons: string[];
  garmentParts: string[];
  styles: string[];
  threadRatios: ThreadRatio[];
  wastageData: WastageData[];
  sdlWastage: SDLWastage[];
  stitchTypes: string[];
  threadCounts: string[];
  coneSizes: string[];
}

export type SizeSetPilotStageName = 'Planner Request' | 'Cutting Concern' | 'Sewing / Sample Line Concern' | 'Quality Team' | 'Wash Sample Concern' | 'Final Inspection' | 'Full Dashboard and Style Report';

export interface SizeSetPilotStageData {
  responsiblePerson: string;
  startTime: string;
  endTime: string;
  quantityHandled: number;
  rejectionQty?: number;
  riskPoints: string[];
  issueNotes: string;
  remarks: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface SizeSetPilotRequest {
  id: string;
  requestType: 'Size Set' | 'Pilot';
  requestedQuantity: number;
  styleNumber: string;
  buyer: string;
  productItem: string;
  plannerName: string;
  requestDate: string;
  stages: Record<SizeSetPilotStageName, SizeSetPilotStageData>;
  currentStage: SizeSetPilotStageName;
  status: 'Active' | 'Completed' | 'Delayed';
}

export interface ProductionTransfer {
  id: string;
  date: string;
  timestamp: string;
  fromDepartment: string;
  toDepartment: string;
  buyer: string;
  style: string;
  soNumber: string;
  color: string;
  quantity: number;
  lines: string[];
  transferBy: string;
  transferById: string;
  receivedBy?: string;
  receivedById?: string;
  receivedTimestamp?: string;
  status: 'PENDING' | 'RECEIVED';
  storageLocation?: string;
}

export interface CoordinationItem {
  id: string;
  title: string;
  description: string;
  fromDept: DepartmentType | string;
  toDept: DepartmentType | string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  styleNumber?: string;
  buyer?: string;
}

export interface PlanningRevision {
  id: string;
  planId: string;
  revisedBy: string;
  revisedAt: string;
  reason: string;
  previousSnapshot: Partial<StylePlan>;
  newSnapshot: Partial<StylePlan>;
}

export interface FabricConsumptionEntry {
  id: string;
  style: string;
  buyer: string;
  markerLength: number; // in yards
  markerWidth: number; // in inches
  garmentsPerMarker: number;
  wastagePercent: number;
  fabricType: string;
  consumptionPerGarment: number;
  updatedAt: string;
}

export interface TrimItem {
  id: string;
  name: string;
  unit: string;
  consumptionPerGarment: number;
  unitPrice: number;
  wastagePercent: number;
}

export interface TrimsConsumptionEntry {
  id: string;
  style: string;
  buyer: string;
  orderQty: number;
  trims: TrimItem[];
  totalTrimCost: number;
  updatedAt: string;
}
