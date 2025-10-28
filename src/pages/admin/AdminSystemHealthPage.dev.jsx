import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Globe,
  Shield,
  RefreshCw,
  Download,
  MonitorSpeaker,
  Gauge,
  TrendingUp,
  TrendingDown,
  MemoryStick,
  Network,
  CloudOff,
  Play,
  Pause,
  Square,
  Settings,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockSystemHealth = {
  overall_status: 'healthy',
  last_updated: '2024-03-20T14:35:00Z',
  uptime: 2547200, // seconds
  services: [
    {
      id: 'web-server',
      name: 'Web Server',
      status: 'healthy',
      uptime: 2547200,
      response_time: 45,
      cpu_usage: 23.5,
      memory_usage: 1024,
      memory_limit: 4096,
      requests_per_minute: 1247,
      error_rate: 0.12,
      last_restart: '2024-03-15T08:00:00Z'
    },
    {
      id: 'api-server',
      name: 'API Server',
      status: 'healthy',
      uptime: 2547200,
      response_time: 67,
      cpu_usage: 34.2,
      memory_usage: 2048,
      memory_limit: 8192,
      requests_per_minute: 3456,
      error_rate: 0.08,
      last_restart: '2024-03-15T08:00:00Z'
    },
    {
      id: 'database-primary',
      name: 'Primary Database',
      status: 'healthy',
      uptime: 2588400,
      response_time: 12,
      cpu_usage: 45.8,
      memory_usage: 6144,
      memory_limit: 16384,
      connections: 156,
      max_connections: 500,
      query_performance: 95.5,
      last_backup: '2024-03-20T02:00:00Z'
    },
    {
      id: 'database-replica',
      name: 'Database Replica',
      status: 'warning',
      uptime: 2547200,
      response_time: 18,
      cpu_usage: 52.3,
      memory_usage: 7200,
      memory_limit: 16384,
      connections: 89,
      max_connections: 300,
      replication_lag: 45, // seconds
      last_sync: '2024-03-20T14:30:00Z'
    },
    {
      id: 'redis-cache',
      name: 'Redis Cache',
      status: 'healthy',
      uptime: 2547200,
      response_time: 2,
      cpu_usage: 8.7,
      memory_usage: 512,
      memory_limit: 2048,
      hit_rate: 94.7,
      evictions: 23,
      connected_clients: 45
    },
    {
      id: 'payment-gateway',
      name: 'Payment Gateway',
      status: 'critical',
      uptime: 1200,
      response_time: 2500,
      error_rate: 15.6,
      last_error: '2024-03-20T14:20:00Z',
      error_message: 'Connection timeout to payment provider',
      transactions_per_hour: 67,
      success_rate: 84.4
    },
    {
      id: 'email-service',
      name: 'Email Service',
      status: 'healthy',
      uptime: 2547200,
      response_time: 150,
      queue_size: 23,
      emails_sent_hour: 245,
      delivery_rate: 98.2,
      bounce_rate: 1.8,
      spam_rate: 0.1
    },
    {
      id: 'file-storage',
      name: 'File Storage',
      status: 'healthy',
      uptime: 2547200,
      storage_used: 1.2, // TB
      storage_total: 5.0, // TB
      bandwidth_in: 45.6, // MB/s
      bandwidth_out: 78.3, // MB/s
      operations_per_second: 1234
    }
  ],
  infrastructure: {
    servers: [
      {
        id: 'app-server-01',
        name: 'Application Server 1',
        status: 'healthy',
        location: 'AWS us-east-1a',
        cpu_cores: 8,
        cpu_usage: 23.5,
        memory_total: 32768, // MB
        memory_used: 8192,
        disk_total: 500, // GB
        disk_used: 125,
        network_in: 12.5, // MB/s
        network_out: 8.7,
        load_average: [1.2, 1.5, 1.8],
        processes: 245,
        uptime: 2547200
      },
      {
        id: 'app-server-02',
        name: 'Application Server 2',
        status: 'healthy',
        location: 'AWS us-east-1b',
        cpu_cores: 8,
        cpu_usage: 28.9,
        memory_total: 32768,
        memory_used: 12288,
        disk_total: 500,
        disk_used: 167,
        network_in: 15.2,
        network_out: 11.4,
        load_average: [1.8, 2.1, 2.3],
        processes: 289,
        uptime: 2547200
      },
      {
        id: 'db-server-01',
        name: 'Database Server',
        status: 'warning',
        location: 'AWS us-east-1c',
        cpu_cores: 16,
        cpu_usage: 67.8,
        memory_total: 65536,
        memory_used: 48000,
        disk_total: 2000,
        disk_used: 1200,
        disk_io_read: 125.6,
        disk_io_write: 89.3,
        network_in: 45.7,
        network_out: 67.2,
        load_average: [4.2, 4.8, 5.1],
        processes: 156,
        uptime: 2588400
      }
    ],
    network: {
      total_bandwidth: 1000, // Mbps
      current_usage: 156.7,
      peak_usage_today: 234.5,
      latency_avg: 45, // ms
      latency_p95: 89,
      packet_loss: 0.02, // %
      dns_response_time: 8
    },
    security: {
      ssl_certificates: [
        { domain: 'ethiomaids.com', expires_at: '2024-06-15T00:00:00Z', status: 'valid' },
        { domain: 'api.ethiomaids.com', expires_at: '2024-06-15T00:00:00Z', status: 'valid' },
        { domain: 'admin.ethiomaids.com', expires_at: '2024-04-01T00:00:00Z', status: 'expires_soon' }
      ],
      firewall_status: 'active',
      intrusion_attempts_24h: 23,
      blocked_ips: 156,
      security_scan_last: '2024-03-19T02:00:00Z',
      vulnerabilities_found: 0
    }
  },
  metrics: {
    response_times: [
      { time: '14:00', web: 42, api: 65, db: 12 },
      { time: '14:05', web: 45, api: 67, db: 11 },
      { time: '14:10', web: 38, api: 72, db: 15 },
      { time: '14:15', web: 41, api: 69, db: 13 },
      { time: '14:20', web: 47, api: 74, db: 18 },
      { time: '14:25', web: 44, api: 71, db: 14 },
      { time: '14:30', web: 46, api: 68, db: 16 },
      { time: '14:35', web: 45, api: 67, db: 12 }
    ],
    system_resources: [
      { time: '14:00', cpu: 22, memory: 67, disk: 45 },
      { time: '14:05', cpu: 25, memory: 69, disk: 45 },
      { time: '14:10', cpu: 28, memory: 72, disk: 46 },
      { time: '14:15', cpu: 31, memory: 74, disk: 46 },
      { time: '14:20', cpu: 29, memory: 71, disk: 47 },
      { time: '14:25', cpu: 26, memory: 68, disk: 47 },
      { time: '14:30', cpu: 24, memory: 65, disk: 48 },
      { time: '14:35', cpu: 23, memory: 63, disk: 48 }
    ],
    traffic_volume: [
      { time: '14:00', requests: 3245, users: 1234 },
      { time: '14:05', requests: 3456, users: 1345 },
      { time: '14:10', requests: 3678, users: 1456 },
      { time: '14:15', requests: 3890, users: 1567 },
      { time: '14:20', requests: 3567, users: 1456 },
      { time: '14:25', requests: 3234, users: 1234 },
      { time: '14:30', requests: 3123, users: 1123 },
      { time: '14:35', requests: 3345, users: 1234 }
    ]
  },
  alerts: [
    {
      id: 'alert_001',
      severity: 'critical',
      service: 'payment-gateway',
      message: 'Payment gateway connection timeout',
      timestamp: '2024-03-20T14:20:00Z',
      acknowledged: false,
      resolved: false
    },
    {
      id: 'alert_002',
      severity: 'warning',
      service: 'database-replica',
      message: 'Database replication lag exceeds threshold',
      timestamp: '2024-03-20T14:15:00Z',
      acknowledged: true,
      resolved: false
    },
    {
      id: 'alert_003',
      severity: 'info',
      service: 'ssl-certificate',
      message: 'SSL certificate for admin.ethiomaids.com expires in 12 days',
      timestamp: '2024-03-20T08:00:00Z',
      acknowledged: false,
      resolved: false
    }
  ]
};

const AdminSystemHealthPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [healthData, setHealthData] = useState(mockSystemHealth);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  useEffect(() => {
    const loadHealthData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('system_health_page_view', 'admin_system', 'health');
      setLoading(false);
    };

    loadHealthData();
  }, [logAdminActivity]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshHealthData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshHealthData = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update timestamps and add slight variations to simulate real data
    const updatedData = {
      ...healthData,
      last_updated: new Date().toISOString(),
      services: healthData.services.map(service => ({
        ...service,
        cpu_usage: Math.max(0, Math.min(100, service.cpu_usage + (Math.random() - 0.5) * 10)),
        memory_usage: Math.max(0, service.memory_usage + Math.floor((Math.random() - 0.5) * 200)),
        response_time: Math.max(1, service.response_time + Math.floor((Math.random() - 0.5) * 20))
      }))
    };

    setHealthData(updatedData);
    setRefreshing(false);

    toast({
      title: 'Health Data Refreshed',
      description: 'System health metrics have been updated.',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      healthy: { label: 'Healthy', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      warning: { label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
      critical: { label: 'Critical', icon: XCircle, color: 'bg-red-100 text-red-800' },
      down: { label: 'Down', icon: CloudOff, color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig.healthy;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getSeverityBadge = (severity) => {
    const severityConfig = {
      critical: { label: 'Critical', color: 'bg-red-100 text-red-800' },
      warning: { label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
      info: { label: 'Info', color: 'bg-blue-100 text-blue-800' }
    };

    const config = severityConfig[severity] || severityConfig.info;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${bytes}B`;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Monitor system performance, infrastructure, and service health {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshHealthData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Activity className="h-6 w-6" />
              System Overview
            </CardTitle>
            <div className="flex items-center gap-4">
              {getStatusBadge(healthData.overall_status)}
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date(healthData.last_updated).toLocaleString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">System Uptime</p>
                <p className="text-2xl font-bold">{formatUptime(healthData.uptime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Server className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Services</p>
                <p className="text-2xl font-bold">
                  {healthData.services.filter(s => s.status === 'healthy').length}/
                  {healthData.services.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Active Alerts</p>
                <p className="text-2xl font-bold">
                  {healthData.alerts.filter(a => !a.resolved).length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Gauge className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Avg Response</p>
                <p className="text-2xl font-bold">
                  {Math.round(healthData.services.reduce((acc, s) => acc + (s.response_time || 0), 0) / healthData.services.length)}ms
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {healthData.alerts.filter(a => !a.resolved).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.alerts.filter(a => !a.resolved).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getSeverityBadge(alert.severity)}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{alert.service}</span>
                        <span>•</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!alert.acknowledged && (
                      <Button variant="outline" size="sm">
                        Acknowledge
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthData.services.map((service) => (
              <Card key={service.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {getStatusBadge(service.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Uptime</p>
                      <p className="font-medium">{formatUptime(service.uptime)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Response Time</p>
                      <p className="font-medium">{service.response_time}ms</p>
                    </div>
                  </div>

                  {service.cpu_usage && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>{service.cpu_usage.toFixed(1)}%</span>
                      </div>
                      <Progress value={service.cpu_usage} className="h-2" />
                    </div>
                  )}

                  {service.memory_usage && service.memory_limit && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory</span>
                        <span>{formatBytes(service.memory_usage * 1024 * 1024)} / {formatBytes(service.memory_limit * 1024 * 1024)}</span>
                      </div>
                      <Progress value={(service.memory_usage / service.memory_limit) * 100} className="h-2" />
                    </div>
                  )}

                  {service.error_rate !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span>Error Rate</span>
                      <span className={service.error_rate > 5 ? 'text-red-600' : 'text-green-600'}>
                        {service.error_rate}%
                      </span>
                    </div>
                  )}

                  {service.connections && service.max_connections && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Connections</span>
                        <span>{service.connections} / {service.max_connections}</span>
                      </div>
                      <Progress value={(service.connections / service.max_connections) * 100} className="h-2" />
                    </div>
                  )}

                  {service.hit_rate && (
                    <div className="flex justify-between text-sm">
                      <span>Hit Rate</span>
                      <span className="text-green-600">{service.hit_rate}%</span>
                    </div>
                  )}

                  {service.replication_lag && (
                    <div className="flex justify-between text-sm">
                      <span>Replication Lag</span>
                      <span className={service.replication_lag > 30 ? 'text-yellow-600' : 'text-green-600'}>
                        {service.replication_lag}s
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure" className="space-y-6">
          {/* Servers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Server className="h-5 w-5" />
                Servers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {healthData.infrastructure.servers.map((server) => (
                  <Card key={server.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{server.name}</CardTitle>
                        {getStatusBadge(server.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{server.location}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>CPU ({server.cpu_cores} cores)</span>
                          <span>{server.cpu_usage.toFixed(1)}%</span>
                        </div>
                        <Progress value={server.cpu_usage} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Memory</span>
                          <span>{formatBytes(server.memory_used * 1024 * 1024)} / {formatBytes(server.memory_total * 1024 * 1024)}</span>
                        </div>
                        <Progress value={(server.memory_used / server.memory_total) * 100} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Disk</span>
                          <span>{server.disk_used}GB / {server.disk_total}GB</span>
                        </div>
                        <Progress value={(server.disk_used / server.disk_total) * 100} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Load Avg</p>
                          <p className="font-medium">{server.load_average.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Processes</p>
                          <p className="font-medium">{server.processes}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Network In</p>
                          <p className="font-medium">{server.network_in} MB/s</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Network Out</p>
                          <p className="font-medium">{server.network_out} MB/s</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Network Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Network className="h-5 w-5" />
                  Network Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Bandwidth Usage</span>
                    <span>{healthData.infrastructure.network.current_usage.toFixed(1)} / {healthData.infrastructure.network.total_bandwidth} Mbps</span>
                  </div>
                  <Progress
                    value={(healthData.infrastructure.network.current_usage / healthData.infrastructure.network.total_bandwidth) * 100}
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Avg Latency</p>
                    <p className="font-medium">{healthData.infrastructure.network.latency_avg}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">P95 Latency</p>
                    <p className="font-medium">{healthData.infrastructure.network.latency_p95}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Packet Loss</p>
                    <p className="font-medium">{healthData.infrastructure.network.packet_loss}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">DNS Response</p>
                    <p className="font-medium">{healthData.infrastructure.network.dns_response_time}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-5 w-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">SSL Certificates</p>
                  {healthData.infrastructure.security.ssl_certificates.map((cert, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{cert.domain}</span>
                      <Badge className={cert.status === 'valid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {cert.status === 'expires_soon' ? 'Expires Soon' : 'Valid'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Firewall</p>
                    <p className="font-medium text-green-600">Active</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Blocked IPs</p>
                    <p className="font-medium">{healthData.infrastructure.security.blocked_ips}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Intrusion Attempts</p>
                    <p className="font-medium">{healthData.infrastructure.security.intrusion_attempts_24h}/24h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vulnerabilities</p>
                    <p className="font-medium text-green-600">{healthData.infrastructure.security.vulnerabilities_found}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Times Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Zap className="h-5 w-5" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={healthData.metrics.response_times}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="web" stroke="#3B82F6" strokeWidth={2} name="Web Server" />
                    <Line type="monotone" dataKey="api" stroke="#10B981" strokeWidth={2} name="API Server" />
                    <Line type="monotone" dataKey="db" stroke="#F59E0B" strokeWidth={2} name="Database" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* System Resources Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Cpu className="h-5 w-5" />
                  System Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={healthData.metrics.system_resources}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpu" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="CPU %" />
                    <Area type="monotone" dataKey="memory" stackId="2" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Memory %" />
                    <Area type="monotone" dataKey="disk" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="Disk %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Traffic Volume Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5" />
                  Traffic Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={healthData.metrics.traffic_volume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#3B82F6" name="Requests" />
                    <Bar dataKey="users" fill="#10B981" name="Active Users" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* SSL Certificates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-5 w-5" />
                  SSL Certificates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthData.infrastructure.security.ssl_certificates.map((cert, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm">{cert.domain}</p>
                      <Badge className={cert.status === 'valid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {cert.status === 'expires_soon' ? 'Expires Soon' : 'Valid'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(cert.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Security Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5" />
                  Security Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Firewall Status</span>
                  <Badge className="bg-green-100 text-green-800">
                    {healthData.infrastructure.security.firewall_status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Blocked IPs (24h)</span>
                  <span className="font-medium">{healthData.infrastructure.security.blocked_ips}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Intrusion Attempts</span>
                  <span className="font-medium">{healthData.infrastructure.security.intrusion_attempts_24h}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Vulnerabilities</span>
                  <Badge className={healthData.infrastructure.security.vulnerabilities_found === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {healthData.infrastructure.security.vulnerabilities_found}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Security Scan</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(healthData.infrastructure.security.security_scan_last).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Security Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  Security Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Run Security Scan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Firewall Rules
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Security Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View Security Logs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSystemHealthPage;