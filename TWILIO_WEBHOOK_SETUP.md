# 🔗 Configure Twilio Webhook for +14155238886

## ✅ What's Been Done

1. ✅ Updated `TWILIO_WHATSAPP_NUMBER` environment variable to `+14155238886`
2. ✅ Redeployed whatsapp-webhook function
3. ✅ Redeployed interview-reminders function

---

## 🔧 Final Step: Configure Twilio Webhook

You need to tell Twilio to send incoming WhatsApp messages to your Supabase function.

### Step 1: Go to Twilio Console

**URL:** https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

Or navigate: Console → Messaging → Try it out → Send a WhatsApp message

### Step 2: Find WhatsApp Sandbox Settings

Look for the **"Sandbox"** section with the number **+1 (415) 523-8886**

### Step 3: Configure Webhook

Find the section that says **"WHEN A MESSAGE COMES IN"**

**Set the webhook URL to:**
```
https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook
```

**Method:** POST

### Step 4: Save Configuration

Click **Save** or **Save Configuration**

---

## 📱 How to Connect Your Phone

Before you can send messages to +14155238886, you need to join the sandbox:

### Join the Sandbox

1. **Open WhatsApp** on your phone
2. **Send a message** to: `+1 (415) 523-8886`
3. **Message content:** `join <your-sandbox-code>`
   - The sandbox code is shown in your Twilio Console
   - It looks like: `join word-word` (e.g., "join happy-dog")

4. **You'll receive a confirmation** message from Twilio

---

## 🧪 Test the Setup

### Test 1: Ping Test
Send this message to +14155238886 via WhatsApp:
```
ping
```

**Expected Response:**
```
Pong! Webhook is working. Database has 5 test maids ready.
```

### Test 2: Interview Booking
Send this message:
```
Schedule video interview with Fatima
```

**Expected Response:**
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

## 📋 Complete Configuration Checklist

- [ ] Go to Twilio Console
- [ ] Navigate to WhatsApp Sandbox Settings
- [ ] Set webhook URL: `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook`
- [ ] Set method to POST
- [ ] Save configuration
- [ ] Join sandbox from your phone (send "join <code>")
- [ ] Test with "ping" message
- [ ] Test with "Schedule video interview with Fatima"

---

## 🔍 Troubleshooting

### Issue: "Invalid webhook URL"
**Solution:** Make sure the URL is exactly:
```
https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook
```
No trailing slash, no extra spaces.

### Issue: "No response from bot"
**Check:**
1. Did you join the sandbox? (send "join <code>")
2. Is the webhook URL saved correctly?
3. Check Supabase function logs for errors

### Issue: "Webhook not found"
**Solution:** The webhook URL must match exactly. Copy-paste from above.

---

## 📊 Verify Configuration

After setting up, you can verify the webhook is configured:

1. **Go to:** https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
2. **Check:** "WHEN A MESSAGE COMES IN" shows your Supabase URL
3. **Check:** Method is POST

---

## 🎯 What Happens Next

Once configured:

1. **User sends message** to +14155238886 via WhatsApp
2. **Twilio receives** the message
3. **Twilio forwards** the message to your webhook URL
4. **Your Supabase function** processes it
5. **Response is sent back** to the user via WhatsApp

---

## 📞 Important Notes

### About the Sandbox Number

- **+14155238886** is Twilio's shared WhatsApp sandbox
- **Free to use** for testing
- **Limited to sandbox participants** (people who join)
- **For production:** You need to apply for your own WhatsApp Business number

### Webhook Security

- The webhook is configured with `--no-verify-jwt` for Twilio compatibility
- Twilio sends a signature in headers for verification
- Production apps should validate the Twilio signature

### Environment Variables Used

- `TWILIO_ACCOUNT_SID` - Your Twilio account ID
- `TWILIO_AUTH_TOKEN` - Your Twilio auth token
- `TWILIO_WHATSAPP_NUMBER` - **+14155238886** (just updated!)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service key
- `ANTHROPIC_API_KEY` - Claude AI API key

---

## ✅ Ready to Configure!

Follow the steps above to configure the Twilio webhook, then test it! 🚀

After configuration, the complete video interview booking flow will work:
1. Emergency bypass detects "Schedule video interview with Fatima"
2. Shows date options (1-5)
3. Shows time options (1-8)
4. Shows platform options (1-6)
5. Creates interview and sends confirmation

Let me know when you've configured the webhook and tested it!
