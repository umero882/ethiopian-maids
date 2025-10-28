-- Check what columns actually exist in each table

-- Favorites table columns
SELECT 'FAVORITES TABLE COLUMNS:' AS info, '' AS column_name, '' AS data_type
UNION ALL
SELECT '', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'favorites'
ORDER BY ordinal_position;

-- Messages table columns
SELECT '' AS info, '' AS column_name, '' AS data_type
UNION ALL
SELECT 'MESSAGES TABLE COLUMNS:' AS info, '' AS column_name, '' AS data_type
UNION ALL
SELECT '', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Bookings table columns
SELECT '' AS info, '' AS column_name, '' AS data_type
UNION ALL
SELECT 'BOOKINGS TABLE COLUMNS:' AS info, '' AS column_name, '' AS data_type
UNION ALL
SELECT '', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- Profiles table columns
SELECT '' AS info, '' AS column_name, '' AS data_type
UNION ALL
SELECT 'PROFILES TABLE COLUMNS:' AS info, '' AS column_name, '' AS data_type
UNION ALL
SELECT '', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
