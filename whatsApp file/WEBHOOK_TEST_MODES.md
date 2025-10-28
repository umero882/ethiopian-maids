# WhatsApp Webhook Test Modes 🧪

## Problem: EarlyDrop Timeout Persists

The webhook is still hitting "EarlyDrop" which means it's shutting down before completing. To diagnose WHERE the problem is, I've added test modes.

## Test Modes Added

### Test Mode 1: PING (Instant Response)
**Send**: "ping"

**Expected Response**:
```
Pong! Webhook is working. Database has 5 test maids ready.
```

**What this tests**:
- ✅ Twilio can reach the webhook
- ✅ Webhook can receive messages
- ✅ Webhook can parse Twilio data
- ✅ Webhook can respond to Twilio
- **Time**: < 1 second

**If this works**: The basic webhook infrastructure is fine.
**If this fails**: Twilio configuration or webhook URL is wrong.

---

### Test Mode 2: TEST (Database Query)
**Send**: "test"

**Expected Response**:
```
Test successful! Found maids:

• Fatima Ahmed (3 yrs) - Doha, Qatar
• Sarah Mohammed (5 yrs) - Dubai, UAE
• Amina Hassan (2 yrs) - Doha, Qatar
```

**What this tests**:
- ✅ All of Test Mode 1 +
- ✅ Supabase client creation
- ✅ Database connection
- ✅ Database query execution
- ✅ Data retrieval
- **Time**: < 2 seconds

**If this works**: Database connectivity is fine.
**If this fails**: Database connection or credentials issue.

---

### Test Mode 3: Normal Message (Full AI Flow)
**Send**: "I need a cleaner in Qatar"

**What this tests**:
- ✅ All of Test Mode 2 +
- ✅ Anthropic API key
- ✅ Claude API call
- ✅ Tool use execution
- ✅ Result formatting
- **Time**: 10-15 seconds (if working)

**If this works**: Everything is working!
**If this fails**: Claude API is the bottleneck or failing.

---

## Testing Protocol

### Step 1: Test PING
Send WhatsApp message: **"ping"**

**Expected**: Instant response within 1-2 seconds

**If it works**: ✅ Basic webhook is working
**If it fails**: ❌ Check Twilio webhook URL configuration

---

### Step 2: Test DATABASE
Send WhatsApp message: **"test"**

**Expected**: Response within 2-3 seconds with maid names

**If it works**: ✅ Database connectivity is working
**If it fails**: ❌ Check Supabase credentials or database

---

### Step 3: Test FULL AI
Send WhatsApp message: **"I need a cleaner"**

**Expected**: Response within 10-15 seconds with detailed results

**If it works**: ✅ Everything is working!
**If it fails**: ❌ Claude API issue (see troubleshooting below)

---

## Interpreting Results

### Scenario 1: PING works, TEST fails
**Problem**: Database connection issue

**Check**:
- Supabase credentials in environment variables
- Database is accessible
- `maid_profiles` table exists

### Scenario 2: PING works, TEST works, FULL AI fails
**Problem**: Claude API issue

**Possible causes**:
1. **ANTHROPIC_API_KEY missing or invalid**
   - Go to Supabase settings → Functions → Environment Variables
   - Verify `ANTHROPIC_API_KEY` exists and is valid (starts with `sk-ant-`)

2. **Claude API timeout**
   - Check https://status.anthropic.com
   - API might be slow or down

3. **Claude API rate limit**
   - You might have hit API rate limits
   - Wait a few minutes and try again

4. **Function timeout (EarlyDrop)**
   - The 25-second timeout protection might not be working
   - Check logs for "Claude API timeout" message

### Scenario 3: None of them work
**Problem**: Webhook not receiving messages at all

**Check**:
1. Twilio webhook URL is correct:
   - Should be: `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook`
   - Check in Twilio Console → WhatsApp Sandbox → Webhook URL

2. Twilio credentials are correct
3. WhatsApp Sandbox is active
4. Test phone number is properly connected

---

## Log Messages to Look For

### For "ping" test:
```
=== WhatsApp webhook received ===
Phone: +1234567890
Message: ping
Ping test - responding immediately
```

### For "test" test:
```
=== WhatsApp webhook received ===
Phone: +1234567890
Message: test
Test mode - querying database directly
```

### For normal message:
```
=== WhatsApp webhook received ===
Phone: +1234567890
Message: I need a cleaner
Storing incoming message...
Anthropic API key found
Calling Claude API...
```

---

## Current Status

✅ **Deployed**: Version with test modes
✅ **PING mode**: Instant response bypass
✅ **TEST mode**: Database-only test
✅ **Diagnostic logging**: Enhanced

## Next Steps

1. **Send "ping"** → Verify basic webhook works
2. **Send "test"** → Verify database connection
3. **Check logs** → See where it fails
4. **Report results** → Tell me which test passed/failed

## If All Tests Pass But Normal Messages Fail

This means the issue is **specifically with Claude API**. Solutions:

1. **Check ANTHROPIC_API_KEY**:
   ```
   Go to: https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/settings/functions
   Verify ANTHROPIC_API_KEY is set correctly
   ```

2. **Check Claude API status**:
   ```
   Visit: https://status.anthropic.com
   Verify API is operational
   ```

3. **Check rate limits**:
   ```
   Wait 5 minutes
   Try again
   ```

4. **Try different model** (if desperate):
   - Update platform_settings table
   - Change `ai_model` to `claude-3-haiku-20240307` (faster, cheaper)

---

**Action Required**: Please send these test messages in order and report which ones work:

1. "ping"
2. "test"
3. "I need a cleaner"

This will tell us exactly where the problem is! 🔍
