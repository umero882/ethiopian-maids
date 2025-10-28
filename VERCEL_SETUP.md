# Vercel Deployment Setup

This guide will help you set up automated deployments to Vercel for all three environments: Production, Staging, and Development.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your repo at https://github.com/umero882/ethiopian-maids-st
3. **Vercel CLI** (optional): `npm install -g vercel`

## Quick Setup (Via Vercel Dashboard)

### 1. Connect GitHub Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select `umero882/ethiopian-maids-st`
4. Click **Import**

### 2. Configure Project

#### Build & Development Settings:
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
Development Command: npm run dev
```

#### Root Directory:
```
./
```

### 3. Set Up Production Environment

1. **Environment**: Production
2. **Git Branch**: `main`
3. **Domain**: `ethiopian-maids.vercel.app` (or custom domain)

#### Environment Variables:
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_PHONE_NUMBER=+1234567890

# App Config
NODE_ENV=production
VITE_APP_URL=https://ethiopian-maids.vercel.app
```

### 4. Create Staging Environment

1. Go to **Settings** → **Git**
2. Under **Production Branch**, keep `main`
3. Click **Add Environment**
   - Name: `staging`
   - Branch: `staging`
   - Domain: `ethiopian-maids-staging.vercel.app`

#### Environment Variables (Staging):
```bash
# Supabase Staging
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key

# Stripe Test Mode
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# Twilio (can use same as production or separate)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_staging_token
TWILIO_PHONE_NUMBER=+1234567890

# App Config
NODE_ENV=staging
VITE_APP_URL=https://ethiopian-maids-staging.vercel.app
```

### 5. Create Development Environment

1. Click **Add Environment** again
   - Name: `development`
   - Branch: `development`
   - Domain: `ethiopian-maids-dev.vercel.app`

#### Environment Variables (Development):
```bash
# Supabase Development
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key

# Stripe Test Mode
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# Twilio Development
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_dev_token
TWILIO_PHONE_NUMBER=+1234567890

# App Config
NODE_ENV=development
VITE_APP_URL=https://ethiopian-maids-dev.vercel.app
```

## Advanced Setup (Via GitHub Actions)

### 1. Get Vercel Tokens

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
cd "path/to/project"
vercel link

# Get project details
vercel project ls
```

### 2. Add GitHub Secrets

Go to **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

```bash
# Vercel Credentials
VERCEL_TOKEN=<from vercel.com/account/tokens>
VERCEL_ORG_ID=<from .vercel/project.json>
VERCEL_PROJECT_ID=<from .vercel/project.json>

# Production Environment Variables
VITE_SUPABASE_URL_PROD=https://your-prod.supabase.co
VITE_SUPABASE_ANON_KEY_PROD=your_prod_key
VITE_STRIPE_PUBLIC_KEY_PROD=pk_live_xxxxx
STRIPE_SECRET_KEY_PROD=sk_live_xxxxx

# Staging Environment Variables
VITE_SUPABASE_URL_STAGING=https://your-staging.supabase.co
VITE_SUPABASE_ANON_KEY_STAGING=your_staging_key
VITE_STRIPE_PUBLIC_KEY_STAGING=pk_test_xxxxx
STRIPE_SECRET_KEY_STAGING=sk_test_xxxxx

# Development Environment Variables
VITE_SUPABASE_URL_DEV=https://your-dev.supabase.co
VITE_SUPABASE_ANON_KEY_DEV=your_dev_key
VITE_STRIPE_PUBLIC_KEY_DEV=pk_test_xxxxx
STRIPE_SECRET_KEY_DEV=sk_test_xxxxx
```

### 3. Test Deployment

The deployment workflow is already configured in `.github/workflows/deploy.yml`

Push to any branch to trigger deployment:
```bash
# Deploy to development
git push origin development

# Deploy to staging
git push origin staging

# Deploy to production
git push origin main
```

## Branch-to-Environment Mapping

| Branch | Environment | URL | Auto-Deploy |
|--------|-------------|-----|-------------|
| `main` | Production | https://ethiopian-maids.vercel.app | ✅ |
| `staging` | Staging | https://ethiopian-maids-staging.vercel.app | ✅ |
| `development` | Development | https://ethiopian-maids-dev.vercel.app | ✅ |

## Custom Domains

### Add Custom Domain to Production

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain: `ethiopian-maids.com`
4. Follow DNS configuration instructions
5. Vercel will issue SSL certificate automatically

### Configure DNS

Add these records to your DNS provider:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

For subdomains:
```
Type: CNAME
Name: staging
Value: cname.vercel-dns.com

Type: CNAME
Name: dev
Value: cname.vercel-dns.com
```

## Deployment Settings

### Build Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "devCommand": "npm run dev"
}
```

### Node Version

In `package.json`:
```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### Environment-Specific Builds

The build automatically detects the environment:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
})
```

## Monitoring & Logs

### View Deployment Logs

1. Go to **Deployments** tab
2. Click on specific deployment
3. View **Build Logs** and **Function Logs**

### Real-time Monitoring

```bash
# Using Vercel CLI
vercel logs <deployment-url>

# Follow logs
vercel logs <deployment-url> --follow

# Filter by function
vercel logs <deployment-url> --filter=function
```

## Rollback Strategy

### Instant Rollback

1. Go to **Deployments**
2. Find previous stable deployment
3. Click **...** → **Promote to Production**
4. Confirm rollback

### Via CLI

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

## Performance Optimization

### Enable Caching

Already configured in `vercel.json`:
- Static assets: 1 year cache
- Images: 7 days with stale-while-revalidate
- HTML: No cache (always fresh)

### Enable Analytics

1. Go to **Analytics** tab
2. Click **Enable Analytics**
3. View:
   - Page views
   - Top pages
   - Top referrers
   - Devices
   - Browsers

### Enable Speed Insights

1. Go to **Speed Insights** tab
2. Click **Enable Speed Insights**
3. Add to your app:

```bash
npm install @vercel/speed-insights
```

```javascript
// src/main.jsx
import { SpeedInsights } from '@vercel/speed-insights/react'

function App() {
  return (
    <>
      <YourApp />
      <SpeedInsights />
    </>
  )
}
```

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Test build locally:
   ```bash
   npm run build
   npm run preview
   ```

### Environment Variables Not Working

1. Ensure variables start with `VITE_` for client-side access
2. Check variable is set in correct environment
3. Redeploy after adding variables

### Domain Not Working

1. Verify DNS records are correct
2. Wait for DNS propagation (up to 48 hours)
3. Check SSL certificate status
4. Clear browser cache

### Deployment Stuck

1. Cancel deployment
2. Check GitHub Actions status
3. Retry deployment manually
4. Contact Vercel support if persists

## Security Best Practices

### Environment Variables

- ✅ Never commit secrets to repository
- ✅ Use different keys per environment
- ✅ Rotate keys regularly
- ✅ Use Vercel's encrypted storage
- ❌ Don't expose secrets in client code

### Headers

Already configured in `vercel.json`:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### HTTPS

- Automatic SSL certificate
- Force HTTPS enabled
- HTTP → HTTPS redirect

## Cost Optimization

### Hobby Plan (Free)
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless functions
- Automatic SSL

### Pro Plan ($20/month)
- Unlimited bandwidth
- Team collaboration
- Advanced analytics
- Priority support

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [GitHub Actions for Vercel](https://github.com/marketplace/actions/vercel-action)
- [Custom Domains Guide](https://vercel.com/docs/concepts/projects/domains)

---

**Last Updated**: 2025-10-29
**Questions?** Contact the development team or check [Vercel Support](https://vercel.com/support)
