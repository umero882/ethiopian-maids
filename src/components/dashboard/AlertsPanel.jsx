import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  Info,
  CreditCard,
  FileX,
  PauseCircle,
  X,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AlertsPanel = ({ alerts = [], onRefresh, onDismiss }) => {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'payment_failed':
        return <CreditCard className="h-4 w-4" />;
      case 'documents_expiring':
        return <FileX className="h-4 w-4" />;
      case 'paused_listings':
        return <PauseCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (level) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAlertColors = (level) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-500',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-500',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-500',
        };
    }
  };

  const handleAlertClick = (alert) => {
    if (alert.link) {
      window.location.href = alert.link;
    }
  };

  const handleDismiss = (alertId) => {
    if (onDismiss) {
      onDismiss(alertId);
    }
  };

  if (!alerts.length) {
    return null;
  }

  // Group alerts by level for display priority
  const groupedAlerts = {
    critical: alerts.filter(a => a.level === 'critical'),
    warning: alerts.filter(a => a.level === 'warning'),
    info: alerts.filter(a => a.level === 'info'),
  };

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>System Alerts</span>
            <Badge variant="secondary" className="ml-2">
              {alerts.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Critical Alerts */}
        {groupedAlerts.critical.map((alert) => {
          const colors = getAlertColors(alert.level);
          return (
            <div
              key={alert.type + alert.level}
              className={cn(
                "p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow",
                colors.bg,
                colors.border
              )}
              onClick={() => handleAlertClick(alert)}
            >
              <div className="flex items-start space-x-3">
                <div className={cn("flex-shrink-0 mt-0.5", colors.icon)}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={cn("text-sm font-medium", colors.text)}>
                        {alert.message}
                      </p>
                      {alert.count && (
                        <p className="text-xs text-gray-600 mt-1">
                          {alert.count} item(s) affected
                        </p>
                      )}
                      {alert.days && (
                        <p className="text-xs text-gray-600 mt-1">
                          {alert.days} days remaining
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge variant="outline" className="text-xs">
                        {alert.level.toUpperCase()}
                      </Badge>
                      {alert.link && (
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Warning Alerts */}
        {groupedAlerts.warning.map((alert) => {
          const colors = getAlertColors(alert.level);
          return (
            <div
              key={alert.type + alert.level}
              className={cn(
                "p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow",
                colors.bg,
                colors.border
              )}
              onClick={() => handleAlertClick(alert)}
            >
              <div className="flex items-start space-x-3">
                <div className={cn("flex-shrink-0 mt-0.5", colors.icon)}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={cn("text-sm", colors.text)}>
                        {alert.message}
                      </p>
                      {alert.count && (
                        <p className="text-xs text-gray-500 mt-1">
                          {alert.count} item(s)
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge variant="outline" className="text-xs bg-white">
                        {alert.level.toUpperCase()}
                      </Badge>
                      {alert.link && (
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Info Alerts */}
        {groupedAlerts.info.map((alert) => {
          const colors = getAlertColors(alert.level);
          return (
            <div
              key={alert.type + alert.level}
              className={cn(
                "p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow",
                colors.bg,
                colors.border
              )}
              onClick={() => handleAlertClick(alert)}
            >
              <div className="flex items-start space-x-3">
                <div className={cn("flex-shrink-0 mt-0.5", colors.icon)}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className={cn("text-sm", colors.text)}>
                      {alert.message}
                    </p>
                    <Badge variant="outline" className="text-xs ml-2">
                      {alert.level.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Summary Actions */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {groupedAlerts.critical.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleAlertClick({ link: '/dashboard/agency/billing' })}
              >
                Resolve Critical Issues
              </Button>
            )}
            {groupedAlerts.warning.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAlertClick({ link: '/dashboard/agency/documents' })}
              >
                Review Warnings
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-gray-600"
              onClick={() => {
                // Mark all alerts as viewed
                alerts.forEach(alert => handleDismiss(alert.id));
              }}
            >
              Mark All as Viewed
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};