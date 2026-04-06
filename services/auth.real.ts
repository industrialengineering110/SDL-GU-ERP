
import { AuthUser, AuthService } from './auth';
import { apiService } from './apiService';

export const realAuth: AuthService = {
  login: async (identifier, password) => {
    try {
      const { user, token } = await apiService.login(identifier, password);
      localStorage.setItem('protrack_token', token);
      localStorage.setItem('protrack_user', JSON.stringify(user));
      return user;
    } catch (err) {
      console.error("Real auth login failed:", err);
      return null;
    }
  },
  logout: async () => {
    localStorage.removeItem('protrack_token');
    localStorage.removeItem('protrack_user');
    window.location.reload();
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('protrack_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
