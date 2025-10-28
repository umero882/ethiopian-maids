-- Sample Calendar Events and Tasks for Agency
-- Creates realistic test data for calendar page

DO $$
DECLARE
  agency_user_id UUID;
  sponsor1_id UUID;
  maid1_id UUID;
  maid2_id UUID;
BEGIN
  -- Get agency user ID
  SELECT id INTO agency_user_id FROM profiles WHERE user_type = 'agency' LIMIT 1;

  IF agency_user_id IS NULL THEN
    RAISE EXCEPTION 'No agency user found. Please create an agency user first.';
  END IF;

  -- Get some related IDs
  SELECT id INTO sponsor1_id FROM sponsors WHERE agency_id = agency_user_id LIMIT 1;
  SELECT id INTO maid1_id FROM profiles WHERE user_type = 'maid' LIMIT 1 OFFSET 0;
  SELECT id INTO maid2_id FROM profiles WHERE user_type = 'maid' LIMIT 1 OFFSET 1;

  -- ============================================
  -- CALENDAR EVENTS
  -- ============================================

  -- Event 1: Upcoming Interview (Tomorrow)
  INSERT INTO calendar_events (
    agency_id, created_by, title, description, event_type,
    start_date, start_time, end_time, location, location_type,
    maid_id, sponsor_id, status, priority, notes
  ) VALUES (
    agency_user_id, agency_user_id,
    'Interview: Sarah with Al-Mansour Family',
    'Initial interview for housekeeper position. Candidate has 5 years experience.',
    'interview',
    CURRENT_DATE + INTERVAL '1 day', '10:00:00', '11:00:00',
    'Agency Office, Downtown',
    'onsite',
    maid1_id, sponsor1_id,
    'scheduled', 'high',
    'Prepare: CV, references, skills assessment'
  );

  -- Event 2: Training Session (Next Week)
  INSERT INTO calendar_events (
    agency_id, created_by, title, description, event_type,
    start_date, start_time, end_time, location, location_type,
    meeting_link, status, priority
  ) VALUES (
    agency_user_id, agency_user_id,
    'Orientation Training for New Maids',
    'Comprehensive training covering house rules, safety, and communication.',
    'training',
    CURRENT_DATE + INTERVAL '7 days', '09:00:00', '16:00:00',
    'Training Center',
    'onsite',
    NULL,
    'confirmed', 'medium'
  );

  -- Event 3: Medical Checkup (Next Week)
  INSERT INTO calendar_events (
    agency_id, created_by, title, description, event_type,
    start_date, start_time, end_time, location, location_type,
    maid_id, status, priority, notes
  ) VALUES (
    agency_user_id, agency_user_id,
    'Medical Checkup - Fatima',
    'Required medical examination before placement.',
    'medical',
    CURRENT_DATE + INTERVAL '5 days', '14:00:00', '15:30:00',
    'Central Medical Center',
    'onsite',
    maid2_id,
    'scheduled', 'high',
    'Bring: Passport, previous medical records'
  );

  -- Event 4: Placement Meeting (This Week)
  INSERT INTO calendar_events (
    agency_id, created_by, title, description, event_type,
    start_date, start_time, end_time, location, location_type,
    sponsor_id, status, priority
  ) VALUES (
    agency_user_id, agency_user_id,
    'Placement Discussion with Sponsor',
    'Discuss candidate options and contract terms.',
    'placement',
    CURRENT_DATE + INTERVAL '3 days', '11:00:00', '12:00:00',
    'Video Call',
    'online',
    sponsor1_id,
    'confirmed', 'medium'
  );

  -- Event 5: Follow-up Call (Today)
  INSERT INTO calendar_events (
    agency_id, created_by, title, description, event_type,
    start_date, start_time, end_time, location_type,
    status, priority, notes
  ) VALUES (
    agency_user_id, agency_user_id,
    'Follow-up: Previous Client Satisfaction',
    'Check in with sponsors about their placed maids.',
    'followup',
    CURRENT_DATE, '15:00:00', '15:30:00',
    'phone',
    'scheduled', 'low',
    'Ask about: Satisfaction, any issues, referrals'
  );

  -- Event 6: Completed Interview (Yesterday)
  INSERT INTO calendar_events (
    agency_id, created_by, title, description, event_type,
    start_date, start_time, end_time, location, location_type,
    maid_id, status, priority, outcome, notes
  ) VALUES (
    agency_user_id, agency_user_id,
    'Interview: Maria with Dubai Hotel Group',
    'Interview for hospitality maid position.',
    'interview',
    CURRENT_DATE - INTERVAL '1 day', '14:00:00', '15:00:00',
    'Hotel Office',
    'onsite',
    maid1_id,
    'completed', 'medium',
    'Successful - Sponsor interested in proceeding',
    'Strong candidate, good language skills'
  );

  -- ============================================
  -- AGENCY TASKS
  -- ============================================

  -- Task 1: High Priority - Document Verification
  INSERT INTO agency_tasks (
    agency_id, created_by, assigned_to_id, title, description,
    task_type, status, priority, due_date, progress,
    related_maid_id, estimated_hours, tags
  ) VALUES (
    agency_user_id, agency_user_id, agency_user_id,
    'Verify Documents for New Arrivals',
    'Check passports, visas, and medical certificates for 3 new maids.',
    'documentation',
    'in_progress', 'urgent',
    CURRENT_DATE + INTERVAL '2 days', 60,
    maid1_id, 4,
    ARRAY['urgent', 'documents', 'verification']
  );

  -- Task 2: Medium Priority - Follow-up with Sponsors
  INSERT INTO agency_tasks (
    agency_id, created_by, title, description,
    task_type, status, priority, due_date, progress,
    estimated_hours, tags
  ) VALUES (
    agency_user_id, agency_user_id,
    'Follow up with 5 Pending Sponsors',
    'Contact sponsors who showed interest last week but haven''t confirmed.',
    'followup',
    'pending', 'high',
    CURRENT_DATE + INTERVAL '3 days', 0,
    2,
    ARRAY['sales', 'followup', 'sponsors']
  );

  -- Task 3: Interview Preparation
  INSERT INTO agency_tasks (
    agency_id, created_by, assigned_to_id, title, description,
    task_type, status, priority, due_date, progress,
    related_maid_id, related_sponsor_id, estimated_hours, tags
  ) VALUES (
    agency_user_id, agency_user_id, agency_user_id,
    'Prepare Interview Materials for Tomorrow',
    'Print CVs, prepare skills assessment sheets, schedule room.',
    'interview_prep',
    'pending', 'high',
    CURRENT_DATE, 0,
    maid1_id, sponsor1_id, 1,
    ARRAY['interview', 'preparation', 'urgent']
  );

  -- Task 4: Marketing Campaign
  INSERT INTO agency_tasks (
    agency_id, created_by, title, description,
    task_type, status, priority, due_date, progress,
    estimated_hours, tags
  ) VALUES (
    agency_user_id, agency_user_id,
    'Launch Social Media Campaign',
    'Create posts showcasing available maids and success stories.',
    'marketing',
    'in_progress', 'medium',
    CURRENT_DATE + INTERVAL '7 days', 40,
    8,
    ARRAY['marketing', 'social-media', 'content']
  );

  -- Task 5: Completed Task - Placement
  INSERT INTO agency_tasks (
    agency_id, created_by, assigned_to_id, title, description,
    task_type, status, priority, due_date, progress,
    completed_at, estimated_hours, tags
  ) VALUES (
    agency_user_id, agency_user_id, agency_user_id,
    'Complete Placement Contract for Maria',
    'Finalize contract, collect fees, arrange transportation.',
    'placement',
    'completed', 'high',
    CURRENT_DATE - INTERVAL '1 day', 100,
    CURRENT_DATE - INTERVAL '1 day', 3,
    ARRAY['placement', 'contracts', 'completed']
  );

  -- Task 6: Admin Task - Database Update
  INSERT INTO agency_tasks (
    agency_id, created_by, title, description,
    task_type, status, priority, due_date, progress,
    estimated_hours, tags
  ) VALUES (
    agency_user_id, agency_user_id,
    'Update Maid Profiles in System',
    'Add new photos, update availability status, refresh skills.',
    'admin',
    'pending', 'low',
    CURRENT_DATE + INTERVAL '14 days', 0,
    6,
    ARRAY['admin', 'database', 'maintenance']
  );

  -- Task 7: Verification Task
  INSERT INTO agency_tasks (
    agency_id, created_by, assigned_to_id, title, description,
    task_type, status, priority, due_date, progress,
    estimated_hours, tags
  ) VALUES (
    agency_user_id, agency_user_id, agency_user_id,
    'Background Check for 2 Candidates',
    'Complete police clearance and reference verification.',
    'verification',
    'in_progress', 'high',
    CURRENT_DATE + INTERVAL '5 days', 30,
    5,
    ARRAY['verification', 'background-check', 'compliance']
  );

  -- Task 8: Training Organization
  INSERT INTO agency_tasks (
    agency_id, created_by, title, description,
    task_type, status, priority, due_date, progress,
    estimated_hours, tags
  ) VALUES (
    agency_user_id, agency_user_id,
    'Organize Next Month Training Sessions',
    'Book venue, prepare materials, invite candidates, arrange catering.',
    'training',
    'pending', 'medium',
    CURRENT_DATE + INTERVAL '20 days', 0,
    12,
    ARRAY['training', 'planning', 'logistics']
  );

  RAISE NOTICE 'Sample calendar events and tasks created successfully!';
END $$;

-- Display summary
SELECT
  'Calendar Events' as type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM calendar_events
WHERE agency_id IN (SELECT id FROM profiles WHERE user_type = 'agency' LIMIT 1);

SELECT
  'Tasks' as type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pending') as todo,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM agency_tasks
WHERE agency_id IN (SELECT id FROM profiles WHERE user_type = 'agency' LIMIT 1);
