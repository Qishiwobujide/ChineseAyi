-- Update existing user_profiles table to add Zhang Ayi customization fields
-- Run this script in Supabase SQL Editor after the initial schema

-- Add personality traits field (can store multiple traits as array)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS ayi_personality_traits TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add Zhang Ayi background field
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS ayi_background TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.ayi_personality_traits IS 'Array of personality traits for Zhang Ayi: polite, straightforward, nice, sassy, encouraging, strict, humorous, patient';
COMMENT ON COLUMN public.user_profiles.ayi_background IS 'Background story for Zhang Ayi: retired_teacher, beijing_native, shanghai_businesswoman, taiwanese_aunt, hongkong_ayi, village_elder';
