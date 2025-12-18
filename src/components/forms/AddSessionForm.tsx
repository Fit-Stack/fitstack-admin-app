import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { sessionsService } from '@/services/sessions.service';
import { trainersService, Trainer } from '@/services/trainers.service';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/authStore';

interface AddSessionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface SessionFormData {
  title: string;
  description?: string;
  instructorId?: string;
  recurrencePattern: {
    type: 'none' | 'daily' | 'weekly' | 'monthly';
    days?: string[];
    time: string;
    durationMinutes: number;
    startDate: string;
    endDate: string;
  };
  capacity?: number;
  isPaid: boolean;
  pricePerAttendance?: number;
  currency?: string;
  category?: string;
}

export default function AddSessionForm({ onSuccess, onCancel }: AddSessionFormProps) {
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SessionFormData>({
    defaultValues: {
      recurrencePattern: {
        type: 'none',
        time: '17:00',
        durationMinutes: 60,
      },
      isPaid: false,
      currency: 'INR',
      capacity: 20,
    },
  });

  const recurrenceType = watch('recurrencePattern.type');
  const isPaid = watch('isPaid');

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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        error('Invalid File', 'Please select an image file');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        error('File Too Large', 'Banner image must be less than 5MB');
        return;
      }
      setBannerFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
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

  const onSubmit = async (data: SessionFormData) => {
    if (!user?.tenantId) {
      error('Authentication Error', 'User not authenticated');
      return;
    }

    if (recurrenceType === 'weekly' && selectedDays.length === 0) {
      error('Validation Error', 'Please select at least one day for weekly recurrence');
      return;
    }

    try {
      setLoading(true);

      const sessionData = {
        title: data.title,
        description: data.description,
        instructorId: selectedTrainer || undefined,
        recurrencePattern: {
          type: data.recurrencePattern.type === 'none' ? 'daily' : data.recurrencePattern.type,
          days: recurrenceType === 'weekly' ? selectedDays : undefined,
          time: data.recurrencePattern.time,
          durationMinutes: data.recurrencePattern.durationMinutes,
          startDate: data.recurrencePattern.startDate,
          endDate: data.recurrencePattern.endDate,
        },
        capacity: data.capacity ? Number(data.capacity) : undefined,
        isPaid: data.isPaid,
        pricePerAttendance: data.isPaid ? Number(data.pricePerAttendance) : undefined,
        currency: data.currency,
        category: data.category,
      };

      await sessionsService.create(user.tenantId, sessionData, bannerFile);
      success('Success', 'Session created successfully!');
      onSuccess();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Error creating session:', err);
      error('Error', err.response?.data?.message || 'Failed to create session. Please try again.');
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
          <Label htmlFor="title">Session Title *</Label>
          <Input
            id="title"
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g., Morning Yoga, HIIT Training"
          />
          {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="Describe your session..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="instructor">Instructor</Label>
          <SearchableSelect
            options={trainers.map((trainer) => ({
              value: trainer.id,
              label: `${trainer.user?.firstName || ''} ${trainer.user?.lastName || ''}`.trim(),
              subtitle: trainer.specializations.slice(0, 2).join(', '),
            }))}
            value={selectedTrainer}
            onChange={setSelectedTrainer}
            placeholder={loadingTrainers ? 'Loading trainers...' : 'Select a trainer (optional)'}
            disabled={loadingTrainers}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            {...register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select category</option>
            <option value="yoga">Yoga</option>
            <option value="hiit">HIIT</option>
            <option value="strength">Strength Training</option>
            <option value="cardio">Cardio</option>
            <option value="dance">Dance</option>
            <option value="pilates">Pilates</option>
            <option value="crossfit">CrossFit</option>
            <option value="boxing">Boxing</option>
            <option value="swimming">Swimming</option>
            <option value="cycling">Cycling</option>
            <option value="meditation">Meditation</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            {...register('capacity', {
              min: { value: 1, message: 'Capacity must be at least 1' },
            })}
            placeholder="Maximum number of participants"
          />
          {errors.capacity && (
            <p className="text-sm text-red-600 mt-1">{errors.capacity.message}</p>
          )}
        </div>

        {/* Banner Upload */}
        <div>
          <Label htmlFor="banner">Session Banner (Optional)</Label>
          <div className="mt-2">
            {!bannerPreview ? (
              <label
                htmlFor="banner"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                </div>
                <input
                  id="banner"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleBannerChange}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeBanner}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {bannerFile?.name}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule & Recurrence */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Schedule & Recurrence</h3>

        <div>
          <Label htmlFor="recurrenceType">Recurrence Type *</Label>
          <select
            id="recurrenceType"
            {...register('recurrencePattern.type', { required: 'Recurrence type is required' })}
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
              {...register('recurrencePattern.startDate', { required: 'Start date is required' })}
            />
            {errors.recurrencePattern?.startDate && (
              <p className="text-sm text-red-600 mt-1">{errors.recurrencePattern.startDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="endDate">End Date *</Label>
            <Input 
              id="endDate" 
              type="date" 
              {...register('recurrencePattern.endDate', { required: 'End date is required' })} 
            />
            {errors.recurrencePattern?.endDate && (
              <p className="text-sm text-red-600 mt-1">{errors.recurrencePattern.endDate.message}</p>
            )}
          </div>
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
            <Label htmlFor="time">Start Time *</Label>
            <Input
              id="time"
              type="time"
              {...register('recurrencePattern.time', { required: 'Start time is required' })}
            />
            {errors.recurrencePattern?.time && (
              <p className="text-sm text-red-600 mt-1">{errors.recurrencePattern.time.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="durationMinutes">Duration (minutes) *</Label>
            <Input
              id="durationMinutes"
              type="number"
              min="15"
              max="240"
              step="15"
              {...register('recurrencePattern.durationMinutes', { 
                required: 'Duration is required',
                min: { value: 15, message: 'Duration must be at least 15 minutes' },
                max: { value: 240, message: 'Duration cannot exceed 4 hours' }
              })}
              placeholder="60"
            />
            {errors.recurrencePattern?.durationMinutes && (
              <p className="text-sm text-red-600 mt-1">{errors.recurrencePattern.durationMinutes.message}</p>
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
            id="isPaid"
            {...register('isPaid')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isPaid" className="cursor-pointer">
            Require Payment for Session
          </Label>
        </div>

        {isPaid && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pricePerAttendance">Price per Attendance *</Label>
              <Input
                id="pricePerAttendance"
                type="number"
                min="0"
                step="0.01"
                {...register('pricePerAttendance', {
                  required: isPaid ? 'Drop-in price is required' : false,
                })}
                placeholder="0.00"
              />
              {errors.pricePerAttendance && (
                <p className="text-sm text-red-600 mt-1">{errors.pricePerAttendance.message}</p>
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
