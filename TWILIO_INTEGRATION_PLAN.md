# Twilio Phone Authentication Integration Plan

**Status:** 🔄 Planning
**Date:** December 2024
**Focus:** SMS verification, 2FA, and phone number authentication

---

## ⚠️ CRITICAL: Security First

### Immediate Actions Required

1. **Rotate Your Credentials Immediately**
   - Go to Twilio Console → Settings → API Keys
   - Delete the exposed API key
   - Generate new credentials
   - **NEVER share credentials publicly again**

2. **Environment Variables Setup**
   - All credentials must be in `.env` files
   - Add `.env` to `.gitignore`
   - Use different credentials for dev/staging/production

---

## 1. Overview

### Features to Implement

1. **Phone Number Verification** (Registration)
   - SMS verification code during signup
   - Verify phone ownership
   - Store verified phone numbers

2. **Two-Factor Authentication (2FA)** (Login)
   - Optional 2FA via SMS
   - Backup codes
   - Remember device option

3. **Phone-Based Password Reset**
   - Alternative to email reset
   - SMS verification code

4. **Profile Phone Management**
   - Add/update phone number
   - Re-verification on change

### User Flow

```
Registration Flow:
User enters phone → SMS sent → User enters code → Verified → Account created

Login with 2FA:
User enters email/password → 2FA check → SMS sent → User enters code → Logged in

Password Reset via Phone:
User enters phone → SMS sent → User enters code → Reset password
```

---

## 2. Environment Variables Setup

### Step 1: Create .env.local file

```bash
# .env.local (for development)

# Twilio Configuration (DO NOT COMMIT THESE VALUES)
VITE_TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY_SID=your_api_key_sid_here
TWILIO_API_KEY_SECRET=your_api_key_secret_here
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# Twilio Verify Service (recommended for production)
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid_here

# Rate Limiting
TWILIO_MAX_SMS_PER_HOUR=5
TWILIO_MAX_SMS_PER_DAY=10

# Environment
NODE_ENV=development
```

### Step 2: Update .gitignore

```bash
# Add to .gitignore
.env.local
.env.production
.env.staging
*.env
```

### Step 3: Create .env.example

```bash
# .env.example (safe to commit)

# Twilio Configuration
VITE_TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY_SID=your_api_key_sid_here
TWILIO_API_KEY_SECRET=your_api_key_secret_here
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid_here
```

---

## 3. Database Schema Updates

### New Table: phone_verifications

```sql
-- database/migrations/038_phone_verifications.sql

CREATE TABLE phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  code_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT unique_pending_verification UNIQUE (user_id, phone_number, verified)
);

-- Index for quick lookups
CREATE INDEX idx_phone_verifications_user_id ON phone_verifications(user_id);
CREATE INDEX idx_phone_verifications_phone ON phone_verifications(phone_number);
CREATE INDEX idx_phone_verifications_code ON phone_verifications(verification_code);

-- Auto-delete expired verifications
CREATE OR REPLACE FUNCTION delete_expired_phone_verifications()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM phone_verifications
  WHERE code_expires_at < NOW() - INTERVAL '24 hours';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_expired_phone_verifications
  AFTER INSERT ON phone_verifications
  EXECUTE FUNCTION delete_expired_phone_verifications();
```

### Update: sponsor_profiles table

```sql
-- database/migrations/039_add_phone_to_profiles.sql

ALTER TABLE sponsor_profiles
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN two_factor_method VARCHAR(20) DEFAULT 'none' CHECK (two_factor_method IN ('none', 'sms', 'app'));

-- Also add to maid_profiles
ALTER TABLE maid_profiles
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN two_factor_method VARCHAR(20) DEFAULT 'none' CHECK (two_factor_method IN ('none', 'sms', 'app'));

-- Index for phone lookups
CREATE INDEX idx_sponsor_profiles_phone ON sponsor_profiles(phone_number);
CREATE INDEX idx_maid_profiles_phone ON maid_profiles(phone_number);
```

### New Table: two_factor_backup_codes

```sql
-- database/migrations/040_two_factor_backup_codes.sql

CREATE TABLE two_factor_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_backup_code UNIQUE (user_id, code)
);

CREATE INDEX idx_backup_codes_user_id ON two_factor_backup_codes(user_id);
```

---

## 4. Backend Service Layer

### File: src/services/twilioService.js

