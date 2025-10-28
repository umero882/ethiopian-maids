-- Sample Shortlists for Testing
-- Creates realistic shortlist data for agency shortlists page

DO $$
DECLARE
  agency_user_id UUID;
  job1_id UUID;
  job2_id UUID;
  shortlist1_id UUID;
  shortlist2_id UUID;
  shortlist3_id UUID;
  maid1_id UUID;
  maid2_id UUID;
  maid3_id UUID;
  maid4_id UUID;
  maid5_id UUID;
BEGIN
  -- Get agency user ID
  SELECT id INTO agency_user_id FROM profiles WHERE user_type = 'agency' LIMIT 1;

  IF agency_user_id IS NULL THEN
    RAISE EXCEPTION 'No agency user found. Please create an agency user first.';
  END IF;

  -- Get some job IDs
  SELECT id INTO job1_id FROM jobs WHERE status = 'active' LIMIT 1 OFFSET 0;
  SELECT id INTO job2_id FROM jobs WHERE status = 'active' LIMIT 1 OFFSET 1;

  -- Get some maid profile IDs
  SELECT id INTO maid1_id FROM maid_profiles WHERE availability_status = 'available' LIMIT 1 OFFSET 0;
  SELECT id INTO maid2_id FROM maid_profiles WHERE availability_status = 'available' LIMIT 1 OFFSET 1;
  SELECT id INTO maid3_id FROM maid_profiles WHERE availability_status = 'available' LIMIT 1 OFFSET 2;
  SELECT id INTO maid4_id FROM maid_profiles WHERE availability_status = 'available' LIMIT 1 OFFSET 3;
  SELECT id INTO maid5_id FROM maid_profiles WHERE availability_status = 'available' LIMIT 1 OFFSET 4;

  -- Delete existing test shortlists (from last hour)
  DELETE FROM shortlists WHERE created_at > NOW() - INTERVAL '1 hour';

  -- Shortlist 1: Top Housekeepers - Riyadh
  INSERT INTO shortlists (
    agency_id,
    job_id,
    name,
    description,
    status,
    priority,
    tags,
    created_by
  ) VALUES (
    agency_user_id,
    job1_id,
    'Top Housekeepers - Riyadh',
    'High-quality candidates for luxury households in Riyadh with excellent references',
    'active',
    'high',
    ARRAY['luxury', 'riyadh', 'experienced'],
    agency_user_id
  ) RETURNING id INTO shortlist1_id;

  -- Add candidates to shortlist 1
  IF maid1_id IS NOT NULL THEN
    INSERT INTO shortlist_candidates (
      shortlist_id, maid_id, match_score, notes, added_by
    ) VALUES (
      shortlist1_id, maid1_id, 92,
      'Excellent references from previous employer. Very experienced with children.',
      agency_user_id
    );
  END IF;

  IF maid2_id IS NOT NULL THEN
    INSERT INTO shortlist_candidates (
      shortlist_id, maid_id, match_score, notes, added_by
    ) VALUES (
      shortlist1_id, maid2_id, 88,
      'Outstanding candidate with excellent references. Pet-friendly household experience.',
      agency_user_id
    );
  END IF;

  IF maid3_id IS NOT NULL THEN
    INSERT INTO shortlist_candidates (
      shortlist_id, maid_id, match_score, notes, added_by
    ) VALUES (
      shortlist1_id, maid3_id, 85,
      'Very organized and detail-oriented. Excellent cleaning standards.',
      agency_user_id
    );
  END IF;

  IF maid4_id IS NOT NULL THEN
    INSERT INTO shortlist_candidates (
      shortlist_id, maid_id, match_score, notes, added_by
    ) VALUES (
      shortlist1_id, maid4_id, 90,
      'Exceptional cooking skills. Previously worked for diplomatic families.',
      agency_user_id
    );
  END IF;

  -- Shortlist 2: Elderly Care Specialists - Dubai
  INSERT INTO shortlists (
    agency_id,
    job_id,
    name,
    description,
    status,
    priority,
    tags,
    created_by
  ) VALUES (
    agency_user_id,
    job2_id,
    'Elderly Care Specialists - Dubai',
    'Experienced caregivers with medical training for elderly care positions',
    'active',
    'urgent',
    ARRAY['medical', 'elderly-care', 'dubai'],
    agency_user_id
  ) RETURNING id INTO shortlist2_id;

  -- Add candidates to shortlist 2
  IF maid2_id IS NOT NULL THEN
    INSERT INTO shortlist_candidates (
      shortlist_id, maid_id, match_score, notes, added_by
    ) VALUES (
      shortlist2_id, maid2_id, 94,
      'Specialized in elderly care with medical training. Very patient and caring.',
      agency_user_id
    );
  END IF;

  IF maid5_id IS NOT NULL THEN
    INSERT INTO shortlist_candidates (
      shortlist_id, maid_id, match_score, notes, added_by
    ) VALUES (
      shortlist2_id, maid5_id, 91,
      'Certified in basic medical care. Experience with mobility-impaired patients.',
      agency_user_id
    );
  END IF;

  -- Shortlist 3: Cooking Experts - Kuwait (Archived)
  INSERT INTO shortlists (
    agency_id,
    job_id,
    name,
    description,
    status,
    priority,
    tags,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    agency_user_id,
    NULL,
    'Cooking Experts - Kuwait',
    'Exceptional cooks for families who value culinary excellence',
    'archived',
    'normal',
    ARRAY['cooking', 'kuwait', 'culinary'],
    agency_user_id,
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '13 days'
  ) RETURNING id INTO shortlist3_id;

  -- Add candidate to shortlist 3
  IF maid1_id IS NOT NULL THEN
    INSERT INTO shortlist_candidates (
      shortlist_id, maid_id, match_score, notes, added_by, added_at
    ) VALUES (
      shortlist3_id, maid1_id, 78,
      'Young and enthusiastic. Excellent cooking skills with traditional and modern cuisine.',
      agency_user_id,
      NOW() - INTERVAL '18 days'
    );
  END IF;

  RAISE NOTICE 'Sample shortlists created successfully!';
END $$;

-- Display created shortlists with candidate counts
SELECT
  s.id,
  s.name,
  s.status,
  s.priority,
  s.tags,
  (SELECT COUNT(*) FROM shortlist_candidates WHERE shortlist_id = s.id) as candidate_count,
  s.created_at
FROM shortlists s
ORDER BY s.created_at DESC
LIMIT 10;
