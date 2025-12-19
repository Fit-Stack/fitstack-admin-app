import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Users, DollarSign, Clock, CheckCircle, Edit2, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/authStore';
import { classesService, Class } from '@/services/classes.service';
import { useToast } from '@/components/ui/toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ClassEnrollment = {
  id: string;
  classId: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  enrolledAt: string;
  status: string;
  paymentStatus: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
};

export default function ClassDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<Class | null>(null);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    capacity: '',
    price: '',
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tenantId = user?.tenantId;
  const classId = id;

  const fetchData = useCallback(async () => {
    if (!tenantId || !classId) return;

    try {
      setLoading(true);
      setError(null);

      const [classInfo, enrollmentData] = await Promise.all([
        classesService.getById(tenantId, classId),
        classesService.getEnrollments(tenantId, classId),
      ]);

      setClassData(classInfo);
      setEnrollments((enrollmentData || []) as ClassEnrollment[]);
      setEditForm({
        title: classInfo.title,
        description: classInfo.description || '',
        capacity: String(classInfo.capacity || ''),
        price: String(classInfo.price || ''),
      });
    } catch (e: any) {
      console.error('Error loading class details:', e);
      setError(e?.response?.data?.message || 'Failed to load class details');
      setClassData(null);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async () => {
    if (!tenantId || !classId) return;

    try {
      setUpdating(true);
      await classesService.update(tenantId, classId, {
        title: editForm.title,
        description: editForm.description,
        capacity: editForm.capacity ? parseInt(editForm.capacity) : undefined,
        price: editForm.price ? parseFloat(editForm.price) : undefined,
      });
      success('Success', 'Class updated successfully');
      setIsEditOpen(false);
      fetchData();
    } catch (e: any) {
      console.error('Error updating class:', e);
      showError('Error', e?.response?.data?.message || 'Failed to update class');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!tenantId || !classId) return;
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      setDeleting(true);
      await classesService.delete(tenantId, classId);
      success('Success', 'Class deleted successfully');
      navigate('/classes');
    } catch (e: any) {
      console.error('Error deleting class:', e);
      showError('Error', e?.response?.data?.message || 'Failed to delete class');
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkAsPaid = async (enrollmentId: string, paymentRef?: string) => {
    if (!tenantId || !classId) return;

    try {
      setUpdatingPayment(enrollmentId);
      await classesService.updateEnrollmentPayment(tenantId, classId, enrollmentId, {
        paymentId: paymentRef || `MANUAL-${Date.now()}`,
      });
      success('Success', 'Enrollment marked as paid');
      fetchData();
    } catch (e: any) {
      console.error('Error updating payment:', e);
      showError('Error', e?.response?.data?.message || 'Failed to update payment status');
    } finally {
      setUpdatingPayment(null);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return format(d, 'MMM dd, yyyy');
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      paid: 'success',
      pending: 'default',
      not_required: 'secondary',
      refunded: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getEnrollmentStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'success',
      completed: 'secondary',
      dropped: 'destructive',
      cancelled: 'destructive',
    };
    return variants[status] || 'default';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-600">Loading class...</p>
      </div>
    );
  }

  if (!classId || !tenantId) {
    return (
      <Card>
        <CardContent className="py-6">
          <EmptyState
            icon={Calendar}
            title="Class not found"
            description="Missing tenant or class id."
            actionLabel="Back to Classes"
            onAction={() => navigate('/classes')}
            actionIcon={ArrowLeft}
          />
        </CardContent>
      </Card>
    );
  }

  if (error || !classData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/classes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={Calendar}
              title="Failed to load class"
              description={error || 'Something went wrong.'}
              actionLabel="Retry"
              onAction={fetchData}
              actionIcon={Calendar}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeEnrollments = enrollments.filter((e) => e.status === 'active');
  const availableSpots = classData.capacity ? classData.capacity - activeEnrollments.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/classes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{classData.title}</h1>
            <p className="text-gray-600 mt-1">Class details and enrollments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{classData.category}</Badge>
          <Badge variant="outline">{classData.level}</Badge>
          <Badge variant="outline">{classData.status}</Badge>
          <Button size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{activeEnrollments.length}</div>
            <p className="text-sm text-gray-600">Active Enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{availableSpots}</div>
            <p className="text-sm text-gray-600">Available Spots</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {enrollments.filter((e) => e.paymentStatus === 'pending').length}
            </div>
            <p className="text-sm text-gray-600">Pending Payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Instructor</p>
              <p className="font-medium text-gray-900">
                {classData.instructor
                  ? `${classData.instructor.firstName} ${classData.instructor.lastName}`
                  : 'N/A'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Pricing</p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">
                  {classData.pricingType === 'membership'
                    ? 'Membership'
                    : `${classData.currency} ${classData.price || 0}`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Capacity</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">{classData.capacity || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Start Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">{formatDate(classData.startDate)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">End Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">{formatDate(classData.endDate)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Schedule</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">
                  {classData.schedule?.days?.join(', ') || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {classData.description && (
            <div className="mt-6">
              <p className="text-sm text-gray-600">Description</p>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{classData.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrollments ({enrollments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No enrollments"
              description="This class currently has no enrollments."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Student</th>
                    <th className="py-2 pr-4">Enrolled</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Payment</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {enrollment.user
                              ? `${enrollment.user.firstName} ${enrollment.user.lastName}`
                              : 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">{enrollment.user?.email}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-900">
                        {formatDate(enrollment.enrolledAt)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={getEnrollmentStatusBadge(enrollment.status)}>
                          {enrollment.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={getPaymentStatusBadge(enrollment.paymentStatus)}>
                          {enrollment.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {enrollment.paymentStatus === 'pending' &&
                          enrollment.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(enrollment.id)}
                              disabled={updatingPayment === enrollment.id}
                            >
                              {updatingPayment === enrollment.id ? (
                                'Updating...'
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Mark Paid
                                </>
                              )}
                            </Button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Class</SheetTitle>
            <SheetDescription>Update class information</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={editForm.capacity}
                onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
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
