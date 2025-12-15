import apiClient from '@/lib/axios';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserFilters {
  role?: string;
  email?: string;
  fullName?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  isActive?: boolean;
  sortBy?: 'email' | 'fullName' | 'role' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const usersService = {
  async getAll(tenantId: string, filters?: UserFilters): Promise<PaginatedUsersResponse> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/users`, {
      params: { page: 1, limit: 20, ...filters },
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
