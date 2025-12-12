import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Megaphone, 
  Pin, 
  Archive, 
  Send, 
  Edit, 
  Trash2,
  AlertTriangle,
  Calendar,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { announcementsService, Announcement } from '@/services/announcements.service';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import AddAnnouncementForm from '@/components/forms/AddAnnouncementForm';

export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true); // Show loading on mount
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.tenantId) {
      fetchAnnouncements().catch(err => {
        console.error('Failed to fetch on mount:', err);
      });
    }
  }, [user?.tenantId, statusFilter]);

  const fetchAnnouncements = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      setError(null);
      const filters: any = {
        activeOnly: false, // Show all announcements including drafts, expired, etc.
        pinnedOnly: false,
        page: 1,
        limit: 20,
      };
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      const data = await announcementsService.getAll(user.tenantId, filters);
      setAnnouncements(Array.isArray(data) ? data : []);
      console.log('✅ Announcements loaded:', Array.isArray(data) ? data.length : 0, 'announcements');
      console.log('📊 Announcements data:', data);
    } catch (error: any) {
      const status = error?.response?.status;
      console.error('❌ Error fetching announcements:', error);
      console.error('❌ Error response:', error?.response?.data);
      
      // Don't show error for 404 (endpoint not implemented yet)
      if (status === 404) {
        setError('Announcements API endpoint not available yet. Backend may need to be updated.');
      } else if (status === 401 || status === 403) {
        setError('Authentication error. Please check your permissions.');
      } else {
        setError('Failed to load announcements. API may not be deployed yet.');
      }
      setAnnouncements([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsAddOpen(false);
    setIsEditOpen(false);
    setSelectedAnnouncement(null);
    fetchAnnouncements().catch(err => console.error('Refresh failed:', err));
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user?.tenantId) return;
    
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }

    try {
      await announcementsService.delete(user.tenantId, id);
      fetchAnnouncements().catch(err => console.error('Refresh failed:', err));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement');
    }
  };

  const handlePublish = async (id: string) => {
    if (!user?.tenantId) return;
    try {
      await announcementsService.publish(user.tenantId, id);
      fetchAnnouncements().catch(err => console.error('Refresh failed:', err));
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Failed to publish announcement');
    }
  };

  const handlePin = async (id: string, isPinned: boolean) => {
    if (!user?.tenantId) return;
    try {
      if (isPinned) {
        await announcementsService.unpin(user.tenantId, id);
      } else {
        await announcementsService.pin(user.tenantId, id);
      }
      fetchAnnouncements().catch(err => console.error('Refresh failed:', err));
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleArchive = async (id: string) => {
    if (!user?.tenantId) return;
    try {
      await announcementsService.archive(user.tenantId, id);
      fetchAnnouncements().catch(err => console.error('Refresh failed:', err));
    } catch (error) {
      console.error('Error archiving:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      scheduled: 'default',
      published: 'success',
      expired: 'destructive',
      archived: 'outline',
    };
    return variants[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      low: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[priority] || colors.low;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Megaphone className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string | null | undefined, formatStr: string = 'MMM dd, yyyy h:mm a'): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, formatStr);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        announcement.title.toLowerCase().includes(query) ||
        announcement.content.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: announcements.length,
    published: announcements.filter(a => a.status === 'published').length,
    draft: announcements.filter(a => a.status === 'draft').length,
    pinned: announcements.filter(a => a.isPinned).length,
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <p className="text-blue-800">
            📢 <strong>New Feature:</strong> Announcements management is now available! 
            {error && " (Backend API may not be deployed yet - showing demo interface)"}
          </p>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Create and manage announcements for your members</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <Megaphone className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.published}</div>
                <p className="text-sm text-gray-500">Published</p>
              </div>
              <Send className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">{stats.draft}</div>
                <p className="text-sm text-gray-500">Drafts</p>
              </div>
              <Edit className="h-8 w-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.pinned}</div>
                <p className="text-sm text-gray-500">Pinned</p>
              </div>
              <Pin className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status Filter</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="expired">Expired</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading announcements...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAnnouncements().catch(err => console.error(err))}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      {!loading && filteredAnnouncements.length > 0 && (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left side - Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {announcement.isPinned && (
                            <Badge variant="outline" className="bg-blue-50">
                              <Pin className="h-3 w-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                          <Badge variant={getStatusBadge(announcement.status)} className="capitalize">
                            {announcement.status}
                          </Badge>
                          <Badge className={`${getPriorityColor(announcement.priority)} capitalize`}>
                            {announcement.priority}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1 capitalize">
                            {getCategoryIcon(announcement.category)}
                            {announcement.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {announcement.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {announcement.content}
                        </p>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="capitalize">{announcement.targetAudience.replace('_', ' ')}</span>
                      </div>
                      {announcement.publishedAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Published: {formatDate(announcement.publishedAt, 'MMM dd, yyyy')}
                        </div>
                      )}
                      {announcement.scheduledFor && announcement.status === 'scheduled' && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Scheduled: {formatDate(announcement.scheduledFor)}
                        </div>
                      )}
                      {announcement.expiresAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Expires: {formatDate(announcement.expiresAt, 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {announcement.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handlePublish(announcement.id)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePin(announcement.id, announcement.isPinned)}
                    >
                      <Pin className="h-4 w-4 mr-1" />
                      {announcement.isPinned ? 'Unpin' : 'Pin'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(announcement)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {announcement.status !== 'archived' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArchive(announcement.id)}
                      >
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAnnouncements.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? 'No announcements found matching your filters.'
                : 'No announcements yet. Create your first announcement to get started!'}
            </p>
            <Button className="mt-4" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Announcement Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Announcement</SheetTitle>
            <SheetDescription>
              Create a new announcement for your members
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AddAnnouncementForm
              onSuccess={handleSuccess}
              onCancel={() => setIsAddOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Announcement Sheet */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Announcement</SheetTitle>
            <SheetDescription>
              Update announcement details
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedAnnouncement && (
              <AddAnnouncementForm
                announcement={selectedAnnouncement}
                onSuccess={handleSuccess}
                onCancel={() => {
                  setIsEditOpen(false);
                  setSelectedAnnouncement(null);
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
