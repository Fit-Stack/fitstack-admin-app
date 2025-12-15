import apiClient from '@/lib/axios';

export interface Session {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  instructorId?: string;
  instructor?: {
    id: string;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
    specializations?: string[];
    experienceLevel?: string;
  };
  recurrencePattern: {
    type: 'daily' | 'weekly' | 'monthly';
    days?: string[]; // ['monday', 'wednesday']
    time: string; // '17:00'
    durationMinutes: number; // 60
    startDate: string; // '2025-01-01'
    endDate: string; // '2025-12-31'
  };
  capacity?: number;
  isPaid: boolean;
  pricePerAttendance?: number;
  currency: string;
  category?: string;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  createdBy?: string;
  creator?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SessionFilters {
  status?: string;
  instructorId?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedSessionsResponse {
  sessions: Session[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const sessionsService = {
  async getAll(tenantId: string, filters?: SessionFilters): Promise<PaginatedSessionsResponse> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/sessions`, {
      params: { page: 1, limit: 20, ...filters },
    });
    return data;
  },

  async getById(tenantId: string, sessionId: string): Promise<Session> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/sessions/${sessionId}`);
    return data;
  },

  async create(tenantId: string, sessionData: Partial<Session>): Promise<Session> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/sessions`, sessionData);
    return data;
  },

  async update(tenantId: string, sessionId: string, sessionData: Partial<Session>): Promise<Session> {
    const { data } = await apiClient.patch(`/tenants/${tenantId}/sessions/${sessionId}`, sessionData);
    return data;
  },

  async delete(tenantId: string, sessionId: string): Promise<void> {
    await apiClient.delete(`/tenants/${tenantId}/sessions/${sessionId}`);
  },

  async pause(tenantId: string, sessionId: string): Promise<Session> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/sessions/${sessionId}/pause`);
    return data;
  },

  async resume(tenantId: string, sessionId: string): Promise<Session> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/sessions/${sessionId}/resume`);
    return data;
  },

  async getOccurrences(tenantId: string, sessionId: string): Promise<any[]> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/sessions/${sessionId}/occurrences`);
    return data;
  },
};
