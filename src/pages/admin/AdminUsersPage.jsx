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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MoreHorizontal,
  Search,
  UserPlus,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Users,
  Building2,
  Home,
  Shield,
  Eye,
  Edit,
  Ban,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/lib/databaseClient';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminUsersPage');

const AdminUsersPage = () => {
  const { logAdminActivity, canAccess } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailDialog, setUserDetailDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', user: null });
  const [actionReason, setActionReason] = useState('');

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

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          maid_profiles(full_name, nationality, experience_years, verification_status),
          agency_profiles(agency_name, license_number, country),
          sponsor_profiles(full_name, city, country)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedUsers = data.map(user => ({
        ...user,
        profile_data: user.maid_profiles?.[0] || user.agency_profiles?.[0] || user.sponsor_profiles?.[0] || null
      }));

      setUsers(enrichedUsers);
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
      let updateData = {};
      let logAction = '';

      switch (action) {
        case 'activate':
          updateData = { is_active: true };
          logAction = 'user_activated';
          break;
        case 'deactivate':
          updateData = { is_active: false };
          logAction = 'user_deactivated';
          break;
        case 'suspend':
          updateData = { is_active: false, suspension_reason: actionReason };
          logAction = 'user_suspended';
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      await logAdminActivity(logAction, 'user', userId, { reason: actionReason });

      toast({
        title: 'Success',
        description: `User has been ${action}d successfully.`,
      });

      loadUsers(); // Refresh the list
      setActionDialog({ open: false, type: '', user: null });
      setActionReason('');
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

  const UserDetailDialog = ({ user, open, onClose }) => {
    if (!user) return null;

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getUserTypeIcon(user.user_type)}
              User Details: {user.name || user.profile_data?.full_name || user.profile_data?.agency_name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {(user.name || user.profile_data?.full_name || user.profile_data?.agency_name || 'U')
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {user.name || user.profile_data?.full_name || user.profile_data?.agency_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getUserTypeIcon(user.user_type)}
                        <span className="text-sm text-muted-foreground capitalize">
                          {user.user_type}
                        </span>
                        {getUserStatusBadge(user)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.phone}</span>
                      </div>
                    )}
                    {user.country && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.country}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Joined {formatDate(user.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Type-specific information */}
              {user.user_type === 'maid' && user.profile_data && (
                <Card>
                  <CardHeader>
                    <CardTitle>Maid Profile Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nationality</Label>
                      <p className="text-sm text-muted-foreground">{user.profile_data.nationality || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Experience</Label>
                      <p className="text-sm text-muted-foreground">
                        {user.profile_data.experience_years ? `${user.profile_data.experience_years} years` : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Verification Status</Label>
                      <Badge variant={user.profile_data.verification_status === 'verified' ? 'default' : 'secondary'}>
                        {user.profile_data.verification_status || 'pending'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {user.user_type === 'agency' && user.profile_data && (
                <Card>
                  <CardHeader>
                    <CardTitle>Agency Profile Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">License Number</Label>
                      <p className="text-sm text-muted-foreground">{user.profile_data.license_number || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Registration Country</Label>
                      <p className="text-sm text-muted-foreground">{user.profile_data.country || 'Not specified'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {canAccess('users', 'write') && (
                    <>
                      {user.is_active ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => setActionDialog({ open: true, type: 'suspend', user })}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Suspend User
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full"
                          onClick={() => handleUserAction('activate', user.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Activate User
                        </Button>
                      )}
                    </>
                  )}

                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>

                  <Button variant="outline" size="sm" className="w-full">
                    <Activity className="h-4 w-4 mr-2" />
                    View Activity
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Registration Complete</span>
                    <Badge variant={user.registration_complete ? 'default' : 'secondary'}>
                      {user.registration_complete ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Activity</span>
                    <span className="text-sm text-muted-foreground">2 days ago</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const ActionDialog = ({ open, type, user, onClose }) => (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'suspend' ? 'Suspend User' : 'User Action'}
          </DialogTitle>
          <DialogDescription>
            {type === 'suspend'
              ? `Are you sure you want to suspend ${user?.name || 'this user'}? This action will deactivate their account.`
              : 'Please confirm this action.'
            }
          </DialogDescription>
        </DialogHeader>

        {type === 'suspend' && (
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for suspension</Label>
            <Textarea
              id="reason"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter the reason for suspension..."
              required
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={type === 'suspend' ? 'destructive' : 'default'}
            onClick={() => user && handleUserAction(type, user.id)}
            disabled={type === 'suspend' && !actionReason.trim()}
          >
            {type === 'suspend' ? 'Suspend User' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all platform users
          </p>
        </div>
        <div className="flex gap-2">
          {canAccess('users', 'write') && (
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
          <Button variant="outline">
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
            Total: {filteredUsers.length} users
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
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserDetailDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* Dialogs */}
      <UserDetailDialog
        user={selectedUser}
        open={userDetailDialog}
        onClose={() => {
          setUserDetailDialog(false);
          setSelectedUser(null);
        }}
      />

      <ActionDialog
        open={actionDialog.open}
        type={actionDialog.type}
        user={actionDialog.user}
        onClose={() => {
          setActionDialog({ open: false, type: '', user: null });
          setActionReason('');
        }}
      />
    </div>
  );
};

export default AdminUsersPage;