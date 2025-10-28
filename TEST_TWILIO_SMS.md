# Twilio SMS Testing Guide

**Date:** 2025-01-10
**Status:** ✅ **BACKEND API RUNNING - READY TO TEST**
**Server:** http://localhost:3001

---

## ✅ Current Status

### Backend API Server
- ✅ Server running on http://localhost:3001
- ✅ Twilio client initialized successfully
- ✅ Account SID: Configured
- ✅ Auth Token: Configured
- ✅ Phone Number: +17176998295

### Configuration Status
```json
{
  "status": "ok",
  "twilio": {
    "configured": true,
    "accountSid": "ACbfdadc1b...",
    "phoneNumber": "+17176998295"
  }
}
```

---

## 🧪 Manual Testing

### Test 1: API Health Check

**Endpoint:** `GET http://localhost:3001/api/health`

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-10T...",
  "twilio": {
    "configured": true,
    "accountSid": "ACbfdadc1b...",
    "phoneNumber": "+17176998295"
  }
}
```

**Test Command:**
```bash
curl http://localhost:3001/api/health
```

**Result:** ✅ PASSED

---

### Test 2: Send Verification SMS (API Test)

**Endpoint:** `POST http://localhost:3001/api/sms/send-verification`

**Request Body:**
```json
{
  "phoneNumber": "+1YOUR_PHONE_NUMBER",
  "code": "123456",
  "message": "Your Ethiopian Maids verification code is: 123456. Valid for 10 minutes."
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3001/api/sms/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"+1YOUR_PHONE_NUMBER\",\"code\":\"123456\",\"message\":\"Your Ethiopian Maids verification code is: 123456. Valid for 10 minutes.\"}"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "messageSid": "SM...",
  "status": "queued",
  "dateCreated": "2025-01-10T..."
}
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": "Error message here",
  "code": 21211
}
```

---

### Test 3: Send SMS via Registration Flow

**Steps:**

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Open Registration Page:**
   - Navigate to: http://localhost:5173/register (or your dev URL)

3. **Fill Registration Form:**
   - Name: Test User
   - Email: test@example.com
   - Password: TestPass123!
   - **Phone: YOUR_REAL_PHONE_NUMBER** (in E.164 format)
   - Country: Select your country (US, ET, SA, AE, etc.)

4. **Send Verification Code:**
   - Click "Send Verification Code" button
   - Wait for SMS to arrive on your phone

5. **Expected Behavior:**
   - ✅ Loading state appears
   - ✅ SMS sent successfully
   - ✅ UI shows verification code input
   - ✅ Phone number is masked (e.g., +1 XXX XXX 1234)
   - ✅ Receive SMS on your phone within 1-2 minutes

6. **Enter Verification Code:**
   - Type the 6-digit code from SMS
   - Click verify

7. **Expected Result:**
   - ✅ Code verified successfully
   - ✅ Green checkmark appears
   - ✅ "Create Account" button enabled
   - ✅ Account created with verified phone

---

## 📱 Testing Checklist

### Backend API Tests
- [x] ✅ Health endpoint working
- [x] ✅ Twilio client initialized
- [ ] ⚠️ SMS sending endpoint (needs real phone number)
- [ ] ⚠️ SMS delivery confirmation
- [ ] ⚠️ Error handling

### Frontend Integration Tests
- [ ] ⚠️ Registration page loads
- [ ] ⚠️ Phone input formatting
- [ ] ⚠️ "Send Code" button works
- [ ] ⚠️ SMS received on phone
- [ ] ⚠️ Code verification works
- [ ] ⚠️ Resend code functionality
- [ ] ⚠️ Error states display correctly
- [ ] ⚠️ Account creation with verified phone

### Database Tests
- [ ] ⚠️ Phone saved to profile table
- [ ] ⚠️ phone_verified set to TRUE
- [ ] ⚠️ phone_verified_at timestamp set
- [ ] ⚠️ No duplicate phones allowed

---

## 🔬 Test Cases

### Case 1: Valid US Phone Number
```json
{
  "phoneNumber": "+12025551234",
  "code": "123456"
}
```
**Expected:** SMS sent successfully

### Case 2: Valid Ethiopian Phone Number
```json
{
  "phoneNumber": "+251911234567",
  "code": "789012"
}
```
**Expected:** SMS sent successfully

### Case 3: Valid UAE Phone Number
```json
{
  "phoneNumber": "+971501234567",
  "code": "345678"
}
```
**Expected:** SMS sent successfully

### Case 4: Invalid Phone Format
```json
{
  "phoneNumber": "1234567890",
  "code": "123456"
}
```
**Expected:** Error - Invalid format

### Case 5: Missing Code
```json
{
  "phoneNumber": "+12025551234",
  "code": ""
}
```
**Expected:** Error - Code required

### Case 6: Invalid Code Length
```json
{
  "phoneNumber": "+12025551234",
  "code": "12345"
}
```
**Expected:** Error - Invalid code

---

## 🚨 Common Errors and Solutions

### Error: "The 'To' number is not a valid phone number"
**Twilio Error Code:** 21211

