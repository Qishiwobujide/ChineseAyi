const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const stripe = require('../config/stripe');

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
 * Create Stripe checkout session for purchasing credits
 */
router.post('/credits/create-checkout-session', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, price } = req.body;

        if (!amount || amount <= 0 || !price || price <= 0) {
            return res.status(400).json({ error: 'Invalid amount or price' });
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${amount} Credits - Chinese Ayi`,
                            description: `Purchase ${amount} credits for Chinese Ayi tutor`,
                            images: ['https://i.imgur.com/placeholder.png'], // Optional: Add your logo
                        },
                        unit_amount: Math.round(price * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
            client_reference_id: userId, // Store user ID to credit later
            metadata: {
                userId: userId,
                creditsAmount: amount.toString(),
            },
        });

        res.json({
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

/**
 * Verify payment and get session details
 */
router.get('/credits/verify-payment/:sessionId', authenticateUser, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Verify this session belongs to this user
        if (session.client_reference_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Check if payment was successful
        if (session.payment_status === 'paid') {
            // Check if credits already added (to prevent double-crediting)
            const { data: existingTx } = await supabaseAdmin
                .from('credit_transactions')
                .select('*')
                .eq('payment_reference', sessionId)
                .single();

            if (!existingTx) {
                // Add credits to user
                const creditsToAdd = parseInt(session.metadata.creditsAmount);

                const { data: profile } = await supabaseAdmin
                    .from('user_profiles')
                    .select('credits')
                    .eq('id', userId)
                    .single();

                const newCredits = (profile.credits || 0) + creditsToAdd;

                await supabaseAdmin
                    .from('user_profiles')
                    .update({ credits: newCredits })
                    .eq('id', userId);

                // Record transaction
                await supabaseAdmin
                    .from('credit_transactions')
                    .insert([{
                        user_id: userId,
                        amount: creditsToAdd,
                        transaction_type: 'purchase',
                        payment_method: 'stripe',
                        payment_reference: sessionId
                    }]);

                res.json({
                    success: true,
                    credits: newCredits,
                    amount: creditsToAdd
                });
            } else {
                // Credits already added
                const { data: profile } = await supabaseAdmin
                    .from('user_profiles')
                    .select('credits')
                    .eq('id', userId)
                    .single();

                res.json({
                    success: true,
                    credits: profile.credits,
                    amount: parseInt(session.metadata.creditsAmount),
                    alreadyCredited: true
                });
            }
        } else {
            res.status(400).json({ error: 'Payment not completed' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
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
