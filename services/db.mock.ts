
import { mockDb } from './mockDb';

export const mockDbService = {
  // Wrap existing mockDb methods
  getDepartmentSummary: mockDb.getDepartmentSummary,
  getLinePerformance: mockDb.getLinePerformance,
  getNPT: mockDb.getNPT,
  // ... add other methods as needed
};