```javascript
/**
 * Twilio Service
 * Handles SMS sending and verification
 */

const ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = import.meta.env.TWILIO_AUTH_TOKEN;
const PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
const VERIFY_SERVICE_SID = import.meta.env.TWILIO_VERIFY_SERVICE_SID;

class TwilioService {
  constructor() {
    // Initialize Twilio client (will be done in Node.js backend)
    this.client = null;
  }

  /**
   * Send SMS verification code
   * @param {string} phoneNumber - E.164 format (+1234567890)
   * @param {string} code - 6-digit verification code
   */
  async sendVerificationCode(phoneNumber, code) {
    try {
      // In production, this should call your backend API
      // Backend will use Twilio SDK to send SMS
      const response = await fetch('/api/sms/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code }),
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send 2FA code
   * @param {string} phoneNumber - E.164 format
   */
  async send2FACode(phoneNumber) {
    try {
      const response = await fetch('/api/sms/send-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to send 2FA code');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error sending 2FA SMS:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber
   * @returns {boolean}
   */
  validatePhoneNumber(phoneNumber) {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164
   * @param {string} phoneNumber
   * @param {string} countryCode - e.g., 'US', 'ET'
   * @returns {string}
   */
  formatPhoneNumber(phoneNumber, countryCode = 'US') {
    // Use libphonenumber-js for proper formatting
    // For now, simple implementation
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Add country code if missing
    if (countryCode === 'US' && cleaned.length === 10) {
      cleaned = '1' + cleaned;
    } else if (countryCode === 'ET' && cleaned.length === 9) {
      cleaned = '251' + cleaned;
    }

    return '+' + cleaned;
  }

  /**
   * Generate 6-digit verification code
   * @returns {string}
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const twilioService = new TwilioService();
export default twilioService;
```

### File: src/services/phoneVerificationService.js

```javascript
/**
 * Phone Verification Service
 * Handles phone verification logic and database operations
 */

import { supabase } from '@/lib/databaseClient';
import twilioService from './twilioService';

class PhoneVerificationService {
  /**
   * Start phone verification process
   * @param {string} userId
   * @param {string} phoneNumber - E.164 format
   */
  async startVerification(userId, phoneNumber) {
    try {
      // Validate phone number
      if (!twilioService.validatePhoneNumber(phoneNumber)) {
        return { error: { message: 'Invalid phone number format' } };
      }

      // Check if phone already verified by another user
      const { data: existing } = await supabase
        .from('sponsor_profiles')
        .select('id, user_id')
        .eq('phone_number', phoneNumber)
        .eq('phone_verified', true)
        .neq('user_id', userId)
        .single();

      if (existing) {
        return { error: { message: 'Phone number already in use' } };
      }

      // Generate verification code
      const code = twilioService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save verification to database
      const { data, error } = await supabase
        .from('phone_verifications')
        .insert({
          user_id: userId,
          phone_number: phoneNumber,
          verification_code: code,
          code_expires_at: expiresAt.toISOString(),
          verified: false,
          attempts: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return { error };
      }

      // Send SMS
      const smsResult = await twilioService.sendVerificationCode(phoneNumber, code);

      if (!smsResult.success) {
        // Delete verification record if SMS fails
        await supabase
          .from('phone_verifications')
          .delete()
          .eq('id', data.id);

        return { error: { message: 'Failed to send SMS' } };
      }

      return { data: { verificationId: data.id, expiresAt } };
    } catch (error) {
      console.error('Error starting verification:', error);
      return { error };
    }
  }

  /**
   * Verify code
   * @param {string} userId
   * @param {string} phoneNumber
   * @param {string} code
   */
  async verifyCode(userId, phoneNumber, code) {
    try {
      // Get verification record
      const { data: verification, error: fetchError } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('phone_number', phoneNumber)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !verification) {
        return { error: { message: 'No verification found' } };
      }

      // Check expiration
      if (new Date(verification.code_expires_at) < new Date()) {
        return { error: { message: 'Verification code expired' } };
      }

      // Check attempts
      if (verification.attempts >= verification.max_attempts) {
        return { error: { message: 'Too many attempts. Request a new code.' } };
      }

      // Verify code
      if (verification.verification_code !== code) {
        // Increment attempts
        await supabase
          .from('phone_verifications')
          .update({ attempts: verification.attempts + 1 })
          .eq('id', verification.id);

        return {
          error: {
            message: `Invalid code. ${verification.max_attempts - verification.attempts - 1} attempts remaining.`
          }
        };
      }

      // Mark as verified
      const { error: updateError } = await supabase
        .from('phone_verifications')
        .update({
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', verification.id);

      if (updateError) {
        return { error: updateError };
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('sponsor_profiles')
        .update({
          phone_number: phoneNumber,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (profileError) {
        return { error: profileError };
      }

      return { data: { success: true, phoneNumber } };
    } catch (error) {
      console.error('Error verifying code:', error);
      return { error };
    }
  }

  /**
   * Resend verification code
   * @param {string} userId
   * @param {string} phoneNumber
   */
  async resendCode(userId, phoneNumber) {
    try {
      // Delete old verification
      await supabase
        .from('phone_verifications')
        .delete()
        .eq('user_id', userId)
        .eq('phone_number', phoneNumber)
        .eq('verified', false);

      // Start new verification
      return await this.startVerification(userId, phoneNumber);
    } catch (error) {
      console.error('Error resending code:', error);
      return { error };
    }
  }
}

export const phoneVerificationService = new PhoneVerificationService();
export default phoneVerificationService;
```

---

## 5. Frontend Components

### Component: PhoneVerificationModal.jsx

```jsx
/**
 * Phone Verification Modal
 * Handles phone number input and code verification
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Phone, Shield } from 'lucide-react';
import phoneVerificationService from '@/services/phoneVerificationService';
import { useAuth } from '@/contexts/AuthContext';

export function PhoneVerificationModal({ open, onClose, onSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: enter phone, 2: enter code
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationId, setVerificationId] = useState(null);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast({ title: 'Error', description: 'Please enter a phone number', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data, error } = await phoneVerificationService.startVerification(user.id, phoneNumber);
    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    setVerificationId(data.verificationId);
    setStep(2);
    setCountdown(60);
    toast({ title: 'Success', description: 'Verification code sent!' });
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({ title: 'Error', description: 'Please enter the 6-digit code', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data, error } = await phoneVerificationService.verifyCode(user.id, phoneNumber, code);
    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Phone number verified!' });
    onSuccess?.();
    onClose();
  };

  const handleResend = async () => {
    setLoading(true);
    const { error } = await phoneVerificationService.resendCode(user.id, phoneNumber);
    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    setCountdown(60);
    toast({ title: 'Success', description: 'New code sent!' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {step === 1 ? <Phone className='h-5 w-5' /> : <Shield className='h-5 w-5' />}
            {step === 1 ? 'Verify Phone Number' : 'Enter Verification Code'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Enter your phone number to receive a verification code'
              : `We sent a 6-digit code to ${phoneNumber}`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number</Label>
              <Input
                id='phone'
                type='tel'
                placeholder='+1 (555) 123-4567'
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
              <p className='text-xs text-gray-500'>
                Include country code (e.g., +1 for US, +251 for Ethiopia)
              </p>
            </div>

            <Button onClick={handleSendCode} disabled={loading} className='w-full'>
              {loading ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <Phone className='h-4 w-4 mr-2' />
              )}
              Send Verification Code
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='code'>Verification Code</Label>
              <Input
                id='code'
                type='text'
                placeholder='123456'
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={loading}
                className='text-center text-2xl tracking-widest'
              />
            </div>

            <Button onClick={handleVerifyCode} disabled={loading} className='w-full'>
              {loading ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <Shield className='h-4 w-4 mr-2' />
              )}
              Verify Code
            </Button>

            <div className='flex items-center justify-between text-sm'>
              <button
                onClick={() => setStep(1)}
                className='text-blue-600 hover:underline'
                disabled={loading}
              >
                Change phone number
              </button>

              {countdown > 0 ? (
                <span className='text-gray-500'>Resend in {countdown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  className='text-blue-600 hover:underline'
                  disabled={loading}
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 6. Integration Points

### Update: AuthContext.jsx

Add phone verification methods:

```javascript
// Add to AuthContext.jsx

const [phoneVerified, setPhoneVerified] = useState(false);

// Check phone verification status
const checkPhoneVerification = useCallback(async () => {
  if (!user?.id) return false;

  const { data, error } = await supabase
    .from('sponsor_profiles')
    .select('phone_verified')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return false;

  setPhoneVerified(data.phone_verified);
  return data.phone_verified;
}, [user]);

// Add to context value
return (
  <AuthContext.Provider
    value={{
      // ... existing values
      phoneVerified,
      checkPhoneVerification,
    }}
  >
    {children}
  </AuthContext.Provider>
);
```

### Update: Register.jsx

Add phone verification step:

```javascript
// After email verification
if (emailVerified && !phoneVerified) {
  navigate('/verify-phone');
}
```

---

## 7. Backend API Endpoints (Node.js/Express)

### File: server/routes/sms.js

```javascript
/**
 * SMS API Routes
 * Backend endpoints for Twilio operations
 */

const express = require('express');
const twilio = require('twilio');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Rate limiting
const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 SMS per hour per IP
  message: 'Too many SMS requests, please try again later',
});

/**
 * POST /api/sms/send-verification
 * Send verification code via SMS
 */
