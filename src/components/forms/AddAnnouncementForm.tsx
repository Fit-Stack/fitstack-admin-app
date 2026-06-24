import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { announcementsService, Announcement } from '@/services/announcements.service';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/authStore';

interface AddAnnouncementFormProps {
  announcement?: Announcement;
  onSuccess: () => void;
  onCancel: () => void;
}

interface AnnouncementFormData {
  title: string;
  content: string;
  category: string;
  priority: string;
  targetAudience: string;
  isPinned: boolean;
  scheduledFor?: string;
  expiresAt?: string;
  publishNow: boolean;
}

export default function AddAnnouncementForm({ announcement, onSuccess, onCancel }: AddAnnouncementFormProps) {
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const isEdit = !!announcement;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AnnouncementFormData>({
    defaultValues: announcement ? {
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      isPinned: announcement.isPinned,
      scheduledFor: announcement.scheduledFor || '',
      expiresAt: announcement.expiresAt || '',
      publishNow: false,
    } : {
      category: 'general',
      priority: 'medium',
      targetAudience: 'all_members',
      isPinned: false,
      publishNow: false,
    },
  });

  const publishNow = watch('publishNow');

  const onSubmit = async (data: AnnouncementFormData) => {
    if (!user?.tenantId) {
      error('Authentication Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);

      const announcementData: any = {
        title: data.title,
        content: data.content,
        category: data.category,
        priority: data.priority,
        targetAudience: data.targetAudience,
        isPinned: data.isPinned,
        publishNow: data.publishNow,
      };

      if (data.scheduledFor) {
        announcementData.scheduledFor = new Date(data.scheduledFor).toISOString();
      }

      if (data.expiresAt) {
        announcementData.expiresAt = new Date(data.expiresAt).toISOString();
      }

      if (isEdit) {
        await announcementsService.update(user.tenantId, announcement.id, announcementData);
        success('Success', 'Announcement updated successfully');
      } else {
        await announcementsService.create(user.tenantId, announcementData);
        success('Success', 'Announcement created successfully');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      error('Error', error.response?.data?.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Announcement Details</h3>

        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...register('title', { 
              required: 'Title is required',
              minLength: { value: 3, message: 'Title must be at least 3 characters' },
              maxLength: { value: 255, message: 'Title must be less than 255 characters' },
            })}
            placeholder="e.g., Gym Closed for Maintenance"
          />
          {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            {...register('content', { 
              required: 'Content is required',
              minLength: { value: 10, message: 'Content must be at least 10 characters' },
            })}
            placeholder="Write your announcement message..."
            rows={6}
          />
          {errors.content && <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              {...register('category')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="general">General</option>
              <option value="maintenance">Maintenance</option>
              <option value="promotion">Promotion</option>
              <option value="event">Event</option>
              <option value="policy">Policy</option>
              <option value="emergency">Emergency</option>
              <option value="schedule_change">Schedule Change</option>
              <option value="facility">Facility</option>
            </select>
          </div>

          <div>
            <Label htmlFor="priority">Priority *</Label>
            <select
              id="priority"
              {...register('priority')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Target Audience */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Target Audience</h3>

        <div>
          <Label htmlFor="targetAudience">Who should see this? *</Label>
          <select
            id="targetAudience"
            {...register('targetAudience')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all_members">All Members</option>
            <option value="active_members">Active Members Only</option>
            <option value="premium_members">Premium Members Only</option>
            <option value="specific_classes">Specific Classes</option>
            <option value="trainers">Trainers</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* Scheduling */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Schedule & Expiry</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="scheduledFor">Schedule For (Optional)</Label>
            <Input
              id="scheduledFor"
              type="datetime-local"
              {...register('scheduledFor')}
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to publish immediately (if "Publish Now" is checked)</p>
          </div>

          <div>
            <Label htmlFor="expiresAt">Expires At (Optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              {...register('expiresAt')}
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Options</h3>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('isPinned')}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700">Pin to top of list</span>
          </label>

          {!isEdit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('publishNow')}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Publish immediately</span>
            </label>
          )}
        </div>

        {publishNow && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              ✓ This announcement will be published immediately and visible to the selected audience.
            </p>
          </div>
        )}

        {!publishNow && !isEdit && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-sm text-amber-800">
              ℹ This announcement will be saved as a draft. You can publish it later from the announcements list.
            </p>
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
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEdit ? 'Update Announcement' : 'Create Announcement'
          )}
        </Button>
      </div>
    </form>
  );
}
