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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Switch } from '@/components/ui/switch';
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
  Settings,
  Database,
  HardDrive,
  RefreshCw,
  Play,
  Pause,
  Square,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Download,
  Upload,
  Server,
  Cpu,
  MemoryStick,
  Network,
  Shield,
  Zap,
  FileText,
  Archive,
  RotateCcw,
  Power,
  Activity,
  Eye,
  Edit,
  Plus,
  Minus,
  Save
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockMaintenanceData = {
  scheduled_tasks: [
    {
      id: 'task_001',
      name: 'Database Backup',
      description: 'Full database backup to cloud storage',
      type: 'backup',
      schedule: '0 2 * * *', // Daily at 2 AM
      schedule_readable: 'Daily at 2:00 AM',
      status: 'active',
      last_run: '2024-03-20T02:00:00Z',
      next_run: '2024-03-21T02:00:00Z',
      duration_last: 1800, // seconds
      success_rate: 98.5,
      enabled: true,
      priority: 'high',
      command: 'pg_dump ethiomaids_prod > /backups/daily_backup_$(date +%Y%m%d).sql',
      timeout: 3600,
      retry_count: 3,
      notifications: ['admin@ethiomaids.com']
    },
    {
      id: 'task_002',
      name: 'Cache Cleanup',
      description: 'Clear expired cache entries and optimize memory',
      type: 'cleanup',
      schedule: '0 */6 * * *', // Every 6 hours
      schedule_readable: 'Every 6 hours',
      status: 'running',
      last_run: '2024-03-20T12:00:00Z',
      next_run: '2024-03-20T18:00:00Z',
      duration_last: 300,
      success_rate: 99.2,
      enabled: true,
      priority: 'medium',
      command: 'redis-cli FLUSHALL',
      timeout: 600,
      retry_count: 2,
      notifications: ['devops@ethiomaids.com']
    },
    {
      id: 'task_003',
      name: 'Log Rotation',
      description: 'Rotate and compress old log files',
      type: 'maintenance',
      schedule: '0 1 * * 0', // Weekly on Sunday at 1 AM
      schedule_readable: 'Weekly on Sunday at 1:00 AM',
      status: 'active',
      last_run: '2024-03-17T01:00:00Z',
      next_run: '2024-03-24T01:00:00Z',
      duration_last: 120,
      success_rate: 100.0,
      enabled: true,
      priority: 'low',
      command: '/usr/sbin/logrotate /etc/logrotate.conf',
      timeout: 1800,
      retry_count: 1,
      notifications: []
    },
    {
      id: 'task_004',
      name: 'Security Scan',
      description: 'Run automated security vulnerability scan',
      type: 'security',
      schedule: '0 3 * * 1', // Weekly on Monday at 3 AM
      schedule_readable: 'Weekly on Monday at 3:00 AM',
      status: 'failed',
      last_run: '2024-03-18T03:00:00Z',
      next_run: '2024-03-25T03:00:00Z',
      duration_last: 0,
      success_rate: 87.5,
      enabled: true,
      priority: 'high',
      command: '/opt/security-scanner/scan.sh --full',
      timeout: 7200,
      retry_count: 2,
      notifications: ['security@ethiomaids.com'],
      last_error: 'Scanner configuration file not found'
    },
    {
      id: 'task_005',
      name: 'Database Optimization',
      description: 'Analyze tables and rebuild indexes for performance',
      type: 'optimization',
      schedule: '0 4 * * 6', // Weekly on Saturday at 4 AM
      schedule_readable: 'Weekly on Saturday at 4:00 AM',
      status: 'active',
      last_run: '2024-03-16T04:00:00Z',
      next_run: '2024-03-23T04:00:00Z',
      duration_last: 2400,
      success_rate: 95.8,
      enabled: true,
      priority: 'medium',
      command: 'psql -d ethiomaids_prod -c "VACUUM ANALYZE; REINDEX DATABASE ethiomaids_prod;"',
      timeout: 14400,
      retry_count: 1,
      notifications: ['dba@ethiomaids.com']
    }
  ],
  system_operations: [
    {
      id: 'op_001',
      name: 'Restart API Server',
      description: 'Gracefully restart the API server with zero downtime',
      category: 'service_control',
      risk_level: 'medium',
      estimated_duration: 30,
      requires_confirmation: true,
      can_schedule: true,
      command: 'systemctl restart api-server',
      preconditions: ['Check active connections < 50', 'Verify backup API server is running'],
      postconditions: ['Verify service health check passes', 'Confirm all endpoints responding']
    },
    {
      id: 'op_002',
      name: 'Clear Application Cache',
      description: 'Clear all application-level cache to resolve stale data issues',
      category: 'cache_management',
      risk_level: 'low',
      estimated_duration: 5,
      requires_confirmation: false,
      can_schedule: false,
      command: 'redis-cli -h cache-server FLUSHALL',
      preconditions: [],
      postconditions: ['Verify cache is empty', 'Monitor cache hit rate recovery']
    },
    {
      id: 'op_003',
      name: 'Database Vacuum Full',
      description: 'Perform full database vacuum to reclaim disk space (requires maintenance window)',
      category: 'database_maintenance',
      risk_level: 'high',
      estimated_duration: 180,
      requires_confirmation: true,
      can_schedule: true,
      command: 'psql -d ethiomaids_prod -c "VACUUM FULL;"',
      preconditions: ['Enable maintenance mode', 'Notify users of downtime', 'Create backup'],
      postconditions: ['Disable maintenance mode', 'Verify application functionality', 'Update disk usage metrics']
    },
    {
      id: 'op_004',
      name: 'SSL Certificate Renewal',
      description: 'Renew SSL certificates for all domains',
      category: 'security',
      risk_level: 'medium',
      estimated_duration: 10,
      requires_confirmation: true,
      can_schedule: true,
      command: 'certbot renew --force-renewal',
      preconditions: ['Verify DNS records', 'Check certificate expiry dates'],
      postconditions: ['Verify new certificates are valid', 'Test HTTPS endpoints']
    },
    {
      id: 'op_005',
      name: 'Export System Metrics',
      description: 'Export system performance metrics for the last 30 days',
      category: 'reporting',
      risk_level: 'low',
      estimated_duration: 15,
      requires_confirmation: false,
      can_schedule: true,
      command: '/opt/monitoring/export-metrics.sh --period 30d',
      preconditions: [],
      postconditions: ['Verify export file is generated', 'Send report via email']
    }
  ],
  maintenance_windows: [
    {
      id: 'window_001',
      name: 'Weekly Maintenance',
      description: 'Regular weekly maintenance for database optimization and updates',
      start_time: '2024-03-24T02:00:00Z',
      end_time: '2024-03-24T06:00:00Z',
      duration: 240, // minutes
      status: 'scheduled',
      type: 'recurring',
      recurrence: 'weekly',
      affected_services: ['database', 'api-server', 'web-server'],
      scheduled_tasks: ['task_003', 'task_005'],
      notifications_sent: false,
      created_by: 'admin_001',
      created_at: '2024-03-15T10:00:00Z'
    },
    {
      id: 'window_002',
      name: 'Security Updates',
      description: 'Apply critical security patches to all systems',
      start_time: '2024-03-22T01:00:00Z',
      end_time: '2024-03-22T03:00:00Z',
      duration: 120,
      status: 'completed',
      type: 'one_time',
      recurrence: null,
      affected_services: ['all'],
      scheduled_tasks: [],
      notifications_sent: true,
      created_by: 'admin_002',
      created_at: '2024-03-20T14:00:00Z',
      completion_notes: 'All patches applied successfully. System reboot required was completed.'
    }
  ],
  system_status: {
    maintenance_mode: false,
    last_backup: '2024-03-20T02:00:00Z',
    backup_size: '2.5 GB',
    disk_cleanup_needed: false,
    cache_hit_rate: 94.7,
    active_connections: 156,
    queue_health: {
      email_queue: 23,
      notification_queue: 5,
      background_jobs: 12
    }
  }
};

