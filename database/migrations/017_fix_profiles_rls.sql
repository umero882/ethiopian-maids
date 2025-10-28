-- Migration 003: Fix profiles RLS recursion
-- Context: Postgres throws "infinite recursion detected in policy for relation 'profiles'"
-- Root cause: Some policies on profiles reference the profiles table in their USING/with check,
--             which can create recursive evaluation.

-- Safe rollback of potentially-recursive policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can view all profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can view all profiles" ON public.profiles';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can update all profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can update all profiles" ON public.profiles';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Sponsors can view maid basic info'
  ) THEN
    EXECUTE 'DROP POLICY "Sponsors can view maid basic info" ON public.profiles';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Maids can view sponsor basic info'
  ) THEN
    EXECUTE 'DROP POLICY "Maids can view sponsor basic info" ON public.profiles';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Agencies can view relevant profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Agencies can view relevant profiles" ON public.profiles';
  END IF;
END$$;

-- Keep only non-recursive, row-owner policies for profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can view own profile" ON public.profiles
             FOR SELECT USING (auth.uid() = id)$$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can update own profile" ON public.profiles
             FOR UPDATE USING (auth.uid() = id)$$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can insert own profile" ON public.profiles
             FOR INSERT WITH CHECK (auth.uid() = id)$$;
  END IF;
END$$;

-- Note: You can later reintroduce broader read policies using JWT claims rather than querying public.profiles
-- Example (if you store user_type in JWT as claim user_type):
-- CREATE POLICY "Public can view active profiles" ON public.profiles
--   FOR SELECT USING (
--     registration_complete = true AND is_active = true
--   );

