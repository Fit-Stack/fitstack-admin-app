import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Users, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { sessionsService, Session } from '@/services/sessions.service';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import AddSessionForm from '@/components/forms/AddSessionForm';

export default function SessionsPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);

  useEffect(() => {
    if (user?.tenantId) {
      fetchSessions();
    }
  }, [user?.tenantId]);

  const fetchSessions = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      const data = await sessionsService.getAll(user.tenantId, {
        limit: 50,
      });
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSessionSuccess = () => {
    setIsAddSessionOpen(false);
    fetchSessions();
  };

  // Mock data as fallback - matches Session interface
  const mockSessions: Session[] = [
    {
      id: '1',
      title: 'HIIT Training Session',
      description: 'High-intensity interval training',
      instructorId: 'instructor-1',
      category: 'cardio',
      startDate: new Date(2025, 11, 13).toISOString(),
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      },
      timeSlots: [
        {
          startTime: '09:00',
          endTime: '09:45',
        },
      ],
      capacity: 20,
      isDropIn: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Yoga Flow Session',
      description: 'Gentle yoga flow for flexibility',
      instructorId: 'instructor-2',
      category: 'yoga',
      startDate: new Date(2025, 11, 13).toISOString(),
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [2, 4], // Tue, Thu
      },
      timeSlots: [
        {
          startTime: '10:00',
          endTime: '11:00',
        },
      ],
      capacity: 15,
      isDropIn: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Spin Class Session',
      description: 'Indoor cycling for cardio',
      instructorId: 'instructor-3',
      category: 'cardio',
      startDate: new Date(2025, 11, 13).toISOString(),
      recurrence: {
        frequency: 'daily',
        interval: 1,
      },
      timeSlots: [
        {
          startTime: '18:00',
          endTime: '18:50',
        },
      ],
      capacity: 25,
      isDropIn: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const displaySessions = sessions.length > 0 ? sessions : (loading ? [] : mockSessions);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'success',
      paused: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getEnrollmentStatus = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 100) return { text: 'Full', color: 'text-red-600' };
    if (percentage >= 80) return { text: 'Almost Full', color: 'text-orange-600' };
    return { text: 'Available', color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-600 mt-1">Manage class sessions and schedules</p>
        </div>
        <Button onClick={() => setIsAddSessionOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{sessions.length}</div>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {sessions.filter(s => s.status === 'active').length}
            </div>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {sessions.filter(s => s.recurrence?.frequency).length}
            </div>
            <p className="text-sm text-gray-600">Recurring</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {sessions.filter(s => s.isDropIn).length}
            </div>
            <p className="text-sm text-gray-600">Drop-In</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading sessions...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && displaySessions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No sessions found. Schedule your first session to get started!</p>
            <Button className="mt-4" onClick={() => setIsAddSessionOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      {!loading && displaySessions.length > 0 && (
        <div className="space-y-4">
          {displaySessions.map((session) => {
            const instructor = session.instructor;
            // Mock enrollment for display (since Session interface doesn't have currentEnrollment)
            const mockEnrollment = Math.floor(session.capacity * 0.7);
            const enrollmentStatus = getEnrollmentStatus(
              mockEnrollment,
              session.capacity
            );

            return (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Session Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {session.title}
                            </h3>
                            {session.recurrence?.frequency && (
                              <Badge variant="outline" className="text-xs">
                                <Repeat className="h-3 w-3 mr-1" />
                                {session.recurrence.frequency}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {session.description}
                          </p>
                          {instructor && (
                            <p className="text-sm text-gray-500 mt-1">
                              with {instructor.firstName} {instructor.lastName}
                            </p>
                          )}
                        </div>
                        <Badge variant={getStatusBadge(session.status)}>
                          {session.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(session.startDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            {session.timeSlots[0]?.startTime} - {session.timeSlots[0]?.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">
                            {mockEnrollment}/{session.capacity}
                          </span>
                          <span className={`text-xs ${enrollmentStatus.color}`}>
                            {enrollmentStatus.text}
                          </span>
                        </div>
                      </div>

                      {session.endDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Until: {format(new Date(session.endDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 lg:flex-col">
                      <Button variant="outline" size="sm" className="flex-1 lg:flex-none">
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 lg:flex-none">
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(mockEnrollment / session.capacity) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Session Side Panel */}
      <Sheet open={isAddSessionOpen} onOpenChange={setIsAddSessionOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Schedule New Session</SheetTitle>
            <SheetDescription>
              Create a one-time or recurring session for a class
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AddSessionForm
              onSuccess={handleAddSessionSuccess}
              onCancel={() => setIsAddSessionOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
