import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Key,
  Activity,
  UserPlus,
  Download,
  Upload
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockAdminsData = [
  {
    id: 'admin_001',
    email: 'sarah.johnson@ethiomaids.com',
    full_name: 'Sarah Johnson',
    phone: '+1234567890',
    role: 'super_admin',
    department: 'Operations',
    is_active: true,
    last_login_at: '2024-03-20T18:45:00Z',
    created_at: '2023-05-15T08:30:00Z',
    permissions: ['*'],
    location: 'New York, USA',
    session_count: 1247,
    actions_performed: 8934,
    last_activity: 'User verification approved',
    assigned_regions: ['North America', 'Europe'],
    two_factor_enabled: true,
    avatar_url: null
  },
  {
    id: 'admin_002',
    email: 'ahmed.hassan@ethiomaids.com',
    full_name: 'Ahmed Hassan',
    phone: '+966501234567',
    role: 'admin',
    department: 'Customer Success',
    is_active: true,
    last_login_at: '2024-03-20T16:30:00Z',
    created_at: '2023-08-10T10:15:00Z',
    permissions: ['users.read', 'users.write', 'content.moderate', 'support.write'],
    location: 'Riyadh, Saudi Arabia',
    session_count: 892,
    actions_performed: 5678,
    last_activity: 'Sponsor profile reviewed',
    assigned_regions: ['Middle East'],
    two_factor_enabled: true,
    avatar_url: null
  },
  {
    id: 'admin_003',
    email: 'fatima.mohammed@ethiomaids.com',
    full_name: 'Fatima Mohammed',
    phone: '+971501987654',
    role: 'moderator',
    department: 'Content Moderation',
    is_active: true,
    last_login_at: '2024-03-19T14:20:00Z',
    created_at: '2023-11-20T12:45:00Z',
    permissions: ['users.read', 'content.moderate', 'support.read'],
    location: 'Dubai, UAE',
    session_count: 634,
    actions_performed: 3421,
    last_activity: 'Content flagged for review',
    assigned_regions: ['UAE', 'Qatar'],
    two_factor_enabled: false,
    avatar_url: null
  },
  {
    id: 'admin_004',
    email: 'james.wilson@ethiomaids.com',
    full_name: 'James Wilson',
    phone: '+447700123456',
    role: 'support_agent',
    department: 'Customer Support',
    is_active: false,
    last_login_at: '2024-03-10T09:15:00Z',
    created_at: '2024-01-05T14:30:00Z',
    permissions: ['support.read', 'support.write', 'communications.write'],
    location: 'London, UK',
    session_count: 156,
    actions_performed: 789,
    last_activity: 'Support ticket resolved',
    assigned_regions: ['UK', 'Ireland'],
    two_factor_enabled: true,
    avatar_url: null
  },
  {
    id: 'admin_005',
    email: 'maria.gonzalez@ethiomaids.com',
    full_name: 'Maria Gonzalez',
    phone: '+34612345678',
    role: 'financial_admin',
    department: 'Finance',
    is_active: true,
    last_login_at: '2024-03-20T11:30:00Z',
    created_at: '2023-07-25T16:00:00Z',
    permissions: ['financial.read', 'financial.write', 'transactions.read'],
    location: 'Madrid, Spain',
    session_count: 445,
    actions_performed: 2134,
    last_activity: 'Payment dispute resolved',
    assigned_regions: ['Spain', 'Portugal'],
    two_factor_enabled: true,
    avatar_url: null
  }
];

const AdminAdminsPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [adminsData, setAdminsData] = useState(mockAdminsData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadAdminsData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('admins_page_view', 'admin_users', 'admins');
      setLoading(false);
    };

    loadAdminsData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredAdmins = useMemo(() => {
    return adminsData.filter(admin => {
      const matchesSearch =
        admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.phone.includes(searchTerm) ||
        admin.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && admin.is_active) ||
        (statusFilter === 'inactive' && !admin.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [adminsData, searchTerm, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusToggle = async (adminId, currentStatus) => {
    try {
      setAdminsData(prev =>
        prev.map(admin =>
          admin.id === adminId
            ? { ...admin, is_active: !currentStatus }
            : admin
        )
      );

      await logAdminActivity(`admin_status_${!currentStatus ? 'activate' : 'deactivate'}`, 'admin', adminId);

      toast({
        title: 'Status Updated',
        description: `Admin has been ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update admin status.',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800' },
      admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800' },
      moderator: { label: 'Moderator', color: 'bg-green-100 text-green-800' },
      support_agent: { label: 'Support', color: 'bg-yellow-100 text-yellow-800' },
      financial_admin: { label: 'Finance', color: 'bg-orange-100 text-orange-800' },
      content_moderator: { label: 'Content', color: 'bg-teal-100 text-teal-800' }
    };

    const config = roleConfig[role] || { label: role, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (isActive) => {
    return isActive
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
  };

  const AdminDetailDialog = ({ admin, open, onOpenChange }) => {
    if (!admin) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={admin.avatar_url} />
                <AvatarFallback>{admin.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{admin.full_name}</p>
                <p className="text-sm text-muted-foreground">{admin.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{admin.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{admin.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Department:</span>
                  <span className="text-sm">{admin.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined {new Date(admin.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Role & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Role & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Role:</span>
                  {getRoleBadge(admin.role)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(admin.is_active)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">2FA Enabled:</span>
                  <Badge className={admin.two_factor_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {admin.two_factor_enabled ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Last Login:</span>
                  <span className="text-sm">{new Date(admin.last_login_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {admin.permissions.map((permission, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {permission === '*' ? 'All Permissions' : permission.replace('_', ' ').replace('.', ': ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity & Regions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity & Regions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sessions:</span>
                  <Badge variant="secondary">{admin.session_count?.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Actions:</span>
                  <Badge variant="secondary">{admin.actions_performed?.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Last Activity:</span>
                  <span className="text-sm text-muted-foreground">{admin.last_activity}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Assigned Regions:</span>
                  <div className="flex flex-wrap gap-1">
                    {admin.assigned_regions.map((region, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => handleStatusToggle(admin.id, admin.is_active)}
            >
              {admin.is_active ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
          <p className="text-muted-foreground">
            Manage administrator accounts, roles, and permissions {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminsData.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminsData.filter(a => a.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((adminsData.filter(a => a.is_active).length / adminsData.length) * 100)}% active admins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA Enabled</CardTitle>
            <Key className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminsData.filter(a => a.two_factor_enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((adminsData.filter(a => a.two_factor_enabled).length / adminsData.length) * 100)}% with 2FA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminsData.reduce((sum, a) => sum + a.session_count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search admins by name, email, phone, department, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="support_agent">Support Agent</SelectItem>
                <SelectItem value="financial_admin">Financial Admin</SelectItem>
                <SelectItem value="content_moderator">Content Moderator</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Administrators ({filteredAdmins.length})</CardTitle>
          <CardDescription>
            Complete list of administrator accounts with roles, permissions, and activity status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Security</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={admin.avatar_url} />
                        <AvatarFallback>{admin.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{admin.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {admin.department}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>{admin.email}</div>
                      <div className="text-muted-foreground">{admin.phone}</div>
                      <div className="text-muted-foreground">{admin.location}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getRoleBadge(admin.role)}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(admin.is_active)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {admin.session_count?.toLocaleString()} sessions
                      </div>
                      <div className="text-muted-foreground">
                        {admin.actions_performed?.toLocaleString()} actions
                      </div>
                      <div className="text-muted-foreground">
                        Last: {new Date(admin.last_login_at).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <Badge className={admin.two_factor_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        2FA {admin.two_factor_enabled ? 'On' : 'Off'}
                      </Badge>
                      <div className="text-muted-foreground mt-1">
                        {admin.permissions.length === 1 && admin.permissions[0] === '*'
                          ? 'All permissions'
                          : `${admin.permissions.length} permissions`
                        }
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusToggle(admin.id, admin.is_active)}
                        >
                          {admin.is_active ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Key className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAdmins.length)} of {filteredAdmins.length} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Detail Dialog */}
      <AdminDetailDialog
        admin={selectedAdmin}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminAdminsPage;