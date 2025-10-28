# 🚀 Deployment Guide - Option B (Full Implementation)

**Date:** 2025-10-27
**Version:** 20
**Status:** Ready to Deploy

---

## ✅ What's Been Built

### 1. Database (Migration 052) ✅
- Multi-step confirmation workflow
- Notification queue system
- Platform templates for all video platforms
- Helper functions for approvals and confirmations

### 2. Helper Modules ✅
- `interview-helpers.ts` - Date/time/platform selection
- `conversation-state.ts` - Track user's booking progress

### 3. New Webhook (index-v20.ts) ✅
- Interactive conversation flow
- Step-by-step booking (date → time → platform)
- Maid confirmation handling (YES/NO responses)
- Admin notification creation
- Platform-specific instructions

### 4. Reminder System (interview-reminders function) ✅
- Cron job to send reminders
- 24-hour, 1-hour, 15-minute reminders
- Sends to both sponsor and maid
- Platform-specific reminder messages

---

## 📋 Deployment Steps

### Step 1: Verify Database Migration ✅
```bash
# Already applied - verify it's working:
DATABASE_URL="..." node -e "..."
```

**Status:** ✅ Applied and verified

### Step 2: Deploy Helper Modules

The helper modules need to be in the webhook function directory:

```bash
# They're already in the right place:
# supabase/functions/whatsapp-webhook/interview-helpers.ts
# supabase/functions/whatsapp-webhook/conversation-state.ts
```

### Step 3: Deploy Updated Webhook

**Option A: Replace existing webhook**
```bash
# Backup current version
cp supabase/functions/whatsapp-webhook/index.ts supabase/functions/whatsapp-webhook/index-v19-backup.ts

# Replace with new version
cp supabase/functions/whatsapp-webhook/index-v20.ts supabase/functions/whatsapp-webhook/index.ts

# Deploy
npx supabase functions deploy whatsapp-webhook --no-verify-jwt
```

**Option B: Deploy as new function (safer for testing)**
```bash
# Deploy as separate function first
npx supabase functions deploy whatsapp-webhook-v20 --no-verify-jwt

# Test it
# Update Twilio webhook URL temporarily
# If works, then replace main webhook
```

### Step 4: Deploy Reminder Function

```bash
# Deploy reminder cron job
npx supabase functions deploy interview-reminders

# Set up cron schedule (in Supabase dashboard)
# Go to Edge Functions → interview-reminders → Settings
# Add cron: */15 * * * * (every 15 minutes)
```

---

## ⚠️ Important Notes

### **Current Limitation:**
The new webhook (index-v20.ts) has a simplified `processWithClaude()` function. It doesn't include all the existing Claude AI functionality.

### **Two Options:**

**Option 1: Hybrid Approach (Recommended)**
Keep the existing Claude AI processing and only add the interactive booking flow on top:

```typescript
// In index-v20.ts, replace processWithClaude() with the full Claude implementation
// from the current index.ts (lines 200-1000)
```

**Option 2: Gradual Migration**
1. Deploy v20 to a test number first
2. Test the booking flow
3. Add back Claude AI features incrementally
4. Switch production when ready

---

## 🧪 Testing Checklist

### Test 1: Basic Interactive Flow
1. Send: "Schedule video interview with Fatima"
2. Should show 5 date options
3. Reply: "2"
4. Should show 8 time slots
5. Reply: "5"
6. Should show 6 platform options
7. Reply: "1" (WhatsApp)
8. Should get confirmation message

**Expected:** Complete booking created with status `pending_confirmation`

### Test 2: Database Verification
```bash
DATABASE_URL="..." NODE_TLS_REJECT_UNAUTHORIZED=0 node -e "..."
# Check video_interviews table for new record
# Check interview_notifications table for admin notification
```

### Test 3: Maid Confirmation (Manual)
1. Send from maid's phone: "YES"
2. Should update interview status to `scheduled`
3. Sponsor should receive confirmation
4. Agency should be notified (if applicable)

### Test 4: Reminders (Wait for scheduled time)
1. Create interview 25 hours in future
2. Wait for cron job to run
3. Check 24h reminder sent
4. Check 1h and 15min reminders closer to time

---

## 🔧 Configuration Needed

### Twilio Environment Variables
Make sure these are set in Supabase:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### Supabase Environment Variables
Already set:
```
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📊 Monitoring

### After Deployment, Monitor:

**1. Webhook Logs**
```bash
# View webhook logs
supabase functions logs whatsapp-webhook
```

**2. Database Queries**
```sql
-- Pending confirmations
SELECT COUNT(*) FROM video_interviews WHERE status = 'pending_confirmation';

-- Pending notifications
SELECT COUNT(*) FROM interview_notifications WHERE status = 'pending';

-- Recent interviews
SELECT * FROM video_interviews ORDER BY created_at DESC LIMIT 10;
```

**3. Reminder Cron Job**
```bash
# View reminder logs
supabase functions logs interview-reminders
```

---

## 🐛 Troubleshooting

### Issue: User stuck in booking flow
**Solution:**
```sql
-- Conversation state is in-memory, restarts clear it
-- Or wait 10 minutes for automatic expiry
```

### Issue: Admin notifications not appearing
**Check:**
1. Interview created with `pending_confirmation` status?
2. Notification record in `interview_notifications` table?
3. Admin dashboard connected to notification table?

### Issue: Reminders not sending
**Check:**
1. Cron job configured and running?
2. Twilio credentials correct?
3. Interview status is `scheduled`?
4. Reminder flags not already set to true?

---

## 🎯 Deployment Decision

**Before deploying, decide:**

### **Quick Test Deployment (Recommended):**
1. Keep existing webhook as-is (version 19)
2. Create a test WhatsApp number
3. Point test number to new v20 webhook
4. Test complete flow
5. If successful, update production webhook URL

### **Full Production Deployment:**
1. Merge v20 features with existing Claude AI code
2. Deploy as version 20
3. Monitor closely for first few hours
4. Have rollback plan (keep v19 backup)

---

## 📝 Rollback Plan

If something goes wrong:

```bash
# Restore previous version
cp supabase/functions/whatsapp-webhook/index-v19-backup.ts supabase/functions/whatsapp-webhook/index.ts

# Redeploy
npx supabase functions deploy whatsapp-webhook --no-verify-jwt

# Update Twilio webhook URL back to original
```

---

## ✅ Ready to Deploy?

**Current Status:**
- ✅ Database ready
- ✅ Helper modules created
- ✅ New webhook logic implemented
- ✅ Reminder system built
- ⚠️ Needs integration with existing Claude AI code
- ⏳ Awaiting deployment decision

**Next Action:**
Choose deployment approach and I'll help you execute it!

Would you like me to:
A) Merge v20 with existing Claude AI code now?
B) Deploy v20 to test environment first?
C) Create a simpler intermediate version?

Let me know! 🚀
