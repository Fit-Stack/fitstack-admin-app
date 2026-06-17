import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/contexts/ToastContext';
import {
  membershipService,
  MembershipPlan,
  MemberSubscription,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
  BILLING_CYCLE_LABELS,
  formatMoney,
} from '@/services/membership.service';
import { usersService } from '@/services/users.service';

interface Props {
  tenantId: string;
  plans: MembershipPlan[];
  mode: 'assign' | 'renew';
  subscription?: MemberSubscription | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'card',
  'upi',
  'bank_transfer',
  'other',
];

export default function AssignMembershipForm({
  tenantId,
  plans,
  mode,
  subscription,
  onSuccess,
  onCancel,
}: Props) {
  const toast = useToast();
  const isRenew = mode === 'renew';

  const [members, setMembers] = useState<
    { value: string; label: string; subtitle?: string }[]
  >([]);
  const [userId, setUserId] = useState(subscription?.userId ?? '');
  const [planId, setPlanId] = useState(
    subscription?.planId ?? plans[0]?.id ?? '',
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === planId),
    [plans, planId],
  );

  // Load members for the assign flow
  useEffect(() => {
    if (isRenew) return;
    (async () => {
      try {
        const res = await usersService.getAll(tenantId, { limit: 200 });
        setMembers(
          (res.users || []).map((u) => ({
            value: u.id,
            label:
              [u.firstName, u.lastName].filter(Boolean).join(' ') ||
              u.fullName ||
              u.email,
            subtitle: u.email,
          })),
        );
      } catch {
        toast.error('Failed to load members');
      }
    })();
  }, [tenantId, isRenew]);

  // Default the collected amount to the selected plan's price
  useEffect(() => {
    if (selectedPlan) setAmountPaid(String(Number(selectedPlan.price)));
  }, [selectedPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRenew && !userId) return toast.error('Select a member');
    if (!planId) return toast.error('Select a plan');

    try {
      setSubmitting(true);
      if (isRenew && subscription) {
        await membershipService.renew(tenantId, subscription.id, {
          planId,
          amountPaid: amountPaid ? Number(amountPaid) : undefined,
          paymentMethod,
          paymentReference: paymentReference.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success('Membership renewed');
      } else {
        await membershipService.assign(tenantId, {
          userId,
          planId,
          startDate,
          amountPaid: amountPaid ? Number(amountPaid) : undefined,
          paymentMethod,
          paymentReference: paymentReference.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success('Membership assigned');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(
        'Failed to save membership',
        err?.response?.data?.message || err?.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isRenew ? (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
          <p className="text-gray-500">Renewing membership for</p>
          <p className="font-medium text-gray-900">
            {subscription?.planName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Current period ends {subscription?.endDate}. The new period
            continues from there.
          </p>
        </div>
      ) : (
        <div>
          <Label className="mb-2 block">Member *</Label>
          <SearchableSelect
            options={members}
            value={userId}
            onChange={setUserId}
            placeholder="Select a member"
          />
        </div>
      )}

      <div>
        <Label className="mb-2 block">Plan *</Label>
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          {plans.length === 0 && <option value="">No active plans</option>}
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {formatMoney(p.price, p.currency)} (
              {BILLING_CYCLE_LABELS[p.billingCycle]}, {p.durationDays}d)
            </option>
          ))}
        </select>
      </div>

      {!isRenew && (
        <div>
          <Label className="mb-2 block">Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      )}

      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Payment (recorded manually)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Amount Collected</Label>
            <Input
              type="number"
              min={0}
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-2 block">Method</Label>
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Label className="mb-2 block">Receipt / Reference No.</Label>
          <Input
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="e.g. RCPT-00123"
          />
        </div>
        <div className="mt-4">
          <Label className="mb-2 block">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional internal notes"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting
            ? 'Saving...'
            : isRenew
              ? 'Renew Membership'
              : 'Assign Membership'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
