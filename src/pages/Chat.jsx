import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Navigate } from 'react-router-dom';
import { MessageCircle, Send, Search, Users, User, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import OnlineIndicator from '@/components/chat/OnlineIndicator';

const Chat = () => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages: contextMessages,
    sendMessage,
    setActiveConversation,
    markAsRead,
    loadMessages,
    isUserOnline,
    unreadCounts,
    onlineUsers,
    createConversation,
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      markAsRead(activeConversation.id);
    }
  }, [activeConversation, loadMessages, markAsRead]);

  // Get messages for active conversation
  const messages = activeConversation
    ? contextMessages[activeConversation.id] || []
    : [];

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation) return;

    await sendMessage(activeConversation.id, messageInput);
    setMessageInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'maid':
        return <User className='h-4 w-4' />;
      case 'agency':
        return <Building2 className='h-4 w-4' />;
      case 'sponsor':
        return <Users className='h-4 w-4' />;
      default:
        return <User className='h-4 w-4' />;
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.partnerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='text-center mb-8'>
          <MessageCircle className='h-16 w-16 text-purple-600 mx-auto mb-4' />
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Messages</h1>
          <p className='text-gray-600'>
            Connect with maids, sponsors, and agencies
          </p>
        </div>

        <Card className='shadow-xl border-0'>
          <CardContent className='p-0'>
            <div className='flex h-[calc(100vh-280px)] min-h-[600px]'>
              {/* Conversations List */}
              <div className='w-80 border-r bg-white flex flex-col'>
                <div className='p-4 border-b bg-gray-50'>
                  <div className='relative mb-3'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                    <Input
                      placeholder='Search conversations...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-10'
                    />
                  </div>

                  {/* Online Users Count */}
                  {onlineUsers.length > 0 && (
                    <div className='flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg'>
                      <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
                      <span className='font-medium'>
                        {onlineUsers.length} {onlineUsers.length === 1 ? 'user' : 'users'} online
                      </span>
                    </div>
                  )}
                </div>

                <ScrollArea className='flex-1'>
                  <div className='p-2'>
                    {/* Online Users Section */}
                    {onlineUsers.length > 0 && (
                      <div className='mb-4'>
                        <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2'>
                          Online Now ({onlineUsers.length})
                        </h3>
                        <div className='space-y-1'>
                          {onlineUsers.map((onlineUser) => {
                            // Don't allow clicking on yourself
                            const isCurrentUser = onlineUser.userId === user?.id;

                            // Check if conversation already exists with this user
                            const existingConv = conversations.find(
                              (c) => c.partnerId === onlineUser.userId
                            );

                            const handleUserClick = async () => {
                              if (isCurrentUser) return;

                              if (existingConv) {
                                // If conversation exists, just open it
                                setActiveConversation(existingConv);
                                await loadMessages(existingConv.id);
                              } else {
                                // Create new conversation
                                const newConv = await createConversation(
                                  onlineUser.userId,
                                  onlineUser.userName,
                                  onlineUser.userType
                                );
                                if (newConv) {
                                  setActiveConversation(newConv);
                                }
                              }
                            };

                            return (
                              <div
                                key={onlineUser.userId}
                                onClick={handleUserClick}
                                className={`px-3 py-2 rounded-lg transition-colors ${
                                  isCurrentUser
                                    ? 'cursor-default bg-gray-50/50'
                                    : 'cursor-pointer hover:bg-purple-50 hover:shadow-sm'
                                } ${
                                  activeConversation?.partnerId === onlineUser.userId
                                    ? 'bg-purple-50 border border-purple-200'
                                    : ''
                                }`}
                              >
                                <div className='flex items-center gap-3'>
                                  <div className='relative'>
                                    <Avatar className='h-8 w-8'>
                                      <AvatarFallback className='bg-green-100 text-green-600 text-xs'>
                                        {onlineUser.userName?.charAt(0) || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full'></span>
                                  </div>
                                  <div className='flex-1 min-w-0'>
                                    <div className='flex items-center gap-2'>
                                      <p className='text-sm font-medium truncate'>
                                        {onlineUser.userName || 'Unknown'}
                                        {isCurrentUser && (
                                          <span className='text-xs text-gray-500 ml-1'>(You)</span>
                                        )}
                                      </p>
                                      {!isCurrentUser && (
                                        <MessageCircle className='w-3 h-3 text-gray-400' />
                                      )}
                                    </div>
                                    <div className='flex items-center gap-1'>
                                      {getRoleIcon(onlineUser.userType)}
                                      <span className='text-xs text-gray-500 capitalize'>
                                        {onlineUser.userType || 'User'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Conversations Header */}
                    <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2'>
                      Conversations ({filteredConversations.length})
                    </h3>

                    {filteredConversations.length === 0 ? (
                      <div className='text-center text-gray-500 py-8'>
                        <MessageCircle className='h-12 w-12 mx-auto mb-2 text-gray-300' />
                        <p className='text-sm'>No conversations yet</p>
                      </div>
                    ) : (
                      filteredConversations.map((conv) => {
                        const isOnline = isUserOnline(conv.partnerId);
                        const unreadCount = unreadCounts[conv.id] || 0;

                        return (
                          <div
                            key={conv.id}
                            onClick={() => setActiveConversation(conv)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                              activeConversation?.id === conv.id
                                ? 'bg-purple-50 border border-purple-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className='flex items-start gap-3'>
                              <div className='relative'>
                                <Avatar className='h-10 w-10'>
                                  <AvatarImage src={conv.partnerAvatar} />
                                  <AvatarFallback className='bg-purple-100 text-purple-600'>
                                    {conv.partnerName?.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <OnlineIndicator
                                  isOnline={isOnline}
                                  size='sm'
                                  position='absolute'
                                  className='bottom-0 right-0 border-2 border-white rounded-full'
                                />
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between mb-1'>
                                  <h4 className='font-semibold text-sm truncate'>
                                    {conv.partnerName || 'Unknown User'}
                                  </h4>
                                  <span className='text-xs text-gray-500'>
                                    {conv.lastMessageTime && formatDistanceToNow(new Date(conv.lastMessageTime), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                </div>
                                <div className='flex items-center gap-1 mb-1'>
                                  {getRoleIcon(conv.partnerType)}
                                  <span className='text-xs text-gray-500 capitalize'>
                                    {conv.partnerType || 'User'}
                                  </span>
                                  {isOnline && (
                                    <span className='ml-1 flex items-center gap-1 text-xs text-green-600'>
                                      <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>
                                      Online
                                    </span>
                                  )}
                                </div>
                                <div className='flex items-center justify-between'>
                                  <p className='text-sm text-gray-600 truncate'>
                                    {conv.lastMessage || 'No messages yet'}
                                  </p>
                                  {unreadCount > 0 && (
                                    <Badge className='ml-2 bg-purple-600 text-white h-5 min-w-5 flex items-center justify-center text-xs'>
                                      {unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className='flex-1 flex flex-col bg-white'>
                {activeConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className='p-4 border-b bg-gray-50 flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='relative'>
                          <Avatar className='h-10 w-10'>
                            <AvatarImage src={activeConversation.partnerAvatar} />
                            <AvatarFallback className='bg-purple-100 text-purple-600'>
                              {activeConversation.partnerName?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <OnlineIndicator
                            isOnline={isUserOnline(activeConversation.partnerId)}
                            size='sm'
                            position='absolute'
                            className='bottom-0 right-0 border-2 border-white rounded-full'
                          />
                        </div>
                        <div>
                          <h3 className='font-semibold'>
                            {activeConversation.partnerName || 'Unknown User'}
                          </h3>
                          <div className='flex items-center gap-1'>
                            {getRoleIcon(activeConversation.partnerType)}
                            <span className='text-sm text-gray-500 capitalize'>
                              {activeConversation.partnerType || 'User'}
                            </span>
                            {isUserOnline(activeConversation.partnerId) && (
                              <span className='ml-2 flex items-center gap-1 text-xs text-green-600'>
                                <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                                Online
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className='flex-1 p-4 bg-gray-50'>
                      <div className='space-y-4'>
                        {messages.length === 0 ? (
                          <div className='text-center text-gray-500 py-8'>
                            <MessageCircle className='h-12 w-12 mx-auto mb-2 text-gray-300' />
                            <p className='text-sm'>No messages yet. Start a conversation!</p>
                          </div>
                        ) : (
                          messages.map((message) => {
                            const isSentByMe = message.senderId === user.id;

                            return (
                              <div
                                key={message.id}
                                className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-md px-4 py-2 rounded-lg ${
                                    isSentByMe
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-white border border-gray-200'
                                  }`}
                                >
                                  <p className='text-sm'>{message.content}</p>
                                  <span
                                    className={`text-xs mt-1 block ${
                                      isSentByMe
                                        ? 'text-purple-200'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {formatDistanceToNow(new Date(message.timestamp), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className='p-4 border-t bg-white'>
                      <div className='flex items-center gap-2'>
                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder='Type a message...'
                          className='flex-1'
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim()}
                          className='bg-purple-600 hover:bg-purple-700'
                        >
                          <Send className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='flex-1 flex items-center justify-center text-gray-500 bg-gray-50'>
                    <div className='text-center'>
                      <MessageCircle className='h-16 w-16 mx-auto mb-4 text-gray-300' />
                      <h3 className='text-lg font-medium mb-2'>
                        No conversation selected
                      </h3>
                      <p className='text-sm'>
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
