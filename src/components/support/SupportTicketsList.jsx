import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Filter,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/databaseClient';

const SupportTicketsList = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Load tickets based on user role
  useEffect(() => {
    loadTickets();
  }, [user, filter]);

  const loadTickets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select(
          `
          *,
          assigned_agent:assigned_agent_id(name, email),
          messages:support_messages(count)
        `
        )
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (user.userType !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTickets(data || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      // Fallback to localStorage for development
      const localTickets = JSON.parse(
        localStorage.getItem('support_tickets') || '[]'
      );
      setTickets(localTickets);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          resolved_at:
            newStatus === 'resolved' ? new Date().toISOString() : null,
          closed_at: newStatus === 'closed' ? new Date().toISOString() : null,
        })
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className='h-4 w-4 text-red-500' />;
      case 'in_progress':
        return <Clock className='h-4 w-4 text-yellow-500' />;
      case 'resolved':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'closed':
        return <XCircle className='h-4 w-4 text-gray-500' />;
      default:
        return <MessageCircle className='h-4 w-4 text-blue-500' />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'normal':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      searchQuery === '' ||
      ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600'></div>
        <span className='ml-3 text-gray-600'>Loading tickets...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header and Stats */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Support Tickets</h2>
          <p className='text-gray-600'>
            {user?.userType === 'admin'
              ? 'Manage all support tickets'
              : 'Your support requests'}
          </p>
        </div>

        {/* Quick stats */}
        <div className='flex gap-2'>
          {Object.entries(ticketStats).map(([status, count]) => (
            <Badge
              key={status}
              variant='outline'
              className={`${status === filter ? 'bg-purple-100 border-purple-300' : ''}`}
            >
              {status.replace('_', ' ')}: {count}
            </Badge>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              placeholder='Search tickets...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        <div className='flex gap-2'>
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(
            (status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size='sm'
                onClick={() => setFilter(status)}
                className='capitalize'
              >
                {status.replace('_', ' ')}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Tickets List */}
      <div className='space-y-4'>
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className='text-center py-12'>
              <MessageCircle className='h-12 w-12 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No tickets found
              </h3>
              <p className='text-gray-600'>
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'No support tickets match the current filter'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className='hover:shadow-md transition-shadow cursor-pointer'>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      {/* Header */}
                      <div className='flex items-center gap-3 mb-3'>
                        {getStatusIcon(ticket.status)}
                        <div className='flex-1'>
                          <h3 className='font-semibold text-gray-900'>
                            {ticket.subject ||
                              `${ticket.category} - ${ticket.user_name}`}
                          </h3>
                          <p className='text-sm text-gray-600'>
                            Ticket #{ticket.id.slice(-8)} • {ticket.user_name} (
                            {ticket.user_type})
                          </p>
                        </div>

                        <div className='flex items-center gap-2'>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge
                            variant='outline'
                            className={getStatusColor(ticket.status)}
                          >
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Message preview */}
                      <p className='text-gray-700 mb-4 line-clamp-2'>
                        {ticket.message}
                      </p>

                      {/* Footer */}
                      <div className='flex items-center justify-between text-sm text-gray-500'>
                        <div className='flex items-center gap-4'>
                          <div className='flex items-center gap-1'>
                            <Calendar className='h-4 w-4' />
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                          {ticket.assigned_agent && (
                            <div className='flex items-center gap-1'>
                              <User className='h-4 w-4' />
                              {ticket.assigned_agent.name}
                            </div>
                          )}
                          <div className='flex items-center gap-1'>
                            <MessageCircle className='h-4 w-4' />
                            {ticket.response_count || 0} responses
                          </div>
                        </div>

                        {/* Actions for admins */}
                        {user?.userType === 'admin' && (
                          <div className='flex gap-2'>
                            {ticket.status === 'open' && (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  updateTicketStatus(ticket.id, 'in_progress')
                                }
                              >
                                Start
                              </Button>
                            )}
                            {ticket.status === 'in_progress' && (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  updateTicketStatus(ticket.id, 'resolved')
                                }
                              >
                                Resolve
                              </Button>
                            )}
                            {ticket.status === 'resolved' && (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  updateTicketStatus(ticket.id, 'closed')
                                }
                              >
                                Close
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default SupportTicketsList;
