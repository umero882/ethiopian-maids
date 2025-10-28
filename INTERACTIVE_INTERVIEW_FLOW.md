# 🎯 Interactive Video Interview Scheduling Flow

**Version:** 2.0
**Date:** 2025-10-27
**Status:** Implementation Ready

---

## 📋 Complete User Flow

### **Step 1: User Initiates Request**
**User says:** "I want to schedule a video interview with Fatima"

**Bot Response:**
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

---

### **Step 2: Date Selection**
**User says:** "2"

**Bot Response:**
```
Perfect! Monday, Oct 29 it is.

⏰ Please select your preferred time:

Morning:
1. 9:00 AM
2. 10:00 AM
3. 11:00 AM

Afternoon:
4. 2:00 PM
5. 3:00 PM
6. 4:00 PM

Evening:
7. 6:00 PM
8. 7:00 PM

Reply with the number (1-8)
```

---

### **Step 3: Time Selection**
**User says:** "5"

**Bot Response:**
```
Great choice! 3:00 PM on Monday, Oct 29.

📹 Please select your preferred video call platform:

1. WhatsApp Video Call
2. Zoom Meeting 📥
3. Google Meet
4. Phone Call
5. Microsoft Teams 📥
6. Skype 📥

💡 Platforms marked with 📥 require downloading an app
Reply with the number (1-6)
```

---

### **Step 4: Platform Selection**

#### **Option A: WhatsApp Video (No Download)**
**User says:** "1"

**Bot Response:**
```
✅ Interview Request Submitted!

📋 Details:
• Maid: Fatima Ahmed
• Date: Monday, Oct 29
• Time: 3:00 PM
• Platform: WhatsApp Video Call

📞 Meeting Details:
We will call you on WhatsApp video at the scheduled time.

⏳ Next Steps:
1. Admin will confirm with Fatima ✓
2. Fatima will confirm availability ⏳
3. You'll receive final confirmation
4. Reminders will be sent before the interview

💡 Make sure your camera and microphone are working!

📧 Need help? Contact support.
```

#### **Option B: Zoom (Requires Download)**
**User says:** "2"

**Bot Response:**
```
✅ Interview Request Submitted!

📋 Details:
• Maid: Fatima Ahmed
• Date: Monday, Oct 29
• Time: 3:00 PM
• Platform: Zoom Meeting

📥 Download App:
https://zoom.us/download

📞 Meeting Link:
https://zoom.us/j/interview-abc12345
(Link will be activated at scheduled time)

⏳ Next Steps:
1. Download Zoom app now
2. Admin will confirm with Fatima ✓
3. Fatima will confirm availability ⏳
4. You'll receive final confirmation
5. Click meeting link at scheduled time

Setup Instructions:
1. Download Zoom from the link above
2. Install the app on your phone or computer
3. At 3:00 PM on Oct 29, click the meeting link
4. Allow camera and microphone access
5. Join the meeting

📧 Need help? Contact support.
```

#### **Option C: Google Meet (Browser-Based)**
**User says:** "3"

**Bot Response:**
```
✅ Interview Request Submitted!

📋 Details:
• Maid: Fatima Ahmed
• Date: Monday, Oct 29
• Time: 3:00 PM
• Platform: Google Meet

📞 Meeting Link:
https://meet.google.com/interview-abc12345

⏳ Next Steps:
1. Admin will confirm with Fatima ✓
2. Fatima will confirm availability ⏳
3. You'll receive final confirmation
4. Click meeting link at scheduled time

💡 No download needed - works in any browser!
Or download Google Meet app for better experience.

📧 Need help? Contact support.
```

#### **Option D: Phone Call**
**User says:** "4"

**Bot Response:**
```
✅ Interview Request Submitted!

📋 Details:
• Maid: Fatima Ahmed
• Date: Monday, Oct 29
• Time: 3:00 PM
• Platform: Phone Call

📞 Call Details:
We will call you at 3:00 PM on your registered phone number.

⏳ Next Steps:
1. Admin will confirm with Fatima ✓
2. Fatima will confirm availability ⏳
3. You'll receive final confirmation
4. Be available at the scheduled time

💡 Find a quiet place for the call!

📧 Need help? Contact support.
```

