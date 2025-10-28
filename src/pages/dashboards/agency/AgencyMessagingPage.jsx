import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Filter,
  MessageSquare,
  Send,
  MoreVertical,
  User,
  Building2,
  Clock,
  CheckCircle,
  Archive,
  Tag,
  Layout,
  Plus,
  Edit,
  Copy,
  Trash2,
  Eye,
  FileText,
  Mail,
  Phone,
  Calendar,
  Star,
  AlertCircle,
  CheckCheck,
  Circle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import AgencyDashboardService from '@/services/agencyDashboardService';
import { useAuth } from '@/contexts/AuthContext';

const AgencyMessagingPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [messageInput, setMessageInput] = useState('');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateVariables, setTemplateVariables] = useState({});
  const [isComposingNew, setIsComposingNew] = useState(false);
  const messagesEndRef = useRef(null);

  // For agency users, their own ID is the agency_id
  const agencyId = user?.id;

  useEffect(() => {
    loadConversations();
    loadTemplates();
  }, [agencyId]);

  useEffect(() => {
    applyFilters();
  }, [conversations, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markConversationAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await AgencyDashboardService.getConversationsWithFilters(agencyId, {
        status: statusFilter === 'all' ? null : statusFilter,
        type: typeFilter === 'all' ? null : typeFilter,
        search: searchTerm
      });
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await AgencyDashboardService.getMessageTemplates(agencyId);
      setTemplates(data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const data = await AgencyDashboardService.getMessagesForConversation(conversationId);
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      await AgencyDashboardService.markConversationAsRead(conversationId, agencyId);
      // Update local state
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const applyFilters = () => {
    let filtered = conversations;

    if (searchTerm) {
      filtered = filtered.filter(conv =>
        conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.latest_message?.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(conv => conv.participant_type === typeFilter);
    }

    setFilteredConversations(filtered);
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      const message = await AgencyDashboardService.sendMessage(
        selectedConversation.id,
        messageInput,
        'agency',
        agencyId
      );

      setMessages(prev => [...prev, message]);
      setMessageInput('');

      // Update conversation in list
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              latest_message: { content: messageInput, sender_type: 'agency', created_at: new Date().toISOString() },
              last_message_at: new Date().toISOString()
            }
          : conv
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const useTemplate = (template) => {
    setSelectedTemplate(template);
    const variables = {};
    template.variables?.forEach(variable => {
      variables[variable] = '';
    });
    setTemplateVariables(variables);
    setIsTemplateDialogOpen(true);
  };

  const applyTemplate = () => {
    if (!selectedTemplate) return;

    let content = selectedTemplate.content;
    Object.keys(templateVariables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, templateVariables[key] || `{{${key}}}`);
    });

    setMessageInput(content);
    setIsTemplateDialogOpen(false);
    setSelectedTemplate(null);
    setTemplateVariables({});
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      archived: { color: 'bg-gray-100 text-gray-800', icon: Archive }
    };

    const config = statusConfig[status] || statusConfig.active;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor((now - date) / (1000 * 60))}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const ConversationItem = ({ conversation }) => (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        selectedConversation?.id === conversation.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => setSelectedConversation(conversation)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.participant_avatar} />
              <AvatarFallback>
                {conversation.participant_type === 'sponsor' ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900 truncate">
                  {conversation.participant_name}
                </h4>
                {conversation.unread_count > 0 && (
                  <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0.5">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 capitalize">
                {conversation.participant_type}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {formatTime(conversation.last_message_at)}
            </p>
            {getStatusBadge(conversation.status)}
          </div>
        </div>

        <div className="mb-3">
          <p className="text-sm text-gray-700 line-clamp-2">
            {conversation.latest_message?.content || 'No messages yet'}
          </p>
        </div>

        {conversation.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {conversation.labels.slice(0, 3).map(label => (
              <Badge key={label} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {label}
              </Badge>
            ))}
            {conversation.labels.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{conversation.labels.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const MessageBubble = ({ message }) => {
    const isAgency = message.sender_type === 'agency';
    return (
      <div className={`flex ${isAgency ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isAgency
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="text-sm">{message.content}</p>
          <div className={`flex items-center justify-between mt-1 text-xs ${
            isAgency ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span>{message.sender_name || message.sender_type}</span>
            <div className="flex items-center space-x-1 ml-2">
              <span>{formatTime(message.created_at)}</span>
              {isAgency && (
                message.read ? (
                  <CheckCheck className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Messaging</h1>
        <p className="text-gray-600 mt-1">Communicate with sponsors and maids using templates</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Conversations List */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="space-y-4 mb-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setIsComposingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>

            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sponsor">Sponsors</SelectItem>
                  <SelectItem value="maid">Maids</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 bg-gray-200 rounded"></div>
                          <div className="h-3 w-32 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
                  <p className="text-gray-500 text-center">
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'No conversations match your filters.'
                      : 'Start messaging with sponsors and maids.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map(conversation => (
                  <ConversationItem key={conversation.id} conversation={conversation} />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <Card className="flex-1 flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.participant_avatar} />
                      <AvatarFallback>
                        {selectedConversation.participant_type === 'sponsor' ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.participant_name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {selectedConversation.participant_type}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Tag className="h-4 w-4 mr-2" />
                        Add Labels
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-500">No messages in this conversation yet</p>
                    </div>
                  ) : (
                    <div>
                      {messages.map(message => (
                        <MessageBubble key={message.id} message={message} />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTemplateDialogOpen(true)}
                    >
                      <Layout className="h-4 w-4 mr-2" />
                      Templates
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1 resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-1">
              <CardContent className="flex flex-col items-center justify-center h-full py-16">
                <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Choose a conversation from the left sidebar to start messaging with sponsors and maids.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Template Selection Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Message Templates</DialogTitle>
            <DialogDescription>
              Choose a template to use in your message
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="welcome">Welcome</TabsTrigger>
              <TabsTrigger value="interview">Interview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="placement">Placement</TabsTrigger>
              <TabsTrigger value="follow_up">Follow-up</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-96 mt-4">
              {['all', 'welcome', 'interview', 'documents', 'placement', 'follow_up'].map(category => (
                <TabsContent key={category} value={category} className="space-y-3">
                  {templates
                    .filter(template => category === 'all' || template.category === category)
                    .map(template => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => useTemplate(template)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{template.name}</h4>
                              <p className="text-sm text-gray-600">{template.subject}</p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {template.content}
                          </p>
                          {template.variables?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {template.variables.map(variable => (
                                <Badge key={variable} variant="outline" className="text-xs">
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Template Variables Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => {
        setSelectedTemplate(null);
        setTemplateVariables({});
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fill Template Variables</DialogTitle>
            <DialogDescription>
              Enter values for the template variables
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTemplate?.variables?.map(variable => (
              <div key={variable} className="space-y-2">
                <Label htmlFor={variable} className="capitalize">
                  {variable.replace('_', ' ')}
                </Label>
                <Input
                  id={variable}
                  value={templateVariables[variable] || ''}
                  onChange={(e) => setTemplateVariables(prev => ({
                    ...prev,
                    [variable]: e.target.value
                  }))}
                  placeholder={`Enter ${variable.replace('_', ' ')}`}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={applyTemplate}>
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyMessagingPage;
