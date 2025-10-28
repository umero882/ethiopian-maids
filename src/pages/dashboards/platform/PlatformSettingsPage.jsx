import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, AlertTriangle, Database, Mail, BellRing } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PlatformSettingsPage = () => {
  const { toast } = useToast();

  const handleSaveSettings = (section) => {
    toast({
      title: 'Settings Updated',
      description: `Your ${section} settings have been saved successfully.`,
      variant: 'success',
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold tracking-tight'>Platform Settings</h1>
      </div>

      <Tabs defaultValue='general' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='general'>General</TabsTrigger>
          <TabsTrigger value='security'>Security</TabsTrigger>
          <TabsTrigger value='notifications'>Notifications</TabsTrigger>
          <TabsTrigger value='integrations'>Integrations</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value='general' className='space-y-4 mt-4'>
          <Card>
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
              <CardDescription>
                Update your platform's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='platform-name'>Platform Name</Label>
                <Input id='platform-name' defaultValue='Ethio-Maids' />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='support-email'>Support Email</Label>
                <Input
                  id='support-email'
                  type='email'
                  defaultValue='support@ethio-maids.com'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='platform-description'>
                  Platform Description
                </Label>
                <Textarea
                  id='platform-description'
                  placeholder='Enter a brief description of the platform'
                  defaultValue='Ethio-Maids is a web application designed to connect Ethiopian domestic helpers (maids) with potential employers (sponsors) primarily in the GCC region.'
                  className='min-h-[100px]'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='default-language'>Default Language</Label>
                <Select defaultValue='en'>
                  <SelectTrigger id='default-language'>
                    <SelectValue placeholder='Select language' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='en'>English</SelectItem>
                    <SelectItem value='ar'>Arabic</SelectItem>
                    <SelectItem value='am'>Amharic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => handleSaveSettings('general')}>
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>
                Configure region-specific settings
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='currency'>Default Currency</Label>
                <Select defaultValue='aed'>
                  <SelectTrigger id='currency'>
                    <SelectValue placeholder='Select currency' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='aed'>AED (UAE Dirham)</SelectItem>
                    <SelectItem value='sar'>SAR (Saudi Riyal)</SelectItem>
                    <SelectItem value='qar'>QAR (Qatari Riyal)</SelectItem>
                    <SelectItem value='kwd'>KWD (Kuwaiti Dinar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Available Regions</Label>
                <div className='grid gap-2'>
                  <div className='flex items-center space-x-2'>
                    <Checkbox id='r-uae' defaultChecked />
                    <Label htmlFor='r-uae'>United Arab Emirates</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox id='r-saudi' defaultChecked />
                    <Label htmlFor='r-saudi'>Saudi Arabia</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox id='r-qatar' defaultChecked />
                    <Label htmlFor='r-qatar'>Qatar</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox id='r-kuwait' defaultChecked />
                    <Label htmlFor='r-kuwait'>Kuwait</Label>
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('regional')}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value='security' className='space-y-4 mt-4'>
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure platform-wide security settings
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='enforce-mfa'>
                    Enforce Multi-Factor Authentication
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    Require all platform administrators to use 2FA
                  </p>
                </div>
                <Switch id='enforce-mfa' defaultChecked />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='password-policy'>
                    Strong Password Policy
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    Require complex passwords for all users
                  </p>
                </div>
                <Switch id='password-policy' defaultChecked />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='session-timeout'>Session Timeout</Label>
                  <p className='text-sm text-muted-foreground'>
                    Automatically log users out after inactivity
                  </p>
                </div>
                <Switch id='session-timeout' defaultChecked />
              </div>

              <Button onClick={() => handleSaveSettings('security')}>
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='space-y-1'>
                <CardTitle>Security Logs</CardTitle>
                <CardDescription>
                  View recent security-related activity
                </CardDescription>
              </div>
              <Shield className='h-5 w-5 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='border-l-4 border-amber-500 pl-4 py-2'>
                  <p className='text-sm font-medium'>
                    Failed login attempts (last 24h)
                  </p>
                  <p className='text-2xl font-bold'>12</p>
                </div>

                <div className='border-l-4 border-green-500 pl-4 py-2'>
                  <p className='text-sm font-medium'>
                    Successful logins (last 24h)
                  </p>
                  <p className='text-2xl font-bold'>48</p>
                </div>

                <div className='border-l-4 border-red-500 pl-4 py-2'>
                  <p className='text-sm font-medium'>
                    Account lockouts (last 24h)
                  </p>
                  <p className='text-2xl font-bold'>3</p>
                </div>

                <Button variant='outline' className='w-full'>
                  View Full Security Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value='notifications' className='space-y-4 mt-4'>
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure system email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <div className='flex items-center gap-2'>
                    <Mail className='h-4 w-4' />
                    <Label htmlFor='email-new-users'>
                      New User Registrations
                    </Label>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Receive notifications when new users register
                  </p>
                </div>
                <Switch id='email-new-users' defaultChecked />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <div className='flex items-center gap-2'>
                    <Mail className='h-4 w-4' />
                    <Label htmlFor='email-verification'>
                      Account Verifications
                    </Label>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Receive notifications for account verification requests
                  </p>
                </div>
                <Switch id='email-verification' defaultChecked />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <div className='flex items-center gap-2'>
                    <AlertTriangle className='h-4 w-4' />
                    <Label htmlFor='email-security'>Security Alerts</Label>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Receive notifications for security-related events
                  </p>
                </div>
                <Switch id='email-security' defaultChecked />
              </div>

              <Button onClick={() => handleSaveSettings('notifications')}>
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Notifications</CardTitle>
              <CardDescription>
                Configure notification settings for platform users
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <div className='flex items-center gap-2'>
                    <BellRing className='h-4 w-4' />
                    <Label htmlFor='user-welcome'>Welcome Emails</Label>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Send welcome emails to new users
                  </p>
                </div>
                <Switch id='user-welcome' defaultChecked />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <div className='flex items-center gap-2'>
                    <BellRing className='h-4 w-4' />
                    <Label htmlFor='user-marketing'>Marketing Emails</Label>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Send promotional and marketing emails
                  </p>
                </div>
                <Switch id='user-marketing' />
              </div>

              <Button onClick={() => handleSaveSettings('user notifications')}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value='integrations' className='space-y-4 mt-4'>
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Manage API settings and credentials
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='api-key'>Platform API Key</Label>
                <div className='flex'>
                  <Input
                    id='api-key'
                    value='••••••••••••••••••••••••••••••'
                    readOnly
                    className='rounded-r-none'
                  />
                  <Button variant='outline' className='rounded-l-none'>
                    Regenerate
                  </Button>
                </div>
                <p className='text-sm text-muted-foreground'>
                  This key is used for authentication with external services
                </p>
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='api-enabled'>
                    Enable External API Access
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    Allow external services to access the platform API
                  </p>
                </div>
                <Switch id='api-enabled' defaultChecked />
              </div>

              <Button onClick={() => handleSaveSettings('API')}>
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
              <CardDescription>
                Configure connections to external services
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='p-4 border rounded-lg space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-600'>
                      <svg
                        viewBox='0 0 24 24'
                        className='h-5 w-5'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                      >
                        <path d='M3 3h18v18H3z' />
                        <path d='M7 7h10v10H7z' />
                      </svg>
                    </div>
                    <div>
                      <h3 className='font-medium'>Stripe</h3>
                      <p className='text-xs text-gray-500'>
                        Payment Processing
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className='p-4 border rounded-lg space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='h-8 w-8 bg-green-100 rounded-md flex items-center justify-center text-green-600'>
                      <Database className='h-5 w-5' />
                    </div>
                    <div>
                      <h3 className='font-medium'>Supabase</h3>
                      <p className='text-xs text-gray-500'>
                        Database & Authentication
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button
                onClick={() => handleSaveSettings('third-party services')}
              >
                Save All Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformSettingsPage;
