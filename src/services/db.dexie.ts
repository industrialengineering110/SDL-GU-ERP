import Dexie, { Table } from 'dexie';

export class ProTrackDatabase extends Dexie {
  production!: Table<any>;
  wip!: Table<any>;
  npt!: Table<any>;
  manpower!: Table<any>;
  stylePlans!: Table<any>;
  sewingCosting!: Table<any>;
  threadConsumption!: Table<any>;
  appConfig!: Table<any>;
  users!: Table<any>;

  constructor() {
    super('ProTrackDB');
    this.version(1).stores({
      production: 'id, date, lineId, _status',
      wip: 'id, date, lineId, _status',
      npt: 'id, date, lineId, _status',
      manpower: 'id, date, lineId, _status',
      stylePlans: 'id, styleNumber, _status',
      sewingCosting: 'id, styleNumber, _status',
      threadConsumption: 'id, styleNumber, _status',
      appConfig: 'id',
      users: 'id, employee_id, email'
    });
  }
}

export const db = new ProTrackDatabase();
