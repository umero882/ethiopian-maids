# 🔧 Voice Message Troubleshooting Guide

**Date:** 2025-10-28
**Issue:** Voice messages return error message

---

## ❌ Current Issue

**Error Message:**
> Sorry, I couldn't process your voice message. Please try sending a text message instead, or try again later.

**Root Cause:** OpenAI API key issue

---

## ✅ Solution Applied

### Step 1: Updated API Key
```bash
npx supabase secrets set OPENAI_API_KEY="sk-proj-yDFWr..."
```

✅ **Status:** New key set (digest: `2e94fd63...`)

### Step 2: Verified Deployment
```bash
npx supabase functions deploy whatsapp-webhook --no-verify-jwt
```

✅ **Status:** Function already deployed (no code changes needed)

**Note:** Environment variables are picked up automatically - no redeployment required!

---

## 🧪 How to Test

### Test 1: Send Voice Message

1. Open WhatsApp
2. Chat with **+14155238886**
3. **Record voice message:** "Schedule video interview with Fatima"
4. **Send**

**Expected Response:**
```
Great! Let's schedule a video interview with Fatima Ahmed.

📅 Please select your preferred date:
1. Sunday, Oct 28
2. Monday, Oct 29
...
```

### Test 2: Check Logs (via Supabase Dashboard)

**Go to:** https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/functions/whatsapp-webhook/logs

**Look for:**
```
🎤 Voice message detected! Transcribing...
📥 Downloading audio from Twilio: https://...
✅ Audio downloaded successfully
Audio blob size: XXXX bytes
✅ Transcription successful: Schedule video interview with Fatima
```

**If error appears:**
```
❌ Transcription failed: Error: Whisper API error: 401 - Unauthorized
```
→ API key is invalid

```
❌ Transcription failed: Error: Whisper API error: 429 - Rate limit exceeded
```
→ Too many requests, wait a moment

---

## 🔑 OpenAI API Key Issues

### Issue: API Key Invalid/Expired

**Symptoms:**
- Error message: "Sorry, I couldn't process your voice message..."
- Logs show: "Whisper API error: 401 - Unauthorized"

**Solution:**
1. **Get new API key** from https://platform.openai.com/api-keys
2. **Update key:**
   ```bash
   npx supabase secrets set OPENAI_API_KEY="your-new-key"
   ```
3. **Test immediately** (no redeployment needed)

### Issue: API Key Has No Credits

**Symptoms:**
- Error message: "Sorry, I couldn't process your voice message..."
- Logs show: "Whisper API error: 402 - Payment Required"

**Solution:**
1. **Check OpenAI billing:** https://platform.openai.com/account/billing
2. **Add payment method** if not configured
3. **Add credits** if balance is $0

### Issue: Rate Limit Exceeded

**Symptoms:**
- Intermittent failures
- Logs show: "Whisper API error: 429 - Rate limit exceeded"

**Solution:**
1. **Wait 60 seconds** and try again
2. **Check rate limits:** Free tier has limits on requests per minute
3. **Consider upgrading** OpenAI plan if high volume

---

## 🔍 Verify OpenAI API Key

### Method 1: Check OpenAI Dashboard

1. Go to: https://platform.openai.com/api-keys
2. Find your API key
3. Check status: "Active" or "Expired"
4. Check permissions: "All" or specific models

### Method 2: Test with cURL

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected:** JSON list of available models
**If error:** API key is invalid

### Method 3: Check Current Key in Supabase

```bash
npx supabase secrets list
```

Look for `OPENAI_API_KEY` and verify digest matches after update.

---

## 📊 Check Voice Message Status

### Query Database

```sql
SELECT
  phone_number,
  message_content,
  message_type,
  metadata,
  received_at
FROM whatsapp_messages
WHERE message_type = 'voice'
ORDER BY received_at DESC
LIMIT 5;
```

**If no records:** Voice messages not reaching the system
**If records with NULL transcription:** Transcription failed

