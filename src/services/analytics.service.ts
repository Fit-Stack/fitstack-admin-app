import apiClient from '@/lib/axios';

export interface DashboardStats {
  totalMembers: number;
  activeSessions: number;
  monthlyRevenue: number;
  averageAttendance: number;
  activeTrainers: number;
  memberRetention: number;
  dailyActiveUsers: number;
  growth: {
    members: number;
    sessions: number;
    revenue: number;
    attendance: number;
  };
}

export interface RevenueData {
  date: string;
  revenue: number;
  target: number;
}

export interface MemberGrowthData {
  month: string;
  members: number;
  newMembers: number;
}

export interface SessionAttendanceData {
  day: string;
  morning: number;
  afternoon: number;
  evening: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

export interface TrainerPerformance {
  name: string;
  sessions: number;
  rating: number;
  revenue: number;
}

export const analyticsService = {
  // This would be a real endpoint in production
  // For now, we'll aggregate data from other services
  async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    try {
      // In a real implementation, this would be a dedicated analytics endpoint
      // For now, we'll fetch data from multiple sources
      const [users, , sessions, trainers] = await Promise.all([
        apiClient.get(`/tenants/${tenantId}/users`, { params: { limit: 1 } }),
        apiClient.get(`/tenants/${tenantId}/classes`, { params: { status: 'published' } }),
        apiClient.get(`/tenants/${tenantId}/sessions`, { params: { status: 'active' } }),
        apiClient.get(`/tenants/${tenantId}/trainers`, { params: { limit: 1 } }),
      ]);

      return {
        totalMembers: users.data.total || 0,
        activeSessions: Array.isArray(sessions.data) ? sessions.data.length : 0,
        monthlyRevenue: 187420, // This would come from a payments/revenue endpoint
        averageAttendance: 87.3,
        activeTrainers: trainers.data.total || 0,
        memberRetention: 94.2,
        dailyActiveUsers: Math.floor((users.data.total || 0) * 0.45),
        growth: {
          members: 12.5,
          sessions: 8.2,
          revenue: 23.1,
          attendance: 4.3,
        },
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values if API fails
      return {
        totalMembers: 0,
        activeSessions: 0,
        monthlyRevenue: 0,
        averageAttendance: 0,
        activeTrainers: 0,
        memberRetention: 0,
        dailyActiveUsers: 0,
        growth: {
          members: 0,
          sessions: 0,
          revenue: 0,
          attendance: 0,
        },
      };
    }
  },

  // Mock data generators for charts - these would be real API endpoints
  getRevenueData(): RevenueData[] {
    const data: RevenueData[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: 4000 + Math.random() * 3800,
        target: 4000,
      });
    }
    return data;
  },

  getMemberGrowthData(): MemberGrowthData[] {
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let total = 1850;
    return months.map((month) => {
      const newMembers = 120 + Math.floor(Math.random() * 50);
      total += newMembers;
      return {
        month,
        members: total,
        newMembers,
      };
    });
  },

  getSessionAttendanceData(): SessionAttendanceData[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day) => ({
      day,
      morning: 70 + Math.floor(Math.random() * 30),
      afternoon: 60 + Math.floor(Math.random() * 25),
      evening: 75 + Math.floor(Math.random() * 25),
    }));
  },

  getCategoryDistribution(): CategoryDistribution[] {
    return [
      { name: 'Cardio', value: 35, color: '#f97316' },
      { name: 'Strength', value: 28, color: '#8b5cf6' },
      { name: 'Yoga', value: 22, color: '#10b981' },
      { name: 'HIIT', value: 15, color: '#eab308' },
    ];
  },

  async getTrainerPerformance(tenantId: string): Promise<TrainerPerformance[]> {
    try {
      const { data } = await apiClient.get(`/tenants/${tenantId}/trainers`, {
        params: { limit: 5, sortBy: 'rating', sortOrder: 'DESC' },
      });

      if (data.trainers && Array.isArray(data.trainers)) {
        return data.trainers.map((trainer: any) => ({
          name: `${trainer.user?.firstName || ''} ${trainer.user?.lastName || ''}`.trim(),
          sessions: trainer.totalSessionsConducted || 0,
          rating: trainer.rating || 0,
          revenue: (trainer.totalSessionsConducted || 0) * (trainer.hourlyRate || 0),
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching trainer performance:', error);
      return [];
    }
  },
};
