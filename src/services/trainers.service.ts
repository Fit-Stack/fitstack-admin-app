import apiClient from '@/lib/axios';

// Enums matching backend
export enum TrainerSpecialization {
  STRENGTH_TRAINING = 'strength_training',
  CARDIO = 'cardio',
  YOGA = 'yoga',
  PILATES = 'pilates',
  CROSSFIT = 'crossfit',
  BODYBUILDING = 'bodybuilding',
  WEIGHT_LOSS = 'weight_loss',
  NUTRITION = 'nutrition',
  SPORTS_SPECIFIC = 'sports_specific',
  REHABILITATION = 'rehabilitation',
  FUNCTIONAL_TRAINING = 'functional_training',
  HIIT = 'hiit',
  MARTIAL_ARTS = 'martial_arts',
  DANCE_FITNESS = 'dance_fitness',
  SENIOR_FITNESS = 'senior_fitness',
  PRENATAL_POSTNATAL = 'prenatal_postnatal',
}

export enum TrainerExperienceLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum TrainerAvailabilityStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  ON_LEAVE = 'on_leave',
  INACTIVE = 'inactive',
}

export enum DemoBookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

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
  specializations: TrainerSpecialization[];
  experienceLevel: TrainerExperienceLevel;
  yearsOfExperience: number;
  certifications: string[];
  rating: number;
  totalReviews: number;
  totalSessionsConducted: number;
  offersDemoSession: boolean;
  demoSessionDurationMinutes?: number;
  hourlyRate?: number;
  availabilityStatus: TrainerAvailabilityStatus;
  weeklyAvailability?: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainerDto {
  userId: string;
  bio?: string;
  profileImageUrl?: string;
  specializations: TrainerSpecialization[];
  experienceLevel: TrainerExperienceLevel;
  yearsOfExperience: number;
  certifications?: string[];
  education?: string;
  weeklyAvailability?: Record<string, string[]>;
  hourlyRate?: number;
  offersDemoSession?: boolean;
  demoSessionDurationMinutes?: number;
  demoSessionDescription?: string;
}

export interface UpdateTrainerDto extends Partial<CreateTrainerDto> {
  availabilityStatus?: TrainerAvailabilityStatus;
}

export interface BookDemoDto {
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

export interface DemoBooking {
  id: string;
  trainerId: string;
  memberId: string;
  preferredDate: string;
  preferredTime: string;
  status: DemoBookingStatus;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerFilters {
  search?: string;
  specializations?: TrainerSpecialization[];
  experienceLevel?: TrainerExperienceLevel;
  availabilityStatus?: TrainerAvailabilityStatus;
  offersDemoSession?: boolean;
  minRating?: number;
  page?: number;
  limit?: number;
}

export const trainersService = {
  // Trainer CRUD
  async getAll(tenantId: string, filters?: TrainerFilters): Promise<{ trainers?: Trainer[]; data?: Trainer[]; total: number }> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/trainers`, {
      params: filters,
    });
    return data;
  },

  async getById(tenantId: string, trainerId: string): Promise<Trainer> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/trainers/${trainerId}`);
    return data;
  },

  async create(tenantId: string, trainerData: CreateTrainerDto): Promise<Trainer> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/trainers`, trainerData);
    return data;
  },

  async update(tenantId: string, trainerId: string, trainerData: UpdateTrainerDto): Promise<Trainer> {
    const { data } = await apiClient.patch(`/tenants/${tenantId}/trainers/${trainerId}`, trainerData);
    return data;
  },

  async delete(tenantId: string, trainerId: string): Promise<void> {
    await apiClient.delete(`/tenants/${tenantId}/trainers/${trainerId}`);
  },

  // Demo Booking APIs
  async bookDemo(tenantId: string, trainerId: string, bookingData: BookDemoDto): Promise<DemoBooking> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/trainers/${trainerId}/book-demo`, bookingData);
    return data;
  },

  async getMyBookings(tenantId: string): Promise<DemoBooking[]> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/trainers/bookings/my-bookings`);
    return data;
  },

  async getTrainerBookings(tenantId: string, trainerId: string): Promise<DemoBooking[]> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/trainers/${trainerId}/bookings`);
    return data;
  },

  async updateBookingStatus(tenantId: string, bookingId: string, status: DemoBookingStatus): Promise<DemoBooking> {
    const { data } = await apiClient.patch(`/tenants/${tenantId}/trainers/bookings/${bookingId}/status`, { status });
    return data;
  },

  async cancelBooking(tenantId: string, bookingId: string, cancellationReason?: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete(`/tenants/${tenantId}/trainers/bookings/${bookingId}`, {
      data: { cancellationReason },
    });
    return data;
  },
};
