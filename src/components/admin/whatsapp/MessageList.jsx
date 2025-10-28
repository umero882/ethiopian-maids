/**
 * MessageList Component
 * Displays WhatsApp conversations with contact list and message thread
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, User, Bot, Phone, RefreshCw, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const MessageList = ({
  contacts,
  messages,
  selectedContact,
  onSelectContact,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(contact =>
    contact.phone_number.includes(searchTerm) ||
    contact.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (phoneNumber) => {
    return phoneNumber.slice(-4);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contacts List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Contacts</CardTitle>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No contacts found
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.phone_number}
                    onClick={() => onSelectContact(contact.phone_number)}
                    className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-accent ${
                      selectedContact === contact.phone_number
                        ? 'bg-accent'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {getInitials(contact.phone_number)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">
                            {contact.phone_number}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(contact.last_message_at), 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {contact.last_sender === 'assistant' && (
                            <Bot className="h-3 w-3 text-green-500 flex-shrink-0" />
                          )}
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.last_message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conversation View */}
      <Card className="lg:col-span-2">
        <CardHeader>
          {selectedContact ? (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-500" />
              <div>
                <CardTitle className="text-lg">{selectedContact}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {messages.length} messages
                </p>
              </div>
            </div>
          ) : (
            <CardTitle className="text-lg">Select a conversation</CardTitle>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] p-4">
            {!selectedContact ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a contact to view conversation
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        message.sender === 'user' ? 'order-2' : 'order-1'
                      }`}
                    >
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender === 'user'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-green-100 text-green-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.sender === 'user' ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Bot className="h-3 w-3" />
                          )}
                          <span className="text-xs font-medium">
                            {message.sender === 'user' ? 'User' : 'Lucy'}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {message.message_content}
                        </p>
                        <p className="text-xs opacity-70 mt-2">
                          {format(new Date(message.received_at), 'PPp')}
                        </p>
                      </div>
                      {message.sender === 'assistant' && message.ai_response && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          AI Generated
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageList;
