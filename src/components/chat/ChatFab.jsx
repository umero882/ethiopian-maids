import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import ChatInterface from '@/components/chat/ChatInterface';

// Floating Chat/Messaging button (sticky bottom-right)
const ChatFab = () => {
  const { user } = useAuth() || {};
  const location = useLocation();
  const navigate = useNavigate();

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
  );
  const [fabHidden] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Track viewport to detect mobile keyboard (when height shrinks significantly)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const onVVChange = () => {
      const vv = window.visualViewport;
      const threshold = 120; // px
      setIsKeyboardOpen(window.innerHeight - vv.height > threshold);
    };
    window.visualViewport.addEventListener('resize', onVVChange);
    onVVChange();
    return () => {
      window.visualViewport.removeEventListener('resize', onVVChange);
    };
  }, []);

  // Track desktop vs mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener ? mql.addEventListener('change', handler) : mql.addListener(handler);
    handler(mql);
    return () => {
      mql.removeEventListener ? mql.removeEventListener('change', handler) : mql.removeListener(handler);
    };
  }, []);

  // Removed dynamic bottom bar detection to prevent position jitter

  // Hide on chat route and critical flows
  const hideOnThisRoute = (() => {
    const path = location?.pathname || '';
    const search = location?.search || '';
    if (path === '/chat') return true;
    const criticalRoute = /\/(checkout|payment|otp|verify|2fa|auth|billing)/i.test(path) || /(payment|otp|verify)/i.test(search);
    return criticalRoute;
  })();

  const shouldHideFab = fabHidden || isKeyboardOpen || hideOnThisRoute || isOpen || showLoginPrompt;

  const isRTL = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const baseBottom = isDesktop ? 32 : 24;
  const bottomSafe = `calc(env(safe-area-inset-bottom, 0px) + ${baseBottom}px)`;
  const sideBase = isDesktop ? 32 : 24;
  const sideProp = isRTL ? 'left' : 'right';
  const sideSafe = `calc(env(${isRTL ? 'safe-area-inset-left' : 'safe-area-inset-right'}, 0px) + ${sideBase}px)`;
  const style = { position: 'fixed', bottom: bottomSafe, [sideProp]: sideSafe, zIndex: 9999 };
  const { unreadCounts = {} } = useChat() || {};
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      {!shouldHideFab && (
        <div style={style}>
          <Button
            onClick={() => {
              if (user) setIsOpen(true);
              else setShowLoginPrompt(true);
            }}
            size='icon'
            className='h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-300/50 focus:ring-2 focus:ring-purple-500 relative transition-transform duration-150 hover:scale-105'
            aria-label='Open Chat & Messaging'
            aria-haspopup='dialog'
            title='Chat & Messaging'
            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
          >
            <MessageSquare className='h-6 w-6 sm:h-7 sm:w-7 text-white' />
            {totalUnread > 0 && (
              <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center'>
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </Button>
        </div>
      )}
      {isOpen && (
        <ChatInterface isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}

      {/* Login Prompt for guests */}
      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign in to start messaging</AlertDialogTitle>
            <AlertDialogDescription>
              You need an account to chat with maids, sponsors, or agencies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLoginPrompt(false)}>
              Not now
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/register')}>
              Create account
            </AlertDialogAction>
            <AlertDialogAction onClick={() => navigate('/login')}>
              Sign in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatFab;
