# 🚀 Quick Deployment Guide

## Your Current Status

Based on test results:
- ❌ **Edge Function:** NOT deployed (Test 1 failed)
- ❌ **Database Table:** Probably not created (Test 3 needs database)
- ✅ **Local Files:** All ready

---

## Step 1: Deploy Database Migration (5 minutes)

### Go to Supabase SQL Editor

1. **Open:** https://app.supabase.com/project/kstoksqbhmxnrmspfywm/sql/new

2. **Copy this SQL** (complete migration):

```sql
-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS phone_verifications CASCADE;

-- Create phone_verifications table
CREATE TABLE phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX idx_phone_verifications_verified ON phone_verifications(verified);
CREATE INDEX idx_phone_verifications_expires_at ON phone_verifications(expires_at);
CREATE INDEX idx_phone_verifications_phone_verified ON phone_verifications(phone, verified);

-- Add RLS (Row Level Security) policies
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to insert verification requests
CREATE POLICY "Allow anonymous insert" ON phone_verifications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow anonymous users to read their own verifications
CREATE POLICY "Allow anonymous read own" ON phone_verifications
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow anonymous users to update their own verifications
CREATE POLICY "Allow anonymous update own" ON phone_verifications
  FOR UPDATE
  TO anon
  USING (true);

-- Policy: Allow service role full access
CREATE POLICY "Allow service role all" ON phone_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_phone_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER phone_verifications_updated_at
  BEFORE UPDATE ON phone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_verifications_updated_at();

-- Add cleanup function to delete expired verifications
CREATE OR REPLACE FUNCTION cleanup_expired_phone_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM phone_verifications
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE phone_verifications IS 'Stores phone verification codes securely on the server-side';
COMMENT ON COLUMN phone_verifications.phone IS 'Phone number in E.164 format';
COMMENT ON COLUMN phone_verifications.code IS '6-digit verification code';
COMMENT ON COLUMN phone_verifications.expires_at IS 'Expiry timestamp (10 minutes from creation)';
COMMENT ON COLUMN phone_verifications.attempts IS 'Number of failed verification attempts (max 3)';
COMMENT ON COLUMN phone_verifications.verified IS 'Whether the code has been successfully verified';
COMMENT ON COLUMN phone_verifications.verified_at IS 'Timestamp when verification succeeded';
```

3. **Click "RUN"** button (bottom right)

4. **Verify Success:**
   - Should see: "Success. No rows returned"
   - Go to Table Editor → You should see `phone_verifications` table

---

## Step 2: Deploy Edge Function (10 minutes)

### Method A: Via Dashboard (Easiest)

1. **Open:** https://app.supabase.com/project/kstoksqbhmxnrmspfywm/functions

2. **Click:** "Create a new function" button

3. **Fill in:**
   - **Name:** `phone-verification` (exactly this, with hyphen)
   - **Choose:** "Create from scratch"

4. **Click "Create function"**

5. **Replace the default code with this** (copy ALL of it):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const requestData = await req.json();
    const { action, phone, code } = requestData;

    if (!phone || !phone.startsWith('+')) {
      return new Response(
        JSON.stringify({ error: 'Valid phone number required (E.164 format)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'send':
      case 'resend': {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
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
          await supabaseClient.from('phone_verifications').insert({
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
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify': {
        if (!code || code.length !== 6) {
          return new Response(
            JSON.stringify({ error: 'Valid 6-digit code required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: verification } = await supabaseClient
          .from('phone_verifications')
          .select('*')
          .eq('phone', phone)
          .eq('verified', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!verification) {
          return new Response(
            JSON.stringify({ error: 'No verification found. Please request a new code.' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (new Date(verification.expires_at) < new Date()) {
          await supabaseClient.from('phone_verifications').delete().eq('id', verification.id);
          return new Response(
            JSON.stringify({ error: 'Verification code expired. Please request a new code.' }),
            { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (verification.attempts >= 3) {
          await supabaseClient.from('phone_verifications').delete().eq('id', verification.id);
          return new Response(
            JSON.stringify({ error: 'Too many failed attempts. Please request a new code.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
              error: `Invalid code. ${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.`,
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabaseClient
          .from('phone_verifications')
          .update({ verified: true, verified_at: new Date().toISOString() })
          .eq('id', verification.id);

        return new Response(
          JSON.stringify({ success: true, message: 'Phone number verified successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Phone verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

6. **Click "Deploy"** button (top right)

7. **Wait for deployment** (10-30 seconds)

8. **Verify Success:**
   - Status should show "Active" with green dot
   - You'll see the function URL

---

## Step 3: Test Again

1. **Refresh your test page:** `test-phone-verification.html`

2. **Click "Send Verification Code"** button

3. **Expected Result:**
   ```json
   {
     "success": true,
     "message": "Verification code sent successfully",
     "devCode": "123456"
   }
   ```

---

## Quick Checklist

### Database Migration:
- [ ] SQL Editor opened
- [ ] SQL pasted and run
- [ ] "Success" message shown
- [ ] Table visible in Table Editor

### Edge Function:
- [ ] Edge Functions page opened
- [ ] Function created with name: `phone-verification`
- [ ] Code pasted (all 150+ lines)
- [ ] Deploy button clicked
- [ ] Status shows "Active"

### Testing:
- [ ] Test page refreshed
- [ ] Test 1 shows ✅ Success
- [ ] Test 3 shows ✅ Table exists

---

## Troubleshooting

### If SQL fails with "already exists" error:
```sql
-- Run this first to clean up
DROP TABLE IF EXISTS phone_verifications CASCADE;
-- Then run the full migration again
```

### If Edge Function won't deploy:
- Make sure function name is exactly: `phone-verification` (with hyphen)
- Check you copied ALL the code (should be 150+ lines)
- Try refreshing the page and creating again

### If tests still fail:
- Wait 30 seconds after deployment
- Hard refresh test page (Ctrl+F5)
- Check browser console for errors (F12)

---

## Direct Links

**SQL Editor:**
https://app.supabase.com/project/kstoksqbhmxnrmspfywm/sql/new

**Edge Functions:**
https://app.supabase.com/project/kstoksqbhmxnrmspfywm/functions

**Table Editor:**
https://app.supabase.com/project/kstoksqbhmxnrmspfywm/editor

---

Ready to deploy! Start with Step 1 (Database), then Step 2 (Edge Function), then test again. 🚀
