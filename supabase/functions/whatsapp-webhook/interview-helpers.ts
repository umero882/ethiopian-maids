/**
 * Interview Scheduling Helper Functions
 * Handles date generation, platform selection, and link creation
 */

export interface DateOption {
  display: string;
  value: string; // ISO format
  dayOfWeek: string;
}

export interface PlatformOption {
  type: string;
  display_name: string;
  requires_download: boolean;
  download_link: string | null;
  instructions: string;
}

export interface TimeSlot {
  display: string;
  value: string; // HH:MM format
}

/**
 * Generate available date options (next 7 days, excluding Fridays)
 */
export function generateDateOptions(count: number = 5): DateOption[] {
  const options: DateOption[] = [];
  const today = new Date();
  let daysAdded = 0;
  let currentDay = 1; // Start from tomorrow

  while (daysAdded < count && currentDay <= 14) {
    const date = new Date(today);
    date.setDate(today.getDate() + currentDay);

    // Skip Fridays (day 5) - common day off in GCC
    if (date.getDay() !== 5) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const display = `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
      const value = date.toISOString().split('T')[0]; // YYYY-MM-DD

      options.push({
        display,
        value,
        dayOfWeek: dayNames[date.getDay()]
      });

      daysAdded++;
    }

    currentDay++;
  }

  return options;
}

/**
 * Generate time slot options (morning, afternoon, evening)
 */
export function generateTimeSlots(): TimeSlot[] {
  return [
    { display: '9:00 AM', value: '09:00' },
    { display: '10:00 AM', value: '10:00' },
    { display: '11:00 AM', value: '11:00' },
    { display: '2:00 PM', value: '14:00' },
    { display: '3:00 PM', value: '15:00' },
    { display: '4:00 PM', value: '16:00' },
    { display: '6:00 PM', value: '18:00' },
    { display: '7:00 PM', value: '19:00' }
  ];
}

/**
 * Format date options as WhatsApp message
 */
export function formatDateOptionsMessage(options: DateOption[]): string {
  let message = '📅 *Please select your preferred date:*\n\n';
  options.forEach((opt, i) => {
    message += `${i + 1}. ${opt.display}\n`;
  });
  message += '\nReply with the number (1-5)';
  return message;
}

/**
 * Format time slots as WhatsApp message
 */
export function formatTimeSlotMessage(): string {
  const slots = generateTimeSlots();
  let message = '⏰ *Please select your preferred time:*\n\n';

  message += '*Morning:*\n';
  slots.slice(0, 3).forEach((slot, i) => {
    message += `${i + 1}. ${slot.display}\n`;
  });

  message += '\n*Afternoon:*\n';
  slots.slice(3, 6).forEach((slot, i) => {
    message += `${i + 4}. ${slot.display}\n`;
  });

  message += '\n*Evening:*\n';
  slots.slice(6).forEach((slot, i) => {
    message += `${i + 7}. ${slot.display}\n`;
  });

  message += '\nReply with the number (1-8)';
  return message;
}

/**
 * Format platform options as WhatsApp message
 */
export function formatPlatformOptionsMessage(platforms: PlatformOption[]): string {
  let message = '📹 *Please select your preferred video call platform:*\n\n';

  platforms.forEach((platform, i) => {
    message += `${i + 1}. ${platform.display_name}`;
    if (platform.requires_download) {
      message += ' 📥';
    }
    message += '\n';
  });

  message += '\n💡 Platforms marked with 📥 require downloading an app';
  message += '\nReply with the number (1-' + platforms.length + ')';
  return message;
}

/**
 * Generate meeting link based on platform
 */
export function generateMeetingLink(
  platformType: string,
  maidPhone: string | null,
  interviewId: string
): string | null {
  switch (platformType) {
    case 'whatsapp_video':
      if (maidPhone) {
        const cleanPhone = maidPhone.replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanPhone}?text=Video%20Interview%20-%20${interviewId}`;
      }
      return null;

    case 'zoom':
      // In production, integrate with Zoom API to create meeting
      // For now, return placeholder
      return `https://zoom.us/j/interview-${interviewId.substring(0, 8)}`;

    case 'google_meet':
      // In production, integrate with Google Meet API
      // For now, return placeholder
      return `https://meet.google.com/interview-${interviewId.substring(0, 8)}`;

    case 'phone_call':
      return null; // Phone calls don't need a link

    case 'microsoft_teams':
      // Integration placeholder
      return `https://teams.microsoft.com/l/meetup-join/interview-${interviewId.substring(0, 8)}`;

    case 'skype':
      // Integration placeholder
      return `https://join.skype.com/interview-${interviewId.substring(0, 8)}`;

    default:
      return null;
  }
}

/**
 * Generate platform-specific instructions
 */
