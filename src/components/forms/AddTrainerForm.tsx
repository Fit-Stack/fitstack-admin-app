import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, X } from 'lucide-react';
import { trainersService } from '@/services/trainers.service';
import { useAuthStore } from '@/store/authStore';

interface AddTrainerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface TrainerFormData {
  userId: string;
  bio: string;
  specializations: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
  certifications: string[];
  offersDemoSession: boolean;
  demoSessionDurationMinutes?: number;
  hourlyRate?: number;
  availabilityStatus: 'available' | 'busy' | 'on_leave' | 'inactive';
  weeklyAvailability: Record<string, string[]>;
}

export default function AddTrainerForm({ onSuccess, onCancel }: AddTrainerFormProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specializationInput, setSpecializationInput] = useState('');
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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TrainerFormData>({
    defaultValues: {
      experienceLevel: 'intermediate',
      yearsOfExperience: 1,
      offersDemoSession: false,
      availabilityStatus: 'available',
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

  const addSpecialization = () => {
    if (specializationInput.trim() && !specializations.includes(specializationInput.trim())) {
      setSpecializations([...specializations, specializationInput.trim()]);
      setSpecializationInput('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setSpecializations(specializations.filter((s) => s !== spec));
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
      alert('User not authenticated');
      return;
    }

    if (specializations.length === 0) {
      alert('Please add at least one specialization');
      return;
    }

    try {
      setLoading(true);

      const trainerData = {
        userId: data.userId,
        bio: data.bio,
        specializations: specializations,
        experienceLevel: data.experienceLevel,
        yearsOfExperience: Number(data.yearsOfExperience),
        certifications: certifications,
        offersDemoSession: data.offersDemoSession,
        demoSessionDurationMinutes: data.offersDemoSession
          ? Number(data.demoSessionDurationMinutes)
          : undefined,
        hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : undefined,
        availabilityStatus: data.availabilityStatus,
        weeklyAvailability: weeklyAvailability,
      };

      await trainersService.create(user.tenantId, trainerData);
      alert('Trainer created successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating trainer:', error);
      alert(error.response?.data?.message || 'Failed to create trainer. Please try again.');
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
          <Label htmlFor="userId">User ID *</Label>
          <Input
            id="userId"
            {...register('userId', { required: 'User ID is required' })}
            placeholder="Enter user ID"
          />
          {errors.userId && <p className="text-sm text-red-600 mt-1">{errors.userId.message}</p>}
          <p className="text-xs text-gray-500 mt-1">
            The user must already exist in the system
          </p>
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
        <h3 className="text-lg font-semibold text-gray-900">Specializations</h3>

        <div>
          <Label>Add Specialization *</Label>
          <div className="flex gap-2">
            <Input
              value={specializationInput}
              onChange={(e) => setSpecializationInput(e.target.value)}
              placeholder="e.g., HIIT, Yoga, Strength Training"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSpecialization();
                }
              }}
            />
            <Button type="button" onClick={addSpecialization} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {specializations.map((spec) => (
              <div
                key={spec}
                className="flex items-center gap-1 bg-primary text-white px-3 py-1 rounded-full text-sm"
              >
                <span>{spec}</span>
                <button
                  type="button"
                  onClick={() => removeSpecialization(spec)}
                  className="hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
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
