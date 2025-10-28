import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import newsService from '@/services/newsService';

const STORAGE_KEY = 'marquee_announcement_dismissed_v1';

const defaultMessages = [
  'Limited-time offer: Save 20% on plans',
  'New features rolling out weekly',
  '24/7 customer support now available',
];

const MarqueeAnnouncement = () => {
  const [dismissed, setDismissed] = useState(false);
  const [messages, setMessages] = useState(defaultMessages);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'true') setDismissed(true);
    } catch (e) {
      console.warn('Marquee: unable to read dismissal flag');
    }
  }, []);

  useEffect(() => {
    try {
      const items = newsService.getFormattedAnnouncements?.() || [];
      if (Array.isArray(items) && items.length > 0) {
        const texts = items
          .map((a) => (typeof a?.text === 'string' ? a.text : null))
          .filter(Boolean);
        if (texts.length > 0) setMessages(texts);
      }
    } catch (e) {
      console.warn('Marquee: announcements unavailable');
    }
  }, []);

  const loop = useMemo(() => {
    const src = messages && messages.length > 0 ? messages : defaultMessages;
    // Duplicate to create seamless scroll
    return [...src, ...src];
  }, [messages]);

  if (dismissed) return null;

  return (
    <div role='region' aria-label='Announcements' className='bg-amber-50 border-b border-amber-200'>
      <div className='relative overflow-hidden'>
        {/* Close button */}
        <button
          type='button'
          onClick={() => {
            setDismissed(true);
            try { localStorage.setItem(STORAGE_KEY, 'true'); } catch (e) {
              console.warn('Marquee: unable to persist dismissal');
            }
          }}
          aria-label='Dismiss announcements'
          className='absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-amber-700 hover:text-amber-900'
        >
          ×
        </button>

        <div className='marquee-left py-2 pr-8'>
          <div className='inline-flex items-center gap-8'>
            {loop.map((msg, idx) => (
              <Link
                key={`${msg}-${idx}`}
                to='/pricing'
                className='inline-flex items-center gap-2 text-amber-800 text-sm hover:underline'
                title='View details'
              >
                <span className='inline-block h-2 w-2 rounded-full bg-amber-400'></span>
                <span className='whitespace-nowrap'>{msg}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarqueeAnnouncement;
