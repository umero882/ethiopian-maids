-- =====================================================
-- Platform Settings Enhancement
-- Adds additional fields for comprehensive settings management
-- =====================================================

-- Add new columns to platform_settings table
ALTER TABLE platform_settings
ADD COLUMN IF NOT EXISTS max_context_messages INTEGER DEFAULT 20 CHECK (max_context_messages >= 5 AND max_context_messages <= 50),
ADD COLUMN IF NOT EXISTS auto_response_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS business_hours_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS system_prompt TEXT,
ADD COLUMN IF NOT EXISTS greeting_message TEXT,
ADD COLUMN IF NOT EXISTS offline_message TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS validate_signature BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rate_limiting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rate_limit INTEGER DEFAULT 5 CHECK (rate_limit >= 1 AND rate_limit <= 60),
ADD COLUMN IF NOT EXISTS notify_new_messages BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_bookings BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_errors BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_email TEXT,
ADD COLUMN IF NOT EXISTS auto_confirm_bookings BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS send_reminders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS send_followups BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 1024 CHECK (max_tokens >= 256 AND max_tokens <= 4096),
ADD COLUMN IF NOT EXISTS timeout INTEGER DEFAULT 30 CHECK (timeout >= 5 AND timeout <= 60),
ADD COLUMN IF NOT EXISTS debug_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS store_ai_responses BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allowed_numbers TEXT,
ADD COLUMN IF NOT EXISTS blocked_numbers TEXT,
ADD COLUMN IF NOT EXISTS cache_timeout INTEGER DEFAULT 5 CHECK (cache_timeout >= 1 AND cache_timeout <= 60);

-- Update existing platform_settings with webhook URL if not set
UPDATE platform_settings
SET whatsapp_webhook_url = 'https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook'
WHERE whatsapp_webhook_url IS NULL OR whatsapp_webhook_url = '';

-- Update greeting message if not set
UPDATE platform_settings
SET greeting_message = 'Hello! 👋 Welcome to Ethiopian Maids! I''m Lucy, your AI assistant. How can I help you today?'
WHERE greeting_message IS NULL;

-- Update offline message if not set
UPDATE platform_settings
SET offline_message = 'Thank you for contacting us! We''re currently offline. Our working hours are 9:00 AM - 6:00 PM EAT, Monday - Saturday. We''ll respond to your message as soon as we''re back online.'
WHERE offline_message IS NULL;

-- Update error message if not set
UPDATE platform_settings
SET error_message = 'I''m sorry, I encountered an error processing your request. Please try again or contact our support team at {support_email}.'
WHERE error_message IS NULL;

-- Add comments for new columns
COMMENT ON COLUMN platform_settings.max_context_messages IS 'Number of previous messages included in AI context (5-50)';
COMMENT ON COLUMN platform_settings.auto_response_enabled IS 'Automatically respond to incoming messages';
COMMENT ON COLUMN platform_settings.business_hours_only IS 'Only respond during working hours';
COMMENT ON COLUMN platform_settings.system_prompt IS 'Custom system prompt appended to base instructions';
COMMENT ON COLUMN platform_settings.greeting_message IS 'Default greeting message';
COMMENT ON COLUMN platform_settings.offline_message IS 'Message sent when outside business hours';
COMMENT ON COLUMN platform_settings.error_message IS 'Message sent when an error occurs';
COMMENT ON COLUMN platform_settings.validate_signature IS 'Verify webhook requests are from Twilio';
COMMENT ON COLUMN platform_settings.rate_limiting_enabled IS 'Enable rate limiting per phone number';
COMMENT ON COLUMN platform_settings.rate_limit IS 'Maximum messages per minute per phone number';
COMMENT ON COLUMN platform_settings.notify_new_messages IS 'Notify admins of new WhatsApp messages';
COMMENT ON COLUMN platform_settings.notify_bookings IS 'Notify when bookings are created/updated';
COMMENT ON COLUMN platform_settings.notify_errors IS 'Notify when webhook/AI errors occur';
COMMENT ON COLUMN platform_settings.notification_email IS 'Email address for receiving notifications';
COMMENT ON COLUMN platform_settings.auto_confirm_bookings IS 'Auto-send confirmation when booking is confirmed';
COMMENT ON COLUMN platform_settings.send_reminders IS 'Send reminders 24 hours before booking';
COMMENT ON COLUMN platform_settings.send_followups IS 'Request feedback after completed bookings';
COMMENT ON COLUMN platform_settings.max_tokens IS 'Maximum length of AI responses (256-4096)';
COMMENT ON COLUMN platform_settings.timeout IS 'Timeout for webhook and AI requests (5-60 seconds)';
COMMENT ON COLUMN platform_settings.debug_mode IS 'Log detailed information for troubleshooting';
COMMENT ON COLUMN platform_settings.store_ai_responses IS 'Save full AI response data for analysis';
COMMENT ON COLUMN platform_settings.allowed_numbers IS 'Whitelist of allowed phone numbers (newline-separated)';
COMMENT ON COLUMN platform_settings.blocked_numbers IS 'Blacklist of blocked phone numbers (newline-separated)';
COMMENT ON COLUMN platform_settings.cache_timeout IS 'Maid availability cache refresh interval in minutes';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_webhook ON platform_settings(whatsapp_webhook_url);

-- Verification query
SELECT
  platform_name,
  support_email,
  support_phone,
  working_hours,
  whatsapp_webhook_url,
  ai_model,
  ai_temperature,
  max_context_messages,
  auto_response_enabled
FROM platform_settings
LIMIT 1;
