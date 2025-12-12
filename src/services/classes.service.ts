import apiClient from '@/lib/axios';

export interface Class {
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
  startDate: string;
  endDate: string;
  schedule: {
    days: string[];
    timeSlots: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
  capacity: number;
  enrolled?: number;
  pricingType: 'membership' | 'course_fee' | 'subscription';
  price?: number;
  currency: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassFilters {
  status?: string;
  category?: string;
  level?: string;
  instructorId?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

export const classesService = {
  async getAll(tenantId: string, filters?: ClassFilters): Promise<Class[]> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/classes`, {
      params: filters,
    });
    return data;
  },

  async getById(tenantId: string, classId: string): Promise<Class> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/classes/${classId}`);
    return data;
  },

  async create(tenantId: string, classData: Partial<Class>): Promise<Class> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/classes`, classData);
    return data;
  },

  async update(tenantId: string, classId: string, classData: Partial<Class>): Promise<Class> {
    const { data } = await apiClient.patch(`/tenants/${tenantId}/classes/${classId}`, classData);
    return data;
  },

  async delete(tenantId: string, classId: string): Promise<void> {
    await apiClient.delete(`/tenants/${tenantId}/classes/${classId}`);
  },

  async publish(tenantId: string, classId: string): Promise<Class> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/classes/${classId}/publish`);
    return data;
  },

  async getEnrollments(tenantId: string, classId: string): Promise<any[]> {
    const { data} = await apiClient.get(`/tenants/${tenantId}/classes/${classId}/enrollments`);
    return data;
  },
};
