/**
 * WhatsApp Webhook Handler for Ethiopian Maids
 * Handles incoming WhatsApp messages via Twilio
 * Processes with Claude AI and responds intelligently
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.28.0';

// Import interactive booking helpers
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
} from './interview-helpers.ts';

import {
  getConversationState,
  setConversationState,
  updateConversationContext,
  clearConversationState,
  isInBookingFlow,
  cleanupExpiredStates,
} from './conversation-state.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

/**
 * Download audio file from Twilio's MediaUrl with authentication
 */
async function downloadAudio(mediaUrl: string): Promise<Blob> {
  console.log('📥 Downloading audio from Twilio:', mediaUrl);

  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio credentials for audio download');
  }

  const credentials = btoa(`${accountSid}:${authToken}`);

  const response = await fetch(mediaUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
  }

  console.log('✅ Audio downloaded successfully');
  return await response.blob();
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeAudio(mediaUrl: string): Promise<string> {
  console.log('🎤 Transcribing audio with OpenAI Whisper...');

  const apiKey = Deno.env.get('OPENAI_API_KEY');

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY for voice transcription');
  }

  try {
    // Download the audio file
    const audioBlob = await downloadAudio(mediaUrl);
    console.log('Audio blob size:', audioBlob.size, 'bytes');

    // Prepare form data for Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.ogg');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const transcribedText = result.text || '';

    console.log('✅ Transcription successful:', transcribedText.substring(0, 100));
    return transcribedText;

  } catch (error) {
    console.error('❌ Transcription failed:', error);
    throw error;
  }
}

interface TwilioMessage {
  From: string;
  Body: string;
  MessageSid: string;
  AccountSid: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
}

interface MaidAvailability {
  id: string;
  full_name: string;
  age: number;
  experience_years: number;
  skills: string[];
  availability_status: string;
  location: string;
}

interface BookingData {
  phone_number: string;
  sponsor_name?: string;
  maid_id?: string;
  maid_name?: string;
  booking_type: 'interview' | 'hire' | 'replacement' | 'inquiry';
  booking_date?: string;
  notes?: string;
}

