import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { usersService, User, UserFilters } from '@/services/users.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/toast';
import { Search, User as UserIcon, ChevronLeft, ChevronRight, Filter, Users, Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import AddUserForm from '@/components/forms/AddUserForm';

export default function UsersPage() {
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    if (user?.tenantId) {
      fetchUsers();
    }
  }, [user?.tenantId, currentPage, filters]);

  const fetchUsers = async () => {
    if (!user?.tenantId) return;
    
    try {
      setLoading(true);
      const response = await usersService.getAll(user.tenantId, {
        ...filters,
        page: currentPage
      });
      setUsers(response.users);
      setTotalUsers(response.total);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      error('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = async (selectedUser: User) => {
    if (!user?.tenantId) return;

    try {
      if (selectedUser.isActive) {
        await usersService.deactivate(user.tenantId, selectedUser.id);
        success('Success', 'User deactivated successfully');
      } else {
        await usersService.activate(user.tenantId, selectedUser.id);
        success('Success', 'User activated successfully');
      }
      fetchUsers();
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      error('Error', 'Failed to update user status');
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    handleFilterChange('email', value || undefined);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'member':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and view all users in your system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Total: {totalUsers} users
          </div>
          <Button onClick={() => setIsAddUserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">Filters</h3>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Role Filter */}
          <Select onValueChange={(value) => handleFilterChange('role', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="trainer">Trainer</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select onValueChange={(value) => handleFilterChange('isActive', value === 'all' ? undefined : value === 'active')}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select onValueChange={(value) => handleFilterChange('sortBy', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created Date</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="role">Role</SelectItem>
              <SelectItem value="fullName">Full Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Select onValueChange={(value) => handleFilterChange('sortOrder', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest</SelectItem>
              <SelectItem value="asc">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user.fullName || 'No name'}
                          </p>
                          <p className="text-sm text-gray-500 truncate max-w-[250px]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserToggle(user);
                        }}
                        className={`${user.isActive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden grid gap-3 sm:grid-cols-2">
        {users.map((user) => (
          <Card
            key={user.id}
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleUserClick(user)}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.fullName || 'No name'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Badge className={`${getRoleColor(user.role)} flex-shrink-0 text-xs`}>
                    {user.role}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      user.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserToggle(user);
                    }}
                    className={`text-xs h-7 px-2 ${user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {users.length === 0 && !loading && (
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={Users}
              title={searchTerm || filters.role || filters.isActive !== undefined ? "No users match your filters" : "No users yet"}
              description={searchTerm || filters.role || filters.isActive !== undefined
                ? "Try adjusting your search or filters to find users."
                : "Users will appear here once they register."
              }
              actionLabel={searchTerm || filters.role || filters.isActive !== undefined ? "Clear Filters" : undefined}
              onAction={searchTerm || filters.role || filters.isActive !== undefined ? clearFilters : undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * filters.limit!) + 1} to {Math.min(currentPage * filters.limit!, totalUsers)} of {totalUsers} users
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

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  User Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserDetails(false)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                {/* Profile Section */}
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-10 w-10 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedUser.fullName || 'N/A'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                    <Badge className={getRoleColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">User ID</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className={`text-sm font-medium ${
                      selectedUser.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowUserDetails(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleUserToggle(selectedUser);
                    setShowUserDetails(false);
                  }}
                  variant={selectedUser.isActive ? "destructive" : "default"}
                >
                  {selectedUser.isActive ? 'Deactivate User' : 'Activate User'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Sheet */}
      <Sheet open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New User</SheetTitle>
            <SheetDescription>
              Create a new user account for your organization
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AddUserForm
              onSuccess={() => {
                setIsAddUserOpen(false);
                fetchUsers();
              }}
              onCancel={() => setIsAddUserOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
