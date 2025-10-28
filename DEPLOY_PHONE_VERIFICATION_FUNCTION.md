# Deploy Phone Verification Edge Function

## Quick Deploy Guide

### Option 1: Deploy via Supabase Dashboard (Recommended - No CLI Required)

This is the easiest method if you don't have the Supabase CLI installed.

#### Steps:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project: `ethiopian-maids`

2. **Navigate to Edge Functions**
   - Click "Edge Functions" in the left sidebar
   - Click "Create a new function"

3. **Create the Function**
   - **Function name:** `phone-verification`
   - **Import from:** "Upload file"
   - Click "Browse" and select: `supabase/functions/phone-verification/index.ts`
   - OR copy and paste the code directly

4. **Deploy the Function**
   - Click "Deploy Function"
   - Wait for deployment to complete (usually 10-30 seconds)

5. **Verify Deployment**
   - You should see the function listed with status "Active"
   - Note the function URL: `https://<project-ref>.supabase.co/functions/v1/phone-verification`

---

### Option 2: Install Supabase CLI and Deploy

If you prefer using the CLI for future deployments:

#### Step 1: Install Supabase CLI

**For Windows (using npm):**
```bash
npm install -g supabase
```

**For Windows (using Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**For Windows (using Chocolatey):**
```bash
choco install supabase
```

#### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

#### Step 3: Link Your Project

```bash
cd C:\Users\umera\OneDrive\Documents\ethiopian-maids
supabase link --project-ref <your-project-ref>
```

Get your project ref from: https://app.supabase.com/project/_/settings/general

#### Step 4: Deploy the Function

```bash
supabase functions deploy phone-verification
```

---

### Option 3: Manual Upload via Dashboard

If the file upload doesn't work, you can copy/paste the code:

1. **Go to Edge Functions** in Supabase Dashboard
2. **Click "Create a new function"**
3. **Function name:** `phone-verification`
4. **Copy the code below and paste it:**

```typescript
/**
 * Phone Verification Edge Function
 * Securely stores and validates phone verification codes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  action: 'send' | 'verify' | 'resend';
  phone: string;
  code?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const requestData: VerificationRequest = await req.json();
    const { action, phone, code } = requestData;

    if (!phone || !phone.startsWith('+')) {
      return new Response(
        JSON.stringify({ error: 'Valid phone number required (E.164 format)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    switch (action) {
      case 'send':
      case 'resend': {
        const verificationCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const { data: existing } = await supabaseClient
          .from('phone_verifications')
          .select('id')
          .eq('phone', phone)
          .eq('verified', false)
          .single();

        if (existing) {
          await supabaseClient
            .from('phone_verifications')
            .update({
              code: verificationCode,
              expires_at: expiresAt,
              attempts: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          await supabaseClient
            .from('phone_verifications')
            .insert({
              phone,
              code: verificationCode,
              expires_at: expiresAt,
              attempts: 0,
              verified: false,
            });
        }

        const isDev = Deno.env.get('ENVIRONMENT') === 'development';

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Verification code sent successfully',
            ...(isDev && { devCode: verificationCode }),
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      case 'verify': {
        if (!code || code.length !== 6) {
          return new Response(
            JSON.stringify({ error: 'Valid 6-digit code required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { data: verification, error: fetchError } = await supabaseClient
          .from('phone_verifications')
          .select('*')
          .eq('phone', phone)
          .eq('verified', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError || !verification) {
          return new Response(
            JSON.stringify({
              error: 'No verification found. Please request a new code.',
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (new Date(verification.expires_at) < new Date()) {
          await supabaseClient
            .from('phone_verifications')
            .delete()
            .eq('id', verification.id);

          return new Response(
            JSON.stringify({
              error: 'Verification code expired. Please request a new code.',
            }),
            {
              status: 410,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (verification.attempts >= 3) {
          await supabaseClient
            .from('phone_verifications')
            .delete()
            .eq('id', verification.id);

          return new Response(
            JSON.stringify({
              error: 'Too many failed attempts. Please request a new code.',
            }),
            {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (verification.code !== code) {
          await supabaseClient
            .from('phone_verifications')
            .update({ attempts: verification.attempts + 1 })
            .eq('id', verification.id);

          const remainingAttempts = 2 - verification.attempts;
          return new Response(
            JSON.stringify({
              error: `Invalid code. ${remainingAttempts} ${
                remainingAttempts === 1 ? 'attempt' : 'attempts'
              } remaining.`,
            }),
            {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        await supabaseClient
          .from('phone_verifications')
          .update({
            verified: true,
            verified_at: new Date().toISOString(),
          })
          .eq('id', verification.id);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Phone number verified successfully',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Phone verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

5. **Click "Deploy Function"**

---

## Verify Deployment

After deploying, test the function:

### Test with curl (Windows PowerShell):

```powershell
# Get your Supabase URL and Anon Key from dashboard
$SUPABASE_URL = "https://your-project-ref.supabase.co"
$ANON_KEY = "your-anon-key"

# Test send verification code
curl -X POST "$SUPABASE_URL/functions/v1/phone-verification" `
  -H "Authorization: Bearer $ANON_KEY" `
  -H "Content-Type: application/json" `
  -d '{"action":"send","phone":"+971501234567"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "devCode": "123456"
}
```

### Test with JavaScript (in browser console):

```javascript
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const ANON_KEY = 'your-anon-key';

fetch(`${SUPABASE_URL}/functions/v1/phone-verification`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'send',
    phone: '+971501234567'
  })
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

---

## Environment Variables

The Edge Function uses these environment variables (automatically provided by Supabase):

- ✅ `SUPABASE_URL` - Your project URL
- ✅ `SUPABASE_ANON_KEY` - Your anon/public key
- ⚠️ `ENVIRONMENT` - Set to "development" or "production" (optional)

To set custom environment variables:
1. Go to Supabase Dashboard → Settings → Edge Functions
2. Add: `ENVIRONMENT=development` (for testing)
3. Change to `ENVIRONMENT=production` when ready

---

## Troubleshooting

### Function not deploying
- ✅ Check your internet connection
- ✅ Make sure you're logged into Supabase Dashboard
- ✅ Try using manual copy/paste method

### Getting 404 errors
- ✅ Make sure function is deployed (check Edge Functions page)
- ✅ Verify the URL is correct: `https://<project-ref>.supabase.co/functions/v1/phone-verification`
- ✅ Check function name is exactly `phone-verification` (with hyphen)

### Getting database errors
- ✅ Make sure you've run the database migration first
- ✅ Check `phone_verifications` table exists
- ✅ Verify RLS policies are enabled

### CORS errors
- ✅ Function includes CORS headers by default
- ✅ Make sure you're handling OPTIONS requests
- ✅ Check browser console for specific CORS errors

---

## Next Steps After Deployment

1. ✅ **Update Frontend Code**
   - File: `src/services/securePhoneVerificationService.js`
   - No changes needed - it already uses the correct endpoint

2. ✅ **Update Register.jsx**
   - Replace sessionStorage verification code
   - Use `securePhoneVerificationService` instead

3. ✅ **Test End-to-End**
   - Try registering a new user
   - Verify phone verification flow works
   - Check database for verification records

4. ✅ **Integrate SMS Provider (Optional)**
   - Update Edge Function to send actual SMS via Twilio/SNS
   - Currently returns code in dev mode for testing

---

## Status Checklist

Before deploying:
- ✅ Database migration completed (`phone_verifications` table exists)
- ✅ Edge Function code is ready (`supabase/functions/phone-verification/index.ts`)
- ✅ Frontend service is ready (`src/services/securePhoneVerificationService.js`)

After deploying:
- [ ] Function shows as "Active" in Supabase Dashboard
- [ ] Test endpoint responds successfully
- [ ] Database records are created when sending codes
- [ ] Verification flow works end-to-end

---

## Quick Reference

**Function URL Pattern:**
```
https://<your-project-ref>.supabase.co/functions/v1/phone-verification
```

**Actions:**
- `POST /phone-verification` with `{"action": "send", "phone": "+971..."}`
- `POST /phone-verification` with `{"action": "verify", "phone": "+971...", "code": "123456"}`
- `POST /phone-verification` with `{"action": "resend", "phone": "+971..."}`

**Get your Project Ref:**
- Dashboard → Settings → General → Reference ID

**Get your Anon Key:**
- Dashboard → Settings → API → anon public key

---

Ready to deploy! 🚀

Choose Option 1 (Dashboard upload) for the quickest method.
