import { createLogger } from '@/utils/logger';
const log = createLogger('AIService');
// AI Service for generating smart replies and handling appointment scheduling
import { agencyService } from './agencyService';

// Simple NLP function to detect intents in messages
const detectIntent = (message) => {
  const lowerMessage = message.toLowerCase();

  // Check for appointment/scheduling intent
  if (
    (lowerMessage.includes('schedule') ||
      lowerMessage.includes('appointment') ||
      lowerMessage.includes('interview') ||
      lowerMessage.includes('meet') ||
      lowerMessage.includes('available') ||
      (lowerMessage.includes('when') && lowerMessage.includes('time'))) &&
    (lowerMessage.includes('?') ||
      lowerMessage.includes('would like') ||
      lowerMessage.includes('could') ||
      lowerMessage.includes('can'))
  ) {
    return 'appointment';
  }

  // Check for questions about maid's skills or experience
  if (
    (lowerMessage.includes('skill') ||
      lowerMessage.includes('experience') ||
      lowerMessage.includes('qualification') ||
      lowerMessage.includes('trained') ||
      lowerMessage.includes('specialty') ||
      lowerMessage.includes('good at')) &&
    (lowerMessage.includes('?') ||
      lowerMessage.includes('what') ||
      lowerMessage.includes('how'))
  ) {
    return 'maid_skills';
  }

  // Check for pricing questions
  if (
    (lowerMessage.includes('price') ||
      lowerMessage.includes('cost') ||
      lowerMessage.includes('fee') ||
      lowerMessage.includes('salary') ||
      lowerMessage.includes('payment') ||
      lowerMessage.includes('charge')) &&
    (lowerMessage.includes('?') ||
      lowerMessage.includes('what') ||
      lowerMessage.includes('how much'))
  ) {
    return 'pricing';
  }

  // Check for availability questions
  if (
    (lowerMessage.includes('available') ||
      (lowerMessage.includes('when') && lowerMessage.includes('start')) ||
      lowerMessage.includes('ready to') ||
      (lowerMessage.includes('can') && lowerMessage.includes('start'))) &&
    (lowerMessage.includes('?') ||
      lowerMessage.includes('would') ||
      lowerMessage.includes('could'))
  ) {
    return 'availability';
  }

  // Default to general inquiry
  return 'general';
};

// Function to extract dates from messages
const extractDates = (message) => {
  // Simple regex to match common date formats
  const dateRegex =
    /\b(?:(?:mon|tues?|wed(?:nes)?|thurs?|fri|sat(?:ur)?|sun)(?:day)?|next week|tomorrow|today|next month|this (?:week|month))|(?:\d{1,2}(?:st|nd|rd|th)? (?:of )?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/gi;

  const dates = message.match(dateRegex) || [];
  return dates;
};

// Function to extract times from messages
const extractTimes = (message) => {
  // Simple regex to match common time formats
  const timeRegex =
    /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|noon|midnight|morning|afternoon|evening)\b/gi;

  const times = message.match(timeRegex) || [];
  return times;
};

// Generate available time slots for appointments
const generateAvailableTimeSlots = (daysAhead = 7) => {
  const timeSlots = [];
  const today = new Date();

  for (let i = 1; i <= daysAhead; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);

    // Skip weekends for simplicity
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dateString = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    // Morning slots
    timeSlots.push(`${dateString} at 10:00 AM`);
    timeSlots.push(`${dateString} at 11:30 AM`);

    // Afternoon slots
    timeSlots.push(`${dateString} at 2:00 PM`);
    timeSlots.push(`${dateString} at 3:30 PM`);

    // Evening slot
    timeSlots.push(`${dateString} at 5:00 PM`);
  }

  return timeSlots;
};

class AIService {
  // Generate smart reply based on the conversation context
  async generateSmartReply(inquiry, latestMessage) {
    if (!inquiry || !latestMessage) {
      return null;
    }

    try {
      // Fetch maid details if needed
      let maidDetails = null;
      if (inquiry.maidId) {
        const { data } = await agencyService.getAgencyMaidById(inquiry.maidId);
        if (data) {
          maidDetails = data;
        }
      }

      const intent = detectIntent(latestMessage.text);

      // Generate appropriate responses based on intent
      switch (intent) {
        case 'appointment':
          return this.generateAppointmentResponse(
            latestMessage.text,
            inquiry,
            maidDetails
          );

        case 'maid_skills':
          return this.generateSkillsResponse(inquiry, maidDetails);

        case 'pricing':
          return this.generatePricingResponse(inquiry);

        case 'availability':
          return this.generateAvailabilityResponse(inquiry, maidDetails);

        default:
          return this.generateGeneralResponse(inquiry);
      }
    } catch (error) {
      log.error('Error generating smart reply:', error);
      return {
        text: "I apologize, but I couldn't generate a smart reply at the moment. Please try manually responding to the inquiry.",
        suggestions: null,
      };
    }
  }

