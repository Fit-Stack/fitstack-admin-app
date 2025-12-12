import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Calendar, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { classesService, Class } from '@/services/classes.service';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import AddClassForm from '@/components/forms/AddClassForm';

export default function ClassesPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);

  useEffect(() => {
    if (user?.tenantId) {
      fetchClasses();
    }
  }, [user?.tenantId, selectedStatus]);

  const fetchClasses = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      const filters: any = {};
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }
      const data = await classesService.getAll(user.tenantId, filters);
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClassSuccess = () => {
    setIsAddClassOpen(false);
    fetchClasses(); // Refresh the list
  };

  const filteredClasses = classes.filter((classItem) =>
    classItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock data as fallback - matches Class interface
  const mockClasses: Class[] = [
    {
      id: '1',
      title: 'HIIT Training',
      description: 'High-intensity interval training for maximum results',
      instructorId: 'mock-instructor-1',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      schedule: {
        days: ['monday', 'wednesday', 'friday'],
        timeSlots: [{ startTime: '09:00', endTime: '09:45' }],
      },
      capacity: 20,
      enrolled: 15,
      pricingType: 'course_fee',
      price: 5000,
      currency: 'INR',
      category: 'cardio',
      level: 'advanced',
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Yoga Flow',
      description: 'Gentle yoga flow for flexibility and relaxation',
      instructorId: 'mock-instructor-2',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      schedule: {
        days: ['tuesday', 'thursday'],
        timeSlots: [{ startTime: '07:00', endTime: '08:00' }],
      },
      capacity: 15,
      enrolled: 12,
      pricingType: 'membership',
      currency: 'INR',
      category: 'yoga',
      level: 'beginner',
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Spin Class',
      description: 'Indoor cycling for cardio endurance',
      instructorId: 'mock-instructor-3',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      schedule: {
        days: ['monday', 'wednesday', 'friday'],
        timeSlots: [{ startTime: '18:00', endTime: '18:50' }],
      },
      capacity: 25,
      enrolled: 20,
      pricingType: 'subscription',
      price: 3000,
      currency: 'INR',
      category: 'cardio',
      level: 'intermediate',
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const displayClasses = filteredClasses.length > 0 ? filteredClasses : (loading ? [] : mockClasses);

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
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
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
      {!loading && displayClasses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No classes found. Create your first class to get started!</p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Classes Grid */}
      {!loading && displayClasses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayClasses.map((classItem) => (
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
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
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
    </div>
  );
}
