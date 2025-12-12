import apiClient from '@/lib/axios';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string;
  preferences?: Record<string, any>;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const usersService = {
  async getAll(tenantId: string, page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/users`, {
      params: { page, limit },
    });
    return data;
  },

  async getById(tenantId: string, userId: string): Promise<User> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/users/${userId}`);
    return data;
  },

  async update(tenantId: string, userId: string, userData: Partial<User>): Promise<User> {
    const { data } = await apiClient.patch(`/tenants/${tenantId}/users/${userId}`, userData);
    return data;
  },

  async deactivate(tenantId: string, userId: string): Promise<void> {
    await apiClient.post(`/tenants/${tenantId}/users/${userId}/deactivate`);
  },

  async activate(tenantId: string, userId: string): Promise<void> {
    await apiClient.post(`/tenants/${tenantId}/users/${userId}/activate`);
  },
};