---

## 🔄 Backend Workflow (Behind the Scenes)

### **Phase 1: Interview Request Created**
1. Interview record created with status: `pending_confirmation`
2. Platform instructions generated and saved
3. Meeting link created (if applicable)

### **Phase 2: Admin Notification**
**Automatic notification sent to admin dashboard:**
```
🔔 New Interview Request

Maid: Fatima Ahmed
Sponsor: +971501234567
Date: Monday, Oct 29, 2025
Time: 3:00 PM
Platform: Zoom Meeting
Wait Time: < 1 minute

[Approve] [Reject]
```

### **Phase 3: Admin Approval**
**Admin clicks "Approve":**
1. Status changes to: `confirmed_by_admin`
2. Notification sent to maid's phone

**Maid receives WhatsApp message:**
```
🔔 Interview Request

A sponsor wants to interview you!

📋 Details:
Date: Monday, Oct 29
Time: 3:00 PM
Platform: Zoom Meeting

Please confirm your availability:
Reply "YES" to confirm
Reply "NO" to decline
```

### **Phase 4: Maid Confirmation**
**Maid replies: "YES"**

1. Status changes to: `scheduled`
2. Notifications sent to:
   - Sponsor (confirmation)
   - Agency (if maid is from agency)

**Sponsor receives:**
```
✅ Interview Confirmed!

Great news! Fatima Ahmed confirmed the interview.

📋 Final Details:
• Date: Monday, Oct 29
• Time: 3:00 PM
• Platform: Zoom Meeting

📞 Meeting Link:
https://zoom.us/j/interview-abc12345

⏰ Reminders:
• 24 hours before: Sunday, Oct 28 at 3:00 PM
• 1 hour before: Monday, Oct 29 at 2:00 PM
• 15 minutes before: Monday, Oct 29 at 2:45 PM

📥 Download Zoom: https://zoom.us/download

See you there! 🎉
```

**Agency receives (if applicable):**
```
📋 Interview Scheduled

Your maid Fatima Ahmed has a confirmed interview:

Sponsor: +971501234567
Date: Monday, Oct 29, 2025
Time: 3:00 PM
Platform: Zoom Meeting

Status: Confirmed
```

### **Phase 5: Automatic Reminders**
**24 hours before:**
```
⏰ Reminder: Video Interview Tomorrow

Your interview with Fatima Ahmed is in 24 hours!

📋 Details:
• Date: Tomorrow (Monday, Oct 29)
• Time: 3:00 PM
• Platform: Zoom Meeting

📞 Meeting Link:
https://zoom.us/j/interview-abc12345

Make sure Zoom app is installed!
```

**1 hour before:**
```
⏰ Reminder: Interview in 1 Hour

Your interview with Fatima Ahmed starts at 3:00 PM (in 1 hour)

📞 Meeting Link:
https://zoom.us/j/interview-abc12345

Click the link to join at 3:00 PM
```

**15 minutes before:**
```
⏰ Final Reminder: Interview in 15 Minutes

Your interview with Fatima Ahmed starts at 3:00 PM

📞 Click here to join:
https://zoom.us/j/interview-abc12345

See you there! 🎥
```

---

## 🚫 Error Scenarios

### **Scenario 1: Maid Not Available**
**Maid replies: "NO" with reason**

**System:**
1. Status changes to: `rejected`
2. Sponsor is notified

**Sponsor receives:**
```
❌ Interview Request Declined

Unfortunately, Fatima Ahmed is not available at the requested time.

Reason: Already booked for that time slot

Would you like to:
1. Schedule at a different time
2. View other available maids
3. Contact support

Reply with 1, 2, or 3
```

### **Scenario 2: Admin Rejects**
**Admin clicks "Reject"**

