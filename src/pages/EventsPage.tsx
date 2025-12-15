import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, Users, MapPin, Globe, Lock, CalendarDays, Filter, X, Search } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { eventsService, CommunityEvent, EventFilters } from '@/services/events.service';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import AddEventForm from '@/components/forms/AddEventForm';

// Event status options
const STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

// Visibility options
const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'friends_only', label: 'Friends Only' },
  { value: 'invite_only', label: 'Invite Only' },
];

// Activity type options
const ACTIVITY_TYPE_OPTIONS = [
  { value: 'sparring', label: 'Sparring' },
  { value: 'spotting', label: 'Spotting' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'group_workout', label: 'Group Workout' },
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'sports_match', label: 'Sports Match' },
  { value: 'training_partner', label: 'Training Partner' },
  { value: 'other', label: 'Other' },
];

export default function EventsPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('');

  const hasActiveFilters = searchQuery || statusFilter || visibilityFilter || activityTypeFilter;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, visibilityFilter, activityTypeFilter]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchEvents();
    }
  }, [user?.tenantId, currentPage, debouncedSearch, statusFilter, visibilityFilter, activityTypeFilter]);

  const fetchEvents = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      setError(null);
      
      const filters: EventFilters = {
        page: currentPage,
        limit: limit,
      };

      if (debouncedSearch) filters.search = debouncedSearch;
      if (statusFilter) filters.status = statusFilter;
      if (visibilityFilter) filters.visibility = visibilityFilter;
      if (activityTypeFilter) filters.activityType = activityTypeFilter;

      const response = await eventsService.getAll(user.tenantId, filters);
      setEvents(response.events || []);
      setTotalEvents(response.total || 0);
      setTotalPages(Math.ceil((response.total || 0) / limit));
    } catch (error: any) {
      console.error('Error fetching events:', error?.message || error);
      setError('Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, currentPage, debouncedSearch, statusFilter, visibilityFilter, activityTypeFilter]);

  const handleAddEventSuccess = () => {
    setIsAddEventOpen(false);
    fetchEvents();
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setVisibilityFilter('');
    setActivityTypeFilter('');
  };

  const formatDate = (dateString: string | undefined | null, formatStr: string = 'MMM dd, yyyy'): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, formatStr);
    } catch (error) {
      return 'Invalid Date';
    }
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

  const getRegistrationStatus = (registered: number, capacity: number) => {
    const percentage = (registered / capacity) * 100;
    if (percentage >= 100) return { text: 'Full', color: 'text-red-600' };
    if (percentage >= 80) return { text: 'Almost Full', color: 'text-orange-600' };
    return { text: 'Available', color: 'text-green-600' };
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-3 w-3" />;
      case 'friends_only':
        return <Users className="h-3 w-3" />;
      case 'invite_only':
        return <Lock className="h-3 w-3" />;
      default:
        return <Globe className="h-3 w-3" />;
    }
  };

  const getActivityTypeColor = (activityType: string) => {
    const colors: Record<string, string> = {
      sparring: 'bg-red-100 text-red-700',
      spotting: 'bg-blue-100 text-blue-700',
      challenge: 'bg-orange-100 text-orange-700',
      group_workout: 'bg-purple-100 text-purple-700',
      running: 'bg-green-100 text-green-700',
      cycling: 'bg-teal-100 text-teal-700',
      sports_match: 'bg-yellow-100 text-yellow-700',
      training_partner: 'bg-indigo-100 text-indigo-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[activityType] || colors.other;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage community events and activities</p>
        </div>
        <Button onClick={() => setIsAddEventOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            {/* Search and Filter Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search events by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    !
                  </Badge>
                )}
              </Button>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearAllFilters} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                {/* Status Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Visibility Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Visibility</Label>
                  <select
                    value={visibilityFilter}
                    onChange={(e) => setVisibilityFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All Visibility</option>
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Activity Type Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Activity Type</Label>
                  <select
                    value={activityTypeFilter}
                    onChange={(e) => setActivityTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All Types</option>
                    {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{error}</p>
            <Button className="mt-4" onClick={fetchEvents}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {!loading && events.length > 0 && (
        <div className="space-y-4">
          {events.map((event) => {
            const participantCount = event.participantCount || 0;
            const registrationStatus = getRegistrationStatus(participantCount, event.capacity);
          
          return (
            <Card key={event.id} className="hover:shadow-lg transition-all hover:border-primary/50">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Left Color Bar & Icon */}
                  <div className={`w-full md:w-2 ${getActivityTypeColor(event.activityType).replace('text-', 'bg-').split(' ')[0].replace('100', '500')}`} />
                  
                  <div className="flex-1 p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={`${getActivityTypeColor(event.activityType)} capitalize`}>
                            {event.activityType.replace('_', ' ')}
                          </Badge>
                          <Badge variant={getStatusBadge(event.status)} className="capitalize">
                            {event.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getVisibilityIcon(event.visibility)}
                            <span className="capitalize">{event.visibility.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Event Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {/* Date & Time */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Date & Time</p>
                          <p className="font-semibold text-gray-900 truncate">
                            {formatDate(event.startDate, 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(event.startDate, 'h:mm a')}
                            {event.endDate && ` - ${formatDate(event.endDate, 'h:mm a')}`}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <MapPin className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                          <p className="font-semibold text-gray-900 truncate">{event.location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Participants Section */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">Participants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            {participantCount}/{event.capacity}
                          </span>
                          <Badge variant="outline" className={`text-xs ${registrationStatus.color}`}>
                            {registrationStatus.text}
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            participantCount >= event.capacity ? 'bg-red-500' :
                            participantCount >= event.capacity * 0.8 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((participantCount / event.capacity) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Creator Info */}
                    {event.creator && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pb-4 border-b">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {event.creator.avatarUrl ? (
                            <img src={event.creator.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <span className="text-xs font-medium text-gray-600">
                              {event.creator.firstName?.[0]}{event.creator.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Created by</p>
                          <p className="font-medium text-gray-900">
                            {event.creator.firstName} {event.creator.lastName}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="default" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit Event
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Users className="h-4 w-4 mr-1" />
                        Attendees ({participantCount})
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={CalendarDays}
              title={hasActiveFilters ? "No events match your filters" : "No events yet"}
              description={hasActiveFilters 
                ? "Try adjusting your filters to find events."
                : "Create your first community event to engage with your members."
              }
              actionLabel={hasActiveFilters ? "Clear Filters" : "Create Event"}
              onAction={hasActiveFilters ? clearAllFilters : () => setIsAddEventOpen(true)}
              actionIcon={hasActiveFilters ? X : Plus}
            />
          </CardContent>
        </Card>
      )}

      {/* Add Event Sheet */}
      <Sheet open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Community Event</SheetTitle>
            <SheetDescription>
              Create a new community event or activity
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AddEventForm
              onSuccess={handleAddEventSuccess}
              onCancel={() => setIsAddEventOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalEvents)} of {totalEvents} events
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
