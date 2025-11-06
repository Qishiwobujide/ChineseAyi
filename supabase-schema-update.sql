-- Update conversation_sessions table to add Zhang Ayi customization fields
-- Each conversation can have its own unique Zhang Ayi personality and background
-- Run this script in Supabase SQL Editor

-- Add personality traits field to conversation_sessions (can store multiple traits as array)
ALTER TABLE public.conversation_sessions
ADD COLUMN IF NOT EXISTS ayi_personality_traits TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add Zhang Ayi background field to conversation_sessions
ALTER TABLE public.conversation_sessions
ADD COLUMN IF NOT EXISTS ayi_background TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.conversation_sessions.ayi_personality_traits IS 'Array of personality traits for Zhang Ayi in this conversation: polite, straightforward, nice, sassy, encouraging, strict, humorous, patient (max 3)';
COMMENT ON COLUMN public.conversation_sessions.ayi_background IS 'Background story for Zhang Ayi in this conversation: retired_teacher, beijing_native, shanghai_businesswoman, taiwanese_aunt, hongkong_ayi, village_elder';

-- Remove these fields from user_profiles if they exist (since they should be per-conversation)
ALTER TABLE public.user_profiles
DROP COLUMN IF EXISTS ayi_personality_traits;

ALTER TABLE public.user_profiles
DROP COLUMN IF EXISTS ayi_background;
