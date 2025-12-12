import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function EventsPage() {
  // Mock data - in real app, fetch from API
  const events = [
    {
      id: '1',
      title: 'Summer Fitness Challenge',
      description: 'Join our 30-day fitness challenge with prizes for top performers',
      startDate: new Date(2025, 11, 20),
      endDate: new Date(2026, 0, 20),
      location: 'Main Gym Floor',
      capacity: 100,
      registered: 78,
      status: 'upcoming',
    },
    {
      id: '2',
      title: 'Yoga Retreat Weekend',
      description: 'Relaxing weekend yoga retreat with meditation and wellness workshops',
      startDate: new Date(2025, 11, 15),
      endDate: new Date(2025, 11, 17),
      location: 'Mountain Resort',
      capacity: 30,
      registered: 30,
      status: 'upcoming',
    },
    {
      id: '3',
      title: 'Nutrition Workshop',
      description: 'Learn about meal planning and nutrition for optimal fitness results',
      startDate: new Date(2025, 11, 14, 18, 0),
      endDate: new Date(2025, 11, 14, 20, 0),
      location: 'Conference Room',
      capacity: 50,
      registered: 42,
      status: 'ongoing',
    },
    {
      id: '4',
      title: 'Charity Run 5K',
      description: 'Annual charity run to support local community fitness programs',
      startDate: new Date(2025, 10, 15),
      endDate: new Date(2025, 10, 15),
      location: 'City Park',
      capacity: 200,
      registered: 187,
      status: 'completed',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      upcoming: 'default',
      ongoing: 'success',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getRegistrationStatus = (registered: number, capacity: number) => {
    const percentage = (registered / capacity) * 100;
    if (percentage >= 100) return { text: 'Full', color: 'text-red-600' };
    if (percentage >= 80) return { text: 'Almost Full', color: 'text-orange-600' };
    return { text: 'Available', color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage community events and activities</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => {
          const registrationStatus = getRegistrationStatus(event.registered, event.capacity);
          
          return (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Event Image Placeholder */}
                  <div className="w-full lg:w-48 h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-16 w-16 text-primary" />
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                      </div>
                      <Badge variant={getStatusBadge(event.status)} className="ml-4">
                        {event.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {format(event.startDate, 'MMM dd, yyyy')}
                          </p>
                          {event.startDate.getTime() !== event.endDate.getTime() && (
                            <p className="text-xs">
                              to {format(event.endDate, 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">
                          {event.registered}/{event.capacity}
                        </span>
                        <span className={`text-xs ${registrationStatus.color}`}>
                          {registrationStatus.text}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Registration Progress</span>
                        <span>{Math.round((event.registered / event.capacity) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit Event
                      </Button>
                      <Button variant="ghost" size="sm">
                        View Attendees
                      </Button>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
