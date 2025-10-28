-- =============================================
-- DIAGNOSTIC: Check what exists and fix it
-- =============================================

-- Step 1: Check what tables exist
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING EXISTING TABLES ===';

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        RAISE NOTICE '✅ notifications table EXISTS';
    ELSE
        RAISE NOTICE '❌ notifications table MISSING';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        RAISE NOTICE '✅ messages table EXISTS';
    ELSE
        RAISE NOTICE '❌ messages table MISSING';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        RAISE NOTICE '✅ subscriptions table EXISTS';
    ELSE
        RAISE NOTICE '❌ subscriptions table MISSING';
    END IF;
END $$;

-- Step 2: Check notifications columns
SELECT 'Notifications columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Step 3: Check messages columns related to read status
SELECT 'Messages read-related columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
AND column_name LIKE '%read%'
ORDER BY ordinal_position;

-- Step 4: Fix notifications table - Add is_read column if missing
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Check if is_read column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'notifications' AND column_name = 'is_read'
        ) THEN
            -- Add the missing column
            ALTER TABLE public.notifications ADD COLUMN is_read boolean DEFAULT false;
            RAISE NOTICE '✅ Added is_read column to notifications table';

            -- Also add read_at if missing
            IF NOT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'notifications' AND column_name = 'read_at'
            ) THEN
                ALTER TABLE public.notifications ADD COLUMN read_at timestamptz;
                RAISE NOTICE '✅ Added read_at column to notifications table';
            END IF;
        ELSE
            RAISE NOTICE '✅ is_read column already exists in notifications';
        END IF;
    END IF;
END $$;

-- Step 5: Now create the index (only if column exists)
CREATE INDEX IF NOT EXISTS idx_notifications_is_read
ON public.notifications USING btree (is_read);

-- Step 6: Fix messages table column name if needed
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        -- Check if it has 'read' instead of 'is_read'
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'messages' AND column_name = 'read'
        ) THEN
            ALTER TABLE public.messages RENAME COLUMN "read" TO is_read;
            RAISE NOTICE '✅ Renamed messages.read to messages.is_read';
        ELSIF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'messages' AND column_name = 'is_read'
        ) THEN
            RAISE NOTICE '✅ messages.is_read already correct';
        ELSE
            RAISE NOTICE '⚠️  messages table has no read status column!';
        END IF;
    END IF;
END $$;

-- Step 7: Verify final state
SELECT
  'Final verification:' as status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') as notifications_is_read,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_read') as messages_is_read,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'subscriptions') as subscriptions_exists;

SELECT '✅ Diagnostic and fixes complete!' as result;
