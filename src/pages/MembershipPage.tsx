import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Plus,
  CreditCard,
  Users,
  CalendarClock,
  IndianRupee,
  Pencil,
  Trash2,
  RefreshCw,
  Snowflake,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/contexts/ToastContext';
import {
  membershipService,
  MembershipPlan,
  MemberSubscription,
  SubscriptionStatus,
  BILLING_CYCLE_LABELS,
  PAYMENT_METHOD_LABELS,
  formatMoney,
  computeSubscriptionState,
} from '@/services/membership.service';
import { usersService } from '@/services/users.service';
import MembershipPlanForm from '@/components/forms/MembershipPlanForm';
import AssignMembershipForm from '@/components/forms/AssignMembershipForm';

type Tab = 'plans' | 'members';

const STATUS_BADGE: Record<
  SubscriptionStatus,
  { label: string; variant: 'success' | 'secondary' | 'destructive' | 'warning' }
> = {
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Expired', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  frozen: { label: 'Frozen', variant: 'warning' },
};

export default function MembershipPage() {
  const { user } = useAuthStore();
  const toast = useToast();
  const tenantId = user?.tenantId;

  const [tab, setTab] = useState<Tab>('plans');
  const [loading, setLoading] = useState(true);

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [showInactivePlans, setShowInactivePlans] = useState(false);

  const [subscriptions, setSubscriptions] = useState<MemberSubscription[]>([]);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('');
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  // Sheets
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState<MemberSubscription | null>(
    null,
  );

  const activePlans = useMemo(() => plans.filter((p) => p.isActive), [plans]);

  const fetchPlans = useCallback(async () => {
    if (!tenantId) return;
    const data = await membershipService.getPlans(tenantId, true);
    setPlans(data);
  }, [tenantId]);

  const fetchSubscriptions = useCallback(async () => {
    if (!tenantId) return;
    const data = await membershipService.getSubscriptions(
      tenantId,
      statusFilter ? { status: statusFilter } : undefined,
    );
    setSubscriptions(data);
  }, [tenantId, statusFilter]);

  const fetchMemberNames = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await usersService.getAll(tenantId, { limit: 200 });
      const map: Record<string, string> = {};
      (res.users || []).forEach((u) => {
        map[u.id] =
          [u.firstName, u.lastName].filter(Boolean).join(' ') ||
          u.fullName ||
          u.email;
      });
      setMemberNames(map);
    } catch {
      /* names are best-effort */
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchPlans(),
          fetchSubscriptions(),
          fetchMemberNames(),
        ]);
      } catch {
        toast.error('Failed to load membership data');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) fetchSubscriptions().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // ---- derived stats ----
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let activeMembers = 0;
    let expiringSoon = 0;
    let revenueThisMonth = 0;
    let currency = 'INR';

    subscriptions.forEach((s) => {
      const { isActive, daysRemaining } = computeSubscriptionState(s);
      if (isActive) {
        activeMembers++;
        if (daysRemaining <= 7) expiringSoon++;
      }
      if (new Date(s.createdAt) >= monthStart && s.amountPaid != null) {
        revenueThisMonth += Number(s.amountPaid);
        currency = s.currency || currency;
      }
    });
    return { activeMembers, expiringSoon, revenueThisMonth, currency };
  }, [subscriptions]);

  const visiblePlans = showInactivePlans ? plans : activePlans;

  // ---- actions ----
  const onPlanSaved = () => {
    setPlanSheetOpen(false);
    setEditingPlan(null);
    fetchPlans();
  };

  const onMembershipSaved = () => {
    setAssignSheetOpen(false);
    setRenewTarget(null);
    fetchSubscriptions();
  };

  const handleDeletePlan = async (plan: MembershipPlan) => {
    if (!tenantId) return;
    if (
      !window.confirm(
        `Deactivate "${plan.name}"? Existing memberships keep their history.`,
      )
    )
      return;
    try {
      await membershipService.deletePlan(tenantId, plan.id);
      toast.success('Plan deactivated');
      fetchPlans();
    } catch (e: any) {
      toast.error('Failed to deactivate', e?.response?.data?.message);
    }
  };

  const changeStatus = async (
    sub: MemberSubscription,
    status: SubscriptionStatus,
    confirmMsg?: string,
  ) => {
    if (!tenantId) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    try {
      await membershipService.update(tenantId, sub.id, { status });
      toast.success(`Membership ${STATUS_BADGE[status].label.toLowerCase()}`);
      fetchSubscriptions();
    } catch (e: any) {
      toast.error('Failed to update', e?.response?.data?.message);
    }
  };

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-600">
          No tenant context found for your account.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Membership</h1>
          <p className="text-gray-600 mt-1">
            Manage plans and member subscriptions (payments recorded manually)
          </p>
        </div>
        {tab === 'plans' ? (
          <Button
            onClick={() => {
              setEditingPlan(null);
              setPlanSheetOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        ) : (
          <Button
            onClick={() => {
              setRenewTarget(null);
              setAssignSheetOpen(true);
            }}
            disabled={activePlans.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Membership
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<CreditCard className="h-5 w-5 text-indigo-600" />}
          label="Active Plans"
          value={activePlans.length}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-emerald-600" />}
          label="Active Members"
          value={stats.activeMembers}
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5 text-orange-600" />}
          label="Expiring ≤ 7 days"
          value={stats.expiringSoon}
        />
        <StatCard
          icon={<IndianRupee className="h-5 w-5 text-green-600" />}
          label="Revenue (this month)"
          value={formatMoney(stats.revenueThisMonth, stats.currency)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['plans', 'members'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'plans' ? 'Plans' : 'Members'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {/* PLANS TAB */}
      {!loading && tab === 'plans' && (
        <>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={showInactivePlans}
              onChange={(e) => setShowInactivePlans(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Show inactive plans
          </label>

          {visiblePlans.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <EmptyState
                  icon={CreditCard}
                  title="No membership plans yet"
                  description="Create your first plan so members can be enrolled."
                  actionLabel="Add Plan"
                  onAction={() => {
                    setEditingPlan(null);
                    setPlanSheetOpen(true);
                  }}
                  actionIcon={Plus}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`hover:shadow-lg transition-shadow ${
                    !plan.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {BILLING_CYCLE_LABELS[plan.billingCycle]} ·{' '}
                          {plan.durationDays} days
                        </p>
                      </div>
                      {!plan.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatMoney(plan.price, plan.currency)}
                    </p>
                    {plan.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                    {plan.features && plan.features.length > 0 && (
                      <ul className="space-y-1">
                        {plan.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditingPlan(plan);
                          setPlanSheetOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {plan.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlan(plan)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* MEMBERS TAB */}
      {!loading && tab === 'members' && (
        <>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as SubscriptionStatus | '')
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="frozen">Frozen</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <EmptyState
                  icon={Users}
                  title="No memberships yet"
                  description="Assign a membership to a member after collecting payment."
                  actionLabel={
                    activePlans.length ? 'Assign Membership' : undefined
                  }
                  onAction={
                    activePlans.length
                      ? () => {
                          setRenewTarget(null);
                          setAssignSheetOpen(true);
                        }
                      : undefined
                  }
                  actionIcon={Plus}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Member</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Period</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Paid</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => {
                      const { isActive, daysRemaining } =
                        computeSubscriptionState(sub);
                      const badge = STATUS_BADGE[sub.status];
                      return (
                        <tr
                          key={sub.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {memberNames[sub.userId] || 'Member'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {sub.userId.slice(0, 8)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {sub.planName}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            <div>
                              {sub.startDate} → {sub.endDate}
                            </div>
                            {isActive && (
                              <div className="text-xs text-emerald-600">
                                {daysRemaining} days left
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {sub.amountPaid != null
                              ? formatMoney(sub.amountPaid, sub.currency)
                              : '—'}
                            {sub.paymentMethod && (
                              <div className="text-xs text-gray-400">
                                {PAYMENT_METHOD_LABELS[sub.paymentMethod]}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Renew"
                                onClick={() => {
                                  setRenewTarget(sub);
                                  setAssignSheetOpen(true);
                                }}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              {sub.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Freeze"
                                  onClick={() =>
                                    changeStatus(sub, 'frozen')
                                  }
                                >
                                  <Snowflake className="h-4 w-4 text-blue-500" />
                                </Button>
                              )}
                              {sub.status === 'frozen' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Reactivate"
                                  onClick={() =>
                                    changeStatus(sub, 'active')
                                  }
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </Button>
                              )}
                              {sub.status !== 'cancelled' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Cancel"
                                  onClick={() =>
                                    changeStatus(
                                      sub,
                                      'cancelled',
                                      'Cancel this membership? This cannot be undone.',
                                    )
                                  }
                                >
                                  <Ban className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Plan Sheet */}
      <Sheet open={planSheetOpen} onOpenChange={setPlanSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingPlan ? 'Edit Plan' : 'Add Membership Plan'}
            </SheetTitle>
            <SheetDescription>
              Define pricing and duration for this membership.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <MembershipPlanForm
              tenantId={tenantId}
              plan={editingPlan}
              onSuccess={onPlanSaved}
              onCancel={() => setPlanSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Assign / Renew Sheet */}
      <Sheet open={assignSheetOpen} onOpenChange={setAssignSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {renewTarget ? 'Renew Membership' : 'Assign Membership'}
            </SheetTitle>
            <SheetDescription>
              Record the offline payment and activate the membership.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AssignMembershipForm
              tenantId={tenantId}
              plans={activePlans}
              mode={renewTarget ? 'renew' : 'assign'}
              subscription={renewTarget}
              onSuccess={onMembershipSaved}
              onCancel={() => setAssignSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100">{icon}</div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
