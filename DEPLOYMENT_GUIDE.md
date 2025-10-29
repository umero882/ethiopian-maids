# Ethiopian Maids Platform - Deployment Guide

This comprehensive guide covers GitHub Actions CI/CD setup, Vercel deployment, and deployment verification.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Actions CI/CD Setup](#github-actions-cicd-setup)
3. [Vercel Deployment Configuration](#vercel-deployment-configuration)
4. [Deployment Verification](#deployment-verification)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 20.x installed
- ✅ GitHub repository set up
- ✅ Vercel account created
- ✅ Required API keys (Supabase, Stripe, Twilio)
- ✅ Git installed and configured

---

## GitHub Actions CI/CD Setup

### 1. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

**Navigate to:** `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

#### Required Secrets:

```bash
# Vercel Deployment
VERCEL_TOKEN=                    # Get from Vercel Account Settings
VERCEL_ORG_ID=                   # Get from Vercel Project Settings
VERCEL_PROJECT_ID=               # Get from Vercel Project Settings

# Supabase
VITE_SUPABASE_URL=              # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=         # Supabase anon/public key
SUPABASE_SERVICE_KEY=           # Supabase service role key (backend only)

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=    # Stripe publishable key
STRIPE_SECRET_KEY=              # Stripe secret key (backend only)
STRIPE_WEBHOOK_SECRET=          # Stripe webhook signing secret

# Twilio (Optional)
VITE_TWILIO_ACCOUNT_SID=        # Twilio Account SID
TWILIO_AUTH_TOKEN=              # Twilio Auth Token (backend only)
VITE_TWILIO_PHONE_NUMBER=       # Twilio phone number
```

### 2. Workflow Files

Our CI/CD uses two main workflows:

#### CI Workflow (`.github/workflows/ci.yml`)
- Runs on push and pull requests
- Validates environment configuration
- Runs linting and tests
- Builds the project
- Generates build reports
- Uploads artifacts

#### Deploy Workflow (`.github/workflows/deploy.yml`)
- Deploys to Vercel on push to main/staging/development
- Runs pre-deployment checks
- Builds and deploys to appropriate environment
- Verifies deployment health
- Creates deployment summaries
- Comments on PRs with deployment URLs

### 3. Branch Strategy

- **`main`**: Production environment (protected)
- **`staging`**: Staging environment for pre-production testing
- **`development`**: Development environment for active development

### 4. Verify CI/CD Setup

Run the pre-deployment verification:

```bash
npm run deploy:verify
```

This checks:
- ✅ Environment files
- ✅ Required environment variables
- ✅ GitHub workflows
- ✅ Package scripts
- ✅ Vercel configuration

---

## Vercel Deployment Configuration

### 1. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`

### 2. Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

#### Production Environment:
```bash
NODE_ENV=production
VITE_APP_NAME=@ethio-maids
VITE_APP_VERSION=0.1.0-alpha.0
VITE_APP_ENVIRONMENT=production

# Supabase
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Twilio
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_PHONE_NUMBER=+1234567890

# Feature Flags
VITE_ENABLE_CHAT=true
VITE_ENABLE_VIDEO_CALLS=false
VITE_ENABLE_ANALYTICS=true
```

#### Staging Environment:
```bash
NODE_ENV=staging
VITE_APP_ENVIRONMENT=staging
# ... (use staging API keys)
```

#### Development Environment:
```bash
NODE_ENV=development
VITE_APP_ENVIRONMENT=development
# ... (use development API keys)
```

### 3. Vercel Configuration (`vercel.json`)

Our `vercel.json` includes:

- ✅ Security headers (CSP, XSS protection)
- ✅ Cache optimization for assets
- ✅ SPA routing configuration
- ✅ GitHub integration
- ✅ Auto-alias for branches
- ✅ Auto-cancellation of outdated deployments

### 4. Deploy to Vercel

#### Option 1: Via GitHub Actions (Recommended)
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

The GitHub Action will automatically:
1. Run CI checks
2. Build the project
3. Deploy to Vercel
4. Verify deployment
5. Comment deployment URL

#### Option 2: Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to preview
npm run deploy

# Deploy to production
npm run deploy:prod
```

---

## Deployment Verification

### 1. Pre-Deployment Verification

Before deploying, verify your setup:

```bash
npm run deploy:verify
```

**Checks:**
- Environment file existence
- Required environment variables
- GitHub repository accessibility
- GitHub workflows presence
- Package scripts
- Vercel configuration
- Documentation completeness

### 2. Post-Deployment Verification

After deployment, verify the live application:

```bash
npm run deploy:check https://your-app.vercel.app
```

**Checks:**
- ✅ Home page accessibility
- ✅ Security headers
- ✅ Static assets
- ✅ SPA routing
- ✅ Performance metrics
- ✅ Environment detection

### 3. Health Monitoring

Monitor all environments:

```bash
npm run deploy:health
```

**Features:**
- Checks multiple environments (production, staging, development)
- Measures response times
- Verifies SSL certificates
- Generates health reports
- Saves historical data

### 4. Automated Verification in CI/CD

The deploy workflow automatically:
1. Validates environment configuration
2. Runs pre-deployment checks
3. Deploys to Vercel
4. Verifies deployment accessibility (HTTP 200 check)
5. Creates deployment summary
6. Comments on PRs with deployment URL

---

## Deployment Workflow

### Complete Deployment Process

```bash
# 1. Verify setup
npm run deploy:verify

# 2. Commit and push changes
git add .
git commit -m "feat: Add new feature"
git push origin main

# 3. GitHub Actions will:
#    - Run CI checks
#    - Build project
#    - Deploy to Vercel
#    - Verify deployment

# 4. After deployment, manually verify (optional)
npm run deploy:check https://your-app.vercel.app

# 5. Monitor health (optional)
npm run deploy:health
```

### Rollback Procedure

If a deployment fails:

1. **Via Vercel Dashboard:**
   - Go to Deployments
   - Find previous stable deployment
   - Click "Promote to Production"

2. **Via Git:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Emergency Rollback:**
   ```bash
   vercel rollback
   ```

---

## Environment-Specific Deployments

### Development
```bash
git checkout development
git add .
git commit -m "Your changes"
git push origin development
# Auto-deploys to development environment
```

### Staging
```bash
git checkout staging
git merge development
git push origin staging
# Auto-deploys to staging environment
```

### Production
```bash
git checkout main
git merge staging
git push origin main
# Auto-deploys to production environment
```

---

## Troubleshooting

### Common Issues

#### 1. Build Fails with Environment Variable Error

**Problem:** Missing required environment variables

**Solution:**
```bash
# Check .env file
npm run env:validate

# Verify Vercel environment variables
vercel env ls
```

#### 2. Deployment Succeeds but Site Shows 404

**Problem:** SPA routing not configured

**Solution:**
- Verify `vercel.json` has correct rewrites configuration
- Check build output directory is set to `dist`

#### 3. Slow Deployment Performance

**Problem:** Large bundle size or slow build

**Solution:**
```bash
# Analyze bundle
npm run analyze:bundle

# Check for large dependencies
npm run analyze:deps
```

#### 4. GitHub Actions Workflow Fails

**Problem:** Missing secrets or permissions

**Solution:**
1. Check GitHub secrets are set correctly
2. Verify workflow has correct permissions
3. Check workflow logs for specific errors

#### 5. Post-Deployment Check Fails

**Problem:** Site not accessible or security headers missing

**Solution:**
```bash
# Check specific deployment
npm run deploy:check https://your-deployment-url.vercel.app

# Review Vercel deployment logs
vercel logs
```

### Getting Help

- 📖 [Vercel Documentation](https://vercel.com/docs)
- 📖 [GitHub Actions Documentation](https://docs.github.com/en/actions)
- 📖 [Vite Documentation](https://vitejs.dev/guide/)
- 🐛 [Report Issues](https://github.com/umero882/ethiopian-maids-st/issues)

---

## Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files
   - Use `VITE_` prefix only for public variables
   - Keep secrets in GitHub Secrets and Vercel Environment Variables

2. **Dependencies:**
   - Regularly run `npm audit`
   - Keep dependencies up to date
   - Review security advisories

3. **Deployment:**
   - Always test in staging before production
   - Review deployment previews on PRs
   - Monitor deployment health regularly

4. **Access Control:**
   - Protect main and staging branches
   - Require PR reviews for production
   - Limit who can manage secrets

---

## Monitoring and Maintenance

### Regular Checks

- **Daily:** Monitor deployment health
  ```bash
  npm run deploy:health
  ```

- **Weekly:** Review deployment reports
  ```bash
  ls .deployment-reports/
  ```

- **Monthly:**
  - Update dependencies
  - Review security audits
  - Optimize performance

### Performance Monitoring

```bash
# Run Lighthouse audit
npm run performance:audit

# Analyze bundle size
npm run analyze:bundle
```

---

## Next Steps

After successful deployment:

1. ✅ Set up monitoring (Sentry, LogRocket, etc.)
2. ✅ Configure custom domain in Vercel
3. ✅ Set up SSL certificates (auto via Vercel)
4. ✅ Configure CDN and caching
5. ✅ Set up backup and disaster recovery
6. ✅ Document deployment procedures for team

---

## Support

For deployment assistance:
- Review this guide
- Check workflow logs in GitHub Actions
- Review Vercel deployment logs
- Contact the development team

**Last Updated:** 2025-01-29
**Version:** 1.0.0
