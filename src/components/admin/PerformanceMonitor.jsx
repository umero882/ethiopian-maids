/**
 * ⚡ Performance Monitor Dashboard
 * Real-time performance metrics and optimization tools
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Zap,
  Clock,
  Database,
  Wifi,
  HardDrive,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  performanceMonitor,
  MemoryManager,
  ResourceOptimizer,
} from '@/utils/performanceOptimizer';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = performanceMonitor.getMetrics();
      setMetrics(currentMetrics);
      setLastUpdate(new Date());
    };

    // Initial load
    updateMetrics();

    // Set up periodic updates
    const interval = setInterval(updateMetrics, 5000);
    setIsMonitoring(true);

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, []);

  const getPerformanceScore = () => {
    const scores = [];

    // Page load time score (good < 3s, poor > 5s)
    if (metrics.page_load?.duration) {
      const loadTime = metrics.page_load.duration;
      if (loadTime < 3000) scores.push(100);
      else if (loadTime < 5000) scores.push(75);
      else scores.push(50);
    }

    // API response time score
    const apiMetrics = Object.entries(metrics).filter(([key]) =>
      key.startsWith('api_')
    );
    if (apiMetrics.length > 0) {
      const avgApiTime =
        apiMetrics.reduce((sum, [, metric]) => sum + metric.duration, 0) /
        apiMetrics.length;
      if (avgApiTime < 1000) scores.push(100);
      else if (avgApiTime < 2000) scores.push(75);
      else scores.push(50);
    }

    return scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b) / scores.length)
      : 0;
  };

  const getMemoryUsage = () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = performance.memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576),
        percentage: Math.round(
          (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        ),
      };
    }
    return null;
  };

  const handleOptimize = async () => {
    try {
      // Clear caches
      performanceMonitor.cleanup();

      // Run memory cleanup
      MemoryManager.cleanup();

      // Preload critical resources
      ResourceOptimizer.preloadCriticalResources();

      // Show success message
      alert('Performance optimization completed!');
    } catch (error) {
      console.error('Optimization failed:', error);
      alert('Optimization failed. Check console for details.');
    }
  };

  const performanceScore = getPerformanceScore();
  const memoryUsage = getMemoryUsage();

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            Performance Monitor
          </h2>
          <p className='text-gray-600'>
            Real-time application performance metrics
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Monitoring' : 'Stopped'}
          </Badge>
          <Button onClick={handleOptimize} size='sm'>
            <Zap className='h-4 w-4 mr-2' />
            Optimize
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            Performance Score
          </CardTitle>
          <CardDescription>
            Overall application performance rating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4'>
            <div className='text-4xl font-bold'>
              {performanceScore}
              <span className='text-lg text-gray-500'>/100</span>
            </div>
            <div className='flex-1'>
              <Progress value={performanceScore} className='h-3' />
            </div>
            <div className='flex items-center gap-1'>
              {performanceScore >= 80 ? (
                <CheckCircle2 className='h-5 w-5 text-green-500' />
              ) : performanceScore >= 60 ? (
                <AlertTriangle className='h-5 w-5 text-yellow-500' />
              ) : (
                <TrendingDown className='h-5 w-5 text-red-500' />
              )}
              <span className='text-sm font-medium'>
                {performanceScore >= 80
                  ? 'Excellent'
                  : performanceScore >= 60
                    ? 'Good'
                    : 'Needs Improvement'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue='metrics' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='metrics'>Metrics</TabsTrigger>
          <TabsTrigger value='memory'>Memory</TabsTrigger>
          <TabsTrigger value='network'>Network</TabsTrigger>
          <TabsTrigger value='optimization'>Optimization</TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value='metrics' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Object.entries(metrics).map(([key, metric]) => (
              <Card key={key}>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium flex items-center gap-2'>
                    <Clock className='h-4 w-4' />
                    {key
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {metric.duration
                      ? `${Math.round(metric.duration)}ms`
                      : 'N/A'}
                  </div>
                  <div className='text-xs text-gray-500 mt-1'>
                    {metric.endTime
                      ? `Completed at ${new Date(metric.endTime).toLocaleTimeString()}`
                      : 'In progress'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value='memory' className='space-y-4'>
          {memoryUsage ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <HardDrive className='h-5 w-5' />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span>Used Memory</span>
                      <span className='font-bold'>{memoryUsage.used} MB</span>
                    </div>
                    <Progress value={memoryUsage.percentage} className='h-2' />
                    <div className='text-sm text-gray-600'>
                      {memoryUsage.used} MB of {memoryUsage.limit} MB (
                      {memoryUsage.percentage}%)
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memory Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      {memoryUsage.percentage < 70 ? (
                        <CheckCircle2 className='h-4 w-4 text-green-500' />
                      ) : memoryUsage.percentage < 85 ? (
                        <AlertTriangle className='h-4 w-4 text-yellow-500' />
                      ) : (
                        <AlertTriangle className='h-4 w-4 text-red-500' />
                      )}
                      <span className='text-sm'>
                        {memoryUsage.percentage < 70
                          ? 'Healthy'
                          : memoryUsage.percentage < 85
                            ? 'Moderate'
                            : 'High Usage'}
                      </span>
                    </div>
                    <Button
                      onClick={() => MemoryManager.cleanup()}
                      size='sm'
                      variant='outline'
                      className='w-full'
                    >
                      <RefreshCw className='h-4 w-4 mr-2' />
                      Clean Up Memory
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className='pt-6'>
                <div className='text-center text-gray-500'>
                  Memory monitoring not available in this browser
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value='network' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Wifi className='h-5 w-5' />
                Network Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='text-sm text-gray-600'>
                  Network metrics will be displayed here when available
                </div>
                <Button
                  onClick={() => ResourceOptimizer.preloadCriticalResources()}
                  size='sm'
                >
                  Preload Critical Resources
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value='optimization' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <Button
                  onClick={() => performanceMonitor.cleanup()}
                  size='sm'
                  variant='outline'
                  className='w-full'
                >
                  Clear Performance Cache
                </Button>
                <Button
                  onClick={() => MemoryManager.cleanup()}
                  size='sm'
                  variant='outline'
                  className='w-full'
                >
                  Run Memory Cleanup
                </Button>
                <Button
                  onClick={() => ResourceOptimizer.lazyLoadImages()}
                  size='sm'
                  variant='outline'
                  className='w-full'
                >
                  Optimize Images
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 text-sm'>
                  {performanceScore < 80 && (
                    <div className='flex items-start gap-2'>
                      <TrendingUp className='h-4 w-4 text-blue-500 mt-0.5' />
                      <span>Consider optimizing slow API calls</span>
                    </div>
                  )}
                  {memoryUsage && memoryUsage.percentage > 70 && (
                    <div className='flex items-start gap-2'>
                      <AlertTriangle className='h-4 w-4 text-yellow-500 mt-0.5' />
                      <span>High memory usage detected</span>
                    </div>
                  )}
                  <div className='flex items-start gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500 mt-0.5' />
                    <span>Performance monitoring is active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {lastUpdate && (
        <div className='text-xs text-gray-500 text-center'>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
