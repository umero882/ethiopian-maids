import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X, Maximize2 } from 'lucide-react';
import { getDisplayName } from '@/lib/displayName';
import MessageBubble from './MessageBubble';

const ChatPanel = ({ conversationId, offsetIndex = 0, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations, messages, sendMessage } = useChat();
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  const conversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId]
  );
  const thread = messages[conversationId] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage(conversationId, text.trim());
    setText('');
  };

  if (!conversation) return null;

  const rawName = conversation.participantNames.find(
    (_, i) => conversation.participants[i] !== user?.id
  );
  const name = getDisplayName({ full_name: rawName, name: rawName });

  const panelWidth = 340; // px
  const gap = 12;
  const rightPx = 24 + offsetIndex * (panelWidth + gap);

  return (
    <div
      role='dialog'
      aria-label={`Chat with ${name || 'conversation'}`}
      className='fixed z-[10001] bottom-[24px] bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden'
      style={{ width: `${panelWidth}px`, height: '480px', right: `${rightPx}px` }}
    >
      <div className='flex items-center justify-between px-3 py-2 border-b bg-white'>
        <div className='flex items-center gap-2 min-w-0'>
          <Avatar className='h-7 w-7'>
            <AvatarImage src='' />
            <AvatarFallback className='text-xs'>
              {name
                ?.split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <div className='text-sm font-medium truncate'>{name || 'Chat'}</div>
          </div>
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon'
            className='h-7 w-7'
            onClick={() => navigate('/chat')}
            title='Open full chat'
            aria-label='Open full chat'
          >
            <Maximize2 className='h-3.5 w-3.5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={onClose}
            aria-label='Close panel'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <ScrollArea className='flex-1 p-3 bg-gray-50'>
        <div className='space-y-3'>
          {thread.map((m) => (
            <MessageBubble key={m.id} message={m} isOwn={m.senderId === user?.id} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className='p-2 border-t bg-white'>
        <div className='flex items-center gap-2'>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder='Type a message…'
            className='text-sm'
          />
          <Button size='sm' onClick={handleSend} disabled={!text.trim()} aria-label='Send message'>
            <Send className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
