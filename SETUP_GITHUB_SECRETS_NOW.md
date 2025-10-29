# 🔐 Setup GitHub Secrets - Action Required

## Current Status
✅ Deployment infrastructure is ready
✅ CI/CD workflows configured
✅ Vercel configuration complete
⏳ **GitHub Secrets need to be configured**

---

## Quick Setup (Choose One Method)

### Method 1: Automated Setup (5 minutes) ⚡ **RECOMMENDED**

1. **Install GitHub CLI:**
   ```powershell
   winget install GitHub.cli
   ```

2. **Authenticate:**
   ```powershell
   gh auth login
   ```
   - Select: **GitHub.com**
   - Select: **HTTPS**
   - Select: **Login with a web browser**
   - Complete authentication in browser

3. **Run the automated script:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/setup-github-secrets.ps1
   ```

4. **Verify secrets:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/check-github-secrets.ps1
   ```

✅ **Done! Skip to "After Setup" section**

---

### Method 2: Manual Setup (15 minutes) 🖱️

**If you prefer not to install GitHub CLI, follow these steps:**

1. **Open GitHub Secrets Page:**
   ```
   https://github.com/umero882/ethiopian-maids-st/settings/secrets/actions
   ```

2. **Click "New repository secret" for each secret below**

3. **Add Required Secrets:**

   #### Vercel (Required for deployment)
   - **Name:** `VERCEL_TOKEN`
     **Value:** `olBORiuI87mRG6Qo1NR00mAD`

   - **Name:** `VERCEL_ORG_ID`
     **Value:** `team_XnY1b9HZxbTV3OElmnJdJIZI`

   - **Name:** `VERCEL_PROJECT_ID`
     **Value:** `prj_T3mzPCeUM1kWrMaqf6E2Cad9lPQ3`

   #### Supabase (Required for database)
   - **Name:** `VITE_SUPABASE_URL`
     **Value:** `https://kstoksqbhmxnrmspfywm.supabase.co`

   - **Name:** `VITE_SUPABASE_ANON_KEY`
     **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTAyNTcsImV4cCI6MjA3NTA4NjI1N30.es6ozZDte5pOHA7Y1exXwdUybM-5WTxnrADKpbSGyzw`

   #### Stripe (Required for payments)
   - **Name:** `VITE_STRIPE_PUBLISHABLE_KEY`
     **Value:** `pk_test_51RtCWi3ySFkJEQXkZns3C60KhWwr8XuqXydtnMM2cwnvBNss6CsaeQBwHzrFqBAB9A0QMLbslX3R5FRVuPIaGwG800BRlTQvle`

4. **Optional Secrets** (can be added later):
   - See `GITHUB_SECRETS_SETUP.md` for:
     - Additional Stripe secrets (webhook, secret key)
     - Twilio secrets (SMS/phone)
     - SendGrid (email)
     - ElevenLabs (voice AI)

✅ **Done! Continue to "After Setup"**

---

## After Setup

### 1. Verify Secrets are Set

**With GitHub CLI:**
```powershell
gh secret list
```

**Without GitHub CLI:**
Visit: https://github.com/umero882/ethiopian-maids-st/settings/secrets/actions
You should see all your secrets listed.

### 2. Push Changes to Trigger First Deployment

```bash
git push origin main
```

This will trigger:
- ✅ CI workflow (build, test, lint)
- ✅ Deploy workflow (deploy to Vercel)

### 3. Monitor Deployment

**GitHub Actions:**
```
https://github.com/umero882/ethiopian-maids-st/actions
```

Watch for:
- ✅ Green checkmarks = Success
- ❌ Red X = Failed (check logs)

### 4. Configure Vercel Project

After first deployment:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project
3. Go to **Settings** → **Environment Variables**
4. Add the same environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - (Set for: Production, Preview, Development)

---

## Verification Commands

After setup, run these to verify everything:

```bash
# Verify pre-deployment setup
npm run deploy:verify

# Check GitHub secrets (requires gh CLI)
powershell -ExecutionPolicy Bypass -File scripts/check-github-secrets.ps1

# Monitor health after first deployment
npm run deploy:health
```

---

## Troubleshooting

### "winget" command not found
- Update Windows to latest version
- Or download GitHub CLI from: https://cli.github.com/

### "gh auth login" fails
- Make sure you have a GitHub account
- Try: `gh auth login --web`

### Secrets not working in workflow
- Check secret names are EXACTLY as shown (case-sensitive)
- Verify you have admin access to the repository
- Wait 1-2 minutes after adding secrets

### Deployment still fails
- Check workflow logs: https://github.com/umero882/ethiopian-maids-st/actions
- Verify all 6 required secrets are set
- Ensure Vercel token has deployment permissions

---

## Security Reminders

✅ **DO:**
- Keep `GITHUB_SECRETS_SETUP.md` secure
- Delete it after setup is complete
- Rotate secrets every 90 days

❌ **DON'T:**
- Commit secrets to git
- Share secrets via email/chat
- Use production secrets in development

---

## Next Steps After Secrets are Set

1. ✅ Push to GitHub: `git push origin main`
2. ✅ Watch deployment in Actions tab
3. ✅ Configure Vercel environment variables
4. ✅ Test the deployed application
5. ✅ Run: `npm run deploy:health`
6. ✅ Delete `GITHUB_SECRETS_SETUP.md`

---

## Quick Commands Reference

```powershell
# Install GitHub CLI
winget install GitHub.cli

# Authenticate
gh auth login

# Setup secrets (automated)
powershell -ExecutionPolicy Bypass -File scripts/setup-github-secrets.ps1

# Check secrets
powershell -ExecutionPolicy Bypass -File scripts/check-github-secrets.ps1

# List secrets
gh secret list

# Trigger deployment
git push origin main
```

---

## Status Checklist

- [ ] GitHub CLI installed (or using manual method)
- [ ] GitHub CLI authenticated (if using automated method)
- [ ] All 6 required secrets added
- [ ] Optional secrets added (if needed)
- [ ] Secrets verified
- [ ] Changes pushed to GitHub
- [ ] First deployment monitored
- [ ] Vercel environment variables configured
- [ ] Health check passed
- [ ] `GITHUB_SECRETS_SETUP.md` deleted

---

## Support

- **GitHub Secrets Docs:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **GitHub CLI Docs:** https://cli.github.com/manual/
- **Vercel Deployment:** https://vercel.com/docs/deployments/git
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`

---

**⚡ Ready to Setup?**

Choose Method 1 (Automated) or Method 2 (Manual) above and follow the steps!

**Last Updated:** 2025-01-29
