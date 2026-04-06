
import { ENV } from '../config/env';
import { mockDbService } from './db.mock';
import { postgresDbService } from './db.postgres';

let dbInstance: any = null;

export const getDb = () => {
  if (dbInstance) return dbInstance;

  if (ENV.DEMO_MODE) {
    console.log("Using mock DB");
    dbInstance = mockDbService;
    return dbInstance;
  }

  if (ENV.IS_PROD) {
    // In production, we expect postgres to be available.
    // If not, we might fail, but we don't crash the frontend.
    console.log("Using postgres DB");
    dbInstance = postgresDbService;
    return dbInstance;
  }

  // Development fallback
  console.log("Postgres unavailable, falling back safely to mock DB");
  dbInstance = mockDbService;
  return dbInstance;
};
