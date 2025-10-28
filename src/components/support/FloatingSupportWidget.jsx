import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Phone,
  X,
  Send,
  ChevronDown,
  Clock,
  Users,
  HelpCircle,
  Minimize2,
  Maximize2,
  Zap,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import supportService from '@/services/supportService';
import SupportChatInterface from './SupportChatInterface';

const FloatingSupportWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'faq', 'call'
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [faqQuery, setFaqQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Load agent availability on mount
  useEffect(() => {
    const availability = supportService.getAgentAvailability();
    setAgentStatus(availability);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async ({ message, category, userMessage }) => {
    if (!user) return;

    setIsLoading(true);

    try {
      const result = await supportService.sendSupportMessage({
        user,
        message: message,
        category,
        priority: category === 'urgent' ? 'high' : 'normal',
      });

      if (result.success) {
        // Add system response
        const systemMessage = {
          id: `sys-${Date.now()}`,
          type: 'system',
          content: result.fallback
            ? 'Your message has been received and will be processed shortly. A support agent will contact you soon.'
            : `Your message has been sent to our support team. You should receive a response within ${agentStatus?.averageResponseTime}.`,
          timestamp: new Date().toISOString(),
          ticketId: result.ticket?.id,
        };
        setChatHistory((prev) => [...prev, systemMessage]);

        toast({
          title: 'Message Sent',
          description: 'Our support team will get back to you soon!',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to Send',
        description: 'Please try again or call us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to access phone support.',
        variant: 'destructive',
      });
      return;
    }

    supportService.initiateCall(user);
  };

  const categories = supportService.getSupportCategories();
  const faqItems = faqQuery
    ? supportService.searchFAQ(faqQuery)
    : supportService.getFAQItems().slice(0, 4);

  // Widget button (collapsed state)
  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className='fixed bottom-6 right-6 z-50'
      >
        <Button
          onClick={() => setIsOpen(true)}
          className='h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 group'
          aria-label='Open customer support'
        >
          <MessageCircle className='h-6 w-6 text-white group-hover:scale-110 transition-transform' />
        </Button>

        {/* Status indicator */}
        {agentStatus?.onlineAgents > 0 && (
          <div className='absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse' />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 100 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: 0,
        height: isMinimized ? 'auto' : '500px',
      }}
      exit={{ scale: 0, opacity: 0, y: 100 }}
      className='fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden'
      style={{ width: '380px', maxWidth: '90vw' }}
    >
      {/* Header */}
      <div className='bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='relative'>
            <MessageCircle className='h-6 w-6' />
            {agentStatus?.onlineAgents > 0 && (
              <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white' />
            )}
          </div>
          <div>
            <h3 className='font-semibold text-sm'>Customer Support</h3>
            <p className='text-xs text-purple-100'>
              {agentStatus?.onlineAgents > 0
                ? `${agentStatus.onlineAgents} agents online`
                : "We'll get back to you soon"}
            </p>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsMinimized(!isMinimized)}
            className='text-white hover:bg-white/20 p-1 h-8 w-8'
          >
            {isMinimized ? (
              <Maximize2 className='h-4 w-4' />
            ) : (
              <Minimize2 className='h-4 w-4' />
            )}
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsOpen(false)}
            className='text-white hover:bg-white/20 p-1 h-8 w-8'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className='flex flex-col h-96'
          >
            {/* Tabs */}
            <div className='flex border-b border-gray-200'>
              {[
                { id: 'chat', label: 'Chat', icon: MessageCircle },
                { id: 'call', label: 'Call', icon: Phone },
                { id: 'faq', label: 'FAQ', icon: HelpCircle },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className='h-4 w-4' />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className='flex-1 overflow-hidden'>
              {activeTab === 'chat' && (
                <SupportChatInterface
                  chatHistory={chatHistory}
                  setChatHistory={setChatHistory}
                  agentStatus={agentStatus}
                  onSendMessage={handleSendMessage}
                />
              )}

              {activeTab === 'call' && (
                <div className='p-6 text-center space-y-6'>
                  <div className='bg-gradient-to-br from-green-100 to-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto'>
                    <Phone className='h-10 w-10 text-green-600' />
                  </div>

                  <div>
                    <h3 className='font-semibold text-lg text-gray-800'>
                      Call Support
                    </h3>
                    <p className='text-sm text-gray-600 mt-2'>
                      Speak directly with our support specialists
                    </p>
                  </div>

                  <div className='bg-gray-50 rounded-lg p-4 space-y-3'>
                    <div className='flex items-center justify-center space-x-2 text-sm'>
                      <Clock className='h-4 w-4 text-gray-500' />
                      <span className='font-medium'>
                        Business Hours: 8 AM - 10 PM GST
                      </span>
                    </div>
                    <div className='flex items-center justify-center space-x-2 text-sm'>
                      <Users className='h-4 w-4 text-gray-500' />
                      <span>
                        {agentStatus?.isBusinessHours
                          ? `${agentStatus.onlineAgents} agents available now`
                          : "Leave a message, we'll call back tomorrow"}
                      </span>
                    </div>
                    {agentStatus?.isBusinessHours && (
                      <div className='flex items-center justify-center space-x-2 text-sm'>
                        <Zap className='h-4 w-4 text-yellow-500' />
                        <span className='text-green-600 font-medium'>
                          Average wait time: 2 minutes
                        </span>
                      </div>
                    )}
                  </div>

                  <div className='space-y-3'>
                    <Button
                      onClick={handleCall}
                      disabled={!user}
                      className='w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3'
                    >
                      <Phone className='h-5 w-5 mr-2' />
                      Call Now: {supportService.supportPhone}
                    </Button>

                    {!agentStatus?.isBusinessHours && (
                      <Button
                        onClick={() => setActiveTab('chat')}
                        variant='outline'
                        className='w-full'
                      >
                        <MessageCircle className='h-4 w-4 mr-2' />
                        Send Message Instead
                      </Button>
                    )}
                  </div>

                  {!user && (
                    <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                      <div className='flex items-center justify-center space-x-2'>
                        <Shield className='h-4 w-4 text-yellow-600' />
                        <p className='text-xs text-yellow-700 font-medium'>
                          Please log in to access phone support
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'faq' && (
                <div className='p-4 space-y-4'>
                  <Input
                    value={faqQuery}
                    onChange={(e) => setFaqQuery(e.target.value)}
                    placeholder='Search FAQ...'
                    className='text-sm'
                  />

                  <div className='space-y-3 max-h-64 overflow-y-auto'>
                    {faqItems.map((item) => (
                      <div
                        key={item.id}
                        className='border border-gray-200 rounded-lg p-3'
                      >
                        <h4 className='font-medium text-sm text-gray-800 mb-2'>
                          {item.question}
                        </h4>
                        <p className='text-xs text-gray-600 leading-relaxed'>
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>

                  {faqItems.length === 0 && faqQuery && (
                    <div className='text-center py-8 text-gray-500'>
                      <HelpCircle className='h-12 w-12 mx-auto mb-3 text-gray-300' />
                      <p className='text-sm'>No FAQ items found</p>
                      <p className='text-xs text-gray-400 mt-1'>
                        Try a different search term or contact support
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FloatingSupportWidget;
