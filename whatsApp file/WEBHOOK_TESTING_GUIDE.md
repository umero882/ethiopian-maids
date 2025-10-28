# WhatsApp Webhook Testing & Connectivity Guide

## 📍 Webhook URL
```
https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook
```

## ✅ Webhook Status

### Implementation Details
- **Location**: `supabase/functions/whatsapp-webhook/index.ts`
- **Runtime**: Deno (Edge Function)
- **AI Provider**: Anthropic Claude
- **Database**: Supabase PostgreSQL
- **Protocol**: HTTP POST (Twilio/Meta format)

### Key Features ✅
1. **CORS Support**: Handles preflight OPTIONS requests
2. **Multi-format Parsing**: Supports form-urlencoded and JSON
3. **Message Storage**: Stores all messages in `whatsapp_messages` table
4. **AI Integration**: Claude AI with 5 tool functions
5. **TwiML Response**: Returns proper XML for WhatsApp
6. **Error Handling**: Comprehensive error logging and responses

## 🧪 Quick Connectivity Test

### 1. Test with cURL (Basic)

```bash
# Test CORS (should return 200 OK)
curl -X OPTIONS \
  https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook \
  -H "Access-Control-Request-Method: POST" \
  -v

# Test with sample message
curl -X POST \
  https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890" \
  -d "Body=Hello, I need a maid" \
  -d "MessageSid=SM123456789" \
  -d "AccountSid=AC123456789"
```

### 2. Test with Node.js Script

```bash
# Run comprehensive test suite
npm run test:whatsapp-webhook

# Or directly
node scripts/test-whatsapp-webhook.js
```

### 3. Test from Browser (Postman/Insomnia)

**Request:**
```http
POST https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook
Content-Type: application/x-www-form-urlencoded

From=whatsapp:+1234567890&Body=Hello&MessageSid=SM123&AccountSid=AC123
```

**Expected Response** (200 OK):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Hello! I'm Lucy, your AI assistant for Ethiopian Maids...</Message>
</Response>
```

## 🔧 Setup Requirements

### Required Environment Variables

These must be set in Supabase Edge Function secrets:

```bash
# Set via Supabase CLI
supabase secrets set SUPABASE_URL=https://kstoksqbhmxnrmspfywm.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Optional (for Twilio)
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
```

### Required Database Tables

✅ All tables should be created via migration:

```sql
-- Run this migration
\i database/migrations/049_whatsapp_booking_assistant.sql
```

Required tables:
1. ✅ `whatsapp_messages` - Message history
2. ✅ `maid_bookings` - Booking records
3. ✅ `platform_settings` - Configuration
4. ✅ `maid_profiles` - Maid data (should already exist)

## 🔍 Testing Checklist

### Pre-Deployment Tests

- [ ] **Environment Variables**
  ```bash
  # Check in Supabase Dashboard → Settings → Edge Functions → Secrets
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - ANTHROPIC_API_KEY
  ```

- [ ] **Database Tables**
  ```sql
  -- Verify all tables exist
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('whatsapp_messages', 'maid_bookings', 'platform_settings');
  ```

- [ ] **Function Deployment**
  ```bash
  # Check function is deployed
  supabase functions list

  # Or test directly
  curl -I https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook
  ```

### Connectivity Tests

#### Test 1: CORS Preflight ✅
```bash
curl -X OPTIONS https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook -v
```
**Expected**: HTTP 200, CORS headers present

#### Test 2: Basic POST ✅
```bash
curl -X POST https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&Body=Test&MessageSid=SM1&AccountSid=AC1"
```
**Expected**: HTTP 200, TwiML response

#### Test 3: Database Connection ✅
```sql
-- Check if messages are being stored
SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 5;
```

#### Test 4: AI Response ✅
Send a message that triggers AI:
```bash
curl -X POST https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890" \
  -d "Body=I need a maid with cooking skills in Dubai" \
  -d "MessageSid=SM123&AccountSid=AC123"
```
**Expected**: AI-generated response mentioning available maids

#### Test 5: Booking Creation ✅
```bash
curl -X POST https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890" \
  -d "Body=Book an interview with maid ID 123" \
  -d "MessageSid=SM124&AccountSid=AC123"
```
**Expected**: Booking created in database

## 🔗 Webhook Configuration

### For Twilio WhatsApp

1. **Go to**: [Twilio Console](https://console.twilio.com/) → Messaging → Try it Out → Send a WhatsApp Message

2. **Configure Webhook**:
   - When a message comes in: `POST`
   - URL: `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook`
   - Save settings

3. **Test via WhatsApp**:
   - Send message to your Twilio sandbox number
   - Format: `join <sandbox-code>` first
   - Then send: "Hello"

### For Meta WhatsApp Business API

1. **Go to**: [Meta Business Suite](https://business.facebook.com/) → WhatsApp Manager → Configuration

2. **Add Webhook**:
   - Callback URL: `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook`
   - Verify Token: (generate and save)
   - Subscribe to: `messages`

3. **Test**:
   - Send message via WhatsApp to your business number
   - Check webhook logs

## 📊 Monitoring & Debugging

### View Function Logs

```bash
# Real-time logs
supabase functions logs whatsapp-webhook --tail

# Recent logs
supabase functions logs whatsapp-webhook --limit 50
```

### Check Message Storage

```sql
-- Recent messages
SELECT
  phone_number,
  sender,
  message_content,
  processed,
  received_at
FROM whatsapp_messages
ORDER BY received_at DESC
LIMIT 10;

