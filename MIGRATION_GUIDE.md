# Migration Guide: Monolith to Clean Architecture

This guide walks through migrating the Ethio Maids platform from a monolithic architecture to a clean, domain-driven architecture with proper separation of concerns.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Changes](#architecture-changes)
3. [Migration Phases](#migration-phases)
4. [Step-by-Step Instructions](#step-by-step-instructions)
5. [Breaking Changes](#breaking-changes)
6. [Codemods](#codemods)
7. [Testing](#testing)
8. [Rollback Plan](#rollback-plan)

## Overview

### Goals

- **Clean Architecture**: Separate domain logic from infrastructure
- **Domain-Driven Design**: Rich domain models with business rules
- **Type Safety**: Type-safe SDK for API communication
- **Testability**: Isolated, testable components
- **Maintainability**: Clear boundaries and responsibilities

### Timeline

- **Phase 1**: Identity & Auth (Weeks 1-2) ✅
- **Phase 2**: Infrastructure Setup (Weeks 3-4) ✅
- **Phase 3**: Profiles (Weeks 5-6) 🔄 In Progress
- **Phase 4**: Jobs & Subscriptions (Weeks 7-8)
- **Phase 5**: Cleanup & Optimization (Weeks 9-10)

## Architecture Changes

### Before (Monolith)

```
src/
├── services/          # Mixed business logic & data access
│   ├── maidService.js
│   ├── sponsorService.js
│   └── supabase.js
├── pages/             # UI components
└── contexts/          # State management
```

### After (Clean Architecture)

```
packages/
├── domain/            # Pure business logic
│   ├── profiles/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   └── policies/
│   └── identity/
├── app/               # Use cases
│   ├── profiles-maid/
│   ├── profiles-sponsor/
│   └── profiles-agency/
├── infrastructure/    # External services
│   └── adapters/
├── sdk/              # Type-safe API client
└── shared/           # Shared utilities

src/                  # Frontend
├── adapters/         # Service adapters
├── lib/sdk/          # SDK wrapper
└── components/       # UI components
```

## Migration Phases

### Phase 1: Identity & Auth ✅ COMPLETED

**Completed Work:**
- Created User, Session, PasswordReset entities
- Implemented RegisterUser, LoginUser use-cases
- Added password reset flow
- Created identity module with domain events

**Files Created:**
- `packages/domain/identity/entities/User.js`
- `packages/domain/identity/entities/Session.js`
- `packages/domain/identity/entities/PasswordReset.js`
- `packages/app/identity/usecases/RegisterUser.js`
- `src/config/identityUseCases.js`

### Phase 2: Infrastructure Setup ✅ COMPLETED

**Completed Work:**
- Set up monorepo with pnpm workspaces
- Created package structure
- Added SDK scaffolding
- Configured build tools

**Files Created:**
- `pnpm-workspace.yaml`
- `packages/*/package.json`
- Build configurations

### Phase 3: Profiles 🔄 IN PROGRESS

**Completed:**
- ✅ Domain entities (MaidProfile, SponsorProfile, AgencyProfile)
- ✅ Use cases (Create, Update for all profiles)
- ✅ SDK client wrapper
- ✅ MaidProfileAdapter
- ✅ Shared utilities (ID generator)

**In Progress:**
- 🔄 Repository implementations
- 🔄 API endpoints
- 🔄 Frontend integration

**To Do:**
- ⏳ SponsorProfileAdapter
- ⏳ AgencyProfileAdapter
- ⏳ Event bus implementation
- ⏳ Database migrations

### Phase 4: Jobs & Subscriptions ⏳ PLANNED

Follow the same pattern as Profiles:
1. Create domain entities (JobPosting, JobApplication, Subscription)
2. Create use-cases
3. Implement adapters
4. Update frontend
5. Add feature flags

## Step-by-Step Instructions

### 1. Set Up Development Environment

```bash
# Install dependencies
pnpm install

# Build domain packages
cd packages/domain/profiles && pnpm build
cd packages/domain/identity && pnpm build

# Build SDK (when OpenAPI spec is ready)
cd packages/sdk && pnpm run generate
```

### 2. Run Codemods

Automate the migration of service calls:

```bash
# Make the script executable (Unix/Mac)
chmod +x scripts/run-codemods.sh

# Run all codemods
./scripts/run-codemods.sh

# Or run individually
npx jscodeshift -t scripts/codemods/migrate-to-sdk.js src/**/*.{js,jsx}
npx jscodeshift -t scripts/codemods/remove-unsupported-locales.js src/**/*.{js,jsx}
```

### 3. Update Service Calls

**Before:**
```javascript
import { maidService } from '@/services/maidService';

const { data } = await maidService.getMaids(filters);
```

**After:**
```javascript
import { getMaidProfileAdapter } from '@/adapters/MaidProfileAdapter';

const maidAdapter = getMaidProfileAdapter();
const data = await maidAdapter.getMaids(filters);
```

### 4. Add Feature Flags

Use feature flags for gradual rollout:

```javascript
// .env
VITE_FEATURE_NEW_PROFILES_API=false

// In code
if (import.meta.env.VITE_FEATURE_NEW_PROFILES_API === 'true') {
  // Use new SDK/adapter
  return await maidAdapter.getMaids(filters);
} else {
  // Use old service
  return await maidService.getMaids(filters);
}
```

### 5. Update API Endpoints

Create versioned endpoints:

```javascript
// Old: /api/users/register
// New: /api/v1/auth/register

// Old: /api/maids
// New: /api/v1/profiles/maids
```

### 6. Data Model Migration

Map old fields to new ones:

```javascript
// In adapters
_mapFromApi(apiData) {
  return {
    userId: apiData.userId || apiData.user_id,
    fullName: apiData.fullName || apiData.full_name,
    // ... other mappings
  };
}
```

## Breaking Changes

### API Changes

| Old Endpoint | New Endpoint | Notes |
|--------------|--------------|-------|
| `/api/users/register` | `/api/v1/auth/register` | Versioned API |
| `/api/maids` | `/api/v1/profiles/maids` | Namespaced |
| Direct Supabase calls | SDK calls | Type-safe |

### Data Model Changes

| Old Field | New Field | Migration |
|-----------|-----------|-----------|
| `user_type` | `role` | Use UserRole enum |
| `registration_complete` | `emailVerified` | Boolean mapping |
| 6 locales | 2 locales (en, ar) | Remove am, tl, id, si |

### Code Changes

| Old Pattern | New Pattern | Notes |
|-------------|-------------|-------|
| `import { maidService }` | `import { getMaidProfileAdapter }` | Adapter pattern |
| `<button>Save</button>` | `<button>{t('common.save')}</button>` | i18n |
| Direct Supabase | Via adapters | Decoupling |
| Services with logic | Domain entities + use-cases | DDD |

## Codemods

### 1. Migrate Service Calls

Transforms service calls to SDK calls:

```bash
npx jscodeshift -t scripts/codemods/migrate-to-sdk.js src/**/*.{js,jsx}
```

**What it does:**
- Finds `maidService.getMaids()` calls
- Replaces with `maidAdapter.getMaids()`
- Adds necessary imports
- Removes old service imports

### 2. Remove Unsupported Locales

Removes am, tl, id, si locales:

```bash
npx jscodeshift -t scripts/codemods/remove-unsupported-locales.js src/**/*.{js,jsx}
```

**What it does:**
- Removes properties from SUPPORTED_LOCALES
- Updates locale arrays
- Fixes conditional checks
- Removes switch cases

## Testing

### Unit Tests

Test domain entities and use-cases:

```bash
# Test domain packages
cd packages/domain/profiles && pnpm test
cd packages/domain/identity && pnpm test

# Test application layer
cd packages/app/profiles-maid && pnpm test
```

### Integration Tests

Test adapters and API integration:

```bash
# Run integration tests
npm run test:integration

# Test specific adapter
npm run test -- MaidProfileAdapter.test.js
```

### E2E Tests

Test full user flows:

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### Feature Flag Testing

Test both old and new implementations:

```bash
# Test with old implementation
VITE_FEATURE_NEW_PROFILES_API=false npm test

# Test with new implementation
VITE_FEATURE_NEW_PROFILES_API=true npm test
```

## Rollback Plan

### Immediate Rollback

If critical issues are found:

1. **Use Feature Flags:**
   ```bash
   # In .env
   VITE_FEATURE_NEW_PROFILES_API=false
   ```

2. **Revert Code:**
   ```bash
   git revert <commit-hash>
   git push
   ```

3. **Database Rollback:**
   ```bash
   # Run rollback migration
   npm run migrate:rollback
   ```

### Gradual Rollback

For partial issues:

1. **Disable for Specific Users:**
   ```javascript
   const useNewApi = featureFlags.isEnabled('new-profiles-api', user.id);
   ```

2. **Rollback by Module:**
   - Keep working modules on new architecture
   - Rollback problematic modules only

### Data Integrity

Ensure data consistency during rollback:

1. **Dual Write Period:**
   - Write to both old and new systems
   - Compare results
   - Fix discrepancies

2. **Data Migration:**
   - Export data from new format
   - Transform back to old format
   - Import into old system

## Monitoring & Observability

### Metrics to Track

- **Performance:**
  - API response times
  - Database query performance
  - Frontend render times

- **Errors:**
  - API error rates
  - Client-side errors
  - Migration failures

- **Business:**
  - User registration success rate
  - Profile completion rate
  - Feature adoption

### Logging

Add structured logging:

```javascript
logger.info('Profile created', {
  userId,
  profileType: 'maid',
  source: 'new-api',
  duration: elapsed
});
```

## Support & Resources

### Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Implementation Progress](./docs/IMPLEMENTATION_PROGRESS.md)
- [API Reference](./docs/API.md)

### Contacts

- **Technical Lead:** [Name]
- **Backend Team:** [Email]
- **Frontend Team:** [Email]
- **DevOps:** [Email]

## Appendix

### File Structure Reference

```
packages/
├── domain/
│   ├── profiles/
│   │   ├── entities/
│   │   │   ├── MaidProfile.js
│   │   │   ├── SponsorProfile.js
│   │   │   └── AgencyProfile.js
│   │   ├── value-objects/
│   │   │   ├── ProfileStatus.js
│   │   │   └── WorkExperience.js
│   │   └── index.js
│   └── identity/
│       ├── entities/
│       │   ├── User.js
│       │   ├── Session.js
│       │   └── PasswordReset.js
│       └── index.js
├── app/
│   ├── profiles-maid/
│   │   └── usecases/
│   │       ├── CreateMaidProfile.js
│   │       └── UpdateMaidProfile.js
│   ├── profiles-sponsor/
│   │   └── usecases/
│   │       ├── CreateSponsorProfile.js
│   │       └── UpdateSponsorProfile.js
│   └── profiles-agency/
│       └── usecases/
│           ├── CreateAgencyProfile.js
│           └── UpdateAgencyProfile.js
└── shared/
    └── utils/
        └── idGenerator.js

src/
├── adapters/
│   ├── MaidProfileAdapter.js
│   ├── SponsorProfileAdapter.js
│   └── AgencyProfileAdapter.js
├── lib/sdk/
│   └── apiClient.js
└── services/
    └── (legacy services - to be removed)
```

### Common Issues & Solutions

**Issue:** "Cannot find module '@ethio-maids/domain-profiles'"

**Solution:**
```bash
# Link packages locally
cd packages/domain/profiles && pnpm link --global
cd src && pnpm link --global @ethio-maids/domain-profiles
```

**Issue:** Feature flag not working

**Solution:**
- Check `.env` file exists
- Verify environment variable name
- Restart development server

**Issue:** Codemod not transforming files

**Solution:**
```bash
# Try with explicit parser
npx jscodeshift -t scripts/codemods/migrate-to-sdk.js src/**/*.jsx --parser=babel

# Debug mode
npx jscodeshift -t scripts/codemods/migrate-to-sdk.js src/test.jsx --dry --print
```

---

**Last Updated:** 2025-10-21
**Version:** 1.0.0
**Status:** In Progress (Phase 3)
