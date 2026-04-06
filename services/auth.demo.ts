
import { AuthUser, AuthService } from './auth';
import { ENV } from '../config/env';
import { mockDb } from './mockDb';

export const demoAuth: AuthService = {
  login: async (id, password) => {
    // 1. Dev Shortcut
    if (ENV.DEV_LOGIN && id === '0' && password === '0') {
      console.log("DEV LOGIN enabled: Quick admin login successful");
      return { id: 'admin-demo', name: 'Demo Admin', role: 'admin' };
    }

    // 2. Mock Database Check
    const users = mockDb.getUsers();
    console.log("DEBUG: Users in mockDb:", JSON.stringify(users, null, 2));
    console.log("DEBUG: Attempting login with ID:", `"${id}"`, "Password:", `"${password}"`);
    
    const user = users.find(u => {
      const match = u.employee_id === id && u.password === password;
      if (u.employee_id === id) {
        console.log(`DEBUG: ID match found for ${u.employee_id}, checking password...`);
        console.log(`DEBUG: DB Password: "${u.password}", Input Password: "${password}"`);
      }
      return match;
    });
    console.log("DEBUG: User found:", user);

    if (user) {
      if (user.status === 'APPROVED') {
        return { id: user.id, name: user.name, role: user.role };
      } else {
        console.log("User status is not APPROVED:", user.status);
      }
    } else {
      console.log("No user found with matching ID and password");
    }
    
    return null;
  },
  logout: async () => {
    console.log("Demo auth logout");
  },
  getCurrentUser: () => {
    return null; // Simplified for demo
  }
};