export function generatePlatformInstructions(
  platform: PlatformOption,
  meetingLink: string | null,
  maidPhone: string | null
): any {
  const instructions: any = {
    platform_type: platform.type,
    platform_name: platform.display_name,
    requires_download: platform.requires_download,
    download_link: platform.download_link,
    meeting_link: meetingLink,
    setup_steps: [],
    sponsor_message: '',
    maid_message: ''
  };

  switch (platform.type) {
    case 'whatsapp_video':
      instructions.setup_steps = [
        'No setup required - you already have WhatsApp!',
        'We will call you on WhatsApp at the scheduled time',
        'Make sure your camera and microphone are working'
      ];
      instructions.sponsor_message = `We will call you on WhatsApp video at the scheduled time. Please ensure your camera and microphone are working.`;
      instructions.maid_message = `You will receive a WhatsApp video call from the sponsor at the scheduled time.`;
      break;

    case 'zoom':
      instructions.setup_steps = [
        `Download Zoom app: ${platform.download_link}`,
        `Install the app on your phone or computer`,
        `At the scheduled time, click this link: ${meetingLink}`,
        `Allow camera and microphone access`,
        `Join the meeting`
      ];
      instructions.sponsor_message = `📥 Download Zoom: ${platform.download_link}\n\n📞 Meeting Link: ${meetingLink}\n\nClick the link at your scheduled time to join.`;
      instructions.maid_message = `Download Zoom app and join using the meeting link we'll send you.`;
      break;

    case 'google_meet':
      instructions.setup_steps = [
        `No download required - works in browser!`,
        `Or download Google Meet app for better experience`,
        `At scheduled time, click: ${meetingLink}`,
        `Allow camera and microphone access`,
        `Join the meeting`
      ];
      instructions.sponsor_message = `📞 Meeting Link: ${meetingLink}\n\nClick the link at your scheduled time. Works in any browser, no download needed!`;
      instructions.maid_message = `You'll receive a Google Meet link. Click it at the scheduled time to join.`;
      break;

    case 'phone_call':
      instructions.setup_steps = [
        `We will call you on: ${maidPhone || 'your phone number'}`,
        `Make sure you're available at the scheduled time`,
        `Find a quiet place for the call`
      ];
      instructions.sponsor_message = `We will call you at the scheduled time on your phone number.`;
      instructions.maid_message = `You will receive a phone call at the scheduled time.`;
      break;

    case 'microsoft_teams':
      instructions.setup_steps = [
        `Download Microsoft Teams: ${platform.download_link}`,
        `Install the app`,
        `At scheduled time, click: ${meetingLink}`,
        `Allow camera and microphone`,
        `Join meeting`
      ];
      instructions.sponsor_message = `📥 Download Teams: ${platform.download_link}\n\n📞 Meeting Link: ${meetingLink}\n\nClick the link at your scheduled time.`;
      instructions.maid_message = `Download Microsoft Teams and join using the meeting link.`;
      break;

    case 'skype':
      instructions.setup_steps = [
        `Download Skype: ${platform.download_link}`,
        `Install and create account if needed`,
        `At scheduled time, click: ${meetingLink}`,
        `Join the call`
      ];
      instructions.sponsor_message = `📥 Download Skype: ${platform.download_link}\n\n📞 Meeting Link: ${meetingLink}\n\nClick the link at your scheduled time.`;
      instructions.maid_message = `Download Skype and join using the meeting link.`;
      break;
  }

  return instructions;
}

/**
 * Format confirmation message with all details
 */
export function formatInterviewConfirmation(
  maidName: string,
  date: string,
  time: string,
  platform: string,
  instructions: any
): string {
  let message = `✅ *Interview Request Submitted!*\n\n`;
  message += `📋 *Details:*\n`;
  message += `• Maid: ${maidName}\n`;
  message += `• Date: ${date}\n`;
  message += `• Time: ${time}\n`;
  message += `• Platform: ${platform}\n\n`;

  if (instructions.requires_download && instructions.download_link) {
    message += `📥 *Download App:*\n${instructions.download_link}\n\n`;
  }

  if (instructions.meeting_link) {
    message += `📞 *Meeting Link:*\n${instructions.meeting_link}\n\n`;
  }

  message += `⏳ *Next Steps:*\n`;
  message += `1. Admin will confirm with the maid\n`;
  message += `2. Maid will confirm availability\n`;
  message += `3. You'll receive final confirmation\n`;
  message += `4. Reminders will be sent before the interview\n\n`;

  message += `${instructions.sponsor_message}\n\n`;

  message += `📧 Need help? Contact support.`;

  return message;
}

/**
 * Parse user selection from message
 */
export function parseSelection(message: string, maxOptions: number): number | null {
  const cleaned = message.trim().toLowerCase();

  // Try to extract number
  const match = cleaned.match(/\d+/);
  if (match) {
    const num = parseInt(match[0]);
    if (num >= 1 && num <= maxOptions) {
      return num;
    }
  }

  return null;
}
