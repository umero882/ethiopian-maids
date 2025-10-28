/**
 * Offline Status Indicator
 * Shows connection status and pending sync actions
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { cn } from '@/lib/utils';

const OfflineIndicator = ({ className }) => {
  const {
    isOnline,
    isOffline,
    syncInProgress,
    pendingActions,
    pendingCount,
    syncNow,
  } = useOffline();

  const getStatusColor = () => {
    if (isOffline) return 'bg-red-500';
    if (syncInProgress) return 'bg-yellow-500';
    if (pendingCount > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (isOffline) return 'Offline';
    if (syncInProgress) return 'Syncing...';
    if (pendingCount > 0) return `${pendingCount} pending`;
    return 'Online';
  };

  const getStatusIcon = () => {
    if (isOffline) return <WifiOff className="h-4 w-4" />;
    if (syncInProgress) return <RefreshCw className="h-4 w-4 animate-spin" />;
    return <Wifi className="h-4 w-4" />;
  };

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      <AnimatePresence>
        {(isOffline || pendingCount > 0 || syncInProgress) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'shadow-lg border-2 gap-2',
                    isOffline && 'border-red-500 bg-red-50 hover:bg-red-100',
                    syncInProgress && 'border-yellow-500 bg-yellow-50',
                    pendingCount > 0 && !syncInProgress && 'border-orange-500 bg-orange-50'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full animate-pulse', getStatusColor())} />
                  {getStatusIcon()}
                  <span className="text-sm font-medium">{getStatusText()}</span>
                  {pendingCount > 0 && (
                    <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center">
                      {pendingCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  {/* Status Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isOnline ? (
                        <Wifi className="h-5 w-5 text-green-600" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {isOnline ? 'Connected' : 'No Connection'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isOnline
                            ? 'All changes are being saved'
                            : 'Changes will sync when online'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sync Progress */}
                  {syncInProgress && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Syncing...</span>
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                      </div>
                      <Progress value={undefined} className="h-1" />
                    </div>
                  )}

                  {/* Pending Actions */}
                  {pendingCount > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Pending Actions</p>
                        <Badge variant="secondary">{pendingCount}</Badge>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {pendingActions.slice(0, 5).map((action, index) => (
                          <div
                            key={action.id || index}
                            className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs"
                          >
                            {action.status === 'pending' && (
                              <Clock className="h-3 w-3 text-gray-400 mt-0.5" />
                            )}
                            {action.status === 'failed' && (
                              <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                            )}
                            {action.status === 'completed' && (
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {action.type || 'Action'}
                              </p>
                              <p className="text-gray-500 truncate">
                                {action.method} {action.url?.split('/').pop() || 'request'}
                              </p>
                              {action.retryCount > 0 && (
                                <p className="text-orange-600">
                                  Retry attempt {action.retryCount}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {pendingCount > 5 && (
                          <p className="text-xs text-gray-500 text-center py-1">
                            And {pendingCount - 5} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isOnline && pendingCount > 0 && (
                      <Button
                        size="sm"
                        onClick={syncNow}
                        disabled={syncInProgress}
                        className="flex-1"
                      >
                        <RefreshCw className={cn(
                          'h-3 w-3 mr-1',
                          syncInProgress && 'animate-spin'
                        )} />
                        Sync Now
                      </Button>
                    )}
                    {isOffline && (
                      <div className="flex-1 text-center p-2 bg-red-50 rounded text-xs text-red-700">
                        <AlertCircle className="h-4 w-4 mx-auto mb-1" />
                        Connect to internet to sync
                      </div>
                    )}
                  </div>

                  {/* Info Message */}
                  {pendingCount === 0 && isOnline && !syncInProgress && (
                    <div className="text-center p-3 bg-green-50 rounded">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">
                        All synced up!
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Your data is up to date
                      </p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineIndicator;