// Wrap everything in try-catch for maximum error capture
const handler = async (req: Request): Promise<Response> => {
  try {
    console.log('=== Function execution started ===');
    console.log('Timestamp:', new Date().toISOString());

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('CORS preflight request');
      return new Response('ok', { headers: corsHeaders });
    }

    console.log('=== WhatsApp webhook received ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>System configuration error. Please contact support.</Message>
</Response>`;
      return new Response(errorResponse, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created');

    // Parse Twilio form data
    const contentType = req.headers.get('content-type') || '';
    let twilioData: TwilioMessage;
    let phoneNumber = '';
    let userMessage = '';

    try {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData();
        twilioData = {
          From: formData.get('From') as string,
          Body: formData.get('Body') as string,
          MessageSid: formData.get('MessageSid') as string,
          AccountSid: formData.get('AccountSid') as string,
          NumMedia: formData.get('NumMedia') as string,
          MediaUrl0: formData.get('MediaUrl0') as string,
          MediaContentType0: formData.get('MediaContentType0') as string,
        };
      } else {
        const body = await req.json();
        twilioData = body;
      }

      console.log('Parsed Twilio data successfully');

      // Extract phone number and message
      phoneNumber = twilioData.From?.replace('whatsapp:', '') || '';
      userMessage = twilioData.Body || '';

      // VOICE MESSAGE DETECTION: Check if this is a voice message
      const numMedia = parseInt(twilioData.NumMedia || '0');
      const mediaUrl = twilioData.MediaUrl0;
      const mediaType = twilioData.MediaContentType0;

      console.log('Media check:', {
        numMedia,
        mediaType,
        hasMediaUrl: !!mediaUrl
      });

      if (numMedia > 0 && mediaUrl && mediaType?.startsWith('audio/')) {
        console.log('🎤 Voice message detected! Transcribing...');

        try {
          // Transcribe the audio
          const transcribedText = await transcribeAudio(mediaUrl);

          // Replace empty body with transcribed text
          userMessage = transcribedText;

          console.log('✅ Voice message transcribed:', userMessage.substring(0, 100));

          // Store the transcription in the database
          await supabaseClient.from('whatsapp_messages').insert({
            phone_number: phoneNumber,
            message_content: `[Voice Message] ${transcribedText}`,
            sender: 'user',
            message_type: 'voice',
            metadata: {
              media_url: mediaUrl,
              media_type: mediaType,
              transcription: transcribedText
            },
            processed: false
          });

        } catch (transcriptionError) {
          console.error('❌ Voice transcription failed:', transcriptionError);

          // Send error message to user
          const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, I couldn't process your voice message. Please try sending a text message instead, or try again later.</Message>
</Response>`;
          return new Response(errorResponse, {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
          });
        }
      }

      console.log('Phone:', phoneNumber);
      console.log('Message:', userMessage);
      console.log('Message length:', userMessage.length);

      // Safely log message characters
      try {
        const charCodes = Array.from(userMessage).map(c => c.charCodeAt(0)).join(',');
        console.log('Message chars:', charCodes);
      } catch (charError) {
        console.log('Could not log message chars:', charError.message);
      }
    } catch (parseError) {
      console.error('Error parsing request:', parseError);
      const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Error processing your message. Please try again.</Message>
</Response>`;
      return new Response(errorResponse, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    if (!phoneNumber || !userMessage) {
      console.error('Missing phone number or message');
      const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, I couldn't process your message. Please try again.</Message>
</Response>`;
      return new Response(errorResponse, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // Quick test: If message contains "ping", respond immediately without AI
    if (userMessage.toLowerCase().includes('ping')) {
      console.log('Ping test - responding immediately');
      const pingResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Pong! Webhook is working. Database has 5 test maids ready.</Message>
</Response>`;
      return new Response(pingResponse, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // Direct database query test: If message contains "test", query database directly
    if (userMessage.toLowerCase().includes('test')) {
      console.log('Test mode - querying database directly');
      try {
        const { data: maids, error } = await supabaseClient
          .from('maid_profiles')
          .select('full_name, experience_years, current_location')
          .eq('availability_status', 'available')
          .limit(3);

        let testMessage = 'Test successful! Found maids:\n';
        if (maids && maids.length > 0) {
          maids.forEach((m: any) => {
            testMessage += `\n• ${m.full_name} (${m.experience_years} yrs) - ${m.current_location}`;
          });
        } else {
          testMessage = 'Test mode: Database connected but no maids found.';
        }

        const testResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${testMessage}</Message>
</Response>`;
        return new Response(testResponse, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        });
      } catch (err) {
        console.error('Test query error:', err);
        const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Test failed: ${err.message}</Message>
</Response>`;
        return new Response(errorResponse, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        });
      }
    }

    // EMERGENCY BYPASS: Check for interview requests SUPER EARLY
    const lowerMsg = userMessage.toLowerCase();
    console.log('🔍 EMERGENCY BYPASS CHECK:');
    console.log('  userMessage:', userMessage);
    console.log('  lowerMsg:', lowerMsg);
    console.log('  includes interview:', lowerMsg.includes('interview'));
    console.log('  includes video:', lowerMsg.includes('video'));
    console.log('  includes schedule:', lowerMsg.includes('schedule'));
    console.log('  includes book:', lowerMsg.includes('book'));
    console.log('  includes arrange:', lowerMsg.includes('arrange'));

    const bypassCondition = (lowerMsg.includes('interview') || lowerMsg.includes('video')) &&
        (lowerMsg.includes('schedule') || lowerMsg.includes('book') || lowerMsg.includes('arrange'));
    console.log('  BYPASS CONDITION:', bypassCondition);

    if (bypassCondition) {
      console.log('🚨 EMERGENCY BYPASS TRIGGERED! Interview request detected super early!');
      console.log('Message:', userMessage);

      // Extract maid name
      const nameMatch = userMessage.match(/(?:with|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
      const maidName = nameMatch ? nameMatch[1].trim() : null;

      console.log('Extracted maid name:', maidName);

      if (maidName) {
        // Search for maid
        const { data: maids } = await supabaseClient
          .from('maid_profiles')
          .select('id, full_name')
          .ilike('full_name', `%${maidName}%`)
          .eq('availability_status', 'available')
          .limit(1);

        if (maids && maids.length > 0) {
          console.log('Found maid:', maids[0].full_name);

          // Generate date options
          const today = new Date();
          const dateOptions = [];
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

          let daysAdded = 0;
          let currentDay = 1;

          while (daysAdded < 5) {
            const date = new Date(today);
            date.setDate(today.getDate() + currentDay);

            // Skip Fridays
            if (date.getDay() !== 5) {
              dateOptions.push({
                display: `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`,
                value: date.toISOString().split('T')[0]
              });
              daysAdded++;
            }
            currentDay++;
          }

          // Format message
          let message = `Great! Let's schedule a video interview with ${maids[0].full_name}.\n\n`;
          message += '📅 *Please select your preferred date:*\n\n';
          dateOptions.forEach((opt, i) => {
            message += `${i + 1}. ${opt.display}\n`;
          });
          message += '\nReply with the number (1-5)';

          // Save state using conversation-state module
          try {
            await setConversationState(phoneNumber, 'awaiting_date', {
              maid_id: maids[0].id,
              maid_name: maids[0].full_name,
              date_options: dateOptions
            });
            console.log('✅ Emergency bypass: Conversation state saved to database!');
          } catch (stateError) {
            console.error('❌ Emergency bypass: Failed to save state:', stateError);
            // Continue anyway - show date options even if state save failed
          }

          const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`;
          return new Response(response, {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
          });
        }
      }

      console.log('Emergency bypass did not find maid, continuing to normal flow...');
    }

    // Store incoming message
    console.log('Storing incoming message...');
    const { error: insertError } = await supabaseClient
      .from('whatsapp_messages')
      .insert({
        phone_number: phoneNumber,
        message_content: userMessage,
        sender: 'user',
        message_type: 'text',
        processed: false,
      });

    if (insertError) {
      console.error('Error storing message:', insertError);
    } else {
      console.log('Message stored successfully');
    }

    // Fetch platform settings
    const { data: settings } = await supabaseClient
      .from('platform_settings')
      .select('*')
      .single();

    // Fetch conversation history (last 20 messages)
    const { data: conversationHistory } = await supabaseClient
      .from('whatsapp_messages')
      .select('sender, message_content, received_at')
      .eq('phone_number', phoneNumber)
      .order('received_at', { ascending: false })
      .limit(20);

    // ========================================
    // INTERACTIVE BOOKING FLOW HANDLING
    // ========================================

    // Clean up expired conversation states
    await cleanupExpiredStates();

    // Check if this is a maid confirmation (YES/NO response)
    const confirmationResponse = isConfirmationResponse(userMessage);
    if (confirmationResponse) {
      console.log('Detected confirmation response:', confirmationResponse);
      const result = await handleMaidConfirmation(supabaseClient, phoneNumber, confirmationResponse === 'yes');

      if (result) {
        const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${result.message}</Message>
</Response>`;
        return new Response(response, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        });
      }
    }

    // Check if user is in middle of booking flow
    try {
      console.log('🔍 Checking if user is in booking flow...');
      const conversationState = await getConversationState(phoneNumber);

      if (conversationState) {
        console.log('✅ User HAS conversation state:', conversationState.current_step);

        if (await isInBookingFlow(phoneNumber)) {
          console.log('✅ User IS in booking flow. Processing step:', conversationState.current_step);

          const responseMessage = await handleBookingFlowStep(supabaseClient, phoneNumber, userMessage, conversationState);

          console.log('✅ Booking flow step completed. Response length:', responseMessage.length);

          const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`;
          return new Response(response, {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
          });
        } else {
          console.log('ℹ️ User has state but not in booking flow');
        }
      } else {
        console.log('ℹ️ No conversation state found for user');
      }
    } catch (flowError) {
      console.error('❌ Error in booking flow check:', flowError);
      console.error('Stack:', flowError.stack);
      // Continue to normal flow if booking flow fails
    }

    // Check if this is a new interview request
    console.log('📋 Checking for new interview request...');
    const isInterview = isInterviewRequest(userMessage);
    console.log('📋 Interview request check result:', isInterview);

    if (isInterview) {
      console.log('✅ New interview request detected! Starting interactive flow...');

      const maidName = extractMaidName(userMessage);
      console.log('👤 Extracted maid name:', maidName);
      if (!maidName) {
        const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Please specify which maid you'd like to interview. For example: "Schedule video interview with Fatima"</Message>
</Response>`;
        return new Response(response, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        });
      }

      // Search for the maid
      const { data: maids, error } = await supabaseClient
        .from('maid_profiles')
        .select('id, full_name')
        .ilike('full_name', `%${maidName}%`)
        .eq('availability_status', 'available')
        .limit(5);

      if (error || !maids || maids.length === 0) {
        const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>I couldn't find a maid named "${maidName}". Would you like to see all available maids?</Message>
</Response>`;
        return new Response(response, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        });
      }

      if (maids.length > 1) {
        // Multiple maids found - let user choose
        let responseMessage = `I found ${maids.length} maids matching "${maidName}":\n\n`;
        maids.forEach((maid, i) => {
          responseMessage += `${i + 1}. ${maid.full_name}\n`;
        });
        responseMessage += '\nReply with the number to select a maid.';

        // Save state for maid selection
        await setConversationState(phoneNumber, 'awaiting_date', {
          maid_options: maids,
          awaiting_maid_selection: true
        });

        const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`;
        return new Response(response, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        });
      }

      // Single maid found - start booking flow
      const maid = maids[0];
      const responseMessage = await startBookingFlow(supabaseClient, phoneNumber, maid.id, maid.full_name);

      const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`;
      return new Response(response, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // ========================================
    // FALLBACK TO CLAUDE AI FOR OTHER MESSAGES
    // ========================================

    // Initialize Anthropic client
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      console.error('ANTHROPIC_API_KEY not found in environment');
      const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>System configuration error. Please contact support.</Message>
</Response>`;
      return new Response(errorResponse, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    console.log('Anthropic API key found');
    const anthropic = new Anthropic({
      apiKey: anthropicKey,
    });

    // Build conversation context
    const messages = conversationHistory
      ?.reverse()
      .map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message_content,
      })) || [];

    // Add current message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Define AI tools for function calling
    const tools = [
      {
        name: 'check_maid_availability',
        description: 'Check available maids matching specific criteria. Returns list of available maids with their details. Can also search by name to find specific maids.',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Search for maid by name (partial match supported, e.g., "Fatima", "Sarah")',
            },
            skills: {
              type: 'array',
              items: { type: 'string' },
              description: 'Required skills (e.g., cooking, cleaning, childcare)',
            },
            min_experience: {
              type: 'number',
              description: 'Minimum years of experience',
            },
            location_preference: {
              type: 'string',
              description: 'Preferred GCC country (UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman)',
            },
          },
          required: [],
        },
      },
      {
        name: 'view_bookings',
        description: 'View existing bookings for a phone number',
        input_schema: {
          type: 'object',
          properties: {
            phone_number: {
              type: 'string',
              description: 'Phone number to check bookings for',
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'cancelled', 'completed', 'all'],
              description: 'Filter by booking status',
            },
          },
          required: ['phone_number'],
        },
      },
      {
        name: 'book_maid',
        description: 'Create a new booking for maid interview or hire',
        input_schema: {
          type: 'object',
          properties: {
            phone_number: {
              type: 'string',
              description: 'Sponsor phone number',
            },
            sponsor_name: {
              type: 'string',
              description: 'Sponsor full name',
            },
            maid_id: {
              type: 'string',
              description: 'ID of the maid to book (if known)',
            },
            booking_type: {
              type: 'string',
              enum: ['interview', 'hire', 'replacement', 'inquiry'],
              description: 'Type of booking',
            },
            booking_date: {
              type: 'string',
              description: 'Preferred date and time (ISO format)',
            },
            notes: {
              type: 'string',
              description: 'Additional notes or requirements',
            },
          },
          required: ['phone_number', 'booking_type'],
        },
      },
      {
        name: 'cancel_booking',
        description: 'Cancel an existing booking',
        input_schema: {
          type: 'object',
          properties: {
            booking_id: {
              type: 'string',
              description: 'ID of the booking to cancel',
            },
            reason: {
              type: 'string',
              description: 'Cancellation reason',
            },
          },
          required: ['booking_id'],
        },
      },
      {
        name: 'reschedule_booking',
        description: 'Reschedule an existing booking to a new date/time',
        input_schema: {
          type: 'object',
          properties: {
            booking_id: {
              type: 'string',
              description: 'ID of the booking to reschedule',
            },
            new_date: {
              type: 'string',
              description: 'New date and time (ISO format)',
            },
          },
          required: ['booking_id', 'new_date'],
        },
      },
    ];

    // System prompt for Lucy
    const systemPrompt = `You are Lucy, a friendly and professional AI receptionist for Ethiopian Maids, a premier platform connecting families in the GCC with qualified Ethiopian domestic workers.

Platform Information:
- Name: ${settings?.platform_name || 'Ethiopian Maids'}
- Support Email: ${settings?.support_email || 'support@ethiopianmaids.com'}
- Support Phone: ${settings?.support_phone || '+971501234567'}
- Working Hours: ${settings?.working_hours || '9:00 AM - 6:00 PM EAT, Monday - Saturday'}
- Services: ${settings?.available_services?.join(', ') || 'Maid Placement, Training, Document Processing'}

Your Responsibilities:
1. Greet users warmly and help them find the perfect domestic worker
2. Answer questions about our services, pricing, and process
3. Check maid availability based on user requirements (skills, experience, location)
4. Schedule interviews and appointments (both in-person and video interviews)
5. Manage bookings (create, view, reschedule, cancel)
6. Schedule and manage video interviews (WhatsApp Video, Zoom, Google Meet, Phone)
7. Provide information about visa processing and training programs
8. Handle inquiries about maid profiles and qualifications

Communication Style:
- Be warm, professional, and helpful
- Use clear, simple language (users may speak English as a second language)
- Be patient and understanding
- Provide specific, actionable information
- If you don't know something, be honest and offer to connect them with a human agent

Important Guidelines:
- Respect cultural sensitivities (GCC region)
- Maintain user privacy
- For complex issues, recommend contacting support
- Current time zone: East Africa Time (EAT)
- When user requests to schedule/book something, DO IT immediately - don't ask for confirmation
- Be proactive and complete tasks in one go whenever possible

Use the provided tools to:
- check_maid_availability: Search for available maids by skills, experience, location, or name
- view_bookings: Check existing bookings
- book_maid: Create new bookings
- cancel_booking: Cancel bookings
- reschedule_booking: Change booking dates

CRITICAL - DO NOT HANDLE VIDEO INTERVIEWS:
- When user mentions "schedule", "book", "arrange" + "interview" or "video interview" - STOP IMMEDIATELY
- DO NOT respond to these requests at all
- DO NOT ask for dates, times, or phone numbers
- DO NOT offer to help with scheduling
- The system has a separate interactive flow that handles video interviews
- Your response should ONLY be: "I'll connect you with our interview booking system."
- Example: User says "schedule video interview with Fatima" → You respond: "I'll connect you with our interview booking system."
- NEVER ask for dates/times/phone numbers for interviews - the interactive system does this automatically`;

    // Call Claude API with function calling with timeout
    console.log('Calling Claude API...');
    console.log('Messages count:', messages.length);

    let response;
    try {
      // Set a timeout for Claude API call (25 seconds max)
      const claudePromise = anthropic.messages.create({
        model: settings?.ai_model || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: settings?.ai_temperature || 0.7,
        system: systemPrompt,
        messages: messages as any,
        tools: tools as any,
      });

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Claude API timeout')), 25000)
      );

      // Race between Claude API and timeout
      response = await Promise.race([claudePromise, timeoutPromise]);

      console.log('Claude API responded');
      console.log('Response content blocks:', response.content.length);
    } catch (claudeError) {
      console.error('Claude API error:', claudeError.message);

      // Return a fallback response if Claude fails
      const fallbackResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Hello! I'm Lucy from Ethiopian Maids. I'm experiencing high load right now. Please try again in a moment, or contact us directly at ${settings?.support_phone || '+971501234567'}.</Message>
</Response>`;

      return new Response(fallbackResponse, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/xml',
        },
      });
    }

    // Process tool calls
    let finalResponse = '';
    let toolResults = [];
    let hasToolUse = false;

    for (const content of response.content) {
      if (content.type === 'text') {
        finalResponse += content.text;
      } else if (content.type === 'tool_use') {
        hasToolUse = true;
        const toolName = content.name;
        const toolInput = content.input as any;
        const toolUseId = content.id;

        console.log(`Executing tool: ${toolName}`, toolInput);

        let toolResult;

        switch (toolName) {
          case 'check_maid_availability': {
            try {
              console.log('Searching maids with filters:', toolInput);

              // Query maid_profiles table with filters
              let query = supabaseClient
                .from('maid_profiles')
                .select('id, full_name, date_of_birth, experience_years, skills, availability_status, current_location, nationality, languages')
                .eq('availability_status', 'available'); // Only show available maids

              // Apply name filter (partial match)
              if (toolInput.name) {
                query = query.ilike('full_name', `%${toolInput.name}%`);
              }

              // Apply skill filters (handle both array and string)
              if (toolInput.skills && toolInput.skills.length > 0) {
                // Convert skills to array if needed
                const skillsArray = Array.isArray(toolInput.skills) ? toolInput.skills : [toolInput.skills];

                // Use overlaps operator (@>) for PostgreSQL array matching
                // This checks if maid's skills array overlaps with any of the requested skills
                query = query.overlaps('skills', skillsArray);
              }

              // Apply experience filter
              if (toolInput.min_experience && toolInput.min_experience > 0) {
                query = query.gte('experience_years', toolInput.min_experience);
              }

              // Apply location preference filter
              if (toolInput.location_preference) {
                const location = toolInput.location_preference.toLowerCase();
                query = query.ilike('current_location', `%${location}%`);
              }

              // Limit results
              query = query.limit(10);

              console.log('Executing maid query...');
              const { data: maids, error } = await query;

              if (error) {
                console.error('Database error:', error);
                toolResult = {
                  error: 'Failed to search for maids',
                  details: error.message,
                  count: 0,
                  maids: []
                };
              } else if (!maids || maids.length === 0) {
                console.log('No maids found matching criteria');
                toolResult = {
                  count: 0,
                  maids: [],
                  message: 'No maids found matching your requirements. You may want to broaden your search criteria or contact us directly for more options.',
                  suggestions: [
                    'Try removing specific skill requirements',
                    'Lower the minimum experience requirement',
                    'Consider maids from nearby countries',
                    'Contact our support team for personalized recommendations'
                  ]
                };
              } else {
                console.log(`Found ${maids.length} maids`);
                toolResult = {
                  count: maids.length,
                  maids: maids.map(m => {
                    // Calculate age from date_of_birth
                    let age = 'Not specified';
                    if (m.date_of_birth) {
                      const birthDate = new Date(m.date_of_birth);
                      const today = new Date();
                      age = `${today.getFullYear() - birthDate.getFullYear()} years`;
                    }

                    return {
                      id: m.id,
                      name: m.full_name,
                      age: age,
                      experience: m.experience_years ? `${m.experience_years} years` : 'Not specified',
                      skills: Array.isArray(m.skills) ? m.skills.join(', ') : (m.skills || 'General housework'),
                      availability: m.availability_status || 'available',
                      location: m.current_location || 'Not specified',
                      nationality: m.nationality || 'Ethiopian',
                      languages: Array.isArray(m.languages) ? m.languages.join(', ') : (m.languages || 'Amharic, English'),
                    };
                  }),
                  search_criteria: {
                    skills: toolInput.skills,
                    min_experience: toolInput.min_experience,
                    location: toolInput.location_preference
                  }
                };
              }
            } catch (err) {
              console.error('Exception in check_maid_availability:', err);
              toolResult = {
                error: 'An unexpected error occurred while searching for maids',
                details: err.message,
                count: 0,
                maids: []
              };
            }
            break;
          }

          case 'view_bookings': {
            let query = supabaseClient
              .from('maid_bookings')
              .select('*')
              .eq('phone_number', toolInput.phone_number);

            if (toolInput.status && toolInput.status !== 'all') {
              query = query.eq('status', toolInput.status);
            }

            const { data: bookings, error } = await query;

            if (error) {
              toolResult = { error: 'Failed to fetch bookings', details: error.message };
            } else {
              toolResult = { count: bookings?.length || 0, bookings };
            }
            break;
          }

          case 'book_maid': {
            const bookingData: any = {
              phone_number: toolInput.phone_number,
              booking_type: toolInput.booking_type,
              sponsor_name: toolInput.sponsor_name,
              maid_id: toolInput.maid_id,
              booking_date: toolInput.booking_date,
              notes: toolInput.notes,
              status: 'pending',
            };

            const { data: booking, error } = await supabaseClient
              .from('maid_bookings')
              .insert(bookingData)
              .select()
              .single();

            if (error) {
              toolResult = { error: 'Failed to create booking', details: error.message };
            } else {
              toolResult = { success: true, booking };
            }
            break;
          }

          case 'cancel_booking': {
            const { data, error } = await supabaseClient
              .from('maid_bookings')
              .update({
                status: 'cancelled',
                notes: toolInput.reason || 'Cancelled by user',
              })
              .eq('id', toolInput.booking_id)
              .select()
              .single();

            if (error) {
              toolResult = { error: 'Failed to cancel booking', details: error.message };
            } else {
              toolResult = { success: true, booking: data };
            }
            break;
          }

          case 'reschedule_booking': {
            const { data, error} = await supabaseClient
              .from('maid_bookings')
              .update({
                booking_date: toolInput.new_date,
                status: 'rescheduled',
              })
              .eq('id', toolInput.booking_id)
              .select()
              .single();

            if (error) {
              toolResult = { error: 'Failed to reschedule booking', details: error.message };
            } else {
              toolResult = { success: true, booking: data };
            }
            break;
          }

          default:
            toolResult = { error: 'Unknown tool' };
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: JSON.stringify(toolResult)
        });
      }
    }

    // If tools were used, format the results directly (faster than second Claude call)
    if (hasToolUse && toolResults.length > 0) {
      console.log('Formatting tool results...');

      try {
        // Format tool results directly
        for (const toolResult of toolResults) {
          const result = JSON.parse(toolResult.content);

          if (result.error) {
            finalResponse += `\n\nI encountered an issue: ${result.error}`;
          } else if (result.count === 0) {
            finalResponse += `\n\n${result.message || 'No results found matching your criteria.'}`;
            if (result.suggestions && result.suggestions.length > 0) {
              finalResponse += '\n\nSuggestions:\n' + result.suggestions.map((s: string) => `• ${s}`).join('\n');
            }
          } else if (result.maids && result.maids.length > 0) {
            finalResponse += `\n\nGreat news! I found ${result.count} available maid${result.count > 1 ? 's' : ''}:\n`;

            result.maids.forEach((maid: any, index: number) => {
              finalResponse += `\n${index + 1}. ${maid.name} (${maid.age})`;
              finalResponse += `\n   • Experience: ${maid.experience}`;
              finalResponse += `\n   • Skills: ${maid.skills}`;
              finalResponse += `\n   • Location: ${maid.location}`;
              finalResponse += `\n   • Languages: ${maid.languages}`;
              finalResponse += `\n   • Availability: ${maid.availability}`;
            });

            finalResponse += `\n\nWould you like more details about any of these candidates? Or would you like to schedule an interview?`;
          } else if (result.bookings) {
            finalResponse += `\n\nYou have ${result.count} booking${result.count !== 1 ? 's' : ''}`;
            if (result.count > 0) {
              result.bookings.forEach((booking: any, index: number) => {
                finalResponse += `\n${index + 1}. ${booking.booking_type} - Status: ${booking.status}`;
              });
            }
          } else if (result.interview_id) {
            // Video interview scheduled successfully
            finalResponse += `\n\n✅ Video Interview Scheduled!\n\n`;
            finalResponse += `📹 Interview Details:\n`;
            finalResponse += `• Maid: ${result.maid_name}\n`;
            finalResponse += `• Date: ${result.scheduled_date}\n`;
            finalResponse += `• Duration: ${result.duration} minutes\n`;
            finalResponse += `• Platform: ${result.interview_type.replace('_', ' ').toUpperCase()}\n`;
            if (result.meeting_link) {
              finalResponse += `• Link: ${result.meeting_link}\n`;
            }
            finalResponse += `\n⏰ I'll send you reminders before the interview.\n`;
            finalResponse += `\nWould you like me to send you ${result.maid_name}'s profile details to review?`;
          } else if (result.interviews) {
            // List of upcoming interviews
            if (result.count > 0) {
              finalResponse += `\n\n📅 You have ${result.count} upcoming video interview${result.count > 1 ? 's' : ''}:\n`;
              result.interviews.forEach((interview: any, index: number) => {
                const date = new Date(interview.scheduled_date).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Dubai'
                });
                finalResponse += `\n${index + 1}. ${interview.maid_name}`;
                finalResponse += `\n   📅 ${date}`;
                finalResponse += `\n   📹 ${interview.interview_type.replace('_', ' ')}`;
                finalResponse += `\n   ⏱️  ${interview.duration_minutes} minutes`;
                finalResponse += `\n   Status: ${interview.status}\n`;
              });
            } else {
              finalResponse += `\n\n${result.message || 'You have no upcoming interviews scheduled.'}`;
            }
          } else if (result.success) {
            finalResponse += `\n\n✅ Done! Your request has been processed successfully.`;
          }
        }
      } catch (error) {
        console.error('Error formatting tool results:', error);
        finalResponse += "\n\nI found some results but had trouble formatting them. Please try asking again or contact our support team.";
      }
    }

    // If still no response, generate a default one
    if (!finalResponse.trim()) {
      finalResponse = "I've processed your request. How else can I help you today?";
    }

    // Store AI response
    await supabaseClient
      .from('whatsapp_messages')
      .insert({
        phone_number: phoneNumber,
        message_content: finalResponse,
        sender: 'assistant',
        message_type: 'text',
        ai_response: JSON.stringify({ response, toolResults }),
        processed: true,
      });

    // Send response back to Twilio (TwiML format)
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${finalResponse}</Message>
</Response>`;

    return new Response(twimlResponse, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('=== WhatsApp webhook error (main try-catch) ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message || String(error));
    console.error('Error stack:', error?.stack || 'No stack trace');
    console.error('Error constructor:', error?.constructor?.name);

    // Try to stringify the error for more details
    try {
      console.error('Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (e) {
      console.error('Could not stringify error');
    }

    // Return a friendly error message to user via TwiML
    const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>I apologize, but I'm experiencing technical difficulties. Please try again in a moment or contact our support team.</Message>
</Response>`;

    return new Response(errorResponse, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  }
};

