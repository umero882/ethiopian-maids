import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  UserPlus,
  Download,
  User,
  Building2,
  Home,
  Shield,
  Eye,
  CheckCircle2,
  XCircle,
  Info,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminUsersPage.dev');

// Mock users data for development
const mockUsers = [
  {
    id: '1',
    name: 'Sara Ahmed',
    email: 'sara.ahmed@example.com',
    user_type: 'maid',
    is_active: true,
    country: 'Ethiopia',
    phone: '+251912345678',
    created_at: '2023-05-12T10:30:00Z',
    registration_complete: true,
    profile_data: {
      full_name: 'Sara Ahmed',
      nationality: 'Ethiopian',
      experience_years: 5,
      verification_status: 'verified'
    }
  },
  {
    id: '2',
    name: 'Golden Star Agency',
    email: 'info@goldenstar.com',
    user_type: 'agency',
    is_active: true,
    country: 'UAE',
    phone: '+971501234567',
    created_at: '2023-04-08T14:15:00Z',
    registration_complete: true,
    profile_data: {
      agency_name: 'Golden Star Agency',
      license_number: 'DXB-2023-001',
      registration_country: 'UAE'
    }
  },
  {
    id: '3',
    name: 'Ahmed Khalid',
    email: 'ahmed.k@example.com',
    user_type: 'sponsor',
    is_active: true,
    country: 'UAE',
    phone: '+971501234568',
    created_at: '2023-06-01T09:22:00Z',
    registration_complete: true,
    profile_data: {
      full_name: 'Ahmed Khalid',
      city: 'Dubai',
      country: 'UAE'
    }
  },
  {
    id: '4',
    name: 'Harmony Maids Agency',
    email: 'contact@harmonymaids.com',
    user_type: 'agency',
    is_active: false,
    country: 'UAE',
    phone: '+971501234569',
    created_at: '2023-03-15T11:45:00Z',
    registration_complete: true,
    profile_data: {
      agency_name: 'Harmony Maids Agency',
      license_number: 'SHJ-2023-002',
      registration_country: 'UAE'
    }
  },
  {
    id: '5',
    name: 'Makeda Tadesse',
    email: 'makeda.t@example.com',
    user_type: 'maid',
    is_active: true,
    country: 'Ethiopia',
    phone: '+251912345679',
    created_at: '2023-06-10T08:30:00Z',
    registration_complete: false,
    profile_data: {
      full_name: 'Makeda Tadesse',
      nationality: 'Ethiopian',
      experience_years: 2,
      verification_status: 'pending'
    }
  },
  {
    id: '6',
    name: 'Khalid Al-Farsi',
    email: 'khalid.farsi@example.com',
    user_type: 'sponsor',
    is_active: true,
    country: 'Qatar',
    phone: '+97455123456',
    created_at: '2023-05-22T16:10:00Z',
    registration_complete: true,
    profile_data: {
      full_name: 'Khalid Al-Farsi',
      city: 'Doha',
      country: 'Qatar'
    }
  }
];

