
import { db } from './db.dexie';
import { apiService } from './apiService';

class SyncEngine {
  private isSyncing = false;

  async startSync() {
    if (this.isSyncing) return;
    if (!(await apiService.checkHealth())) return;

    this.isSyncing = true;
    try {
      await this.pushLocalChanges();
      await this.pullRemoteChanges();
    } catch (error) {
      console.error('Sync Error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async pushLocalChanges() {
    const tables = ['production', 'wip', 'npt', 'manpower', 'stylePlans', 'sewingCosting', 'threadConsumption'];
    const payload: any = {};

    for (const table of tables) {
      const pending = await (db as any)[table].where('_status').equals('pending').toArray();
      if (pending.length > 0) payload[table] = pending;
    }

    if (Object.keys(payload).length > 0) {
      try {
        const response = await apiService.syncPush(payload);
        if (response.status === 'ok') {
          for (const table of Object.keys(payload)) {
            const ids = payload[table].map((r: any) => r.id);
            await (db as any)[table].where('id').anyOf(ids).modify({ _status: 'synced' });
          }
        }
      } catch (e) {
        console.warn("Push failed - will retry next cycle", e);
      }
    }
  }

  private async pullRemoteChanges() {
    const lastSync = localStorage.getItem('last_sync_ts') || new Date(0).toISOString();
    try {
      const data = await apiService.syncPull(lastSync);
      
      if (data) {
        if (data.production) await db.production.bulkPut(data.production.map((r: any) => ({ ...r, _status: 'synced' })));
        if (data.wip) await db.wip.bulkPut(data.wip.map((r: any) => ({ ...r, _status: 'synced' })));
        if (data.stylePlans) await db.stylePlans.bulkPut(data.stylePlans.map((r: any) => ({ ...r, _status: 'synced' })));
        if (data.manpower) await db.manpower.bulkPut(data.manpower.map((r: any) => ({ ...r, _status: 'synced' })));
        if (data.npt) await db.npt.bulkPut(data.npt.map((r: any) => ({ ...r, _status: 'synced' })));
        if (data.sewingCosting) await db.sewingCosting.bulkPut(data.sewingCosting.map((r: any) => ({ ...r, _status: 'synced' })));
        if (data.threadConsumption) await db.threadConsumption.bulkPut(data.threadConsumption.map((r: any) => ({ ...r, _status: 'synced' })));
        
        localStorage.setItem('last_sync_ts', data.timestamp);
      }
    } catch (e) {
      console.warn("Pull failed", e);
    }
  }
}

export const syncEngine = new SyncEngine();
