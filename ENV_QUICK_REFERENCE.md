# Environment Variables - Quick Reference Guide

## TL;DR - Critical Security Rules

1. **Frontend variables MUST have `VITE_` prefix** - These are public and visible in browser
2. **Backend secrets MUST NOT have `VITE_` prefix** - These stay server-side only
3. **Never commit `.env` files to git** - Use `.env.example` for templates
4. **Rotate secrets immediately if exposed** - Better safe than sorry

---

## File Structure

```
ethiopian-maids/
├── .env                      # Current environment (DO NOT COMMIT)
├── .env.example              # Template with placeholders (safe to commit)
├── .env.frontend             # Public variables only (reference)
├── .env.backend              # Private variables only (DO NOT COMMIT)
├── .env.local                # Local overrides (DO NOT COMMIT)
├── .env.production           # Production config (DO NOT COMMIT)
└── .gitignore                # Protects all .env files
```

---

## Quick Decision Tree

```
Is this an API key, secret, or password?
│
├─ YES → Is it safe to expose in browser?
│   │
│   ├─ YES (public/anon keys) → Use VITE_ prefix → Put in .env.frontend
│   │   Examples: VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLISHABLE_KEY
│   │
│   └─ NO (secret keys) → NO VITE_ prefix → Put in .env.backend
│       Examples: STRIPE_SECRET_KEY, TWILIO_AUTH_TOKEN
│
└─ NO → Is it a configuration value?
    │
    ├─ YES → Use VITE_ prefix → Put in .env.frontend
    │   Examples: VITE_APP_NAME, VITE_API_URL, VITE_ENABLE_CHAT
    │
    └─ NO → Backend config → NO VITE_ prefix → Put in .env.backend
        Examples: PORT, NODE_ENV, DATABASE_URL
```

---

## Common Variables Reference

### SAFE for Frontend (use VITE_ prefix)

```bash
# Application Config
VITE_APP_NAME=Ethiopian Maids Platform
VITE_APP_URL=http://localhost:5173
VITE_APP_ENVIRONMENT=development

# Supabase Public
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...  # This is the anon/public key

# Stripe Public
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # Starts with pk_test or pk_live

# Twilio Public
VITE_TWILIO_ACCOUNT_SID=ACxxx  # Account SID is safe
VITE_TWILIO_PHONE_NUMBER=+1xxx

# Feature Flags
VITE_ENABLE_CHAT=true
VITE_ENABLE_ANALYTICS=false

# API Endpoints
VITE_API_URL=http://localhost:3001/api
VITE_CHAT_SERVER_URL=http://localhost:3001
```

### DANGEROUS for Frontend (NO VITE_ prefix)

```bash
# Supabase Private
SUPABASE_SERVICE_KEY=eyJhbGci...  # Full database access
SUPABASE_ACCESS_TOKEN=sbp_xxx     # Management access

# Stripe Private
STRIPE_SECRET_KEY=sk_test_xxx     # Starts with sk_test or sk_live
STRIPE_WEBHOOK_SECRET=whsec_xxx   # For webhook verification

# Twilio Private
TWILIO_AUTH_TOKEN=xxx             # Allows SMS sending
TWILIO_API_KEY_SECRET=xxx         # API authentication

# Email Service
SENDGRID_API_KEY=SG.xxx           # Email sending
EMAIL_PASSWORD=xxx                # Gmail app password

# Voice/AI Services
ELEVENLABS_API_KEY=sk_xxx         # Voice agent access
OPENAI_API_KEY=sk-xxx             # AI access

# Server Config
PORT=3001
DATABASE_URL=postgresql://xxx
```

---

## Common Mistakes & How to Fix

### Mistake 1: Secret with VITE_ prefix

**WRONG:**
```bash
VITE_STRIPE_SECRET_KEY=sk_test_xxx
VITE_TWILIO_AUTH_TOKEN=xxx
```

**RIGHT:**
```bash
STRIPE_SECRET_KEY=sk_test_xxx
TWILIO_AUTH_TOKEN=xxx
```

**Why:** `VITE_` prefix exposes variable in browser bundle where anyone can see it.

---

### Mistake 2: Missing VITE_ for frontend config

**WRONG:**
```bash
API_URL=http://localhost:3001
ENABLE_CHAT=true
```

**RIGHT:**
```bash
VITE_API_URL=http://localhost:3001
VITE_ENABLE_CHAT=true
```

**Why:** Without `VITE_` prefix, Vite won't include it in the build, causing `undefined` errors.

---

### Mistake 3: Committing .env to git

**WRONG:**
```bash
git add .env
git commit -m "Added config"
```

**RIGHT:**
```bash
# .env should already be in .gitignore
git add .env.example  # Only commit the template
git commit -m "Updated env template"
```

**Why:** Committing secrets to git exposes them forever in history, even if deleted later.

---

### Mistake 4: Using test keys in production

