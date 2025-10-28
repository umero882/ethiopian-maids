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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Activity,
  Server,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Download,
  Upload,
  FileText,
  Terminal,
  Bug,
  Zap,
  Globe,
  Lock,
  Settings,
  Trash2,
  RefreshCw,
  MonitorSpeaker,
  HardDrive,
  Cpu,
  Wifi,
  Mail
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockLogsData = [
  {
    id: 'log_001',
    timestamp: '2024-03-20T14:30:22.847Z',
    level: 'info',
    category: 'authentication',
    source: 'auth-service',
    event: 'user_login',
    message: 'User successfully logged in',
    user_id: 'maid_001',
    user_name: 'Fatima Ahmed',
    user_type: 'maid',
    ip_address: '192.168.1.45',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    session_id: 'sess_abc123def456',
    request_id: 'req_789xyz012',
    duration: 150,
    details: {
      login_method: 'password',
      two_factor_enabled: false,
      device_type: 'desktop',
      browser: 'Chrome',
      os: 'Windows 10',
      location: 'Addis Ababa, Ethiopia'
    }
  },
  {
    id: 'log_002',
    timestamp: '2024-03-20T14:25:15.123Z',
    level: 'error',
    category: 'payment',
    source: 'payment-gateway',
    event: 'payment_failed',
    message: 'Payment processing failed due to insufficient funds',
    user_id: 'sponsor_001',
    user_name: 'Ahmed Hassan',
    user_type: 'sponsor',
    ip_address: '10.0.0.15',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    session_id: 'sess_mobile456',
    request_id: 'req_payment789',
    duration: 3200,
    error_code: 'INSUFFICIENT_FUNDS',
    details: {
      payment_method: 'credit_card',
      amount: 850.00,
      currency: 'USD',
      card_last_four: '4532',
      gateway: 'Stripe',
      decline_reason: 'Insufficient funds',
      retry_count: 2
    }
  },
  {
    id: 'log_003',
    timestamp: '2024-03-20T14:20:08.567Z',
    level: 'warning',
    category: 'security',
    source: 'security-monitor',
    event: 'suspicious_activity',
    message: 'Multiple failed login attempts detected',
    user_id: null,
    user_name: null,
    user_type: null,
    ip_address: '203.45.67.89',
    user_agent: 'curl/7.68.0',
    session_id: null,
    request_id: 'req_security123',
    duration: 45,
    details: {
      failed_attempts: 5,
      time_window: '5 minutes',
      attempted_usernames: ['admin', 'administrator', 'root', 'test', 'user'],
      threat_level: 'medium',
      action_taken: 'ip_blocked_temp',
      block_duration: '15 minutes'
    }
  },
  {
    id: 'log_004',
    timestamp: '2024-03-20T14:15:44.321Z',
    level: 'info',
    category: 'database',
    source: 'db-migration',
    event: 'migration_completed',
    message: 'Database migration v2.1.3 completed successfully',
    user_id: 'admin_001',
    user_name: 'Sarah Wilson',
    user_type: 'admin',
    ip_address: '172.16.0.10',
    user_agent: 'DB-Migration-Tool/1.0',
    session_id: 'sess_admin789',
    request_id: 'req_migration456',
    duration: 45000,
    details: {
      migration_version: 'v2.1.3',
      tables_affected: ['users', 'bookings', 'payments', 'notifications'],
      records_migrated: 15847,
      rollback_available: true,
      backup_created: true,
      backup_location: '/backups/pre_v2.1.3_20240320.sql'
    }
  },
  {
    id: 'log_005',
    timestamp: '2024-03-20T14:10:33.789Z',
    level: 'debug',
    category: 'api',
    source: 'api-gateway',
    event: 'rate_limit_exceeded',
    message: 'API rate limit exceeded for client',
    user_id: 'agency_001',
    user_name: 'EthioMaid Services Ltd.',
    user_type: 'agency',
    ip_address: '192.168.100.25',
    user_agent: 'EthioMaid-API-Client/2.0',
    session_id: 'sess_api_client',
    request_id: 'req_api_limit789',
    duration: 5,
    details: {
      rate_limit: 1000,
      requests_made: 1001,
      time_window: '1 hour',
      endpoint: '/api/v1/bookings',
      action_taken: 'request_rejected',
      reset_time: '2024-03-20T15:00:00Z'
    }
  },
  {
    id: 'log_006',
    timestamp: '2024-03-20T14:05:12.456Z',
    level: 'error',
    category: 'system',
    source: 'email-service',
    event: 'email_delivery_failed',
    message: 'Failed to send notification email',
    user_id: 'maid_002',
    user_name: 'Sara Mohammed',
    user_type: 'maid',
    ip_address: '10.0.1.50',
    user_agent: 'Email-Service/1.0',
    session_id: null,
    request_id: 'req_email_notification',
    duration: 15000,
    error_code: 'SMTP_CONNECTION_TIMEOUT',
    details: {
      email_type: 'booking_confirmation',
      recipient: 'sara.mohammed@example.com',
      smtp_server: 'smtp.gmail.com',
      error_message: 'Connection timeout after 15000ms',
      retry_scheduled: true,
      next_retry: '2024-03-20T14:10:12Z'
    }
  },
  {
    id: 'log_007',
    timestamp: '2024-03-20T14:00:55.234Z',
    level: 'info',
    category: 'admin',
    source: 'admin-panel',
    event: 'admin_action',
    message: 'Admin updated user profile',
    user_id: 'admin_002',
    user_name: 'Michael Brown',
    user_type: 'admin',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    session_id: 'sess_admin_panel',
    request_id: 'req_profile_update',
    duration: 800,
    details: {
      target_user_id: 'maid_003',
      target_user_name: 'Helen Gebru',
      action: 'profile_verification_approved',
      fields_updated: ['verification_status', 'verified_at'],
      old_values: { verification_status: 'pending' },
      new_values: { verification_status: 'verified', verified_at: '2024-03-20T14:00:55Z' }
    }
  },
  {
    id: 'log_008',
    timestamp: '2024-03-20T13:55:41.678Z',
    level: 'warning',
    category: 'performance',
    source: 'monitoring',
    event: 'high_cpu_usage',
    message: 'Server CPU usage exceeded threshold',
    user_id: null,
    user_name: null,
    user_type: null,
    ip_address: '172.16.0.1',
    user_agent: 'System-Monitor/1.0',
    session_id: null,
    request_id: 'req_system_monitor',
    duration: null,
    details: {
      server_name: 'app-server-01',
      cpu_usage: 85.7,
      threshold: 80.0,
      duration_exceeded: '5 minutes',
      memory_usage: 78.3,
      disk_usage: 65.2,
      load_average: [2.5, 2.1, 1.9],
      top_processes: [
        { name: 'node', cpu: 35.2, memory: 512 },
        { name: 'postgres', cpu: 25.8, memory: 1024 },
        { name: 'nginx', cpu: 15.3, memory: 128 }
      ]
    }
  }
];

const AdminSystemLogsPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [logsData, setLogsData] = useState(mockLogsData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const loadLogsData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('system_logs_page_view', 'admin_system', 'logs');
      setLoading(false);
    };

    loadLogsData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredLogs = useMemo(() => {
    return logsData.filter(log => {
      const matchesSearch =
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.ip_address && log.ip_address.includes(searchTerm)) ||
        (log.request_id && log.request_id.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
      const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
      const matchesTab = activeTab === 'all' ||
                        (activeTab === 'errors' && ['error', 'warning'].includes(log.level)) ||
                        (activeTab === 'security' && log.category === 'security') ||
                        (activeTab === 'performance' && log.category === 'performance') ||
                        (activeTab === 'admin' && log.category === 'admin');

      return matchesSearch && matchesLevel && matchesCategory && matchesSource && matchesTab;
    });
  }, [logsData, searchTerm, levelFilter, categoryFilter, sourceFilter, activeTab]);

  // Sort logs by timestamp (newest first)
  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [filteredLogs]);

  // Pagination
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate summary statistics
  const logsSummary = useMemo(() => {
    const totalLogs = logsData.length;
    const errorLogs = logsData.filter(l => l.level === 'error').length;
    const warningLogs = logsData.filter(l => l.level === 'warning').length;
    const infoLogs = logsData.filter(l => l.level === 'info').length;
    const securityEvents = logsData.filter(l => l.category === 'security').length;
    const recentErrors = logsData.filter(l =>
      l.level === 'error' &&
      new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    return { totalLogs, errorLogs, warningLogs, infoLogs, securityEvents, recentErrors };
  }, [logsData]);

  const getLevelBadge = (level) => {
    const levelConfig = {
      error: { label: 'Error', icon: XCircle, color: 'bg-red-100 text-red-800' },
      warning: { label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
      info: { label: 'Info', icon: CheckCircle2, color: 'bg-blue-100 text-blue-800' },
      debug: { label: 'Debug', icon: Bug, color: 'bg-gray-100 text-gray-800' }
    };

    const config = levelConfig[level] || levelConfig.info;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      authentication: Lock,
      payment: Database,
      security: Shield,
      database: HardDrive,
      api: Globe,
      system: Server,
      admin: Settings,
      performance: Cpu,
      email: Mail
    };

    const Icon = categoryIcons[category] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getSourceIcon = (source) => {
    const sourceIcons = {
      'auth-service': Lock,
      'payment-gateway': Database,
      'security-monitor': Shield,
      'db-migration': HardDrive,
      'api-gateway': Globe,
      'email-service': Mail,
      'admin-panel': Settings,
      'monitoring': MonitorSpeaker
    };

    const Icon = sourceIcons[source] || Terminal;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  const LogDetailDialog = ({ log, open, onOpenChange }) => {
    if (!log) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Activity className="h-6 w-6" />
              <div>
                <p className="text-xl font-semibold">{log.event.replace('_', ' ').toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">{log.message}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Log Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Log Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Level:</span>
                    {getLevelBadge(log.level)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Category:</span>
                    <div className="flex items-center gap-1">
                      {getCategoryIcon(log.category)}
                      <span className="text-sm">{log.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Source:</span>
                    <div className="flex items-center gap-1">
                      {getSourceIcon(log.source)}
                      <span className="text-sm">{log.source}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Duration:</span>
                    <span className="text-sm">{formatDuration(log.duration)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Timestamp:</span>
                    <span className="text-sm">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">IP Address:</span>
                    <span className="text-sm font-mono">{log.ip_address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Request ID:</span>
                    <span className="text-sm font-mono">{log.request_id}</span>
                  </div>
                  {log.session_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Session ID:</span>
                      <span className="text-sm font-mono">{log.session_id}</span>
                    </div>
                  )}
                  {log.error_code && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Error Code:</span>
                      <Badge variant="destructive">{log.error_code}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Information */}
            {log.user_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{log.user_name?.split(' ').map(n => n[0]).join('') || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{log.user_name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">{log.user_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">User ID:</span>
                    <span className="text-sm font-mono">{log.user_id}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-sm font-medium">User Agent:</span>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {log.user_agent}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* System Information (for non-user events) */}
            {!log.user_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">System Event</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-sm font-medium">User Agent:</span>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {log.user_agent}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detailed Information */}
          {log.details && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Additional Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
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
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground">
            Monitor system activity, errors, and audit trails {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logsSummary.totalLogs}</div>
            <p className="text-xs text-muted-foreground">All events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{logsSummary.errorLogs}</div>
            <p className="text-xs text-muted-foreground">Critical issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{logsSummary.warningLogs}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{logsSummary.infoLogs}</div>
            <p className="text-xs text-muted-foreground">General events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{logsSummary.securityEvents}</div>
            <p className="text-xs text-muted-foreground">Security events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{logsSummary.recentErrors}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Log Management</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Old Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Logs</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="admin">Admin Actions</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search logs by message, event, source, user, IP, or request ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Log Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="authentication">Authentication</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="auth-service">Auth Service</SelectItem>
                    <SelectItem value="payment-gateway">Payment Gateway</SelectItem>
                    <SelectItem value="security-monitor">Security Monitor</SelectItem>
                    <SelectItem value="db-migration">DB Migration</SelectItem>
                    <SelectItem value="api-gateway">API Gateway</SelectItem>
                    <SelectItem value="email-service">Email Service</SelectItem>
                    <SelectItem value="admin-panel">Admin Panel</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Logs Table */}
              <TabsContent value={activeTab} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-mono text-xs">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </div>
                            <div className="font-mono text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {getLevelBadge(log.level)}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(log.category)}
                            <span className="text-sm">{log.category}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSourceIcon(log.source)}
                            <span className="text-sm">{log.source}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.event.replace('_', ' ')}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDuration(log.duration)}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {log.user_name ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {log.user_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium">{log.user_name}</div>
                                <div className="text-xs text-muted-foreground">{log.user_type}</div>
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline">System</Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="text-sm max-w-[300px]">
                            <p className="truncate">{log.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground font-mono">
                                {log.ip_address}
                              </span>
                              {log.error_code && (
                                <Badge variant="destructive" className="text-xs">
                                  {log.error_code}
                                </Badge>
                              )}
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
                                  setSelectedLog(log);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Export Log
                              </DropdownMenuItem>
                              {log.level === 'error' && (
                                <DropdownMenuItem>
                                  <Bug className="mr-2 h-4 w-4" />
                                  Create Issue
                                </DropdownMenuItem>
                              )}
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedLogs.length)} of {sortedLogs.length} results
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
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <LogDetailDialog
        log={selectedLog}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminSystemLogsPage;