import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, Users, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/authStore';
import { eventsService, CommunityEvent } from '@/services/events.service';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

export default function EventDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    location: '',
    capacity: '',
    activityType: '',
    visibility: 'public' as 'public' | 'friends_only' | 'invite_only',
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tenantId = user?.tenantId;
  const eventId = id;

  const fetchData = useCallback(async () => {
    if (!tenantId || !eventId) return;

    try {
      setLoading(true);
      setError(null);

      const [eventData, participantsData] = await Promise.all([
        eventsService.getById(tenantId, eventId),
        eventsService.getParticipants(tenantId, eventId).catch(() => []),
      ]);

      setEvent(eventData);
      setParticipants(participantsData || []);
      setEditForm({
        title: eventData.title,
        description: eventData.description || '',
        location: eventData.location,
        capacity: String(eventData.capacity),
        activityType: eventData.activityType,
        visibility: eventData.visibility,
      });
    } catch (e: any) {
      console.error('Error loading event details:', e);
      setError(e?.response?.data?.message || 'Failed to load event details');
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId, eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async () => {
    if (!tenantId || !eventId) return;

    try {
      setUpdating(true);
      await eventsService.update(tenantId, eventId, {
        title: editForm.title,
        description: editForm.description,
        location: editForm.location,
        capacity: parseInt(editForm.capacity),
        activityType: editForm.activityType,
        visibility: editForm.visibility,
      });
      success('Success', 'Event updated successfully');
      setIsEditOpen(false);
      fetchData();
    } catch (e: any) {
      console.error('Error updating event:', e);
      showError('Error', e?.response?.data?.message || 'Failed to update event');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!tenantId || !eventId) return;
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      setDeleting(true);
      await eventsService.delete(tenantId, eventId);
      success('Success', 'Event deleted successfully');
      navigate('/events');
    } catch (e: any) {
      console.error('Error deleting event:', e);
      showError('Error', e?.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleApprove = async () => {
    if (!tenantId || !eventId) return;

    try {
      await eventsService.approve(tenantId, eventId);
      success('Success', 'Event approved successfully');
      fetchData();
    } catch (e: any) {
      console.error('Error approving event:', e);
      showError('Error', e?.response?.data?.message || 'Failed to approve event');
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return format(d, 'MMM dd, yyyy');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending_approval: 'default',
      approved: 'success',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return variants[status] || 'default';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-600">Loading event...</p>
      </div>
    );
  }

  if (!eventId || !tenantId) {
    return (
      <Card>
        <CardContent className="py-6">
          <EmptyState
            icon={Calendar}
            title="Event not found"
            description="Missing tenant or event id."
            actionLabel="Back to Events"
            onAction={() => navigate('/events')}
            actionIcon={ArrowLeft}
          />
        </CardContent>
      </Card>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={Calendar}
              title="Failed to load event"
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
          <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
            <p className="text-gray-600 mt-1">Event details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadge(event.status)}>{event.status}</Badge>
          <Badge variant="outline">{event.visibility}</Badge>
          {event.status === 'pending_approval' && (
            <Button size="sm" variant="default" onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          )}
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
            <div className="text-2xl font-bold text-gray-900">{participants.length}</div>
            <p className="text-sm text-gray-600">Participants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{event.capacity}</div>
            <p className="text-sm text-gray-600">Capacity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {event.capacity - participants.length}
            </div>
            <p className="text-sm text-gray-600">Available Spots</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Activity Type</p>
              <Badge variant="outline" className="capitalize">
                {event.activityType.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Visibility</p>
              <Badge variant="outline" className="capitalize">
                {event.visibility.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Start Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">{formatDate(event.startDate)}</p>
              </div>
            </div>

            {event.endDate && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">End Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <p className="font-medium text-gray-900">{formatDate(event.endDate)}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Location</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">{event.location}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Capacity</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <p className="font-medium text-gray-900">{event.capacity}</p>
              </div>
            </div>

            {event.creator && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Created By</p>
                <p className="font-medium text-gray-900">
                  {event.creator.firstName} {event.creator.lastName}
                </p>
              </div>
            )}
          </div>

          {event.description && (
            <div className="mt-6">
              <p className="text-sm text-gray-600">Description</p>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participants ({participants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No participants"
              description="This event currently has no participants."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => (
                    <tr key={participant.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {participant.user?.firstName} {participant.user?.lastName}
                      </td>
                      <td className="py-3 pr-4 text-gray-900">{participant.user?.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{participant.status}</Badge>
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
            <SheetTitle>Edit Event</SheetTitle>
            <SheetDescription>Update event information</SheetDescription>
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
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                value={editForm.capacity}
                onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="activityType">Activity Type *</Label>
              <select
                id="activityType"
                value={editForm.activityType}
                onChange={(e) => setEditForm({ ...editForm, activityType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="sparring">Sparring</option>
                <option value="spotting">Spotting</option>
                <option value="challenge">Challenge</option>
                <option value="group_workout">Group Workout</option>
                <option value="running">Running</option>
                <option value="cycling">Cycling</option>
                <option value="sports_match">Sports Match</option>
                <option value="training_partner">Training Partner</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="visibility">Visibility *</Label>
              <select
                id="visibility"
                value={editForm.visibility}
                onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="public">Public</option>
                <option value="friends_only">Friends Only</option>
                <option value="invite_only">Invite Only</option>
              </select>
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