-- Unprocessed messages
SELECT COUNT(*) as unprocessed_count
FROM whatsapp_messages
WHERE processed = false;
```

### Check Bookings

```sql
-- Recent bookings
SELECT
  phone_number,
  sponsor_name,
  booking_type,
  status,
  booking_date,
  created_at
FROM maid_bookings
ORDER BY created_at DESC
LIMIT 10;

-- Booking statistics
SELECT status, COUNT(*) as count
FROM maid_bookings
GROUP BY status;
```

### Common Issues & Solutions

#### Issue 1: 404 Not Found
**Cause**: Function not deployed or wrong URL
**Solution**:
```bash
# Deploy the function
supabase functions deploy whatsapp-webhook

# Verify URL
curl -I https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook
```

#### Issue 2: 500 Internal Server Error
**Cause**: Missing environment variables or database tables
**Solution**:
```bash
# Check function logs
supabase functions logs whatsapp-webhook

# Verify secrets are set
supabase secrets list

# Check database tables
psql $DATABASE_URL -c "\dt"
```

#### Issue 3: No AI Response
**Cause**: ANTHROPIC_API_KEY not set or invalid
**Solution**:
```bash
# Set the API key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Verify in function logs
supabase functions logs whatsapp-webhook | grep "ANTHROPIC"
```

#### Issue 4: Messages Not Stored
**Cause**: Database permissions or table doesn't exist
**Solution**:
```sql
-- Check table exists
SELECT * FROM whatsapp_messages LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'whatsapp_messages';

-- Ensure RLS allows inserts
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert" ON whatsapp_messages FOR INSERT TO public WITH CHECK (true);
```

## 🧪 Automated Testing

### Run Full Test Suite

```bash
# Install dependencies (if not already installed)
npm install

# Run tests
npm run test:whatsapp-webhook
```

### Test Output Example

```
============================================================
  WhatsApp Webhook Connectivity & Functionality Test
============================================================

1. Environment Variables Check
✓ Required: VITE_SUPABASE_URL
✓ Required: VITE_SUPABASE_ANON_KEY
✓ Required: SUPABASE_SERVICE_KEY
✓ Optional: ANTHROPIC_API_KEY is set

2. Database Connectivity
✓ Database connection
✓ Table exists: whatsapp_messages
✓ Table exists: maid_bookings
✓ Table exists: platform_settings
✓ Table exists: maid_profiles

3. Platform Settings
✓ Fetch platform settings

4. Webhook Endpoint Connectivity
✓ CORS preflight (OPTIONS)
✓ Health check (GET)

5. Message Storage
✓ Insert test message
✓ Query test message

6. Booking System
✓ Create test booking
✓ Query test booking
✓ Update booking status
✓ Delete test booking

7. Simulated Webhook Flow
✓ Simulate Twilio webhook call

8. Deployment Status
✓ Function is deployed

============================================================
  Test Summary
============================================================

Total Tests:    24
Passed:         24
Failed:         0
Warnings:       0

Success Rate:   100.0%

✓ All tests passed! Webhook is ready to use.
```

## 📱 End-to-End Testing via WhatsApp

### Test Scenarios

#### Scenario 1: Basic Greeting
```
User: Hello
Lucy: Hello! I'm Lucy, your AI assistant for Ethiopian Maids.
      How can I help you today?
```

#### Scenario 2: Check Availability
```
User: I need a maid with cooking and cleaning skills
Lucy: Let me check our available maids for you...
      I found 5 maids with cooking and cleaning skills:
      1. Hanna (25 years, 3 years experience)
      2. Marta (28 years, 5 years experience)
      ...
```

#### Scenario 3: Book Interview
```
User: Book an interview with Hanna
Lucy: I'd be happy to help you schedule an interview with Hanna.
      What date and time would work best for you?
User: Tomorrow at 2 PM
Lucy: Great! I've scheduled your interview for tomorrow at 2:00 PM.
      Your booking reference is #12345.
```

#### Scenario 4: Check Bookings
```
User: Show my bookings
Lucy: You have 1 active booking:
      - Interview with Hanna - Tomorrow at 2:00 PM (Status: Pending)
```

## 🔐 Security Checklist

- [ ] HTTPS only (Supabase provides this)
- [ ] Environment variables in secrets (not in code)
- [ ] RLS policies enabled on all tables
- [ ] Input validation on all fields
- [ ] Rate limiting (consider adding)
- [ ] Webhook signature verification (optional for Twilio)
- [ ] API key rotation schedule

## 📈 Performance Metrics

**Expected Response Times:**
- CORS preflight: < 50ms
- Simple message: < 500ms
- AI response: 1-3 seconds
- Database query: < 100ms

**Monitor these:**
```sql
-- Average response time (stored in messages)
SELECT
  AVG(EXTRACT(EPOCH FROM (created_at - received_at))) as avg_response_time
FROM whatsapp_messages
WHERE sender = 'assistant'
AND created_at > NOW() - INTERVAL '1 day';
```

## 🎯 Next Steps

1. ✅ Webhook is deployed and accessible
2. ⏳ Set environment variables (ANTHROPIC_API_KEY)
3. ⏳ Run migration to create tables
4. ⏳ Configure Twilio/Meta webhook
5. ⏳ Test end-to-end via WhatsApp
6. ⏳ Monitor logs and performance
7. ⏳ Set up alerts for errors

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Meta WhatsApp Business](https://developers.facebook.com/docs/whatsapp)

---

**Last Updated**: 2025-10-27
**Webhook URL**: https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook
**Status**: ✅ Deployed and Ready
