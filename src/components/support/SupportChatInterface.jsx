import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Clock, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import supportService from '@/services/supportService';
import aiSupportService from '@/services/aiSupportService';

const SupportChatInterface = ({
  chatHistory,
  setChatHistory,
  agentStatus,
  onSendMessage,
}) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Simulate typing indicator
  useEffect(() => {
    if (
      chatHistory.length > 0 &&
      chatHistory[chatHistory.length - 1].type === 'user'
    ) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || isLoading) return;

    setIsLoading(true);
    const userMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      user: user.name || user.email,
      category,
    };

    setChatHistory((prev) => [...prev, userMessage]);
    const messageToSend = message.trim();
    setMessage('');

    try {
      await onSendMessage({
        message: messageToSend,
        category,
        userMessage,
      });
      // Simulate AI typing then respond
      setIsTyping(true);
      const ai = await aiSupportService.respond({
        message: messageToSend,
        category,
        user,
      });
      await new Promise((r) => setTimeout(r, 600));
      setChatHistory((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          type: 'assistant',
          content: ai.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
      setAiSuggestions(ai.suggestions || []);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (title) => {
    if (!user || isLoading) return;
    setMessage(title);
    await handleSendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const categories = supportService.getSupportCategories();

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Chat Header */}
      <div className='px-4 py-3 border-b border-gray-200 bg-gray-50'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <div className='relative'>
              <MessageCircle className='h-5 w-5 text-purple-600' />
              {agentStatus?.onlineAgents > 0 && (
                <div className='absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full' />
              )}
            </div>
            <div>
              <p className='text-sm font-medium text-gray-800'>Support Chat</p>
              <p className='text-xs text-gray-500'>
                {agentStatus?.onlineAgents > 0
                  ? `${agentStatus.onlineAgents} agents online`
                  : "We'll respond soon"}
              </p>
            </div>
          </div>

          <Badge variant='outline' className='text-xs'>
            <Clock className='h-3 w-3 mr-1' />
            {agentStatus?.averageResponseTime}
          </Badge>
        </div>
      </div>

      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {chatHistory.length === 0 ? (
          <div className='text-center py-8'>
            <div className='bg-gradient-to-br from-purple-100 to-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <MessageCircle className='h-8 w-8 text-purple-600' />
            </div>
            <h3 className='font-medium text-gray-800 mb-2'>
              Welcome to Support Chat
            </h3>
            <p className='text-sm text-gray-600 mb-4'>
              How can we help you today? Our team is here to assist you.
            </p>
            <div className='grid grid-cols-2 gap-2 max-w-xs mx-auto'>
              {categories.slice(0, 4).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setMessage(`I need help with ${cat.label.toLowerCase()}`);
                  }}
                  className='text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors'
                >
                  <span className='mr-1'>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-xs ${
                    msg.type === 'user'
                      ? 'flex-row-reverse space-x-reverse'
                      : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.type === 'user'
                        ? 'bg-purple-600 text-white'
                        : msg.type === 'system'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {msg.type === 'user' ? (
                      <User className='h-4 w-4' />
                    ) : (
                      <Bot className='h-4 w-4' />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-purple-600 text-white'
                        : msg.type === 'system'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className='text-sm leading-relaxed'>{msg.content}</p>

                    {/* Message metadata */}
                    <div
                      className={`flex items-center justify-between mt-2 text-xs ${
                        msg.type === 'user'
                          ? 'text-purple-200'
                          : 'text-gray-500'
                      }`}
                    >
                      <span>{formatTimestamp(msg.timestamp)}</span>
                      {msg.ticketId && (
                        <span className='font-mono'>
                          #{msg.ticketId.slice(-6)}
                        </span>
                      )}
                    </div>

                    {/* Category badge for user messages */}
                    {msg.type === 'user' && msg.category && (
                      <Badge
                        variant='secondary'
                        className='mt-2 text-xs bg-white/20 text-white border-white/30'
                      >
                        {categories.find((c) => c.id === msg.category)?.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className='flex flex-wrap gap-2 pt-2'>
                {aiSuggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSuggestionClick(s.title)}
                    className='px-3 py-1 text-xs rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors'
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='flex justify-start'
              >
                <div className='flex items-center space-x-2'>
                  <div className='w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center'>
                    <Bot className='h-4 w-4 text-gray-600' />
                  </div>
                  <div className='bg-gray-100 rounded-lg px-4 py-2'>
                    <div className='flex space-x-1'>
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' />
                      <div
                        className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className='border-t border-gray-200 p-4 bg-white'>
        {/* Category selector */}
        <div className='mb-3'>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className='w-full text-xs border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Message input */}
        <div className='flex space-x-2'>
          <div className='flex-1'>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                user ? 'Type your message...' : 'Please log in to send messages'
              }
              className='text-sm resize-none'
              disabled={isLoading || !user}
              maxLength={500}
            />
            <div className='text-xs text-gray-400 mt-1 text-right'>
              {message.length}/500
            </div>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading || !user}
            size='sm'
            className='px-4 bg-purple-600 hover:bg-purple-700'
          >
            {isLoading ? (
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
            ) : (
              <Send className='h-4 w-4' />
            )}
          </Button>
        </div>

        {!user && (
          <p className='text-xs text-gray-500 text-center mt-2'>
            Please log in to start a conversation with our support team
          </p>
        )}
      </div>
    </div>
  );
};

export default SupportChatInterface;
