# WhatsApp Booking Assistant Setup Guide

## Overview
Complete setup guide for the Ethiopian Maids WhatsApp AI Assistant (Lucy) powered by Twilio and Claude AI.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Twilio Configuration](#twilio-configuration)
4. [Anthropic API Setup](#anthropic-api-setup)
5. [Supabase Edge Function Deployment](#supabase-edge-function-deployment)
6. [Environment Variables](#environment-variables)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- [x] Supabase account and project
- [x] Twilio account (with WhatsApp sandbox or approved business account)
- [x] Anthropic API account
- [x] Node.js 18+ installed
- [x] Supabase CLI installed (`npm install -g supabase`)
- [x] Admin access to Ethiopian Maids platform

---

## Database Setup

### Step 1: Run Migration

Navigate to your project root and run the WhatsApp booking system migration:

```bash
# Using psql
psql -h your-db-host -U postgres -d postgres -f database/migrations/049_whatsapp_booking_system.sql

# Or using Supabase CLI
supabase db push
```

### Step 2: Verify Tables Created

Check that the following tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('whatsapp_messages', 'maid_bookings', 'platform_settings');
```

You should see all three tables listed.

### Step 3: Verify Platform Settings

```sql
SELECT * FROM platform_settings;
```

Ensure the default settings record was created.

---

## Twilio Configuration

### Step 1: Create Twilio Account

1. Sign up at [https://www.twilio.com/console](https://www.twilio.com/console)
2. Navigate to **Console Dashboard**
3. Note your **Account SID** and **Auth Token**

### Step 2: Set Up WhatsApp Sandbox (Development)

For testing:

1. Go to **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Follow instructions to connect your WhatsApp number
3. Send the code provided to the Twilio WhatsApp number
4. Save the **Sandbox Phone Number** (format: `whatsapp:+14155238886`)

### Step 3: Configure Production WhatsApp Number

For production:

1. Apply for WhatsApp Business API access through Twilio
2. Complete Facebook Business verification
3. Configure your business WhatsApp number
4. Wait for approval (typically 1-3 business days)

### Step 4: Configure Webhook URL

Once your Supabase Edge Function is deployed (see below), configure the webhook:

1. In Twilio Console, go to **Messaging** > **Settings** > **WhatsApp Sandbox Settings**
2. Under "When a message comes in", enter your webhook URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/whatsapp-webhook
   ```
3. Set HTTP method to **POST**
4. Click **Save**

---

## Anthropic API Setup

### Step 1: Get API Key

1. Sign up at [https://console.anthropic.com](https://console.anthropic.com)
2. Navigate to **API Keys**
3. Create a new API key
4. Copy and save securely (it won't be shown again)

### Step 2: Verify Access

Test your API key:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

You should receive a response from Claude.

---

## Supabase Edge Function Deployment

### Step 1: Login to Supabase CLI

```bash
supabase login
```

### Step 2: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Set Environment Secrets

Set the required secrets for your edge function:

```bash
# Twilio credentials
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Anthropic API key
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key
supabase secrets set ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Environment
supabase secrets set ENVIRONMENT=production
```

### Step 4: Deploy Edge Function

```bash
# Deploy whatsapp-webhook function
supabase functions deploy whatsapp-webhook

# Verify deployment
supabase functions list
```

### Step 5: Test Edge Function

```bash
# Test with curl
curl -X POST https://your-project-ref.supabase.co/functions/v1/whatsapp-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&Body=Hello&MessageSid=test123&AccountSid=test"
```

---

## Environment Variables

### Frontend (.env)

Add these variables to your `.env` file:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# WhatsApp (optional for frontend display)
VITE_WHATSAPP_SUPPORT_NUMBER=+971501234567
```

### Edge Function Secrets (Supabase)

These should be set using `supabase secrets set`:

```bash
# Required
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Optional
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ENVIRONMENT=production
```

---

## Testing

### Testing Checklist

- [ ] Database migration completed successfully
- [ ] All three tables created (whatsapp_messages, maid_bookings, platform_settings)
- [ ] Edge function deployed and accessible
- [ ] Twilio webhook configured and pointing to edge function
- [ ] WhatsApp sandbox connected to your test number
- [ ] Able to send message from WhatsApp
- [ ] Message appears in admin dashboard
- [ ] AI responds to message
- [ ] Booking creation works
- [ ] Real-time updates work in dashboard

### Manual Testing Steps

#### 1. Test WhatsApp Integration

Send a message to your Twilio WhatsApp number:

```
Hi, I'm looking for a maid
```

You should receive an AI response from Lucy within a few seconds.

#### 2. Test Maid Search

Send:

```
I need a maid with cooking skills and 5 years experience
```

Lucy should respond with available maids matching your criteria.

#### 3. Test Booking Creation

Send:

```
I want to schedule an interview with maid [ID]
```

Lucy should guide you through the booking process.

#### 4. Verify in Dashboard

1. Login to admin panel: `https://yoursite.com/admin/login`
2. Navigate to **WhatsApp Assistant**
3. Check **Messages** tab - you should see your conversation
4. Check **Bookings** tab - you should see any bookings created
5. Verify real-time updates (send another message and watch it appear)

---

## Platform Settings Configuration

### Update Platform Settings

1. Go to Admin Panel → WhatsApp Assistant → Settings
2. Update the following:

   **Platform Information:**
   - Platform Name: Your business name
   - About Platform: Brief description of your services

   **Contact Information:**
   - Support Email: support@yourcompany.com
   - Support Phone: +971501234567
   - Working Hours: 9:00 AM - 6:00 PM EAT, Monday - Saturday

   **Services:**
   - Maid Placement
   - Maid Training
   - Document Processing
   - Interview Scheduling
   - Visa Assistance

   **AI Configuration:**
   - Temperature: 0.7 (default - balance between creativity and focus)
   - Context Messages: 20 (number of previous messages in conversation)
   - Auto-Response: Enabled
   - Business Hours Only: Disabled (for 24/7 support)

3. Click **Save Settings**

---

## Troubleshooting

### Messages Not Appearing in Dashboard

**Problem:** WhatsApp messages are sent but don't appear in the dashboard.

**Solution:**
1. Check edge function logs:
   ```bash
   supabase functions logs whatsapp-webhook
   ```
2. Verify database connection
3. Check RLS policies on `whatsapp_messages` table
4. Ensure admin user has proper permissions

### AI Not Responding

**Problem:** Messages are received but no AI response.

**Solution:**
1. Verify Anthropic API key is set correctly:
   ```bash
   supabase secrets list
   ```
2. Check edge function logs for errors
3. Test Anthropic API key directly (see Anthropic API Setup)
4. Verify model name is correct: `claude-3-5-sonnet-20241022`

### Twilio Webhook Errors

**Problem:** Twilio shows webhook errors in logs.

**Solution:**
1. Verify webhook URL is correct
2. Check edge function is deployed and accessible:
   ```bash
   curl https://your-project-ref.supabase.co/functions/v1/whatsapp-webhook
   ```
3. Verify CORS headers in edge function
4. Check Twilio webhook logs for specific error messages

### Booking Creation Fails

**Problem:** Bookings cannot be created via WhatsApp.

**Solution:**
1. Check `maid_bookings` table exists
2. Verify foreign key constraints (maids table, profiles table)
3. Check edge function logs for specific error
4. Ensure maid IDs are valid UUIDs

### Real-time Updates Not Working

**Problem:** Dashboard doesn't update automatically.

**Solution:**
1. Verify Supabase Realtime is enabled for your project
2. Check subscription code in AdminWhatsAppDashboard component
3. Test with Supabase client directly:
   ```javascript
   supabase.channel('test').subscribe()
   ```
4. Check browser console for WebSocket errors

---

## Performance Optimization

### Caching

The maid availability cache refreshes every 5 minutes. To adjust:

```javascript
// In src/services/maidAvailabilityCache.js
this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
```

### Rate Limiting

To prevent abuse, consider adding rate limiting to the edge function:

```typescript
// Add to whatsapp-webhook/index.ts
const rateLimit = new Map();

// Check rate limit before processing
if (rateLimit.has(phoneNumber)) {
  const lastRequest = rateLimit.get(phoneNumber);
  if (Date.now() - lastRequest < 5000) { // 5 seconds
    return new Response('Rate limit exceeded', { status: 429 });
  }
}
rateLimit.set(phoneNumber, Date.now());
```

---

## Security Best Practices

1. **API Keys:** Never commit API keys to git. Always use environment variables.

2. **RLS Policies:** Ensure Row Level Security is enabled on all WhatsApp tables.

3. **Webhook Validation:** Consider adding Twilio signature validation:
   ```typescript
   import { validateRequest } from 'twilio';

   const isValid = validateRequest(
     twilioAuthToken,
     twilioSignature,
     url,
     params
   );
   ```

4. **Admin Access:** Only admins with `whatsapp.read` permission can access dashboard.

5. **Data Privacy:** Consider implementing message encryption for sensitive data.

---

## Monitoring

### Key Metrics to Monitor

1. **Message Volume:** Track daily message count
2. **Response Time:** Average time for AI to respond
3. **Booking Conversion:** Messages → Bookings ratio
4. **Error Rate:** Failed webhook calls
5. **User Satisfaction:** Track cancelled vs completed bookings

### Set Up Alerts

In Supabase Dashboard:

1. Go to **Database** → **Functions**
2. Create trigger functions for:
   - High error rate (>5% failed messages)
   - Long response times (>10 seconds)
   - Low booking conversion (<10%)

---

## Support

For issues or questions:

- **Documentation:** https://github.com/your-org/ethiopian-maids/docs
- **Email:** support@ethiopianmaids.com
- **GitHub Issues:** https://github.com/your-org/ethiopian-maids/issues

---

## Next Steps

After successful setup:

1. [ ] Monitor first week of conversations
2. [ ] Adjust AI temperature based on response quality
3. [ ] Fine-tune system prompt for better responses
4. [ ] Add more available services
5. [ ] Train support team on dashboard usage
6. [ ] Set up backup/recovery procedures
7. [ ] Create user documentation for sponsors

---

## Changelog

**v1.0.0** (2025-01-26)
- Initial release
- WhatsApp integration with Twilio
- Claude AI assistant (Lucy)
- Admin dashboard with real-time updates
- Booking management system
- Maid availability caching

---

**Last Updated:** January 26, 2025
**Version:** 1.0.0
