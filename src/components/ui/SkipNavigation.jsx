import React from 'react';
import { cn } from '@/lib/utils';

const SkipNavigation = ({ className, links = [] }) => {
  const defaultLinks = [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#navigation', text: 'Skip to navigation' },
  ];

  const skipLinks = links.length > 0 ? links : defaultLinks;

  return (
    <div className={cn('sr-only focus-within:not-sr-only', className)}>
      {skipLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className={cn(
            'absolute top-4 left-4 z-50',
            'bg-primary-600 text-white px-4 py-2 rounded-md',
            'font-medium text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'transform -translate-y-full focus:translate-y-0',
            'transition-transform duration-300'
          )}
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(link.href);
            if (target) {
              target.focus();
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          {link.text}
        </a>
      ))}
    </div>
  );
};

export { SkipNavigation };