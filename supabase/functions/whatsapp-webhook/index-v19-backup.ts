/**
 * WhatsApp Webhook Handler for Ethiopian Maids
 * Handles incoming WhatsApp messages via Twilio
 * Processes with Claude AI and responds intelligently
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.28.0';

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

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      twilioData = {
        From: formData.get('From') as string,
        Body: formData.get('Body') as string,
        MessageSid: formData.get('MessageSid') as string,
        AccountSid: formData.get('AccountSid') as string,
        NumMedia: formData.get('NumMedia') as string,
      };
    } else {
      const body = await req.json();
      twilioData = body;
    }

    console.log('Parsed Twilio data:', JSON.stringify(twilioData));

    // Extract phone number and message
    const phoneNumber = twilioData.From?.replace('whatsapp:', '') || '';
    const userMessage = twilioData.Body || '';

    console.log('Phone:', phoneNumber);
    console.log('Message:', userMessage);

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
      {
        name: 'schedule_video_interview',
        description: 'Schedule a video interview between sponsor and maid. You can provide either maid_id OR maid_name - the system will find the maid automatically if you provide the name.',
        input_schema: {
          type: 'object',
          properties: {
            maid_id: {
              type: 'string',
              description: 'UUID of the maid to interview (optional if maid_name is provided)',
            },
            maid_name: {
              type: 'string',
              description: 'Name of the maid to interview (e.g., "Fatima", "Sarah") - system will search automatically',
            },
            sponsor_name: {
              type: 'string',
              description: 'Name of the sponsor',
            },
            preferred_date: {
              type: 'string',
              description: 'Preferred date and time in ISO format (e.g., 2025-10-28T15:00:00Z) or natural language',
            },
            interview_type: {
              type: 'string',
              enum: ['whatsapp_video', 'zoom', 'google_meet', 'phone_call'],
              description: 'Type of interview platform',
              default: 'whatsapp_video',
            },
            duration_minutes: {
              type: 'number',
              description: 'Duration of interview in minutes (default: 30)',
              default: 30,
            },
            notes: {
              type: 'string',
              description: 'Any special notes or requirements for the interview',
            },
          },
          required: ['preferred_date'],
        },
      },
      {
        name: 'view_upcoming_interviews',
        description: 'View upcoming video interviews for a sponsor',
        input_schema: {
          type: 'object',
          properties: {
            phone_number: {
              type: 'string',
              description: 'Phone number to check interviews for',
            },
            days_ahead: {
              type: 'number',
              description: 'Number of days to look ahead (default: 7)',
              default: 7,
            },
          },
          required: ['phone_number'],
        },
      },
      {
        name: 'cancel_video_interview',
        description: 'Cancel a scheduled video interview',
        input_schema: {
          type: 'object',
          properties: {
            interview_id: {
              type: 'string',
              description: 'ID of the video interview to cancel',
            },
            reason: {
              type: 'string',
              description: 'Cancellation reason',
            },
          },
          required: ['interview_id'],
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
- schedule_video_interview: Schedule video interviews (can use maid_id OR maid_name)
- view_upcoming_interviews: View scheduled video interviews
- cancel_video_interview: Cancel video interviews

IMPORTANT WORKFLOW:
- When user says "schedule video interview with [NAME]", immediately call schedule_video_interview with maid_name parameter
- The system will automatically find the maid by name, no need to search first
- Don't ask for confirmation - just schedule it and report success
- Only show search results if user asks "who is available" or "show me maids"`;

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

          case 'schedule_video_interview': {
            console.log('Scheduling video interview...');
            console.log('Tool input:', toolInput);

            // Get maid details - try by ID first, then fallback to name search
            let maid = null;
            let maidError = null;

            if (toolInput.maid_id) {
              // Search by ID
              const result = await supabaseClient
                .from('maid_profiles')
                .select('id, full_name, phone_number')
                .eq('id', toolInput.maid_id)
                .single();
              maid = result.data;
              maidError = result.error;
            } else if (toolInput.maid_name) {
              // Fallback: search by name if ID not provided
              console.log('No maid_id provided, searching by name:', toolInput.maid_name);
              const result = await supabaseClient
                .from('maid_profiles')
                .select('id, full_name, phone_number')
                .ilike('full_name', `%${toolInput.maid_name}%`)
                .eq('availability_status', 'available')
                .limit(1)
                .single();
              maid = result.data;
              maidError = result.error;
            } else {
              toolResult = {
                error: 'Missing maid information',
                message: 'Please provide either maid_id or maid_name to schedule an interview.'
              };
              break;
            }

            if (maidError || !maid) {
              console.error('Maid lookup failed:', maidError);
              toolResult = {
                error: 'Maid not found',
                message: `Could not find the maid ${toolInput.maid_name || 'with ID ' + toolInput.maid_id}. Please search for available maids first.`
              };
              break;
            }

            console.log('Found maid:', maid.full_name, maid.id);

            // Parse and validate date
            let scheduledDate;
            try {
              scheduledDate = new Date(toolInput.preferred_date);
              if (isNaN(scheduledDate.getTime())) {
                throw new Error('Invalid date');
              }
            } catch (e) {
              toolResult = {
                error: 'Invalid date format',
                message: 'Please provide a valid date and time for the interview.'
              };
              break;
            }

            // Check if date is in the future
            if (scheduledDate < new Date()) {
              toolResult = {
                error: 'Past date',
                message: 'Interview date must be in the future. Please choose a later date.'
              };
              break;
            }

            // Generate meeting link
            let meetingLink = null;
            const interviewType = toolInput.interview_type || 'whatsapp_video';

            if (interviewType === 'whatsapp_video') {
              const maidPhone = maid.phone_number || phoneNumber;
              meetingLink = `https://wa.me/${maidPhone.replace(/[^0-9]/g, '')}?text=Video%20Interview%20Scheduled`;
            }

            // Create video interview record
            const { data: interview, error: interviewError } = await supabaseClient
              .from('video_interviews')
              .insert({
                maid_id: toolInput.maid_id,
                sponsor_phone: phoneNumber,
                sponsor_name: toolInput.sponsor_name,
                maid_phone: maid.phone_number,
                scheduled_date: scheduledDate.toISOString(),
                duration_minutes: toolInput.duration_minutes || 30,
                interview_type: interviewType,
                meeting_link: meetingLink,
                status: 'scheduled',
                notes: toolInput.notes,
                created_via: 'whatsapp'
              })
              .select()
              .single();

            if (interviewError) {
              console.error('Error creating video interview:', interviewError);
              toolResult = {
                error: 'Failed to schedule interview',
                details: interviewError.message
              };
            } else {
              console.log('Video interview scheduled:', interview.id);

              // Format the date nicely
              const dateFormatted = new Date(interview.scheduled_date).toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Dubai'
              });

              toolResult = {
                success: true,
                interview_id: interview.id,
                maid_name: maid.full_name,
                scheduled_date: dateFormatted,
                interview_type: interview.interview_type,
                duration: interview.duration_minutes,
                meeting_link: meetingLink,
                message: `Video interview scheduled successfully with ${maid.full_name}`
              };
            }
            break;
          }

          case 'view_upcoming_interviews': {
            console.log('Fetching upcoming interviews...');

            const daysAhead = toolInput.days_ahead || 7;
            const { data: interviews, error } = await supabaseClient
              .rpc('get_upcoming_interviews', {
                p_phone_number: toolInput.phone_number,
                p_days_ahead: daysAhead
              });

            if (error) {
              console.error('Error fetching interviews:', error);
              toolResult = {
                error: 'Failed to fetch interviews',
                details: error.message
              };
            } else {
              toolResult = {
                success: true,
                count: interviews?.length || 0,
                interviews: interviews || [],
                message: interviews?.length > 0
                  ? `You have ${interviews.length} upcoming interview${interviews.length > 1 ? 's' : ''}`
                  : 'You have no upcoming interviews scheduled.'
              };
            }
            break;
          }

          case 'cancel_video_interview': {
            console.log('Cancelling video interview...');

            const { data, error } = await supabaseClient
              .from('video_interviews')
              .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                notes: toolInput.reason || 'Cancelled by sponsor'
              })
              .eq('id', toolInput.interview_id)
              .select()
              .single();

            if (error) {
              toolResult = {
                error: 'Failed to cancel interview',
                details: error.message
              };
            } else {
              toolResult = {
                success: true,
                interview: data,
                message: 'Video interview cancelled successfully'
              };
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
