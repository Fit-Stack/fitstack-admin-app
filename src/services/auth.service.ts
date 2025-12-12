import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';
import { LoginCredentials, AuthResponse, User } from '@/types';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const endpoint = credentials.tenantId 
      ? API_ENDPOINTS.LOGIN 
      : API_ENDPOINTS.SUPER_ADMIN_LOGIN;
    
    const { data } = await api.post<AuthResponse>(endpoint, credentials);
    
    // Store auth data
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'super_admin';
  }
}

export const authService = new AuthService();
