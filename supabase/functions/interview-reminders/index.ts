/**
 * Interview Reminders Cron Job
 * Runs every 15 minutes to send interview reminders
 * Sends 24h, 1h, and 15min reminders
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Interview {
  id: string;
  maid_name: string;
  sponsor_phone: string;
  maid_phone: string | null;
  scheduled_date: string;
  interview_type: string;
  meeting_link: string | null;
  duration_minutes: number;
  reminder_sent_24h: boolean;
  reminder_sent_1h: boolean;
  reminder_sent_15min: boolean;
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      console.error('Twilio credentials not configured');
      return false;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const body = new URLSearchParams({
      From: `whatsapp:${twilioWhatsAppNumber}`,
      To: to,
      Body: message
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio error:', error);
      return false;
    }

    console.log('Message sent successfully to:', to);
    return true;

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

/**
 * Format reminder message
 */
function formatReminderMessage(
  interview: Interview,
  reminderType: '24h' | '1h' | '15min'
): string {
  const date = new Date(interview.scheduled_date);
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  let message = '';

  switch (reminderType) {
    case '24h':
      message = `⏰ *Reminder: Video Interview Tomorrow*\n\n`;
      message += `Your interview with ${interview.maid_name} is in 24 hours!\n\n`;
      message += `📋 *Details:*\n`;
      message += `• Date: Tomorrow (${dateStr})\n`;
      message += `• Time: ${timeStr}\n`;
      message += `• Platform: ${interview.interview_type.replace('_', ' ').toUpperCase()}\n`;
      message += `• Duration: ${interview.duration_minutes} minutes\n\n`;

      if (interview.meeting_link) {
        message += `📞 *Meeting Link:*\n${interview.meeting_link}\n\n`;
      }

      message += `💡 *Preparation Tips:*\n`;
      message += `• Test your camera and microphone\n`;
      message += `• Find a quiet place\n`;
      message += `• Prepare your questions\n`;
      message += `• Have pen and paper ready\n\n`;

      if (interview.interview_type === 'zoom' || interview.interview_type === 'microsoft_teams') {
        message += `📥 Make sure you have the app installed!\n\n`;
      }

      message += `See you tomorrow! 🎉`;
      break;

    case '1h':
      message = `⏰ *Reminder: Interview in 1 Hour*\n\n`;
      message += `Your interview with ${interview.maid_name} starts at ${timeStr} (in 1 hour)\n\n`;
      message += `📋 *Details:*\n`;
      message += `• Time: ${timeStr}\n`;
      message += `• Platform: ${interview.interview_type.replace('_', ' ').toUpperCase()}\n\n`;

      if (interview.meeting_link) {
        message += `📞 *Meeting Link:*\n${interview.meeting_link}\n\n`;
        message += `Click the link to join at ${timeStr}\n\n`;
      }

      message += `💡 Get ready:\n`;
      message += `• Find a quiet space\n`;
      message += `• Test your camera/mic\n`;
      message += `• Have your questions ready\n\n`;

      message += `Good luck! 👍`;
      break;

    case '15min':
      message = `⏰ *FINAL REMINDER: Interview in 15 Minutes*\n\n`;
      message += `Your interview with ${interview.maid_name} starts at ${timeStr}\n\n`;

      if (interview.meeting_link) {
        message += `📞 *Click here to join NOW:*\n${interview.meeting_link}\n\n`;
      } else if (interview.interview_type === 'phone_call') {
        message += `📞 We will call you at ${timeStr}\n\n`;
      } else if (interview.interview_type === 'whatsapp_video') {
        message += `📞 We will call you on WhatsApp at ${timeStr}\n\n`;
      }

      message += `See you in 15 minutes! 🎥`;
      break;
  }

  return message;
}

/**
 * Process reminders
 */
