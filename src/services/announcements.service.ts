import apiClient from '@/lib/axios';

export interface Announcement {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  category: 'general' | 'maintenance' | 'promotion' | 'event' | 'policy' | 'emergency' | 'schedule_change' | 'facility';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'scheduled' | 'published' | 'expired' | 'archived';
  targetAudience: 'all_members' | 'active_members' | 'premium_members' | 'specific_classes' | 'trainers' | 'staff';
  targetGroups?: string[];
  images?: string[];
  isPinned: boolean;
  scheduledFor?: string | null;
  expiresAt?: string | null;
  publishedAt?: string | null;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementFilters {
  category?: string;
  priority?: string;
  status?: string;
  targetAudience?: string;
  isPinned?: boolean;
}

export const announcementsService = {
  async getAll(tenantId: string, filters?: AnnouncementFilters): Promise<Announcement[]> {
    const response = await apiClient.get(`/tenants/${tenantId}/announcements`, {
      params: filters,
    });
    // Backend returns { data: [...], total, page, limit }
    return response.data.data || [];
  },

  async getById(tenantId: string, announcementId: string): Promise<Announcement> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/announcements/${announcementId}`);
    return data;
  },

  async create(tenantId: string, announcementData: Partial<Announcement>): Promise<Announcement> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/announcements`, announcementData);
    return data;
  },

  async update(tenantId: string, announcementId: string, announcementData: Partial<Announcement>): Promise<Announcement> {
    const { data } = await apiClient.patch(`/tenants/${tenantId}/announcements/${announcementId}`, announcementData);
    return data;
  },

  async delete(tenantId: string, announcementId: string): Promise<void> {
    await apiClient.delete(`/tenants/${tenantId}/announcements/${announcementId}`);
  },

  async publish(tenantId: string, announcementId: string): Promise<Announcement> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/announcements/${announcementId}/publish`);
    return data;
  },

  async pin(tenantId: string, announcementId: string): Promise<Announcement> {
    const { data} = await apiClient.post(`/tenants/${tenantId}/announcements/${announcementId}/pin`);
    return data;
  },

  async unpin(tenantId: string, announcementId: string): Promise<Announcement> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/announcements/${announcementId}/unpin`);
    return data;
  },

  async archive(tenantId: string, announcementId: string): Promise<Announcement> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/announcements/${announcementId}/archive`);
    return data;
  },
};
