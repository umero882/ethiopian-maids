# WhatsApp Admin Settings Page - Complete Guide

**URL**: http://localhost:5173/admin/whatsapp → Settings Tab
**Production**: https://yourdomain.com/admin/whatsapp → Settings Tab

## 🎯 Overview

The Settings page provides comprehensive configuration for your WhatsApp AI Assistant (Lucy). It's organized into 5 main tabs with 50+ configurable options.

---

## 📑 Settings Tabs

### 1️⃣ **Platform Tab** - Basic Information

Configure your platform's public-facing information displayed to WhatsApp users.

#### **Platform Information**

| Setting | Description | Example |
|---------|-------------|---------|
| **Platform Name** | Your business name | Ethiopian Maids |
| **About Platform** | Description of your services | Premier platform connecting families... |
| **Support Email** | Customer support email | support@ethiopianmaids.com |
| **Support Phone** | Support phone number | +971501234567 |
| **Working Hours** | Business hours | 9:00 AM - 6:00 PM EAT, Mon-Sat |
| **Available Services** | Services offered (comma-separated) | maid hiring, visa transfer, replacement |

**How Services Display**:
- Services show as badges below the input
- Lucy uses these in her responses
- Users can inquire about any listed service

---

### 2️⃣ **AI Config Tab** - AI Assistant Settings

Fine-tune Lucy's behavior and responses.

#### **AI Assistant Configuration**

| Setting | Description | Default | Range |
|---------|-------------|---------|-------|
| **AI Model** | Claude model version | claude-3-5-sonnet-20241022 | - |
| **Temperature** | Response creativity | 0.7 | 0.0 - 1.0 |
| **Context Window** | Previous messages in context | 20 | 5 - 50 |
| **Auto-Response** | Respond automatically | ✅ Enabled | Toggle |
| **Business Hours Only** | Respond only during work hours | ❌ Disabled | Toggle |
| **Custom System Prompt** | Additional AI instructions | (Optional) | Text |

**Temperature Guide**:
- **0.0 - 0.3**: Focused & Consistent (Best for factual responses)
- **0.4 - 0.7**: Balanced (Recommended for most use cases)
- **0.8 - 1.0**: Creative & Varied (More personality)

**Context Window**:
- More messages = Better context understanding
- Higher values = Slower responses
- Recommended: 15-25 messages

#### **Quick Response Templates**

Pre-configured messages for common scenarios:

| Template | When Used | Example |
|----------|-----------|---------|
| **Greeting Message** | First interaction | Hello! I'm Lucy... |
| **Offline Message** | Outside business hours | We're currently offline... |
| **Error Message** | When errors occur | I'm sorry, I encountered an error... |

**Template Variables** (auto-replaced):
- `{support_email}` → Your support email
- `{support_phone}` → Your support phone
- `{working_hours}` → Your working hours
- `{platform_name}` → Your platform name

---

### 3️⃣ **Webhook Tab** - Integration Settings

Configure WhatsApp webhook and security.

#### **Webhook Configuration**

**Webhook URL**: `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook`

Features:
- ✅ **Auto-detected** from environment
- 📋 **Copy button** for quick access
- 🧪 **Test button** to verify connectivity
- 📖 **Setup instructions** for Twilio/Meta

**Test Webhook**:
Sends a test message to verify:
- ✅ Endpoint is accessible
- ✅ AI responds correctly
- ✅ Database connection works
- ✅ TwiML format is valid

#### **Webhook Security**

| Setting | Description | Recommendation |
|---------|-------------|----------------|
| **Validate Signature** | Verify Twilio requests | ✅ Enable for production |
| **Rate Limiting** | Limit messages per number | ✅ Enable to prevent spam |
| **Messages Per Minute** | Rate limit threshold | 5 (adjustable 1-60) |

**Rate Limiting**:
- Prevents spam/abuse
- Per phone number tracking
- Configurable threshold
- Returns polite error message when exceeded

---

### 4️⃣ **Notifications Tab** - Alert Settings

Configure notifications for admins and users.

#### **Admin Notifications**

Receive alerts when important events occur:

