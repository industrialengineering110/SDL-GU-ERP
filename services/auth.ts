
import { ENV } from '../config/env';
import { demoAuth } from './auth.demo';
import { realAuth } from './auth.real';

export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export interface AuthService {
  login: (id: string, password: string) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  getCurrentUser: () => AuthUser | null;
}

export const getAuthService = (): AuthService => {
  if (ENV.DEMO_MODE) {
    console.log("Using demo auth service");
    return demoAuth;
  }
  console.log("Using real auth service");
  return realAuth;
};
