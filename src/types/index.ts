export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'super_admin';
  tenantId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantId?: string; // Optional for super admin
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at: number;
  user: User;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  capacity: number;
  imageUrl?: string;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  classId: string;
  className: string;
  trainerId: string;
  trainerName: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enrolled: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  location?: string;
}

export interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specializations: string[];
  bio?: string;
  imageUrl?: string;
  rating?: number;
  totalSessions?: number;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  status: 'published' | 'draft' | 'out_of_stock';
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registered: number;
  imageUrl?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface AnalyticsData {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  totalSessions: number;
  revenueData: Array<{ date: string; amount: number }>;
  enrollmentData: Array<{ date: string; count: number }>;
  popularClasses: Array<{ name: string; enrollments: number }>;
}
