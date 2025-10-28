# Deployment Checklist

Complete step-by-step guide to deploy the Ethiopian Maids Platform to production.

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All tests pass locally (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors or warnings
- [ ] Code reviewed and approved

### ✅ Environment Setup
- [ ] GitHub repository created: `umero882/ethiopian-maids-st`
- [ ] All three branches exist: `main`, `staging`, `development`
- [ ] `.env.local` configured for local development
- [ ] Credentials secured and not committed to git

### ✅ Documentation
- [ ] README.md up to date
- [ ] API documentation current
- [ ] Deployment guides reviewed
- [ ] Team onboarding docs ready

---

## 🔐 Step 1: Configure GitHub Secrets

### Option A: Automated Setup (Recommended)

**Using PowerShell** (Windows):
```powershell
.\scripts\setup-github-secrets.ps1
```

**Using Bash** (Mac/Linux):
```bash
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh
```

### Option B: Manual Setup

Follow instructions in `GITHUB_SECRETS_SETUP.md`

### Verification:
```bash
gh secret list
```

**Expected**: 16+ secrets listed

---

## 🚀 Step 2: Set Up Vercel

### 2.1 Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with GitHub account
3. Grant Vercel access to repository

### 2.2 Import Project

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select `umero882/ethiopian-maids-st`
4. Click **Import**

### 2.3 Configure Build Settings

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
Development Command: npm run dev
Node.js Version: 20.x
```

### 2.4 Configure Production Environment

1. **Environment**: Production
2. **Git Branch**: `main`
3. **Domain**: `ethiopian-maids.vercel.app`

#### Add Environment Variables:

Go to **Settings** → **Environment Variables** → **Production**

```bash
# Supabase
VITE_SUPABASE_URL=https://kstoksqbhmxnrmspfywm.supabase.co
VITE_SUPABASE_ANON_KEY=[your_anon_key]

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=[your_pk_test_key]
STRIPE_SECRET_KEY=[your_sk_test_key]

# Twilio
VITE_TWILIO_ACCOUNT_SID=[your_account_sid]
VITE_TWILIO_PHONE_NUMBER=[your_phone_number]

# App Config
NODE_ENV=production
VITE_APP_URL=https://ethiopian-maids.vercel.app
```

### 2.5 Configure Staging Environment

1. Click **Add Environment**
2. **Name**: `Preview` (for staging branch)
3. **Git Branch**: `staging`
4. Add same environment variables as production

### 2.6 Configure Development Environment

1. Click **Add Environment**
2. **Name**: `Development`
3. **Git Branch**: `development`
4. Add same environment variables with dev URLs

### Verification:
- [ ] Production environment created
- [ ] Staging environment created
- [ ] Development environment created
- [ ] All environment variables set

---

## 🛡️ Step 3: Set Up Branch Protection

### 3.1 Navigate to Branch Settings

1. Go to https://github.com/umero882/ethiopian-maids-st/settings/branches
2. Click **Add branch protection rule**

### 3.2 Protect `main` Branch

**Branch name pattern**: `main`

**Settings**:
- ✅ Require pull request reviews before merging
  - Required approvals: 1
  - Dismiss stale reviews: Yes
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date
  - ✅ CI / build
  - ✅ CI / test
- ✅ Require conversation resolution before merging
- ✅ Include administrators
- ✅ Restrict who can push to matching branches
- ❌ Allow force pushes: No
- ❌ Allow deletions: No

**Click**: Save changes

### 3.3 Protect `staging` Branch

**Branch name pattern**: `staging`

**Settings**:
- ✅ Require status checks to pass before merging
  - ✅ CI / build
  - ✅ CI / test
- ✅ Require conversation resolution before merging
- ❌ Allow force pushes: No
- ❌ Allow deletions: No

**Click**: Save changes

### 3.4 Protect `development` Branch (Optional)

**Branch name pattern**: `development`

**Settings**:
- ⚠️ Require status checks to pass (recommended but not required)
- ❌ Allow deletions: No

**Click**: Save changes

### Verification:
```bash
# Check branch protection
gh api repos/umero882/ethiopian-maids-st/branches/main/protection
```

---

## 🧪 Step 4: Test Deployment Pipeline

### 4.1 Test Development Deployment

```bash
# Create test feature
git checkout development
git checkout -b feature/test-deployment
echo "test" >> test-deployment.txt
git add test-deployment.txt
git commit -m "test: verify deployment pipeline"
git push origin feature/test-deployment
```

**Actions**:
1. Go to GitHub and create PR to `development`
2. Watch CI run automatically
3. Verify all checks pass
4. Merge PR
5. Watch deployment to development environment

**Expected Results**:
- ✅ CI workflow runs and passes
- ✅ Auto-deployment to dev.vercel.app
- ✅ PR comment with deployment URL

### 4.2 Test Staging Deployment

```bash
# Promote to staging
git checkout staging
git merge development
git push origin staging
```

**Expected Results**:
- ✅ CI workflow runs on staging
- ✅ Security audit runs
- ✅ Auto-deployment to staging.vercel.app

### 4.3 Test Production Deployment

```bash
# Create PR to main
git checkout main
# On GitHub: Create PR from staging → main
# Review, approve, and merge
```

**Expected Results**:
- ✅ CI workflow runs on main
- ✅ All checks pass
- ✅ Auto-deployment to production
- ✅ Production URL accessible

### Cleanup:
```bash
# Delete test branch
git branch -d feature/test-deployment
git push origin --delete feature/test-deployment
rm test-deployment.txt
```

---

## 🔍 Step 5: Verify Deployments

### 5.1 Check GitHub Actions

Go to: https://github.com/umero882/ethiopian-maids-st/actions

**Verify**:
- ✅ All workflows show green checkmarks
- ✅ No failed deployments
- ✅ Build times are reasonable (<5 minutes)

### 5.2 Check Vercel Deployments

Go to: https://vercel.com/dashboard

**Verify**:
- ✅ Production deployment successful
- ✅ Staging deployment successful
- ✅ Development deployment successful
- ✅ All URLs accessible

### 5.3 Test Deployed Applications

#### Production: https://ethiopian-maids.vercel.app
- [ ] Home page loads
- [ ] Authentication works
- [ ] Database connections successful
- [ ] API endpoints responding
- [ ] Stripe integration working
- [ ] Twilio SMS working
- [ ] No console errors

#### Staging: https://ethiopian-maids-staging.vercel.app
- [ ] Same tests as production
- [ ] Can test without affecting production

#### Development: https://ethiopian-maids-dev.vercel.app
- [ ] Latest features visible
- [ ] Debug mode enabled

---

## 📊 Step 6: Set Up Monitoring

### 6.1 Enable Vercel Analytics

1. Go to Vercel project settings
2. Click **Analytics** tab
3. Click **Enable Analytics**

### 6.2 Enable Speed Insights

```bash
npm install @vercel/speed-insights
```

Add to `src/main.jsx`:
```javascript
import { SpeedInsights } from '@vercel/speed-insights/react'

// In your App component
<SpeedInsights />
```

### 6.3 Set Up Error Tracking (Optional)

Consider setting up:
- Sentry for error tracking
- LogRocket for session replay
- Datadog for infrastructure monitoring

---

## 🎯 Step 7: Configure Custom Domain (Optional)

### 7.1 Add Domain in Vercel

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `ethiopian-maids.com`
4. Click **Add**

### 7.2 Configure DNS

Add these records to your DNS provider:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: CNAME
Name: staging
Value: cname.vercel-dns.com

Type: CNAME
Name: dev
Value: cname.vercel-dns.com
```

### 7.3 Wait for SSL

- DNS propagation: 24-48 hours
- SSL certificate: Automatic (Let's Encrypt)
- HTTPS redirect: Automatic

---

## ✅ Post-Deployment Checklist

### Security
- [ ] All API keys rotated from defaults
- [ ] Environment variables properly scoped
- [ ] Secrets not exposed in client code
- [ ] HTTPS enabled and enforced
- [ ] Security headers configured

### Performance
- [ ] Lighthouse score > 90
- [ ] Load time < 3 seconds
- [ ] Images optimized
- [ ] Code split and lazy loaded
- [ ] CDN caching configured

### Monitoring
- [ ] Analytics enabled
- [ ] Error tracking active
- [ ] Uptime monitoring set up
- [ ] Performance monitoring active
- [ ] Logs accessible

### Documentation
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Team access configured
- [ ] On-call rotation established
- [ ] Incident response plan created

### Communication
- [ ] Team notified of deployment
- [ ] Stakeholders informed
- [ ] Users notified (if breaking changes)
- [ ] Support team briefed
- [ ] Documentation updated

---

## 🚨 Rollback Procedure

### Quick Rollback (Vercel Dashboard)

1. Go to **Deployments** tab
2. Find last stable deployment
3. Click **...** → **Promote to Production**
4. Confirm promotion

### Git Rollback

```bash
# Find commit to revert to
git log --oneline -10

# Revert to specific commit
git checkout main
git revert <bad-commit-hash>
git push origin main

# Or reset (use carefully!)
git reset --hard <good-commit-hash>
git push origin main --force  # Requires override protection
```

### Database Rollback

1. Have migration rollback scripts ready
2. Test rollback in staging first
3. Execute rollback on production
4. Verify data integrity

---

## 📞 Support Contacts

### Team
- **Tech Lead**: [Name/Contact]
- **DevOps**: [Name/Contact]
- **Database Admin**: [Name/Contact]

### Services
- **Vercel Support**: https://vercel.com/support
- **GitHub Support**: https://support.github.com
- **Supabase Support**: https://supabase.com/support

---

## 🎉 Success Criteria

Deployment is successful when:

- ✅ All environments deployed and accessible
- ✅ All tests passing in production
- ✅ No errors in logs
- ✅ Performance metrics meet targets
- ✅ All integrations working (Stripe, Twilio, etc.)
- ✅ Team can access and monitor systems
- ✅ Rollback procedure tested and ready

---

**Congratulations! Your application is now deployed! 🚀**

**Last Updated**: 2025-10-29
**Deployed By**: [Your Name]
**Deployment Date**: [Date]
