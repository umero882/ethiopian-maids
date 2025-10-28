/**
 * 🔍 Security Dashboard Component
 * Displays security events and monitoring information for administrators
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  AlertTriangle,
  Eye,
  Lock,
  FileText,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/databaseClient';
import { useAuth } from '@/contexts/AuthContext';

const SecurityDashboard = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [securityStats, setSecurityStats] = useState({
    totalEvents: 0,
    criticalEvents: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is admin
  const isAdmin = user?.userType === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadSecurityData();
    }
  }, [isAdmin]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Load recent audit logs
      const { data: logs, error: logsError } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      setAuditLogs(logs || []);

      // Calculate security statistics
      const stats = calculateSecurityStats(logs || []);
      setSecurityStats(stats);
    } catch (err) {
      console.error('Error loading security data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateSecurityStats = (logs) => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentLogs = logs.filter(
      (log) => new Date(log.created_at) > last24Hours
    );

    return {
      totalEvents: recentLogs.length,
      criticalEvents: recentLogs.filter((log) =>
        [
          'suspicious_activity',
          'permission_denied',
          'csrf_violation',
          'xss_attempt',
        ].includes(log.event_type)
      ).length,
      failedLogins: recentLogs.filter(
        (log) => log.event_type === 'login_failure'
      ).length,
      suspiciousActivity: recentLogs.filter(
        (log) => log.event_type === 'suspicious_activity'
      ).length,
    };
  };

  const getEventIcon = (eventType) => {
    const iconMap = {
      login_success: <Users className='w-4 h-4 text-green-500' />,
      login_failure: <Lock className='w-4 h-4 text-red-500' />,
      logout: <Users className='w-4 h-4 text-blue-500' />,
      registration: <Users className='w-4 h-4 text-green-500' />,
      profile_update: <FileText className='w-4 h-4 text-blue-500' />,
      profile_view: <Eye className='w-4 h-4 text-gray-500' />,
      file_upload: <FileText className='w-4 h-4 text-blue-500' />,
      file_delete: <FileText className='w-4 h-4 text-orange-500' />,
      permission_denied: <Shield className='w-4 h-4 text-red-500' />,
      rate_limit_exceeded: (
        <AlertTriangle className='w-4 h-4 text-yellow-500' />
      ),
      suspicious_activity: <AlertTriangle className='w-4 h-4 text-red-500' />,
      csrf_violation: <Shield className='w-4 h-4 text-red-500' />,
      xss_attempt: <Shield className='w-4 h-4 text-red-500' />,
    };
    return iconMap[eventType] || <FileText className='w-4 h-4 text-gray-500' />;
  };

  const getEventSeverity = (eventType) => {
    const criticalEvents = [
      'suspicious_activity',
      'permission_denied',
      'csrf_violation',
      'xss_attempt',
    ];
    const warningEvents = ['login_failure', 'rate_limit_exceeded'];

    if (criticalEvents.includes(eventType)) return 'critical';
    if (warningEvents.includes(eventType)) return 'warning';
    return 'info';
  };

  const formatEventType = (eventType) => {
    return eventType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className='h-4 w-4' />
        <AlertDescription>
          Access denied. Administrator privileges required to view security
          dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500'></div>
        <span className='ml-2'>Loading security data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertTriangle className='h-4 w-4' />
        <AlertDescription>
          Error loading security data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Security Statistics */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Events (24h)
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {securityStats.totalEvents}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Critical Events
            </CardTitle>
            <AlertTriangle className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {securityStats.criticalEvents}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Failed Logins</CardTitle>
            <Lock className='h-4 w-4 text-yellow-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>
              {securityStats.failedLogins}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Suspicious Activity
            </CardTitle>
            <Shield className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {securityStats.suspiciousActivity}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Latest security events and audit logs
              </CardDescription>
            </div>
            <Button onClick={loadSecurityData} variant='outline' size='sm'>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {auditLogs.length === 0 ? (
              <p className='text-muted-foreground text-center py-4'>
                No security events found.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className='flex items-start space-x-3 p-3 rounded-lg border bg-card'
                >
                  <div className='flex-shrink-0 mt-1'>
                    {getEventIcon(log.event_type)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center space-x-2'>
                      <p className='text-sm font-medium'>
                        {formatEventType(log.event_type)}
                      </p>
                      <Badge
                        variant={
                          getEventSeverity(log.event_type) === 'critical'
                            ? 'destructive'
                            : getEventSeverity(log.event_type) === 'warning'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {getEventSeverity(log.event_type)}
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    {log.event_details &&
                      Object.keys(log.event_details).length > 0 && (
                        <details className='mt-2'>
                          <summary className='text-xs text-muted-foreground cursor-pointer'>
                            View Details
                          </summary>
                          <pre className='text-xs bg-muted p-2 rounded mt-1 overflow-auto'>
                            {JSON.stringify(log.event_details, null, 2)}
                          </pre>
                        </details>
                      )}
                  </div>
                  <div className='flex-shrink-0 text-xs text-muted-foreground'>
                    {log.user_id
                      ? `User: ${log.user_id.slice(0, 8)}...`
                      : 'Anonymous'}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
