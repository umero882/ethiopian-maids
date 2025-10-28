import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Download,
  Play,
  Pause,
  FileText,
  Image as ImageIcon,
  File,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const MessageBubble = ({ message, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioElement, setAudioElement] = useState(null);

  const formatMessageTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const handleAudioPlay = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFileDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return <div className='text-sm'>{message.content}</div>;

      case 'file':
        return (
          <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
            <File className='h-8 w-8 text-blue-500' />
            <div className='flex-1 min-w-0'>
              <p className='font-medium text-sm truncate'>
                {message.file.name}
              </p>
              <p className='text-xs text-gray-500'>
                {(message.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleFileDownload(message.file)}
            >
              <Download className='h-4 w-4' />
            </Button>
          </div>
        );

      case 'image':
        return (
          <div className='max-w-xs'>
            <img
              src={message.file.url}
              alt={message.file.name}
              className='rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity'
              onClick={() => window.open(message.file.url, '_blank')}
            />
            {message.file.name && (
              <p className='text-xs text-gray-500 mt-1 truncate'>
                {message.file.name}
              </p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-[200px]'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleAudioPlay}
              className='h-8 w-8 p-0'
            >
              {isPlaying ? (
                <Pause className='h-4 w-4' />
              ) : (
                <Play className='h-4 w-4' />
              )}
            </Button>

            <div className='flex-1'>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${audioProgress}%` }}
                ></div>
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                {audioDuration > 0
                  ? `${Math.floor((audioProgress / 100) * audioDuration)}s / ${audioDuration}s`
                  : 'Voice message'}
              </p>
            </div>
          </div>
        );

      case 'document':
        return (
          <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
            <FileText className='h-8 w-8 text-red-500' />
            <div className='flex-1 min-w-0'>
              <p className='font-medium text-sm truncate'>
                {message.file.name}
              </p>
              <p className='text-xs text-gray-500'>
                {message.file.type} •{' '}
                {(message.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleFileDownload(message.file)}
            >
              <Download className='h-4 w-4' />
            </Button>
          </div>
        );

      default:
        return <div className='text-sm'>{message.content}</div>;
    }
  };

  const renderMessageStatus = () => {
    // Mock status - replace with actual message status from backend
    const status = 'read'; // 'sent', 'delivered', 'read'

    switch (status) {
      case 'sent':
        return <Check className='h-3 w-3 text-gray-400' />;
      case 'delivered':
        return <CheckCheck className='h-3 w-3 text-gray-400' />;
      case 'read':
        return <CheckCheck className='h-3 w-3 text-blue-500' />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <Avatar className='h-8 w-8 flex-shrink-0'>
          <AvatarImage src='' />
          <AvatarFallback className='text-xs'>
            {message.senderName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}
      >
        {!isOwn && (
          <p className='text-xs text-gray-500 mb-1'>{message.senderName}</p>
        )}

        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
          }`}
        >
          {renderMessageContent()}
        </div>

        <div
          className={`flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}
        >
          <span className='text-xs text-gray-500'>
            {formatMessageTime(message.timestamp)}
          </span>
          {isOwn && renderMessageStatus()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
