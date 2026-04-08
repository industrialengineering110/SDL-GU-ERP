
// Fixed: Use named import for Dexie to ensure proper type inheritance and visibility of instance methods like .version()
import { Dexie, type Table } from 'dexie';
import { ProductionRecord, WIPRecord, NPTRecord, ManpowerRecord, StylePlan, SystemConfig } from '../types';

export class EnterpriseDB extends Dexie {
  production!: Table<ProductionRecord & { _status?: 'synced' | 'pending' }, string>;
  wip!: Table<WIPRecord & { _status?: 'synced' | 'pending' }, string>;
  npt!: Table<NPTRecord & { _status?: 'synced' | 'pending' }, string>;
  manpower!: Table<ManpowerRecord & { _status?: 'synced' | 'pending' }, string>;
  stylePlans!: Table<StylePlan & { _status?: 'synced' | 'pending' }, string>;
  sewingCosting!: Table<any & { _status?: 'synced' | 'pending' }, string>;
  threadConsumption!: Table<any & { _status?: 'synced' | 'pending' }, string>;
  systemConfig!: Table<{ id: string; data: SystemConfig }, string>;

  constructor() {
    // Fixed: Named import of Dexie class ensures the compiler correctly identifies instance methods in the constructor
    super('EnterpriseDB');
    this.version(4).stores({
      production: 'id, date, lineId, _status, updated_at',
      wip: 'id, date, lineId, _status, updated_at',
      npt: 'id, date, lineId, _status, updated_at',
      manpower: 'id, date, lineId, _status, updated_at',
      stylePlans: 'id, buyer, styleNumber, lineId, _status, updated_at',
      sewingCosting: 'id, buyer, styleNumber, _status, updated_at',
      threadConsumption: 'id, buyer, styleNumber, _status, updated_at',
      systemConfig: 'id'
    });
  }
}

export const db = new EnterpriseDB();
