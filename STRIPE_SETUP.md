# 🔐 Stripe Payment Integration Setup Guide

This guide will walk you through setting up Stripe payments for the Chinese Ayi application.

## 📋 Prerequisites

- Stripe account (create one at [stripe.com](https://stripe.com))
- Chinese Ayi app already running locally

## 🚀 Setup Steps

### 1. Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Start now" and create an account
3. Complete the registration process
4. You'll be in **Test Mode** by default (perfect for development)

### 2. Get Your API Keys

1. In your Stripe Dashboard, click **Developers** in the left sidebar
2. Click **API keys**
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - Not needed for this backend-only setup
   - **Secret key** (starts with `sk_test_...`) - This is what you need!
4. Click "Reveal test key" to see your secret key
5. **Copy the Secret key** - you'll add this to your `.env` file

### 3. Configure Backend Environment Variables

1. Open `/backend/.env` file (create it from `.env.example` if it doesn't exist)
2. Add your Stripe secret key:

```env
# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=  # Leave empty for now, we'll add this in step 5

# Frontend URL (for Stripe redirects)
FRONTEND_URL=http://localhost:3000
```

3. Save the file

### 4. Test the Integration (Local Development)

At this point, you can test purchases locally:

1. **Start your backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start your frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Test a purchase:**
   - Log in to your app
   - Click the credits button (💎)
   - Click "Purchase" on any package
   - You'll be redirected to Stripe Checkout
   - Use Stripe's test card number: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)
   - Any billing details
   - Click "Pay"
   - You'll be redirected back to the success page
   - Credits will be added to your account!

### 5. Set Up Webhooks (For Production Security)

Webhooks ensure that credits are added even if the user closes their browser before returning from Stripe.

#### Option A: Local Development with Stripe CLI

1. **Install Stripe CLI:**
   - Mac: `brew install stripe/stripe-cli/stripe`
   - Windows: Download from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
   - Linux: Download from above link

2. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server:**
   ```bash
   stripe listen --forward-to localhost:3001/api/webhook/stripe
   ```

4. **Copy the webhook signing secret:**
   - The CLI will display a webhook signing secret (starts with `whsec_...`)
   - Copy this and add it to your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

5. **Restart your backend server** to load the new environment variable

6. **Test the webhook:**
   - Make a test purchase
   - Watch the Stripe CLI output to see the webhook events

#### Option B: Production Webhooks

When deploying to production:

1. Deploy your application to your server (e.g., Heroku, AWS, Vercel)

2. In Stripe Dashboard:
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - Enter your webhook URL: `https://your-domain.com/api/webhook/stripe`
   - Select events to listen to:
     - `checkout.session.completed`
     - `checkout.session.expired`
   - Click **Add endpoint**

3. **Copy the webhook signing secret:**
   - Click on your newly created webhook
   - Click **Reveal** next to "Signing secret"
   - Copy the secret (starts with `whsec_...`)
   - Add it to your production environment variables

## 🧪 Testing with Test Cards

Stripe provides test cards for different scenarios:

| Card Number         | Description          |
|---------------------|----------------------|
| 4242 4242 4242 4242 | Successful payment   |
| 4000 0000 0000 9995 | Declined card        |
| 4000 0025 0000 3155 | Requires 3D Secure   |

Use any:
- Future expiry date
- Any 3-digit CVC
- Any billing details

## 💰 Credit Packages

The app offers 4 credit packages:

| Package | Credits | Price  | Per Credit | Save |
|---------|---------|--------|------------|------|
| Small   | 50      | $4.99  | $0.100     | -    |
| Medium  | 150     | $12.99 | $0.087     | 15%  |
| Large   | 300     | $24.99 | $0.083     | 20%  |
| XL      | 1000    | $79.99 | $0.080     | 33%  |

## 🔒 Security Features

- ✅ **Secure Checkout**: All payment data handled by Stripe (PCI compliant)
- ✅ **Webhook Verification**: Signatures verified to prevent fraud
- ✅ **Double-Credit Prevention**: Checks prevent crediting twice for same payment
- ✅ **User Verification**: Payment sessions linked to user IDs
- ✅ **HTTPS Required**: Webhooks require HTTPS in production

## 📊 Monitoring Payments

### In Stripe Dashboard

1. Go to **Payments** to see all transactions
2. Go to **Customers** to see customer details
3. Go to **Developers** → **Webhooks** to monitor webhook deliveries
4. Go to **Developers** → **Events** to see all events

### In Your App Database

Check the `credit_transactions` table in Supabase to see all credit purchases and usage.

## 🚨 Troubleshooting

### Credits not added after payment?

1. **Check backend logs** - Look for errors in payment processing
2. **Check Stripe webhook logs** - Go to Developers → Webhooks → Your webhook → Events
3. **Verify webhook secret** - Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
4. **Check database** - Look in `credit_transactions` table for the payment reference

### Payment fails immediately?

1. **Check Stripe dashboard** - Look in Payments for error details
2. **Verify API keys** - Make sure you're using test keys for development
3. **Check FRONTEND_URL** - Make sure it matches your actual frontend URL

### Webhook signature verification fails?

1. **Make sure webhook route is BEFORE bodyParser** - Check `server.js`
2. **Verify webhook secret** - Make sure it matches your Stripe endpoint
3. **Check request is raw** - Webhook endpoint must receive raw body

## 🎓 Going Live

When ready for production:

1. **Verify your Stripe account** - Complete business verification
2. **Switch to live mode** in Stripe Dashboard
3. **Get live API keys** - Replace test keys with live keys
4. **Set up production webhooks** - Use your production URL
5. **Test with real (small) purchase** first
6. **Update environment variables** on your production server:
   ```env
   STRIPE_SECRET_KEY=sk_live_your_live_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
   ```

## 📚 Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

## 💡 Tips

- **Always test in Test Mode first** before going live
- **Monitor webhook deliveries** in Stripe Dashboard
- **Keep webhook secrets secure** - Never commit to git
- **Use Stripe CLI for local development** - Makes testing easier
- **Check Stripe logs** when troubleshooting - Very detailed

---

Need help? Check the [Stripe Discord](https://stripe.com/discord) or [contact Stripe support](https://support.stripe.com/)!
