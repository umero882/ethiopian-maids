/**
 * Phone Verification Edge Function
 * Securely stores and validates phone verification codes
 * Replaces client-side sessionStorage with server-side database storage
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  action: 'send' | 'verify' | 'resend';
  phone: string;
  code?: string;
}

interface VerificationRecord {
  id?: string;
  phone: string;
  code: string;
  expires_at: string;
  attempts: number;
  verified: boolean;
  created_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Parse request body
    const requestData: VerificationRequest = await req.json();
    const { action, phone, code } = requestData;

    // Validate inputs
    if (!phone || !phone.startsWith('+')) {
      return new Response(
        JSON.stringify({ error: 'Valid phone number required (E.164 format)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle different actions
    switch (action) {
      case 'send':
      case 'resend': {
        // Generate 6-digit code
        const verificationCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        // Set expiry (10 minutes from now)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Check if verification already exists for this phone
        const { data: existing } = await supabaseClient
          .from('phone_verifications')
          .select('id')
          .eq('phone', phone)
          .eq('verified', false)
          .single();

        if (existing) {
          // Update existing record
          const { error: updateError } = await supabaseClient
            .from('phone_verifications')
            .update({
              code: verificationCode,
              expires_at: expiresAt,
              attempts: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
        } else {
          // Create new verification record
          const { error: insertError } = await supabaseClient
            .from('phone_verifications')
            .insert({
              phone,
              code: verificationCode,
              expires_at: expiresAt,
              attempts: 0,
              verified: false,
            });

          if (insertError) throw insertError;
        }

        // TODO: Send SMS via Twilio here
        // For now, return code in development mode
        const isDev = Deno.env.get('ENVIRONMENT') === 'development';

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Verification code sent successfully',
            ...(isDev && { devCode: verificationCode }), // Only in dev
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'verify': {
        if (!code || code.length !== 6) {
          return new Response(
            JSON.stringify({ error: 'Valid 6-digit code required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Get verification record
        const { data: verification, error: fetchError } = await supabaseClient
          .from('phone_verifications')
          .select('*')
          .eq('phone', phone)
          .eq('verified', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError || !verification) {
          return new Response(
            JSON.stringify({
              error: 'No verification found. Please request a new code.',
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Check if expired
        if (new Date(verification.expires_at) < new Date()) {
          // Delete expired record
          await supabaseClient
            .from('phone_verifications')
            .delete()
            .eq('id', verification.id);

          return new Response(
            JSON.stringify({
              error: 'Verification code expired. Please request a new code.',
            }),
            {
              status: 410,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Check attempts
        if (verification.attempts >= 3) {
          // Delete record after 3 failed attempts
          await supabaseClient
            .from('phone_verifications')
            .delete()
            .eq('id', verification.id);

          return new Response(
            JSON.stringify({
              error: 'Too many failed attempts. Please request a new code.',
            }),
            {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Verify code
        if (verification.code !== code) {
          // Increment attempts
          await supabaseClient
            .from('phone_verifications')
            .update({ attempts: verification.attempts + 1 })
            .eq('id', verification.id);

          const remainingAttempts = 2 - verification.attempts;
          return new Response(
            JSON.stringify({
              error: `Invalid code. ${remainingAttempts} ${
                remainingAttempts === 1 ? 'attempt' : 'attempts'
              } remaining.`,
            }),
            {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Code is correct - mark as verified
        await supabaseClient
          .from('phone_verifications')
          .update({
            verified: true,
            verified_at: new Date().toISOString(),
          })
          .eq('id', verification.id);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Phone number verified successfully',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Phone verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
