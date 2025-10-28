import { supabase } from '@/lib/databaseClient';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';
const log = createLogger('SupportService');

/**
 * Support Service
 * Handles customer support messaging, call initiation, and agent status
 */
class SupportService {
  constructor() {
    this.supportAgents = [
      {
        id: 'agent-1',
        name: 'Sarah Ahmed',
        status: 'online',
        languages: ['English', 'Arabic'],
        specialties: ['General Support', 'Maid Placement'],
        responseTime: '< 5 minutes',
      },
      {
        id: 'agent-2',
        name: 'Mohammed Ali',
        status: 'online',
        languages: ['English', 'Arabic', 'Amharic'],
        specialties: ['Technical Support', 'Account Issues'],
        responseTime: '< 10 minutes',
      },
      {
        id: 'agent-3',
        name: 'Fatima Hassan',
        status: 'away',
        languages: ['English', 'Arabic'],
        specialties: ['Billing', 'Subscriptions'],
        responseTime: '< 30 minutes',
      },
    ];

    const phone = import.meta.env?.VITE_TWILIO_PHONE_NUMBER || import.meta.env?.VITE_SUPPORT_PHONE;
    this.supportPhone = phone || '+17176998295';
    this.businessHours = {
      start: '08:00',
      end: '22:00',
      timezone: 'Asia/Dubai',
      days: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
    };
  }

  /**
   * Get current support agent availability
   */
  getAgentAvailability() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

    const isBusinessHours =
      this.businessHours.days.includes(currentDay) &&
      currentHour >= 8 &&
      currentHour < 22;

    const onlineAgents = this.supportAgents.filter(
      (agent) => agent.status === 'online'
    );
    const awayAgents = this.supportAgents.filter(
      (agent) => agent.status === 'away'
    );

    return {
      isBusinessHours,
      onlineAgents: onlineAgents.length,
      awayAgents: awayAgents.length,
      totalAgents: this.supportAgents.length,
      averageResponseTime: isBusinessHours ? '< 5 minutes' : '< 2 hours',
      nextAvailableTime: isBusinessHours ? 'Now' : 'Tomorrow 8:00 AM GST',
    };
  }

  /**
   * Get available support agents
   */
  getAvailableAgents() {
    return this.supportAgents.filter(
      (agent) => agent.status === 'online' || agent.status === 'away'
    );
  }

  /**
   * Send support message
   */
  async sendSupportMessage(messageData) {
    try {
      const {
        user,
        message,
        priority = 'normal',
        category = 'general',
      } = messageData;

      // In a real implementation, this would send to your support system
      // For now, we'll simulate the API call and store in Supabase

      const supportTicket = {
        id: `ticket-${Date.now()}`,
        user_id: user.id,
        user_name: user.name || user.email,
        user_type: user.userType,
        user_email: user.email,
        message: message,
        priority: priority,
        category: category,
        status: 'open',
        created_at: new Date().toISOString(),
        current_page: window.location.pathname,
        user_agent: navigator.userAgent,
        assigned_agent: null,
      };

      // Try to save to database
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .insert([supportTicket])
          .select()
          .single();

        if (error) throw error;

        log.info('Support ticket created:', data);
        return { success: true, ticket: data };
      } catch (dbError) {
        log.warn('Database save failed, using fallback:', dbError);
        // Fallback to local storage or email
        this.saveSupportTicketLocally(supportTicket);
        return { success: true, ticket: supportTicket, fallback: true };
      }
    } catch (error) {
      log.error('Failed to send support message:', error);
      toast({
        title: 'Message Failed',
        description:
          'Unable to send your message. Please try calling us directly.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Save support ticket locally as fallback
   */
  saveSupportTicketLocally(ticket) {
    try {
      const existingTickets = JSON.parse(
        localStorage.getItem('support_tickets') || '[]'
      );
      existingTickets.push(ticket);
      localStorage.setItem('support_tickets', JSON.stringify(existingTickets));

      // Also try to email the support request (would need backend endpoint)
      log.info('Support ticket saved locally for later sync:', ticket);
    } catch (error) {
      log.error('Failed to save support ticket locally:', error);
    }
  }

  /**
   * Initiate phone call to support
   */
  initiateCall(user) {
    try {
      const phoneNumber = this.supportPhone;

      // Log the call attempt
      this.logSupportInteraction({
        type: 'call_initiated',
        user_id: user.id,
        user_name: user.name || user.email,
        phone_number: phoneNumber,
        timestamp: new Date().toISOString(),
      });

      // For mobile devices, use tel: protocol
      if (
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        window.location.href = `tel:${phoneNumber}`;
      } else {
        // For desktop, show the number and copy to clipboard
        navigator.clipboard
          .writeText(phoneNumber)
          .then(() => {
            toast({
              title: 'Phone Number Copied',
              description: `Call us at ${phoneNumber} - Number copied to clipboard`,
              duration: 5000,
            });
          })
          .catch(() => {
            toast({
              title: 'Call Support',
              description: `Please call us at ${phoneNumber}`,
              duration: 5000,
            });
          });
      }

      return { success: true, phoneNumber };
    } catch (error) {
      log.error('Failed to initiate call:', error);
      toast({
        title: 'Call Failed',
        description:
          'Unable to initiate call. Please dial +1-717-699-8295 directly.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Log support interaction for analytics
   */
  async logSupportInteraction(interaction) {
    try {
      // Try to log to database
      await supabase.from('support_interactions').insert([interaction]);
    } catch (error) {
      // Fallback to local storage
      const interactions = JSON.parse(
        localStorage.getItem('support_interactions') || '[]'
      );
      interactions.push(interaction);
      localStorage.setItem(
        'support_interactions',
        JSON.stringify(interactions)
      );
    }
  }

  /**
   * Get support categories
   */
  getSupportCategories() {
    return [
      { id: 'general', label: 'General Inquiry', icon: '💬' },
      { id: 'technical', label: 'Technical Issue', icon: '🔧' },
      { id: 'billing', label: 'Billing & Payments', icon: '💳' },
      { id: 'account', label: 'Account Issues', icon: '👤' },
      { id: 'maid_placement', label: 'Maid Placement', icon: '👥' },
      { id: 'urgent', label: 'Urgent Issue', icon: '🚨' },
    ];
  }

  /**
   * Get FAQ items
   */
  getFAQItems() {
    return [
      {
        id: 'faq-1',
        question: 'How long does it take to find a maid?',
        answer:
          'On average, it takes 5-7 days to match you with suitable candidates. Premium members get priority matching.',
        category: 'general',
      },
      {
        id: 'faq-2',
        question: "What if I'm not satisfied with the maid?",
        answer:
          "We offer a 30-day replacement guarantee. Contact us and we'll find you a better match at no extra cost.",
        category: 'maid_placement',
      },
      {
        id: 'faq-3',
        question: 'How do I upgrade my subscription?',
        answer:
          'Go to your dashboard > Subscriptions and choose your preferred plan. Upgrades take effect immediately.',
        category: 'billing',
      },
      {
        id: 'faq-4',
        question: 'Is my payment information secure?',
        answer:
          'Yes, we use Stripe for secure payment processing. Your card details are never stored on our servers.',
        category: 'billing',
      },
    ];
  }

  /**
   * Search FAQ items
   */
  searchFAQ(query) {
    const faqItems = this.getFAQItems();
    const searchTerm = query.toLowerCase();

    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(searchTerm) ||
        item.answer.toLowerCase().includes(searchTerm)
    );
  }
}

export const supportService = new SupportService();
export default supportService;
