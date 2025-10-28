import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Filter,
  Search,
  FileText,
  User,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  MessageCircle,
  Gavel,
  Star,
  Archive
} from 'lucide-react';
import AgencyDashboardService from '@/services/agencyDashboardService';

const AgencySupportPage = () => {
  const [loading, setLoading] = useState(true);
  const [supportData, setSupportData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: ''
  });

  useEffect(() => {
    const fetchSupportData = async () => {
      try {
        setLoading(true);
        const data = await AgencyDashboardService.getSupportData();
        setSupportData(data);
      } catch (error) {
        console.error('Error fetching support data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupportData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await AgencyDashboardService.updateTicketStatus(ticketId, newStatus);
      // Refresh data
      const updatedData = await AgencyDashboardService.getSupportData();
      setSupportData(updatedData);
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleDisputeAction = async (disputeId, action) => {
    try {
      await AgencyDashboardService.updateDisputeStatus(disputeId, action);
      // Refresh data
      const updatedData = await AgencyDashboardService.getSupportData();
      setSupportData(updatedData);
    } catch (error) {
      console.error('Error updating dispute:', error);
    }
  };

  const kpiCards = [
    {
      title: 'Open Tickets',
      value: supportData?.stats?.openTickets || '0',
      change: '+3 today',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Disputes',
      value: supportData?.stats?.activeDisputes || '0',
      change: '-2 this week',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Avg Response Time',
      value: supportData?.stats?.avgResponseTime || '0h',
      change: '15% faster',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Resolution Rate',
      value: supportData?.stats?.resolutionRate || '0%',
      change: '+5% this month',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { variant: 'destructive', label: 'Open' },
      in_progress: { variant: 'secondary', label: 'In Progress' },
      pending_client: { variant: 'outline', label: 'Pending Client' },
      resolved: { variant: 'default', label: 'Resolved' },
      closed: { variant: 'secondary', label: 'Closed' }
    };
    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { variant: 'outline', label: 'Low' },
      medium: { variant: 'secondary', label: 'Medium' },
      high: { variant: 'destructive', label: 'High' },
      critical: { variant: 'destructive', label: 'Critical' }
    };
    const config = priorityConfig[priority] || { variant: 'outline', label: priority };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredTickets = supportData?.tickets?.filter(ticket => {
    if (filters.status !== 'all' && ticket.status !== filters.status) return false;
    if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
    if (filters.category !== 'all' && ticket.category !== filters.category) return false;
    if (filters.search && !ticket.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !ticket.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }) || [];

  const filteredDisputes = supportData?.disputes?.filter(dispute => {
    if (filters.status !== 'all' && dispute.status !== filters.status) return false;
    if (filters.search && !dispute.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !dispute.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support & Disputes</h1>
          <p className="text-gray-500">Manage customer support tickets and dispute resolution</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="placement">Placement</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="general">General Inquiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input placeholder="Brief description of the issue" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Detailed description of the issue" rows={4} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Create Ticket</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-full ${kpi.bgColor} ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search tickets or disputes..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-64"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending_client">Pending Client</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            {selectedTab === 'tickets' && (
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="placement">Placement</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </Card>

        <TabsContent value="tickets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className={`cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}`} onClick={() => setSelectedTicket(ticket)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">#{ticket.ticket_number}</h3>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                          <Badge variant="outline">{ticket.category}</Badge>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{ticket.title}</h4>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {ticket.requester_name}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Last updated: {ticket.last_updated_at}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); /* view action */ }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredTickets.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tickets found matching your criteria</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Ticket Detail Panel */}
            <div className="lg:col-span-1">
              {selectedTicket ? (
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Ticket #{selectedTicket.ticket_number}</span>
                      <div className="flex space-x-1">
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium">{selectedTicket.title}</h4>
                      <p className="text-sm text-gray-600 mt-2">{selectedTicket.description}</p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Priority:</span>
                        {getPriorityBadge(selectedTicket.priority)}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Category:</span>
                        <Badge variant="outline">{selectedTicket.category}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Requester:</span>
                        <span>{selectedTicket.requester_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Created:</span>
                        <span>{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Assigned to:</span>
                        <span>{selectedTicket.assigned_to?.name || 'Unassigned'}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Contact Information</Label>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          {selectedTicket.requester_email}
                        </div>
                        {selectedTicket.requester_phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedTicket.requester_phone}
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Actions</Label>
                      <div className="space-y-2">
                        <Select value={selectedTicket.status} onValueChange={(value) => handleStatusUpdate(selectedTicket.id, value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="pending_client">Pending Client</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button className="w-full" variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Reply to Ticket
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Recent Activity</Label>
                      <div className="space-y-2 text-xs">
                        {selectedTicket.activity?.map((activity, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded">
                            <div className="font-medium">{activity.action}</div>
                            <div className="text-gray-500">{activity.timestamp} by {activity.user}</div>
                          </div>
                        )) || (
                          <p className="text-gray-500">No recent activity</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a ticket to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Disputes List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredDisputes.map((dispute) => (
                <Card key={dispute.id} className={`cursor-pointer transition-colors ${selectedDispute?.id === dispute.id ? 'ring-2 ring-orange-500' : 'hover:bg-gray-50'}`} onClick={() => setSelectedDispute(dispute)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">#{dispute.dispute_number}</h3>
                          {getStatusBadge(dispute.status)}
                          <Badge variant="outline">{dispute.type}</Badge>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{dispute.title}</h4>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{dispute.description}</p>
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {dispute.complainant_name}
                          </div>
                          <div className="flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Amount: ${dispute.disputed_amount}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Filed: {new Date(dispute.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); /* view action */ }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredDisputes.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No disputes found matching your criteria</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Dispute Detail Panel */}
            <div className="lg:col-span-1">
              {selectedDispute ? (
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Dispute #{selectedDispute.dispute_number}</span>
                      <div className="flex space-x-1">
                        {getStatusBadge(selectedDispute.status)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium">{selectedDispute.title}</h4>
                      <p className="text-sm text-gray-600 mt-2">{selectedDispute.description}</p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Type:</span>
                        <Badge variant="outline">{selectedDispute.type}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-medium">${selectedDispute.disputed_amount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Complainant:</span>
                        <span>{selectedDispute.complainant_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Filed:</span>
                        <span>{new Date(selectedDispute.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Severity:</span>
                        {getPriorityBadge(selectedDispute.severity)}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Parties Involved</Label>
                      <div className="space-y-2 text-sm">
                        {selectedDispute.parties?.map((party, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>{party.name}</span>
                            <Badge variant="outline" size="sm">{party.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Actions</Label>
                      <div className="space-y-2">
                        <Button className="w-full" variant="outline" size="sm" onClick={() => handleDisputeAction(selectedDispute.id, 'investigate')}>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Start Investigation
                        </Button>
                        <Button className="w-full" variant="outline" size="sm" onClick={() => handleDisputeAction(selectedDispute.id, 'mediate')}>
                          <Gavel className="h-4 w-4 mr-2" />
                          Schedule Mediation
                        </Button>
                        <Button className="w-full" variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Evidence & Documents</Label>
                      <div className="space-y-1 text-xs">
                        {selectedDispute.evidence?.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>{doc.name}</span>
                            <Button variant="ghost" size="sm">View</Button>
                          </div>
                        )) || (
                          <p className="text-gray-500">No evidence uploaded</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a dispute to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Common Issues & Solutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportData?.knowledgeBase?.commonIssues?.map((issue, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm mb-2">{issue.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Views: {issue.views}</span>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          {issue.rating}/5
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
                  Quick Response Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportData?.knowledgeBase?.templates?.map((template, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{template.title}</h4>
                        <Badge variant="outline" size="sm">{template.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
                      <div className="flex justify-end mt-2">
                        <Button variant="ghost" size="sm">Use Template</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Archive className="h-5 w-5 mr-2 text-purple-600" />
                  Resolution Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">89%</div>
                      <div className="text-sm text-gray-600">First Contact Resolution</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">4.6</div>
                      <div className="text-sm text-gray-600">Customer Satisfaction</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">2.3h</div>
                      <div className="text-sm text-gray-600">Avg Response Time</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">98%</div>
                      <div className="text-sm text-gray-600">Resolution Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                  Escalation Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-red-500 bg-red-50">
                    <h4 className="font-medium text-sm text-red-800">Critical Issues</h4>
                    <p className="text-sm text-red-700">Escalate immediately to management team</p>
                  </div>
                  <div className="p-3 border-l-4 border-orange-500 bg-orange-50">
                    <h4 className="font-medium text-sm text-orange-800">High Priority</h4>
                    <p className="text-sm text-orange-700">Escalate within 2 hours if unresolved</p>
                  </div>
                  <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
                    <h4 className="font-medium text-sm text-yellow-800">Medium Priority</h4>
                    <p className="text-sm text-yellow-700">Escalate within 24 hours if unresolved</p>
                  </div>
                  <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                    <h4 className="font-medium text-sm text-blue-800">Low Priority</h4>
                    <p className="text-sm text-blue-700">Escalate within 72 hours if unresolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgencySupportPage;