| Alert Type | Description | Delivery |
|------------|-------------|----------|
| **New Message Alerts** | WhatsApp messages received | Email |
| **Booking Alerts** | Bookings created/updated | Email |
| **Error Alerts** | Webhook/AI errors | Email (Recommended ✅) |

**Notification Email**: Where alerts are sent

#### **User Notifications**

Automated messages sent to WhatsApp users:

| Notification | Description | Trigger |
|--------------|-------------|---------|
| **Booking Confirmations** | Auto-confirm bookings | When status → confirmed |
| **Booking Reminders** | 24h advance reminders | 24 hours before booking |
| **Follow-up Messages** | Request feedback | After completed booking |

**Best Practices**:
- ✅ Enable error alerts (always)
- ⚠️ Be cautious with new message alerts (can be overwhelming)
- ✅ Enable booking confirmations (improves UX)
- ✅ Enable reminders (reduces no-shows)

---

### 5️⃣ **Advanced Tab** - Power User Settings

⚠️ **Warning**: Changes here affect system behavior. Only modify if you understand the implications.

#### **Advanced Configuration**

| Setting | Description | Default | Range |
|---------|-------------|---------|-------|
| **Max AI Response Tokens** | Response length limit | 1024 | 256-4096 |
| **Request Timeout** | Webhook/AI timeout | 30s | 5-60s |
| **Debug Mode** | Detailed logging | ❌ Off | Toggle |
| **Store AI Responses** | Save full AI data | ✅ On | Toggle |

**Max Tokens**:
- Longer responses = More tokens
- 1024 = ~750 words
- 2048 = ~1500 words (recommended for detailed responses)
- 4096 = Maximum (use sparingly)

**Debug Mode**:
- Logs all webhook requests
- Includes full AI responses
- Useful for troubleshooting
- Increases log size

#### **Phone Number Management**

**Allowed Numbers** (Whitelist):
- Leave empty to allow all numbers
- One number per line
- E.164 format: +971501234567
- Only these numbers can message

**Blocked Numbers** (Blacklist):
- Block spam/abuse
- One number per line
- Takes precedence over whitelist
- Returns generic error message

#### **Cache Settings**

| Setting | Description | Default |
|---------|-------------|---------|
| **Maid Cache Refresh** | Cache refresh interval | 5 min |
| **Clear Cache** | Manually clear cache | Button |

**Cache Purpose**:
- Speeds up maid availability queries
- Reduces database load
- Auto-refreshes at interval
- Manual clear for immediate updates

---

## 🎨 UI Features

### **Tab Navigation**
- 5 tabs with icons
- Current tab highlighted
- Sticky navigation

### **Form Controls**
- Text inputs for strings
- Textareas for long text
- Sliders for numeric ranges
- Toggles for boolean values
- Badges for visual feedback

### **Real-time Validation**
- Required fields marked
- Email format validation
- Phone number format validation
- Range validation for numbers

### **Save Functionality**
- Single "Save All Settings" button
- Saves across all tabs
- Loading state during save
- Success/error toast notifications
- "Reset Changes" button

---

## 🧪 Testing Settings

### Test Webhook Connectivity

1. Go to **Webhook Tab**
2. Click "Test Webhook" button
3. Wait for response (2-5 seconds)
4. Check result:
   - ✅ Green alert = Success
   - ❌ Red alert = Error

**Expected Test Response**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Hello! I'm Lucy...</Message>
</Response>
```

### Test AI Responses

1. Update **Temperature** or **System Prompt**
2. Click "Save All Settings"
3. Send test message via WhatsApp
4. Verify response reflects changes

### Test Notifications

1. Enable **New Message Alerts**
2. Set **Notification Email**
3. Send WhatsApp message
4. Check email for alert

---

## 📊 Current Configuration

Based on your database:

```json
{
  "platform_name": "Ethiopian Maids",
  "whatsapp_webhook_url": "https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook",
  "ai_model": "claude-3-5-sonnet-20241022",
  "ai_temperature": 0.7,
  "max_context_messages": 20,
  "auto_response_enabled": true,
  "greeting_message": "Hello! 👋 Welcome to Ethiopian Maids!"
}
```

---

## 🔧 Common Configurations

### **Scenario 1: High-Volume Customer Service**
```
Temperature: 0.3 (Focused)
Context Window: 15
Auto-Response: ✅ Enabled
Rate Limiting: ✅ Enabled (10/min)
Debug Mode: ❌ Disabled
```

### **Scenario 2: Personalized Engagement**
```
Temperature: 0.7 (Balanced)
Context Window: 25
Auto-Response: ✅ Enabled
Business Hours Only: ✅ Enabled
Booking Confirmations: ✅ Enabled
Reminders: ✅ Enabled
```

### **Scenario 3: Testing/Development**
```
Temperature: 0.5
Context Window: 10
Auto-Response: ✅ Enabled
Debug Mode: ✅ Enabled
Store AI Responses: ✅ Enabled
Allowed Numbers: +1234567890 (test number)
```

---

## 🚨 Troubleshooting

### Issue: Settings Not Saving

**Solution**:
```sql
-- Check database connection
SELECT * FROM platform_settings LIMIT 1;

