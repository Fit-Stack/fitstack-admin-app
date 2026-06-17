import apiClient from '@/lib/axios';

export type BillingCycle =
  | 'monthly'
  | 'quarterly'
  | 'half_yearly'
  | 'yearly'
  | 'custom';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'frozen';

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'upi'
  | 'bank_transfer'
  | 'other';

export interface MembershipPlan {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number | string;
  currency: string;
  durationDays: number;
  billingCycle: BillingCycle;
  features?: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanInput {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  durationDays: number;
  billingCycle?: BillingCycle;
  features?: string[];
  isActive?: boolean;
  displayOrder?: number;
}

export interface MemberSubscription {
  id: string;
  tenantId: string;
  userId: string;
  planId: string | null;
  planName: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  amountPaid?: number | string | null;
  currency: string;
  paymentMethod?: PaymentMethod | null;
  paymentReference?: string | null;
  notes?: string | null;
  recordedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberStatus {
  current: MemberSubscription | null;
  isActive: boolean;
  daysRemaining: number;
  history: MemberSubscription[];
}

export interface AssignMembershipInput {
  userId: string;
  planId: string;
  startDate?: string;
  amountPaid?: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  notes?: string;
}

export interface RenewMembershipInput {
  planId?: string;
  amountPaid?: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  notes?: string;
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  userId?: string;
  planId?: string;
  activeOnly?: boolean;
}

const base = (tenantId: string) => `/tenants/${tenantId}/membership`;

export const membershipService = {
  // ---- Plans ----
  async getPlans(
    tenantId: string,
    includeInactive = false,
  ): Promise<MembershipPlan[]> {
    const { data } = await apiClient.get(`${base(tenantId)}/plans`, {
      params: includeInactive ? { includeInactive: 'true' } : undefined,
    });
    return data;
  },

  async createPlan(
    tenantId: string,
    input: CreatePlanInput,
  ): Promise<MembershipPlan> {
    const { data } = await apiClient.post(`${base(tenantId)}/plans`, input);
    return data;
  },

  async updatePlan(
    tenantId: string,
    planId: string,
    input: Partial<CreatePlanInput>,
  ): Promise<MembershipPlan> {
    const { data } = await apiClient.patch(
      `${base(tenantId)}/plans/${planId}`,
      input,
    );
    return data;
  },

  async deletePlan(tenantId: string, planId: string): Promise<void> {
    await apiClient.delete(`${base(tenantId)}/plans/${planId}`);
  },

  // ---- Subscriptions ----
  async getSubscriptions(
    tenantId: string,
    filters?: SubscriptionFilters,
  ): Promise<MemberSubscription[]> {
    const { data } = await apiClient.get(`${base(tenantId)}/subscriptions`, {
      params: {
        ...filters,
        activeOnly: filters?.activeOnly ? 'true' : undefined,
      },
    });
    return data;
  },

  async getMemberStatus(
    tenantId: string,
    userId: string,
  ): Promise<MemberStatus> {
    const { data } = await apiClient.get(
      `${base(tenantId)}/subscriptions/user/${userId}`,
    );
    return data;
  },

  async assign(
    tenantId: string,
    input: AssignMembershipInput,
  ): Promise<MemberSubscription> {
    const { data } = await apiClient.post(
      `${base(tenantId)}/subscriptions`,
      input,
    );
    return data;
  },

  async update(
    tenantId: string,
    subscriptionId: string,
    input: { status?: SubscriptionStatus; endDate?: string; notes?: string },
  ): Promise<MemberSubscription> {
    const { data } = await apiClient.patch(
      `${base(tenantId)}/subscriptions/${subscriptionId}`,
      input,
    );
    return data;
  },

  async renew(
    tenantId: string,
    subscriptionId: string,
    input: RenewMembershipInput,
  ): Promise<MemberSubscription> {
    const { data } = await apiClient.post(
      `${base(tenantId)}/subscriptions/${subscriptionId}/renew`,
      input,
    );
    return data;
  },
};

// ---- helpers ----

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function formatMoney(
  amount: number | string | null | undefined,
  currency = 'INR',
): string {
  const value = amount != null ? Number(amount) : 0;
  return `${CURRENCY_SYMBOLS[currency] || currency} ${value.toFixed(0)}`;
}

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  half_yearly: 'Half-Yearly',
  yearly: 'Annual',
  custom: 'Custom',
};

export const BILLING_CYCLE_DAYS: Record<BillingCycle, number> = {
  monthly: 30,
  quarterly: 90,
  half_yearly: 180,
  yearly: 365,
  custom: 0,
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
};

/**
 * Effective status of a subscription computed client-side (the list endpoint
 * returns the raw row; entity getters are not serialized over the wire).
 */
export function computeSubscriptionState(sub: MemberSubscription): {
  isActive: boolean;
  daysRemaining: number;
} {
  const today = new Date(new Date().toDateString()).getTime();
  const end = new Date(sub.endDate).getTime();
  const daysRemaining = Math.max(
    0,
    Math.ceil((end - today) / (1000 * 60 * 60 * 24)),
  );
  const isActive = sub.status === 'active' && end >= today;
  return { isActive, daysRemaining };
}