  // Generate response for appointment requests
  generateAppointmentResponse(message, inquiry, maidDetails) {
    // Try to extract mentioned dates and times
    const mentionedDates = extractDates(message);
    const mentionedTimes = extractTimes(message);

    // If specific dates/times were mentioned, offer those
    if (mentionedDates.length > 0 && mentionedTimes.length > 0) {
      return {
        text: `Thank you for your interest in scheduling a meeting. I see you mentioned ${mentionedDates.join(', ')} at ${mentionedTimes.join(', ')}. We can certainly arrange that time for you to meet with ${maidDetails?.name || 'our maid'}. Would you like me to confirm this appointment?`,
        suggestions: [
          `Yes, please confirm for ${mentionedDates[0]} at ${mentionedTimes[0]}.`,
          `I need to reschedule for a different time.`,
          `What documents should I bring to the interview?`,
        ],
      };
    }

    // If only dates were mentioned
    if (mentionedDates.length > 0) {
      return {
        text: `Thank you for your interest in scheduling a meeting on ${mentionedDates.join(', ')}. We have several time slots available on that day. Would any of these times work for you: 10:00 AM, 11:30 AM, 2:00 PM, 3:30 PM, or 5:00 PM?`,
        suggestions: [
          `10:00 AM works for me.`,
          `3:30 PM would be better.`,
          `None of these times work for me.`,
        ],
      };
    }

    // If only times were mentioned
    if (mentionedTimes.length > 0) {
      return {
        text: `Thank you for your interest in scheduling a meeting at ${mentionedTimes.join(', ')}. We're available at that time on several upcoming days. Would you prefer tomorrow, the day after, or sometime next week?`,
        suggestions: [
          `Tomorrow would work best.`,
          `Sometime next week please.`,
          `I'd like to see all available slots.`,
        ],
      };
    }

    // If no specific details were mentioned, offer general availability
    const availableSlots = generateAvailableTimeSlots(5);
    const suggestedSlots = availableSlots.slice(0, 3);

    return {
      text: `Thank you for your interest in scheduling a meeting with ${maidDetails?.name || 'our maid'}. We have several available time slots in the coming days. Would any of these work for you?`,
      timeSlots: availableSlots,
      suggestions: [
        `${suggestedSlots[0]} works for me.`,
        `${suggestedSlots[1]} would be better.`,
        `None of these times work for me.`,
      ],
    };
  }

  // Generate response about maid's skills
  generateSkillsResponse(inquiry, maidDetails) {
    if (!maidDetails) {
      return {
        text: `Thank you for your interest in our maid's skills. While we don't have detailed information at hand, we can assure you that all our maids are thoroughly vetted and trained in household tasks including cleaning, cooking, and childcare. Would you like to schedule an interview to discuss specific requirements?`,
        suggestions: [
          `Yes, I'd like to schedule an interview.`,
          `Can you tell me more about your vetting process?`,
          `What training do your maids receive?`,
        ],
      };
    }

    const skillsList =
      maidDetails.skills?.join(', ') || 'various household tasks';

    return {
      text: `${maidDetails.name} has ${maidDetails.experience} of experience and is skilled in ${skillsList}. ${maidDetails.name} is particularly proficient in ${maidDetails.skills?.[0] || 'household management'} and has received positive feedback from previous employers. Would you like more specific information or would you prefer to schedule an interview?`,
      suggestions: [
        `I'd like to schedule an interview.`,
        `Can you tell me more about her cooking abilities?`,
        `What languages does she speak?`,
      ],
    };
  }

  // Generate response about pricing
  generatePricingResponse(_inquiry) {
    return {
      text: `Thank you for your inquiry about our pricing. Our maid services typically range from 1,500-2,500 AED per month, depending on experience, skills, and specific requirements. This includes standard benefits such as accommodation, food, and transportation. Would you like a detailed breakdown of costs or information about our payment terms?`,
      suggestions: [
        `Please provide a detailed breakdown.`,
        `What are your payment terms?`,
        `Are there any additional fees I should know about?`,
      ],
    };
  }

  // Generate response about maid's availability
  generateAvailabilityResponse(inquiry, maidDetails) {
    if (!maidDetails) {
      return {
        text: `Thank you for asking about availability. Our maids are typically available to start within 2-4 weeks of completing the hiring process, which includes interviews, paperwork, and any necessary training. Would you like to proceed with scheduling an interview to discuss your specific needs?`,
        suggestions: [
          `Yes, I'd like to schedule an interview.`,
          `What does the hiring process involve?`,
          `Is there any way to expedite the process?`,
        ],
      };
    }

    const availabilityMessage =
      maidDetails.status === 'active'
        ? `${maidDetails.name} is currently available and could start within 2-3 weeks after completing the necessary paperwork.`
        : maidDetails.status === 'pending'
          ? `${maidDetails.name} is currently finalizing her documentation and should be available within 3-4 weeks.`
          : `${maidDetails.name} is currently placed with another family but we have similar maids available immediately.`;

    return {
      text: `${availabilityMessage} Would you like to proceed with scheduling an interview or would you prefer to see other available candidates?`,
      suggestions: [
        `I'd like to schedule an interview.`,
        `Please show me other available candidates.`,
        `What documentation is needed to proceed?`,
      ],
    };
  }

  // Generate general response
  generateGeneralResponse(inquiry) {
    return {
      text: `Thank you for your message. We appreciate your interest in our services. How else can I assist you with your inquiry about ${inquiry.maidName}?`,
      suggestions: [
        `What are ${inquiry.maidName}'s skills and experience?`,
        `When would ${inquiry.maidName} be available to start?`,
        `I'd like to schedule an interview.`,
      ],
    };
  }

  // Confirm an appointment
  async confirmAppointment(inquiryId, appointmentDetails) {
    try {
      const message = `Your appointment has been confirmed for ${appointmentDetails.date} at ${appointmentDetails.time}. Please arrive 10 minutes early and bring your ID. We look forward to meeting you!`;

      // In a real implementation, this would also update a calendar or appointments database
      const { data, error } = await agencyService.sendMessageToSponsor(
        inquiryId,
        message
      );

      if (error) {
        throw new Error(error.message || 'Error confirming appointment');
      }

      return { data, error: null };
    } catch (error) {
      log.error('Error confirming appointment:', error);
      return { data: null, error };
    }
  }
}

export const aiService = new AIService();
