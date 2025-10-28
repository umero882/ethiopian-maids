import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Bell,
  Palette,
  Globe,
  Clock,
  Activity,
  Settings,
  Camera,
  Edit,
  Save,
  X,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockAdminProfile = {
  id: 'admin_001',
  username: 'sarah.wilson',
  email: 'sarah.wilson@ethiomaids.com',
  first_name: 'Sarah',
  last_name: 'Wilson',
  role: 'super_admin',
  department: 'Operations',
  phone: '+251-911-234-567',
  avatar_url: null,
  bio: 'Senior System Administrator with 8+ years of experience in platform management and operations.',
  timezone: 'Africa/Addis_Ababa',
  language: 'en',
  created_at: '2023-01-15T08:00:00Z',
  last_login: '2024-03-20T14:30:00Z',
  last_active: '2024-03-20T15:45:00Z',
  email_verified: true,
  two_factor_enabled: true,
  account_status: 'active',
  permissions: [
    'users.read', 'users.write', 'content.moderate', 'financial.read',
    'financial.write', 'system.read', 'system.write', 'analytics.read',
    'support.read', 'support.write'
  ],
  preferences: {
    theme: 'light',
    email_notifications: {
      security_alerts: true,
      system_updates: true,
      user_registrations: false,
      financial_transactions: true,
      support_tickets: true,
      maintenance_windows: true
    },
    dashboard_layout: 'default',
    items_per_page: 25,
    auto_refresh_interval: 30,
    timezone_display: 'local'
  },
  security: {
    password_last_changed: '2024-02-15T10:30:00Z',
    failed_login_attempts: 0,
    last_password_reset: null,
    account_locked: false,
    login_history: [
      {
        id: 'login_001',
        timestamp: '2024-03-20T14:30:00Z',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'Addis Ababa, Ethiopia',
        success: true,
        device_type: 'desktop'
      },
      {
        id: 'login_002',
        timestamp: '2024-03-19T09:15:00Z',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'Addis Ababa, Ethiopia',
        success: true,
        device_type: 'desktop'
      },
      {
        id: 'login_003',
        timestamp: '2024-03-18T16:45:00Z',
        ip_address: '10.0.0.25',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        location: 'Addis Ababa, Ethiopia',
        success: true,
        device_type: 'mobile'
      }
    ],
    active_sessions: [
      {
        id: 'session_001',
        device_type: 'desktop',
        browser: 'Chrome 122.0',
        os: 'Windows 10',
        ip_address: '192.168.1.100',
        location: 'Addis Ababa, Ethiopia',
        last_active: '2024-03-20T15:45:00Z',
        current: true
      },
      {
        id: 'session_002',
        device_type: 'mobile',
        browser: 'Safari 17.0',
        os: 'iOS 17.0',
        ip_address: '10.0.0.25',
        location: 'Addis Ababa, Ethiopia',
        last_active: '2024-03-18T16:45:00Z',
        current: false
      }
    ]
  },
  activity_stats: {
    total_logins: 247,
    actions_performed: 1856,
    tickets_resolved: 89,
    users_managed: 156,
    avg_session_duration: '4h 23m'
  }
};

const AdminProfileSettingsPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [profile, setProfile] = useState(mockAdminProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [profileForm, setProfileForm] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    phone: profile.phone,
    bio: profile.bio,
    department: profile.department
  });

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      logAdminActivity('admin_profile_page_view', 'admin_profile', 'settings');
      setLoading(false);
    };

    loadProfileData();
  }, [logAdminActivity]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProfile(prev => ({
        ...prev,
        ...profileForm
      }));

      await logAdminActivity('admin_profile_updated', 'admin_profile', profile.id);

      setIsEditingProfile(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: 'Password Mismatch',
        description: 'New password and confirm password do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProfile(prev => ({
        ...prev,
        security: {
          ...prev.security,
          password_last_changed: new Date().toISOString()
        }
      }));

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      await logAdminActivity('admin_password_changed', 'admin_security', profile.id);

      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePreferences = async (key, value) => {
    try {
      setProfile(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [key]: value
        }
      }));

      await logAdminActivity('admin_preferences_updated', 'admin_profile', key);

      toast({
        title: 'Preferences Updated',
        description: 'Your preferences have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update preferences.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateNotificationPreference = async (key, value) => {
    try {
      setProfile(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          email_notifications: {
            ...prev.preferences.email_notifications,
            [key]: value
          }
        }
      }));

      await logAdminActivity('admin_notification_preferences_updated', 'admin_profile', key);

      toast({
        title: 'Notification Preferences Updated',
        description: 'Your notification settings have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences.',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      setProfile(prev => ({
        ...prev,
        security: {
          ...prev.security,
          active_sessions: prev.security.active_sessions.filter(s => s.id !== sessionId)
        }
      }));

      await logAdminActivity('admin_session_revoked', 'admin_security', sessionId);

      toast({
        title: 'Session Revoked',
        description: 'The session has been terminated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke session.',
        variant: 'destructive',
      });
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'super_admin': 'Super Administrator',
      'admin': 'Administrator',
      'moderator': 'Content Moderator',
      'support_agent': 'Support Agent',
      'analyst': 'Data Analyst',
      'manager': 'Department Manager'
    };
    return roleNames[role] || role;
  };

  const getDeviceIcon = (deviceType) => {
    const icons = {
      desktop: Monitor,
      mobile: Smartphone,
      tablet: Monitor
    };
    const Icon = icons[deviceType] || Monitor;
    return <Icon className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your admin account settings and preferences {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Profile
          </Button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-lg">
                {profile.first_name[0]}{profile.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <h2 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h2>
              <p className="text-muted-foreground">@{profile.username}</p>
              <div className="flex items-center gap-4 mt-2">
                <Badge className="bg-purple-100 text-purple-800">
                  {getRoleDisplayName(profile.role)}
                </Badge>
                <Badge className={profile.account_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {profile.account_status.toUpperCase()}
                </Badge>
                {profile.two_factor_enabled && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Shield className="h-3 w-3 mr-1" />
                    2FA Enabled
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Change Photo
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Profile Info Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  {isEditingProfile ? (
                    <><X className="h-4 w-4 mr-2" />Cancel</>
                  ) : (
                    <><Edit className="h-4 w-4 mr-2" />Edit</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  {isEditingProfile ? (
                    <Input
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        first_name: e.target.value
                      }))}
                    />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded">{profile.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  {isEditingProfile ? (
                    <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        last_name: e.target.value
                      }))}
                    />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded">{profile.last_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {isEditingProfile ? (
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm p-2 bg-gray-50 rounded flex-grow">{profile.email}</p>
                      {profile.email_verified && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditingProfile ? (
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                    />
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded">{profile.phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  {isEditingProfile ? (
                    <Select
                      value={profileForm.department}
                      onValueChange={(value) => setProfileForm(prev => ({
                        ...prev,
                        department: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Support">Customer Support</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="HR">Human Resources</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm p-2 bg-gray-50 rounded">{profile.department}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <p className="text-sm p-2 bg-gray-50 rounded">{getRoleDisplayName(profile.role)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditingProfile ? (
                  <Textarea
                    id="bio"
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({
                      ...prev,
                      bio: e.target.value
                    }))}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-sm p-2 bg-gray-50 rounded">{profile.bio}</p>
                )}
              </div>

              {isEditingProfile && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                    Cancel
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                  <p className="text-sm">{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                  <p className="text-sm">{new Date(profile.last_login).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timezone</p>
                  <p className="text-sm">{profile.timezone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Last changed on {new Date(profile.security.password_last_changed).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        current_password: e.target.value
                      }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        new_password: e.target.value
                      }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        confirm_password: e.target.value
                      }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <Button onClick={handleChangePassword} disabled={saving}>
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
                {profile.two_factor_enabled && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {profile.two_factor_enabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile.two_factor_enabled
                      ? 'Your account is protected with 2FA using an authenticator app'
                      : 'Enable 2FA to add an extra layer of security to your account'
                    }
                  </p>
                </div>
                <Button variant={profile.two_factor_enabled ? 'destructive' : 'default'}>
                  {profile.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Activity className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage your active login sessions across different devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.security.active_sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.device_type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{session.browser} on {session.os}</p>
                          {session.current && (
                            <Badge className="bg-green-100 text-green-800">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.location} • {session.ip_address}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last active: {new Date(session.last_active).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke this session? The user will be logged out immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeSession(session.id)}
                            >
                              Revoke Session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Login History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Clock className="h-5 w-5" />
                Recent Login History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.security.login_history.map((login) => (
                    <TableRow key={login.id}>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(login.timestamp).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">
                            {new Date(login.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(login.device_type)}
                          <span className="text-sm">{login.device_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{login.location}</TableCell>
                      <TableCell className="text-sm font-mono">{login.ip_address}</TableCell>
                      <TableCell>
                        <Badge className={login.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {login.success ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                Interface Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={profile.preferences.theme}
                    onValueChange={(value) => handleUpdatePreferences('theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={profile.language}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="am">Amharic (አማርኛ)</SelectItem>
                      <SelectItem value="or">Oromo (Afaan Oromoo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Addis_Ababa">Africa/Addis Ababa (EAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Items Per Page</Label>
                  <Select
                    value={profile.preferences.items_per_page.toString()}
                    onValueChange={(value) => handleUpdatePreferences('items_per_page', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Auto Refresh Interval</Label>
                  <Select
                    value={profile.preferences.auto_refresh_interval.toString()}
                    onValueChange={(value) => handleUpdatePreferences('auto_refresh_interval', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dashboard Layout</Label>
                  <Select
                    value={profile.preferences.dashboard_layout}
                    onValueChange={(value) => handleUpdatePreferences('dashboard_layout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                Email Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what email notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(profile.preferences.email_notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {key.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {key === 'security_alerts' && 'Get notified about security events and login attempts'}
                      {key === 'system_updates' && 'Receive notifications about system maintenance and updates'}
                      {key === 'user_registrations' && 'Get alerts when new users register on the platform'}
                      {key === 'financial_transactions' && 'Receive notifications about payment transactions and disputes'}
                      {key === 'support_tickets' && 'Get notified about new support tickets and escalations'}
                      {key === 'maintenance_windows' && 'Receive alerts about scheduled maintenance windows'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => handleUpdateNotificationPreference(key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Total Logins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.activity_stats.total_logins}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actions Performed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.activity_stats.actions_performed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tickets Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.activity_stats.tickets_resolved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Users Managed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.activity_stats.users_managed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Avg Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.activity_stats.avg_session_duration}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Activity className="h-5 w-5" />
                Permissions
              </CardTitle>
              <CardDescription>
                Your current role permissions and access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {profile.permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="justify-center p-2">
                    {permission.replace('.', ' ').replace('_', ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProfileSettingsPage;