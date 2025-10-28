# Branch Strategy & Protection Rules

## Overview
This project uses a **poly repo structure** with three main branches representing different environments.

## Branch Structure

### 🚀 `main` (Production)
- **Purpose**: Production-ready code deployed to live environment
- **Protected**: ✅ Yes
- **Auto-deploy**: Yes → Production URL
- **Requirements**:
  - All CI checks must pass
  - Requires 1+ approving review
  - Can only merge from `staging`
  - No force pushes
  - Cannot be deleted

### 🧪 `staging` (Pre-Production)
- **Purpose**: Pre-production testing and validation
- **Protected**: ✅ Yes
- **Auto-deploy**: Yes → Staging URL
- **Requirements**:
  - All CI checks must pass
  - Can merge from `development` or hotfix branches
  - No force pushes
  - Cannot be deleted

### 🔧 `development` (Development)
- **Purpose**: Active development and feature integration
- **Protected**: ⚠️ Partial
- **Auto-deploy**: Yes → Development URL
- **Requirements**:
  - CI checks recommended but not blocking
  - Can merge feature branches
  - Force push allowed for maintainers only

## Workflow

```
feature/* → development → staging → main
    ↓           ↓           ↓         ↓
  tests      tests +     tests +   production
            integration  staging   deployment
```

### Development Flow

1. **Create Feature Branch**
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/your-feature-name
   ```

2. **Develop & Test Locally**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

3. **Push & Create PR to `development`**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub targeting 'development'
   ```

4. **Merge to `development`**
   - PR reviewed and approved
   - CI passes
   - Auto-deploys to development environment

5. **Promote to `staging`**
   ```bash
   git checkout staging
   git pull origin staging
   git merge development
   git push origin staging
   # Or create PR from development → staging
   ```

6. **Test in Staging**
   - QA testing
   - Integration testing
   - UAT (User Acceptance Testing)

7. **Promote to `main`**
   ```bash
   # Create PR from staging → main
   # Requires approval
   # Auto-deploys to production after merge
   ```

## Hotfix Flow

For urgent production fixes:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Fix and test
npm run lint && npm test && npm run build

# Push and create PR to main
git push origin hotfix/critical-bug
# Create PR targeting 'main'

# After merge to main, backport to other branches
git checkout staging
git merge main
git push origin staging

git checkout development
git merge staging
git push origin development
```

## Branch Protection Settings

### Recommended GitHub Settings

#### For `main`:
```yaml
Branch Protection Rules:
  - Require pull request reviews before merging: ✅
    - Required approving reviews: 1
    - Dismiss stale reviews: ✅
  - Require status checks to pass: ✅
    - CI/Build
    - Tests
    - Linter
  - Require branches to be up to date: ✅
  - Require conversation resolution: ✅
  - Include administrators: ✅
  - Restrict who can push: ✅ (Maintainers only)
  - Allow force pushes: ❌
  - Allow deletions: ❌
```

#### For `staging`:
```yaml
Branch Protection Rules:
  - Require pull request reviews before merging: ⚠️ (Recommended)
    - Required approving reviews: 1
  - Require status checks to pass: ✅
    - CI/Build
    - Tests
  - Require branches to be up to date: ✅
  - Include administrators: ⚠️
  - Allow force pushes: ❌
  - Allow deletions: ❌
```

#### For `development`:
```yaml
Branch Protection Rules:
  - Require status checks to pass: ⚠️ (Recommended)
    - CI/Build
  - Allow force pushes: ⚠️ (Maintainers only)
  - Allow deletions: ❌
```

## Setting Up Protection Rules

### Via GitHub UI:
1. Go to **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Enter branch name pattern: `main`, `staging`, or `development`
4. Configure protection rules as shown above
5. Click **Create** or **Save changes**

### Via GitHub CLI:
```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Protect main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field required_status_checks='{"strict":true,"contexts":["CI"]}' \
  --field enforce_admins=true \
  --field restrictions=null

# Protect staging branch
gh api repos/:owner/:repo/branches/staging/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI"]}' \
  --field restrictions=null

# Protect development branch
gh api repos/:owner/:repo/branches/development/protection \
  --method PUT \
  --field required_status_checks='{"strict":false,"contexts":["CI"]}' \
  --field restrictions=null
```

## Deployment Environments

### Production
- **Branch**: `main`
- **URL**: https://ethiopian-maids.vercel.app
- **Environment Variables**: Production secrets
- **Database**: Production PostgreSQL
- **Auto-deploy**: ✅ On push to main

### Staging
- **Branch**: `staging`
- **URL**: https://ethiopian-maids-staging.vercel.app
- **Environment Variables**: Staging secrets (mirrors production)
- **Database**: Staging PostgreSQL (copy of production)
- **Auto-deploy**: ✅ On push to staging

### Development
- **Branch**: `development`
- **URL**: https://ethiopian-maids-dev.vercel.app
- **Environment Variables**: Development secrets
- **Database**: Development PostgreSQL (seed data)
- **Auto-deploy**: ✅ On push to development

## Environment Secrets

Each environment requires these secrets in GitHub:

```bash
# Vercel
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID=<your-project-id>

# Supabase (per environment)
VITE_SUPABASE_URL=<environment-specific-url>
VITE_SUPABASE_ANON_KEY=<environment-specific-key>

# Stripe (per environment)
VITE_STRIPE_PUBLIC_KEY=<environment-specific-key>
STRIPE_SECRET_KEY=<environment-specific-key>

# Other
TWILIO_ACCOUNT_SID=<shared-or-per-env>
TWILIO_AUTH_TOKEN=<shared-or-per-env>
```

## Best Practices

### ✅ Do:
- Create feature branches from `development`
- Keep branches up to date with their upstream
- Write meaningful commit messages (Conventional Commits)
- Test locally before pushing
- Request reviews for important changes
- Delete feature branches after merging
- Use `staging` for final QA before production

### ❌ Don't:
- Push directly to `main` or `staging`
- Force push to protected branches
- Merge without PR review
- Deploy to production without testing in staging
- Commit secrets or sensitive data
- Create long-lived feature branches (>1 week)
- Skip CI checks

## Rollback Strategy

### Quick Rollback (Emergency)
```bash
# Revert last commit on main
git checkout main
git revert HEAD
git push origin main

# Or revert to specific commit
git revert <commit-hash>
git push origin main
```

### Full Rollback
```bash
# Reset to previous stable commit (use carefully!)
git checkout main
git reset --hard <stable-commit-hash>
git push origin main --force  # Requires override protection
```

### Database Rollback
- Keep migration rollback scripts
- Test rollbacks in staging first
- Document rollback procedures

## Monitoring & Alerts

- **GitHub Actions**: Monitor workflow runs
- **Vercel Deployments**: Check deployment status
- **Sentry/Error Tracking**: Monitor production errors
- **Supabase Logs**: Database and API monitoring

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Vercel Git Integration](https://vercel.com/docs/git)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures

---

**Last Updated**: 2025-10-29
**Maintained By**: Development Team
