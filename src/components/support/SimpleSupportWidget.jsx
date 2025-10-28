import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Phone,
  X,
  Send,
  Clock,
  Users,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

const SimpleSupportWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    setIsLoading(true);

    // Simulate sending message
    setTimeout(() => {
      setMessage('');
      setIsLoading(false);

      // Show success message
      alert('Message sent! Our support team will get back to you soon.');
    }, 1000);
  };

  const handleCall = () => {
    const phoneNumber = '+17176998295';

    if (
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      navigator.clipboard
        .writeText(phoneNumber)
        .then(() => {
          alert(`Phone number ${phoneNumber} copied to clipboard!`);
        })
        .catch(() => {
          alert(`Please call us at ${phoneNumber}`);
        });
    }
  };

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
        <div className='absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse' />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 100 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 100 }}
      className='fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden'
      style={{ width: '380px', maxWidth: '90vw', height: '500px' }}
    >
      {/* Header */}
      <div className='bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='relative'>
            <MessageCircle className='h-6 w-6' />
            <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white' />
          </div>
          <div>
            <h3 className='font-semibold text-sm'>Customer Support</h3>
            <p className='text-xs text-purple-100'>We're here to help!</p>
          </div>
        </div>

        <Button
          variant='ghost'
          size='sm'
          onClick={() => setIsOpen(false)}
          className='text-white hover:bg-white/20 p-1 h-8 w-8'
        >
          <X className='h-4 w-4' />
        </Button>
      </div>

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
          <div className='flex flex-col h-full'>
            {/* Chat area */}
            <div className='flex-1 p-4 flex items-center justify-center'>
              <div className='text-center'>
                <MessageCircle className='h-12 w-12 mx-auto mb-3 text-gray-300' />
                <p className='text-sm text-gray-600 mb-4'>
                  Send us a message and we'll get back to you soon!
                </p>
                {!user && (
                  <p className='text-xs text-red-500 mb-4'>
                    Please log in to send messages
                  </p>
                )}
              </div>
            </div>

            {/* Message input */}
            <div className='border-t border-gray-200 p-4 space-y-3'>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  user
                    ? 'Type your message...'
                    : 'Please log in to send messages'
                }
                className='text-sm resize-none'
                rows={3}
                disabled={isLoading || !user}
              />

              <div className='flex justify-between items-center'>
                <span className='text-xs text-gray-400'>
                  {message.length}/500
                </span>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading || !user}
                  size='sm'
                  className='bg-purple-600 hover:bg-purple-700'
                >
                  {isLoading ? (
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  ) : (
                    <>
                      <Send className='h-4 w-4 mr-2' />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
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
                Speak directly with our support team
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
                <span>Support agents available now</span>
              </div>
            </div>

            <Button
              onClick={handleCall}
              className='w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3'
            >
              <Phone className='h-5 w-5 mr-2' />
              Call Now: +1-717-699-8295
            </Button>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className='p-4 space-y-4'>
            <h3 className='font-semibold text-gray-800 mb-4'>
              Frequently Asked Questions
            </h3>

            <div className='space-y-3 max-h-64 overflow-y-auto'>
              {[
                {
                  question: 'How long does it take to find a maid?',
                  answer:
                    'On average, it takes 5-7 days to match you with suitable candidates.',
                },
                {
                  question: "What if I'm not satisfied?",
                  answer:
                    'We offer a 30-day replacement guarantee at no extra cost.',
                },
                {
                  question: 'How do I upgrade my subscription?',
                  answer:
                    'Go to your dashboard > Subscriptions and choose your preferred plan.',
                },
                {
                  question: 'Is my payment information secure?',
                  answer: 'Yes, we use Stripe for secure payment processing.',
                },
              ].map((item, index) => (
                <div
                  key={index}
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
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SimpleSupportWidget;
