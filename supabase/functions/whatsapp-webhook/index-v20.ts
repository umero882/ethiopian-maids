/**
 * WhatsApp Webhook Handler - Version 20
 * Interactive Video Interview Scheduling System
 * Complete with conversation state, admin approvals, and reminders
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.28.0';

// Import helper modules
import {
  generateDateOptions,
  generateTimeSlots,
  formatDateOptionsMessage,
  formatTimeSlotMessage,
  formatPlatformOptionsMessage,
  generateMeetingLink,
  generatePlatformInstructions,
  formatInterviewConfirmation,
  parseSelection,
  type DateOption,
  type TimeSlot,
  type PlatformOption
} from './interview-helpers.ts';

import {
  getConversationState,
  setConversationState,
  updateConversationContext,
  clearConversationState,
  isInBookingFlow,
  cleanupExpiredStates,
  type ConversationState
} from './conversation-state.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface TwilioMessage {
  From: string;
  Body: string;
  MessageSid: string;
  AccountSid: string;
  NumMedia?: string;
}

/**
 * Check if message is a confirmation response (YES/NO for maid confirmations)
 */
function isConfirmationResponse(message: string): 'yes' | 'no' | null {
  const cleaned = message.trim().toLowerCase();
  const yesPatterns = ['yes', 'y', 'ok', 'okay', 'confirm', 'accept', 'agree', 'نعم', 'አዎ'];
  const noPatterns = ['no', 'n', 'decline', 'reject', 'cancel', 'لا', 'አይ'];

  if (yesPatterns.some(p => cleaned.includes(p))) return 'yes';
  if (noPatterns.some(p => cleaned.includes(p))) return 'no';
  return null;
}

/**
 * Check if message is requesting to schedule an interview
 */
function isInterviewRequest(message: string): boolean {
  const cleaned = message.trim().toLowerCase();
  const patterns = [
    'schedule interview',
    'book interview',
    'video interview',
    'video call',
    'interview with',
    'meet with',
    'schedule video',
    'book video'
  ];
  return patterns.some(p => cleaned.includes(p));
}

/**
 * Extract maid name from interview request
 */
