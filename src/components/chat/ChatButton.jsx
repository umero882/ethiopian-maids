import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/contexts/ChatContext';
import ChatInterface from './ChatInterface';

const ChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { unreadCounts } = useChat();

  const totalUnreadCount = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <>
      <div className='relative'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setIsChatOpen(true)}
          className='relative p-2'
        >
          <MessageCircle className='h-5 w-5' />
          {totalUnreadCount > 0 && (
            <Badge className='absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500'>
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </div>

      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default ChatButton;