const AdminSystemMaintenancePage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [maintenanceData, setMaintenanceData] = useState(mockMaintenanceData);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [operationToRun, setOperationToRun] = useState(null);

  useEffect(() => {
    const loadMaintenanceData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('system_maintenance_page_view', 'admin_system', 'maintenance');
      setLoading(false);
    };

    loadMaintenanceData();
  }, [logAdminActivity]);

  const handleTaskToggle = async (taskId, enabled) => {
    try {
      setMaintenanceData(prev => ({
        ...prev,
        scheduled_tasks: prev.scheduled_tasks.map(task =>
          task.id === taskId ? { ...task, enabled } : task
        )
      }));

      await logAdminActivity(`task_${enabled ? 'enabled' : 'disabled'}`, 'scheduled_task', taskId);

      toast({
        title: 'Task Updated',
        description: `Task has been ${enabled ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task status.',
        variant: 'destructive',
      });
    }
  };

  const handleRunOperation = async (operation) => {
    try {
      // Simulate operation execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      await logAdminActivity('manual_operation_executed', 'system_operation', operation.id);

      toast({
        title: 'Operation Completed',
        description: `${operation.name} has been executed successfully.`,
      });

      setIsConfirmDialogOpen(false);
      setOperationToRun(null);
    } catch (error) {
      toast({
        title: 'Operation Failed',
        description: 'Failed to execute the operation.',
        variant: 'destructive',
      });
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      const newMode = !maintenanceData.system_status.maintenance_mode;

      setMaintenanceData(prev => ({
        ...prev,
        system_status: {
          ...prev.system_status,
          maintenance_mode: newMode
        }
      }));

      await logAdminActivity(`maintenance_mode_${newMode ? 'enabled' : 'disabled'}`, 'system_status', 'maintenance_mode');

      toast({
        title: 'Maintenance Mode Updated',
        description: `Maintenance mode has been ${newMode ? 'enabled' : 'disabled'}.`,
        variant: newMode ? 'destructive' : 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle maintenance mode.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Active', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      running: { label: 'Running', icon: Play, color: 'bg-blue-100 text-blue-800' },
      failed: { label: 'Failed', icon: XCircle, color: 'bg-red-100 text-red-800' },
      scheduled: { label: 'Scheduled', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      disabled: { label: 'Disabled', icon: Pause, color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { label: 'High', color: 'bg-red-100 text-red-800' },
      medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Low', color: 'bg-gray-100 text-gray-800' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getRiskBadge = (risk) => {
    const riskConfig = {
      high: { label: 'High Risk', color: 'bg-red-100 text-red-800' },
      medium: { label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Low Risk', color: 'bg-green-100 text-green-800' }
    };

    const config = riskConfig[risk] || riskConfig.low;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeIcon = (type) => {
    const typeIcons = {
      backup: Archive,
      cleanup: Trash2,
      maintenance: Settings,
      security: Shield,
      optimization: Zap,
      service_control: Server,
      cache_management: RefreshCw,
      database_maintenance: Database,
      reporting: FileText
    };

    const Icon = typeIcons[type] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
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
          <h1 className="text-3xl font-bold tracking-tight">System Maintenance</h1>
          <p className="text-muted-foreground">
            Manage scheduled tasks, system operations, and maintenance windows {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Maintenance Mode:</span>
            <Switch
              checked={maintenanceData.system_status.maintenance_mode}
              onCheckedChange={toggleMaintenanceMode}
            />
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Warning */}
      {maintenanceData.system_status.maintenance_mode && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Maintenance Mode Active</p>
                <p className="text-sm text-orange-700">
                  The system is currently in maintenance mode. Users may experience limited functionality.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-6 w-6" />
            System Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Archive className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Last Backup</p>
                <p className="text-lg font-bold">{new Date(maintenanceData.system_status.last_backup).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">{maintenanceData.system_status.backup_size}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <RefreshCw className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Cache Hit Rate</p>
                <p className="text-lg font-bold">{maintenanceData.system_status.cache_hit_rate}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Network className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Active Connections</p>
                <p className="text-lg font-bold">{maintenanceData.system_status.active_connections}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Queue Health</p>
                <p className="text-lg font-bold">
                  {Object.values(maintenanceData.system_status.queue_health).reduce((a, b) => a + b, 0)} items
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="scheduled-tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scheduled-tasks">Scheduled Tasks</TabsTrigger>
          <TabsTrigger value="operations">System Operations</TabsTrigger>
          <TabsTrigger value="maintenance-windows">Maintenance Windows</TabsTrigger>
          <TabsTrigger value="queue-management">Queue Management</TabsTrigger>
        </TabsList>

        {/* Scheduled Tasks Tab */}
        <TabsContent value="scheduled-tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Clock className="h-5 w-5" />
                  Scheduled Tasks
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
              <CardDescription>
                Automated tasks that run on a scheduled basis to maintain system health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceData.scheduled_tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-1 bg-gray-100 rounded">
                            {getTypeIcon(task.type)}
                          </div>
                          <div>
                            <p className="font-medium">{task.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {task.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(task.priority)}
                          <Badge variant="outline">{task.type}</Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{task.schedule_readable}</p>
                          <p className="text-muted-foreground font-mono text-xs">{task.schedule}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(task.enabled ? task.status : 'disabled')}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{task.success_rate.toFixed(1)}%</p>
                          {task.last_run && (
                            <p className="text-muted-foreground">
                              Last: {formatDuration(task.duration_last)}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(task.next_run).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">
                            {new Date(task.next_run).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Switch
                          checked={task.enabled}
                          onCheckedChange={(checked) => handleTaskToggle(task.id, checked)}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTask(task);
                              setIsTaskDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                System Operations
              </CardTitle>
              <CardDescription>
                Manual system operations that can be executed on-demand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maintenanceData.system_operations.map((operation) => (
                  <Card key={operation.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{operation.name}</CardTitle>
                        {getRiskBadge(operation.risk_level)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {operation.description}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="outline">{operation.category.replace('_', ' ')}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Est. Duration:</span>
                        <span>{operation.estimated_duration} min</span>
                      </div>
                      {operation.requires_confirmation && (
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          <span className="text-yellow-700">Requires confirmation</span>
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        {operation.requires_confirmation ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" className="flex-1">
                                <Play className="h-4 w-4 mr-2" />
                                Execute
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Operation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to execute "{operation.name}"?
                                  This operation has a {operation.risk_level} risk level and may affect system availability.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRunOperation(operation)}
                                >
                                  Execute
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleRunOperation(operation)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Execute
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOperation(operation);
                            setIsOperationDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Windows Tab */}
        <TabsContent value="maintenance-windows" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Calendar className="h-5 w-5" />
                  Maintenance Windows
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Window
                </Button>
              </div>
              <CardDescription>
                Planned maintenance windows for system updates and major operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceData.maintenance_windows.map((window) => (
                  <Card key={window.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{window.name}</CardTitle>
                        {getStatusBadge(window.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {window.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Schedule</h4>
                          <div className="text-sm space-y-1">
                            <p><strong>Start:</strong> {new Date(window.start_time).toLocaleString()}</p>
                            <p><strong>End:</strong> {new Date(window.end_time).toLocaleString()}</p>
                            <p><strong>Duration:</strong> {window.duration} minutes</p>
                            {window.recurrence && (
                              <p><strong>Recurrence:</strong> {window.recurrence}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Affected Services</h4>
                          <div className="flex flex-wrap gap-1">
                            {window.affected_services.map((service, index) => (
                              <Badge key={index} variant="outline">{service}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Details</h4>
                          <div className="text-sm space-y-1">
                            <p><strong>Created by:</strong> {window.created_by}</p>
                            <p><strong>Notifications:</strong> {window.notifications_sent ? 'Sent' : 'Pending'}</p>
                            {window.completion_notes && (
                              <p><strong>Notes:</strong> {window.completion_notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Management Tab */}
        <TabsContent value="queue-management" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(maintenanceData.system_status.queue_health).map(([queue, count]) => (
              <Card key={queue}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">{queue.replace('_', ' ')}</CardTitle>
                    <Badge variant={count > 50 ? 'destructive' : count > 20 ? 'default' : 'secondary'}>
                      {count} items
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={count > 50 ? 'text-red-600' : 'text-green-600'}>
                        {count > 50 ? 'High' : count > 20 ? 'Normal' : 'Low'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Rate:</span>
                      <span>~{Math.floor(Math.random() * 50) + 10}/min</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Flush
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {getTypeIcon(selectedTask.type)}
                {selectedTask.name}
              </DialogTitle>
              <DialogDescription>
                {selectedTask.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Schedule</h4>
                  <p className="text-sm">{selectedTask.schedule_readable}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedTask.schedule}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Performance</h4>
                  <p className="text-sm">Success Rate: {selectedTask.success_rate.toFixed(1)}%</p>
                  <p className="text-sm">Last Duration: {formatDuration(selectedTask.duration_last)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Command</h4>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {selectedTask.command}
                </code>
              </div>
              {selectedTask.last_error && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Last Error</h4>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {selectedTask.last_error}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Operation Detail Dialog */}
      {selectedOperation && (
        <Dialog open={isOperationDialogOpen} onOpenChange={setIsOperationDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedOperation.name}</DialogTitle>
              <DialogDescription>
                {selectedOperation.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Risk Assessment</h4>
                  {getRiskBadge(selectedOperation.risk_level)}
                  <p className="text-sm mt-1">Estimated Duration: {selectedOperation.estimated_duration} minutes</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Options</h4>
                  <div className="space-y-1 text-sm">
                    <p>Requires Confirmation: {selectedOperation.requires_confirmation ? 'Yes' : 'No'}</p>
                    <p>Can Schedule: {selectedOperation.can_schedule ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Command</h4>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {selectedOperation.command}
                </code>
              </div>
              {selectedOperation.preconditions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Preconditions</h4>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    {selectedOperation.preconditions.map((condition, index) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedOperation.postconditions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Postconditions</h4>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    {selectedOperation.postconditions.map((condition, index) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminSystemMaintenancePage;