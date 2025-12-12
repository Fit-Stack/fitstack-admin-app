import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, X } from 'lucide-react';
import { sessionsService } from '@/services/sessions.service';
import { useAuthStore } from '@/store/authStore';

interface AddSessionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface SessionFormData {
  classId: string;
  instructorId: string;
  startDate: string;
  endDate?: string;
  recurrenceType: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceDays?: string[];
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  capacity: number;
  location?: string;
  isDropIn: boolean;
  dropInPrice?: number;
  currency: string;
}

export default function AddSessionForm({ onSuccess, onCancel }: AddSessionFormProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SessionFormData>({
    defaultValues: {
      recurrenceType: 'none',
      currency: 'INR',
      isDropIn: false,
      capacity: 20,
    },
  });

  const recurrenceType = watch('recurrenceType');
  const isDropIn = watch('isDropIn');

  const daysOfWeek = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
  ];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const onSubmit = async (data: SessionFormData) => {
    if (!user?.tenantId) {
      alert('User not authenticated');
      return;
    }

    if (recurrenceType === 'weekly' && selectedDays.length === 0) {
      alert('Please select at least one day for weekly recurrence');
      return;
    }

    try {
      setLoading(true);

      const sessionData = {
        classId: data.classId,
        instructorId: data.instructorId,
        startDate: data.startDate,
        endDate: data.endDate,
        recurrence: {
          type: data.recurrenceType,
          days: recurrenceType === 'weekly' ? selectedDays : undefined,
        },
        timeSlot: {
          startTime: data.timeSlot.startTime,
          endTime: data.timeSlot.endTime,
        },
        capacity: Number(data.capacity),
        location: data.location,
        isDropIn: data.isDropIn,
        dropInPrice: data.isDropIn ? Number(data.dropInPrice) : undefined,
        currency: data.currency,
      };

      await sessionsService.create(user.tenantId, sessionData);
      alert('Session created successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating session:', error);
      alert(error.response?.data?.message || 'Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

        <div>
          <Label htmlFor="classId">Class ID *</Label>
          <Input
            id="classId"
            {...register('classId', { required: 'Class ID is required' })}
            placeholder="Enter class ID"
          />
          {errors.classId && <p className="text-sm text-red-600 mt-1">{errors.classId.message}</p>}
          <p className="text-xs text-gray-500 mt-1">
            You can find class IDs in the Classes section
          </p>
        </div>

        <div>
          <Label htmlFor="instructorId">Instructor ID *</Label>
          <Input
            id="instructorId"
            {...register('instructorId', { required: 'Instructor ID is required' })}
            placeholder="Enter instructor ID"
          />
          {errors.instructorId && (
            <p className="text-sm text-red-600 mt-1">{errors.instructorId.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            {...register('location')}
            placeholder="e.g., Studio A, Gym Floor 2"
          />
        </div>

        <div>
          <Label htmlFor="capacity">Capacity *</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            {...register('capacity', {
              required: 'Capacity is required',
              min: { value: 1, message: 'Capacity must be at least 1' },
            })}
            placeholder="Maximum number of participants"
          />
          {errors.capacity && (
            <p className="text-sm text-red-600 mt-1">{errors.capacity.message}</p>
          )}
        </div>
      </div>

      {/* Schedule & Recurrence */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Schedule & Recurrence</h3>

        <div>
          <Label htmlFor="recurrenceType">Recurrence Type *</Label>
          <select
            id="recurrenceType"
            {...register('recurrenceType', { required: 'Recurrence type is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="none">One-time Session</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              {...register('startDate', { required: 'Start date is required' })}
            />
            {errors.startDate && (
              <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
            )}
          </div>

          {recurrenceType !== 'none' && (
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing</p>
            </div>
          )}
        </div>

        {recurrenceType === 'weekly' && (
          <div>
            <Label>Days of Week *</Label>
            <div className="flex gap-2 mt-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedDays.includes(day.value)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              type="time"
              {...register('timeSlot.startTime', { required: 'Start time is required' })}
            />
            {errors.timeSlot?.startTime && (
              <p className="text-sm text-red-600 mt-1">{errors.timeSlot.startTime.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="endTime">End Time *</Label>
            <Input
              id="endTime"
              type="time"
              {...register('timeSlot.endTime', { required: 'End time is required' })}
            />
            {errors.timeSlot?.endTime && (
              <p className="text-sm text-red-600 mt-1">{errors.timeSlot.endTime.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Drop-In Pricing */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Drop-In Pricing</h3>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isDropIn"
            {...register('isDropIn')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isDropIn" className="cursor-pointer">
            Allow Drop-In (Pay per session)
          </Label>
        </div>

        {isDropIn && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dropInPrice">Drop-In Price *</Label>
              <Input
                id="dropInPrice"
                type="number"
                min="0"
                step="0.01"
                {...register('dropInPrice', {
                  required: isDropIn ? 'Drop-in price is required' : false,
                })}
                placeholder="0.00"
              />
              {errors.dropInPrice && (
                <p className="text-sm text-red-600 mt-1">{errors.dropInPrice.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">Currency *</Label>
              <select
                id="currency"
                {...register('currency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Session'
          )}
        </Button>
      </div>
    </form>
  );
}
