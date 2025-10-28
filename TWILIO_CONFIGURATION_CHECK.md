# Twilio WhatsApp Configuration Check

## Problem: No Response from WhatsApp

If you're getting NO response at all, the issue is likely:
1. Twilio can't reach the webhook
2. Twilio webhook URL is wrong
3. WhatsApp Sandbox isn't properly configured

## Correct Webhook URL

Your webhook URL should be:
```
https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook
```

## How to Check Twilio Configuration

### Step 1: Log into Twilio Console
Go to: https://console.twilio.com/

### Step 2: Navigate to WhatsApp Sandbox
1. Click on **Messaging** in left sidebar
2. Click on **Try it out** → **Send a WhatsApp message**
3. OR search for "WhatsApp Sandbox"

### Step 3: Check Webhook Configuration
Look for "Sandbox Configuration" section:

**When a message comes in:**
- Should be set to: `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook`
- HTTP Method: **POST**

### Step 4: Check Your WhatsApp Number
- Is your phone number joined to the sandbox?
- You should have sent a code to the Twilio WhatsApp number
- Format: Usually "join [code]"

## Common Issues

### Issue 1: Wrong Webhook URL
**Wrong URL examples:**
- ❌ Missing `/v1/`: `https://...supabase.co/functions/whatsapp-webhook`
- ❌ Wrong function name: `https://...supabase.co/functions/v1/webhook`
- ❌ Extra slashes: `https://...supabase.co//functions//v1//whatsapp-webhook`

**Correct URL:**
- ✅ `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook`

### Issue 2: Not Joined to Sandbox
You need to send a join message first:
1. Save Twilio's WhatsApp number in your contacts
2. Send: `join [your-sandbox-code]`
3. Wait for confirmation message
4. THEN try sending your messages

### Issue 3: HTTP vs HTTPS
Make sure you're using **HTTPS** not HTTP

### Issue 4: Wrong HTTP Method
Should be **POST** not GET

## Testing Twilio Configuration

### Test 1: Check if Twilio Can Reach Webhook
1. In Twilio Console → WhatsApp Sandbox
2. Click **Test** or **Save** button
3. It should show "Webhook validated successfully" or similar

### Test 2: Check Twilio Logs
1. Go to Twilio Console
2. Click **Monitor** → **Logs** → **Debugger**
3. Look for recent WhatsApp events
4. Check for errors like:
   - "Failed to reach webhook"
   - "Timeout"
   - "Connection refused"
   - "Invalid response"

### Test 3: Manual Webhook Test
You can test the webhook directly using curl:

```bash
curl -X POST https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&Body=ping&MessageSid=TEST123&AccountSid=TEST"
```

Expected response (TwiML):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Pong! Webhook is working. Database has 5 test maids ready.</Message>
</Response>
```

## What to Check NOW

### 1. Twilio Webhook URL
Go to Twilio Console and verify:
- [ ] Webhook URL is exactly: `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook`
- [ ] HTTP Method is: POST
- [ ] URL has HTTPS (not HTTP)

### 2. WhatsApp Sandbox Status
- [ ] You've joined the sandbox (sent "join [code]")
- [ ] You received a confirmation message
- [ ] The sandbox is active

### 3. Twilio Debugger Logs
- [ ] Check for errors in Twilio's debugger
- [ ] Look for webhook call attempts
- [ ] Check for error messages

## Expected Flow

When working correctly:
1. **You send**: "ping" via WhatsApp
2. **Twilio receives**: Your message
3. **Twilio calls**: Supabase webhook URL (POST request)
4. **Webhook responds**: TwiML with message
5. **Twilio sends**: Response back to you via WhatsApp
6. **You receive**: "Pong! Webhook is working..."

## If Still Not Working

### Option 1: Test with Twilio's Built-in Test
In Twilio Console:
1. Go to WhatsApp Sandbox
2. Use the "Test" feature
3. Send a test message
4. Check what happens

### Option 2: Check Twilio Account Status
- Is your Twilio account active?
- Are you using trial or paid account?
- Any service interruptions?

### Option 3: Try Different Message
Sometimes WhatsApp has delays. Try:
- Waiting 30 seconds
- Sending a different message
- Restarting WhatsApp app

## Quick Checklist

Complete this checklist:

- [ ] Twilio webhook URL is correct
- [ ] Webhook HTTP method is POST
- [ ] Webhook URL uses HTTPS
- [ ] I've joined WhatsApp sandbox
- [ ] I received sandbox join confirmation
- [ ] My phone number is registered
- [ ] Twilio account is active
- [ ] No errors in Twilio debugger
- [ ] Supabase function is deployed
- [ ] I'm sending to correct Twilio number

## Next Steps

1. **Verify Twilio webhook URL** (most common issue)
2. **Check Twilio debugger** for errors
3. **Try manual curl test** (see above)
4. **Report back** what you find

---

**Most Likely Issue**: Webhook URL is incorrect or you haven't joined the sandbox properly.

Please check these and report back!
