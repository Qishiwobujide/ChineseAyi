-- Chinese Ayi Tutor Database Schema for Supabase

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- User preferences from questionnaire
    communication_type TEXT CHECK (communication_type IN ('oral', 'written')), -- 口语/书面
    usage_context TEXT CHECK (usage_context IN ('daily', 'business')), -- 日常/商务
    background TEXT, -- 背景
    proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')), -- 水平

    -- Credit system
    credits INTEGER DEFAULT 0,
    daily_messages_used INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,

    -- Status
    is_active BOOLEAN DEFAULT true
);

-- Conversation sessions table
CREATE TABLE IF NOT EXISTS public.conversation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,

    -- Session metadata
    session_type TEXT DEFAULT 'practice', -- 'questionnaire' or 'practice'

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- Corrections and suggestions
    has_correction BOOLEAN DEFAULT false,
    correction_text TEXT,
    alternative_text TEXT, -- More 地道 way to say it

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES public.conversation_sessions(id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

    amount INTEGER NOT NULL, -- Positive for purchases, negative for usage
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund')),

    -- Payment info (if applicable)
    payment_method TEXT,
    payment_reference TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON public.conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_active ON public.conversation_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);

-- Function to reset daily message count
CREATE OR REPLACE FUNCTION reset_daily_messages()
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles
    SET daily_messages_used = 0,
        last_reset_date = CURRENT_DATE
    WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can only access their own conversations
CREATE POLICY "Users can view own sessions" ON public.conversation_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.conversation_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only access their own messages
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);
