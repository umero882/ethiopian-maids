# 🎤 Voice Message Feature - Quick Test Guide

**Status:** READY TO TEST
**Deployed:** Version 31 (119.2kB)

---

## ✅ Quick Test (2 Minutes)

### Step 1: Send Voice Message
1. Open WhatsApp
2. Start chat with **+14155238886**
3. Hold microphone icon and say:
   > "Hello, I want to schedule a video interview with Fatima"
4. Send the voice message

### Step 2: Verify Response
**Expected Response (within 5-10 seconds):**
```
Great! Let's schedule a video interview with Fatima Ahmed.

📅 Please select your preferred date:

1. Sunday, Oct 28
2. Monday, Oct 29
3. Tuesday, Oct 30
4. Wednesday, Oct 31
5. Thursday, Nov 1

Reply with the number (1-5)
```

### Step 3: Complete Flow
Continue with text or voice:
- **Text:** Reply with `2` for date
- **Voice:** Say "number two"

---

## 🔍 Check Logs

```bash
npx supabase functions logs whatsapp-webhook --follow
```

**Look for:**
```
🎤 Voice message detected! Transcribing...
📥 Downloading audio from Twilio
✅ Audio downloaded successfully
✅ Transcription successful: Hello, I want to schedule...
```

---

## 💡 Test Variations

### Short Voice Message (5 sec)
> "Ping"

**Expected:** "Pong! Webhook is working..."

### Medium Voice Message (15 sec)
> "Hi, I'm looking for an experienced maid with cooking and cleaning skills for a family of four in Dubai"

**Expected:** Claude AI response with available maids

### Long Voice Message (30-60 sec)
> "Hello, my name is Ahmed. I'm looking for a maid with at least 5 years of experience. She should be good at cooking, cleaning, and taking care of children. We have two kids, ages 3 and 5. We live in Dubai Marina. I'd like to schedule interviews as soon as possible."

**Expected:** Claude AI processes full request and responds appropriately

---

## ❌ Error Scenarios to Test

### Test 1: Corrupted Audio
- Send a very short voice message (< 1 second)
- **Expected:** Error message asking to try text instead

### Test 2: Background Noise
- Record voice message with loud background noise
- **Expected:** Transcription may be inaccurate but should still work

---

## 📊 Verify Database

```sql
-- Check voice messages
SELECT
  phone_number,
  LEFT(message_content, 50) as message,
  message_type,
  metadata->>'transcription' as transcription,
  received_at
FROM whatsapp_messages
WHERE message_type = 'voice'
ORDER BY received_at DESC
LIMIT 5;
```

---

## 💰 Check Costs

**OpenAI Dashboard:** https://platform.openai.com/usage

**Expected cost per test:**
- 5 sec voice: ~$0.0005
- 15 sec voice: ~$0.0015
- 60 sec voice: ~$0.006

---

## ✅ Success Checklist

- [ ] Voice message sent successfully
- [ ] Received date options response
- [ ] Logs show transcription
- [ ] Database has voice record
- [ ] Costs appear in OpenAI dashboard

---

## 🐛 Troubleshooting

**No response?**
- Check webhook URL in Twilio Console
- Verify OPENAI_API_KEY is set
- Check Supabase function logs

**Transcription wrong?**
- Try speaking more clearly
- Reduce background noise
- Check audio quality

**Error message?**
- Check full logs for details
- Verify all environment variables
- Test with shorter voice message

---

## 🚀 Ready to Test!

Just send a voice message to **+14155238886** and see the magic happen! 🎤✨
