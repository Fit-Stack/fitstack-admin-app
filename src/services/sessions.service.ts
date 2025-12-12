import apiClient from '@/lib/axios';

export interface Session {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  category: string;
  startDate: string;
  endDate?: string;
  recurrence: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: string;
  };
  timeSlots: Array<{
    startTime: string;
    endTime: string;
  }>;
  capacity: number;
  isDropIn: boolean;
  status: 'active' | 'paused' | 'cancelled';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionFilters {
  status?: string;
  category?: string;
  instructorId?: string;
  limit?: number;
}

export const sessionsService = {
  async getAll(tenantId: string, filters?: SessionFilters): Promise<Session[]> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/sessions`, {
      params: filters,
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
