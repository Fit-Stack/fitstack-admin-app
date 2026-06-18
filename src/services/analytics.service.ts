import apiClient from '@/lib/axios';

/**
 * Real-time admin dashboard analytics.
 *
 * All values come from a single backend endpoint
 *   GET /tenants/:tenantId/analytics/dashboard
 * which computes everything from the tenant's own schema. No mock data.
 */

export interface DashboardResponse {
  generatedAt: string;
  currency: string;
  cards: {
    totalMembers: { value: number; newThisMonth: number; growthPct: number };
    activeSessions: { value: number; today: number };
    monthlyRevenue: {
      value: number;
      lastMonth: number;
      growthPct: number | null;
    };
    avgAttendance: { value: number; changePts: number | null };
    activeTrainers: { value: number; newThisMonth: number };
    avgSessionTime: { value: number };
    memberRetention: { value: number | null };
    dailyActiveUsers: { value: number; pctOfTotal: number };
  };
  charts: {
    revenue: Array<{ date: string; revenue: number }>;
    memberGrowth: Array<{
      month: string;
      members: number;
      newMembers: number;
    }>;
    sessionAttendance: Array<{
      day: string;
      morning: number;
      afternoon: number;
      evening: number;
    }>;
    categoryDistribution: Array<{ name: string; value: number }>;
  };
  trainers: Array<{
    name: string;
    sessions: number;
    rating: number;
    revenue: number;
  }>;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency + ' ';
}

export function formatCurrency(value: number, currency: string): string {
  return `${currencySymbol(currency)}${(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

export const analyticsService = {
  async getDashboard(tenantId: string): Promise<DashboardResponse> {
    const { data } = await apiClient.get<DashboardResponse>(
      `/tenants/${tenantId}/analytics/dashboard`,
    );
    return data;
  },
};
