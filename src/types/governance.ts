export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export interface Permission {
  action: PermissionAction;
  enabled: boolean;
}

export interface Component {
  id: string;
  name: string;
  permissions: Record<PermissionAction, boolean>;
}

export interface Submodule {
  id: string;
  name: string;
  components: Component[];
}

export interface Module {
  id: string;
  name: string;
  submodules: Submodule[];
}

export const INITIAL_MODULES: Module[] = [
  { id: 'costing', name: 'Costing', submodules: [
    { id: 'c-sewing', name: 'Sewing Costing', components: [{ id: 'c-sewing-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'c-dashboard', name: 'Costing Dashboard', components: [{ id: 'c-dash-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'c-fabric', name: 'Fabric Consumption', components: [{ id: 'c-fab-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'c-thread', name: 'Sewing Thread Consumption', components: [{ id: 'c-thread-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'c-trims', name: 'Trims & Accessories', components: [{ id: 'c-trims-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'c-wash', name: 'Wash Costing', components: [{ id: 'c-wash-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'store', name: 'Store', submodules: [
    { id: 'st-fabric', name: 'Fabric', components: [{ id: 'st-fab-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'st-acc', name: 'Accessories', components: [{ id: 'st-acc-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'st-ie', name: 'IE Activity', components: [{ id: 'st-ie-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'st-report', name: 'Section Report', components: [{ id: 'st-rep-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'planning', name: 'Planning', submodules: [
    { id: 'p-dashboard', name: 'Dashboard', components: [{ id: 'p-dash-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'p-order', name: 'Order Pool', components: [{ id: 'p-order-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'p-preprod', name: 'Pre-Production', components: [{ id: 'p-pre-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'p-line', name: 'Line Loading', components: [{ id: 'p-line-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'p-live', name: 'Live Production', components: [{ id: 'p-live-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'sample', name: 'Sample', submodules: [
    { id: 'sa-summary', name: 'Summary', components: [{ id: 'sa-sum-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sa-merch', name: 'Merchandisers', components: [{ id: 'sa-merch-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sa-pd', name: 'PD', components: [{ id: 'sa-pd-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sa-status', name: 'Sample Status', components: [{ id: 'sa-stat-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sa-prop', name: 'Sample Proportion', components: [{ id: 'sa-prop-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sa-qual', name: 'Sample Quality', components: [{ id: 'sa-qual-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sa-wash', name: 'Wash Send & Received', components: [{ id: 'sa-wash-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sa-risk', name: 'Risk Analysis', components: [{ id: 'sa-risk-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sa-man', name: 'Manpower', components: [{ id: 'sa-man-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sa-mach', name: 'Machine', components: [{ id: 'sa-mach-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sa-ie', name: 'IE Activity', components: [{ id: 'sa-ie-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sa-5s', name: '5S Audit', components: [{ id: 'sa-5s-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'size-set', name: 'Size Set & Pilot', submodules: [
    { id: 'ss-dash', name: 'Dashboard', components: [{ id: 'ss-dash-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ss-plan', name: 'Planner Request', components: [{ id: 'ss-plan-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ss-cut', name: 'Cutting Concern', components: [{ id: 'ss-cut-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ss-sew', name: 'Sewing / Sample Line Concern', components: [{ id: 'ss-sew-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ss-qual', name: 'Quality Team', components: [{ id: 'ss-qual-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ss-wash', name: 'Wash Sample Concern', components: [{ id: 'ss-wash-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ss-rep', name: 'Full Style Report', components: [{ id: 'ss-rep-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'cutting', name: 'Cutting', submodules: [
    { id: 'cu-ie', name: 'IE Activity', components: [{ id: 'cu-ie-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'cu-rep', name: 'Section Report', components: [{ id: 'cu-rep-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'cu-in', name: 'Input Chalan', components: [{ id: 'cu-in-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'cu-man', name: 'Manpower', components: [{ id: 'cu-man-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'cu-mach', name: 'Machinery', components: [{ id: 'cu-mach-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'cu-qc', name: 'QC & Output', components: [{ id: 'cu-qc-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'cu-dwn', name: 'Downtime', components: [{ id: 'cu-dwn-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'cu-ot', name: 'OT Requisition', components: [{ id: 'cu-ot-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'cu-5s', name: '5S Audit', components: [{ id: 'cu-5s-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'print', name: 'Print & Embroidery', submodules: [
    { id: 'pr-ie', name: 'IE Activity', components: [{ id: 'pr-ie-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'pr-rep', name: 'Section Report', components: [{ id: 'pr-rep-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'pr-in', name: 'Input Chalan', components: [{ id: 'pr-in-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'pr-man', name: 'Manpower', components: [{ id: 'pr-man-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'pr-mach', name: 'Machinery', components: [{ id: 'pr-mach-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'pr-qc', name: 'QC & Output', components: [{ id: 'pr-qc-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'pr-dwn', name: 'Downtime', components: [{ id: 'pr-dwn-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'pr-ot', name: 'OT Requisition', components: [{ id: 'pr-ot-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'pr-5s', name: '5S Audit', components: [{ id: 'pr-5s-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'sewing', name: 'Sewing', submodules: [
    { id: 'se-ie', name: 'IE Activity', components: [{ id: 'se-ie-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'se-rep', name: 'Section Report', components: [{ id: 'se-rep-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'se-in', name: 'Input Chalan', components: [{ id: 'se-in-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'se-man', name: 'Manpower', components: [{ id: 'se-man-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'se-mach', name: 'Machinery', components: [{ id: 'se-mach-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'se-qc', name: 'QC & Output', components: [{ id: 'se-qc-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'se-dwn', name: 'Downtime', components: [{ id: 'se-dwn-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'se-ot', name: 'OT Requisition', components: [{ id: 'se-ot-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'se-5s', name: '5S Audit', components: [{ id: 'se-5s-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'washing', name: 'Washing', submodules: [
    { id: 'wa-ie', name: 'IE Activity', components: [{ id: 'wa-ie-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'wa-rep', name: 'Section Report', components: [{ id: 'wa-rep-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'wa-manw', name: 'Manpower (Wet)', components: [{ id: 'wa-manw-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'wa-mand', name: 'Manpower (Dry)', components: [{ id: 'wa-mand-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'wa-machw', name: 'Machine (Wet)', components: [{ id: 'wa-machw-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'wa-machd', name: 'Machine (Dry)', components: [{ id: 'wa-machd-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'wa-dwn', name: 'Down Time', components: [{ id: 'wa-dwn-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'wa-5sw', name: '5S Audit (Wet)', components: [{ id: 'wa-5sw-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'wa-5sd', name: '5S Audit (Dry)', components: [{ id: 'wa-5sd-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'finishing', name: 'Finishing', submodules: [
    { id: 'fi-ie', name: 'IE Activity', components: [{ id: 'fi-ie-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'fi-rep', name: 'Section Report', components: [{ id: 'fi-rep-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'fi-in', name: 'Input Chalan', components: [{ id: 'fi-in-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'fi-man', name: 'Manpower', components: [{ id: 'fi-man-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'fi-mach', name: 'Machinery', components: [{ id: 'fi-mach-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'fi-qc', name: 'QC & Output', components: [{ id: 'fi-qc-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'fi-dwn', name: 'Downtime', components: [{ id: 'fi-dwn-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'fi-ot', name: 'OT Requisition', components: [{ id: 'fi-ot-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'fi-5s', name: '5S Audit', components: [{ id: 'fi-5s-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'shipment', name: 'Shipment', submodules: [
    { id: 'sh-ie', name: 'IE Activity', components: [{ id: 'sh-ie-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'sh-rep', name: 'Section Report', components: [{ id: 'sh-rep-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'ot-analysis', name: 'OT Analysis', submodules: [
    { id: 'ot-sum', name: 'Summary', components: [{ id: 'ot-sum-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ot-det', name: 'Details', components: [{ id: 'ot-det-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'machine-analysis', name: 'Machine Analysis', submodules: [
    { id: 'ma-inv', name: 'Fleet Inventory', components: [{ id: 'ma-inv-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ma-maint', name: 'Maintenance Hub', components: [{ id: 'ma-maint-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ma-brk', name: 'Breakdown Logs', components: [{ id: 'ma-brk-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ma-eff', name: 'OEE / Efficiency', components: [{ id: 'ma-eff-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ma-spare', name: 'Spare Parts', components: [{ id: 'ma-spare-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'manpower-analysis', name: 'Manpower Analysis', submodules: [
    { id: 'mp-sum', name: 'Strength Summary', components: [{ id: 'mp-sum-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'mp-bud', name: 'Budget Master', components: [{ id: 'mp-bud-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'mp-reg', name: 'Personnel Registry', components: [{ id: 'mp-reg-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'mp-skill', name: 'Skill Matrix', components: [{ id: 'mp-skill-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'mp-abs', name: 'Absent Monitor', components: [{ id: 'mp-abs-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'mp-app', name: 'Appraisal Hub', components: [{ id: 'mp-app-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'furniture-status', name: 'Furniture Status', submodules: [
    { id: 'fs-inv', name: 'Inventory', components: [{ id: 'fs-inv-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'fs-maint', name: 'Maintenance', components: [{ id: 'fs-maint-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'calculation', name: 'Calculation', submodules: [
    { id: 'ca-smv', name: 'SMV Calculator', components: [{ id: 'ca-smv-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
    { id: 'ca-eff', name: 'Efficiency Calc', components: [{ id: 'ca-eff-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'factory-analysis', name: 'Factory Analysis', submodules: [
    { id: 'fa-rep', name: 'Report', components: [{ id: 'fa-rep-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'governance', name: 'Governance', submodules: [
    { id: 'go-rep', name: 'Report', components: [{ id: 'go-rep-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
  { id: 'notice-board', name: 'Notice Board', submodules: [
    { id: 'no-rep', name: 'Report', components: [{ id: 'no-rep-main', name: 'Main', permissions: { view: false, create: false, edit: false, delete: false, approve: false } }] },
  ]},
];

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  permissions: Module[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended' | 'Active' | 'Inactive';
  groupId?: string;
  isApproved: boolean;
  createdAt: string;
}