// ========================================
// INTERACTIVE BOOKING HELPER FUNCTIONS
// ========================================

function isConfirmationResponse(message: string): 'yes' | 'no' | null {
  const cleaned = message.trim().toLowerCase();
  const yesPatterns = ['yes', 'y', 'ok', 'okay', 'confirm', 'accept', 'agree'];
  const noPatterns = ['no', 'n', 'decline', 'reject', 'cancel'];

  if (yesPatterns.some(p => cleaned.includes(p))) return 'yes';
  if (noPatterns.some(p => cleaned.includes(p))) return 'no';
  return null;
}

function isInterviewRequest(message: string): boolean {
  const cleaned = message.trim().toLowerCase();
  console.log('🔍 Checking if interview request:', {
    original: message,
    cleaned: cleaned,
    length: cleaned.length
  });

  // Check for interview-related keywords
  const hasInterview = cleaned.includes('interview');
  const hasVideo = cleaned.includes('video');
  const hasSchedule = cleaned.includes('schedule');
  const hasBook = cleaned.includes('book');
  const hasCall = cleaned.includes('call');
  const hasArrange = cleaned.includes('arrange');
  const hasMeet = cleaned.includes('meet');

  console.log('🔍 Keyword detection:', {
    hasInterview,
    hasVideo,
    hasSchedule,
    hasBook,
    hasCall,
    hasArrange,
    hasMeet
  });

  // Match if message contains "interview" + any scheduling word
  // OR "video" + "interview"
  // OR "schedule/book/arrange" + "call/video"
  const result = (
    hasInterview && (hasSchedule || hasBook || hasArrange || hasVideo || hasMeet) ||
    (hasVideo && hasInterview) ||
    ((hasSchedule || hasBook || hasArrange) && (hasCall || hasVideo))
  );

  console.log('🔍 Interview request detection result:', {
    isMatch: result,
    reason: result ? 'Keywords matched interview scheduling pattern' : 'No interview scheduling pattern found'
  });

  return result;
}

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

