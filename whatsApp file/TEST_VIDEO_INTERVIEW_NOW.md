# 🧪 Video Interview Testing - Step by Step Guide

**Status:** Ready to Test
**Version:** 16
**Date:** 2025-10-27

---

## 📱 Step 1: Basic Test - Schedule Interview

### What to Do:
1. Open WhatsApp on your phone
2. Go to your conversation with Twilio WhatsApp number
3. Send this **exact message**:

```
Schedule video interview with Fatima tomorrow at 3pm
```

### What to Expect:

**✅ SUCCESS Response:**
```
✅ Video Interview Scheduled!

📹 Interview Details:
• Maid: Fatima Ahmed
• Date: Mon, Oct 28, 2025, 03:00 PM
• Duration: 30 minutes
• Platform: WHATSAPP VIDEO
• Link: https://wa.me/+251XXXXXXXXX?text=Video%20Interview%20Scheduled

⏰ I'll send you reminders before the interview.

Would you like me to send you Fatima Ahmed's profile details to review?
```

**❌ FAILURE Responses (if something's wrong):**
- "I encountered an issue: Maid not found" → Maid name incorrect
- "Interview date must be in the future" → Date parsing issue
- "System configuration error" → Check logs
- No response → Check Twilio configuration

---

## 📊 Step 2: Verify Database Record

After sending the message, let's check if the interview was saved:

```bash
cd "C:\Users\umera\OneDrive\Documents\ethiopian maids V.0.2"

DATABASE_URL="postgres://postgres.kstoksqbhmxnrmspfywm:zU8s5wq7lJvc5bP1@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require" NODE_TLS_REJECT_UNAUTHORIZED=0 node -e "const {Client} = require('pg'); const c = new Client({connectionString: process.env.DATABASE_URL}); c.connect().then(() => c.query('SELECT id, maid_id, sponsor_phone, scheduled_date, interview_type, status, meeting_link, created_at FROM video_interviews ORDER BY created_at DESC LIMIT 1')).then(r => {if(r.rows.length > 0) {console.log('✅ Latest video interview found:\n'); const vi = r.rows[0]; console.log('ID:', vi.id); console.log('Maid ID:', vi.maid_id); console.log('Phone:', vi.sponsor_phone); console.log('Date:', new Date(vi.scheduled_date).toLocaleString()); console.log('Type:', vi.interview_type); console.log('Status:', vi.status); console.log('Link:', vi.meeting_link || 'None'); console.log('Created:', new Date(vi.created_at).toLocaleString());} else {console.log('❌ No interviews found in database');} c.end();}).catch(e => {console.log('Error:', e.message); c.end();})"
```

**Expected Output:**
```
✅ Latest video interview found:

ID: [UUID]
Maid ID: [UUID]
Phone: whatsapp:+XXXXXXXXXXX
Date: 10/28/2025, 3:00:00 PM
Type: whatsapp_video
Status: scheduled
Link: https://wa.me/+251XXXXXXXXX?text=Video%20Interview%20Scheduled
Created: 10/27/2025, 4:33:45 PM
```

---

## 📝 Step 3: Alternative Test Cases

### Test 3A: Different Maid
**Send:**
```
Schedule video interview with Sarah tomorrow at 2pm
```

**Expected:** Interview created with Sarah Mohammed

---

### Test 3B: Different Platform (Zoom)
**Send:**
```
Book Zoom interview with Amina for Friday at 10am
```

**Expected:** Interview created with `interview_type: zoom`

---

### Test 3C: Phone Interview
**Send:**
```
Schedule phone call with Maryam next Monday at 4pm
```

**Expected:** Interview created with `interview_type: phone_call`

---

### Test 3D: Custom Duration
**Send:**
```
Schedule 45 minute video interview with Fatima on Wednesday at 1pm
```

**Expected:** Interview with `duration_minutes: 45`

---

## 🔍 Step 4: View Interviews

**Send to WhatsApp:**
```
Show my upcoming interviews
```

**Expected Response (if you have interviews):**
```
📅 You have 2 upcoming video interviews:

1. Fatima Ahmed
   📅 Mon, Oct 28, 03:00 PM
   📹 whatsapp video
   ⏱️  30 minutes
   Status: scheduled

2. Sarah Mohammed
   📅 Mon, Oct 28, 02:00 PM
   📹 whatsapp video
   ⏱️  30 minutes
   Status: scheduled
```

**Expected Response (if no interviews):**
```
You have no upcoming interviews scheduled.
```

---

## ❌ Step 5: Error Handling Tests

### Test 5A: Invalid Maid Name
**Send:**
```
Schedule video interview with INVALID_NAME tomorrow
```

**Expected:**
```
I encountered an issue: Maid not found

Could not find the maid you want to interview. Please try searching again.
```

---

### Test 5B: Past Date
**Send:**
```
Schedule video interview with Fatima yesterday
```

**Expected:**
```
I encountered an issue: Past date

Interview date must be in the future. Please choose a later date.
```

---

## 🗑️ Step 6: Cancel Interview

**Send:**
```
Cancel my video interview with Fatima
```

**Expected:**
```
✅ Done! Your request has been processed successfully.
```

Then verify with:
```
Show my upcoming interviews
```

The cancelled interview should not appear (or show as cancelled).

---

## 📊 Step 7: Full Database Check

Check all interviews in the database:

```bash
DATABASE_URL="postgres://postgres.kstoksqbhmxnrmspfywm:zU8s5wq7lJvc5bP1@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require" NODE_TLS_REJECT_UNAUTHORIZED=0 node -e "const {Client} = require('pg'); const c = new Client({connectionString: process.env.DATABASE_URL}); c.connect().then(() => c.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = $$scheduled$$ THEN 1 END) as scheduled, COUNT(CASE WHEN status = $$cancelled$$ THEN 1 END) as cancelled FROM video_interviews')).then(r => {console.log('Video Interviews Summary:'); console.log('- Total:', r.rows[0].total); console.log('- Scheduled:', r.rows[0].scheduled); console.log('- Cancelled:', r.rows[0].cancelled); return c.query('SELECT scheduled_date, interview_type, status FROM video_interviews ORDER BY created_at DESC LIMIT 5');}).then(r => {console.log('\nRecent Interviews:'); r.rows.forEach((row, i) => {console.log((i+1) + '. ' + new Date(row.scheduled_date).toLocaleString() + ' - ' + row.interview_type + ' - ' + row.status);});c.end();}).catch(e => {console.log('Error:', e.message); c.end();})"
```

---

## ✅ Test Results Checklist

Mark each test as you complete it:

### Core Functionality
- [ ] Schedule video interview (basic)
- [ ] View upcoming interviews
- [ ] Cancel video interview
- [ ] Interview saved to database

### Platform Options
- [ ] WhatsApp Video (default)
- [ ] Zoom interview
- [ ] Google Meet interview
- [ ] Phone call

### Maid Selection
- [ ] Fatima Ahmed
- [ ] Sarah Mohammed
- [ ] Amina Hassan
- [ ] Other maids

### Date/Time Options
- [ ] Tomorrow at specific time
- [ ] Friday/Monday (named days)
- [ ] Specific date (Oct 30)
- [ ] Different times (morning/afternoon)

### Error Handling
- [ ] Invalid maid name
- [ ] Past date
- [ ] Missing information

### Advanced Features
- [ ] Custom duration (45 min, 1 hour)
- [ ] With notes/requirements
- [ ] Multiple interviews
- [ ] View empty list

---

## 🐛 Troubleshooting

### Issue: No response from WhatsApp
**Possible Causes:**
1. Webhook not deployed (check version 16)
2. Twilio configuration wrong
3. EarlyDrop error (check logs)

**Solution:**
1. Send "ping" to verify webhook works
2. Check Supabase logs for errors
3. Verify deployment: `npx supabase functions list`

---

### Issue: Interview created but wrong data
**Check:**
1. Maid ID matches expected maid
2. Date is parsed correctly (timezone aware)
3. Interview type is correct
4. Meeting link generated (for WhatsApp Video)

**Solution:** Run database query to inspect actual data

---

### Issue: Can't view interviews
**Check:**
1. Are interviews in database? (run database check)
2. Is phone number matching?
3. Are interviews in the future?

**Solution:** Check with database query, verify phone format

---

## 📈 Expected Performance

| Operation | Expected Time | Actual Time |
|-----------|---------------|-------------|
| Schedule Interview | < 5 seconds | ___ seconds |
| View Interviews | < 3 seconds | ___ seconds |
| Cancel Interview | < 3 seconds | ___ seconds |

---

## 📞 Quick Test Script

Copy and paste these commands one by one into WhatsApp:

```
1. Schedule video interview with Fatima tomorrow at 3pm
   → Wait for response

2. Show my upcoming interviews
   → Should show the interview

3. Schedule video interview with Sarah tomorrow at 2pm
   → Creates second interview

4. Show my upcoming interviews
   → Should show both interviews

5. Cancel my video interview with Fatima
   → Cancels first interview

6. Show my upcoming interviews
   → Should show only Sarah's interview
```

---

## ✅ Success Criteria

**Feature is WORKING if:**
1. ✅ You can schedule interviews via WhatsApp
2. ✅ Interviews are saved to database
3. ✅ You can view your interviews
4. ✅ You can cancel interviews
5. ✅ Meeting links are generated (WhatsApp Video)
6. ✅ Error messages are helpful
7. ✅ Response time < 5 seconds

**Feature NEEDS WORK if:**
1. ❌ No response from WhatsApp
2. ❌ Interviews not saved to database
3. ❌ Wrong maid selected
4. ❌ Date parsed incorrectly
5. ❌ Error messages confusing
6. ❌ Response time > 10 seconds

---

## 📊 Report Your Results

After testing, report:

**Working:**
- [ ] Basic scheduling
- [ ] View interviews
- [ ] Cancel interviews
- [ ] Database saving
- [ ] Meeting links

**Issues Found:**
- Issue 1: ___
- Issue 2: ___
- Issue 3: ___

**Performance:**
- Average response time: ___ seconds
- Success rate: ___/___

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅
1. Mark Phase 2 as complete
2. Celebrate! 🎉
3. Move to Phase 3 (Multi-Language) or Phase 4 (Payments)

### If Some Tests Fail ⚠️
1. Document issues found
2. Debug and fix problems
3. Redeploy and retest

### If Major Issues ❌
1. Check Supabase logs for errors
2. Verify database schema
3. Test with "ping" command first
4. Review error messages

---

**Ready? Start with Test 1!** 🚀

Send this to WhatsApp:
```
Schedule video interview with Fatima tomorrow at 3pm
```

Then come back here and let me know what response you got!
