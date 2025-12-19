import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, Clock, Users, Repeat, ChevronLeft, ChevronRight, CalendarDays, Filter, X, Search } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { sessionsService, Session, SessionFilters } from '@/services/sessions.service';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import AddSessionForm from '@/components/forms/AddSessionForm';

// Session status options
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Activity category options
const CATEGORY_OPTIONS = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'zumba', label: 'Zumba' },
  { value: 'martial_arts', label: 'Martial Arts' },
  { value: 'functional', label: 'Functional' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
];

export default function SessionsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const hasActiveFilters = searchQuery || statusFilter || categoryFilter;

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
  }, [debouncedSearch, statusFilter, categoryFilter]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchSessions();
    }
  }, [user?.tenantId, currentPage, debouncedSearch, statusFilter, categoryFilter]);

  const fetchSessions = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      
      const filters: SessionFilters = {
        page: currentPage,
        limit: limit,
      };

      if (debouncedSearch) filters.search = debouncedSearch;
      if (statusFilter) filters.status = statusFilter;
      if (categoryFilter) filters.category = categoryFilter;

      const response = await sessionsService.getAll(user.tenantId, filters);
      setSessions(response.sessions || []);
      setTotalSessions(response.total || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, currentPage, debouncedSearch, statusFilter, categoryFilter]);

  const handleAddSessionSuccess = () => {
    setIsAddSessionOpen(false);
    fetchSessions();
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCategoryFilter('');
  };

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
                  placeholder="Search sessions by title or description..."
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

                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Category</Label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All Categories</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Status Buttons */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Quick Filter</Label>
                  <div className="flex flex-wrap gap-1">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === opt.value ? '' : opt.value)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          statusFilter === opt.value
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              {sessions.length}
            </div>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {sessions.filter(s => s.isPaid).length}
            </div>
            <p className="text-sm text-gray-600">Paid Sessions</p>
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
      {!loading && sessions.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={CalendarDays}
              title={hasActiveFilters ? "No sessions match your filters" : "No sessions yet"}
              description={hasActiveFilters 
                ? "Try adjusting your filters to find sessions."
                : "Schedule your first session to start managing your fitness activities."
              }
              actionLabel={hasActiveFilters ? "Clear Filters" : "Schedule Session"}
              onAction={hasActiveFilters ? clearAllFilters : () => setIsAddSessionOpen(true)}
              actionIcon={hasActiveFilters ? X : Plus}
            />
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      {!loading && sessions.length > 0 && (
        <div className="space-y-4">
          {sessions.map((session) => {
            const instructor = session.instructor;
            // Mock enrollment for display (since Session interface doesn't have currentEnrollment)
            const capacity = session.capacity || 0;
            const mockEnrollment = Math.floor(capacity * 0.7);
            const enrollmentStatus = getEnrollmentStatus(
              mockEnrollment,
              capacity
            );

            return (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Session Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{session.category}</Badge>
                          {session.isPaid && (
                            <Badge variant="secondary" className="text-xs">Paid</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            <Repeat className="h-3 w-3 mr-1" />
                            {session.recurrencePattern.type}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {session.title}
                          </p>
                          {instructor?.user && (
                            <p className="text-sm text-gray-500 mt-1">
                              with {instructor.user.firstName} {instructor.user.lastName}
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
                          <span>{format(new Date(session.recurrencePattern.startDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            {session.recurrencePattern.time} ({session.recurrencePattern.durationMinutes}min)
                          </span>
                        </div>
                        {session.capacity && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-gray-600" />
                            <span className="font-medium">
                              {mockEnrollment}/{session.capacity}
                            </span>
                            <span className={`text-xs ${enrollmentStatus.color}`}>
                              {enrollmentStatus.text}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Repeat className="h-4 w-4" />
                        <span className="capitalize">{session.recurrencePattern.type}</span>
                        {session.recurrencePattern.days && (
                          <span className="text-xs">• {session.recurrencePattern.days.join(', ')}</span>
                        )}
                        <span className="text-xs">• Until {format(new Date(session.recurrencePattern.endDate), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 lg:flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 lg:flex-none"
                        onClick={() => navigate(`/sessions/${session.id}`)}
                      >
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 lg:flex-none">
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {capacity > 0 && (
                    <div className="mt-4">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${(mockEnrollment / capacity) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalSessions)} of {totalSessions} sessions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