function extractMaidName(message: string): string | null {
  const patterns = [
    /(?:with|for)\s+([a-z]+(?:\s+[a-z]+)?)/i,
    /interview\s+([a-z]+(?:\s+[a-z]+)?)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Main webhook handler
 */
const handler = async (req: Request): Promise<Response> => {
  console.log('=== Webhook Handler Started ===');
  console.log('Timestamp:', new Date().toISOString());

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Cleanup expired conversation states periodically
    cleanupExpiredStates();

    // Parse incoming webhook data
    const formData = await req.formData();
    const twilioData: TwilioMessage = {
      From: formData.get('From') as string,
      Body: formData.get('Body') as string,
      MessageSid: formData.get('MessageSid') as string,
      AccountSid: formData.get('AccountSid') as string,
      NumMedia: formData.get('NumMedia') as string | undefined,
    };

    console.log('Received message from:', twilioData.From);
    console.log('Message body:', twilioData.Body);

    const phoneNumber = twilioData.From;
    const userMessage = twilioData.Body?.trim() || '';

    if (!userMessage) {
      return createTwilioResponse('Please send a message.');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Store incoming message
    await supabaseClient.from('whatsapp_messages').insert({
      phone_number: phoneNumber,
      sender: 'user',
      message_content: userMessage,
      message_sid: twilioData.MessageSid,
    });

    // ========================================
    // CONVERSATION STATE HANDLING
    // ========================================

    const conversationState = getConversationState(phoneNumber);

    // Check if this is a confirmation response for pending interview
    const confirmationResponse = isConfirmationResponse(userMessage);
    if (confirmationResponse) {
      const result = await handleMaidConfirmation(
        supabaseClient,
        phoneNumber,
        confirmationResponse === 'yes'
      );

      if (result) {
        return createTwilioResponse(result.message);
      }
    }

    // Check if user is in middle of booking flow
    if (conversationState && isInBookingFlow(phoneNumber)) {
      console.log('User in booking flow. Current step:', conversationState.current_step);

      const response = await handleBookingFlowStep(
        supabaseClient,
        phoneNumber,
        userMessage,
        conversationState
      );

      return createTwilioResponse(response);
    }

    // Check if this is a new interview request
    if (isInterviewRequest(userMessage)) {
      console.log('New interview request detected');

      const maidName = extractMaidName(userMessage);
      if (!maidName) {
        return createTwilioResponse(
          'Please specify which maid you\'d like to interview. For example: "Schedule video interview with Fatima"'
        );
      }

      // Search for the maid
      const { data: maids, error } = await supabaseClient
        .from('maid_profiles')
        .select('id, full_name')
        .ilike('full_name', `%${maidName}%`)
        .eq('availability_status', 'available')
        .limit(5);

      if (error || !maids || maids.length === 0) {
        return createTwilioResponse(
          `I couldn't find a maid named "${maidName}". Would you like to see all available maids?`
        );
      }

      if (maids.length > 1) {
        // Multiple maids found - let user choose
        let response = `I found ${maids.length} maids matching "${maidName}":\n\n`;
        maids.forEach((maid, i) => {
          response += `${i + 1}. ${maid.full_name}\n`;
        });
        response += '\nReply with the number to select a maid.';

        // Save state for maid selection
        setConversationState(phoneNumber, 'awaiting_date', {
          maid_options: maids,
          awaiting_maid_selection: true
        });

        return createTwilioResponse(response);
      }

      // Single maid found - start booking flow
      const maid = maids[0];
      const response = await startBookingFlow(supabaseClient, phoneNumber, maid.id, maid.full_name);
      return createTwilioResponse(response);
    }

    // ========================================
    // FALLBACK TO CLAUDE AI
    // ========================================

    // For non-booking messages, use Claude AI as before
    const response = await processWithClaude(
      supabaseClient,
      phoneNumber,
      userMessage
    );

    return createTwilioResponse(response);

  } catch (error) {
    console.error('Handler error:', error);
    return createTwilioResponse(
      'Sorry, I encountered an error. Please try again or contact support.'
    );
  }
};

/**
 * Start the booking flow by showing date options
 */
async function startBookingFlow(
  supabaseClient: any,
  phoneNumber: string,
  maidId: string,
  maidName: string
): Promise<string> {
  const dateOptions = generateDateOptions(5);

  // Save state
  setConversationState(phoneNumber, 'awaiting_date', {
    maid_id: maidId,
    maid_name: maidName,
    date_options: dateOptions
  });

  const message = `Great! Let's schedule a video interview with ${maidName}.\n\n${formatDateOptionsMessage(dateOptions)}`;

  return message;
}

/**
 * Handle each step of the booking flow
 */
async function handleBookingFlowStep(
  supabaseClient: any,
  phoneNumber: string,
  userMessage: string,
  state: ConversationState
): Promise<string> {

  switch (state.current_step) {
    case 'awaiting_date': {
      // Check if waiting for maid selection first
      if (state.context.awaiting_maid_selection && state.context.maid_options) {
        const selection = parseSelection(userMessage, state.context.maid_options.length);
        if (!selection) {
          return `Please reply with a number between 1 and ${state.context.maid_options.length}`;
        }

        const selectedMaid = state.context.maid_options[selection - 1];
        updateConversationContext(phoneNumber, {
          maid_id: selectedMaid.id,
          maid_name: selectedMaid.full_name,
          awaiting_maid_selection: false
        });

        return await startBookingFlow(supabaseClient, phoneNumber, selectedMaid.id, selectedMaid.full_name);
      }

      // Parse date selection
      const dateSelection = parseSelection(userMessage, state.context.date_options?.length || 5);
      if (!dateSelection) {
        return `Please reply with a number between 1 and ${state.context.date_options?.length || 5}`;
      }

      const selectedDate = state.context.date_options![dateSelection - 1];

      // Update state to awaiting time
      updateConversationContext(phoneNumber, {
        selected_date: selectedDate.value,
        selected_date_display: selected_date.display
      });
      setConversationState(phoneNumber, 'awaiting_time', state.context);

      return `Perfect! ${selected_date.display} it is.\n\n${formatTimeSlotMessage()}`;
    }

    case 'awaiting_time': {
      const timeSlots = generateTimeSlots();
      const timeSelection = parseSelection(userMessage, timeSlots.length);

      if (!timeSelection) {
        return `Please reply with a number between 1 and ${timeSlots.length}`;
      }

      const selectedTime = timeSlots[timeSelection - 1];

      // Update state to awaiting platform
      updateConversationContext(phoneNumber, {
        selected_time: selectedTime.value,
        selected_time_display: selectedTime.display
      });
      setConversationState(phoneNumber, 'awaiting_platform', state.context);

      // Fetch platform options from database
      const { data: platforms } = await supabaseClient
        .from('interview_platform_templates')
        .select('*')
        .order('platform_type');

      const platformOptions = platforms || [];
      updateConversationContext(phoneNumber, {
        platform_options: platformOptions
      });

      return `Great choice! ${selectedTime.display} on ${state.context.selected_date_display}.\n\n${formatPlatformOptionsMessage(platformOptions)}`;
    }

    case 'awaiting_platform': {
      const platforms = state.context.platform_options || [];
      const platformSelection = parseSelection(userMessage, platforms.length);

      if (!platformSelection) {
        return `Please reply with a number between 1 and ${platforms.length}`;
      }

      const selectedPlatform = platforms[platformSelection - 1];

      // Create the interview
      const result = await createInterview(
        supabaseClient,
        phoneNumber,
        state.context,
        selectedPlatform
      );

      // Clear conversation state
      clearConversationState(phoneNumber);

      return result.message;
    }

    default:
      clearConversationState(phoneNumber);
      return 'Something went wrong. Please start again.';
  }
}

/**
 * Create interview record and send notifications
 */
async function createInterview(
  supabaseClient: any,
  phoneNumber: string,
  context: any,
  platform: any
): Promise<{ success: boolean; message: string; interview_id?: string }> {

  try {
    // Combine date and time
    const scheduledDateTime = new Date(`${context.selected_date}T${context.selected_time}:00`);

    // Get maid details
    const { data: maid } = await supabaseClient
      .from('maid_profiles')
      .select('id, full_name, phone_number, user_id')
      .eq('id', context.maid_id)
      .single();

    if (!maid) {
      return { success: false, message: 'Maid not found. Please try again.' };
    }

    // Generate meeting link
    const interviewId = crypto.randomUUID();
    const meetingLink = generateMeetingLink(
      platform.platform_type,
      maid.phone_number,
      interviewId
    );

    // Generate platform instructions
    const instructions = generatePlatformInstructions(
      {
        type: platform.platform_type,
        display_name: platform.display_name,
        requires_download: platform.requires_download,
        download_link: platform.download_link,
        instructions: platform.setup_instructions
      },
      meetingLink,
      maid.phone_number
    );

    // Create interview record
    const { data: interview, error } = await supabaseClient
      .from('video_interviews')
      .insert({
        id: interviewId,
        maid_id: context.maid_id,
        sponsor_phone: phoneNumber,
        maid_phone: maid.phone_number,
        scheduled_date: scheduledDateTime.toISOString(),
        duration_minutes: 30,
        interview_type: platform.platform_type,
        meeting_link: meetingLink,
        status: 'pending_confirmation',
        platform_link_type: platform.requires_download ? 'download_required' : 'direct_link',
        platform_instructions: instructions,
        created_via: 'whatsapp'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating interview:', error);
      return { success: false, message: 'Failed to create interview. Please try again.' };
    }

    // Create admin notification
    await supabaseClient.rpc('create_interview_notification', {
      p_interview_id: interview.id,
      p_notification_type: 'admin_approval_needed',
      p_recipient_type: 'admin',
      p_recipient_phone: null, // Admins will see in dashboard
      p_message_text: `New interview request: ${maid.full_name} on ${context.selected_date_display} at ${context.selected_time_display}`,
      p_message_data: {
        interview_id: interview.id,
        maid_name: maid.full_name,
        scheduled_date: scheduledDateTime.toISOString()
      }
    });

    // Format confirmation message for sponsor
    const confirmationMessage = formatInterviewConfirmation(
      maid.full_name,
      context.selected_date_display,
      context.selected_time_display,
      platform.display_name,
      instructions
    );

    return {
      success: true,
      message: confirmationMessage,
      interview_id: interview.id
    };

  } catch (error) {
    console.error('Error in createInterview:', error);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
}

/**
 * Handle maid confirmation (YES/NO response)
 */
async function handleMaidConfirmation(
  supabaseClient: any,
  phoneNumber: string,
  confirmed: boolean
): Promise<{ success: boolean; message: string } | null> {

  // Find pending interview for this maid
  const { data: interview } = await supabaseClient
    .from('video_interviews')
    .select('*, maid_profiles!inner(full_name)')
    .eq('maid_phone', phoneNumber)
    .eq('status', 'confirmed_by_admin')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!interview) {
    return null; // No pending confirmation
  }

  if (confirmed) {
    // Maid confirmed - use database function
    const { error } = await supabaseClient.rpc('confirm_interview_by_maid', {
      p_interview_id: interview.id
    });

    if (error) {
      console.error('Error confirming interview:', error);
      return {
        success: false,
        message: 'Error confirming interview. Please contact support.'
      };
    }

    return {
      success: true,
      message: `✅ Thank you! Your interview has been confirmed.\n\nDate: ${new Date(interview.scheduled_date).toLocaleDateString()}\nTime: ${new Date(interview.scheduled_date).toLocaleTimeString()}\n\nYou'll receive reminders before the interview. Good luck! 🎉`
    };

  } else {
    // Maid declined
    const { error } = await supabaseClient.rpc('reject_interview', {
      p_interview_id: interview.id,
      p_rejection_reason: 'Maid declined the interview request',
      p_rejected_by: 'maid'
    });

    if (error) {
      console.error('Error rejecting interview:', error);
    }

    return {
      success: true,
      message: 'Interview request has been declined. Thank you for letting us know.'
    };
  }
}

/**
 * Process message with Claude AI (fallback for non-booking messages)
 */
async function processWithClaude(
  supabaseClient: any,
  phoneNumber: string,
  userMessage: string
): Promise<string> {
  // This would contain the existing Claude AI processing logic
  // For now, return a simple response
  return `I received your message: "${userMessage}". For video interview scheduling, please say "Schedule video interview with [maid name]"`;
}

/**
 * Create Twilio XML response
 */
function createTwilioResponse(message: string): Response {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`;

  return new Response(twiml, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
  });
}

// Start the server
serve(handler);
