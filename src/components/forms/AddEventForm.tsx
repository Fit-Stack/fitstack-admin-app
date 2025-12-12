import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { eventsService } from '@/services/events.service';
import { useAuthStore } from '@/store/authStore';

interface AddEventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface EventFormData {
  title: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  activityType: string;
  maxParticipants: number;
  visibility: 'public' | 'friends_only' | 'invite_only';
}

export default function AddEventForm({ onSuccess, onCancel }: AddEventFormProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: {
      visibility: 'public',
      maxParticipants: 10,
      activityType: 'other',
    },
  });

  const onSubmit = async (data: EventFormData) => {
    if (!user?.tenantId) {
      alert('User not authenticated');
      return;
    }

    try {
      setLoading(true);

      const eventData = {
        title: data.title,
        description: data.description,
        eventDate: data.eventDate,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        activityType: data.activityType,
        maxParticipants: data.maxParticipants,
        visibility: data.visibility,
      };

      await eventsService.create(user.tenantId, eventData);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const activityTypes = [
    { value: 'sparring', label: 'Sparring Partner' },
    { value: 'spotting', label: 'Spotting Partner' },
    { value: 'challenge', label: 'Challenge' },
    { value: 'group_workout', label: 'Group Workout' },
    { value: 'running', label: 'Running' },
    { value: 'cycling', label: 'Cycling' },
    { value: 'sports_match', label: 'Sports Match' },
    { value: 'training_partner', label: 'Training Partner' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>

        <div>
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            {...register('title', { required: 'Event title is required' })}
            placeholder="e.g., Sparring Partner Needed - Chest Day"
          />
          {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Describe your event..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="activityType">Activity Type *</Label>
          <select
            id="activityType"
            {...register('activityType', { required: 'Activity type is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {activityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.activityType && <p className="text-sm text-red-600 mt-1">{errors.activityType.message}</p>}
        </div>

        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            {...register('location', { required: 'Location is required' })}
            placeholder="e.g., Main Gym Floor"
          />
          {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>}
        </div>
      </div>

      {/* Date & Time */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Date & Time</h3>

        <div>
          <Label htmlFor="eventDate">Event Date *</Label>
          <Input
            id="eventDate"
            type="date"
            {...register('eventDate', { required: 'Event date is required' })}
          />
          {errors.eventDate && <p className="text-sm text-red-600 mt-1">{errors.eventDate.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              type="time"
              {...register('startTime', { required: 'Start time is required' })}
            />
            {errors.startTime && <p className="text-sm text-red-600 mt-1">{errors.startTime.message}</p>}
          </div>

          <div>
            <Label htmlFor="endTime">End Time *</Label>
            <Input
              id="endTime"
              type="time"
              {...register('endTime', { required: 'End time is required' })}
            />
            {errors.endTime && <p className="text-sm text-red-600 mt-1">{errors.endTime.message}</p>}
          </div>
        </div>
      </div>

      {/* Participants & Visibility */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Participants & Privacy</h3>

        <div>
          <Label htmlFor="maxParticipants">Maximum Participants *</Label>
          <Input
            id="maxParticipants"
            type="number"
            min="1"
            max="1000"
            {...register('maxParticipants', {
              required: 'Maximum participants is required',
              min: { value: 1, message: 'Must be at least 1' },
              valueAsNumber: true,
            })}
            placeholder="10"
          />
          {errors.maxParticipants && <p className="text-sm text-red-600 mt-1">{errors.maxParticipants.message}</p>}
        </div>

        <div>
          <Label htmlFor="visibility">Visibility *</Label>
          <select
            id="visibility"
            {...register('visibility')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="public">Public - Anyone can see and join</option>
            <option value="friends_only">Friends Only - Only friends can see</option>
            <option value="invite_only">Invite Only - Invitation required</option>
          </select>
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
            'Create Event'
          )}
        </Button>
      </div>
    </form>
  );
}
