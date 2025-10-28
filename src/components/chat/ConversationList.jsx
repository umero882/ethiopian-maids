import React from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayName } from '@/lib/displayName';

const ConversationList = ({
  conversations,
  activeConversation,
  unreadCounts,
  onSelectConversation,
}) => {
  const { user } = useAuth();

  const getParticipantInfo = (conversation) => {
    const participantIndex = conversation.participants.findIndex(
      (id) => id !== user.id
    );
    const nameRaw = conversation.participantNames[participantIndex];
    return {
      id: conversation.participants[participantIndex],
      name: getDisplayName({ full_name: nameRaw, name: nameRaw }),
      type: conversation.participantTypes[participantIndex],
    };
  };

  const formatLastMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) {
      // 7 days
      return format(date, 'EEE');
    } else {
      return format(date, 'MMM dd');
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    return message.length > maxLength
      ? message.substring(0, maxLength) + '...'
      : message;
  };

  return (
    <ScrollArea className='flex-1'>
      <div className='space-y-1'>
        {conversations.length === 0 ? (
          <div className='p-4 text-center text-gray-500'>
            <p>No conversations yet</p>
            <p className='text-sm'>Start a conversation by messaging someone</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const participant = getParticipantInfo(conversation);
            const unreadCount = unreadCounts[conversation.id] || 0;
            const isActive = activeConversation?.id === conversation.id;

            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  isActive ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className='flex items-start gap-3'>
                  <div className='relative'>
                    <Avatar className='h-12 w-12'>
                      <AvatarImage src='' />
                      <AvatarFallback className='bg-gradient-to-br from-blue-500 to-purple-600 text-white'>
                        {participant.name
                          .split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Online indicator */}
                    <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full'></div>
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <h4 className='font-medium text-gray-900 truncate'>
                        {participant.name}
                      </h4>
                      <span className='text-xs text-gray-500'>
                        {formatLastMessageTime(conversation.lastMessageTime)}
                      </span>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 flex-1 min-w-0'>
                        <p
                          className={`text-sm truncate ${
                            unreadCount > 0
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          {truncateMessage(conversation.lastMessage)}
                        </p>

                        <Badge variant='secondary' className='text-xs'>
                          {participant.type}
                        </Badge>
                      </div>

                      {unreadCount > 0 && (
                        <Badge className='ml-2 bg-blue-600 text-white text-xs'>
                          {unreadCount > 99 ? '99+' : unreadCount}
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
  );
};

export default ConversationList;
