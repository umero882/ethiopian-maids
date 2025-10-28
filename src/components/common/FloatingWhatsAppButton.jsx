/**
 * Floating WhatsApp Button
 * A fixed position button that appears in the bottom-left corner
 * Links to WhatsApp support or admin dashboard based on user role
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const FloatingWhatsAppButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.user_metadata?.role === 'admin';

  // WhatsApp support number - Twilio Sandbox Number
  const WHATSAPP_NUMBER = '14155238886'; // Format: country code + number without +
  const WHATSAPP_MESSAGE = encodeURIComponent('Hello! I would like to inquire about hiring a maid.');

  const handleClick = () => {
    if (isAdmin) {
      // Navigate to admin WhatsApp dashboard
      navigate('/admin/whatsapp');
    } else {
      // Open WhatsApp chat
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`, '_blank');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className="fixed bottom-6 left-6 z-50 h-16 w-16 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 group cursor-pointer border-0 bg-transparent p-0"
            aria-label={isAdmin ? 'Open WhatsApp Dashboard' : 'Chat with us on WhatsApp'}
          >
            <img
              src="/images/whatsapp-icon.png"
              alt="WhatsApp"
              className="h-full w-full object-contain transition-transform"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-gray-900 text-white">
          <p className="font-medium">
            {isAdmin ? 'Open WhatsApp Dashboard' : 'Chat with us on WhatsApp'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FloatingWhatsAppButton;
