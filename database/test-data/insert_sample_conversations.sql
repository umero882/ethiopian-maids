-- Sample Conversations and Message Templates for Agency Messaging
-- Creates realistic test data for messaging page

DO $$
DECLARE
  agency_user_id UUID;
  sponsor1_id UUID;
  sponsor2_id UUID;
  maid1_id UUID;
  maid2_id UUID;
  conv1_id UUID;
  conv2_id UUID;
  conv3_id UUID;
BEGIN
  -- Get agency user ID
  SELECT id INTO agency_user_id FROM profiles WHERE user_type = 'agency' LIMIT 1;

  IF agency_user_id IS NULL THEN
    RAISE EXCEPTION 'No agency user found. Please create an agency user first.';
  END IF;

  -- Get some sponsor and maid profile IDs (need profile_id for conversations)
  SELECT profile_id INTO sponsor1_id FROM sponsors WHERE agency_id = agency_user_id AND profile_id IS NOT NULL LIMIT 1 OFFSET 0;
  SELECT profile_id INTO sponsor2_id FROM sponsors WHERE agency_id = agency_user_id AND profile_id IS NOT NULL LIMIT 1 OFFSET 1;
  SELECT id INTO maid1_id FROM profiles WHERE user_type = 'maid' LIMIT 1 OFFSET 0;
  SELECT id INTO maid2_id FROM profiles WHERE user_type = 'maid' LIMIT 1 OFFSET 1;

  -- Create conversations
  -- Conversation 1: Agency <-> Sponsor (Active)
  IF sponsor1_id IS NOT NULL THEN
    INSERT INTO conversations (
      agency_id,
      participant1_id,
      participant1_type,
      participant2_id,
      participant2_type,
      status,
      last_message_at,
      last_message_preview,
      participant1_unread_count,
      participant2_unread_count
    ) VALUES (
      agency_user_id,
      agency_user_id,
      'agency',
      sponsor1_id,
      'sponsor',
      'active',
      NOW() - INTERVAL '2 hours',
      'Thank you for your interest. I have several qualified candidates...',
      0,
      1
    ) RETURNING id INTO conv1_id;

    -- Add messages to conversation 1
    IF conv1_id IS NOT NULL THEN
      INSERT INTO messages (conversation_id, sender_id, receiver_id, content, read, created_at)
      VALUES
        (conv1_id, sponsor1_id, agency_user_id, 'Hello, I am looking for an experienced housekeeper for my family.', true, NOW() - INTERVAL '5 hours'),
        (conv1_id, agency_user_id, sponsor1_id, 'Thank you for reaching out! I have several qualified candidates. What are your specific requirements?', true, NOW() - INTERVAL '4 hours'),
        (conv1_id, sponsor1_id, agency_user_id, 'I need someone with cooking skills and childcare experience. English speaking preferred.', true, NOW() - INTERVAL '3 hours'),
        (conv1_id, agency_user_id, sponsor1_id, 'Perfect! I have 3 candidates that match your criteria. Would you like to schedule interviews?', false, NOW() - INTERVAL '2 hours');
    END IF;
  END IF;

  -- Conversation 2: Agency <-> Maid (Active)
  IF maid1_id IS NOT NULL THEN
    INSERT INTO conversations (
      agency_id,
      participant1_id,
      participant1_type,
      participant2_id,
      participant2_type,
      status,
      last_message_at,
      last_message_preview,
      participant1_unread_count,
      participant2_unread_count
    ) VALUES (
      agency_user_id,
      agency_user_id,
      'agency',
      maid1_id,
      'maid',
      'active',
      NOW() - INTERVAL '1 day',
      'Great! I will prepare your documents for the interview...',
      2,
      0
    ) RETURNING id INTO conv2_id;

    -- Add messages to conversation 2
    IF conv2_id IS NOT NULL THEN
      INSERT INTO messages (conversation_id, sender_id, receiver_id, content, read, created_at)
      VALUES
        (conv2_id, maid1_id, agency_user_id, 'Good morning! I wanted to update my availability status.', true, NOW() - INTERVAL '2 days'),
        (conv2_id, agency_user_id, maid1_id, 'Good morning! Please let me know your updated availability.', true, NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
        (conv2_id, maid1_id, agency_user_id, 'I am available for interviews starting next week.', true, NOW() - INTERVAL '1 day'),
        (conv2_id, agency_user_id, maid1_id, 'Great! I will prepare your documents for the interview.', false, NOW() - INTERVAL '1 day' + INTERVAL '30 minutes');
    END IF;
  END IF;

  -- Conversation 3: Agency <-> Sponsor (Archived)
  IF sponsor2_id IS NOT NULL THEN
    INSERT INTO conversations (
      agency_id,
      participant1_id,
      participant1_type,
      participant2_id,
      participant2_type,
      status,
      last_message_at,
      last_message_preview,
      participant1_unread_count,
      participant2_unread_count
    ) VALUES (
      agency_user_id,
      agency_user_id,
      'agency',
      sponsor2_id,
      'sponsor',
      'archived',
      NOW() - INTERVAL '1 week',
      'Perfect! The placement was completed successfully.',
      0,
      0
    ) RETURNING id INTO conv3_id;

    -- Add messages to conversation 3
    IF conv3_id IS NOT NULL THEN
      INSERT INTO messages (conversation_id, sender_id, receiver_id, content, read, created_at)
      VALUES
        (conv3_id, sponsor2_id, agency_user_id, 'The maid you recommended has been excellent. Thank you!', true, NOW() - INTERVAL '1 week'),
        (conv3_id, agency_user_id, sponsor2_id, 'We are so glad to hear that! Please let us know if you need anything else.', true, NOW() - INTERVAL '1 week' + INTERVAL '2 hours'),
        (conv3_id, sponsor2_id, agency_user_id, 'Will do. Thanks again!', true, NOW() - INTERVAL '1 week' + INTERVAL '3 hours'),
        (conv3_id, agency_user_id, sponsor2_id, 'Perfect! The placement was completed successfully.', true, NOW() - INTERVAL '1 week' + INTERVAL '4 hours');
    END IF;
  END IF;

  -- Create message templates
  INSERT INTO message_templates (agency_id, name, category, subject, content, variables, is_active) VALUES
    (agency_user_id, 'Initial Greeting', 'greeting', 'Welcome to our agency',
     'Dear {{name}},\n\nThank you for contacting {{agency_name}}. We are excited to help you find the perfect candidate for your needs.\n\nBest regards,\n{{agent_name}}',
     '["name", "agency_name", "agent_name"]'::jsonb, true),

    (agency_user_id, 'Interview Invitation', 'inquiry', 'Interview Invitation - {{candidate_name}}',
     'Dear {{sponsor_name}},\n\nWe would like to invite you to interview {{candidate_name}} for the position. The candidate has {{years_experience}} years of experience and speaks {{languages}}.\n\nPlease let us know your available times.\n\nBest regards,\n{{agency_name}}',
     '["sponsor_name", "candidate_name", "years_experience", "languages", "agency_name"]'::jsonb, true),

    (agency_user_id, 'Follow Up', 'followup', 'Following up on your inquiry',
     'Dear {{name}},\n\nI wanted to follow up on our previous conversation regarding your requirements. Do you have any questions or would you like to proceed with scheduling interviews?\n\nPlease let me know how I can assist you further.\n\nBest regards,\n{{agent_name}}',
     '["name", "agent_name"]'::jsonb, true),

    (agency_user_id, 'Job Offer Accepted', 'offer', 'Congratulations! Job Offer Accepted',
     'Dear {{maid_name}},\n\nCongratulations! The sponsor has accepted your profile and would like to proceed with the placement.\n\nWe will be in touch soon regarding the next steps and documentation.\n\nBest regards,\n{{agency_name}}',
     '["maid_name", "agency_name"]'::jsonb, true),

    (agency_user_id, 'Thank You Note', 'general', 'Thank you for choosing our agency',
     'Dear {{name}},\n\nThank you for choosing {{agency_name}} for your domestic helper needs. We appreciate your trust in our services.\n\nIf you have any questions or concerns, please do not hesitate to reach out.\n\nBest regards,\n{{agency_name}}',
     '["name", "agency_name"]'::jsonb, true);

  RAISE NOTICE 'Sample conversations and templates created successfully!';
END $$;

-- Display created data
SELECT
  c.id,
  c.status,
  c.last_message_preview,
  c.participant1_unread_count,
  c.participant2_unread_count,
  c.created_at
FROM conversations c
WHERE c.agency_id IN (SELECT id FROM profiles WHERE user_type = 'agency' LIMIT 1)
ORDER BY c.last_message_at DESC;

SELECT
  id,
  name,
  category,
  is_active,
  usage_count
FROM message_templates
WHERE agency_id IN (SELECT id FROM profiles WHERE user_type = 'agency' LIMIT 1)
ORDER BY category, name;