**Cause:** Phone number is not in E.164 format

**Solution:**
- Ensure phone starts with `+`
- Include country code
- Example: `+12025551234` (US), not `2025551234`

---

### Error: "The From phone number is not a valid"
**Twilio Error Code:** 21212

**Cause:** Twilio phone number (`VITE_TWILIO_PHONE_NUMBER`) is invalid

**Solution:**
- Check `.env` file has correct Twilio phone number
- Restart backend server after changing `.env`

---

### Error: "Permission to send an SMS has not been enabled"
**Twilio Error Code:** 21408

**Cause:** Trial account restrictions

**Solution:**
1. Verify the recipient phone number in Twilio console
2. Or upgrade to paid account
3. Trial accounts can only send to verified numbers

---

### Error: "Authenticate"
**Twilio Error Code:** 20003

**Cause:** Invalid Account SID or Auth Token

**Solution:**
- Check `VITE_TWILIO_ACCOUNT_SID` in `.env`
- Check `TWILIO_AUTH_TOKEN` in `.env`
- Restart backend server

---

### Error: "SMS body is required"
**Cause:** Message body is empty

**Solution:**
- Ensure `message` field is provided in request
- Frontend should always send message

---

## 📊 Server Logs

The backend server logs all SMS operations:

**Success:**
```
2025-01-10T16:21:36.386Z - POST /api/sms/send-verification
📤 Sending SMS to +12025551234 with code: 123456
✅ SMS sent successfully - SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Error:**
```
2025-01-10T16:21:36.386Z - POST /api/sms/send-verification
📤 Sending SMS to +12025551234 with code: 123456
❌ Error sending SMS: The 'To' number is not a valid phone number. [21211]
```

---

## 🎯 Next Steps for Full Testing

1. **Get a Test Phone Number:**
   - Use your real phone number
   - Or use a Twilio-verified number (if trial account)

2. **Test SMS Sending:**
   ```bash
   curl -X POST http://localhost:3001/api/sms/send-verification \
     -H "Content-Type: application/json" \
     -d "{\"phoneNumber\":\"+1YOUR_NUMBER\",\"code\":\"123456\",\"message\":\"Test code: 123456\"}"
   ```

3. **Check Phone for SMS:**
   - Should receive within 1-2 minutes
   - Code should match what you sent

4. **Test Registration Flow:**
   - Start frontend: `npm run dev`
   - Go to registration page
   - Complete full verification flow

5. **Verify Database:**
   - Check Supabase for new user
   - Confirm `phone_verified = true`
   - Confirm `phone_number` saved correctly

---

## 💰 Cost Monitoring

### Twilio Costs per SMS
- **US:** ~$0.0079 per SMS
- **UAE/GCC:** ~$0.05 - $0.15 per SMS
- **Ethiopia:** ~$0.10 - $0.20 per SMS

### Test Cost Estimate
- Testing with 10-20 SMS: ~$0.08 - $2.00
- Keep test messages to minimum
- Use development mode (code: 123456) when possible

---

## 📝 Testing Notes

### Important Reminders
1. **Trial Account Limits:**
   - Can only send to verified numbers
   - Must verify numbers in Twilio console first
   - Limited credits (~$15 typically)

2. **Rate Limits:**
   - Be aware of Twilio rate limits
   - Don't spam SMS sends
   - Wait between tests

3. **Carrier Filtering:**
   - Some carriers may block messages
   - Use official-looking messages
   - Avoid spammy content

4. **International Numbers:**
   - Test with numbers from different countries
   - Verify E.164 formatting works
   - Check SMS delivery times (can be slower internationally)

---

## ✅ Success Criteria

The Twilio SMS integration is fully working when:

- [x] ✅ Backend server running
- [x] ✅ Twilio client initialized
- [ ] ⚠️ SMS sent successfully to real phone
- [ ] ⚠️ SMS received on phone within 2 minutes
- [ ] ⚠️ Verification code in SMS matches sent code
- [ ] ⚠️ Registration flow completes successfully
- [ ] ⚠️ Phone saved to database as verified
- [ ] ⚠️ No errors in browser console
- [ ] ⚠️ No errors in server logs

---

## 🆘 Getting Help

If SMS sending fails:

1. **Check Server Logs:**
   - Look for error messages in terminal running backend
   - Note the Twilio error code

2. **Check Twilio Console:**
   - Go to https://console.twilio.com
   - Check "Monitor" → "Logs" → "Errors"
   - See detailed error information

3. **Check Phone Number:**
   - Verify it's in E.164 format
   - Verify it's a real, active number
   - For trial accounts, verify it's whitelisted

4. **Check Credentials:**
   - Verify all 3 credentials are correct:
     - VITE_TWILIO_ACCOUNT_SID
     - TWILIO_AUTH_TOKEN
     - VITE_TWILIO_PHONE_NUMBER

---

**Backend Server:** ✅ RUNNING
**Twilio Status:** ✅ CONFIGURED
**Ready for Testing:** ✅ YES

**Last Updated:** 2025-01-10