async function processReminders(supabaseClient: any): Promise<{
  sent24h: number;
  sent1h: number;
  sent15min: number;
  errors: number;
}> {
  const results = {
    sent24h: 0,
    sent1h: 0,
    sent15min: 0,
    errors: 0
  };

  const now = new Date();

  // Get interviews needing 24h reminder
  const { data: interviews24h } = await supabaseClient
    .from('video_interviews')
    .select('id, maid_id, sponsor_phone, maid_phone, scheduled_date, interview_type, meeting_link, duration_minutes, reminder_sent_24h, maid_profiles!inner(full_name)')
    .eq('status', 'scheduled')
    .eq('reminder_sent_24h', false)
    .gte('scheduled_date', new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString())
    .lte('scheduled_date', new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString());

  // Get interviews needing 1h reminder
  const { data: interviews1h } = await supabaseClient
    .from('video_interviews')
    .select('id, maid_id, sponsor_phone, maid_phone, scheduled_date, interview_type, meeting_link, duration_minutes, reminder_sent_1h, maid_profiles!inner(full_name)')
    .eq('status', 'scheduled')
    .eq('reminder_sent_1h', false)
    .gte('scheduled_date', new Date(now.getTime() + 50 * 60 * 1000).toISOString())
    .lte('scheduled_date', new Date(now.getTime() + 70 * 60 * 1000).toISOString());

  // Get interviews needing 15min reminder
  const { data: interviews15min } = await supabaseClient
    .from('video_interviews')
    .select('id, maid_id, sponsor_phone, maid_phone, scheduled_date, interview_type, meeting_link, duration_minutes, reminder_sent_15min, maid_profiles!inner(full_name)')
    .eq('status', 'scheduled')
    .eq('reminder_sent_15min', false)
    .gte('scheduled_date', new Date(now.getTime() + 10 * 60 * 1000).toISOString())
    .lte('scheduled_date', new Date(now.getTime() + 20 * 60 * 1000).toISOString());

  // Process 24h reminders
  if (interviews24h && interviews24h.length > 0) {
    console.log(`Processing ${interviews24h.length} 24-hour reminders`);

    for (const interview of interviews24h) {
      const message = formatReminderMessage(
        {
          ...interview,
          maid_name: interview.maid_profiles.full_name
        } as Interview,
        '24h'
      );

      const sent = await sendWhatsAppMessage(interview.sponsor_phone, message);

      if (sent) {
        await supabaseClient
          .from('video_interviews')
          .update({ reminder_sent_24h: true })
          .eq('id', interview.id);

        // Also send to maid
        if (interview.maid_phone) {
          await sendWhatsAppMessage(
            interview.maid_phone,
            `⏰ Reminder: You have an interview tomorrow at ${new Date(interview.scheduled_date).toLocaleTimeString()}. Please be ready!`
          );
        }

        results.sent24h++;
      } else {
        results.errors++;
      }
    }
  }

  // Process 1h reminders
  if (interviews1h && interviews1h.length > 0) {
    console.log(`Processing ${interviews1h.length} 1-hour reminders`);

    for (const interview of interviews1h) {
      const message = formatReminderMessage(
        {
          ...interview,
          maid_name: interview.maid_profiles.full_name
        } as Interview,
        '1h'
      );

      const sent = await sendWhatsAppMessage(interview.sponsor_phone, message);

      if (sent) {
        await supabaseClient
          .from('video_interviews')
          .update({ reminder_sent_1h: true })
          .eq('id', interview.id);

        // Also send to maid
        if (interview.maid_phone) {
          await sendWhatsAppMessage(
            interview.maid_phone,
            `⏰ Reminder: Interview in 1 hour! Get ready. ${interview.meeting_link || ''}`
          );
        }

        results.sent1h++;
      } else {
        results.errors++;
      }
    }
  }

  // Process 15min reminders
  if (interviews15min && interviews15min.length > 0) {
    console.log(`Processing ${interviews15min.length} 15-minute reminders`);

    for (const interview of interviews15min) {
      const message = formatReminderMessage(
        {
          ...interview,
          maid_name: interview.maid_profiles.full_name
        } as Interview,
        '15min'
      );

      const sent = await sendWhatsAppMessage(interview.sponsor_phone, message);

      if (sent) {
        await supabaseClient
          .from('video_interviews')
          .update({ reminder_sent_15min: true })
          .eq('id', interview.id);

        // Also send to maid
        if (interview.maid_phone) {
          await sendWhatsAppMessage(
            interview.maid_phone,
            `⏰ FINAL REMINDER: Interview in 15 minutes! ${interview.meeting_link || 'Be ready for the call!'}`
          );
        }

        results.sent15min++;
      } else {
        results.errors++;
      }
    }
  }

  return results;
}

/**
 * Main handler
 */
const handler = async (req: Request): Promise<Response> => {
  console.log('=== Interview Reminders Cron Job Started ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const results = await processReminders(supabaseClient);

    console.log('Reminders sent:', results);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Cron job error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