const AdminUsersPage = () => {
  const { logAdminActivity, canAccess, isDevelopmentMode } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadUsers();
    logAdminActivity('users_view', 'users', 'list');
  }, [logAdminActivity]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedUserType, selectedStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Add some randomization to user data
      const randomizedUsers = mockUsers.map(user => ({
        ...user,
        last_activity: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString()
      }));

      setUsers(randomizedUsers);
    } catch (error) {
      log.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.profile_data?.full_name?.toLowerCase().includes(query) ||
        user.profile_data?.agency_name?.toLowerCase().includes(query)
      );
    }

    // User type filter
    if (selectedUserType !== 'all') {
      filtered = filtered.filter(user => user.user_type === selectedUserType);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => {
        if (selectedStatus === 'active') return user.is_active;
        if (selectedStatus === 'inactive') return !user.is_active;
        return true;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleUserAction = async (action, userId) => {
    if (!canAccess('users', 'write')) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Simulate action delay
      await new Promise(resolve => setTimeout(resolve, 500));

      let actionMessage = '';
      switch (action) {
        case 'activate':
          actionMessage = 'User has been activated successfully.';
          break;
        case 'deactivate':
          actionMessage = 'User has been deactivated successfully.';
          break;
        case 'verify':
          actionMessage = 'User has been verified successfully.';
          break;
        default:
          actionMessage = 'Action completed successfully.';
      }

      await logAdminActivity(`user_${action}`, 'user', userId);

      toast({
        title: 'Success',
        description: `${actionMessage} (Development Mode)`,
      });

      // Update local state to reflect changes
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.id === userId) {
          const updates = {};
          if (action === 'activate') updates.is_active = true;
          if (action === 'deactivate') updates.is_active = false;
          if (action === 'verify' && user.profile_data) {
            updates.profile_data = { ...user.profile_data, verification_status: 'verified' };
          }
          return { ...user, ...updates };
        }
        return user;
      }));

    } catch (error) {
      log.error(`Error ${action} user:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} user. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const getUserTypeIcon = (type) => {
    switch (type) {
      case 'maid':
        return <User className='h-4 w-4' />;
      case 'agency':
        return <Building2 className='h-4 w-4' />;
      case 'sponsor':
        return <Home className='h-4 w-4' />;
      case 'admin':
        return <Shield className='h-4 w-4' />;
      default:
        return <User className='h-4 w-4' />;
    }
  };

  const getUserStatusBadge = (user) => {
    if (!user.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Development Mode Warning */}
      {isDevelopmentMode && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> User management with mock data.
            Actions are simulated and will show success messages.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all platform users {isDevelopmentMode && '(Development Mode)'}
          </p>
        </div>
        <div className="flex gap-2">
          {canAccess('users', 'write') && (
            <Button onClick={() => toast({ title: 'Feature Demo', description: 'Add user feature would open here' })}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
          <Button variant="outline" onClick={() => toast({ title: 'Feature Demo', description: 'Export feature would download data here' })}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* User Management Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Users</CardTitle>
          <CardDescription>
            Total: {filteredUsers.length} users {isDevelopmentMode && '(Mock Data)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedUserType} onValueChange={setSelectedUserType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="maid">Maids</SelectItem>
                <SelectItem value="agency">Agencies</SelectItem>
                <SelectItem value="sponsor">Sponsors</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">Registered</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Verified</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(user.name || user.profile_data?.full_name || user.profile_data?.agency_name || 'U')
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.name || user.profile_data?.full_name || user.profile_data?.agency_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getUserTypeIcon(user.user_type)}
                        <span className="capitalize">{user.user_type}</span>
                      </div>
                    </td>
                    <td className="p-3">{user.country || 'Not specified'}</td>
                    <td className="p-3">{formatDate(user.created_at)}</td>
                    <td className="p-3">{getUserStatusBadge(user)}</td>
                    <td className="p-3">
                      {user.profile_data?.verification_status === 'verified' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: 'User Details',
                              description: `Viewing details for ${user.name}. In full version, this would open a detailed modal.`
                            });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {canAccess('users', 'write') && (
                          <>
                            {user.profile_data?.verification_status !== 'verified' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserAction('verify', user.id)}
                              >
                                Verify
                              </Button>
                            )}

                            <Button
                              variant={user.is_active ? "destructive" : "default"}
                              size="sm"
                              onClick={() => handleUserAction(user.is_active ? 'deactivate' : 'activate', user.id)}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Development Features Info */}
      {isDevelopmentMode && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Info className="h-5 w-5" />
              Available Development Features
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-600 space-y-2">
            <p>• Search and filter users by type and status</p>
            <p>• View user details (simulated with toast messages)</p>
            <p>• Activate/deactivate user accounts</p>
            <p>• Verify user profiles</p>
            <p>• Export user data (simulated)</p>
            <p>• All actions show success/error feedback</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminUsersPage;