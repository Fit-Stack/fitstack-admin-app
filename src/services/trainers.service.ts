import apiClient from '@/lib/axios';

export interface Trainer {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  bio: string;
  specializations: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
  certifications: string[];
  rating: number;
  totalReviews: number;
  totalSessionsConducted: number;
  offersDemoSession: boolean;
  demoSessionDurationMinutes?: number;
  hourlyRate?: number;
  availabilityStatus: 'available' | 'busy' | 'on_leave' | 'inactive';
  weeklyAvailability?: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerFilters {
  specializations?: string[];
  experienceLevel?: string;
  availabilityStatus?: string;
  offersDemoSession?: boolean;
  minRating?: number;
  page?: number;
  limit?: number;
}

export const trainersService = {
  async getAll(tenantId: string, filters?: TrainerFilters): Promise<{ trainers: Trainer[]; total: number }> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/trainers`, {
      params: filters,
    });
    return data;
  },

  async getById(tenantId: string, trainerId: string): Promise<Trainer> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/trainers/${trainerId}`);
    return data;
  },

  async create(tenantId: string, trainerData: Partial<Trainer>): Promise<Trainer> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/trainers`, trainerData);
    return data;
  },

  async update(tenantId: string, trainerId: string, trainerData: Partial<Trainer>): Promise<Trainer> {
    const { data } = await apiClient.patch(`/tenants/${tenantId}/trainers/${trainerId}`, trainerData);
    return data;
  },

  async delete(tenantId: string, trainerId: string): Promise<void> {
    await apiClient.delete(`/tenants/${tenantId}/trainers/${trainerId}`);
  },

  async getBookings(tenantId: string, trainerId: string): Promise<any[]> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/trainers/${trainerId}/bookings`);
    return data;
  },
};
