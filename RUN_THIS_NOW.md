# ⚡ ACTION REQUIRED: Configure GitHub Secrets

**Phase 1 Complete:** ✅ Fixed VERCEL_PROJECT_ID in scripts
**Phase 2 Now:** Configure GitHub Secrets

---

## Run This Command NOW:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-github-secrets.ps1
```

### What This Will Do:
1. Check if GitHub CLI is installed
2. Verify you're authenticated
3. Add all 15 secrets to your GitHub repository
4. Use the **CORRECTED** VERCEL_PROJECT_ID value

---

## Expected Output:

```
==============================================================================
  GitHub Secrets Setup for Ethiopian Maids Platform
==============================================================================

✅ GitHub CLI is installed
✅ Authenticated with GitHub

This will add/update secrets in repository: umero882/ethiopian-maids-st
Continue? (y/n): y

Adding secrets...

📦 Vercel Configuration
Adding VERCEL_TOKEN... ✅
Adding VERCEL_ORG_ID... ✅
Adding VERCEL_PROJECT_ID... ✅  ← Should show the CORRECT ID now

🗄️  Supabase Configuration
Adding VITE_SUPABASE_URL... ✅
Adding VITE_SUPABASE_ANON_KEY... ✅
Adding SUPABASE_SERVICE_KEY... ✅

💳 Stripe Configuration
Adding VITE_STRIPE_PUBLISHABLE_KEY... ✅
Adding STRIPE_SECRET_KEY... ✅
Adding STRIPE_WEBHOOK_SECRET... ✅

📱 Twilio Configuration
Adding VITE_TWILIO_ACCOUNT_SID... ✅
Adding TWILIO_AUTH_TOKEN... ✅
Adding VITE_TWILIO_PHONE_NUMBER... ✅

📧 SendGrid Configuration
Adding SENDGRID_API_KEY... ✅

🎙️  ElevenLabs Configuration
Adding ELEVENLABS_API_KEY... ✅
Adding VITE_ELEVENLABS_AGENT_ID... ✅

🔑 GitHub Token
Adding GH_TOKEN... ✅

==============================================================================
✅ All secrets have been added successfully!
==============================================================================

📋 Current secrets in repository:
ELEVENLABS_API_KEY                Updated 2025-01-29
GH_TOKEN                          Updated 2025-01-29
SENDGRID_API_KEY                  Updated 2025-01-29
STRIPE_SECRET_KEY                 Updated 2025-01-29
STRIPE_WEBHOOK_SECRET             Updated 2025-01-29
SUPABASE_SERVICE_KEY              Updated 2025-01-29
TWILIO_AUTH_TOKEN                 Updated 2025-01-29
VERCEL_ORG_ID                     Updated 2025-01-29
VERCEL_PROJECT_ID                 Updated 2025-01-29  ← Check this is present!
VERCEL_TOKEN                      Updated 2025-01-29
VITE_ELEVENLABS_AGENT_ID          Updated 2025-01-29
VITE_STRIPE_PUBLISHABLE_KEY       Updated 2025-01-29
VITE_SUPABASE_ANON_KEY            Updated 2025-01-29
VITE_SUPABASE_URL                 Updated 2025-01-29
VITE_TWILIO_ACCOUNT_SID           Updated 2025-01-29
VITE_TWILIO_PHONE_NUMBER          Updated 2025-01-29
```

---

## If GitHub CLI is NOT Installed:

### Option 1: Install GitHub CLI (Recommended)
```powershell
winget install GitHub.cli
```

Then authenticate:
```powershell
gh auth login
```

Then run the setup script.

### Option 2: Manual Setup (If you don't want to install GitHub CLI)
Go to: https://github.com/umero882/ethiopian-maids-st/settings/secrets/actions

Click "New repository secret" and add each of these:

**CRITICAL - Copy these EXACTLY:**

1. Name: `VERCEL_TOKEN`
   Value: `olBORiuI87mRG6Qo1NR00mAD`

2. Name: `VERCEL_ORG_ID`
   Value: `team_XnY1b9HZxbTV3OElmnJdJIZI`

3. Name: `VERCEL_PROJECT_ID`
   Value: `prj_T3mzPCeUM1kWrMaqf6E2Cad9lPQ3`

4. Name: `VITE_SUPABASE_URL`
   Value: `https://kstoksqbhmxnrmspfywm.supabase.co`

5. Name: `VITE_SUPABASE_ANON_KEY`
   Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTAyNTcsImV4cCI6MjA3NTA4NjI1N30.es6ozZDte5pOHA7Y1exXwdUybM-5WTxnrADKpbSGyzw`

6. Name: `VITE_STRIPE_PUBLISHABLE_KEY`
   Value: `pk_test_51RtCWi3ySFkJEQXkZns3C60KhWwr8XuqXydtnMM2cwnvBNss6CsaeQBwHzrFqBAB9A0QMLbslX3R5FRVuPIaGwG800BRlTQvle`

*(See GITHUB_SECRETS_SETUP.md for all 15 secrets)*

---

## After Secrets are Configured:

✅ **STOP and tell me:** "Secrets are configured"

Then I will proceed to Phase 3: Deploy to Development

---

## Verify Secrets Were Set Correctly:

If you used the automated script, you can verify:
```powershell
gh secret list
```

Look for these 6 REQUIRED secrets at minimum:
- ✅ VERCEL_TOKEN
- ✅ VERCEL_ORG_ID
- ✅ VERCEL_PROJECT_ID (should show "Updated" timestamp)
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY
- ✅ VITE_STRIPE_PUBLISHABLE_KEY

---

**IMPORTANT:** The VERCEL_PROJECT_ID is now CORRECT in the script. The previous issue was it was set to "ulove882's projects" instead of "prj_T3mzPCeUM1kWrMaqf6E2Cad9lPQ3".

**Next Step:** Run the command above, then tell me when complete!
