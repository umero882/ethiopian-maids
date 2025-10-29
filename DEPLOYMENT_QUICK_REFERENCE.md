# Deployment Quick Reference Card

Quick commands and workflows for Ethiopian Maids Platform deployment.

---

## 🚀 Quick Deploy Commands

```bash
# Interactive deployment wizard (recommended for manual deploys)
npm run deploy:quick

# Pre-deployment verification
npm run deploy:verify

# Post-deployment check (replace URL)
npm run deploy:check https://your-app.vercel.app

# Health monitoring (all environments)
npm run deploy:health
```

---

## 📋 Standard Deployment Workflow

### Option 1: Automated (Recommended)
```bash
git add .
git commit -m "Your commit message"
git push origin main  # or staging/development
# GitHub Actions handles the rest!
```

### Option 2: Manual via CLI
```bash
# Development/Staging
npm run deploy:quick

# Production
npm run deploy:prod
```

---

## 🌿 Branch → Environment Mapping

| Branch | Environment | Auto-Deploy | URL Pattern |
|--------|-------------|-------------|-------------|
| `main` | Production | ✅ Yes | `ethio-maids.vercel.app` |
| `staging` | Staging | ✅ Yes | `ethio-maids-staging.vercel.app` |
| `development` | Development | ✅ Yes | `ethio-maids-dev.vercel.app` |

---

## 🔐 Required GitHub Secrets

Setup at: `Settings` → `Secrets and variables` → `Actions`

```bash
VERCEL_TOKEN              # From Vercel account settings
VERCEL_ORG_ID            # From Vercel project settings
VERCEL_PROJECT_ID        # From Vercel project settings
VITE_SUPABASE_URL        # Supabase project URL
VITE_SUPABASE_ANON_KEY   # Supabase anon key
VITE_STRIPE_PUBLISHABLE_KEY  # Stripe publishable key
```

---

## ✅ Verification Checklist

Before deploying:
- [ ] Run `npm run deploy:verify`
- [ ] Tests passing: `npm test`
- [ ] Build successful: `npm run build`
- [ ] Environment variables set
- [ ] Code reviewed (if production)

After deploying:
- [ ] Run `npm run deploy:check <url>`
- [ ] Test critical functionality
- [ ] Check error monitoring
- [ ] Run `npm run deploy:health`

---

## 🆘 Emergency Rollback

### Via Vercel Dashboard:
1. Go to Deployments
2. Find previous stable deployment
3. Click "Promote to Production"

### Via Git:
```bash
git revert HEAD
git push origin main
```

### Via Vercel CLI:
```bash
vercel rollback
```

---

## 🔍 Troubleshooting Quick Fixes

### Build Fails
```bash
# Validate environment
npm run env:validate

# Check dependencies
npm ci
npm run build
```

### Deployment Fails
```bash
# Check Vercel logs
vercel logs

# Verify secrets
vercel env ls
```

### Site Returns 404
- Check `vercel.json` rewrites configuration
- Verify `outputDirectory` is set to `dist`

---

## 📊 Monitoring Commands

```bash
# Health check (all environments)
npm run deploy:health

# Performance audit
npm run performance:audit

# Security audit
npm run security:audit

# Bundle analysis
npm run analyze:bundle
```

---

## 📱 GitHub Actions Status

View workflow runs:
- Go to: `Actions` tab in GitHub
- Check recent workflow runs
- View logs for debugging

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Actions:** Your repo → Actions tab
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Setup Summary:** `DEPLOYMENT_SETUP_SUMMARY.md`

---

## 💡 Pro Tips

1. **Always test in development first:**
   ```bash
   git push origin development
   # Wait for deployment
   # Test thoroughly
   # Then promote to staging/production
   ```

2. **Use PR deployments for feature review:**
   - Create PR to main/staging
   - GitHub Actions creates preview deployment
   - Review before merging

3. **Monitor regularly:**
   ```bash
   # Set up a cron job or schedule
   npm run deploy:health
   ```

4. **Keep dependencies updated:**
   ```bash
   npm audit
   npm update
   ```

---

## 🎯 Common Tasks

### Deploy to Development
```bash
git checkout development
git pull origin development
# Make changes
git add .
git commit -m "feat: Your feature"
git push origin development
```

### Promote Development → Staging
```bash
git checkout staging
git merge development
git push origin staging
```

### Promote Staging → Production
```bash
git checkout main
git merge staging
git push origin main
```

---

## 📞 Getting Help

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review GitHub Actions logs
3. Check Vercel deployment logs
4. Review error messages in verification scripts

---

**Last Updated:** January 29, 2025
**Quick Reference Version:** 1.0.0
