import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Mock data - would be fetched from an API in a real application
const mockUsers = [
  {
    id: 1,
    name: 'Sara Ahmed',
    email: 'sara.ahmed@example.com',
    type: 'maid',
    status: 'active',
    verified: true,
    registeredDate: '2023-05-12T10:30:00',
    location: 'Dubai, UAE',
    avatar: '',
  },
  {
    id: 2,
    name: 'Golden Star Agency',
    email: 'info@goldenstar.com',
    type: 'agency',
    status: 'active',
    verified: true,
    registeredDate: '2023-04-08T14:15:00',
    location: 'Abu Dhabi, UAE',
    avatar: '',
  },
  {
    id: 3,
    name: 'Ahmed Khalid',
    email: 'ahmed.k@example.com',
    type: 'sponsor',
    status: 'active',
    verified: true,
    registeredDate: '2023-06-01T09:22:00',
    location: 'Dubai, UAE',
    avatar: '',
  },
  {
    id: 4,
    name: 'Harmony Maids Agency',
    email: 'contact@harmonymaids.com',
    type: 'agency',
    status: 'suspended',
    verified: true,
    registeredDate: '2023-03-15T11:45:00',
    location: 'Sharjah, UAE',
    avatar: '',
  },
  {
    id: 5,
    name: 'Makeda Tadesse',
    email: 'makeda.t@example.com',
    type: 'maid',
    status: 'pending',
    verified: false,
    registeredDate: '2023-06-10T08:30:00',
    location: 'Riyadh, KSA',
    avatar: '',
  },
  {
    id: 6,
    name: 'Khalid Al-Farsi',
    email: 'khalid.farsi@example.com',
    type: 'sponsor',
    status: 'active',
    verified: true,
    registeredDate: '2023-05-22T16:10:00',
    location: 'Doha, Qatar',
    avatar: '',
  },
  {
    id: 7,
    name: 'Elite Services Agency',
    email: 'support@eliteservices.com',
    type: 'agency',
    status: 'active',
    verified: true,
    registeredDate: '2023-02-18T13:40:00',
    location: 'Kuwait City, Kuwait',
    avatar: '',
  },
  {
    id: 8,
    name: 'Tigist Bekele',
    email: 'tigist.b@example.com',
    type: 'maid',
    status: 'inactive',
    verified: true,
    registeredDate: '2023-04-30T10:15:00',
    location: 'Jeddah, KSA',
    avatar: '',
  },
];

const PlatformUsersPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(mockUsers);
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Handle search and filter
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    filterUsers(query, selectedStatus);
  };

  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    filterUsers(searchQuery, status);
  };

  const filterUsers = (query, status) => {
    let filtered = mockUsers.filter(
      (user) =>
        (user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)) &&
        (status === 'all' || user.status === status)
    );

    setFilteredUsers(filtered);
  };

  const handleVerifyUser = (userId) => {
    toast({
      title: 'User Verified',
      description: 'The user has been successfully verified.',
      variant: 'success',
    });

    // In a real app, this would call an API to update the user's status
    const updatedUsers = filteredUsers.map((user) =>
      user.id === userId ? { ...user, verified: true } : user
    );

    setFilteredUsers(updatedUsers);
  };

  const handleStatusChange = (userId, newStatus) => {
    const statusMessages = {
      active: 'The user has been activated.',
      suspended: 'The user has been suspended.',
      inactive: 'The user has been deactivated.',
    };

    toast({
      title: `User Status Updated`,
      description:
        statusMessages[newStatus] || "The user's status has been updated.",
      variant: newStatus === 'active' ? 'success' : 'default',
    });

    // In a real app, this would call an API to update the user's status
    const updatedUsers = filteredUsers.map((user) =>
      user.id === userId ? { ...user, status: newStatus } : user
    );

    setFilteredUsers(updatedUsers);
  };

  const getUserTypeIcon = (type) => {
    switch (type) {
      case 'maid':
        return <User className='h-4 w-4' />;
      case 'agency':
        return <Building2 className='h-4 w-4' />;
      case 'sponsor':
        return <Home className='h-4 w-4' />;
      default:
        return <User className='h-4 w-4' />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>Platform Users</h1>
          <p className='text-gray-500 mt-1'>
            Manage and monitor all users on the platform
          </p>
        </div>
        <div className='flex flex-col sm:flex-row gap-2'>
          <Button variant='outline' className='flex items-center gap-2'>
            <UserPlus className='h-4 w-4' />
            Add User
          </Button>
          <Button variant='outline' className='flex items-center gap-2'>
            <Download className='h-4 w-4' />
            Export
          </Button>
        </div>
      </div>

      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View, filter and manage all platform users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col md:flex-row justify-between mb-6 gap-4'>
            <div className='relative w-full md:w-96'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search users...'
                className='pl-8'
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className='flex gap-2'>
              <Select
                onValueChange={handleStatusFilterChange}
                defaultValue='all'
              >
                <SelectTrigger className='w-[180px]'>
                  <div className='flex items-center gap-2'>
                    <Filter className='h-4 w-4' />
                    <SelectValue placeholder='Filter by status' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='suspended'>Suspended</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue='all'>
                <SelectTrigger className='w-[180px]'>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4' />
                    <SelectValue placeholder='Filter by type' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='maid'>Maids</SelectItem>
                  <SelectItem value='agency'>Agencies</SelectItem>
                  <SelectItem value='sponsor'>Sponsors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full table-auto'>
              <thead>
                <tr className='border-b'>
                  <th className='text-left p-3 font-medium'>User</th>
                  <th className='text-left p-3 font-medium'>Type</th>
                  <th className='text-left p-3 font-medium'>Location</th>
                  <th className='text-left p-3 font-medium'>Registered</th>
                  <th className='text-left p-3 font-medium'>Status</th>
                  <th className='text-left p-3 font-medium'>Verified</th>
                  <th className='text-right p-3 font-medium'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className='border-b hover:bg-gray-50'>
                    <td className='p-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className='bg-primary/10 text-primary'>
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{user.name}</p>
                          <p className='text-sm text-gray-500'>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className='p-3'>
                      <div className='flex items-center gap-1.5'>
                        {getUserTypeIcon(user.type)}
                        <span className='capitalize'>{user.type}</span>
                      </div>
                    </td>
                    <td className='p-3'>{user.location}</td>
                    <td className='p-3'>{formatDate(user.registeredDate)}</td>
                    <td className='p-3'>
                      <Badge
                        variant={
                          user.status === 'active'
                            ? 'success'
                            : user.status === 'pending'
                              ? 'warning'
                              : user.status === 'suspended'
                                ? 'destructive'
                                : 'outline'
                        }
                        className='capitalize'
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className='p-3'>
                      {user.verified ? (
                        <CheckCircle2 className='h-5 w-5 text-green-500' />
                      ) : (
                        <XCircle className='h-5 w-5 text-red-500' />
                      )}
                    </td>
                    <td className='p-3 text-right'>
                      <div className='flex justify-end gap-2'>
                        {!user.verified && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleVerifyUser(user.id)}
                          >
                            Verify
                          </Button>
                        )}
                        <Select
                          defaultValue={user.status}
                          onValueChange={(value) =>
                            handleStatusChange(user.id, value)
                          }
                        >
                          <SelectTrigger className='w-[130px] h-8'>
                            <SelectValue placeholder='Change Status' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='active'>Activate</SelectItem>
                            <SelectItem value='suspended'>Suspend</SelectItem>
                            <SelectItem value='inactive'>Deactivate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className='p-8 text-center text-gray-500'>
                      No users found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className='flex items-center justify-between mt-4'>
            <p className='text-sm text-gray-500'>
              Showing {filteredUsers.length} of {mockUsers.length} users
            </p>
            <div className='flex gap-1'>
              <Button variant='outline' size='sm' disabled>
                Previous
              </Button>
              <Button variant='outline' size='sm' disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User statistics section */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown by user type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-blue-500'></div>
                  <span>Maids</span>
                </div>
                <span className='font-medium'>1,240</span>
              </div>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-green-500'></div>
                  <span>Agencies</span>
                </div>
                <span className='font-medium'>350</span>
              </div>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-purple-500'></div>
                  <span>Sponsors</span>
                </div>
                <span className='font-medium'>850</span>
              </div>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-gray-500'></div>
                  <span>Platform Admin</span>
                </div>
                <span className='font-medium'>15</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest user activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <div className='bg-blue-100 text-blue-600 p-2 rounded-full'>
                  <User className='h-4 w-4' />
                </div>
                <div>
                  <p className='font-medium'>New user registered</p>
                  <p className='text-sm text-gray-500'>
                    Aisha Mohammed joined as a maid
                  </p>
                  <p className='text-xs text-gray-400'>10 minutes ago</p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <div className='bg-green-100 text-green-600 p-2 rounded-full'>
                  <CheckCircle2 className='h-4 w-4' />
                </div>
                <div>
                  <p className='font-medium'>Account verified</p>
                  <p className='text-sm text-gray-500'>
                    Elite Services Agency was verified
                  </p>
                  <p className='text-xs text-gray-400'>45 minutes ago</p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <div className='bg-red-100 text-red-600 p-2 rounded-full'>
                  <AlertCircle className='h-4 w-4' />
                </div>
                <div>
                  <p className='font-medium'>Account suspended</p>
                  <p className='text-sm text-gray-500'>
                    Quality Maids Agency was suspended
                  </p>
                  <p className='text-xs text-gray-400'>2 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>User verification metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              <div>
                <div className='flex justify-between mb-2'>
                  <span className='text-sm font-medium'>Maids Verified</span>
                  <span className='text-sm font-medium'>72%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-500 h-2 rounded-full'
                    style={{ width: '72%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className='flex justify-between mb-2'>
                  <span className='text-sm font-medium'>Agencies Verified</span>
                  <span className='text-sm font-medium'>94%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-green-500 h-2 rounded-full'
                    style={{ width: '94%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className='flex justify-between mb-2'>
                  <span className='text-sm font-medium'>Sponsors Verified</span>
                  <span className='text-sm font-medium'>86%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-purple-500 h-2 rounded-full'
                    style={{ width: '86%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className='flex justify-between mb-2'>
                  <span className='text-sm font-medium'>Overall</span>
                  <span className='text-sm font-medium'>79%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-gray-800 h-2 rounded-full'
                    style={{ width: '79%' }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformUsersPage;
