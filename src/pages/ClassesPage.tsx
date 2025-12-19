import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Calendar, Users, Loader2, ChevronLeft, ChevronRight, BookOpen, X } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { classesService, Class, ClassFilters } from '@/services/classes.service';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import AddClassForm from '@/components/forms/AddClassForm';

// Class status options
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
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

// Level options
const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function ClassesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [publishingClassId, setPublishingClassId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  const hasActiveFilters = searchQuery || selectedStatus || selectedCategory || selectedLevel;

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
  }, [debouncedSearch, selectedStatus, selectedCategory, selectedLevel]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchClasses();
    }
  }, [user?.tenantId, selectedStatus, selectedCategory, selectedLevel, currentPage]);

  const fetchClasses = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      const filters: ClassFilters = {
        page: currentPage,
        limit: limit,
      };
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedLevel) filters.level = selectedLevel;

      const response = await classesService.getAll(user.tenantId, filters);
      setClasses(response.classes || []);
      setTotalClasses(response.total || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, currentPage, selectedStatus, selectedCategory, selectedLevel]);

  const handleAddClassSuccess = () => {
    setIsAddClassOpen(false);
    fetchClasses();
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedCategory('');
    setSelectedLevel('');
  };

  const handlePublishClass = async (classId: string) => {
    if (!user?.tenantId) return;

    try {
      setPublishingClassId(classId);
      await classesService.publish(user.tenantId, classId);
      alert('Class published successfully!');
      fetchClasses();
    } catch (error: any) {
      console.error('Error publishing class:', error);
      alert(error.response?.data?.message || 'Failed to publish class.');
    } finally {
      setPublishingClassId(null);
    }
  };

  // Client-side search filtering
  const filteredClasses = debouncedSearch
    ? (classes || []).filter((classItem) =>
        classItem.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        classItem.category.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : classes;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      published: 'success',
      draft: 'secondary',
      archived: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      Beginner: 'text-green-600 bg-green-100',
      Intermediate: 'text-yellow-600 bg-yellow-100',
      Advanced: 'text-red-600 bg-red-100',
    };
    return colors[difficulty] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-1">Manage your fitness classes</p>
        </div>
        <Button onClick={() => setIsAddClassOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{classes.length}</div>
            <p className="text-sm text-gray-600">Total Classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {classes.filter(c => c.status === 'published').length}
            </div>
            <p className="text-sm text-gray-600">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {classes.filter(c => c.status === 'ongoing').length}
            </div>
            <p className="text-sm text-gray-600">Ongoing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {classes.filter(c => c.status === 'draft').length}
            </div>
            <p className="text-sm text-gray-600">Drafts</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            {/* Search and Toggle Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search classes by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Toggle Filters Button */}
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

              {/* Clear Filters */}
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
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
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
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All Categories</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Level Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Level</Label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All Levels</option>
                    {LEVEL_OPTIONS.map((opt) => (
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
          <p className="mt-2 text-gray-600">Loading classes...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredClasses.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={BookOpen}
              title={hasActiveFilters ? "No classes match your search" : "No classes yet"}
              description={hasActiveFilters 
                ? "Try adjusting your search or filters to find classes."
                : "Create your first class to start offering fitness programs."
              }
              actionLabel={hasActiveFilters ? "Clear Filters" : "Add Class"}
              onAction={hasActiveFilters ? clearAllFilters : () => setIsAddClassOpen(true)}
              actionIcon={hasActiveFilters ? X : Plus}
            />
          </CardContent>
        </Card>
      )}

      {/* Classes Grid */}
      {!loading && filteredClasses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
              {classItem.imageUrl && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={classItem.imageUrl}
                    alt={classItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{classItem.title}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{classItem.category}</p>
                  </div>
                  <Badge variant={getStatusBadge(classItem.status)}>
                    {classItem.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {classItem.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Level:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(classItem.level)}`}>
                      {classItem.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {format(new Date(classItem.startDate), 'MMM d, yyyy')} - {format(new Date(classItem.endDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {classItem.enrolled || 0}/{classItem.capacity}
                    </span>
                  </div>
                  {classItem.price && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">
                        {classItem.currency} {classItem.price}
                      </span>
                    </div>
                  )}
                  {classItem.instructor && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Instructor:</span>
                      <span className="font-medium">
                        {classItem.instructor.firstName} {classItem.instructor.lastName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  {classItem.status === 'draft' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePublishClass(classItem.id)}
                      disabled={publishingClassId === classItem.id}
                    >
                      {publishingClassId === classItem.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        'Publish'
                      )}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/classes/${classItem.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Class Side Panel */}
      <Sheet open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Class</SheetTitle>
            <SheetDescription>
              Fill in the details below to create a new fitness class
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AddClassForm
              onSuccess={handleAddClassSuccess}
              onCancel={() => setIsAddClassOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalClasses)} of {totalClasses} classes
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
