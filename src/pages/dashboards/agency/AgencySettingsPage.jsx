import { useState, useEffect } from 'react';
import { agencyService } from '@/services/agencyService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import GccLocationSelector from '@/components/location/GccLocationSelector';
import {
  BellRing,
  Shield,
  User,
  Mail,
  Phone,
  CreditCard,
  Save,
  Globe,
  AlertTriangle,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  Users,
  Plus,
  Edit,
  Trash2,
  Settings,
  UserCheck,
  Building,
} from 'lucide-react';

const AgencySettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('team');


  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    notifyOnNewInquiries: true,
    notifyOnStatusChanges: true,
    notifyOnMessages: true,
    marketingEmails: false,
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    dataSharing: false,
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordVisible, setPasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordErrors, setPasswordErrors] = useState({});

  // Team management state
  const [teamData, setTeamData] = useState({
    members: [],
    roles: [],
    invitations: []
  });

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    email: '',
    name: '',
    role: '',
    permissions: []
  });

  const [sendingInvitation, setSendingInvitation] = useState(false);

  // Role management state
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleDialogMode, setRoleDialogMode] = useState('create'); // 'create' | 'edit'
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    color: 'blue',
    permissions: []
  });

  // Comprehensive permission definitions
  const allPermissions = {
    'user_management': {
      category: 'User Management',
      permissions: {
        'manage_team': 'Manage team members and roles',
        'invite_users': 'Send invitations to new team members',
        'remove_users': 'Remove team members',
        'view_team': 'View team member information'
      }
    },
    'maid_management': {
      category: 'Maid Management',
      permissions: {
        'manage_maids': 'Create, edit, and delete maid profiles',
        'view_maids': 'View maid profiles and information',
        'manage_maid_status': 'Update maid availability and status',
        'manage_maid_documents': 'Upload and manage maid documents'
      }
    },
    'client_management': {
      category: 'Client Management',
      permissions: {
        'manage_clients': 'Create, edit, and delete client profiles',
        'view_clients': 'View client information',
        'handle_inquiries': 'Respond to client inquiries',
        'manage_client_contracts': 'Manage contracts and agreements'
      }
    },
    'financial': {
      category: 'Financial Management',
      permissions: {
        'manage_billing': 'Handle billing and payments',
        'view_reports': 'Access financial and analytics reports',
        'manage_payouts': 'Process payouts and commissions',
        'financial_records': 'Access detailed financial records'
      }
    },
    'operations': {
      category: 'Operations',
      permissions: {
        'manage_documents': 'Upload and organize documents',
        'messaging': 'Access messaging and communication features',
        'manage_calendar': 'Schedule and manage appointments',
        'recruitment': 'Handle recruitment processes'
      }
    },
    'support': {
      category: 'Support & Communication',
      permissions: {
        'basic_support': 'Provide basic customer support',
        'advanced_support': 'Handle complex support issues',
        'team_oversight': 'Oversee team performance and activities',
        'system_settings': 'Access system and agency settings'
      }
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await agencyService.getAgencySettings();

        if (error) {
          toast({
            title: 'Error loading settings',
            description:
              error.message || 'An error occurred while loading your settings.',
            variant: 'destructive',
          });
        }

        // Set default data if there's an error or no data
        if (!data || error) {

          // Set default team data
            setTeamData({
              members: [
                {
                  id: 'user_001',
                  name: 'Ahmed Al-Rashid',
                  email: 'ahmed@agency.com',
                  role: 'Owner',
                  status: 'active',
                  avatar: null,
                  joined_date: '2024-01-15',
                  last_active: '2 hours ago',
                  permissions: ['all']
                },
                {
                  id: 'user_002',
                  name: 'Fatima Hassan',
                  email: 'fatima@agency.com',
                  role: 'Manager',
                  status: 'active',
                  avatar: null,
                  joined_date: '2024-02-10',
                  last_active: '1 day ago',
                  permissions: ['manage_maids', 'view_reports', 'manage_clients']
                },
                {
                  id: 'user_003',
                  name: 'Omar Al-Zahra',
                  email: 'omar@agency.com',
                  role: 'Coordinator',
                  status: 'active',
                  avatar: null,
                  joined_date: '2024-03-05',
                  last_active: '30 minutes ago',
                  permissions: ['manage_maids', 'view_reports']
                },
                {
                  id: 'user_004',
                  name: 'Layla Ibrahim',
                  email: 'layla@agency.com',
                  role: 'Assistant',
                  status: 'invited',
                  avatar: null,
                  joined_date: '2024-09-20',
                  last_active: 'Never',
                  permissions: ['view_maids']
                }
              ],
              roles: [
                {
                  id: 'owner',
                  name: 'Owner',
                  description: 'Full access to all features and settings',
                  permissions: ['all'],
                  color: 'purple'
                },
                {
                  id: 'manager',
                  name: 'Manager',
                  description: 'Manage operations, staff, and view all reports',
                  permissions: ['manage_maids', 'manage_clients', 'view_reports', 'manage_billing', 'manage_team'],
                  color: 'blue'
                },
                {
                  id: 'coordinator',
                  name: 'Coordinator',
                  description: 'Handle day-to-day operations and maid management',
                  permissions: ['manage_maids', 'view_reports', 'manage_documents', 'handle_inquiries'],
                  color: 'green'
                },
                {
                  id: 'assistant',
                  name: 'Assistant',
                  description: 'Basic access to view maids and handle simple tasks',
                  permissions: ['view_maids', 'view_clients', 'basic_support'],
                  color: 'gray'
                },
                {
                  id: 'recruiter',
                  name: 'Recruiter',
                  description: 'Focus on finding and onboarding new maids',
                  permissions: ['manage_maids', 'view_reports', 'recruitment'],
                  color: 'orange'
                },
                {
                  id: 'customer_service',
                  name: 'Customer Service',
                  description: 'Handle client inquiries and support requests',
                  permissions: ['view_clients', 'handle_inquiries', 'basic_support', 'messaging'],
                  color: 'teal'
                },
                {
                  id: 'accountant',
                  name: 'Accountant',
                  description: 'Manage financial records and billing',
                  permissions: ['manage_billing', 'view_reports', 'financial_records'],
                  color: 'indigo'
                },
                {
                  id: 'supervisor',
                  name: 'Supervisor',
                  description: 'Oversee operations and team performance',
                  permissions: ['manage_maids', 'manage_clients', 'view_reports', 'team_oversight'],
                  color: 'red'
                }
              ],
              invitations: [
                {
                  id: 'inv_001',
                  email: 'sarah.ahmed@email.com',
                  role: 'Coordinator',
                  sent_date: '2024-09-20',
                  status: 'pending',
                  expires_at: '2024-09-27'
                },
                {
                  id: 'inv_002',
                  email: 'mohamed.hassan@email.com',
                  role: 'Assistant',
                  sent_date: '2024-09-18',
                  status: 'expired',
                  expires_at: '2024-09-25'
                }
              ]
            });
        } else {
          // Update state with the fetched settings

          if (data.notifications) {
            setNotificationSettings(data.notifications);
          }

          if (data.security) {
            setSecuritySettings(data.security);
          }

          if (data.team) {
            setTeamData(data.team);
          }
        }
      } catch (err) {
        toast({
          title: 'Error loading settings',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });

        // Ensure default team data is set even on error
        setTeamData({
          members: [
            {
              id: 'user_001',
              name: 'Ahmed Al-Rashid',
              email: 'ahmed@agency.com',
              role: 'Owner',
              status: 'active',
              avatar: null,
              joined_date: '2024-01-15',
              last_active: '2 hours ago',
              permissions: ['all']
            },
            {
              id: 'user_002',
              name: 'Fatima Hassan',
              email: 'fatima@agency.com',
              role: 'Manager',
              status: 'active',
              avatar: null,
              joined_date: '2024-02-10',
              last_active: '1 day ago',
              permissions: ['manage_maids', 'view_reports', 'manage_clients']
            }
          ],
          roles: [
            {
              id: 'owner',
              name: 'Owner',
              description: 'Full access to all features and settings',
              permissions: ['all'],
              color: 'purple'
            },
            {
              id: 'manager',
              name: 'Manager',
              description: 'Manage operations, staff, and view all reports',
              permissions: ['manage_maids', 'manage_clients', 'view_reports', 'manage_billing', 'manage_team'],
              color: 'blue'
            },
            {
              id: 'coordinator',
              name: 'Coordinator',
              description: 'Handle day-to-day operations and maid management',
              permissions: ['manage_maids', 'view_reports', 'manage_documents', 'handle_inquiries'],
              color: 'green'
            },
            {
              id: 'assistant',
              name: 'Assistant',
              description: 'Basic access to view maids and handle simple tasks',
              permissions: ['view_maids', 'view_clients', 'basic_support'],
              color: 'gray'
            },
            {
              id: 'recruiter',
              name: 'Recruiter',
              description: 'Focus on finding and onboarding new maids',
              permissions: ['manage_maids', 'view_reports', 'recruitment'],
              color: 'orange'
            },
            {
              id: 'customer_service',
              name: 'Customer Service',
              description: 'Handle client inquiries and support requests',
              permissions: ['view_clients', 'handle_inquiries', 'basic_support', 'messaging'],
              color: 'teal'
            },
            {
              id: 'accountant',
              name: 'Accountant',
              description: 'Manage financial records and billing',
              permissions: ['manage_billing', 'view_reports', 'financial_records'],
              color: 'indigo'
            },
            {
              id: 'supervisor',
              name: 'Supervisor',
              description: 'Oversee operations and team performance',
              permissions: ['manage_maids', 'manage_clients', 'view_reports', 'team_oversight'],
              color: 'red'
            }
          ],
          invitations: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);



  const handleNotificationToggle = (setting) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSecurityToggle = (setting) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear any existing error for this field
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisible((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSaveNotifications = async () => {
    setSaving(true);

    try {
      const { error } = await agencyService.updateAgencySettings({
        notifications: notificationSettings,
      });

      if (error) {
        toast({
          title: 'Error saving notification settings',
          description:
            error.message ||
            'An error occurred while saving your notification settings.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Notification settings saved',
          description: 'Your notification preferences have been updated.',
        });
      }
    } catch (_err) {
      toast({
        title: 'Error saving notification settings',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSaving(true);

    try {
      const { error } = await agencyService.updateAgencySettings({
        security: securitySettings,
      });

      if (error) {
        toast({
          title: 'Error saving security settings',
          description:
            error.message ||
            'An error occurred while saving your security settings.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Security settings saved',
          description: 'Your security preferences have been updated.',
        });
      }
    } catch (_err) {
      toast({
        title: 'Error saving security settings',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setSaving(true);

    try {
      const { error } = await agencyService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (error) {
        toast({
          title: 'Error changing password',
          description:
            error.message || 'An error occurred while changing your password.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password changed',
          description: 'Your password has been updated successfully.',
        });

        // Reset password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (_err) {
      toast({
        title: 'Error changing password',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvitation = async () => {
    // Validate form
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields before sending the invitation.',
        variant: 'destructive',
      });
      return;
    }

    setSendingInvitation(true);

    try {
      // Call the invitation service
      const { data: newInvitation, error } = await agencyService.inviteTeamMember({
        email: newMember.email,
        name: newMember.name,
        role: newMember.role
      });

      if (error) {
        toast({
          title: 'Failed to send invitation',
          description: error.message || 'An error occurred while sending the invitation.',
          variant: 'destructive',
        });
        return;
      }

      // Add the new invitation to the beginning of the array (newest first)
      setTeamData(prevData => ({
        ...prevData,
        invitations: [newInvitation, ...(prevData.invitations || [])]
      }));

      // Show success message
      toast({
        title: 'Invitation sent!',
        description: `Invitation has been sent to ${newMember.email} for the ${newMember.role} role.`,
      });

      // Close modal and reset form
      setShowAddMember(false);
      setNewMember({ email: '', name: '', role: '', permissions: [] });

    } catch (err) {
      toast({
        title: 'Failed to send invitation',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSendingInvitation(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      const { error } = await agencyService.cancelInvitation(invitationId);

      if (error) {
        toast({
          title: 'Failed to cancel invitation',
          description: error.message || 'An error occurred while canceling the invitation.',
          variant: 'destructive',
        });
        return;
      }

      // Remove the invitation from the team data
      setTeamData(prevData => ({
        ...prevData,
        invitations: prevData.invitations.filter(inv => inv.id !== invitationId)
      }));

      toast({
        title: 'Invitation canceled',
        description: 'The invitation has been canceled successfully.',
      });

    } catch (err) {
      toast({
        title: 'Failed to cancel invitation',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  // Role management functions
  const handleCreateRole = () => {
    setRoleDialogMode('create');
    setSelectedRole(null);
    setRoleForm({
      name: '',
      description: '',
      color: 'blue',
      permissions: []
    });
    setShowRoleDialog(true);
  };

  const handleEditRole = (role) => {
    setRoleDialogMode('edit');
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      color: role.color,
      permissions: [...role.permissions]
    });
    setShowRoleDialog(true);
  };

  const handleDeleteRole = async (roleId) => {
    if (roleId === 'owner') {
      toast({
        title: 'Cannot delete Owner role',
        description: 'The Owner role cannot be deleted as it is required for the system.',
        variant: 'destructive',
      });
      return;
    }

    // Check if any team members have this role
    const membersWithRole = teamData.members?.filter(member => member.role === teamData.roles?.find(r => r.id === roleId)?.name);
    if (membersWithRole && membersWithRole.length > 0) {
      toast({
        title: 'Cannot delete role',
        description: `This role is assigned to ${membersWithRole.length} team member(s). Please reassign them first.`,
        variant: 'destructive',
      });
      return;
    }

    setTeamData(prevData => ({
      ...prevData,
      roles: prevData.roles?.filter(role => role.id !== roleId) || []
    }));

    toast({
      title: 'Role deleted',
      description: 'The role has been successfully deleted.',
    });
  };

  const handleSaveRole = () => {
    if (!roleForm.name || !roleForm.description) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (roleForm.permissions.length === 0) {
      toast({
        title: 'No permissions selected',
        description: 'Please select at least one permission for this role.',
        variant: 'destructive',
      });
      return;
    }

    if (roleDialogMode === 'create') {
      // Create new role
      const newRole = {
        id: `role_${Date.now()}`,
        name: roleForm.name,
        description: roleForm.description,
        color: roleForm.color,
        permissions: [...roleForm.permissions]
      };

      setTeamData(prevData => ({
        ...prevData,
        roles: [...(prevData.roles || []), newRole]
      }));

      toast({
        title: 'Role created',
        description: `The ${roleForm.name} role has been created successfully.`,
      });
    } else {
      // Edit existing role
      setTeamData(prevData => ({
        ...prevData,
        roles: prevData.roles?.map(role =>
          role.id === selectedRole.id
            ? {
                ...role,
                name: roleForm.name,
                description: roleForm.description,
                color: roleForm.color,
                permissions: [...roleForm.permissions]
              }
            : role
        ) || []
      }));

      toast({
        title: 'Role updated',
        description: `The ${roleForm.name} role has been updated successfully.`,
      });
    }

    setShowRoleDialog(false);
  };

  const togglePermission = (permission) => {
    setRoleForm(prevForm => {
      const newPermissions = prevForm.permissions.includes(permission)
        ? prevForm.permissions.filter(p => p !== permission)
        : [...prevForm.permissions, permission];

      return {
        ...prevForm,
        permissions: newPermissions
      };
    });
  };

  const togglePermissionCategory = (categoryKey) => {
    const categoryPermissions = Object.keys(allPermissions[categoryKey].permissions);
    const allCategorySelected = categoryPermissions.every(perm => roleForm.permissions.includes(perm));

    setRoleForm(prevForm => {
      let newPermissions = [...prevForm.permissions];

      if (allCategorySelected) {
        // Remove all category permissions
        newPermissions = newPermissions.filter(perm => !categoryPermissions.includes(perm));
      } else {
        // Add all category permissions
        categoryPermissions.forEach(perm => {
          if (!newPermissions.includes(perm)) {
            newPermissions.push(perm);
          }
        });
      }

      return {
        ...prevForm,
        permissions: newPermissions
      };
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto'></div>
          <p className='text-gray-600'>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <h1 className='text-3xl font-bold text-gray-800'>Settings</h1>
      </div>

      <Tabs
        defaultValue='team'
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-4'
      >
        <TabsList className='grid grid-cols-1 md:grid-cols-4 gap-2'>
          <TabsTrigger value='team' className='flex items-center'>
            <Users className='mr-2 h-4 w-4' /> Team
          </TabsTrigger>
          <TabsTrigger value='notifications' className='flex items-center'>
            <BellRing className='mr-2 h-4 w-4' /> Notifications
          </TabsTrigger>
          <TabsTrigger value='security' className='flex items-center'>
            <Shield className='mr-2 h-4 w-4' /> Security
          </TabsTrigger>
          <TabsTrigger value='subscription' className='flex items-center'>
            <CreditCard className='mr-2 h-4 w-4' /> Subscription
          </TabsTrigger>
        </TabsList>


        {/* Team Management Tab */}
        <TabsContent value='team'>
          <div className='space-y-6'>
            {/* Team Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage your team members and their permissions.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowAddMember(true)}>
                    <Plus className='mr-2 h-4 w-4' />
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {teamData.members?.map((member) => (
                    <div key={member.id} className='flex items-center justify-between p-4 border rounded-lg'>
                      <div className='flex items-center space-x-4'>
                        <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center'>
                          <span className='text-sm font-medium'>
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className='font-medium text-gray-900'>{member.name}</p>
                          <p className='text-sm text-gray-500'>{member.email}</p>
                          <p className='text-xs text-gray-400'>Last active: {member.last_active}</p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-4'>
                        <div className='text-right'>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.role === 'Owner' ? 'bg-purple-100 text-purple-800' :
                            member.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                            member.role === 'Coordinator' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role}
                          </div>
                          <p className={`text-xs mt-1 ${
                            member.status === 'active' ? 'text-green-600' :
                            member.status === 'invited' ? 'text-yellow-600' :
                            'text-gray-500'
                          }`}>
                            {member.status === 'active' ? '● Active' :
                             member.status === 'invited' ? '● Invited' :
                             '● Inactive'}
                          </p>
                        </div>
                        {member.role !== 'Owner' && (
                          <div className='flex items-center space-x-2'>
                            <Button variant='ghost' size='sm'>
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button variant='ghost' size='sm' className='text-red-600 hover:text-red-700'>
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            {teamData.invitations?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>
                    Users who have been invited but haven't joined yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {teamData.invitations
                      .sort((a, b) => new Date(b.sent_date) - new Date(a.sent_date)) // Sort by date, newest first
                      .map((invitation) => (
                      <div key={invitation.id} className='flex items-center justify-between p-3 border rounded-lg bg-gray-50'>
                        <div>
                          <p className='font-medium text-gray-900'>
                            {invitation.name ? invitation.name : invitation.email}
                          </p>
                          {invitation.name && (
                            <p className='text-sm text-gray-600'>{invitation.email}</p>
                          )}
                          <p className='text-sm text-gray-500'>Role: {invitation.role}</p>
                          <p className='text-xs text-gray-400'>
                            Sent: {new Date(invitation.sent_date).toLocaleDateString()} •
                            Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invitation.status}
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-red-600'
                            onClick={() => handleCancelInvitation(invitation.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Roles & Permissions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Roles & Permissions</CardTitle>
                    <CardDescription>
                      Manage user roles and their associated permissions.
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateRole}>
                    <Plus className='mr-2 h-4 w-4' />
                    Create Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {teamData.roles?.map((role) => (
                    <div key={role.id} className='p-4 border rounded-lg'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center space-x-2'>
                          <div className={`w-3 h-3 rounded-full ${
                            role.color === 'purple' ? 'bg-purple-500' :
                            role.color === 'blue' ? 'bg-blue-500' :
                            role.color === 'green' ? 'bg-green-500' :
                            role.color === 'orange' ? 'bg-orange-500' :
                            role.color === 'teal' ? 'bg-teal-500' :
                            role.color === 'indigo' ? 'bg-indigo-500' :
                            role.color === 'red' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></div>
                          <h4 className='font-medium'>{role.name}</h4>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant='ghost' size='sm' onClick={() => handleEditRole(role)}>
                            <Edit className='h-4 w-4' />
                          </Button>
                          {role.id !== 'owner' && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDeleteRole(role.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className='text-sm text-gray-600 mb-3'>{role.description}</p>
                      <div className='space-y-1'>
                        <p className='text-xs font-medium text-gray-500'>PERMISSIONS</p>
                        <div className='flex flex-wrap gap-1'>
                          {role.permissions.includes('all') ? (
                            <span className='inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800'>
                              All Permissions
                            </span>
                          ) : (
                            role.permissions.map((permission) => (
                              <span key={permission} className='inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800'>
                                {permission.replace('_', ' ')}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Member Dialog */}
          <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>Invite Team Member</span>
                </DialogTitle>
                <DialogDescription>
                  Send an invitation to a new team member to join your agency.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4'>
                <div className="space-y-2">
                  <Label htmlFor='memberName'>Full Name</Label>
                  <Input
                    id='memberName'
                    placeholder='Enter full name'
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor='memberEmail'>Email Address</Label>
                  <Input
                    id='memberEmail'
                    type='email'
                    placeholder='Enter email address'
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor='memberRole'>Role</Label>
                  <Select value={newMember.role} onValueChange={(value) => setNewMember({...newMember, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const filteredRoles = teamData.roles?.filter(role => role.id !== 'owner') || [];
                        return filteredRoles;
                      })().map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              role.color === 'purple' ? 'bg-purple-500' :
                              role.color === 'blue' ? 'bg-blue-500' :
                              role.color === 'green' ? 'bg-green-500' :
                              role.color === 'orange' ? 'bg-orange-500' :
                              role.color === 'teal' ? 'bg-teal-500' :
                              role.color === 'indigo' ? 'bg-indigo-500' :
                              role.color === 'red' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div>
                              <span className="font-medium">{role.name}</span>
                              <span className="text-sm text-gray-500 block">{role.description}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show selected role permissions */}
                {newMember.role && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Role Permissions</h4>
                    <div className="flex flex-wrap gap-1">
                      {teamData.roles
                        ?.find(role => role.name === newMember.role)
                        ?.permissions.includes('all') ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                          All Permissions
                        </span>
                      ) : (
                        teamData.roles
                          ?.find(role => role.name === newMember.role)
                          ?.permissions.map((permission) => (
                            <span key={permission} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                              {permission.replace('_', ' ')}
                            </span>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant='outline' onClick={() => setShowAddMember(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvitation}
                  disabled={!newMember.name || !newMember.email || !newMember.role || sendingInvitation}
                >
                  {sendingInvitation ? (
                    <>
                      <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Role Management Dialog */}
          <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>{roleDialogMode === 'create' ? 'Create New Role' : `Edit ${selectedRole?.name} Role`}</span>
                </DialogTitle>
                <DialogDescription>
                  {roleDialogMode === 'create'
                    ? 'Define a new role with specific permissions for your team members.'
                    : 'Modify the role details and permissions. Changes will apply to all users with this role.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Role Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleName">Role Name</Label>
                    <Input
                      id="roleName"
                      placeholder="Enter role name"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleColor">Color</Label>
                    <Select value={roleForm.color} onValueChange={(value) => setRoleForm({...roleForm, color: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span>Blue</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="green">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>Green</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="purple">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span>Purple</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="orange">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span>Orange</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="red">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>Red</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="teal">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                            <span>Teal</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="indigo">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                            <span>Indigo</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleDescription">Description</Label>
                  <Textarea
                    id="roleDescription"
                    placeholder="Describe what this role does and its responsibilities"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                    rows={3}
                  />
                </div>

                {/* Permissions Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Permissions</h3>
                    <div className="text-sm text-gray-500">
                      {roleForm.permissions.length} permission(s) selected
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(allPermissions).map(([categoryKey, category]) => {
                      const categoryPermissions = Object.keys(category.permissions);
                      const selectedCount = categoryPermissions.filter(perm => roleForm.permissions.includes(perm)).length;
                      const allSelected = selectedCount === categoryPermissions.length;

                      return (
                        <div key={categoryKey} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={() => togglePermissionCategory(categoryKey)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <h4 className="font-medium text-gray-900">{category.category}</h4>
                            </div>
                            <span className="text-sm text-gray-500">
                              {selectedCount}/{categoryPermissions.length} selected
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                            {Object.entries(category.permissions).map(([permKey, permDescription]) => (
                              <label key={permKey} className="flex items-start space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={roleForm.permissions.includes(permKey)}
                                  onChange={() => togglePermission(permKey)}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-0.5"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-700">
                                    {permKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </div>
                                  <div className="text-xs text-gray-500">{permDescription}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRole}>
                  {roleDialogMode === 'create' ? 'Create Role' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value='notifications'>
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label className='text-base'>Email Notifications</Label>
                    <p className='text-sm text-gray-500'>
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={() =>
                      handleNotificationToggle('emailNotifications')
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label className='text-base'>In-App Notifications</Label>
                    <p className='text-sm text-gray-500'>
                      Receive notifications within the application
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.inAppNotifications}
                    onCheckedChange={() =>
                      handleNotificationToggle('inAppNotifications')
                    }
                  />
                </div>

                <div className='border-t pt-4'>
                  <h3 className='text-sm font-medium text-gray-500 mb-3'>
                    NOTIFICATION TYPES
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>New Inquiries</Label>
                        <p className='text-sm text-gray-500'>
                          When a sponsor inquires about one of your maids
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.notifyOnNewInquiries}
                        onCheckedChange={() =>
                          handleNotificationToggle('notifyOnNewInquiries')
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>Status Changes</Label>
                        <p className='text-sm text-gray-500'>
                          When a maid's status changes (e.g., placed, returned)
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.notifyOnStatusChanges}
                        onCheckedChange={() =>
                          handleNotificationToggle('notifyOnStatusChanges')
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label className='text-base'>Messages</Label>
                        <p className='text-sm text-gray-500'>
                          When you receive a message from a sponsor
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.notifyOnMessages}
                        onCheckedChange={() =>
                          handleNotificationToggle('notifyOnMessages')
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className='border-t pt-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>Marketing Emails</Label>
                      <p className='text-sm text-gray-500'>
                        Receive updates, tips, and promotional offers
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={() =>
                        handleNotificationToggle('marketingEmails')
                      }
                    />
                  </div>
                </div>
              </div>

              <div className='flex justify-end'>
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? (
                    <>
                      <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value='security'>
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>
                        Two-Factor Authentication
                      </Label>
                      <p className='text-sm text-gray-500'>
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={() =>
                        handleSecurityToggle('twoFactorAuth')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>Login Notifications</Label>
                      <p className='text-sm text-gray-500'>
                        Get notified when someone logs into your account
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.loginNotifications}
                      onCheckedChange={() =>
                        handleSecurityToggle('loginNotifications')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label className='text-base'>Data Sharing</Label>
                      <p className='text-sm text-gray-500'>
                        Share anonymous usage data to help improve our services
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.dataSharing}
                      onCheckedChange={() =>
                        handleSecurityToggle('dataSharing')
                      }
                    />
                  </div>
                </div>

                <div className='flex justify-end'>
                  <Button onClick={handleSaveSecurity} disabled={saving}>
                    {saving ? (
                      <>
                        <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className='mr-2 h-4 w-4' />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='currentPassword'>Current Password</Label>
                    <div className='relative'>
                      <Input
                        id='currentPassword'
                        name='currentPassword'
                        type={passwordVisible.current ? 'text' : 'password'}
                        placeholder='Enter your current password'
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={
                          passwordErrors.currentPassword
                            ? 'border-red-500 pr-10'
                            : 'pr-10'
                        }
                      />
                      <button
                        type='button'
                        className='absolute inset-y-0 right-0 flex items-center pr-3'
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {passwordVisible.current ? (
                          <EyeOff className='h-4 w-4 text-gray-500' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-500' />
                        )}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className='text-red-500 text-sm'>
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='newPassword'>New Password</Label>
                    <div className='relative'>
                      <Input
                        id='newPassword'
                        name='newPassword'
                        type={passwordVisible.new ? 'text' : 'password'}
                        placeholder='Enter your new password'
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={
                          passwordErrors.newPassword
                            ? 'border-red-500 pr-10'
                            : 'pr-10'
                        }
                      />
                      <button
                        type='button'
                        className='absolute inset-y-0 right-0 flex items-center pr-3'
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {passwordVisible.new ? (
                          <EyeOff className='h-4 w-4 text-gray-500' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-500' />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className='text-red-500 text-sm'>
                        {passwordErrors.newPassword}
                      </p>
                    )}
                    <p className='text-sm text-gray-500'>
                      Password must be at least 8 characters long.
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='confirmPassword'>
                      Confirm New Password
                    </Label>
                    <div className='relative'>
                      <Input
                        id='confirmPassword'
                        name='confirmPassword'
                        type={passwordVisible.confirm ? 'text' : 'password'}
                        placeholder='Confirm your new password'
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={
                          passwordErrors.confirmPassword
                            ? 'border-red-500 pr-10'
                            : 'pr-10'
                        }
                      />
                      <button
                        type='button'
                        className='absolute inset-y-0 right-0 flex items-center pr-3'
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {passwordVisible.confirm ? (
                          <EyeOff className='h-4 w-4 text-gray-500' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-500' />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className='text-red-500 text-sm'>
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className='flex justify-end'>
                  <Button onClick={handleChangePassword} disabled={saving}>
                    {saving ? (
                      <>
                        <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Lock className='mr-2 h-4 w-4' />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value='subscription'>
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700'>
                <p className='flex items-center text-sm'>
                  <AlertTriangle className='h-4 w-4 mr-2' />
                  Subscription management is coming soon. Please contact support
                  for any billing inquiries.
                </p>
              </div>

              <div className='space-y-4'>
                <div>
                  <h3 className='text-lg font-medium'>Current Plan</h3>
                  <div className='mt-2 p-4 border rounded-md bg-gray-50'>
                    <div className='flex justify-between items-center'>
                      <div>
                        <p className='font-semibold text-xl'>
                          Premium Agency Plan
                        </p>
                        <p className='text-gray-500'>Unlimited maid listings</p>
                      </div>
                      <Badge
                        variant='outline'
                        className='bg-green-100 text-green-700 border-green-300'
                      >
                        Active
                      </Badge>
                    </div>
                    <div className='mt-4'>
                      <p className='text-gray-700'>
                        <span className='font-medium'>Next billing date:</span>{' '}
                        July 15, 2025
                      </p>
                      <p className='text-gray-700'>
                        <span className='font-medium'>Amount:</span>{' '}
                        $99.99/month
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-medium'>Payment Method</h3>
                  <div className='mt-2 p-4 border rounded-md bg-gray-50'>
                    <div className='flex items-center'>
                      <div className='bg-blue-100 p-2 rounded-md mr-3'>
                        <CreditCard className='h-6 w-6 text-blue-700' />
                      </div>
                      <div>
                        <p className='font-medium'>Visa ending in 4242</p>
                        <p className='text-gray-500 text-sm'>Expires 09/28</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Button variant='outline' disabled>
                  Update Payment Method
                </Button>
                <Button variant='outline' disabled>
                  View Billing History
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Badge component for subscription status
const Badge = ({ children, className, variant }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
};

export default AgencySettingsPage;
