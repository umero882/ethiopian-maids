# Poly Repo Quick Start Guide

Welcome to the Ethiopian Maids Service Platform! This guide will help you get started with our poly repo structure.

## 🚀 Repository Overview

- **GitHub**: https://github.com/umero882/ethiopian-maids-st
- **Branches**: `main` (production), `staging` (pre-prod), `development` (dev)
- **Auto-Deploy**: All branches deploy automatically to Vercel

## 📋 Quick Reference

### Branch Structure
```
┌─────────────┬──────────────┬─────────────────────────────────┐
│   Branch    │ Environment  │            URL                  │
├─────────────┼──────────────┼─────────────────────────────────┤
│ main        │ Production   │ ethiopian-maids.vercel.app      │
│ staging     │ Staging      │ ethiopian-maids-staging.v...app │
│ development │ Development  │ ethiopian-maids-dev.vercel.app  │
└─────────────┴──────────────┴─────────────────────────────────┘
```

## 🛠️ Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/umero882/ethiopian-maids-st.git
cd ethiopian-maids-st
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
```bash
# Copy example env file
cp .env.example .env.local

# Edit with your local credentials
# (Ask team lead for development credentials)
```

### 4. Start Development Server
```bash
npm run dev
# Opens at http://localhost:5174
```

## 💻 Development Workflow

### Creating a New Feature

```bash
# 1. Switch to development branch
git checkout development
git pull origin development

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and test
npm run lint
npm test
npm run build

# 4. Commit changes (use Conventional Commits)
git add .
git commit -m "feat: add your feature description"

# 5. Push to GitHub
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub
# Target: development branch
# Use PR template to fill details
```

### Conventional Commits

Format: `type(scope): description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:
```bash
git commit -m "feat(auth): add login form validation"
git commit -m "fix(booking): resolve date picker bug"
git commit -m "docs: update API documentation"
```

## 🔄 Promotion Flow

```
feature → development → staging → main
   ↓          ↓           ↓        ↓
 local    dev.url    staging.url  prod.url
```

### Promote to Staging
```bash
# Create PR: development → staging
# After review and approval, merge
```

### Promote to Production
```bash
# Create PR: staging → main
# Requires: 1+ approval + all checks pass
# After merge: Auto-deploys to production
```

## 🧪 Testing

### Run Tests Locally
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test in Development Environment
1. Push to `development` branch
2. Wait for auto-deploy
3. Test at: https://ethiopian-maids-dev.vercel.app

### Test in Staging Environment
1. Merge to `staging` branch
2. Wait for auto-deploy
3. Perform QA at: https://ethiopian-maids-staging.vercel.app

## 📝 Pull Request Checklist

Before creating a PR, ensure:

- [ ] Code follows project style guide
- [ ] All tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Commit messages follow Conventional Commits
- [ ] PR title follows Conventional Commits
- [ ] PR description filled out completely
- [ ] Screenshots added for UI changes
- [ ] Documentation updated if needed

## 🔒 Branch Protection

### `main` (Production)
- ✅ Requires 1+ approval
- ✅ All checks must pass
- ✅ Only merge from `staging`
- ❌ No direct pushes
- ❌ No force pushes

### `staging` (Pre-Production)
- ⚠️ Requires approval (recommended)
- ✅ All checks must pass
- ✅ Merge from `development` or hotfix
- ❌ No force pushes

### `development` (Development)
- ⚠️ Checks recommended
- ✅ Merge from feature branches
- ⚠️ Force push allowed (maintainers only)

## 🚨 Hotfix Process

For critical production bugs:

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# 2. Fix and test
npm run lint && npm test && npm run build

# 3. Push and create PR to main
git push origin hotfix/critical-bug-fix
# Create PR: hotfix/critical-bug-fix → main

# 4. After merge, backport to other branches
git checkout staging
git merge main
git push origin staging

git checkout development
git merge staging
git push origin development
```

## 🔍 Common Commands

### View All Branches
```bash
git branch -a
```

### Switch Branches
```bash
git checkout development
git checkout staging
git checkout main
```

### Update Local Branch
```bash
git pull origin <branch-name>
```

### View Deployment Status
```bash
# Check GitHub Actions
https://github.com/umero882/ethiopian-maids-st/actions

# Check Vercel Deployments
# (Login to Vercel dashboard)
```

## 📚 Documentation

- **Branch Strategy**: [BRANCH_STRATEGY.md](./BRANCH_STRATEGY.md)
- **Vercel Setup**: [VERCEL_SETUP.md](./VERCEL_SETUP.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Contributing Guide**: [CONTRIBUTING.md](./CONTRIBUTING.md)

## 🆘 Getting Help

### Common Issues

**Build Fails Locally**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Tests Fail**
```bash
# Update snapshots if UI changed
npm test -- -u
```

**Merge Conflicts**
```bash
# Update your branch
git checkout development
git pull origin development
git checkout your-feature-branch
git merge development
# Resolve conflicts
git add .
git commit
```

### Contact

- **Team Lead**: [Contact info]
- **GitHub Issues**: https://github.com/umero882/ethiopian-maids-st/issues
- **Slack Channel**: #ethiopian-maids-dev

## 🎯 Quick Tips

1. **Always work on feature branches**, never directly on development/staging/main
2. **Pull before pushing** to avoid conflicts
3. **Test locally** before creating PR
4. **Use meaningful commit messages** (Conventional Commits)
5. **Keep PRs small** and focused on one feature/fix
6. **Review others' PRs** to learn and help the team
7. **Ask questions** if anything is unclear

## 🔐 Security

- **Never commit secrets** to the repository
- **Use environment variables** for sensitive data
- **Rotate API keys** regularly
- **Report security issues** privately to team lead

## 📊 Monitoring

- **GitHub Actions**: Build and test status
- **Vercel Dashboard**: Deployment status and logs
- **Sentry**: Error tracking (if configured)
- **Supabase**: Database and API logs

---

**Welcome to the team!** 🎉

If you have questions or suggestions for improving this guide, please create an issue or PR.

**Last Updated**: 2025-10-29