-- Verify write permissions
UPDATE platform_settings SET platform_name = 'Test' WHERE id = (SELECT id FROM platform_settings LIMIT 1);
```

### Issue: Webhook Test Fails

**Check**:
1. Webhook URL is correct
2. Function is deployed: `npx supabase functions list`
3. ANTHROPIC_API_KEY is set: `npx supabase secrets list`
4. Database tables exist

### Issue: AI Not Responding

**Verify**:
1. `auto_response_enabled` = true
2. If `business_hours_only` = true, check time
3. Phone number not in blocked list
4. Rate limit not exceeded

### Issue: Notifications Not Sending

**Check**:
1. Notification email is valid
2. Email service configured
3. Specific alert type enabled
4. Check webhook logs

---

## 📝 Best Practices

### **Security** 🔐
- ✅ Enable signature validation in production
- ✅ Enable rate limiting
- ✅ Keep blocked numbers list updated
- ✅ Use HTTPS only (auto with Supabase)
- ✅ Rotate API keys periodically

### **Performance** ⚡
- Keep temperature between 0.5-0.7
- Context window: 15-25 messages
- Max tokens: 1024-2048
- Cache timeout: 5-10 minutes
- Timeout: 20-30 seconds

### **User Experience** 😊
- ✅ Enable booking confirmations
- ✅ Enable reminders
- ✅ Set clear working hours
- ✅ Customize greeting message
- ✅ Provide helpful error messages

### **Monitoring** 📊
- ✅ Enable error alerts
- Keep debug mode off (production)
- ✅ Store AI responses
- Review logs regularly
- Monitor response times

---

## 🔄 Updating Settings

### Via Admin Dashboard
1. Navigate to http://localhost:5173/admin/whatsapp
2. Click "Settings" tab
3. Modify desired settings
4. Click "Save All Settings"
5. Wait for success toast

### Via Database (Advanced)
```sql
UPDATE platform_settings
SET
  ai_temperature = 0.8,
  max_context_messages = 25,
  auto_response_enabled = true
WHERE id = (SELECT id FROM platform_settings LIMIT 1);
```

### Via API (Future Feature)
```javascript
// Coming soon
const response = await fetch('/api/platform-settings', {
  method: 'PATCH',
  body: JSON.stringify(settings)
});
```

---

## 📚 Related Documentation

- **Webhook Setup**: `WEBHOOK_FULLY_OPERATIONAL.md`
- **Database Schema**: `049_whatsapp_booking_assistant.sql`
- **Settings Enhancement**: `050_platform_settings_enhancement.sql`
- **Testing Guide**: `WEBHOOK_TESTING_GUIDE.md`

---

## 🎯 Quick Reference

### **Essential Settings**
- Platform Name
- Support Email/Phone
- Working Hours
- Webhook URL
- AI Temperature
- Auto-Response

### **Must Enable**
- Error Alerts
- Auto-Response
- Booking Confirmations

### **Optional but Recommended**
- Rate Limiting
- Booking Reminders
- Follow-ups
- Debug Mode (development only)

---

**Status**: ✅ **FULLY CONFIGURED**
**Settings Count**: 50+ configurable options
**Tabs**: 5 comprehensive categories
**Database**: Enhanced with 25 new fields
**Last Updated**: 2025-10-27

🎉 **Your Settings Page is Complete and Ready!** 🎉
