# Packages Directory

This directory contains the modular packages for the Ethio Maids platform, organized following Clean Architecture and Domain-Driven Design principles.

## Structure

```
packages/
├── domain/           # Domain layer (pure business logic)
├── app/              # Application layer (use cases)
├── infrastructure/   # Infrastructure layer (adapters, repositories)
├── sdk/              # Type-safe API client
└── shared/           # Shared utilities
```

## Domain Layer

**Purpose:** Pure business logic with no external dependencies.

### Packages

#### `domain/profiles`
Profile management domain logic.

**Entities:**
- `MaidProfile` - Maid profile with work experience, skills, documents
- `SponsorProfile` - Sponsor profile with household info, preferences
- `AgencyProfile` - Agency profile with license, business info

**Value Objects:**
- `ProfileStatus` - Profile lifecycle states
- `WorkExperience` - Work history representation

**Usage:**
```javascript
import { MaidProfile, ProfileStatus } from '@ethio-maids/domain-profiles';

const profile = new MaidProfile({
  id: '123',
  userId: '456',
  fullName: 'Jane Doe',
  status: 'draft'
});

profile.updateSkills(['cooking', 'childcare']);
const events = profile.pullDomainEvents();
```

#### `domain/identity`
User identity and authentication domain logic.

**Entities:**
- `User` - User account with roles and permissions
- `Session` - User session management
- `PasswordReset` - Password reset flow

**Usage:**
```javascript
import { User } from '@ethio-maids/domain-identity';

const user = User.register({
  email: 'user@example.com',
  password: 'SecurePass123',
  role: 'maid'
});
```

#### `domain/jobs`
Job posting and application domain logic.

**Entities:**
- `JobPosting` - Job listing
- `JobApplication` - Application to a job

**Status:** Planned

#### `domain/subscriptions`
Subscription and billing domain logic.

**Entities:**
- `Subscription` - User subscription
- `Plan` - Subscription plan

**Status:** Planned

## Application Layer

**Purpose:** Orchestrate business logic using domain entities.

### Packages

#### `app/profiles-maid`
Maid profile use cases.

**Use Cases:**
- `CreateMaidProfile` - Create new maid profile
- `UpdateMaidProfile` - Update existing profile

**Usage:**
```javascript
import { CreateMaidProfile } from '@ethio-maids/app-profiles-maid';

const useCase = new CreateMaidProfile({
  maidProfileRepository,
  eventBus
});

const profile = await useCase.execute({
  userId: '123',
  fullName: 'Jane Doe',
  skills: ['cooking', 'cleaning']
});
```

#### `app/profiles-sponsor`
Sponsor profile use cases.

**Use Cases:**
- `CreateSponsorProfile`
- `UpdateSponsorProfile`

#### `app/profiles-agency`
Agency profile use cases.

**Use Cases:**
- `CreateAgencyProfile`
- `UpdateAgencyProfile`

#### `app/identity`
Identity and authentication use cases.

**Use Cases:**
- `RegisterUser`
- `LoginUser`
- `ResetPassword`

## Infrastructure Layer

**Purpose:** External service integrations and data persistence.

### Packages

#### `infrastructure/adapters`
Adapters for external services.

**Adapters:**
- Database adapters (Supabase, PostgreSQL)
- Email adapters (SendGrid)
- Storage adapters (S3, Cloudinary)

**Status:** Planned

#### `infrastructure/repositories`
Data persistence implementations.

**Repositories:**
- `MaidProfileRepository`
- `SponsorProfileRepository`
- `AgencyProfileRepository`
- `UserRepository`

**Status:** Planned

## SDK

**Purpose:** Type-safe client for API communication.

### Package: `sdk`

Type-safe TypeScript client generated from OpenAPI spec.

**Usage:**
```javascript
import createClient from '@ethio-maids/sdk';

const client = createClient({
  baseUrl: 'https://api.ethio-maids.com'
});

const { data } = await client.GET('/profiles/maids', {
  params: {
    query: { nationality: 'ET' }
  }
});
```

**Status:** Planned (awaiting OpenAPI spec)

## Shared

**Purpose:** Shared utilities and helpers.

### Package: `shared/utils`

Common utilities used across packages.

**Utilities:**
- `idGenerator` - UUID and short ID generation

**Usage:**
```javascript
import { generateId } from '@ethio-maids/shared-utils';

const id = generateId(); // UUID v4
```

## Development

### Installing Dependencies

```bash
# Install all dependencies
pnpm install

# Install in specific package
cd packages/domain/profiles
pnpm install
```

### Building Packages

```bash
# Build all packages
pnpm -r build

# Build specific package
cd packages/domain/profiles
pnpm build
```

### Testing

```bash
# Test all packages
pnpm -r test

# Test specific package
cd packages/domain/profiles
pnpm test

# Test with coverage
pnpm test:coverage
```

### Linking Packages Locally

```bash
# Link domain package
cd packages/domain/profiles
pnpm link --global

# Use in app
cd packages/app/profiles-maid
pnpm link --global @ethio-maids/domain-profiles
```

## Package Naming Convention

- `@ethio-maids/domain-{module}` - Domain packages
- `@ethio-maids/app-{module}` - Application packages
- `@ethio-maids/infrastructure-{module}` - Infrastructure packages
- `@ethio-maids/sdk` - SDK package
- `@ethio-maids/shared-{name}` - Shared packages

## Dependencies

### Domain Packages
- ✅ No external dependencies
- ✅ Pure JavaScript
- ✅ Framework agnostic

### Application Packages
- ✅ Depend only on domain packages
- ✅ Minimal external dependencies
- ✅ Framework agnostic

### Infrastructure Packages
- ⏳ Can depend on external services
- ⏳ Database clients
- ⏳ API clients

## Contributing

### Adding a New Package

1. **Create package directory:**
   ```bash
   mkdir -p packages/domain/new-module
   cd packages/domain/new-module
   ```

2. **Initialize package:**
   ```bash
   pnpm init
   ```

3. **Update package.json:**
   ```json
   {
     "name": "@ethio-maids/domain-new-module",
     "version": "1.0.0",
     "type": "module",
     "exports": "./index.js"
   }
   ```

4. **Add to workspace:**
   Workspace is auto-discovered via `pnpm-workspace.yaml`

5. **Create exports:**
   ```javascript
   // index.js
   export { NewEntity } from './entities/NewEntity.js';
   ```

### Package Guidelines

1. **Single Responsibility:** Each package should have one clear purpose
2. **Dependency Direction:** Dependencies flow inward (infrastructure → app → domain)
3. **No Circular Dependencies:** Avoid circular imports
4. **Explicit Exports:** Only export public API
5. **Documentation:** Document all public interfaces

## Architecture Layers

```
┌─────────────────────────────────────┐
│         Presentation Layer          │  (React Frontend)
│         (src/ directory)            │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│        Application Layer            │  (app/ packages)
│    Use Cases & Application Logic   │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│          Domain Layer               │  (domain/ packages)
│   Entities, Value Objects, Rules   │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│      Infrastructure Layer           │  (infrastructure/ packages)
│  Databases, APIs, External Services │
└─────────────────────────────────────┘
```

## Further Reading

- [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - Complete migration documentation
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Architecture decisions
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

---

**Last Updated:** 2025-10-21
**Maintainer:** Ethio Maids Development Team
