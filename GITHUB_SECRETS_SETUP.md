# GitHub Secrets Setup Guide

This document contains the step-by-step process to configure GitHub repository secrets for automated deployments.

## ⚠️ SECURITY NOTICE

**This file contains sensitive information and should be:**

- ✅ Kept secure and private
- ✅ Shared only with authorized team members
- ✅ Deleted after secrets are configured
- ❌ NEVER committed to the repository

---

## Prerequisites

- GitHub repository: `umero882/ethiopian-maids-st`
- Admin access to the repository
- GitHub Personal Access Token (if using CLI method)

---

## Method 1: Via GitHub Web Interface (Recommended)

### Step 1: Navigate to Repository Secrets

1. Go to: https://github.com/umero882/ethiopian-maids-st
2. Click **Settings** tab
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button

### Step 2: Add Vercel Secrets

Add these secrets one by one:

#### VERCEL_TOKEN

```
olBORiuI87mRG6Qo1NR00mAD
```

#### VERCEL_ORG_ID

```
team_XnY1b9HZxbTV3OElmnJdJIZI
```

#### VERCEL_PROJECT_ID

```
prj_T3mzPCeUM1kWrMaqf6E2Cad9lPQ3
```

### Step 3: Add Supabase Secrets

#### VITE_SUPABASE_URL

```
https://kstoksqbhmxnrmspfywm.supabase.co
```

#### VITE_SUPABASE_ANON_KEY

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTAyNTcsImV4cCI6MjA3NTA4NjI1N30.es6ozZDte5pOHA7Y1exXwdUybM-5WTxnrADKpbSGyzw
```

#### SUPABASE_SERVICE_KEY

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUxMDI1NywiZXhwIjoyMDc1MDg2MjU3fQ.XLsNhkZE79g4HrSosEnxgGpYwGC95nWwHQtpR5mdiuQ
```

### Step 4: Add Stripe Secrets

#### VITE_STRIPE_PUBLISHABLE_KEY

```
pk_test_51RtCWi3ySFkJEQXkZns3C60KhWwr8XuqXydtnMM2cwnvBNss6CsaeQBwHzrFqBAB9A0QMLbslX3R5FRVuPIaGwG800BRlTQvle
```

#### STRIPE_SECRET_KEY

```
sk_test_51RtCWi3ySFkJEQXkvnX6i76neuywIoPFWdIigbpk42NSWKEytE6qeZn2plPD0l9HhvLeOTMcOGBgfbnW0KMo3dhh004Sr9JBUO
```

#### STRIPE_WEBHOOK_SECRET

```
whsec_jftb01DjPvQHN6I4cv2e0XZHWxsv6elX
```

#### Stripe Price IDs (Optional but recommended)

<details>
<summary>Click to expand all Stripe Price IDs</summary>

```bash
# Maid Plans
VITE_STRIPE_MAID_PRO_MONTHLY=price_1RuWvy3ySFkJEQXknIW9hIBU
VITE_STRIPE_MAID_PRO_ANNUAL=price_1SIEKk3ySFkJEQXkQxRTmti8
VITE_STRIPE_MAID_PREMIUM_MONTHLY=price_1RuWxx3ySFkJEQXkKKpUrHX9
VITE_STRIPE_MAID_PREMIUM_ANNUAL=price_1SIGKI3ySFkJEQXkDHGg6L7L

# Sponsor Plans
VITE_STRIPE_SPONSOR_PRO_MONTHLY=price_1RuTkb3ySFkJEQXkWnQzNRHK
VITE_STRIPE_SPONSOR_PRO_ANNUAL=price_1RuTne3ySFkJEQXkIsSElFmY
VITE_STRIPE_SPONSOR_PREMIUM_MONTHLY=price_1RuUFx3ySFkJEQXkQwHSonGQ
VITE_STRIPE_SPONSOR_PREMIUM_ANNUAL=price_1RuUIY3ySFkJEQXkVJUkFSum

# Agency Plans
VITE_STRIPE_AGENCY_PRO_MONTHLY=price_1RuVMK3ySFkJEQXk68BuD5Wt
VITE_STRIPE_AGENCY_PRO_ANNUAL=price_1RuWnE3ySFkJEQXkJTF0QON2
VITE_STRIPE_AGENCY_PREMIUM_MONTHLY=price_1RuWrr3ySFkJEQXk49EgguMT
VITE_STRIPE_AGENCY_PREMIUM_ANNUAL=price_1RuWpW3ySFkJEQXk68mfAktN
```

</details>

### Step 5: Add Twilio Secrets

#### VITE_TWILIO_ACCOUNT_SID

```
ACbfdadc1ba60a882a64b410046ca3c8a6
```

#### TWILIO_AUTH_TOKEN

```
fdf1da8e7b8b2a7c799d3e4a49c3b2de
```

#### VITE_TWILIO_PHONE_NUMBER

```
+17176998295
```

### Step 6: Add Additional Service Secrets

#### SENDGRID_API_KEY

```
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
```

#### ELEVENLABS_API_KEY

```
sk_321124673d200067686fe8f1e12bbeea09fa4d41e3028a41
```

#### VITE_ELEVENLABS_AGENT_ID

```
agent_5301k3h9y7cbezt8kq5s38a0857h
```

#### GITHUB_TOKEN (For GitHub Actions)

```
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
```

---

## Method 2: Via GitHub CLI (Faster)

### Prerequisites

```bash
# Install GitHub CLI if not installed
# Windows: winget install GitHub.cli
# Mac: brew install gh
# Linux: See https://github.com/cli/cli#installation

# Authenticate
gh auth login
```

### Run Setup Script

Save this as `scripts/setup-github-secrets.sh`:

