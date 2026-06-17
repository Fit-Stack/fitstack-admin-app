import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import {
  membershipService,
  MembershipPlan,
  BillingCycle,
  BILLING_CYCLE_DAYS,
  BILLING_CYCLE_LABELS,
} from '@/services/membership.service';

interface Props {
  tenantId: string;
  plan?: MembershipPlan | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
const CYCLES: BillingCycle[] = [
  'monthly',
  'quarterly',
  'half_yearly',
  'yearly',
  'custom',
];

export default function MembershipPlanForm({
  tenantId,
  plan,
  onSuccess,
  onCancel,
}: Props) {
  const toast = useToast();
  const isEdit = !!plan;

  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [price, setPrice] = useState<string>(
    plan ? String(plan.price) : '',
  );
  const [currency, setCurrency] = useState(plan?.currency ?? 'INR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    plan?.billingCycle ?? 'monthly',
  );
  const [durationDays, setDurationDays] = useState<string>(
    plan ? String(plan.durationDays) : String(BILLING_CYCLE_DAYS.monthly),
  );
  const [features, setFeatures] = useState<string[]>(plan?.features ?? []);
  const [featureInput, setFeatureInput] = useState('');
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    if (cycle !== 'custom') {
      setDurationDays(String(BILLING_CYCLE_DAYS[cycle]));
    }
  };

  const addFeature = () => {
    const v = featureInput.trim();
    if (v && !features.includes(v)) {
      setFeatures([...features, v]);
    }
    setFeatureInput('');
  };

  const removeFeature = (f: string) =>
    setFeatures(features.filter((x) => x !== f));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Plan name is required');
    if (!price || Number(price) < 0) return toast.error('Enter a valid price');
    if (!durationDays || Number(durationDays) < 1)
      return toast.error('Duration must be at least 1 day');

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      currency,
      durationDays: Number(durationDays),
      billingCycle,
      features,
      isActive,
    };

    try {
      setSubmitting(true);
      if (isEdit && plan) {
        await membershipService.updatePlan(tenantId, plan.id, payload);
        toast.success('Plan updated');
      } else {
        await membershipService.createPlan(tenantId, payload);
        toast.success('Plan created');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(
        'Failed to save plan',
        err?.response?.data?.message || err?.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label className="mb-2 block">Plan Name *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Monthly Membership"
        />
      </div>

      <div>
        <Label className="mb-2 block">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What the member gets with this plan"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block">Price *</Label>
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="1500"
          />
        </div>
        <div>
          <Label className="mb-2 block">Currency</Label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block">Billing Cycle</Label>
          <select
            value={billingCycle}
            onChange={(e) => handleCycleChange(e.target.value as BillingCycle)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {CYCLES.map((c) => (
              <option key={c} value={c}>
                {BILLING_CYCLE_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="mb-2 block">Duration (days) *</Label>
          <Input
            type="number"
            min={1}
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            disabled={billingCycle !== 'custom'}
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Features / Perks</Label>
        <div className="flex gap-2">
          <Input
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFeature();
              }
            }}
            placeholder="e.g. Gym access"
          />
          <Button type="button" variant="outline" onClick={addFeature}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {features.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {f}
                <button
                  type="button"
                  onClick={() => removeFeature(f)}
                  className="hover:text-primary/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="text-sm text-gray-700">
          Active (visible to members)
        </span>
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
