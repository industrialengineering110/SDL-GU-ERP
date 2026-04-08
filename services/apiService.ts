
const BASE_URL = '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('protrack_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: any = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    if (response.status === 401) {
      localStorage.clear();
      // Only reload if we were trying to do something authenticated
      if (token) {
        window.location.reload();
      }
      throw new Error('Unauthorized');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'API failure');
    return data;
  }

  async login(identifier: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async hasAdmin(): Promise<boolean> {
    try {
      const res = await this.request('/auth/has-admin');
      return res.hasAdmin;
    } catch { return false; }
  }

  async registerAdmin(userData: any) {
    return this.request('/auth/register-admin', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUsers() {
    return this.request('/admin/users');
  }

  async updateUserStatus(id: string, data: any) {
    return this.request(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUserProfile(id: string, data: any) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getRemoteConfig() {
    return this.request('/config');
  }

  async saveRemoteConfig(data: any) {
    return this.request('/config', { method: 'POST', body: JSON.stringify({ data }) });
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      return res.ok;
    } catch { return false; }
  }

  async syncPush(payload: any) {
    return this.request('/sync/push', { method: 'POST', body: JSON.stringify(payload) });
  }

  async syncPull(since: string) {
    return this.request(`/sync/pull?since=${encodeURIComponent(since)}`);
  }

  async saveProduction(record: any) {
    return this.request('/production/log', { method: 'POST', body: JSON.stringify(record) });
  }

  async getQCO(department: string) {
    return this.request(`/qco?department=${department}`);
  }

  async saveQCO(record: any) {
    return this.request('/qco', { method: 'POST', body: JSON.stringify(record) });
  }

  // Production Targets
  async getProductionTargets(date: string) {
    return this.request(`/production-targets?date=${date}`);
  }

  async saveProductionTargets(targets: any[]) {
    return this.request('/production-targets', {
      method: 'POST',
      body: JSON.stringify(targets),
    });
  }

  // Wash Costing
  async getWashCosting() {
    return this.request('/wash-costing');
  }

  async saveWashCosting(data: any) {
    return this.request('/wash-costing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Consumption
  async getConsumption(type: 'trims' | 'fabric') {
    return this.request(`/consumption/${type}`);
  }

  async saveConsumption(type: 'trims' | 'fabric', data: any) {
    return this.request(`/consumption/${type}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