---

## 🚨 Common Errors and Solutions

### Error 1: "Missing OPENAI_API_KEY"

**Log Message:**
```
❌ Transcription failed: Error: Missing OPENAI_API_KEY for voice transcription
```

**Solution:**
```bash
npx supabase secrets set OPENAI_API_KEY="your-key"
```

### Error 2: "Failed to download audio"

**Log Message:**
```
❌ Transcription failed: Error: Failed to download audio: 403 Forbidden
```

**Possible Causes:**
- Twilio credentials incorrect
- Audio URL expired (24 hours)

**Solution:**
1. Verify Twilio credentials:
   ```bash
   npx supabase secrets list
   ```
2. Check `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`

### Error 3: "Whisper API error: 401"

**Log Message:**
```
❌ Transcription failed: Error: Whisper API error: 401 - Unauthorized
```

**Solution:**
API key is invalid. Get new key from OpenAI and update:
```bash
npx supabase secrets set OPENAI_API_KEY="new-key"
```

### Error 4: "Whisper API error: 400 - Invalid file format"

**Log Message:**
```
❌ Transcription failed: Error: Whisper API error: 400 - Invalid file format
```

**Possible Causes:**
- Corrupted audio file
- Unsupported format
- File too large (>25 MB)

**Solution:**
Ask user to send shorter, clearer voice message.

---

## 🎯 Current Status

### What's Working
- ✅ Voice message detection
- ✅ Audio download from Twilio
- ✅ Code is correct
- ✅ Error handling is working

### What Needs Attention
- ⚠️ OpenAI API key needs verification
- ⚠️ Need to test with valid key
- ⚠️ Need to monitor first successful transcription

---

## 📝 API Key Update History

### Update 1 (Initial)
**Key:** `sk-proj-NSIp-...`
**Status:** Invalid/Expired
**Digest:** `d3f9d4e8f9ab93d56f5f100cc67c5b7657ba720400a3ad2d037131a32ac9785f`

### Update 2 (Current)
**Key:** `sk-proj-yDFWr...`
**Status:** Needs testing
**Digest:** `2e94fd632bbacf6828dae57721791f84fdc1f1a26bf9fc5caa46e677a9dea7a5`

---

## ✅ Next Steps

1. **Verify OpenAI API key is valid:**
   - Go to https://platform.openai.com/api-keys
   - Check key status
   - Check billing/credits

2. **Test voice message:**
   - Send voice message to +14155238886
   - Check if transcription works

3. **Check logs:**
   - Go to Supabase dashboard
   - View function logs
   - Look for success/error messages

4. **If still failing:**
   - Generate new OpenAI API key
   - Make sure billing is set up
   - Update key again

---

## 🔗 Useful Links

- **OpenAI API Keys:** https://platform.openai.com/api-keys
- **OpenAI Billing:** https://platform.openai.com/account/billing
- **OpenAI Usage:** https://platform.openai.com/usage
- **Supabase Functions:** https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/functions/whatsapp-webhook
- **Function Logs:** https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/functions/whatsapp-webhook/logs

---

## 📞 Support

**If voice messages still not working after:**
1. Verifying API key is valid
2. Confirming billing is set up
3. Testing multiple times

**Then check:**
- Full error logs in Supabase dashboard
- OpenAI API status: https://status.openai.com
- Test with simple text message first to ensure bot works

---

## 🎉 When It Works

**You'll see in logs:**
```
🎤 Voice message detected! Transcribing...
📥 Downloading audio from Twilio: https://api.twilio.com/...
✅ Audio downloaded successfully
Audio blob size: 15234 bytes
✅ Transcription successful: Schedule video interview with Fatima
```

**User receives:**
```
Great! Let's schedule a video interview with Fatima Ahmed.

📅 Please select your preferred date:
...
```

**Database shows:**
```sql
message_type: 'voice'
transcription: 'Schedule video interview with Fatima'
```

🚀 **That's when you know it's working!**
