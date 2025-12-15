import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/axios';

interface AddUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface UserFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: 'member' | 'admin' | 'moderator' | 'trainer';
}

export default function AddUserForm({ onSuccess, onCancel }: AddUserFormProps) {
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      role: 'member',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: UserFormData) => {
    if (!user?.tenantId) {
      error('Authentication Error', 'User not authenticated');
      return;
    }

    if (data.password !== data.confirmPassword) {
      error('Validation Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const registerData = {
        email: data.email,
        password: data.password,
        tenantId: user.tenantId,
        fullName: data.fullName,
        role: data.role,
      };

      await apiClient.post('/auth/register', registerData);
      
      success('User Created', `${data.fullName} has been successfully added as ${data.role}`);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating user:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create user. Please try again.';
      error('Error Creating User', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">User Information</h3>

        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            {...register('fullName', { 
              required: 'Full name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' }
            })}
            placeholder="e.g., John Doe"
          />
          {errors.fullName && (
            <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            placeholder="user@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="role">Role *</Label>
          <select
            id="role"
            {...register('role', { required: 'Role is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="member">Member</option>
            <option value="trainer">Trainer</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && (
            <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
          )}
        </div>
      </div>

      {/* Security */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Security</h3>

        <div>
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message: 'Password must include uppercase, lowercase, number, and special character'
                }
              })}
              placeholder="Enter a secure password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Min 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword', { 
                required: 'Please confirm the password',
                validate: value => value === password || 'Passwords do not match'
              })}
              placeholder="Confirm password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
          )}
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
            'Create User'
          )}
        </Button>
      </div>
    </form>
  );
}
