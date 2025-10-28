/**
 * SettingsForm Component - Enhanced Version
 * Comprehensive platform settings configuration for WhatsApp Assistant
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import {
  Copy,
  Check,
  Save,
  Globe,
  Mail,
  Phone,
  Clock,
  Bot,
  TestTube,
  MessageSquare,
  Bell,
  Zap,
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

const SettingsForm = ({ settings, onUpdate }) => {
  const { toast } = useToast();

  // Auto-detect webhook URL
  const webhookUrl = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`
    : 'https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook';

  const [formData, setFormData] = useState({
    ...settings,
    whatsapp_webhook_url: settings?.whatsapp_webhook_url || webhookUrl,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleServicesChange = (value) => {
    const services = value.split(',').map(s => s.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      available_services: services,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate(formData);
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    if (formData.whatsapp_webhook_url) {
      navigator.clipboard.writeText(formData.whatsapp_webhook_url);
      setCopied(true);
      toast({
        title: 'Copied',
        description: 'Webhook URL copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const testWebhook = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch(formData.whatsapp_webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: 'whatsapp:+1234567890',
          Body: 'Test message from admin dashboard',
          MessageSid: 'test_' + Date.now(),
          AccountSid: 'test_account',
        }),
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Webhook is working correctly!' });
        toast({
          title: 'Success',
          description: 'Webhook test passed',
        });
      } else {
        setTestResult({
          success: false,
          message: `Webhook returned status ${response.status}`,
        });
        toast({
          title: 'Warning',
          description: 'Webhook test failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
      toast({
        title: 'Error',
        description: 'Failed to test webhook',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Tabs defaultValue="platform" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="platform">
          <Globe className="h-4 w-4 mr-2" />
          Platform
        </TabsTrigger>
        <TabsTrigger value="ai">
          <Bot className="h-4 w-4 mr-2" />
          AI Config
        </TabsTrigger>
        <TabsTrigger value="webhook">
          <Zap className="h-4 w-4 mr-2" />
          Webhook
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="h-4 w-4 mr-2" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="advanced">
          <Shield className="h-4 w-4 mr-2" />
          Advanced
        </TabsTrigger>
      </TabsList>

      {/* Platform Information Tab */}
      <TabsContent value="platform" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Platform Information
            </CardTitle>
            <CardDescription>
              Basic information about your platform displayed to WhatsApp users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform_name">Platform Name</Label>
              <Input
                id="platform_name"
                value={formData.platform_name || ''}
                onChange={(e) => handleChange('platform_name', e.target.value)}
                placeholder="Ethiopian Maids"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about_platform">About Platform</Label>
              <Textarea
                id="about_platform"
                value={formData.about_platform || ''}
                onChange={(e) => handleChange('about_platform', e.target.value)}
                placeholder="Describe your platform and services..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This description will be used by Lucy when introducing the platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="support_email">Support Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="support_email"
                    type="email"
                    value={formData.support_email || ''}
                    onChange={(e) => handleChange('support_email', e.target.value)}
                    placeholder="support@ethiopianmaids.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_phone">Support Phone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="support_phone"
                    type="tel"
                    value={formData.support_phone || ''}
                    onChange={(e) => handleChange('support_phone', e.target.value)}
                    placeholder="+971501234567"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="working_hours">Working Hours</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="working_hours"
                  value={formData.working_hours || ''}
                  onChange={(e) => handleChange('working_hours', e.target.value)}
                  placeholder="9:00 AM - 6:00 PM EAT, Monday - Saturday"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="available_services">Available Services</Label>
              <Input
                id="available_services"
                value={formData.available_services?.join(', ') || ''}
                onChange={(e) => handleServicesChange(e.target.value)}
                placeholder="Maid Placement, Maid Training, Document Processing"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple services with commas
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.available_services?.map((service, index) => (
                  <Badge key={index} variant="secondary">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* AI Configuration Tab */}
      <TabsContent value="ai" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Assistant Configuration
            </CardTitle>
            <CardDescription>
              Configure Lucy AI assistant behavior and responses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertDescription>
                Lucy is powered by Claude 3.5 Sonnet, designed to provide helpful and
                accurate responses to your users.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="ai_model">AI Model</Label>
              <Input
                id="ai_model"
                value={formData.ai_model || 'claude-3-5-sonnet-20241022'}
                onChange={(e) => handleChange('ai_model', e.target.value)}
                placeholder="claude-3-5-sonnet-20241022"
              />
              <p className="text-xs text-muted-foreground">
                Current model: Claude 3.5 Sonnet (Most capable model)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai_temperature">
                  Temperature: {formData.ai_temperature || 0.7}
                </Label>
                <Badge variant="outline">
                  {formData.ai_temperature < 0.3
                    ? 'Focused'
                    : formData.ai_temperature < 0.7
                    ? 'Balanced'
                    : 'Creative'}
                </Badge>
              </div>
              <Input
                id="ai_temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.ai_temperature || 0.7}
                onChange={(e) => handleChange('ai_temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.0 - Focused & Consistent</span>
                <span>0.5 - Balanced</span>
                <span>1.0 - Creative & Varied</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_context_messages">Context Window (Messages)</Label>
              <Input
                id="max_context_messages"
                type="number"
                min="5"
                max="50"
                value={formData.max_context_messages || 20}
                onChange={(e) =>
                  handleChange('max_context_messages', parseInt(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                Number of previous messages included in AI context (5-50)
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="auto_response">Auto-Response</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically respond to incoming messages
                  </p>
                </div>
                <Switch
                  id="auto_response"
                  checked={formData.auto_response_enabled || false}
                  onCheckedChange={(checked) =>
                    handleChange('auto_response_enabled', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="business_hours_only">Business Hours Only</Label>
                  <p className="text-sm text-muted-foreground">
                    Only respond during working hours
                  </p>
                </div>
                <Switch
                  id="business_hours_only"
                  checked={formData.business_hours_only || false}
                  onCheckedChange={(checked) =>
                    handleChange('business_hours_only', checked)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="system_prompt">Custom System Prompt (Optional)</Label>
              <Textarea
                id="system_prompt"
                value={formData.system_prompt || ''}
                onChange={(e) => handleChange('system_prompt', e.target.value)}
                placeholder="Add custom instructions for Lucy's behavior..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default prompt. Custom prompt will be appended to base
                instructions.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Response Templates</CardTitle>
            <CardDescription>
              Pre-configured responses for common scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="greeting_message">Greeting Message</Label>
              <Textarea
                id="greeting_message"
                value={formData.greeting_message || ''}
                onChange={(e) => handleChange('greeting_message', e.target.value)}
                placeholder="Hello! I'm Lucy, your AI assistant. How can I help you today?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offline_message">Offline Message</Label>
              <Textarea
                id="offline_message"
                value={formData.offline_message || ''}
                onChange={(e) => handleChange('offline_message', e.target.value)}
                placeholder="We're currently offline. Our working hours are..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="error_message">Error Message</Label>
              <Textarea
                id="error_message"
                value={formData.error_message || ''}
                onChange={(e) => handleChange('error_message', e.target.value)}
                placeholder="I'm sorry, I encountered an error. Please try again or contact support."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Webhook Configuration Tab */}
      <TabsContent value="webhook" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Webhook Configuration
            </CardTitle>
            <CardDescription>Twilio WhatsApp webhook settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook_url"
                  value={formData.whatsapp_webhook_url || ''}
                  onChange={(e) => handleChange('whatsapp_webhook_url', e.target.value)}
                  placeholder="https://your-project.supabase.co/functions/v1/whatsapp-webhook"
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyWebhookUrl}
                  disabled={!formData.whatsapp_webhook_url}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Configure this URL in your Twilio WhatsApp sandbox/business settings
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={testWebhook}
                disabled={!formData.whatsapp_webhook_url || testing}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Webhook
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <Alert
                variant={testResult.success ? 'default' : 'destructive'}
                className="mt-4"
              >
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-2">Webhook Setup Instructions</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Copy the webhook URL above</li>
                <li>Go to Twilio Console → Messaging → Settings</li>
                <li>Find your WhatsApp sandbox or business number</li>
                <li>Paste the URL in "When a message comes in" field</li>
                <li>Set HTTP method to POST</li>
                <li>Save and test by sending a message</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Security</CardTitle>
            <CardDescription>Security settings for webhook requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="validate_signature">Validate Twilio Signature</Label>
                <p className="text-sm text-muted-foreground">
                  Verify webhook requests are from Twilio
                </p>
              </div>
              <Switch
                id="validate_signature"
                checked={formData.validate_signature || false}
                onCheckedChange={(checked) =>
                  handleChange('validate_signature', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="rate_limiting">Rate Limiting</Label>
                <p className="text-sm text-muted-foreground">
                  Limit messages per phone number
                </p>
              </div>
              <Switch
                id="rate_limiting"
                checked={formData.rate_limiting_enabled || false}
                onCheckedChange={(checked) =>
                  handleChange('rate_limiting_enabled', checked)
                }
              />
            </div>

            {formData.rate_limiting_enabled && (
              <div className="space-y-2">
                <Label htmlFor="rate_limit">Messages per minute</Label>
                <Input
                  id="rate_limit"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.rate_limit || 5}
                  onChange={(e) => handleChange('rate_limit', parseInt(e.target.value))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Notifications Tab */}
      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Admin Notifications
            </CardTitle>
            <CardDescription>
              Configure notifications for admin users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>New Message Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify admins of new WhatsApp messages
                </p>
              </div>
              <Switch
                checked={formData.notify_new_messages || false}
                onCheckedChange={(checked) =>
                  handleChange('notify_new_messages', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Booking Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when bookings are created or updated
                </p>
              </div>
              <Switch
                checked={formData.notify_bookings || false}
                onCheckedChange={(checked) => handleChange('notify_bookings', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Error Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when webhook or AI errors occur
                </p>
              </div>
              <Switch
                checked={formData.notify_errors || true}
                onCheckedChange={(checked) => handleChange('notify_errors', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification_email">Notification Email</Label>
              <Input
                id="notification_email"
                type="email"
                value={formData.notification_email || ''}
                onChange={(e) => handleChange('notification_email', e.target.value)}
                placeholder="admin@ethiopianmaids.com"
              />
              <p className="text-xs text-muted-foreground">
                Email address for receiving notifications
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Notifications</CardTitle>
            <CardDescription>Automated messages sent to users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Booking Confirmations</Label>
                <p className="text-sm text-muted-foreground">
                  Auto-send confirmation when booking is confirmed
                </p>
              </div>
              <Switch
                checked={formData.auto_confirm_bookings || false}
                onCheckedChange={(checked) =>
                  handleChange('auto_confirm_bookings', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Booking Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send reminders 24 hours before booking
                </p>
              </div>
              <Switch
                checked={formData.send_reminders || false}
                onCheckedChange={(checked) => handleChange('send_reminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Follow-up Messages</Label>
                <p className="text-sm text-muted-foreground">
                  Request feedback after completed bookings
                </p>
              </div>
              <Switch
                checked={formData.send_followups || false}
                onCheckedChange={(checked) => handleChange('send_followups', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Advanced Settings Tab */}
      <TabsContent value="advanced" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Advanced configuration options for power users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Changing these settings may affect system behavior. Only modify if you
                understand the implications.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="max_tokens">Max AI Response Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                min="256"
                max="4096"
                value={formData.max_tokens || 1024}
                onChange={(e) => handleChange('max_tokens', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum length of AI responses (256-4096)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Request Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min="5"
                max="60"
                value={formData.timeout || 30}
                onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Timeout for webhook and AI requests (5-60 seconds)
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Debug Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Log detailed information for troubleshooting
                </p>
              </div>
              <Switch
                checked={formData.debug_mode || false}
                onCheckedChange={(checked) => handleChange('debug_mode', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Store AI Responses</Label>
                <p className="text-sm text-muted-foreground">
                  Save full AI response data for analysis
                </p>
              </div>
              <Switch
                checked={formData.store_ai_responses !== false}
                onCheckedChange={(checked) =>
                  handleChange('store_ai_responses', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowed_numbers">Allowed Phone Numbers (Optional)</Label>
              <Textarea
                id="allowed_numbers"
                value={formData.allowed_numbers || ''}
                onChange={(e) => handleChange('allowed_numbers', e.target.value)}
                placeholder="+971501234567&#10;+966501234567&#10;+974501234567"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to allow all numbers. One number per line (E.164 format)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blocked_numbers">Blocked Phone Numbers</Label>
              <Textarea
                id="blocked_numbers"
                value={formData.blocked_numbers || ''}
                onChange={(e) => handleChange('blocked_numbers', e.target.value)}
                placeholder="+1234567890"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Numbers that will be automatically blocked. One number per line
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cache Settings</CardTitle>
            <CardDescription>Configure caching behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cache_timeout">Maid Cache Refresh (minutes)</Label>
              <Input
                id="cache_timeout"
                type="number"
                min="1"
                max="60"
                value={formData.cache_timeout || 5}
                onChange={(e) => handleChange('cache_timeout', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                How often to refresh maid availability cache (1-60 minutes)
              </p>
            </div>

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Cache Now
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Save Button - Fixed at bottom */}
      <div className="sticky bottom-0 bg-white border-t pt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => setFormData(settings)}>
          Reset Changes
        </Button>
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </Tabs>
  );
};

export default SettingsForm;
