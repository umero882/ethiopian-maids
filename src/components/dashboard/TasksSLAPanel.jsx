import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const TasksSLAPanel = ({ tasks }) => {
  const { today = [], overdue = [], upcoming = [] } = tasks || {};

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status, dueDate) => {
    const isOverdue = new Date(dueDate) < new Date();

    if (isOverdue) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }

    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const TaskItem = ({ task, showDate = false }) => (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex-shrink-0 mt-1">
        {getStatusIcon(task.status, task.due_date)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {task.title}
            </p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          </div>

          <div className="flex flex-col items-end space-y-1 ml-2">
            <Badge
              variant="outline"
              className={cn("text-xs", getPriorityColor(task.priority))}
            >
              {task.priority || 'Medium'}
            </Badge>

            {showDate && (
              <span className="text-xs text-gray-500">
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {task.assignee && (
          <div className="flex items-center space-x-1 mt-2">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {task.assignee.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const EmptyState = ({ message }) => (
    <div className="text-center py-8">
      <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );

  const totalTasks = today.length + overdue.length + upcoming.length;

  if (totalTasks === 0) {
    return (
      <EmptyState message="No tasks or deadlines at this time" />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {overdue.length}
          </p>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Today</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {today.length}
          </p>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-700">Upcoming</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {upcoming.length}
          </p>
        </div>
      </div>

      {/* Task Lists */}
      <Tabs defaultValue="overdue" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overdue" className="text-xs">
            Overdue ({overdue.length})
          </TabsTrigger>
          <TabsTrigger value="today" className="text-xs">
            Today ({today.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs">
            Upcoming ({upcoming.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overdue" className="mt-4">
          <ScrollArea className="h-48">
            {overdue.length > 0 ? (
              <div className="space-y-1">
                {overdue.map((task) => (
                  <TaskItem key={task.id} task={task} showDate />
                ))}
              </div>
            ) : (
              <EmptyState message="No overdue tasks" />
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="today" className="mt-4">
          <ScrollArea className="h-48">
            {today.length > 0 ? (
              <div className="space-y-1">
                {today.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState message="No tasks due today" />
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <ScrollArea className="h-48">
            {upcoming.length > 0 ? (
              <div className="space-y-1">
                {upcoming.slice(0, 10).map((task) => (
                  <TaskItem key={task.id} task={task} showDate />
                ))}
              </div>
            ) : (
              <EmptyState message="No upcoming tasks" />
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <ArrowRight className="h-4 w-4 mr-2" />
            All Tasks
          </Button>
        </div>
      </div>
    </div>
  );
};