import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Loader2, Plus, X } from 'lucide-react';
import { classesService } from '@/services/classes.service';
import { trainersService, Trainer } from '@/services/trainers.service';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/authStore';

interface AddClassFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ClassFormData {
  title: string;
  description: string;
  instructorId: string;
  startDate: string;
  endDate: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  capacity: number;
  pricingType: 'membership' | 'course_fee' | 'subscription';
  price?: number;
  currency: string;
  days: string[];
  timeSlots: Array<{ startTime: string; endTime: string }>;
}

export default function AddClassForm({ onSuccess, onCancel }: AddClassFormProps) {
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<Array<{ startTime: string; endTime: string }>>([
    { startTime: '', endTime: '' },
  ]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<string>('');
  const [createdClass, setCreatedClass] = useState<any>(null);
  const [publishLoading, setPublishLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ClassFormData>({
    defaultValues: {
      currency: 'INR',
      capacity: 20,
      pricingType: 'membership',
      level: 'beginner',
    },
  });

  const pricingType = watch('pricingType');

  useEffect(() => {
    if (user?.tenantId) {
      fetchTrainers();
    }
  }, [user?.tenantId]);

  const fetchTrainers = async () => {
    if (!user?.tenantId) return;
    try {
      setLoadingTrainers(true);
      const response = await trainersService.getAll(user.tenantId);
      setTrainers(response.trainers || response.data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    } finally {
      setLoadingTrainers(false);
    }
  };

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

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { startTime: '', endTime: '' }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...timeSlots];
    updated[index][field] = value;
    setTimeSlots(updated);
  };

  const onSubmit = async (data: ClassFormData) => {
    if (!user?.tenantId) {
      error('Authentication Error', 'User not authenticated');
      return;
    }

    if (selectedDays.length === 0) {
      error('Validation Error', 'Please select at least one day');
      return;
    }

    if (timeSlots.some((slot) => !slot.startTime || !slot.endTime)) {
      error('Validation Error', 'Please fill in all time slots');
      return;
    }

    try {
      setLoading(true);

      const classData = {
        title: data.title,
        description: data.description,
        instructorId: selectedTrainer,
        startDate: data.startDate,
        endDate: data.endDate,
        schedule: {
          days: selectedDays,
          timeSlots: timeSlots,
        },
        capacity: Number(data.capacity),
        pricingType: data.pricingType,
        price: data.pricingType !== 'membership' ? Number(data.price) : undefined,
        currency: data.currency,
        category: data.category,
        level: data.level,
      };

      const newClass = await classesService.create(user.tenantId, classData);
      setCreatedClass(newClass);
      success('Success', 'Class created successfully! Would you like to publish it now?');
    } catch (err: any) {
      console.error('Error creating class:', err);
      error('Error', err.response?.data?.message || 'Failed to create class. Please try again.');
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
          <Label htmlFor="title">Class Title *</Label>
          <Input
            id="title"
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g., HIIT Training, Yoga Flow"
          />
          {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <textarea
            id="description"
            {...register('description', { required: 'Description is required' })}
            placeholder="Describe your class..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
          />
          {errors.description && (
            <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              {...register('category', { required: 'Category is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select category</option>
              <option value="cardio">Cardio</option>
              <option value="strength">Strength</option>
              <option value="yoga">Yoga</option>
              <option value="pilates">Pilates</option>
              <option value="hiit">HIIT</option>
              <option value="dance">Dance</option>
              <option value="martial_arts">Martial Arts</option>
              <option value="other">Other</option>
            </select>
            {errors.category && (
              <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="level">Difficulty Level *</Label>
            <select
              id="level"
              {...register('level', { required: 'Level is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="instructor">Instructor *</Label>
          <SearchableSelect
            options={trainers.map((trainer) => ({
              value: trainer.id,
              label: `${trainer.user?.firstName || ''} ${trainer.user?.lastName || ''}`.trim(),
              subtitle: trainer.specializations.slice(0, 2).join(', '),
            }))}
            value={selectedTrainer}
            onChange={setSelectedTrainer}
            placeholder={loadingTrainers ? 'Loading trainers...' : 'Select a trainer'}
            disabled={loadingTrainers}
          />
          {!selectedTrainer && (
            <p className="text-sm text-red-600 mt-1">Instructor is required</p>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>

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

          <div>
            <Label htmlFor="endDate">End Date *</Label>
            <Input
              id="endDate"
              type="date"
              {...register('endDate', { required: 'End date is required' })}
            />
            {errors.endDate && (
              <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
            )}
          </div>
        </div>

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

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Time Slots *</Label>
            <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
              <Plus className="h-4 w-4 mr-1" />
              Add Slot
            </Button>
          </div>
          <div className="space-y-2">
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                  placeholder="Start time"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                  placeholder="End time"
                />
                {timeSlots.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTimeSlot(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing & Capacity */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Pricing & Capacity</h3>

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

        <div>
          <Label htmlFor="pricingType">Pricing Type *</Label>
          <select
            id="pricingType"
            {...register('pricingType', { required: 'Pricing type is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="membership">Included in Membership</option>
            <option value="course_fee">One-time Course Fee</option>
            <option value="subscription">Subscription</option>
          </select>
        </div>

        {pricingType !== 'membership' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                {...register('price', {
                  required: 'Price is required',
                })}
                placeholder="0.00"
              />
              {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>}
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
        {!createdClass ? (
          <>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedTrainer} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Class'
              )}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreatedClass(null);
                onSuccess();
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }}
              className="flex-1"
            >
              Done
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  setPublishLoading(true);
                  await classesService.publish(user?.tenantId!, createdClass.id);
                  success('Success', 'Class published successfully!');
                  onSuccess();
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                } catch (err: any) {
                  console.error('Error publishing class:', err);
                  error('Error', err.response?.data?.message || 'Failed to publish class.');
                } finally {
                  setPublishLoading(false);
                }
              }}
              disabled={publishLoading}
              className="flex-1"
            >
              {publishLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Class'
              )}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