**Sponsor receives:**
```
❌ Interview Request Could Not Be Confirmed

We're sorry, but we couldn't confirm the interview with Fatima Ahmed at this time.

Reason: Maid is no longer available

Would you like to:
1. View other available maids
2. Contact support for assistance

Reply with 1 or 2
```

### **Scenario 3: Timeout (No Response)**
**After 24 hours with no admin response:**

**Sponsor receives:**
```
⏳ Interview Request Pending

Your interview request with Fatima Ahmed is still pending confirmation.

We'll notify you as soon as it's confirmed.

Estimated confirmation time: Within 24 hours

Need immediate assistance? Contact support.
```

---

## 📊 Database States

| Status | Description | Who Can See |
|--------|-------------|-------------|
| `pending_confirmation` | Waiting for admin to approve | Admin |
| `confirmed_by_admin` | Admin approved, waiting for maid | Admin, Maid |
| `scheduled` | Fully confirmed by all parties | Everyone |
| `confirmed` | Both parties ready | Everyone |
| `in_progress` | Interview happening now | Everyone |
| `completed` | Interview finished | Everyone |
| `cancelled` | User cancelled | Everyone |
| `rejected` | Maid or admin declined | Admin, Sponsor |
| `no_show` | Someone didn't show up | Everyone |
| `rescheduled` | Moved to different time | Everyone |

---

## 🔧 Platform-Specific Features

### **WhatsApp Video**
- ✅ No download required
- ✅ Direct call at scheduled time
- ✅ Most familiar for users
- ⚠️ Requires good internet connection

### **Zoom**
- 📥 Requires download
- ✅ Best video/audio quality
- ✅ Professional appearance
- ✅ Recording capability
- ⚠️ Needs app installation

### **Google Meet**
- ✅ Works in browser
- ✅ No download required (optional)
- ✅ Good quality
- ⚠️ Needs Google account (optional)

### **Phone Call**
- ✅ No download required
- ✅ Works without internet
- ✅ Familiar for everyone
- ⚠️ No video

### **Microsoft Teams**
- 📥 Requires download
- ✅ Professional platform
- ✅ Good for business
- ⚠️ Less common in region

### **Skype**
- 📥 Requires download
- ✅ Well-known platform
- ✅ Reliable
- ⚠️ Declining popularity

---

## 🎯 Success Metrics

**User Experience:**
- ✅ Simple step-by-step process
- ✅ Clear instructions for each platform
- ✅ Automatic reminders
- ✅ Multiple platform options
- ✅ Download links provided

**Admin Efficiency:**
- ✅ Automatic notifications
- ✅ One-click approve/reject
- ✅ Queue of pending requests
- ✅ Wait time tracking

**Communication:**
- ✅ Sponsor notified at each step
- ✅ Maid notified when needed
- ✅ Agency included when applicable
- ✅ Automatic reminders

---

## 📱 Testing Checklist

### Basic Flow
- [ ] Request interview with maid name
- [ ] Select date from options
- [ ] Select time from options
- [ ] Select platform
- [ ] Receive confirmation with instructions

### Platform Options
- [ ] WhatsApp Video - no download message
- [ ] Zoom - download link + meeting link
- [ ] Google Meet - meeting link + browser info
- [ ] Phone Call - phone number confirmation
- [ ] Microsoft Teams - download + meeting link
- [ ] Skype - download + meeting link

### Confirmations
- [ ] Admin receives notification
- [ ] Admin can approve
- [ ] Maid receives confirmation request
- [ ] Maid can confirm YES/NO
- [ ] Sponsor receives final confirmation
- [ ] Agency receives notification (if applicable)

### Reminders
- [ ] 24-hour reminder sent
- [ ] 1-hour reminder sent
- [ ] 15-minute reminder sent

### Error Handling
- [ ] Maid declines - sponsor notified
- [ ] Admin rejects - sponsor notified
- [ ] Timeout handling
- [ ] Invalid date selection
- [ ] Invalid time selection
- [ ] Invalid platform selection

---

**Ready to implement!** 🚀

Next step: Update the WhatsApp webhook to handle this interactive flow.
