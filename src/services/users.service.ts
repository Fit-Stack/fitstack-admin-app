import apiClient from '@/lib/axios';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserFilters {
  role?: string;
  email?: string;
  fullName?: string;
  search?: string;
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
  totalPages?: number;
}

export const usersService = {
  async getAll(tenantId: string, filters?: UserFilters): Promise<PaginatedUsersResponse> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/users`, {
      params: { page: 1, limit: 20, ...filters },
    });
    return data;
  },

  async search(tenantId: string, search: string, limit: number = 20): Promise<PaginatedUsersResponse> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/users`, {
      params: { search, limit, page: 1 },
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
