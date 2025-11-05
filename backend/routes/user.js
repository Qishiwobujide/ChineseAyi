const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

/**
 * Get user profile
 */
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: profile, error } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        // If no profile exists, create one
        if (!profile) {
            const { data: newProfile, error: createError } = await supabaseAdmin
                .from('user_profiles')
                .insert([{
                    id: userId,
                    email: req.user.email,
                    credits: 0,
                    daily_messages_used: 0
                }])
                .select()
                .single();

            if (createError) throw createError;

            return res.json({ profile: newProfile });
        }

        // Reset daily messages if needed
        const today = new Date().toISOString().split('T')[0];
        if (profile.last_reset_date !== today) {
            const { data: updatedProfile } = await supabaseAdmin
                .from('user_profiles')
                .update({
                    daily_messages_used: 0,
                    last_reset_date: today
                })
                .eq('id', userId)
                .select()
                .single();

            return res.json({ profile: updatedProfile });
        }

        res.json({ profile });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

/**
 * Update user profile (questionnaire data)
 */
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { communication_type, usage_context, background, proficiency_level } = req.body;

        const updates = {};
        if (communication_type) updates.communication_type = communication_type;
        if (usage_context) updates.usage_context = usage_context;
        if (background) updates.background = background;
        if (proficiency_level) updates.proficiency_level = proficiency_level;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ profile: data });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
});

/**
 * Check message limit
 */
router.get('/message-limit', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const dailyLimit = parseInt(process.env.DAILY_MESSAGE_LIMIT) || 12;

        const { data: profile, error } = await supabaseAdmin
            .from('user_profiles')
            .select('daily_messages_used, credits, last_reset_date')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // Reset if needed
        const today = new Date().toISOString().split('T')[0];
        let messagesUsed = profile.daily_messages_used;
        if (profile.last_reset_date !== today) {
            messagesUsed = 0;
        }

        const remainingFree = Math.max(0, dailyLimit - messagesUsed);
        const canSendMessage = remainingFree > 0 || profile.credits > 0;

        res.json({
            dailyLimit,
            messagesUsed,
            remainingFree,
            credits: profile.credits,
            canSendMessage
        });
    } catch (error) {
        console.error('Error checking message limit:', error);
        res.status(500).json({ error: 'Failed to check message limit' });
    }
});

/**
 * Purchase credits
 */
router.post('/credits/purchase', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, paymentMethod, paymentReference } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid credit amount' });
        }

        // TODO: Integrate with actual payment processor (Stripe, PayPal, etc.)
        // For now, this is a placeholder

        // Add credits to user
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        const newCredits = (profile.credits || 0) + amount;

        const { error: updateError } = await supabaseAdmin
            .from('user_profiles')
            .update({ credits: newCredits })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Record transaction
        const { error: txError } = await supabaseAdmin
            .from('credit_transactions')
            .insert([{
                user_id: userId,
                amount: amount,
                transaction_type: 'purchase',
                payment_method: paymentMethod,
                payment_reference: paymentReference
            }]);

        if (txError) throw txError;

        res.json({
            success: true,
            credits: newCredits,
            message: `Successfully purchased ${amount} credits`
        });
    } catch (error) {
        console.error('Error purchasing credits:', error);
        res.status(500).json({ error: 'Failed to purchase credits' });
    }
});

/**
 * Get credit transaction history
 */
router.get('/credits/history', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: transactions, error } = await supabaseAdmin
            .from('credit_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.json({ transactions });
    } catch (error) {
        console.error('Error fetching credit history:', error);
        res.status(500).json({ error: 'Failed to fetch credit history' });
    }
});

module.exports = router;