```bash
#!/bin/bash

# Vercel Secrets
gh secret set VERCEL_TOKEN --body "olBORiuI87mRG6Qo1NR00mAD"
gh secret set VERCEL_ORG_ID --body "team_XnY1b9HZxbTV3OElmnJdJIZI"
gh secret set VERCEL_PROJECT_ID --body "ulove882's projects"

# Supabase Secrets
gh secret set VITE_SUPABASE_URL --body "https://kstoksqbhmxnrmspfywm.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTAyNTcsImV4cCI6MjA3NTA4NjI1N30.es6ozZDte5pOHA7Y1exXwdUybM-5WTxnrADKpbSGyzw"
gh secret set SUPABASE_SERVICE_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUxMDI1NywiZXhwIjoyMDc1MDg2MjU3fQ.XLsNhkZE79g4HrSosEnxgGpYwGC95nWwHQtpR5mdiuQ"

# Stripe Secrets
gh secret set VITE_STRIPE_PUBLISHABLE_KEY --body "pk_test_51RtCWi3ySFkJEQXkZns3C60KhWwr8XuqXydtnMM2cwnvBNss6CsaeQBwHzrFqBAB9A0QMLbslX3R5FRVuPIaGwG800BRlTQvle"
gh secret set STRIPE_SECRET_KEY --body "sk_test_51RtCWi3ySFkJEQXkvnX6i76neuywIoPFWdIigbpk42NSWKEytE6qeZn2plPD0l9HhvLeOTMcOGBgfbnW0KMo3dhh004Sr9JBUO"
gh secret set STRIPE_WEBHOOK_SECRET --body "whsec_jftb01DjPvQHN6I4cv2e0XZHWxsv6elX"

# Twilio Secrets
gh secret set VITE_TWILIO_ACCOUNT_SID --body "ACbfdadc1ba60a882a64b410046ca3c8a6"
gh secret set TWILIO_AUTH_TOKEN --body "fdf1da8e7b8b2a7c799d3e4a49c3b2de"
gh secret set VITE_TWILIO_PHONE_NUMBER --body "+17176998295"

# Additional Services
gh secret set SENDGRID_API_KEY --body "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"
gh secret set ELEVENLABS_API_KEY --body "sk_321124673d200067686fe8f1e12bbeea09fa4d41e3028a41"
gh secret set VITE_ELEVENLABS_AGENT_ID --body "agent_5301k3h9y7cbezt8kq5s38a0857h"
gh secret set GITHUB_TOKEN --body "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"

echo "✅ All secrets added successfully!"
```

Then run:

```bash
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh
```

---

## Verification

### Verify Secrets are Set

Via GitHub CLI:

```bash
gh secret list
```

Expected output:

```
VERCEL_TOKEN                 Updated 2025-10-29
VERCEL_ORG_ID                Updated 2025-10-29
VERCEL_PROJECT_ID            Updated 2025-10-29
VITE_SUPABASE_URL            Updated 2025-10-29
VITE_SUPABASE_ANON_KEY       Updated 2025-10-29
...
```

### Test Deployment

1. Push a commit to trigger deployment:

```bash
git commit --allow-empty -m "test: trigger deployment"
git push origin development
```

2. Check GitHub Actions:
   - Go to: https://github.com/umero882/ethiopian-maids-st/actions
   - Verify CI and Deploy workflows run successfully

3. Check Vercel Dashboard:
   - Go to: https://vercel.com/dashboard
   - Verify deployments appear for all environments

---

## Environment-Specific Configurations

### Production (main branch)

- Uses all the secrets above
- Stripe: Test keys (upgrade to live keys when ready for production)
- Supabase: Same project (consider separate production database)

### Staging (staging branch)

- Uses same secrets as production
- Good for QA and testing before production release

### Development (development branch)

- Uses same secrets
- For active development and feature testing

---

## Security Best Practices

### ✅ Do:

- Rotate secrets regularly (every 90 days)
- Use separate keys per environment when possible
- Monitor secret usage in GitHub Actions logs
- Revoke old secrets after rotation
- Keep this document secure

### ❌ Don't:

- Commit secrets to repository
- Share secrets via insecure channels (email, chat)
- Use production keys in development
- Leave unused secrets active
- Expose secrets in logs or error messages

---

## Updating Secrets

To update a secret:

### Via GitHub Web:

1. Go to repository secrets page
2. Click on secret name
3. Click **Update secret**
4. Enter new value
5. Click **Update secret**

### Via GitHub CLI:

```bash
gh secret set SECRET_NAME --body "new_value"
```

---

## Troubleshooting

### Secret not available in workflow

- Check secret name matches exactly (case-sensitive)
- Verify secret is set at repository level, not environment level
- Check workflow has permission to access secrets

### Deployment fails with authentication error

- Verify VERCEL_TOKEN is correct
- Check token hasn't expired
- Ensure token has deployment permissions

### API calls fail in deployed app

- Verify environment variables are set in Vercel dashboard
- Check variable names start with `VITE_` for client-side access
- Confirm no typos in variable names

---

## Next Steps

After setting up secrets:

1. ✅ Configure Vercel project (see `VERCEL_SETUP.md`)
2. ✅ Set up branch protection rules (see `BRANCH_STRATEGY.md`)
3. ✅ Test deployment pipeline
4. ✅ Monitor first deployment
5. ✅ **DELETE THIS FILE** for security

---

## Support

- GitHub Secrets Docs: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- Vercel Deployment: https://vercel.com/docs/deployments/git
- Team Lead: [Contact information]

---

**⚠️ REMINDER: Delete this file after completing setup!**

**Last Updated**: 2025-10-29
