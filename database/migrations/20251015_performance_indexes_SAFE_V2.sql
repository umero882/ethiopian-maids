-- Performance Indexes - SAFE VERSION V2
-- This version checks if columns exist before creating indexes
-- Purpose: Optimize frequently-used queries for better performance
-- Created: 2025-10-15

-- ============================================================================
-- SAFE INDEX CREATION WITH COLUMN CHECKS
-- ============================================================================

-- Index 1: Subscriptions - User ID + Status (only if user_id exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'subscriptions'
      AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_status
    ON subscriptions(user_id, status)
    WHERE status IN ('active', 'trialing', 'past_due');
    RAISE NOTICE '✅ Created idx_subscriptions_user_id_status';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_subscriptions_user_id_status - user_id column not found';
  END IF;
END $$;

-- Index 2: Subscriptions - Stripe Subscription ID (unique)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'subscriptions'
      AND column_name = 'stripe_subscription_id'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id
    ON subscriptions(stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;
    RAISE NOTICE '✅ Created idx_subscriptions_stripe_sub_id';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_subscriptions_stripe_sub_id - column not found';
  END IF;
END $$;

-- Index 3: Subscriptions - End Date (for expiration checks)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'subscriptions'
      AND column_name = 'end_date'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date
    ON subscriptions(end_date)
    WHERE end_date IS NOT NULL AND status = 'active';
    RAISE NOTICE '✅ Created idx_subscriptions_end_date';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_subscriptions_end_date - column not found';
  END IF;
END $$;

-- Index 4: Subscriptions - Created At
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'subscriptions'
      AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at
    ON subscriptions(created_at DESC);
    RAISE NOTICE '✅ Created idx_subscriptions_created_at';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_subscriptions_created_at - column not found';
  END IF;
END $$;

-- Index 5: Subscriptions - Stripe Customer ID
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'subscriptions'
      AND column_name = 'stripe_customer_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
    ON subscriptions(stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;
    RAISE NOTICE '✅ Created idx_subscriptions_stripe_customer_id';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_subscriptions_stripe_customer_id - column not found';
  END IF;
END $$;

-- Index 6: Subscriptions - Plan Type + Status
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'subscriptions'
      AND column_name = 'plan_type'
  ) AND EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'subscriptions'
      AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type_status
    ON subscriptions(plan_type, status);
    RAISE NOTICE '✅ Created idx_subscriptions_plan_type_status';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_subscriptions_plan_type_status - columns not found';
  END IF;
END $$;

-- ============================================================================
-- FAVORITES TABLE INDEXES
-- ============================================================================

-- Index 7: Favorites - User ID
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'favorites')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'favorites' AND column_name = 'user_id')
  THEN
    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
    RAISE NOTICE '✅ Created idx_favorites_user_id';
  ELSE
    RAISE NOTICE '⚠️ Skipped favorites indexes - table or column not found';
  END IF;
END $$;

-- Index 8: Favorites - Favorited Item
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'favorites')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'favorites' AND column_name = 'favorited_type')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'favorites' AND column_name = 'favorited_id')
  THEN
    CREATE INDEX IF NOT EXISTS idx_favorites_favorited ON favorites(favorited_type, favorited_id);
    RAISE NOTICE '✅ Created idx_favorites_favorited';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_favorites_favorited - columns not found';
  END IF;
END $$;

-- ============================================================================
-- MESSAGES TABLE INDEXES
-- ============================================================================

-- Index 9: Messages - Recipient ID + Read Status
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipient_id')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_read')
  THEN
    CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread
    ON messages(recipient_id, is_read)
    WHERE is_read = false;
    RAISE NOTICE '✅ Created idx_messages_recipient_unread';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_messages_recipient_unread - columns not found';
  END IF;
END $$;

-- Index 10: Messages - Sender ID
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'sender_id')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'created_at')
  THEN
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id
    ON messages(sender_id, created_at DESC);
    RAISE NOTICE '✅ Created idx_messages_sender_id';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_messages_sender_id - columns not found';
  END IF;
END $$;

-- ============================================================================
-- BOOKINGS TABLE INDEXES
-- ============================================================================

-- Index 11: Bookings - Sponsor ID + Status
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'sponsor_id')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'status')
  THEN
    CREATE INDEX IF NOT EXISTS idx_bookings_sponsor_status
    ON bookings(sponsor_id, status)
    WHERE status IS NOT NULL;
    RAISE NOTICE '✅ Created idx_bookings_sponsor_status';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_bookings_sponsor_status - table or columns not found';
  END IF;
