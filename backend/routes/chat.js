const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { generateAyiResponse, extractQuestionnaireData } = require('../services/ayiService');

/**
 * Start a new conversation session
 */
router.post('/session/start', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionType } = req.body; // 'questionnaire' or 'practice'

        // Create new session
        const { data: session, error } = await supabaseAdmin
            .from('conversation_sessions')
            .insert([{
                user_id: userId,
                session_type: sessionType || 'practice',
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;

        // If starting practice session, send initial greeting
        if (sessionType === 'practice') {
            const { data: profile } = await supabaseAdmin
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            // Generate initial greeting
            const response = await generateAyiResponse([], profile, false);

            // Save Ayi's greeting
            await supabaseAdmin
                .from('messages')
                .insert([{
                    session_id: session.id,
                    user_id: userId,
                    role: 'assistant',
                    content: response.message
                }]);

            return res.json({
                session,
                initialMessage: response.message
            });
        }

        // If questionnaire, send first question
        if (sessionType === 'questionnaire') {
            const response = await generateAyiResponse([], {}, true);

            await supabaseAdmin
                .from('messages')
                .insert([{
                    session_id: session.id,
                    user_id: userId,
                    role: 'assistant',
                    content: response.message
                }]);

            return res.json({
                session,
                initialMessage: response.message
            });
        }

        res.json({ session });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'Failed to start conversation session' });
    }
});

/**
 * Send a message in a conversation
 */
router.post('/message', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId, message } = req.body;

        if (!sessionId || !message) {
            return res.status(400).json({ error: 'Session ID and message are required' });
        }

        // Check message limit
        const dailyLimit = parseInt(process.env.DAILY_MESSAGE_LIMIT) || 12;
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('daily_messages_used, credits, last_reset_date')
            .eq('id', userId)
            .single();

        // Reset if needed
        const today = new Date().toISOString().split('T')[0];
        let messagesUsed = profile.daily_messages_used;
        if (profile.last_reset_date !== today) {
            messagesUsed = 0;
            await supabaseAdmin
                .from('user_profiles')
                .update({
                    daily_messages_used: 0,
                    last_reset_date: today
                })
                .eq('id', userId);
        }

        // Check if user can send message
        const remainingFree = Math.max(0, dailyLimit - messagesUsed);
        let usedCredit = false;

        if (remainingFree <= 0) {
            if (profile.credits <= 0) {
                return res.status(403).json({
                    error: 'Daily message limit reached. Please purchase credits to continue.',
                    limitReached: true,
                    remainingFree: 0,
                    credits: profile.credits
                });
            }
            // Use credit
            usedCredit = true;
        }

        // Get session info
        const { data: session } = await supabaseAdmin
            .from('conversation_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Save user message
        await supabaseAdmin
            .from('messages')
            .insert([{
                session_id: sessionId,
                user_id: userId,
                role: 'user',
                content: message
            }]);

        // Get conversation history
        const { data: messages } = await supabaseAdmin
            .from('messages')
            .select('role, content')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        // Get user profile for context
        const { data: userProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        // Generate Ayi's response
        const isQuestionnaire = session.session_type === 'questionnaire';
        const ayiResponse = await generateAyiResponse(messages, userProfile, isQuestionnaire);

        // Save Ayi's response
        const { data: savedMessage } = await supabaseAdmin
            .from('messages')
            .insert([{
                session_id: sessionId,
                user_id: userId,
                role: 'assistant',
                content: ayiResponse.message,
                has_correction: ayiResponse.correction !== null,
                correction_text: ayiResponse.correction ? JSON.stringify(ayiResponse.correction) : null
            }])
            .select()
            .single();

        // Update message count or deduct credit
        if (usedCredit) {
            await supabaseAdmin
                .from('user_profiles')
                .update({ credits: profile.credits - 1 })
                .eq('id', userId);

            // Record credit usage
            await supabaseAdmin
                .from('credit_transactions')
                .insert([{
                    user_id: userId,
                    amount: -1,
                    transaction_type: 'usage'
                }]);
        } else {
            await supabaseAdmin
                .from('user_profiles')
                .update({ daily_messages_used: messagesUsed + 1 })
                .eq('id', userId);
        }

        // If questionnaire is complete, extract and save data
        if (isQuestionnaire && messages.length >= 8) { // At least 4 Q&A pairs
            const questionnaireData = extractQuestionnaireData(messages);
            await supabaseAdmin
                .from('user_profiles')
                .update(questionnaireData)
                .eq('id', userId);

            // Mark session as complete
            await supabaseAdmin
                .from('conversation_sessions')
                .update({ is_active: false, ended_at: new Date().toISOString() })
                .eq('id', sessionId);
        }

        res.json({
            message: ayiResponse.message,
            correction: ayiResponse.correction,
            usedCredit,
            remainingFree: usedCredit ? 0 : remainingFree - 1,
            credits: usedCredit ? profile.credits - 1 : profile.credits
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

/**
 * Get conversation history
 */
router.get('/session/:sessionId/messages', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        const { data: messages, error } = await supabaseAdmin
            .from('messages')
            .select('*')
            .eq('session_id', sessionId)
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Parse correction JSON
        const formattedMessages = messages.map(msg => ({
            ...msg,
            correction_text: msg.correction_text ? JSON.parse(msg.correction_text) : null
        }));

        res.json({ messages: formattedMessages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

/**
 * Get user's active sessions
 */
router.get('/sessions', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: sessions, error } = await supabaseAdmin
            .from('conversation_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('started_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.json({ sessions });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

/**
 * End a conversation session
 */
router.post('/session/:sessionId/end', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        const { data, error } = await supabaseAdmin
            .from('conversation_sessions')
            .update({
                is_active: false,
                ended_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ session: data });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
});

/**
 * Translate Chinese text to pinyin and English
 */
router.post('/translate', authenticateUser, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const { sendChatCompletion } = require('../config/openrouter');

        const messages = [
            {
                role: 'system',
                content: 'You are a Chinese language expert. When given Chinese text, provide the pinyin romanization and English translation. Format your response as JSON with keys "pinyin" and "english". Only respond with the JSON object, nothing else.'
            },
            {
                role: 'user',
                content: `Translate this Chinese text:\n${text}`
            }
        ];

        const response = await sendChatCompletion(messages, {
            temperature: 0.3,
            max_tokens: 300
        });

        const content = response.choices[0].message.content;

        // Try to parse JSON response
        let translation;
        try {
            translation = JSON.parse(content);
        } catch (e) {
            // Fallback if response isn't valid JSON
            translation = {
                pinyin: 'Error parsing pinyin',
                english: content
            };
        }

        res.json(translation);
    } catch (error) {
        console.error('Error translating:', error);
        res.status(500).json({ error: 'Failed to translate text' });
    }
});

module.exports = router;
