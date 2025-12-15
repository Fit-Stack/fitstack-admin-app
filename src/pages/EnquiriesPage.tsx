import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
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
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
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

// Sort options for enquiries
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'status', label: 'Status' },
  { value: 'customerName', label: 'Customer Name' },
];

// Status options
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'text-amber-600' },
  { value: 'contacted', label: 'Contacted', color: 'text-blue-600' },
  { value: 'converted', label: 'Converted', color: 'text-green-600' },
  { value: 'closed', label: 'Closed', color: 'text-gray-600' },
];

export default function EnquiriesPage() {
  const { user } = useAuthStore();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

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
  }, [debouncedSearch, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchEnquiries();
      fetchStatistics();
    }
  }, [user?.tenantId, statusFilter, currentPage, debouncedSearch, sortBy, sortOrder]);

  const fetchEnquiries = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      setError(null);
      const filters: any = {
        page: currentPage,
        limit: limit,
        sortBy,
        sortOrder,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }

      const response = await marketplaceService.getEnquiries(user.tenantId, filters);
      setEnquiries(response.data || []);
      setTotalEnquiries(response.meta.total);
      setTotalPages(Math.ceil(response.meta.total / limit));
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      setError('Failed to load enquiries.');
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, currentPage, debouncedSearch, statusFilter, sortBy, sortOrder]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('createdAt');
    setSortOrder('DESC');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all';

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

      {/* Search and Filter Bar */}
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
                  placeholder="Search by customer name or email..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                {/* Status Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="all">All Status</option>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</Label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Order</Label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="DESC">Newest First</option>
                    <option value="ASC">Oldest First</option>
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
                        onClick={() => setStatusFilter(statusFilter === opt.value ? 'all' : opt.value)}
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
      {!loading && enquiries.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={MessageSquare}
              title={hasActiveFilters ? "No enquiries match your filters" : "No enquiries yet"}
              description={hasActiveFilters 
                ? "Try adjusting your search or filters to find enquiries."
                : "Enquiries will appear here when customers show interest in your products."
              }
              actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
              onAction={hasActiveFilters ? clearAllFilters : undefined}
              actionIcon={hasActiveFilters ? X : undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Enquiries List */}
      {!loading && enquiries.length > 0 && (
        <div className="space-y-4">
          {enquiries.map((enquiry) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalEnquiries)} of {totalEnquiries} enquiries
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