**WRONG:**
```bash
# In production environment
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

**RIGHT:**
```bash
# In production environment
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
```

**Why:** Test keys don't process real payments and can cause production failures.

---

## Development Workflow

### Initial Setup

```bash
# 1. Copy template to .env
cp .env.example .env

# 2. Fill in your actual values
# Edit .env with your API keys (get from dashboards)

# 3. Never commit .env
git status  # Should NOT show .env

# 4. Start development
npm run dev
```

### Adding New Environment Variable

```bash
# 1. Decide: Frontend or Backend?
# Frontend (visible in browser) → use VITE_ prefix
# Backend (server-only) → NO VITE_ prefix

# 2. Add to appropriate files
echo "VITE_NEW_PUBLIC_VAR=value" >> .env.frontend
echo "NEW_PRIVATE_VAR=value" >> .env.backend

# 3. Add to .env (your local working copy)
echo "VITE_NEW_PUBLIC_VAR=value" >> .env

# 4. Add to .env.example (template for team)
echo "VITE_NEW_PUBLIC_VAR=your_value_here" >> .env.example

# 5. Document in code
# src/config/environmentConfig.js
VITE_NEW_PUBLIC_VAR: {
  required: false,
  type: 'string',
  description: 'What this variable does',
}

# 6. Commit only the example
git add .env.example
git commit -m "docs: add NEW_PUBLIC_VAR environment variable"
```

---

## Deployment Checklist

### Vercel (Frontend)

```bash
# 1. Go to Vercel Dashboard → Settings → Environment Variables

# 2. Add ONLY frontend variables (with VITE_ prefix)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
# ... etc

# 3. Set for all environments:
# - Production
# - Preview
# - Development

# 4. NEVER add backend secrets to Vercel
# ❌ NO: STRIPE_SECRET_KEY
# ❌ NO: TWILIO_AUTH_TOKEN
```

### Supabase Edge Functions (Backend)

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link project
supabase link --project-ref kstoksqbhmxnrmspfywm

# 4. Set secrets (NO VITE_ prefix)
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set TWILIO_AUTH_TOKEN=xxx
supabase secrets set SENDGRID_API_KEY=SG.xxx
supabase secrets set ELEVENLABS_API_KEY=sk_xxx

# 5. Deploy functions
supabase functions deploy

# 6. Verify
supabase secrets list
```

---

## Emergency Response

### If Secrets Are Exposed

**Immediate Actions (within 1 hour):**

1. **Rotate the exposed credential immediately**
   - Supabase: Project Settings → API → Reset service role key
   - Stripe: Dashboard → Developers → API Keys → Roll secret key
   - Twilio: Console → Account → Auth Token → Regenerate
   - SendGrid: Settings → API Keys → Delete old, create new

2. **Update everywhere it's used**
   - Local `.env` file
   - Vercel environment variables
   - Supabase secrets
   - CI/CD pipelines

3. **Verify no unauthorized usage**
   - Check API logs for unusual activity
   - Review recent transactions/operations
   - Monitor for next 24-48 hours

4. **Document the incident**
   - What was exposed and when
   - How it was exposed
   - Actions taken
   - Lessons learned

**Prevention (within 24 hours):**

5. **Add secret scanning**
   ```bash
   # Install gitleaks
   brew install gitleaks

   # Scan repository
   gitleaks detect --source . --verbose

   # Add pre-commit hook
   # .husky/pre-commit
   gitleaks protect --staged
   ```

6. **Review access controls**
   - Who has access to `.env` files?
   - Who can deploy to production?
   - Are credentials shared securely?

---

## Testing Your Configuration

### Verify Frontend Variables Are Accessible

```javascript
// In any React component
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('App Name:', import.meta.env.VITE_APP_NAME);

// Should see values, not undefined
```

### Verify Backend Variables Are NOT in Bundle

```bash
# Build production bundle
npm run build

# Search for secrets (should find NONE)
grep -r "sk_test" dist/
grep -r "sk_live" dist/
grep -r "whsec_" dist/
grep -r "TWILIO_AUTH_TOKEN" dist/

# If any found, SECRET IS EXPOSED!
```

### Verify .env is Not Tracked

```bash
# Check if .env is in git
git ls-files | grep "^\.env$"

# Should return empty (no results)

# If .env is shown, remove it:
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

## Get Help

### Before Adding New Environment Variable

Ask yourself:
1. Is this visible to users in the browser? → `VITE_` prefix
2. Is this a secret that must stay private? → NO `VITE_` prefix
3. Where does this value come from? → Document in `.env.example`
4. What happens if this leaks? → If bad, it's backend-only

### If Unsure

**Default to secure:**
- When in doubt, DO NOT use `VITE_` prefix
- When in doubt, treat as secret
- When in doubt, ask security team
- When in doubt, check this guide

### Resources

- Full audit: `ENV_SECURITY_AUDIT_REPORT.md`
- Template: `.env.example`
- Vite docs: https://vitejs.dev/guide/env-and-mode.html
- Security team: (your contact here)

---

**Remember:** It's better to ask than to expose secrets!

Last updated: 2025-10-15
