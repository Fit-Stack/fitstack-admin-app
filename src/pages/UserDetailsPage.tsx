import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Mail, Phone, Calendar, Shield, Edit2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/authStore';
import { usersService, User } from '@/services/users.service';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

export default function UserDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [updating, setUpdating] = useState(false);

  const tenantId = currentUser?.tenantId;
  const userId = id;

  const fetchData = useCallback(async () => {
    if (!tenantId || !userId) return;

    try {
      setLoading(true);
      setError(null);

      const userData = await usersService.getById(tenantId, userId);
      setUser(userData);
      setEditForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
      });
    } catch (e: any) {
      console.error('Error loading user details:', e);
      setError(e?.response?.data?.message || 'Failed to load user details');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async () => {
    if (!tenantId || !userId) return;

    try {
      setUpdating(true);
      await usersService.update(tenantId, userId, editForm);
      success('Success', 'User updated successfully');
      setIsEditOpen(false);
      fetchData();
    } catch (e: any) {
      console.error('Error updating user:', e);
      showError('Error', e?.response?.data?.message || 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return format(d, 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-600">Loading user...</p>
      </div>
    );
  }

  if (!userId || !tenantId) {
    return (
      <Card>
        <CardContent className="py-6">
          <EmptyState
            icon={Shield}
            title="User not found"
            description="Missing tenant or user id."
            actionLabel="Back to Users"
            onAction={() => navigate('/users')}
            actionIcon={ArrowLeft}
          />
        </CardContent>
      </Card>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={Shield}
              title="Failed to load user"
              description={error || 'Something went wrong.'}
              actionLabel="Retry"
              onAction={fetchData}
              actionIcon={Shield}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600 mt-1">User details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user.isActive ? 'success' : 'destructive'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline">{user.role}</Badge>
          <Button size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">{user.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Role</p>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900 capitalize">{user.role}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={user.isActive ? 'success' : 'destructive'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Joined</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            {user.updatedAt && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Last Updated</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <p className="font-medium text-gray-900">{formatDate(user.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit User</SheetTitle>
            <SheetDescription>Update user information</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdate} disabled={updating} className="flex-1">
                {updating ? 'Updating...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
