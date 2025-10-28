# 📱 Update WhatsApp Number to +14155238886

## Current Setup

The WhatsApp number is stored as an environment variable in Supabase:
- Variable name: `TWILIO_WHATSAPP_NUMBER`
- Current value: (need to check)
- New value: `+14155238886`

---

## 🔧 How to Update

### Option 1: Via Supabase Dashboard (Easiest)

1. **Go to:** https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/settings/functions

2. **Find:** "TWILIO_WHATSAPP_NUMBER" in the Environment Variables section

3. **Update value to:** `+14155238886`

4. **Click:** Save

5. **Redeploy functions:**
   ```bash
   npx supabase functions deploy whatsapp-webhook --no-verify-jwt
   npx supabase functions deploy interview-reminders
   ```

---

### Option 2: Via Supabase CLI

```bash
# Set the environment variable
npx supabase secrets set TWILIO_WHATSAPP_NUMBER="+14155238886"

# Redeploy functions to pick up new value
npx supabase functions deploy whatsapp-webhook --no-verify-jwt
npx supabase functions deploy interview-reminders
```

---

## 🔍 Where This Number is Used

### 1. **interview-reminders/index.ts** (Line 36)
```typescript
const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');
```

Used when sending reminder messages FROM this number TO users.

### 2. **Twilio Configuration**
The number must also be configured in your Twilio account:
- Go to: https://console.twilio.com/
- Navigate to: Messaging → Try it out → Send a WhatsApp message
- This number should be your Twilio Sandbox WhatsApp number

---

## ✅ Verification After Update

### Test 1: Send a Message
Send a WhatsApp message to `+14155238886` with:
```
ping
```

Expected response:
```
Pong! Webhook is working. Database has 5 test maids ready.
```

### Test 2: Check Reminders Work
The reminders function should be able to send messages FROM `+14155238886`.

---

## 📋 Complete Update Checklist

- [ ] Update `TWILIO_WHATSAPP_NUMBER` environment variable in Supabase
- [ ] Verify the number in Twilio Console
- [ ] Redeploy whatsapp-webhook function
- [ ] Redeploy interview-reminders function
- [ ] Test with "ping" message
- [ ] Test interview booking flow

---

## 🚀 Quick Update Command

Run this command to update and redeploy everything:

```bash
# Update environment variable
npx supabase secrets set TWILIO_WHATSAPP_NUMBER="+14155238886"

# Redeploy both functions
npx supabase functions deploy whatsapp-webhook --no-verify-jwt && npx supabase functions deploy interview-reminders

# Test
echo "Now send 'ping' to +14155238886 via WhatsApp to test!"
```

---

## 📞 About This Number

**+14155238886** is Twilio's WhatsApp Sandbox number.

- **Format:** E.164 international format with `+` prefix
- **Country Code:** +1 (United States)
- **Area Code:** 415 (San Francisco)
- **Number:** 523-8886

This is the standard Twilio WhatsApp test number used before you get your own approved WhatsApp Business number.

---

## ⚠️ Important Notes

1. **Sandbox Limitations:**
   - Anyone who wants to chat must first join your sandbox by sending a code
   - Example: "join <your-sandbox-code>" to +14155238886

2. **Webhook Configuration:**
   - Make sure your Twilio webhook is pointing to:
     ```
     https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/whatsapp-webhook
     ```

3. **Environment Variables:**
   - All Supabase Edge Functions share the same environment variables
   - Updating `TWILIO_WHATSAPP_NUMBER` affects all functions
   - No need to update individual function code

---

## 🎯 Ready to Update?

Choose your preferred method above and follow the steps!

After updating, test with:
```
ping
```

Then test the full interview booking flow:
```
Schedule video interview with Fatima
```
