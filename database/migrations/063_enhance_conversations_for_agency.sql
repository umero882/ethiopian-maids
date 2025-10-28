-- Migration: Enhance Conversations Table for Agency Messaging
-- Description: Add agency_id and update structure for agency messaging system
-- Date: 2025-10-29

-- Add agency_id column to conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add conversation_id to messages if not exists
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Create message_templates table for agency message templates
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'greeting', 'followup', 'offer', 'rejection', 'reminder', 'inquiry')),
  subject VARCHAR(500),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_agency_id ON public.conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_agency_id ON public.message_templates(agency_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON public.message_templates(category);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_active ON public.message_templates(is_active);

-- Enable RLS on message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agencies can view own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Agencies can create templates" ON public.message_templates;
DROP POLICY IF EXISTS "Agencies can update own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Agencies can delete own templates" ON public.message_templates;

-- Create RLS policies for message_templates
CREATE POLICY "Agencies can view own templates" ON public.message_templates
  FOR SELECT
  TO authenticated
  USING (agency_id = auth.uid());

CREATE POLICY "Agencies can create templates" ON public.message_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_type = 'agency'
    )
    AND agency_id = auth.uid()
  );

CREATE POLICY "Agencies can update own templates" ON public.message_templates
  FOR UPDATE
  TO authenticated
  USING (agency_id = auth.uid());

CREATE POLICY "Agencies can delete own templates" ON public.message_templates
  FOR DELETE
  TO authenticated
  USING (agency_id = auth.uid());

-- Create trigger to automatically update updated_at for message_templates
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_message_templates_timestamp ON public.message_templates;
CREATE TRIGGER trigger_update_message_templates_timestamp
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_message_templates_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.message_templates IS 'Stores reusable message templates for agencies';
COMMENT ON COLUMN public.conversations.agency_id IS 'The agency involved in this conversation';
COMMENT ON COLUMN public.messages.conversation_id IS 'Links message to a conversation thread';
