/**
 * Conversation State Management
 * Tracks user's position in multi-step interview booking flow
 *
 * IMPORTANT: Uses database storage instead of in-memory for serverless persistence
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ConversationState {
  phone_number: string;
  current_step: 'idle' | 'awaiting_date' | 'awaiting_time' | 'awaiting_platform' | 'processing';
  context: {
    maid_id?: string;
    maid_name?: string;
    selected_date?: string;
    selected_date_display?: string;
    selected_time?: string;
    selected_time_display?: string;
    selected_platform?: string;
    date_options?: any[];
    platform_options?: any[];
    awaiting_maid_selection?: boolean;
    maid_options?: any[];
  };
  created_at: Date;
  expires_at: Date;
}

// State expires after 10 minutes of inactivity
const STATE_EXPIRY_MS = 10 * 60 * 1000;

// Get Supabase client for state storage
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get conversation state for a phone number
 */
export async function getConversationState(phoneNumber: string): Promise<ConversationState | null> {
  try {
    console.log('📥 Getting conversation state for:', phoneNumber);
    const supabase = getSupabaseClient();

    // Try to get from whatsapp_messages metadata first (temporary storage)
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('metadata, received_at')
      .eq('phone_number', phoneNumber)
      .eq('sender', 'system')
      .eq('message_type', 'conversation_state')
      .order('received_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Database error getting state:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ No conversation state found for:', phoneNumber);
      return null;
    }

    const record = data[0];
    if (!record.metadata) {
      console.log('⚠️ State record has no metadata');
      return null;
    }

    const state = record.metadata as any;
    console.log('✅ Retrieved conversation state:', {
      phoneNumber,
      step: state.current_step,
      hasContext: !!state.context
    });

    // Check if expired
    if (new Date() > new Date(state.expires_at)) {
      console.log('⏰ State expired for:', phoneNumber);
      return null;
    }

    // Convert date strings back to Date objects
    return {
      ...state,
      created_at: new Date(state.created_at),
      expires_at: new Date(state.expires_at)
    };
  } catch (error) {
    console.error('❌ Error getting conversation state:', error);
    return null;
  }
}

/**
 * Set conversation state
 */
export async function setConversationState(
  phoneNumber: string,
  step: ConversationState['current_step'],
  context: ConversationState['context']
): Promise<void> {
  try {
    console.log('💾 Saving conversation state:', { phoneNumber, step, contextKeys: Object.keys(context) });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + STATE_EXPIRY_MS);

    const state: ConversationState = {
      phone_number: phoneNumber,
      current_step: step,
      context,
      created_at: now,
      expires_at: expiresAt
    };

    const supabase = getSupabaseClient();

    // Store in whatsapp_messages table with special message_type
    const { data, error } = await supabase.from('whatsapp_messages').insert({
      phone_number: phoneNumber,
      message_content: `[Conversation State: ${step}]`,
      sender: 'system',
      message_type: 'conversation_state',
      metadata: state,
      processed: true
    }).select();

    if (error) {
      console.error('❌ Database error saving state:', error);
      console.error('Error details:', JSON.stringify(error));
      // Don't throw - just log and continue
      return;
    }

    console.log('✅ Conversation state saved to database:', { phoneNumber, step, recordId: data?.[0]?.id });
  } catch (error) {
    console.error('❌ Error saving conversation state:', error);
    console.error('Error stack:', error?.stack);
    // Don't throw - just log and continue
  }
}

/**
 * Update conversation state context
 */
export async function updateConversationContext(
  phoneNumber: string,
  updates: Partial<ConversationState['context']>
): Promise<void> {
  const state = await getConversationState(phoneNumber);
  if (state) {
    state.context = { ...state.context, ...updates };
    state.expires_at = new Date(Date.now() + STATE_EXPIRY_MS);
    await setConversationState(phoneNumber, state.current_step, state.context);
  }
}

/**
 * Clear conversation state
 */
export async function clearConversationState(phoneNumber: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    // Delete conversation state records
    await supabase
      .from('whatsapp_messages')
      .delete()
      .eq('phone_number', phoneNumber)
      .eq('message_type', 'conversation_state');

    console.log('✅ Conversation state cleared for:', phoneNumber);
  } catch (error) {
    console.error('Error clearing conversation state:', error);
  }
}

/**
 * Check if user is in middle of booking flow
 */
export async function isInBookingFlow(phoneNumber: string): Promise<boolean> {
  const state = await getConversationState(phoneNumber);
  return state !== null && state.current_step !== 'idle';
}

/**
 * Clean up expired states (call periodically)
 */
export async function cleanupExpiredStates(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const now = new Date();

    // Delete expired conversation states
    await supabase
      .from('whatsapp_messages')
      .delete()
      .eq('message_type', 'conversation_state')
      .lt('received_at', new Date(now.getTime() - STATE_EXPIRY_MS).toISOString());

    console.log('✅ Cleaned up expired conversation states');
  } catch (error) {
    console.error('Error cleaning up conversation states:', error);
  }
}
