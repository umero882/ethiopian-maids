-- Sample Sponsors for Testing
-- Creates realistic sponsor data for agency sponsors page

DO $$
DECLARE
  agency_user_id UUID;
  sponsor1_id UUID;
  sponsor2_id UUID;
  sponsor3_id UUID;
  sponsor4_id UUID;
  sponsor5_id UUID;
  job1_id UUID;
  job2_id UUID;
BEGIN
  -- Get agency user ID
  SELECT id INTO agency_user_id FROM profiles WHERE user_type = 'agency' LIMIT 1;

  IF agency_user_id IS NULL THEN
    RAISE EXCEPTION 'No agency user found. Please create an agency user first.';
  END IF;

  -- Get some job IDs if they exist
  SELECT id INTO job1_id FROM jobs WHERE status = 'active' LIMIT 1 OFFSET 0;
  SELECT id INTO job2_id FROM jobs WHERE status = 'active' LIMIT 1 OFFSET 1;

  -- COMMENTED OUT: Don't delete existing sponsors to preserve production data
  -- DELETE FROM sponsors WHERE created_at > NOW() - INTERVAL '1 hour';

  -- Sponsor 1: Active Individual - Verified
  INSERT INTO sponsors (
    agency_id,
    name,
    email,
    phone,
    location,
    sponsor_type,
    status,
    verification_status,
    rating,
    total_reviews,
    total_jobs,
    active_jobs,
    completed_jobs,
    hired_maids,
    total_spent,
    household_size,
    preferred_maid_type,
    budget_range,
    preferred_contact_method,
    notes
  ) VALUES (
    agency_user_id,
    'Ahmed Al-Mansour',
    'ahmed.almansour@example.com',
    '+966501234567',
    'Riyadh, Saudi Arabia',
    'individual',
    'active',
    'verified',
    4.8,
    12,
    5,
    2,
    3,
    3,
    15000.00,
    6,
    'Experienced housekeeper with childcare skills',
    '$1200-$1500/month',
    'whatsapp',
    'Prefers maids with cooking experience and English language skills'
  ) RETURNING id INTO sponsor1_id;

  -- Link sponsor to job if exists
  IF job1_id IS NOT NULL THEN
    INSERT INTO sponsor_jobs (sponsor_id, job_id, status)
    VALUES (sponsor1_id, job1_id, 'active');
  END IF;

  -- Sponsor 2: Active Company - Verified
  INSERT INTO sponsors (
    agency_id,
    name,
    email,
    phone,
    location,
    sponsor_type,
    status,
    verification_status,
    company_name,
    company_registration,
    rating,
    total_reviews,
    total_jobs,
    active_jobs,
    completed_jobs,
    hired_maids,
    total_spent,
    preferred_maid_type,
    budget_range,
    preferred_contact_method,
    notes
  ) VALUES (
    agency_user_id,
    'Sarah Al-Khalid',
    'sarah@luxuryhotels.ae',
    '+971501234567',
    'Dubai, UAE',
    'company',
    'active',
    'verified',
    'Luxury Hotels Dubai LLC',
    'DXB-2023-45678',
    4.9,
    25,
    15,
    8,
    7,
    12,
    45000.00,
    'Hospitality trained housekeeping staff',
    '$1500-$2000/month',
    'email',
    'Looking for professionally trained staff for hotel housekeeping'
  ) RETURNING id INTO sponsor2_id;

  -- Link sponsor to job if exists
  IF job2_id IS NOT NULL THEN
    INSERT INTO sponsor_jobs (sponsor_id, job_id, status)
    VALUES (sponsor2_id, job2_id, 'active');
  END IF;

  -- Sponsor 3: Pending Individual - Pending Documents
  INSERT INTO sponsors (
    agency_id,
    name,
    email,
    phone,
    location,
    sponsor_type,
    status,
    verification_status,
    rating,
    total_reviews,
    total_jobs,
    active_jobs,
    completed_jobs,
    hired_maids,
    total_spent,
    household_size,
    preferred_maid_type,
    budget_range,
    preferred_contact_method,
    notes
  ) VALUES (
    agency_user_id,
    'Fatima Hassan',
    'fatima.hassan@example.com',
    '+965501234567',
    'Kuwait City, Kuwait',
    'individual',
    'pending',
    'pending_documents',
    0,
    0,
    1,
    1,
    0,
    0,
    0,
    4,
    'Elder care specialist',
    '$1000-$1300/month',
    'phone',
    'New sponsor, documents under review'
  ) RETURNING id INTO sponsor3_id;

  -- Sponsor 4: Active Family - Verified
  INSERT INTO sponsors (
    agency_id,
    name,
    email,
    phone,
    location,
    sponsor_type,
    status,
    verification_status,
    rating,
    total_reviews,
    total_jobs,
    active_jobs,
    completed_jobs,
    hired_maids,
    total_spent,
    household_size,
    preferred_maid_type,
    budget_range,
    preferred_contact_method,
    special_requirements,
    notes
  ) VALUES (
    agency_user_id,
    'Mohammed & Aisha Al-Farsi',
    'alfarsi.family@example.com',
    '+968501234567',
    'Muscat, Oman',
    'family',
    'active',
    'verified',
    4.7,
    8,
    3,
    1,
    2,
    2,
    8500.00,
    5,
    'Live-in maid with cooking and childcare',
    '$1100-$1400/month',
    'whatsapp',
    'Must be comfortable with pets (2 cats)',
    'Looking for long-term employment relationship'
  ) RETURNING id INTO sponsor4_id;

  -- Sponsor 5: Suspended Individual
  INSERT INTO sponsors (
    agency_id,
    name,
    email,
    phone,
    location,
    sponsor_type,
    status,
    verification_status,
    rating,
    total_reviews,
    total_jobs,
    active_jobs,
    completed_jobs,
    hired_maids,
    total_spent,
    household_size,
    preferred_maid_type,
    budget_range,
    preferred_contact_method,
    notes,
    last_contact_date
  ) VALUES (
    agency_user_id,
    'Khalid Ibrahim',
    'khalid.ibrahim@example.com',
    '+973501234567',
    'Manama, Bahrain',
    'individual',
    'suspended',
    'verified',
    3.5,
    4,
    2,
    0,
    1,
    1,
    2500.00,
    3,
    'General housekeeping',
    '$900-$1100/month',
    'email',
    'Account suspended due to payment issues. Last contacted 2 weeks ago.',
    NOW() - INTERVAL '14 days'
  ) RETURNING id INTO sponsor5_id;

  RAISE NOTICE 'Sample sponsors created successfully!';
END $$;

-- Display created sponsors
SELECT
  s.id,
  s.name,
  s.sponsor_type,
  s.status,
  s.verification_status,
  s.location,
  s.total_jobs,
  s.active_jobs,
  s.hired_maids,
  s.rating,
  s.created_at
FROM sponsors s
ORDER BY s.created_at DESC
LIMIT 10;