async function startBookingFlow(supabaseClient: any, phoneNumber: string, maidId: string, maidName: string): Promise<string> {
  const dateOptions = generateDateOptions(5);

  await setConversationState(phoneNumber, 'awaiting_date', {
    maid_id: maidId,
    maid_name: maidName,
    date_options: dateOptions
  });

  return `Great! Let's schedule a video interview with ${maidName}.\n\n${formatDateOptionsMessage(dateOptions)}`;
}

async function handleBookingFlowStep(supabaseClient: any, phoneNumber: string, userMessage: string, state: any): Promise<string> {
  switch (state.current_step) {
    case 'awaiting_date': {
      if (state.context.awaiting_maid_selection && state.context.maid_options) {
        const selection = parseSelection(userMessage, state.context.maid_options.length);
        if (!selection) {
          return `Please reply with a number between 1 and ${state.context.maid_options.length}`;
        }

        const selectedMaid = state.context.maid_options[selection - 1];
        await updateConversationContext(phoneNumber, {
          maid_id: selectedMaid.id,
          maid_name: selectedMaid.full_name,
          awaiting_maid_selection: false
        });

        return await startBookingFlow(supabaseClient, phoneNumber, selectedMaid.id, selectedMaid.full_name);
      }

      const dateSelection = parseSelection(userMessage, state.context.date_options?.length || 5);
      if (!dateSelection) {
        return `Please reply with a number between 1 and ${state.context.date_options?.length || 5}`;
      }

      const selectedDate = state.context.date_options[dateSelection - 1];
      await updateConversationContext(phoneNumber, {
        selected_date: selectedDate.value,
        selected_date_display: selectedDate.display
      });
      await setConversationState(phoneNumber, 'awaiting_time', state.context);

      return `Perfect! ${selectedDate.display} it is.\n\n${formatTimeSlotMessage()}`;
    }

    case 'awaiting_time': {
      const timeSlots = generateTimeSlots();
      const timeSelection = parseSelection(userMessage, timeSlots.length);

      if (!timeSelection) {
        return `Please reply with a number between 1 and ${timeSlots.length}`;
      }

      const selectedTime = timeSlots[timeSelection - 1];
      await updateConversationContext(phoneNumber, {
        selected_time: selectedTime.value,
        selected_time_display: selectedTime.display
      });
      await setConversationState(phoneNumber, 'awaiting_platform', state.context);

      const { data: platforms } = await supabaseClient
        .from('interview_platform_templates')
        .select('*')
        .order('platform_type');

      const platformOptions = platforms || [];
      await updateConversationContext(phoneNumber, {
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
      const result = await createInterview(supabaseClient, phoneNumber, state.context, selectedPlatform);
      await clearConversationState(phoneNumber);

      return result.message;
    }

    default:
      await clearConversationState(phoneNumber);
      return 'Something went wrong. Please start again.';
  }
}

async function createInterview(supabaseClient: any, phoneNumber: string, context: any, platform: any): Promise<{ success: boolean; message: string }> {
  try {
    const scheduledDateTime = new Date(`${context.selected_date}T${context.selected_time}:00`);

    const { data: maid } = await supabaseClient
      .from('maid_profiles')
      .select('id, full_name, phone_number')
      .eq('id', context.maid_id)
      .single();

    if (!maid) {
      return { success: false, message: 'Maid not found. Please try again.' };
    }

    const interviewId = crypto.randomUUID();
    const meetingLink = generateMeetingLink(platform.platform_type, maid.phone_number, interviewId);

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

    await supabaseClient.rpc('create_interview_notification', {
      p_interview_id: interview.id,
      p_notification_type: 'admin_approval_needed',
      p_recipient_type: 'admin',
      p_recipient_phone: null,
      p_message_text: `New interview request: ${maid.full_name} on ${context.selected_date_display} at ${context.selected_time_display}`,
      p_message_data: {
        interview_id: interview.id,
        maid_name: maid.full_name,
        scheduled_date: scheduledDateTime.toISOString()
      }
    });

    const confirmationMessage = formatInterviewConfirmation(
      maid.full_name,
      context.selected_date_display,
      context.selected_time_display,
      platform.display_name,
      instructions
    );

    return { success: true, message: confirmationMessage };
  } catch (error) {
    console.error('Error in createInterview:', error);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
}

async function handleMaidConfirmation(supabaseClient: any, phoneNumber: string, confirmed: boolean): Promise<{ success: boolean; message: string } | null> {
  const { data: interview } = await supabaseClient
    .from('video_interviews')
    .select('*, maid_profiles!inner(full_name)')
    .eq('maid_phone', phoneNumber)
    .eq('status', 'confirmed_by_admin')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!interview) {
    return null;
  }

  if (confirmed) {
    const { error } = await supabaseClient.rpc('confirm_interview_by_maid', {
      p_interview_id: interview.id
    });

    if (error) {
      console.error('Error confirming interview:', error);
      return { success: false, message: 'Error confirming interview. Please contact support.' };
    }

    return {
      success: true,
      message: `✅ Thank you! Your interview has been confirmed.\n\nDate: ${new Date(interview.scheduled_date).toLocaleDateString()}\nTime: ${new Date(interview.scheduled_date).toLocaleTimeString()}\n\nYou'll receive reminders before the interview. Good luck! 🎉`
    };
  } else {
    await supabaseClient.rpc('reject_interview', {
      p_interview_id: interview.id,
      p_rejection_reason: 'Maid declined the interview request',
      p_rejected_by: 'maid'
    });

    return { success: true, message: 'Interview request has been declined. Thank you for letting us know.' };
  }
}

// Serve the handler with top-level error catching
serve(async (req: Request) => {
  try {
    return await handler(req);
  } catch (fatalError) {
    console.error('=== FATAL ERROR (serve level) ===');
    console.error('Fatal error type:', typeof fatalError);
    console.error('Fatal error:', fatalError);
    console.error('Fatal stack:', fatalError?.stack);

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Service temporarily unavailable. Please try again shortly.</Message>
</Response>`,
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
    );
  }
});