END $$;

-- Index 12: Bookings - Maid ID + Status
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'maid_id')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'status')
  THEN
    CREATE INDEX IF NOT EXISTS idx_bookings_maid_status
    ON bookings(maid_id, status)
    WHERE status IS NOT NULL;
    RAISE NOTICE '✅ Created idx_bookings_maid_status';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_bookings_maid_status - table or columns not found';
  END IF;
END $$;

-- ============================================================================
-- COMPOUND INDEXES
-- ============================================================================

-- Index 13: Subscriptions - User + Plan + Status
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'user_id')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'plan_type')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'status')
  THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_plan_status
    ON subscriptions(user_id, plan_type, status);
    RAISE NOTICE '✅ Created idx_subscriptions_user_plan_status';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_subscriptions_user_plan_status - columns not found';
  END IF;
END $$;

-- ============================================================================
-- PARTIAL INDEXES
-- ============================================================================

-- Index 14: Active Subscriptions Only
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'user_id')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'plan_type')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'status')
  THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_active_only
    ON subscriptions(user_id, plan_type, created_at)
    WHERE status IN ('active', 'trialing');
    RAISE NOTICE '✅ Created idx_subscriptions_active_only';
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_subscriptions_active_only - columns not found';
  END IF;
END $$;

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Index 15: Maid Profiles Full-text Search
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'maid_profiles')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'maid_profiles' AND column_name = 'full_name')
  THEN
    -- Check if other columns exist for full-text search
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'maid_profiles' AND column_name = 'bio') THEN
      CREATE INDEX IF NOT EXISTS idx_maid_profiles_fulltext
      ON maid_profiles
      USING GIN (to_tsvector('english',
        COALESCE(full_name, '') || ' ' ||
        COALESCE(bio, '')
      ));
      RAISE NOTICE '✅ Created idx_maid_profiles_fulltext (with bio)';
    ELSE
      CREATE INDEX IF NOT EXISTS idx_maid_profiles_fulltext
      ON maid_profiles
      USING GIN (to_tsvector('english', COALESCE(full_name, '')));
      RAISE NOTICE '✅ Created idx_maid_profiles_fulltext (name only)';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_maid_profiles_fulltext - table or columns not found';
  END IF;
END $$;

-- Index 16: Agency Profiles Full-text Search
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agency_profiles')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'agency_name')
  THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'description') THEN
      CREATE INDEX IF NOT EXISTS idx_agency_profiles_fulltext
      ON agency_profiles
      USING GIN (to_tsvector('english',
        COALESCE(agency_name, '') || ' ' ||
        COALESCE(description, '')
      ));
      RAISE NOTICE '✅ Created idx_agency_profiles_fulltext (with description)';
    ELSE
      CREATE INDEX IF NOT EXISTS idx_agency_profiles_fulltext
      ON agency_profiles
      USING GIN (to_tsvector('english', COALESCE(agency_name, '')));
      RAISE NOTICE '✅ Created idx_agency_profiles_fulltext (name only)';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Skipped idx_agency_profiles_fulltext - table or columns not found';
  END IF;
END $$;

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

-- Update statistics for query planner
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    ANALYZE subscriptions;
    RAISE NOTICE '✅ Analyzed subscriptions';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'favorites') THEN
    ANALYZE favorites;
    RAISE NOTICE '✅ Analyzed favorites';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
    ANALYZE messages;
    RAISE NOTICE '✅ Analyzed messages';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings') THEN
    ANALYZE bookings;
    RAISE NOTICE '✅ Analyzed bookings';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'maid_profiles') THEN
    ANALYZE maid_profiles;
    RAISE NOTICE '✅ Analyzed maid_profiles';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agency_profiles') THEN
    ANALYZE agency_profiles;
    RAISE NOTICE '✅ Analyzed agency_profiles';
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  -- Count indexes created
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND tablename IN ('subscriptions', 'favorites', 'messages', 'bookings', 'maid_profiles', 'agency_profiles');

  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ Performance Indexes Migration Complete';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total custom indexes: %', index_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Run this to see all indexes:';
  RAISE NOTICE 'SELECT tablename, indexname FROM pg_indexes';
  RAISE NOTICE 'WHERE schemaname = ''public'' AND indexname LIKE ''idx_%%'';';
  RAISE NOTICE '';
END $$;
