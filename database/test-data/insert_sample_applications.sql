-- Sample Applications for Testing
-- Creates realistic application data for agency applicants page

-- First, get available job IDs and maid IDs
DO $$
DECLARE
  job1_id UUID;
  job2_id UUID;
  maid1_id UUID;
  maid2_id UUID;
  maid3_id UUID;
  maid4_id UUID;
  maid5_id UUID;
  agency_user_id UUID;
BEGIN
  -- Get two sample jobs
  SELECT id INTO job1_id FROM jobs WHERE status = 'active' ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO job2_id FROM jobs WHERE status = 'active' ORDER BY created_at DESC LIMIT 1 OFFSET 1;

  -- If no jobs exist, use a placeholder (you'll need to create jobs first)
  IF job1_id IS NULL THEN
    -- Create a sample job for testing
    INSERT INTO jobs (
      sponsor_id,
      title,
      description,
      location,
      country,
      salary_min,
      salary_max,
      currency,
      job_type,
      live_in_required,
      status,
      required_skills,
      languages_required
    ) VALUES (
      (SELECT id FROM profiles WHERE user_type = 'sponsor' LIMIT 1),
      'Full-time Live-in Housekeeper',
      'Looking for an experienced housekeeper to help with daily household tasks including cleaning, cooking, and childcare.',
      'Riyadh',
      'Saudi Arabia',
      1200,
      1500,
      'USD',
      'full-time',
      true,
      'active',
      ARRAY['Cleaning', 'Cooking', 'Childcare'],
      ARRAY['English', 'Arabic']
    ) RETURNING id INTO job1_id;
  END IF;

  IF job2_id IS NULL THEN
    INSERT INTO jobs (
      sponsor_id,
      title,
      description,
      location,
      country,
      salary_min,
      salary_max,
      currency,
      job_type,
      live_in_required,
      status,
      required_skills,
      languages_required
    ) VALUES (
      (SELECT id FROM profiles WHERE user_type = 'sponsor' LIMIT 1),
      'Elderly Care Specialist',
      'Seeking a caring and patient individual to provide elderly care services.',
      'Dubai',
      'UAE',
      900,
      1200,
      'USD',
      'full-time',
      false,
      'active',
      ARRAY['Elderly Care', 'Medical Care', 'Cooking'],
      ARRAY['English', 'Arabic']
    ) RETURNING id INTO job2_id;
  END IF;

  -- Get sample maid IDs
  SELECT id INTO maid1_id FROM maid_profiles WHERE availability_status = 'available' ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO maid2_id FROM maid_profiles WHERE availability_status = 'available' ORDER BY created_at DESC LIMIT 1 OFFSET 1;
  SELECT id INTO maid3_id FROM maid_profiles WHERE availability_status = 'available' ORDER BY created_at DESC LIMIT 1 OFFSET 2;
  SELECT id INTO maid4_id FROM maid_profiles WHERE availability_status = 'available' ORDER BY created_at DESC LIMIT 1 OFFSET 3;
  SELECT id INTO maid5_id FROM maid_profiles WHERE availability_status = 'available' ORDER BY created_at DESC LIMIT 1 OFFSET 4;

  -- Get agency user ID
  SELECT id INTO agency_user_id FROM profiles WHERE user_type = 'agency' LIMIT 1;

  -- Delete existing test applications
  DELETE FROM applications WHERE id IN (
    SELECT a.id FROM applications a
    WHERE a.created_at > NOW() - INTERVAL '1 hour'
  );

  -- Insert sample applications with various statuses
  -- Application 1: New application (just received)
  IF maid1_id IS NOT NULL AND job1_id IS NOT NULL THEN
    INSERT INTO applications (
      job_id,
      maid_id,
      agency_id,
      application_status,
      match_score,
      cover_letter,
      notes,
      documents_submitted,
      priority,
      viewed_by_agency,
      created_at,
      updated_at
    ) VALUES (
      job1_id,
      maid1_id,
      agency_user_id,
      'new',
      85,
      'I am very interested in this housekeeping position. I have 5 years of experience working with families in the GCC region and am comfortable with all household duties including childcare, cooking, and cleaning. I am available immediately and can provide excellent references.',
      'Strong candidate with relevant GCC experience. Excellent language skills.',
      true,
      'high',
      false,
      NOW() - INTERVAL '2 hours',
      NOW() - INTERVAL '2 hours'
    );
  END IF;

  -- Application 2: Shortlisted candidate
  IF maid2_id IS NOT NULL AND job1_id IS NOT NULL THEN
    INSERT INTO applications (
      job_id,
      maid_id,
      agency_id,
      application_status,
      match_score,
      cover_letter,
      notes,
      documents_submitted,
      priority,
      viewed_by_agency,
      viewed_at,
      created_at,
      updated_at
    ) VALUES (
      job1_id,
      maid2_id,
      agency_user_id,
      'shortlisted',
      92,
      'I have been working as a housekeeper for over 6 years and specialize in childcare and cooking. I speak fluent English and Arabic and have excellent references from my previous employers.',
      'Excellent candidate! Top match for position. Very experienced and well-qualified.',
      true,
      'urgent',
      true,
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day'
    );
  END IF;

  -- Application 3: Interviewed
  IF maid3_id IS NOT NULL AND job2_id IS NOT NULL THEN
    INSERT INTO applications (
      job_id,
      maid_id,
      agency_id,
      application_status,
      match_score,
      cover_letter,
      notes,
      interview_date,
      interview_notes,
      documents_submitted,
      priority,
      viewed_by_agency,
      viewed_at,
      created_at,
      updated_at
    ) VALUES (
      job2_id,
      maid3_id,
      agency_user_id,
      'interviewed',
      78,
      'I am passionate about elderly care and have specialized training in medical assistance. I have worked with elderly patients for 3 years and am patient, caring, and reliable.',
      'Good candidate for elderly care position. Interview scheduled.',
      NOW() + INTERVAL '2 days',
      'Interview went well. Candidate shows genuine care for elderly. Some language barriers but manageable. Awaiting final decision.',
      true,
      'normal',
      true,
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '1 day'
    );
  END IF;

  -- Application 4: Offered
  IF maid4_id IS NOT NULL AND job2_id IS NOT NULL THEN
    INSERT INTO applications (
      job_id,
      maid_id,
      agency_id,
      application_status,
      match_score,
      cover_letter,
      notes,
      interview_date,
      interview_notes,
      offer_date,
      offer_amount,
      offer_currency,
      response_deadline,
      documents_submitted,
      priority,
      viewed_by_agency,
      viewed_at,
      created_at,
      updated_at
    ) VALUES (
      job2_id,
      maid4_id,
      agency_user_id,
      'offered',
      88,
      'I have extensive experience in elderly care including medical support. I am certified in first aid and have worked in similar positions for 5 years. I am looking for a long-term position with a caring family.',
      'Excellent candidate! Perfect match for the position. Offered position pending acceptance.',
      NOW() - INTERVAL '5 days',
      'Excellent interview. Very professional and knowledgeable. Strong recommendation.',
      NOW() - INTERVAL '2 days',
      1100,
      'USD',
      NOW() + INTERVAL '3 days',
      true,
      'urgent',
      true,
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '2 days'
    );
  END IF;

  -- Application 5: Rejected (not a good match)
  IF maid5_id IS NOT NULL AND job1_id IS NOT NULL THEN
    INSERT INTO applications (
      job_id,
      maid_id,
      agency_id,
      application_status,
      match_score,
      cover_letter,
      notes,
      rejection_reason,
      documents_submitted,
      priority,
      viewed_by_agency,
      viewed_at,
      created_at,
      updated_at
    ) VALUES (
      job1_id,
      maid5_id,
      agency_user_id,
      'rejected',
      45,
      'I am interested in working as a housekeeper. I have some experience and am eager to learn.',
      'Limited experience. Does not meet minimum requirements.',
      'Candidate does not meet the minimum experience requirements for this position (requires 2+ years, candidate has <1 year).',
      false,
      'low',
      true,
      NOW() - INTERVAL '4 days',
      NOW() - INTERVAL '4 days',
      NOW() - INTERVAL '3 days'
    );
  END IF;

  -- Calculate match scores for all new applications
  UPDATE applications
  SET match_score = calculate_application_match_score(id)
  WHERE match_score = 0;

  RAISE NOTICE 'Sample applications created successfully!';
END $$;

-- Display created applications
SELECT
  a.id,
  a.application_status,
  a.match_score,
  a.priority,
  j.title as job_title,
  m.full_name as maid_name,
  a.created_at
FROM applications a
LEFT JOIN jobs j ON a.job_id = j.id
LEFT JOIN maid_profiles m ON a.maid_id = m.id
ORDER BY a.created_at DESC
LIMIT 10;
