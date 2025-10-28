# WhatsApp Webhook Debugging Guide

## Issue: WhatsApp Not Responding After Update

The webhook has been updated with enhanced logging and better error handling to diagnose why it's not responding.

## What Was Changed

### 1. Enhanced Logging
Added comprehensive console logging throughout the webhook:
- Request method and URL
- Supabase client creation
- Twilio data parsing
- Phone number and message extraction
- Message storage
- Claude API call status
- Tool execution details
- Error stack traces

### 2. Improved Error Handling
- All errors now return HTTP 200 with TwiML error messages (Twilio expects 200 for successful webhook handling)
- Missing data now returns friendly error messages instead of 400 errors
- All errors include detailed logging for debugging

### 3. Safe Data Access
- Added optional chaining (`?.`) for safer access to Twilio data
- Added fallback values for missing data

## How to Debug

### Step 1: Check Supabase Function Logs

1. Go to: https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/functions
2. Click on `whatsapp-webhook`
3. Click on "Logs" tab
4. Send a test WhatsApp message
5. Watch for logs in real-time

### Step 2: Look for These Log Messages

**Successful Flow:**
```
=== WhatsApp webhook received ===
Method: POST
URL: ...
Supabase client created
Parsed Twilio data: {...}
Phone: +1234567890
Message: I need a cleaner
Storing incoming message...
Message stored successfully
Calling Claude API...
Messages count: 1
Claude API responded
Response content blocks: 2
Executing tool: check_maid_availability
Searching maids with filters: {...}
Executing maid query...
Found 2 maids
```

**Error Indicators:**
```
=== WhatsApp webhook error ===
Error message: ...
Error stack: ...
```

### Step 3: Common Issues and Solutions

#### Issue 1: "Invalid JWT" in logs
**Cause**: Edge function authentication issue
**Solution**: This is expected for direct testing. Twilio's calls should work fine because they don't use JWT.

#### Issue 2: No logs appearing
**Possible Causes:**
1. Twilio webhook URL is incorrect
2. Twilio credentials are wrong
3. WhatsApp number not properly connected

**Check Twilio Configuration:**
1. Go to Twilio Console
2. Check WhatsApp Sandbox settings
3. Verify webhook URL is: `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook`
4. Verify HTTP Method is POST

#### Issue 3: "Missing phone number or message"
**Cause**: Twilio form data not parsed correctly
**Look for**: The "Parsed Twilio data" log to see what Twilio is sending

#### Issue 4: Database query errors
**Cause**: Column name mismatches (should be fixed now)
**Look for**: "Database error" or SQL-related errors in logs

#### Issue 5: Claude API timeout
**Cause**: Claude taking too long to respond
**Look for**: "Calling Claude API..." log without "Claude API responded"
**Solution**: May need to increase timeout or optimize the prompt

### Step 4: Test the Database Query Directly

If logs show database errors, test the query:

```bash
cd "database/test-data"
DATABASE_URL="..." node test_webhook.cjs
```

This will test the exact query the webhook uses.

### Step 5: Verify Environment Variables

Make sure these are set in Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

Check at: https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/settings/functions

## Expected Behavior

When you send a WhatsApp message like "I need a cleaner in Qatar":

1. **Twilio receives the message** and forwards it to the webhook
2. **Webhook logs** `=== WhatsApp webhook received ===`
3. **Parses Twilio data** and logs phone number and message
4. **Stores message** in `whatsapp_messages` table
5. **Calls Claude AI** with conversation history
6. **Claude decides to use** the `check_maid_availability` tool
7. **Webhook queries database** for available maids
8. **Returns results** to Claude
9. **Claude formats response** with maid details
10. **Webhook sends TwiML** response back to Twilio
11. **User receives** WhatsApp message with maid information

## Quick Diagnostic Checklist

- [ ] Twilio webhook URL is correct
- [ ] Twilio HTTP method is POST
- [ ] WhatsApp Sandbox is active
- [ ] Test phone number is connected to sandbox
- [ ] Supabase function logs are accessible
- [ ] Environment variables are set
- [ ] Database has test maid data (5 maids)
- [ ] `whatsapp_messages` table exists
- [ ] `platform_settings` table exists

## What to Report

If the issue persists, provide:

1. **Exact error message** from Supabase logs
2. **Request data** from "Parsed Twilio data" log
3. **Where it fails** (which log message is the last one you see)
4. **Twilio webhook URL** currently configured
5. **Test message** you're sending

## Current Status

✅ Webhook deployed with enhanced logging
✅ Database has 5 test maids
✅ Maid search queries verified working
✅ Error handling improved

⏳ Waiting for logs to diagnose the actual issue

---

**Next Step**: Check the Supabase function logs while sending a test WhatsApp message to see exactly where it's failing.
