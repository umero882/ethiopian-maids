import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle,
  Users,
  TrendingUp,
  Shield,
  Star,
  Clock,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import newsService from '@/services/newsService';
// import { formatTimestamp } from '@/utils/newsProcessor';

const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Load news from service
  useEffect(() => {
    const loadNews = () => {
      try {
        const formattedNews = newsService.getFormattedAnnouncements();
        setAnnouncements(formattedNews);
        setLastUpdate(newsService.getLastUpdateTime());
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Failed to load news:', error);
        setConnectionStatus('error');
        // Use fallback announcements
        setAnnouncements([
          {
            id: 'fallback-1',
            icon: Star,
            text: 'Platform serving 1000+ verified domestic workers across GCC',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            isLive: false,
          },
          {
            id: 'fallback-2',
            icon: CheckCircle,
            text: '97% successful placement rate achieved this month',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            isLive: false,
          },
        ]);
      }
    };

    // Initial load
    loadNews();

    // Set up periodic refresh to check for updates
    const refreshInterval = setInterval(
      () => {
        if (!newsService.isCurrentlyUpdating()) {
          loadNews();
        }
      },
      5 * 60 * 1000
    ); // Check every 5 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsUpdating(true);
    try {
      await newsService.forceUpdate();
      const formattedNews = newsService.getFormattedAnnouncements();
      setAnnouncements(formattedNews);
      setLastUpdate(newsService.getLastUpdateTime());
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Duplicate announcements for seamless infinite scroll
  const duplicatedAnnouncements = [...announcements, ...announcements];

  if (!isVisible || announcements.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className='fixed top-20 left-0 right-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-200/60 shadow-lg overflow-hidden'
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Status bar with controls */}
      <div className='absolute top-1 right-4 z-10 flex items-center space-x-2'>
        {/* Connection status indicator */}
        <div className='flex items-center space-x-1'>
          {connectionStatus === 'connected' ? (
            <Wifi
              className='w-3 h-3 text-green-600'
              title='Live updates active'
            />
          ) : (
            <WifiOff
              className='w-3 h-3 text-orange-500'
              title='Using cached content'
            />
          )}
          <span className='text-xs text-gray-600 font-medium'>
            {connectionStatus === 'connected' ? 'LIVE' : 'CACHED'}
          </span>
        </div>

        {/* Last update time */}
        {lastUpdate && (
          <span className='text-xs text-gray-500'>
            {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}

        {/* Manual refresh button */}
        <button
          onClick={handleManualRefresh}
          disabled={isUpdating}
          className='p-1 rounded-full hover:bg-white/50 transition-colors duration-200 disabled:opacity-50'
          aria-label='Refresh news'
          title='Refresh news'
        >
          <RefreshCw
            className={`w-3 h-3 text-gray-500 hover:text-gray-700 ${isUpdating ? 'animate-spin' : ''}`}
          />
        </button>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className='p-1 rounded-full hover:bg-white/50 transition-colors duration-200'
          aria-label='Close announcement banner'
        >
          <X className='w-4 h-4 text-gray-500 hover:text-gray-700' />
        </button>
      </div>

      {/* Scrolling content container */}
      <div className='relative py-2 pt-5'>
        <motion.div
          className='flex items-center gap-6 whitespace-nowrap'
          animate={
            isPaused
              ? {}
              : {
                  x: ['0%', '-50%'],
                }
          }
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: Math.max(30, announcements.length * 5), // Dynamic speed based on content
              ease: 'linear',
            },
          }}
        >
          {duplicatedAnnouncements.map((announcement, index) => {
            const Icon = announcement.icon;

            return (
              <div
                key={`${announcement.id}-${index}`}
                className={`
                  flex items-center space-x-3 px-3 py-1.5 rounded-lg border
                  bg-white/60 border-gray-200/60 backdrop-blur-sm
                  hover:bg-white/80 hover:shadow-md transition-all duration-200 cursor-pointer
                  flex-shrink-0 relative
                `}
                title={`Source: ${announcement.source || 'Platform'} | ${announcement.timeAgo || 'Recent'}`}
              >
                {/* Live indicator for real-time content */}
                {announcement.isLive && (
                  <div className='absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
                )}

                <div
                  className={`
                  flex items-center justify-center w-7 h-7 rounded-full
                  bg-white/80 shadow-sm ${announcement.color}
                `}
                >
                  <Icon className='w-3.5 h-3.5' />
                </div>

                <div className='flex flex-col'>
                  <span
                    className={`
                    text-sm font-medium ${announcement.color}
                  `}
                  >
                    {announcement.text}
                  </span>

                  {/* Source and timestamp for live content */}
                  {announcement.isLive && announcement.source && (
                    <span className='text-xs text-gray-500 mt-0.5'>
                      {announcement.source} •{' '}
                      {announcement.timeAgo || 'Just now'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Gradient fade effects for smooth edges */}
      <div className='absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-white/80 via-white/60 to-transparent pointer-events-none z-10'></div>
      <div className='absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-white/80 via-white/60 to-transparent pointer-events-none z-10'></div>
    </motion.div>
  );
};

export default AnnouncementBanner;
