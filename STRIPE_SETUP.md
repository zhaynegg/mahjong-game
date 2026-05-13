# Stripe Setup Guide for Mahjong Pro Upgrade

## Backend Configuration

1. **Get Stripe API Keys**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Navigate to Developers > API Keys
   - Copy your **Secret Key**

2. **Set Environment Variable**
   - Add to your `.env` file or export:
   ```bash
   export STRIPE_SECRET_KEY="sk_test_..." # or sk_live_... for production
   export FRONTEND_URL="http://localhost:5173" # for local dev, or your production URL
   ```

3. **Backend Already Updated**
   - ✅ `upgrade_pro` endpoint created at `/api/upgrade-pro`
   - ✅ Stripe package installed
   - ✅ Profile model updated with `is_pro` and `stripe_customer_id` fields
   - ✅ Migration applied

## Frontend Configuration

1. **Stripe.js Already Loaded**
   - ✅ Script tag added to `index.html`
   - ✅ `upgradePro()` function created in `App.jsx`
   - ✅ "Upgrade to Pro" button connected

2. **How It Works**
   - User clicks "Upgrade to Pro" button in the menu
   - Frontend calls `/api/upgrade-pro` POST endpoint
   - Backend creates a Stripe Customer and Checkout Session
   - User is redirected to Stripe Checkout
   - After payment, redirect to success page

## Testing

1. **Test Mode**
   - Use Stripe test keys (start with `sk_test_`)
   - Test card: `4242 4242 4242 4242` with any future date and CVC

2. **Verify in Dashboard**
   - Check Stripe Dashboard for test transactions
   - Customers are created automatically on first upgrade attempt

## Production Deployment

1. Replace test keys with live keys (`sk_live_...`)
2. Update `FRONTEND_URL` to your production domain
3. Set up webhook to mark users as Pro after successful payment (optional):
   ```bash
   stripe listen --forward-to yourserver.com/api/stripe-webhook
   ```

## Database Fields

Added to Profile model:
- `is_pro` (Boolean, default False) - Subscription status
- `stripe_customer_id` (String) - Stripe customer ID for recurring charges

## Next Steps (Optional)

- Add webhook handler for automatic `is_pro` status updates
- Implement Pro-only features in the game
- Add subscription management portal
- Implement subscription cancellation
