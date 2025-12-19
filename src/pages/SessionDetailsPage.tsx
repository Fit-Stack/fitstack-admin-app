import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Repeat, Users, Edit2, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/authStore';
import { sessionsService, Session } from '@/services/sessions.service';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

type SessionOccurrence = {
  id: string;
  sessionId?: string;
  occurrenceDate?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  capacity?: number;
  createdAt?: string;
  updatedAt?: string;
};

export default function SessionDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [occurrences, setOccurrences] = useState<SessionOccurrence[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    capacity: '',
    pricePerAttendance: '',
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { success, error: showError } = useToast();

  const tenantId = user?.tenantId;
  const sessionId = id;

  const fetchData = useCallback(async () => {
    if (!tenantId || !sessionId) return;

    try {
      setLoading(true);
      setError(null);

      const [sessionData, occurrenceData] = await Promise.all([
        sessionsService.getById(tenantId, sessionId),
        sessionsService.getOccurrences(tenantId, sessionId),
      ]);

      setSession(sessionData);
      setOccurrences((occurrenceData || []) as SessionOccurrence[]);
      setEditForm({
        title: sessionData.title,
        description: sessionData.description || '',
        capacity: String(sessionData.capacity || ''),
        pricePerAttendance: String(sessionData.pricePerAttendance || ''),
      });
    } catch (e: any) {
      console.error('Error loading session details:', e);
      setError(e?.response?.data?.message || 'Failed to load session details');
      setSession(null);
      setOccurrences([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, sessionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async () => {
    if (!tenantId || !sessionId) return;

    try {
      setUpdating(true);
      await sessionsService.update(tenantId, sessionId, {
        title: editForm.title,
        description: editForm.description,
        capacity: editForm.capacity ? parseInt(editForm.capacity) : undefined,
        pricePerAttendance: editForm.pricePerAttendance ? parseFloat(editForm.pricePerAttendance) : undefined,
      });
      success('Success', 'Session updated successfully');
      setIsEditOpen(false);
      fetchData();
    } catch (e: any) {
      console.error('Error updating session:', e);
      showError('Error', e?.response?.data?.message || 'Failed to update session');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!tenantId || !sessionId) return;
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      setDeleting(true);
      await sessionsService.delete(tenantId, sessionId);
      success('Success', 'Session deleted successfully');
      navigate('/sessions');
    } catch (e: any) {
      console.error('Error deleting session:', e);
      showError('Error', e?.response?.data?.message || 'Failed to delete session');
    } finally {
      setDeleting(false);
    }
  };

  const pricingLabel = useMemo(() => {
    if (!session) return '';
    if (!session.isPaid) return 'Free';
    const price = session.pricePerAttendance ?? 0;
    return `${session.currency || 'INR'} ${price} / attendance`;
  }, [session]);

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
        <p className="mt-2 text-gray-600">Loading session...</p>
      </div>
    );
  }

  if (!sessionId || !tenantId) {
    return (
      <Card>
        <CardContent className="py-6">
          <EmptyState
            icon={Calendar}
            title="Session not found"
            description="Missing tenant or session id."
            actionLabel="Back to Sessions"
            onAction={() => navigate('/sessions')}
            actionIcon={ArrowLeft}
          />
        </CardContent>
      </Card>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/sessions')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={Calendar}
              title="Failed to load session"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/sessions')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-gray-600 mt-1">Session details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{session.category || 'uncategorized'}</Badge>
          {session.isPaid ? (
            <Badge variant="secondary">Paid</Badge>
          ) : (
            <Badge variant="secondary">Free</Badge>
          )}
          <Badge variant="outline">{session.status}</Badge>
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

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Instructor</p>
              <p className="font-medium text-gray-900">
                {session.instructor?.user
                  ? `${session.instructor.user.firstName} ${session.instructor.user.lastName}`
                  : 'N/A'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Pricing</p>
              <p className="font-medium text-gray-900">{pricingLabel}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="font-medium text-gray-900">
                {session.capacity ?? 'N/A'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Recurrence</p>
              <div className="flex items-center gap-2 text-gray-900">
                <Repeat className="h-4 w-4" />
                <span className="font-medium capitalize">{session.recurrencePattern?.type}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Schedule</p>
              <div className="flex items-center gap-2 text-gray-900">
                <Clock className="h-4 w-4" />
                <span className="font-medium">
                  {session.recurrencePattern?.time} ({session.recurrencePattern?.durationMinutes}min)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Date Range</p>
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {formatDate(session.recurrencePattern?.startDate)} - {formatDate(session.recurrencePattern?.endDate)}
                </span>
              </div>
            </div>
          </div>

          {session.description && (
            <div className="mt-6">
              <p className="text-sm text-gray-600">Description</p>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{session.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Occurrences</CardTitle>
        </CardHeader>
        <CardContent>
          {occurrences.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No occurrences"
              description="This session currently has no generated occurrences."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {occurrences.map((o) => (
                    <tr key={o.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {o.occurrenceDate ? formatDate(o.occurrenceDate) : 'N/A'}
                      </td>
                      <td className="py-3 pr-4 text-gray-900">
                        {o.startTime && o.endTime ? `${o.startTime} - ${o.endTime}` : session.recurrencePattern?.time || 'N/A'}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{o.status || 'scheduled'}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2 text-gray-900">
                          <Users className="h-4 w-4 text-gray-600" />
                          <span>{o.capacity ?? session.capacity ?? 'N/A'}</span>
                        </div>
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
            <SheetTitle>Edit Session</SheetTitle>
            <SheetDescription>Update session information</SheetDescription>
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
              <Label htmlFor="pricePerAttendance">Price Per Attendance</Label>
              <Input
                id="pricePerAttendance"
                type="number"
                value={editForm.pricePerAttendance}
                onChange={(e) => setEditForm({ ...editForm, pricePerAttendance: e.target.value })}
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
