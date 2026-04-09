import { apiService } from './apiService';

export const getAuthService = () => {
  return {
    login: async (employeeId: string, password: string) => {
      return await apiService.login(employeeId, password);
    },
    logout: () => {
      localStorage.removeItem('protrack_session');
      window.location.reload();
    }
  };
};
