import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Save,
  RefreshCw,
  Settings,
  Shield,
  Mail,
  Upload,
  Clock,
  Globe,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/lib/databaseClient';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminSystemSettingsPage');

const AdminSystemSettingsPage = () => {
  const { canAccess, logAdminActivity } = useAdminAuth();
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const settingsConfig = [
    {
      section: 'Platform Settings',
      icon: Globe,
      description: 'Core platform configuration and behavior',
      settings: [
        {
          key: 'maintenance_mode',
          type: 'boolean',
          label: 'Maintenance Mode',
          description: 'Enable maintenance mode to temporarily disable the platform',
          icon: AlertTriangle,
          severity: 'high'
        },
        {
          key: 'new_registrations',
          type: 'boolean',
          label: 'Allow New Registrations',
          description: 'Allow new users to register on the platform',
          icon: Shield
        },
        {
          key: 'platform_name',
          type: 'string',
          label: 'Platform Name',
          description: 'Display name for the platform',
          icon: Globe
        }
      ]
    },
    {
      section: 'File & Upload Settings',
      icon: Upload,
      description: 'File upload and media management settings',
      settings: [
        {
          key: 'max_upload_size',
          type: 'number',
          label: 'Max Upload Size (MB)',
          description: 'Maximum file size for uploads in megabytes',
          icon: Upload,
          transform: (value) => Math.round(value / 1048576), // bytes to MB
          reverseTransform: (value) => value * 1048576 // MB to bytes
        }
      ]
    },
    {
      section: 'Security Settings',
      icon: Shield,
      description: 'Authentication and security configuration',
      settings: [
        {
          key: 'require_email_verification',
          type: 'boolean',
          label: 'Require Email Verification',
          description: 'Require users to verify their email before accessing the platform',
          icon: Mail
        },
        {
          key: 'session_timeout',
          type: 'number',
          label: 'Session Timeout (minutes)',
          description: 'User session timeout duration in minutes',
          icon: Clock
        },
        {
          key: 'max_login_attempts',
          type: 'number',
          label: 'Max Login Attempts',
          description: 'Maximum failed login attempts before account lockout',
          icon: Shield
        }
      ]
    },
    {
      section: 'Contact & Support',
      icon: Mail,
      description: 'Contact information and support settings',
      settings: [
        {
          key: 'support_email',
          type: 'string',
          label: 'Support Email',
          description: 'Email address for customer support',
          icon: Mail
        }
      ]
    }
  ];

  useEffect(() => {
    loadSettings();
    logAdminActivity('system_settings_view', 'settings', 'list');
  }, [logAdminActivity]);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settingsMap = {};
      data.forEach(setting => {
        try {
          // Parse JSON values, handle both JSON and plain strings
          let value = setting.setting_value;
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch {
              // If parsing fails, keep as string
            }
          }
          settingsMap[setting.setting_key] = value;
        } catch (parseError) {
          log.warn(`Failed to parse setting ${setting.setting_key}:`, parseError);
          settingsMap[setting.setting_key] = setting.setting_value;
        }
      });

      setSettings(settingsMap);
      setOriginalSettings({ ...settingsMap });
    } catch (error) {
      log.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Check if settings have changed
    const hasChanges = Object.keys(newSettings).some(k => {
      return JSON.stringify(newSettings[k]) !== JSON.stringify(originalSettings[k]);
    });
    setIsDirty(hasChanges);
  };

  const saveSettings = async () => {
    if (!canAccess('system', 'write')) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to modify system settings.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Get changed settings
      const changedSettings = Object.keys(settings).filter(key => {
        return JSON.stringify(settings[key]) !== JSON.stringify(originalSettings[key]);
      });

      if (changedSettings.length === 0) {
        toast({
          title: 'No Changes',
          description: 'No settings have been modified.',
        });
        return;
      }

      // Update changed settings
      for (const key of changedSettings) {
        const value = settings[key];

        const { error } = await supabase
          .from('system_settings')
          .upsert({
            setting_key: key,
            setting_value: JSON.stringify(value),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'setting_key'
          });

        if (error) throw error;
      }

      await logAdminActivity('system_settings_updated', 'settings', 'bulk', {
        changed_settings: changedSettings,
        changes: changedSettings.reduce((acc, key) => {
          acc[key] = {
            old_value: originalSettings[key],
            new_value: settings[key]
          };
          return acc;
        }, {})
      });

      setOriginalSettings({ ...settings });
      setIsDirty(false);

      toast({
        title: 'Settings Saved',
        description: `Successfully updated ${changedSettings.length} setting(s).`,
      });

      // Show warning for sensitive settings
      if (changedSettings.includes('maintenance_mode') && settings.maintenance_mode) {
        toast({
          title: 'Maintenance Mode Enabled',
          description: 'The platform is now in maintenance mode. Users will not be able to access the platform.',
          variant: 'destructive',
        });
      }

    } catch (error) {
      log.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings({ ...originalSettings });
    setIsDirty(false);
  };

  const renderSettingInput = (settingConfig) => {
    const { key, type, label, description, transform, reverseTransform, severity } = settingConfig;
    let value = settings[key];

    // Apply transform for display
    if (transform && value != null) {
      value = transform(value);
    }

    const handleChange = (newValue) => {
      // Apply reverse transform for storage
      if (reverseTransform && newValue != null) {
        newValue = reverseTransform(newValue);
      }
      updateSetting(key, newValue);
    };

    const commonProps = {
      id: key,
      disabled: !canAccess('system', 'write')
    };

    switch (type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label htmlFor={key} className="flex items-center gap-2">
                <settingConfig.icon className="h-4 w-4" />
                {label}
                {severity === 'high' && (
                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                {...commonProps}
                checked={Boolean(value)}
                onCheckedChange={handleChange}
              />
              {value ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={key} className="flex items-center gap-2">
              <settingConfig.icon className="h-4 w-4" />
              {label}
            </Label>
            <Input
              {...commonProps}
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
              placeholder="Enter value"
            />
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        );

      case 'string':
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={key} className="flex items-center gap-2">
              <settingConfig.icon className="h-4 w-4" />
              {label}
            </Label>
            <Input
              {...commonProps}
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Enter value"
            />
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure platform-wide settings and behavior
          </p>
        </div>

        {isDirty && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Warning for maintenance mode */}
      {settings.maintenance_mode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Maintenance mode is currently enabled.
            The platform is inaccessible to regular users.
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsConfig.map((section, index) => (
          <Card key={section.section}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                {section.section}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.settings.map((setting, settingIndex) => (
                <div key={setting.key}>
                  {renderSettingInput(setting)}
                  {settingIndex < section.settings.length - 1 && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Changes Banner */}
      {isDirty && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96">
          <Card className="shadow-lg border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Unsaved Changes</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetSettings}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveSettings} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminSystemSettingsPage;