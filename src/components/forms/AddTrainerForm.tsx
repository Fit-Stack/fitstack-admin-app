import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, X, Check } from 'lucide-react';
import { 
  trainersService, 
  TrainerSpecialization, 
  TrainerExperienceLevel,
  TrainerAvailabilityStatus,
  CreateTrainerDto 
} from '@/services/trainers.service';
import { usersService, User } from '@/services/users.service';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/authStore';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface AddTrainerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface TrainerFormData {
  bio: string;
  experienceLevel: TrainerExperienceLevel;
  yearsOfExperience: number;
  offersDemoSession: boolean;
  demoSessionDurationMinutes?: number;
  hourlyRate?: number;
  availabilityStatus: TrainerAvailabilityStatus;
}

// Human readable labels for specializations
const SPECIALIZATION_LABELS: Record<TrainerSpecialization, string> = {
  [TrainerSpecialization.STRENGTH_TRAINING]: 'Strength Training',
  [TrainerSpecialization.CARDIO]: 'Cardio',
  [TrainerSpecialization.YOGA]: 'Yoga',
  [TrainerSpecialization.PILATES]: 'Pilates',
  [TrainerSpecialization.CROSSFIT]: 'CrossFit',
  [TrainerSpecialization.BODYBUILDING]: 'Bodybuilding',
  [TrainerSpecialization.WEIGHT_LOSS]: 'Weight Loss',
  [TrainerSpecialization.NUTRITION]: 'Nutrition',
  [TrainerSpecialization.SPORTS_SPECIFIC]: 'Sports Specific',
  [TrainerSpecialization.REHABILITATION]: 'Rehabilitation',
  [TrainerSpecialization.FUNCTIONAL_TRAINING]: 'Functional Training',
  [TrainerSpecialization.HIIT]: 'HIIT',
  [TrainerSpecialization.MARTIAL_ARTS]: 'Martial Arts',
  [TrainerSpecialization.DANCE_FITNESS]: 'Dance Fitness',
  [TrainerSpecialization.SENIOR_FITNESS]: 'Senior Fitness',
  [TrainerSpecialization.PRENATAL_POSTNATAL]: 'Prenatal/Postnatal',
};

export default function AddTrainerForm({ onSuccess, onCancel }: AddTrainerFormProps) {
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [specializations, setSpecializations] = useState<TrainerSpecialization[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certificationInput, setCertificationInput] = useState('');
  const [weeklyAvailability, setWeeklyAvailability] = useState<Record<string, string[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });
  
  // User selection state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Fetch users on component mount
  useEffect(() => {
    if (user?.tenantId) {
      fetchUsers();
    }
  }, [user?.tenantId]);

  const fetchUsers = useCallback(async () => {
    if (!user?.tenantId) return;
    try {
      setLoadingUsers(true);
      const response = await usersService.getAll(user.tenantId, { limit: 100 });
      setUsers(response.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [user?.tenantId]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TrainerFormData>({
    defaultValues: {
      experienceLevel: TrainerExperienceLevel.INTERMEDIATE,
      yearsOfExperience: 1,
      offersDemoSession: false,
      availabilityStatus: TrainerAvailabilityStatus.AVAILABLE,
    },
  });

  const offersDemoSession = watch('offersDemoSession');

  const daysOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const timeSlots = [
    '06:00-08:00',
    '08:00-10:00',
    '10:00-12:00',
    '12:00-14:00',
    '14:00-16:00',
    '16:00-18:00',
    '18:00-20:00',
    '20:00-22:00',
  ];

  const toggleSpecialization = (spec: TrainerSpecialization) => {
    setSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const addCertification = () => {
    if (certificationInput.trim() && !certifications.includes(certificationInput.trim())) {
      setCertifications([...certifications, certificationInput.trim()]);
      setCertificationInput('');
    }
  };

  const removeCertification = (cert: string) => {
    setCertifications(certifications.filter((c) => c !== cert));
  };

  const toggleTimeSlot = (day: string, slot: string) => {
    setWeeklyAvailability((prev) => {
      const daySlots = prev[day] || [];
      const newSlots = daySlots.includes(slot)
        ? daySlots.filter((s) => s !== slot)
        : [...daySlots, slot];
      return { ...prev, [day]: newSlots };
    });
  };

  const onSubmit = async (data: TrainerFormData) => {
    if (!user?.tenantId) {
      error('Authentication Error', 'User not authenticated');
      return;
    }

    if (!selectedUserId) {
      error('Validation Error', 'Please select a user');
      return;
    }

    if (specializations.length === 0) {
      error('Validation Error', 'Please add at least one specialization');
      return;
    }

    try {
      setLoading(true);

      const trainerData: CreateTrainerDto = {
        userId: selectedUserId,
        bio: data.bio,
        specializations: specializations,
        experienceLevel: data.experienceLevel,
        yearsOfExperience: Number(data.yearsOfExperience),
        certifications: certifications.length > 0 ? certifications : undefined,
        offersDemoSession: data.offersDemoSession,
        demoSessionDurationMinutes: data.offersDemoSession
          ? Number(data.demoSessionDurationMinutes)
          : undefined,
        hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : undefined,
        weeklyAvailability: weeklyAvailability,
      };

      await trainersService.create(user.tenantId, trainerData);
      success('Success', 'Trainer created successfully!');
      onSuccess();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Error creating trainer:', err);
      error('Error', err.response?.data?.message || 'Failed to create trainer. Please try again.');
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
          <Label>Select User *</Label>
          <SearchableSelect
            options={users.map((u) => ({
              value: u.id,
              label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
              subtitle: u.email,
            }))}
            value={selectedUserId}
            onChange={setSelectedUserId}
            placeholder={loadingUsers ? 'Loading users...' : 'Search and select a user'}
            disabled={loadingUsers}
          />
          {!selectedUserId && (
            <p className="text-xs text-gray-500 mt-1">
              Search by name or email to find an existing user
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="bio">Bio *</Label>
          <Textarea
            id="bio"
            {...register('bio', { required: 'Bio is required' })}
            placeholder="Tell us about the trainer's background and expertise..."
            rows={4}
          />
          {errors.bio && <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="experienceLevel">Experience Level *</Label>
            <select
              id="experienceLevel"
              {...register('experienceLevel', { required: 'Experience level is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div>
            <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
            <Input
              id="yearsOfExperience"
              type="number"
              min="0"
              {...register('yearsOfExperience', {
                required: 'Years of experience is required',
                min: { value: 0, message: 'Must be 0 or greater' },
              })}
            />
            {errors.yearsOfExperience && (
              <p className="text-sm text-red-600 mt-1">{errors.yearsOfExperience.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="availabilityStatus">Availability Status *</Label>
          <select
            id="availabilityStatus"
            {...register('availabilityStatus')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Specializations */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Specializations *</h3>
        <p className="text-sm text-gray-600">Select at least one specialization</p>

        <div className="grid grid-cols-2 gap-2">
          {Object.values(TrainerSpecialization).map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => toggleSpecialization(spec)}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                specializations.includes(spec)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{SPECIALIZATION_LABELS[spec]}</span>
              {specializations.includes(spec) && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>

        <div>
          <Label>Add Certification</Label>
          <div className="flex gap-2">
            <Input
              value={certificationInput}
              onChange={(e) => setCertificationInput(e.target.value)}
              placeholder="e.g., ACE Certified, NASM-CPT"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCertification();
                }
              }}
            />
            <Button type="button" onClick={addCertification} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {certifications.map((cert) => (
              <div
                key={cert}
                className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
              >
                <span>{cert}</span>
                <button
                  type="button"
                  onClick={() => removeCertification(cert)}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Session */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Demo Session & Pricing</h3>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="offersDemoSession"
            {...register('offersDemoSession')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="offersDemoSession" className="cursor-pointer">
            Offers Demo Session
          </Label>
        </div>

        {offersDemoSession && (
          <div>
            <Label htmlFor="demoSessionDurationMinutes">Demo Session Duration (minutes)</Label>
            <Input
              id="demoSessionDurationMinutes"
              type="number"
              min="15"
              step="15"
              {...register('demoSessionDurationMinutes')}
              placeholder="e.g., 30"
            />
          </div>
        )}

        <div>
          <Label htmlFor="hourlyRate">Hourly Rate (optional)</Label>
          <Input
            id="hourlyRate"
            type="number"
            min="0"
            step="0.01"
            {...register('hourlyRate')}
            placeholder="e.g., 5000"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty if not applicable</p>
        </div>
      </div>

      {/* Weekly Availability */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Weekly Availability</h3>
        <p className="text-sm text-gray-600">Select available time slots for each day</p>

        <div className="space-y-3">
          {daysOfWeek.map((day) => (
            <div key={day} className="border rounded-lg p-3">
              <h4 className="font-medium text-sm capitalize mb-2">{day}</h4>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleTimeSlot(day, slot)}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      weeklyAvailability[day]?.includes(slot)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
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
            'Create Trainer'
          )}
        </Button>
      </div>
    </form>
  );
}
