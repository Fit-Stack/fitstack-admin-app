import apiClient from '@/lib/axios';

export interface CommunityEvent {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  activityType: string;
  startDate: string;
  endDate?: string;
  location: string;
  capacity: number;
  participantCount?: number;
  visibility: 'public' | 'friends_only' | 'invite_only';
  status: 'pending_approval' | 'approved' | 'cancelled' | 'completed';
  createdBy: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventFilters {
  status?: string;
  visibility?: string;
  activityType?: string;
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedEventsResponse {
  events: CommunityEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const eventsService = {
  async getAll(tenantId: string, filters?: EventFilters): Promise<PaginatedEventsResponse> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/community-events`, {
      params: { page: 1, limit: 20, ...filters },
    });
    return data;
  },

  async getById(tenantId: string, eventId: string): Promise<CommunityEvent> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/community-events/${eventId}`);
    return data;
  },

  async create(tenantId: string, eventData: Partial<CommunityEvent>): Promise<CommunityEvent> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/community-events`, eventData);
    return data;
  },

  async update(tenantId: string, eventId: string, eventData: Partial<CommunityEvent>): Promise<CommunityEvent> {
    const { data } = await apiClient.patch(`/tenants/${tenantId}/community-events/${eventId}`, eventData);
    return data;
  },

  async delete(tenantId: string, eventId: string): Promise<void> {
    await apiClient.delete(`/tenants/${tenantId}/community-events/${eventId}`);
  },

  async approve(tenantId: string, eventId: string): Promise<CommunityEvent> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/community-events/${eventId}/approve`);
    return data;
  },

  async getParticipants(tenantId: string, eventId: string): Promise<any[]> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/community-events/${eventId}/participants`);
    return data;
  },

  async getPendingRequests(tenantId: string, eventId: string): Promise<any[]> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/community-events/${eventId}/pending-requests`);
    return data;
  },
};
