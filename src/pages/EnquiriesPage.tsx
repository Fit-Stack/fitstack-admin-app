import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  Mail,
  Phone,
  Package,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { marketplaceService, Enquiry } from '@/services/marketplace.service';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export default function EnquiriesPage() {
  const { user } = useAuthStore();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.tenantId) {
      fetchEnquiries();
      fetchStatistics();
    }
  }, [user?.tenantId, statusFilter]);

  const fetchEnquiries = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      setError(null);
      const filters: any = {
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'ASC',
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await marketplaceService.getEnquiries(user.tenantId, filters);
      setEnquiries(response.data || []);
      console.log('✅ Enquiries loaded:', response.data.length, 'enquiries');
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      setError('Failed to load enquiries.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!user?.tenantId) return;

    try {
      const stats = await marketplaceService.getEnquiryStatistics(user.tenantId);
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleStatusUpdate = async (enquiryId: string, newStatus: string, adminNotes?: string) => {
    if (!user?.tenantId) return;

    try {
      const updates: any = { status: newStatus };
      if (adminNotes !== undefined) {
        updates.adminNotes = adminNotes;
      }

      await marketplaceService.updateEnquiry(user.tenantId, enquiryId, updates);
      fetchEnquiries();
      fetchStatistics();
      
      // Update selected enquiry if it's the one being updated
      if (selectedEnquiry?.id === enquiryId) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus as any, adminNotes });
      }
    } catch (error) {
      console.error('Error updating enquiry:', error);
      alert('Failed to update enquiry status');
    }
  };

  const openEnquiryDetails = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'secondary',
      contacted: 'default',
      converted: 'success',
      closed: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'contacted':
        return <MessageSquare className="h-4 w-4" />;
      case 'converted':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string | undefined | null, formatStr: string = 'MMM dd, yyyy HH:mm'): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, formatStr);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredEnquiries = enquiries.filter((enquiry) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const userName = `${enquiry.user?.firstName || ''} ${enquiry.user?.lastName || ''}`.toLowerCase();
      const email = enquiry.user?.email?.toLowerCase() || '';
      const productTitle = enquiry.product?.title?.toLowerCase() || '';
      
      return userName.includes(query) || email.includes(query) || productTitle.includes(query);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Enquiries</h1>
          <p className="text-gray-600 mt-1">Manage customer product enquiries</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-700">
                    {statistics.total || 0}
                  </div>
                  <p className="text-sm text-gray-500">Total Enquiries</p>
                </div>
                <MessageSquare className="h-8 w-8 text-gray-300" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {statistics.pending || 0}
                  </div>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
                <Clock className="h-8 w-8 text-amber-300" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-sky-600">
                    {statistics.contacted || 0}
                  </div>
                  <p className="text-sm text-gray-500">Contacted</p>
                </div>
                <MessageSquare className="h-8 w-8 text-sky-300" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {statistics.converted || 0}
                  </div>
                  <p className="text-sm text-gray-500">Converted</p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by customer name, email, or product..."
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
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading enquiries...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <p className="text-orange-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && filteredEnquiries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? 'No enquiries found matching your filters.'
                : 'No enquiries yet. Enquiries will appear here when customers show interest in products.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Enquiries List */}
      {!loading && filteredEnquiries.length > 0 && (
        <div className="space-y-4">
          {filteredEnquiries.map((enquiry) => (
            <Card
              key={enquiry.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openEnquiryDetails(enquiry)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Enquiry Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getStatusBadge(enquiry.status)} className="flex items-center gap-1">
                            {getStatusIcon(enquiry.status)}
                            {enquiry.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(enquiry.createdAt)}
                          </span>
                        </div>

                        {/* Product Info */}
                        {enquiry.product && (
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {enquiry.product.title}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({enquiry.product.category})
                            </span>
                          </div>
                        )}

                        {/* Customer Info */}
                        {enquiry.user && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="h-4 w-4" />
                              <span>
                                {enquiry.user.firstName} {enquiry.user.lastName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span>{enquiry.user.email}</span>
                            </div>
                            {enquiry.user.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>{enquiry.user.phone}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Preview */}
                        {enquiry.message && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {enquiry.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {enquiry.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(enquiry.id, 'contacted');
                        }}
                      >
                        Mark Contacted
                      </Button>
                    )}
                    {enquiry.status === 'contacted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(enquiry.id, 'converted');
                        }}
                      >
                        Mark Converted
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEnquiryDetails(enquiry);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enquiry Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Enquiry Details</SheetTitle>
            <SheetDescription>
              View and manage enquiry information
            </SheetDescription>
          </SheetHeader>

          {selectedEnquiry && (
            <div className="mt-6 space-y-6">
              {/* Status */}
              <div>
                <Label>Status</Label>
                <div className="mt-2 flex gap-2">
                  {['pending', 'contacted', 'converted', 'closed'].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedEnquiry.status === status ? 'default' : 'outline'}
                      onClick={() => handleStatusUpdate(selectedEnquiry.id, status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Product Information */}
              {selectedEnquiry.product && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Product Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{selectedEnquiry.product.title}</span>
                    </div>
                    <p className="text-sm text-gray-600">{selectedEnquiry.product.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">Category: {selectedEnquiry.product.category}</span>
                      {selectedEnquiry.product.brand && (
                        <span className="text-gray-600">Brand: {selectedEnquiry.product.brand}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Information */}
              {selectedEnquiry.user && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>
                        {selectedEnquiry.user.firstName} {selectedEnquiry.user.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${selectedEnquiry.user.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedEnquiry.user.email}
                      </a>
                    </div>
                    {selectedEnquiry.user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a
                          href={`tel:${selectedEnquiry.user.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedEnquiry.user.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enquiry Message */}
              {selectedEnquiry.message && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Customer Message</h3>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedEnquiry.message}</p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="border-t pt-4">
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  defaultValue={selectedEnquiry.adminNotes || ''}
                  placeholder="Add internal notes about this enquiry..."
                  rows={4}
                  onBlur={(e) => {
                    if (e.target.value !== selectedEnquiry.adminNotes) {
                      handleStatusUpdate(
                        selectedEnquiry.id,
                        selectedEnquiry.status,
                        e.target.value
                      );
                    }
                  }}
                />
              </div>

              {/* Timestamps */}
              <div className="border-t pt-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Created: {formatDate(selectedEnquiry.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Updated: {formatDate(selectedEnquiry.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