router.post('/send-verification', smsLimiter, async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send SMS
    const message = await twilioClient.messages.create({
      body: `Your verification code is: ${code}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    res.json({ success: true, messageSid: message.sid });
  } catch (error) {
    console.error('Twilio error:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

/**
 * POST /api/sms/send-2fa
 * Send 2FA code
 */
router.post('/send-2fa', smsLimiter, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // Generate 2FA code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Send SMS
    const message = await twilioClient.messages.create({
      body: `Your 2FA code is: ${code}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    // Store code in session or database (with expiration)
    req.session.twoFactorCode = code;
    req.session.twoFactorExpires = Date.now() + 5 * 60 * 1000;

    res.json({ success: true, messageSid: message.sid });
  } catch (error) {
    console.error('Twilio error:', error);
    res.status(500).json({ error: 'Failed to send 2FA code' });
  }
});

module.exports = router;
```

---

## 8. Testing Strategy

### Unit Tests

```javascript
// src/services/__tests__/twilioService.test.js
describe('TwilioService', () => {
  it('should validate phone numbers correctly', () => {
    expect(twilioService.validatePhoneNumber('+12025551234')).toBe(true);
    expect(twilioService.validatePhoneNumber('1234567890')).toBe(false);
  });

  it('should generate 6-digit codes', () => {
    const code = twilioService.generateVerificationCode();
    expect(code).toHaveLength(6);
    expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
  });
});
```

### Integration Tests

```javascript
// src/__tests__/integration/phoneVerification.test.jsx
describe('Phone Verification Flow', () => {
  it('should complete verification flow', async () => {
    // Mock SMS sending
    vi.spyOn(twilioService, 'sendVerificationCode').mockResolvedValue({ success: true });

    // Start verification
    const { data } = await phoneVerificationService.startVerification(userId, '+12025551234');
    expect(data.verificationId).toBeDefined();

    // Verify code
    const result = await phoneVerificationService.verifyCode(userId, '+12025551234', '123456');
    expect(result.data.success).toBe(true);
  });
});
```

---

## 9. Implementation Phases

### Phase 1: Setup (Week 1)
- [ ] Rotate Twilio credentials
- [ ] Setup environment variables
- [ ] Install Twilio SDK (`npm install twilio`)
- [ ] Create database migrations
- [ ] Run migrations

### Phase 2: Backend (Week 1-2)
- [ ] Create Twilio service
- [ ] Create phone verification service
- [ ] Create backend API endpoints
- [ ] Add rate limiting
- [ ] Add error handling

### Phase 3: Frontend (Week 2)
- [ ] Create PhoneVerificationModal component
- [ ] Update AuthContext
- [ ] Add phone verification to registration
- [ ] Create phone settings page
- [ ] Add 2FA toggle in settings

### Phase 4: Testing (Week 3)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Manual testing with real phone numbers
- [ ] Test rate limiting
- [ ] Test error scenarios

### Phase 5: Production (Week 4)
- [ ] Setup production Twilio account
- [ ] Configure production environment variables
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor SMS delivery rates

---

## 10. Cost Estimation

### Twilio Pricing (Approximate)

- **SMS (US):** $0.0079 per message
- **SMS (International):** $0.05 - $0.15 per message
- **Phone Number:** $1.00/month

**Estimated Monthly Cost:**
- 1,000 users × 2 SMS (verify + 2FA) = 2,000 SMS
- 2,000 × $0.0079 = **~$16/month**

---

## 11. Security Best Practices

### Implemented Security Measures

1. **Rate Limiting**
   - Max 5 SMS per hour per phone
   - Max 10 SMS per day per phone
   - Prevent SMS bombing

2. **Code Expiration**
   - Verification codes expire after 10 minutes
   - 2FA codes expire after 5 minutes

3. **Attempt Limits**
   - Max 3 verification attempts
   - Must request new code after 3 failed attempts

4. **Phone Number Validation**
   - E.164 format required
   - Prevent invalid numbers

5. **Database Security**
   - Codes stored securely
   - Auto-delete expired verifications
   - Unique constraints on phone numbers

6. **Environment Variables**
   - Never commit credentials
   - Different keys for dev/staging/prod

---

## 12. Next Steps

1. **Immediate:** Rotate your Twilio credentials
2. **Setup:** Create environment variables
3. **Database:** Run migrations
4. **Backend:** Implement services
5. **Frontend:** Create components
6. **Testing:** Write and run tests
7. **Deploy:** Staging → Production

---

## Appendix: Useful Resources

- [Twilio SMS Quickstart](https://www.twilio.com/docs/sms/quickstart)
- [Twilio Verify API](https://www.twilio.com/docs/verify/api)
- [Phone Number Formatting (E.164)](https://www.twilio.com/docs/glossary/what-e164)
- [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) - Better phone validation
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) - Rate limiting

---

**Status:** ✅ Plan Complete - Ready for Implementation

**Next:** Rotate credentials and begin Phase 1 (Setup)
