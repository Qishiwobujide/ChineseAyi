const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const stripe = require('../config/stripe');

/**
 * Stripe Webhook Handler
 * This endpoint receives events from Stripe when payments are completed
 * IMPORTANT: This route must use raw body parsing (not JSON)
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;

                // Only process if payment was successful
                if (session.payment_status === 'paid') {
                    const userId = session.client_reference_id;
                    const creditsToAdd = parseInt(session.metadata.creditsAmount);
                    const sessionId = session.id;

                    // Check if already processed (prevent double-crediting)
                    const { data: existingTx } = await supabaseAdmin
                        .from('credit_transactions')
                        .select('*')
                        .eq('payment_reference', sessionId)
                        .single();

                    if (!existingTx) {
                        // Get current credits
                        const { data: profile } = await supabaseAdmin
                            .from('user_profiles')
                            .select('credits')
                            .eq('id', userId)
                            .single();

                        if (profile) {
                            const newCredits = (profile.credits || 0) + creditsToAdd;

                            // Update credits
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

                            console.log(`✅ Successfully added ${creditsToAdd} credits to user ${userId}`);
                        }
                    } else {
                        console.log(`ℹ️ Credits already added for session ${sessionId}`);
                    }
                }
                break;

            case 'checkout.session.expired':
                console.log('Checkout session expired:', event.data.object.id);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

module.exports = router;
