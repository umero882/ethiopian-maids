# Ethiopian Maids Platform - Migration Guide

**Version:** 1.0.0 → 2.0.0 (Modular Architecture)
**Date:** 2025-10-21
**Estimated Duration:** 8 weeks

---

## Table of Contents

1. [Overview](#overview)
2. [Migration Strategy](#migration-strategy)
3. [Prerequisites](#prerequisites)
4. [Phase-by-Phase Guide](#phase-by-phase-guide)
5. [Codemods](#codemods)
6. [Breaking Changes](#breaking-changes)
7. [Testing Your Migration](#testing-your-migration)
8. [Rollback Plan](#rollback-plan)
9. [FAQ](#faq)

---

## Overview

This guide helps you migrate from the existing monolithic codebase to the new modular, domain-driven architecture.

### What's Changing?

| Aspect | Before | After |
|--------|--------|-------|
| **Structure** | Single src/ folder | Monorepo with apps/, services/, packages/ |
| **Architecture** | Services calling Supabase directly | Ports & Adapters (Clean Architecture) |
| **Business Logic** | Mixed in components & services | Pure domain entities in packages/domain |
| **API Calls** | Direct fetch/axios | Type-safe SDK generated from OpenAPI |
| **i18n** | Hard-coded strings | Extracted to en.json/ar.json |
| **Locales** | 6 languages (en, ar, am, tl, id, si) | 2 languages (en, ar only) |
| **Testing** | ~30% coverage | Target ≥80% coverage |
| **State** | 15+ React Contexts | Consolidated app state |

### Migration Philosophy

**Strangler Fig Pattern**: Replace old code gradually, module by module, while keeping the app running.

- ✅ **Incremental**: One feature at a time
- ✅ **Reversible**: Feature flags allow rollback
- ✅ **Safe**: Dual-run old and new code side-by-side
- ✅ **Tested**: Automated tests prevent regressions

---

## Migration Strategy

### Timeline (8 Weeks)

```
Week 1-2: Foundation
├── Monorepo setup
├── OpenAPI spec
├── i18n extraction
└── SDK generation

Week 3-4: Identity Module
├── Domain layer (User entity)
├── Application layer (use-cases)
├── Infrastructure adapters
└── Frontend integration

Week 5-6: Profiles Module
├── Domain layer (MaidProfile, SponsorProfile, AgencyProfile)
├── Application layer
├── Infrastructure adapters
└── Frontend integration

Week 7-8: Jobs & Subscriptions
├── Jobs module
├── Subscriptions module
├── End-to-end testing
└── Production deployment
```

### Approach

1. **Branch**: Create `refactor/modular-architecture` branch
2. **Coexist**: Old and new code run side-by-side
3. **Feature Flags**: Toggle between implementations
4. **Test**: Automated & manual testing at each step
5. **Deploy**: Gradual rollout with monitoring
6. **Sunset**: Remove old code once stable

---

## Prerequisites

### Before You Start

- [ ] Read `docs/INVENTORY.md` (codebase audit)
- [ ] Read `docs/ARCHITECTURE.md` (new architecture)
- [ ] Backup production database
- [ ] Set up feature flags system
- [ ] Configure monitoring/alerting
- [ ] Communicate changes to team

### Development Setup

```bash
# 1. Install dependencies (npm workspaces)
npm install

# 2. Verify workspace configuration
pnpm run workspaces list

# 3. Generate SDK from OpenAPI

pnpm run generate --workspace=@ethio-maids/sdk

# 4. Run type checks (if using TypeScript)
pnpm run typecheck

# 5. Run tests
pnpm test
```

---

## Phase-by-Phase Guide

### Phase 1: Foundation (Week 1-2)

#### 1.1 Monorepo Setup

**Status**: ✅ Complete

The monorepo structure is already created:

```bash
# Verify workspace structure
ls -la apps/ packages/ services/
```

All `package.json` files are configured with workspace dependencies.

#### 1.2 OpenAPI Specification

**Status**: ✅ Complete

The OpenAPI spec is at `services/api/openapi.yaml`.

**Action**: Review and extend as needed:

```bash
# View spec
cat services/api/openapi.yaml

# Validate spec (install spectral if needed)
npx @stoplight/spectral-cli lint services/api/openapi.yaml
```

#### 1.3 Generate SDK

**Install openapi-typescript**:

```bash
npm install --save-dev openapi-typescript@latest --workspace=@ethio-maids/sdk
```

**Generate types**:

```bash
cd packages/sdk
npm run generate
```

This creates `src/schema.d.ts` with TypeScript types for all API endpoints.

#### 1.4 Extract i18n Strings

**Status**: ⚠️ Partially complete (stubs created, strings need extraction)

**Automated extraction** (semi-automated):

```bash
# Create extraction script
cat > packages/i18n/scripts/extract-strings.js << 'EOF'
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

// Scan src/ for hard-coded strings
// Extract to en.json (human then translates to ar.json)
// This is a placeholder - implement extraction logic

console.log('String extraction not yet implemented');
console.log('Manual extraction required');
EOF

chmod +x packages/i18n/scripts/extract-strings.js
```

**Manual extraction** (for now):

1. Search codebase for hard-coded UI strings
2. Add to `packages/i18n/locales/en.json`
3. Translate to Arabic in `packages/i18n/locales/ar.json`
4. Verify completeness: `npm run check --workspace=@ethio-maids/i18n`

**Example migration**:

```javascript
// Before
<button>Save</button>

// After
import { t } from '@ethio-maids/i18n';
const { t: translate } = useTranslation(); // or pass locale

<button>{t(locale, 'common.buttons.save')}</button>
```

#### 1.5 Remove Unsupported Locales

**Action**: Update `src/contexts/LocalizationContext.jsx`:

```javascript
// Remove these from SUPPORTED_LOCALES
// am: Amharic
// tl: Filipino
// id: Indonesian
// si: Sinhala

export const SUPPORTED_LOCALES = {
  en: { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
};
```

---

### Phase 2: Identity Module (Week 3-4)

#### 2.1 Domain Layer

**Status**: ✅ Complete

Domain entities are in `packages/domain/identity/`.

**Review and extend**:

```bash
# Review User entity
cat packages/domain/identity/entities/User.js

# Run domain tests
npm test --workspace=@ethio-maids/domain-identity
```

**Add more entities if needed** (e.g., Session, PasswordReset).

#### 2.2 Application Layer

**Status**: ✅ Partial (3 use-cases created)

Existing use-cases:
- `RegisterUser`
- `GetUser`
- `VerifyUserEmail`

**Create additional use-cases**:

```bash
# Example: SignIn use-case
cat > packages/app/identity/usecases/SignIn.js << 'EOF'
export class SignIn {
  constructor({ userRepository, authService, auditLogger }) {
    this.userRepository = userRepository;
    this.authService = authService;
    this.auditLogger = auditLogger;
  }

  async execute(command) {
    const { email, password, metadata = {} } = command;

    // Authenticate via port
    const { userId, session } = await this.authService.signIn({ email, password });

    // Fetch user entity
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    // Audit log
    await this.auditLogger.logAuthAttempt({
      userId,
      success: true,
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });

    return { userId, session, user: { ...user } };
  }
}
EOF
```

**Update exports**:

```javascript
// packages/app/identity/usecases/index.js
export { SignIn } from './SignIn.js';
```

#### 2.3 Infrastructure Adapters

**Create adapters** (implement ports):

```bash
# Create infrastructure package (not yet in repo)
mkdir -p packages/infra/identity

# SupabaseUserRepository.js
cat > packages/infra/identity/SupabaseUserRepository.js << 'EOF'
import { UserRepository } from '@ethio-maids/app-identity';
import { User, UserRole } from '@ethio-maids/domain-identity';
import { supabase } from '@/lib/supabaseClient';

export class SupabaseUserRepository extends UserRepository {
  async findById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return new User({
      id: data.id,
      email: data.email,
      role: UserRole.fromString(data.user_type),
      status: data.is_active ? 'active' : 'suspended',
      emailVerified: data.registration_complete, // map to your schema
      createdAt: new Date(data.created_at),
    });
  }

  async save(user) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        user_type: user.role.name,
        is_active: user.status === 'active',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return user;
  }

  // Implement other methods...
}
EOF
```

#### 2.4 Frontend Integration

**Replace AuthContext logic** with use-cases:

```javascript
// Before (src/contexts/AuthContext.jsx)
const signUp = async (email, password, userType) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  // ... more logic
};

// After (use SDK + use-case)
import createClient from '@ethio-maids/sdk';

const apiClient = createClient({ baseUrl: process.env.VITE_API_URL });

const signUp = async (email, password, role) => {
  const { data, error } = await apiClient.POST('/auth/register', {
    body: { email, password, role },
  });
  if (error) throw new Error(error.message);
  return data;
};
```

**Feature Flag**:

```javascript
const USE_NEW_AUTH = process.env.VITE_FF_NEW_AUTH_MODULE === 'true';

const signUp = USE_NEW_AUTH ? signUpNew : signUpLegacy;
```

#### 2.5 Testing

```bash
# Run all identity tests
npm test --workspace=@ethio-maids/domain-identity
npm test --workspace=@ethio-maids/app-identity

# E2E test: registration flow
npm run test:e2e -- --grep "registration"
```

---

### Phase 3: Profiles Module (Week 5-6)

#### 3.1 Domain Entities

Create domain entities for profiles:

```bash
# MaidProfile entity
cat > packages/domain/profiles/entities/MaidProfile.js << 'EOF'
export class MaidProfile {
  constructor({ id, userId, fullName, experienceYears, skills, availability }) {
    this.id = id;
    this.userId = userId;
    this.fullName = fullName;
    this.experienceYears = experienceYears;
    this.skills = skills;
    this.availability = availability;
    this._domainEvents = [];
  }

  updateExperience(years) {
    if (years < 0) throw new Error('Experience cannot be negative');
    this.experienceYears = years;
    this._domainEvents.push({
      type: 'MaidExperienceUpdated',
      payload: { maidId: this.id, experienceYears: years },
    });
  }

  addSkill(skill) {
    if (!this.skills.includes(skill)) {
      this.skills.push(skill);
      this._domainEvents.push({
        type: 'MaidSkillAdded',
        payload: { maidId: this.id, skill },
      });
    }
  }

  pullDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
EOF
```

Repeat for `SponsorProfile`, `AgencyProfile`.

#### 3.2 Application Use-Cases

```bash
# CreateMaidProfile use-case
cat > packages/app/profiles.maid/usecases/CreateMaidProfile.js << 'EOF'
import { MaidProfile } from '@ethio-maids/domain-profiles';

export class CreateMaidProfile {
  constructor({ maidProfileRepository, eventBus }) {
    this.maidProfileRepository = maidProfileRepository;
    this.eventBus = eventBus;
  }

  async execute(command) {
    const { userId, fullName, experienceYears, skills } = command;

    // Create entity
    const profile = new MaidProfile({
      id: generateId(),
      userId,
      fullName,
      experienceYears,
      skills,
      availability: 'available',
    });

    // Persist
    await this.maidProfileRepository.save(profile);

    // Publish events
    const events = profile.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return profile;
  }
}
EOF
```

#### 3.3 Update Frontend

Replace `src/services/maidService.js` calls with SDK:

```javascript
// Before
import { maidService } from '@/services/maidService';
const { data } = await maidService.getMaids(filters);

// After
import createClient from '@ethio-maids/sdk';
const apiClient = createClient({ baseUrl: process.env.VITE_API_URL });
const { data } = await apiClient.GET('/profiles/maids', { params: { query: filters } });
```

---

### Phase 4: Jobs & Subscriptions (Week 7-8)

Follow the same pattern as Profiles:

1. Create domain entities
2. Create use-cases
3. Implement adapters
4. Update frontend to use SDK
5. Add feature flags
6. Test thoroughly

---

## Codemods

Automated code transformations to speed up migration.

### Codemod 1: Replace Direct Service Calls with SDK

**Install jscodeshift**:

```bash
npm install --save-dev jscodeshift
```

**Create codemod**:

```bash
cat > scripts/codemods/migrate-to-sdk.js << 'EOF'
module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Find: maidService.getMaids(...)
  // Replace: apiClient.GET('/profiles/maids', ...)

  root
    .find(j.CallExpression, {
      callee: {
        object: { name: 'maidService' },
        property: { name: 'getMaids' },
      },
    })
    .replaceWith((path) => {
      const args = path.node.arguments;
      return j.callExpression(
        j.memberExpression(j.identifier('apiClient'), j.identifier('GET')),
        [j.literal('/profiles/maids'), j.objectExpression([
          j.property('init', j.identifier('params'), j.objectExpression([
            j.property('init', j.identifier('query'), args[0] || j.objectExpression([])),
          ])),
        ])]
      );
    });

  return root.toSource();
};
EOF
```

**Run codemod**:

```bash
npx jscodeshift -t scripts/codemods/migrate-to-sdk.js src/**/*.jsx
```

### Codemod 2: Extract Hard-Coded Strings

```bash
# This is complex - semi-automated
# 1. Find JSX text nodes
# 2. Replace with {t('key')}
# 3. Add key to en.json

# Placeholder (manual for now)
echo "Manual string extraction required"
```

### Codemod 3: Remove Unsupported Locales

```bash
cat > scripts/codemods/remove-locales.js << 'EOF'
module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Remove am, tl, id, si from SUPPORTED_LOCALES object
  root
    .find(j.Property, {
      key: { name: (name) => ['am', 'tl', 'id', 'si'].includes(name) },
    })
    .remove();

  return root.toSource();
};
EOF

npx jscodeshift -t scripts/codemods/remove-locales.js src/contexts/LocalizationContext.jsx
```

---

## Breaking Changes

### API Changes

| Old Endpoint | New Endpoint | Notes |
|--------------|--------------|-------|
| `/api/users/register` | `/api/v1/auth/register` | Versioned |
| Direct Supabase calls | SDK calls | Type-safe |
| `user_type` | `role` | Renamed field |

### Data Model Changes

| Old | New | Migration |
|-----|-----|-----------|
| `registration_complete` | `emailVerified` | Map in adapter |
| `user_type` | `role` (enum) | Use UserRole value object |
| 6 locales | 2 locales (en, ar) | Remove am, tl, id, si |

### Code Changes

| Old Pattern | New Pattern |
|-------------|-------------|
| `import { maidService } from '@/services/maidService'` | `import createClient from '@ethio-maids/sdk'` |
| `<button>Save</button>` | `<button>{t(locale, 'common.buttons.save')}</button>` |
| Direct Supabase | Via ports & adapters |
| Business logic in services | Domain entities + use-cases |

---

## Test Migration

### Checklist

- [ ] All tests pass: `npm test`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] i18n completeness: `npm run check --workspace=@ethio-maids/i18n`
- [ ] SDK generates without errors: `npm run generate --workspace=@ethio-maids/sdk`
- [ ] Build succeeds: `npm run build --workspace=@ethio-maids/web`
- [ ] Linting passes: `npm run lint`
- [ ] No circular dependencies: `npx madge --circular --extensions js,jsx src/`
- [ ] Manual smoke test:
  - [ ] Register as maid
  - [ ] Register as sponsor
  - [ ] Create job posting
  - [ ] Apply to job
  - [ ] Switch to Arabic (RTL works)
  - [ ] Subscribe to plan

---

## Rollback Plan

### If Issues Arise

1. **Feature Flags**: Disable new module, revert to old code
2. **Database**: Restore from backup (if schema changed)
3. **Deployment**: Revert to previous Git tag
4. **Communication**: Notify users of temporary rollback

### Feature Flag Example

```javascript
const USE_NEW_IDENTITY_MODULE = process.env.VITE_FF_NEW_IDENTITY === 'true';

if (USE_NEW_IDENTITY_MODULE) {
  // New modular code
  await registerUserUseCase.execute(command);
} else {
  // Old code
  await supabase.auth.signUp(...);
}
```

---

## FAQ

### Q: Do I need to migrate everything at once?

**A:** No! Use the Strangler Fig pattern—migrate one module at a time. Start with Identity, then Profiles, etc.

### Q: What if I find bugs in the new architecture?

**A:** Report immediately. Use feature flags to revert to old code while fixing. Add regression tests.

### Q: How do I handle database schema changes?

**A:** Create migrations in `database/migrations/`. Test on staging first. Use transactions. Have rollback SQL ready.

### Q: Can I still use the old code during migration?

**A:** Yes! Old and new code coexist. Feature flags control which runs. Gradually shift traffic to new code.

### Q: What about TypeScript?

**A:** Currently JavaScript. TypeScript migration is optional but recommended. Can add JSDoc types incrementally.

### Q: How do I know when migration is complete?

**A:** When:
- All feature flags are removed
- Old code is deleted
- Test coverage ≥80%
- All i18n strings extracted
- Production running new code for 2 weeks without issues

---

## Support

- **Questions**: Open GitHub issue or contact architecture team
- **Bugs**: Report in GitHub Issues with `migration` label
- **Architecture discussions**: Weekly sync meeting

---

**Good luck with the migration! 🚀**
