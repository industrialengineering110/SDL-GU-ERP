import { apiService } from './apiService';

export const getAuthService = () => {
  return {
    login: async (employeeId: string, password: string) => {
      const response = await apiService.login(employeeId, password);
      if (response.token) {
        localStorage.setItem('protrack_token', response.token);
      }
      return response;
    },
    logout: () => {
      localStorage.removeItem('protrack_token');
      window.location.reload();
    }
  };
};
