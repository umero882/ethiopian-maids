import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Phone,
  Video,
  FileText,
  GraduationCap,
  UserCheck,
  Archive,
  Star,
  Tag,
  Timer,
  Target
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import AgencyDashboardService from '@/services/agencyDashboardService';
import { useAuth } from '@/contexts/AuthContext';

const AgencyCalendarPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Form data
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'interview',
    start_date: '',
    start_time: '',
    end_time: '',
    location: '',
    priority: 'medium'
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to_id: '',
    estimated_hours: 1,
    tags: []
  });

  // For agency users, their own ID is the agency_id
  const agencyId = user?.id;

  useEffect(() => {
    loadData();
  }, [agencyId]);

  useEffect(() => {
    applyFilters();
  }, [events, tasks, eventTypeFilter, taskStatusFilter, taskPriorityFilter, searchTerm]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [eventsData, tasksData] = await Promise.all([
        AgencyDashboardService.getCalendarEventsWithFilters(agencyId),
        AgencyDashboardService.getTasksWithFilters(agencyId)
      ]);
      setEvents(eventsData || []);
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      setEvents([]);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    // Filter events
    let filteredEvts = events;
    if (eventTypeFilter !== 'all') {
      filteredEvts = filteredEvts.filter(event => event.event_type === eventTypeFilter);
    }
    if (searchTerm) {
      filteredEvts = filteredEvts.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredEvents(filteredEvts);

    // Filter tasks
    let filteredTsks = tasks;
    if (taskStatusFilter !== 'all') {
      filteredTsks = filteredTsks.filter(task => task.status === taskStatusFilter);
    }
    if (taskPriorityFilter !== 'all') {
      filteredTsks = filteredTsks.filter(task => task.priority === taskPriorityFilter);
    }
    if (searchTerm) {
      filteredTsks = filteredTsks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredTasks(filteredTsks);
  };

  const createEvent = async () => {
    setIsCreatingEvent(true);
    try {
      const event = await AgencyDashboardService.createCalendarEvent(agencyId, newEvent);
      setEvents(prev => [...prev, event]);
      setIsCreateEventDialogOpen(false);
      setNewEvent({
        title: '',
        description: '',
        event_type: 'interview',
        start_date: '',
        start_time: '',
        end_time: '',
        location: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event: ' + error.message);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const createTask = async () => {
    setIsCreatingTask(true);
    try {
      // Clean UUID fields - convert empty strings to null
      const taskData = {
        ...newTask,
        assigned_to_id: newTask.assigned_to_id || null,
        related_maid_id: newTask.related_maid_id || null,
        related_sponsor_id: newTask.related_sponsor_id || null,
      };

      const task = await AgencyDashboardService.createTask(agencyId, taskData);
      setTasks(prev => [...prev, task]);
      setIsCreateTaskDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to_id: '',
        estimated_hours: 1,
        tags: []
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task: ' + error.message);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const updateTaskStatus = async (taskId, status, completion = null) => {
    try {
      const completionPercentage = completion !== null ? completion : (status === 'completed' ? 100 : 0);
      await AgencyDashboardService.updateTaskStatus(taskId, status, completionPercentage, agencyId);
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, status, completion_percentage: completionPercentage }
          : task
      ));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const getEventTypeBadge = (type) => {
    const typeConfig = {
      interview: { color: 'bg-blue-100 text-blue-800', icon: Users, label: 'Interview' },
      document_review: { color: 'bg-yellow-100 text-yellow-800', icon: FileText, label: 'Documents' },
      follow_up: { color: 'bg-green-100 text-green-800', icon: Phone, label: 'Follow-up' },
      training: { color: 'bg-purple-100 text-purple-800', icon: GraduationCap, label: 'Training' }
    };

    const config = typeConfig[type] || typeConfig.interview;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800', label: 'High' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      low: { color: 'bg-green-100 text-green-800', label: 'Low' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Timer },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const EventCard = ({ event }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setSelectedEvent(event)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-gray-900">{event.title}</h4>
              {isToday(event.start_date) && (
                <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">Today</Badge>
              )}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(event.start_date)}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {event.location}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedEvent(event)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between">
          {getEventTypeBadge(event.event_type)}
          {getPriorityBadge(event.priority)}
        </div>

        {event.participants?.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {event.participants.length} participant{event.participants.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const TaskCard = ({ task }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-gray-900">{task.title}</h4>
              {task.status === 'overdue' && (
                <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">Overdue</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Due: {formatDate(task.due_date)}
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {task.assigned_to?.name}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedTask(task)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.status !== 'completed' && (
                <DropdownMenuItem
                  className="text-green-600"
                  onClick={() => updateTaskStatus(task.id, 'completed', 100)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{task.completion_percentage}%</span>
          </div>
          <Progress value={task.completion_percentage} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Timer className="h-4 w-4 mr-1" />
              {task.actual_hours}h / {task.estimated_hours}h
            </div>
          </div>

          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const todaysEvents = filteredEvents.filter(event => isToday(event.start_date));
  const upcomingEvents = filteredEvents.filter(event => !isToday(event.start_date));
  const overdueTasks = filteredTasks.filter(task => task.status === 'overdue');
  const pendingTasks = filteredTasks.filter(task => task.status === 'pending');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'in_progress');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendar & Tasks</h1>
        <p className="text-gray-600 mt-1">Manage your schedule and track important tasks</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Button onClick={() => setIsCreateEventDialogOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              New Event
            </Button>
            <Button variant="outline" onClick={() => setIsCreateTaskDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{todaysEvents.length}</p>
                <p className="text-sm text-gray-600">Events Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{overdueTasks.length}</p>
                <p className="text-sm text-gray-600">Overdue Tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Timer className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{inProgressTasks.length}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
                <p className="text-sm text-gray-600">Pending Tasks</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Today's Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No events scheduled for today</p>
                ) : (
                  <div className="space-y-3">
                    {todaysEvents.map(event => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">
                            {formatTime(event.start_time)} - {event.location}
                          </p>
                        </div>
                        {getEventTypeBadge(event.event_type)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Urgent Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {[...overdueTasks, ...inProgressTasks.filter(t => t.priority === 'high')].slice(0, 5).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No urgent tasks</p>
                ) : (
                  <div className="space-y-3">
                    {[...overdueTasks, ...inProgressTasks.filter(t => t.priority === 'high')].slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
                          <p className="text-sm text-gray-600">
                            Due: {formatDate(task.due_date)} • {task.assigned_to?.name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          {getStatusBadge(task.status)}
                          {task.priority === 'high' && getPriorityBadge(task.priority)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="interview">Interviews</SelectItem>
                <SelectItem value="document_review">Documents</SelectItem>
                <SelectItem value="follow_up">Follow-ups</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                      <div className="h-3 w-full bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchTerm || eventTypeFilter !== 'all'
                    ? 'No events match your current filters.'
                    : 'Start by creating your first calendar event.'}
                </p>
                <Button onClick={() => setIsCreateEventDialogOpen(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex space-x-2">
              <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
                <SelectTrigger className="w-32">
                  <Star className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-3 w-full bg-gray-200 rounded"></div>
                      <div className="h-2 w-full bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Target className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchTerm || taskStatusFilter !== 'all' || taskPriorityFilter !== 'all'
                    ? 'No tasks match your current filters.'
                    : 'Start by creating your first task.'}
                </p>
                <Button onClick={() => setIsCreateTaskDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Event Dialog */}
      <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Schedule a new calendar event
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Select value={newEvent.event_type} onValueChange={(value) => setNewEvent(prev => ({ ...prev, event_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="document_review">Document Review</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-priority">Priority</Label>
                <Select value={newEvent.priority} onValueChange={(value) => setNewEvent(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={newEvent.start_date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location or meeting link"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateEventDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={createEvent}
              disabled={!newEvent.title || !newEvent.start_date || !newEvent.start_time}
            >
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task to track
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-hours">Estimated Hours</Label>
                <Input
                  id="task-hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={createTask}
              disabled={!newTask.title || !newTask.due_date}
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyCalendarPage;
