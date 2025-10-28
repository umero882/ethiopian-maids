# Ethiopian Maids Platform - Architecture Documentation

**Version:** 2.0.0 (Modular Refactor)
**Date:** 2025-10-21
**Status:** In Development

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Monorepo Structure](#monorepo-structure)
4. [Domain-Driven Design](#domain-driven-design)
5. [Clean Architecture Layers](#clean-architecture-layers)
6. [CQRS Pattern](#cqrs-pattern)
7. [Module Organization](#module-organization)
8. [Data Flow](#data-flow)
9. [API Design](#api-design)
10. [Testing Strategy](#testing-strategy)
11. [Security & Compliance](#security--compliance)
12. [Internationalization & RTL](#internationalization--rtl)
13. [Deployment Architecture](#deployment-architecture)

---

## Overview

The Ethiopian Maids Platform is a multi-tenant marketplace connecting domestic workers (maids) with sponsors and agencies in the GCC region. The platform has been refactored into a modular, domain-driven architecture to improve:

- **Maintainability**: Clear separation of concerns
- **Testability**: Isolated, testable modules
- **Scalability**: Independent scaling of services
- **Developer Experience**: Predictable patterns and conventions

### Key Technologies

- **Frontend**: React 18, Vite, TailwindCSS, Radix UI
- **Backend**: Node.js (Express), Supabase Edge Functions
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **Payments**: Stripe (subscriptions)
- **Communications**: Twilio (SMS), Nodemailer (Email), Socket.io (Chat)
- **Monorepo**: npm workspaces

---

## Architecture Principles

### 1. **Domain-Driven Design (DDD)**
- Business logic lives in pure domain entities
- Ubiquitous language shared across team
- Bounded contexts define module boundaries

### 2. **Hexagonal Architecture (Ports & Adapters)**
- Core business logic independent of frameworks
- Ports define interfaces (contracts)
- Adapters implement infrastructure concerns

### 3. **CQRS (Command Query Responsibility Segregation)**
- Commands mutate state (write model)
- Queries read state (read model)
- Clear intent and optimization opportunities

### 4. **Event-Driven Architecture**
- Domain events capture state changes
- Event outbox ensures reliable delivery
- Loose coupling between modules

### 5. **Dependency Inversion**
- High-level modules don't depend on low-level modules
- Both depend on abstractions (ports)
- Infrastructure adapters are pluggable

### 6. **Single Responsibility**
- Each module has one reason to change
- Clear ownership and accountability

---

## Monorepo Structure

```
ethiopian-maids/
├── apps/
│   ├── web/                    # PWA frontend (React)
│   └── admin/                  # Admin panel (optional separate app)
│
├── services/
│   ├── api/                    # HTTP API handlers (controllers)
│   └── workers/                # Background jobs, event consumers
│
├── packages/
│   ├── domain/                 # Pure business logic (entities, policies)
│   │   ├── identity/
│   │   ├── profiles/
│   │   ├── jobs/
│   │   ├── subscriptions/
│   │   ├── media/
│   │   ├── communications/
│   │   ├── compliance/
│   │   ├── search/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   ├── analytics/
│   │   └── common/
│   │
│   ├── app/                    # Application layer (use-cases, ports)
│   │   ├── identity/
│   │   ├── profiles.maid/
│   │   ├── profiles.sponsor/
│   │   ├── profiles.agency/
│   │   ├── jobs/
│   │   ├── subscriptions/
│   │   ├── media/
│   │   ├── communications/
│   │   ├── compliance/
│   │   ├── search/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   ├── analytics/
│   │   └── common/
│   │
│   ├── ui/                     # Design system (atoms, molecules, organisms)
│   ├── i18n/                   # Translation catalogs (en, ar)
│   ├── sdk/                    # Generated API client (from OpenAPI)
│   └── utils/                  # Pure helper functions
│
├── database/                   # SQL migrations
├── scripts/                    # Build, deployment scripts
└── docs/                       # Documentation

```

---

## Domain-Driven Design

### Bounded Contexts

Each domain package represents a bounded context:

| Context | Aggregate Roots | Key Concepts |
|---------|----------------|--------------|
| **Identity** | User | Authentication, Authorization, Roles |
| **Profiles** | MaidProfile, SponsorProfile, AgencyProfile | Profile management, KYC/KYB |
| **Jobs** | Job, Application | Postings, Applications, Matching |
| **Subscriptions** | Subscription, Plan | Billing, Plans, Invoices |
| **Media** | Media | Upload, Storage, Processing |
| **Communications** | Notification, Message | Email, SMS, Chat |
| **Compliance** | Verification | KYC, KYB, Audit trails |
| **Search** | SearchQuery | Filtering, Faceting |
| **Dashboard** | Dashboard | Role-based widgets |
| **Admin** | AdminAction | Moderation, Settings |
| **Analytics** | Metric, Event | Tracking, Reporting |

### Domain Entities

Domain entities are pure business objects with behavior:

```javascript
// Example: User entity
export class User {
  constructor({ id, email, role, status }) {
    this.id = id;
    this.email = email;
    this.role = role; // UserRole value object
    this.status = status;
    this._domainEvents = [];
  }

  verifyEmail() {
    if (this.emailVerified) {
      throw new Error('Email already verified');
    }
    this.emailVerified = true;
    this._domainEvents.push({
      type: 'UserEmailVerified',
      payload: { userId: this.id },
    });
  }

  pullDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
```

### Value Objects

Value objects are immutable and compared by value:

```javascript
// Example: UserRole value object
export class UserRole {
  constructor(roleName) {
    this._roleName = roleName;
    this._permissions = ROLE_PERMISSIONS[roleName];
  }

  hasPermission(permission) {
    return this._permissions.includes(permission);
  }

  equals(other) {
    return other instanceof UserRole && other._roleName === this._roleName;
  }
}
```

---

## Clean Architecture Layers

### 1. **Domain Layer** (`packages/domain/*`)

**Responsibilities:**
- Define business entities and value objects
- Encode business rules and invariants
- Emit domain events on state changes
- **No dependencies** on infrastructure

**Structure:**
```
packages/domain/identity/
├── entities/
│   └── User.js
├── value-objects/
│   └── UserRole.js
├── events/
│   └── index.js
├── policies/
│   └── index.js
└── __tests__/
```

**Rules:**
- ✅ Pure JavaScript/TypeScript
- ✅ No framework dependencies
- ✅ No database queries
- ✅ No HTTP calls
- ❌ Must not import from `app` or `infra` layers

### 2. **Application Layer** (`packages/app/*`)

**Responsibilities:**
- Define use-cases (commands and queries)
- Define ports (interfaces for infrastructure)
- Validate inputs
- Orchestrate domain entities
- Publish domain events

**Structure:**
```
packages/app/identity/
├── usecases/
│   ├── RegisterUser.js      # Command
│   ├── GetUser.js            # Query
│   └── VerifyUserEmail.js    # Command
├── ports/
│   ├── UserRepository.js     # Port (interface)
│   ├── AuthenticationService.js
│   └── AuditLogger.js
├── validators/
│   └── index.js
├── mappers/
│   └── index.js
└── __tests__/
```

**Use Case Example:**
```javascript
export class RegisterUser {
  constructor({ userRepository, authService, auditLogger, eventBus }) {
    this.userRepository = userRepository;
    this.authService = authService;
    this.auditLogger = auditLogger;
    this.eventBus = eventBus;
  }

  async execute(command) {
    // Validate
    // Create entity
    // Persist via port
    // Publish events
    // Audit log
    // Return DTO
  }
}
```

**Rules:**
- ✅ Depends on `domain` layer
- ✅ Defines ports (interfaces)
- ❌ Must not import concrete infrastructure adapters
- ❌ Must not know about frameworks (Express, Supabase, etc.)

### 3. **Infrastructure Layer** (Adapters - Not in repo yet)

**Responsibilities:**
- Implement ports defined in app layer
- Handle database queries (Supabase)
- Call external APIs (Stripe, Twilio)
- File storage (Supabase Storage)

**Structure (to be created):**
```
packages/infra/
├── repositories/
│   ├── SupabaseUserRepository.js   # Implements UserRepository port
│   └── ...
├── services/
│   ├── SupabaseAuthService.js      # Implements AuthenticationService port
│   ├── StripePaymentGateway.js
│   └── ...
├── storage/
│   └── SupabaseStorageAdapter.js
└── __tests__/
```

### 4. **Presentation Layer** (`apps/web`, `services/api`)

**Responsibilities:**
- Handle HTTP requests/responses
- Call use-cases
- Map DTOs to/from JSON
- Handle authentication/authorization
- Rate limiting

**API Controller Example:**
```javascript
// services/api/controllers/auth.js
import { RegisterUser } from '@ethio-maids/app-identity';

export async function register(req, res) {
  const registerUser = new RegisterUser({
    userRepository,      // injected adapter
    authService,         // injected adapter
    auditLogger,         // injected adapter
    eventBus,           // injected adapter
  });

  const result = await registerUser.execute(req.body);
  res.status(201).json(result);
}
```

---

## CQRS Pattern

### Commands (Mutations)

Commands change state and are validated strictly:

```javascript
// Command
{
  type: 'RegisterUser',
  payload: {
    email: 'user@example.com',
    password: 'SecurePass123!',
    role: 'maid',
  },
}

// Handled by use-case
RegisterUser.execute(command) → { userId, session }
```

### Queries (Reads)

Queries read state and may use optimized read models:

```javascript
// Query
{
  type: 'GetMaidProfiles',
  payload: {
    filters: { nationality: 'Ethiopian', experience: '5+' },
    page: 1,
    pageSize: 20,
  },
}

// Handled by use-case
GetMaidProfiles.execute(query) → { data, pagination }
```

### Benefits

- Clear intent (write vs read)
- Optimized data models (write/read models can differ)
- Easier caching and scaling
- Better security (separate permissions)

---

## Module Organization

### Feature Module Template

Every feature follows this structure:

```
packages/app/<feature>/
├── index.js              # Public API (exports)
├── usecases/
│   ├── CreateX.js        # Command
│   ├── UpdateX.js        # Command
│   ├── DeleteX.js        # Command
│   ├── GetX.js           # Query
│   ├── ListX.js          # Query
│   └── index.js
├── ports/
│   ├── XRepository.js    # Data port
│   ├── YGateway.js       # External API port
│   └── index.js
├── validators/
│   └── index.js          # Input validation
├── mappers/
│   └── index.js          # DTO mappers
└── __tests__/
    ├── CreateX.test.js
    └── GetX.test.js
```

### Cross-Module Communication

Modules communicate via:

1. **Events** (preferred): Publish domain events, other modules subscribe
2. **Direct calls**: Only for read-only queries
3. **Shared kernels**: Common domain concepts in `packages/domain/common`

**Example:**
```javascript
// Identity module publishes event
user.pullDomainEvents() → [{ type: 'UserRegistered', payload: { userId } }]

// Profiles module subscribes to event
eventBus.on('UserRegistered', async (event) => {
  await createEmptyProfile(event.payload.userId);
});
```

---

## Data Flow

### Write Flow (Command)

```
1. HTTP Request → API Controller
2. Controller → Use-Case (Command)
3. Use-Case → Domain Entity (business logic)
4. Entity → Domain Events emitted
5. Use-Case → Port (Repository) to persist
6. Use-Case → Event Bus to publish events
7. Use-Case → Response DTO
8. Controller → HTTP Response
```

### Read Flow (Query)

```
1. HTTP Request → API Controller
2. Controller → Use-Case (Query)
3. Use-Case → Port (Repository) to fetch
4. Use-Case → Mapper to DTO
5. Controller → HTTP Response
```

### Event Flow

```
1. Domain Event emitted → Event Outbox Table
2. Worker → Poll Outbox
3. Worker → Publish to Event Bus
4. Subscribers → React to event
5. Worker → Mark event as published
```

---

## API Design

### OpenAPI-First

All API changes start with `services/api/openapi.yaml`:

1. Update OpenAPI spec
2. Generate SDK: `npm run generate --workspace=@ethio-maids/sdk`
3. Implement controller
4. Frontend uses SDK (typed)

### Versioning

- Base path: `/api/v1`
- Breaking changes → new version `/api/v2`
- Support N-1 versions for 6 months

### Response Format

**Success:**
```json
{
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO-8601"
  }
}
```

**Error:**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "errors": [
      { "field": "email", "message": "Invalid email" }
    ]
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO-8601"
  }
}
```

---

## Testing Strategy

### Testing Pyramid

```
      /\
     /E2E\       End-to-End (5%)
    /------\
   /Integr.\ Integration (15%)
  /----------\
 /   Unit     \ Unit (80%)
/--------------\
```

### Unit Tests

- **Domain entities**: Test business logic
- **Use-cases**: Test orchestration (mock ports)
- **Validators**: Test input validation
- **Utils**: Test pure functions

**Example:**
```javascript
// User.test.js
describe('User', () => {
  it('should emit UserEmailVerified event when verifying email', () => {
    const user = new User({ id: '1', email: 'test@example.com', emailVerified: false });
    user.verifyEmail();
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('UserEmailVerified');
  });
});
```

### Integration Tests

- **Port implementations**: Test adapters against real services
- **Database repositories**: Test against test DB
- **API routes**: Test HTTP layer

### E2E Tests

- **Critical paths**: Registration → Profile → Job Application
- **Payment flows**: Subscribe → Pay → Upgrade
- **Admin workflows**: Verify → Approve → Suspend

### Coverage Goals

- Domain layer: **100%**
- Application layer: **≥90%**
- Infrastructure: **≥80%**
- Presentation: **≥70%**
- Overall: **≥80%**

---

## Security & Compliance

### Authentication

- Supabase Auth for session management
- JWT tokens with refresh
- Session expiry: 1 hour (access), 30 days (refresh)

### Authorization

- Role-based access control (RBAC)
- Permissions checked in use-cases
- Row-level security (RLS) in database

### Audit Logging

All sensitive operations are logged:

```javascript
await auditLogger.logSecurityEvent({
  action: 'USER_REGISTERED',
  userId,
  resource: 'users',
  result: 'success',
  metadata: { email, role },
});
```

### PII Protection

- PII fields encrypted at rest
- Access logged via `logPIIAccess()`
- Redaction in logs

### Compliance (KYC/KYB)

- Document verification workflows
- Audit trails for compliance actions
- Retention policies enforced

---

## Internationalization & RTL

### Supported Locales

- **English (en)**: Default, LTR
- **Arabic (ar)**: RTL

**No other languages supported per requirements.**

### Translation Keys

Organized by feature:

```json
{
  "identity": {
    "register": {
      "title": "Create Account",
      "emailPlaceholder": "Enter your email"
    }
  }
}
```

### Usage

```javascript
import { t } from '@ethio-maids/i18n';

const title = t('ar', 'identity.register.title'); // "إنشاء حساب"
```

### RTL Support

All components use logical properties:

```javascript
import { useRTL } from '@ethio-maids/ui';

const { isRTL, marginStart, dir } = useRTL(locale);
```

### RTL Testing

All layouts must have RTL snapshot tests:

```javascript
it('should render correctly in RTL', () => {
  const { container } = render(<Component />, { wrapper: withRTL('rtl') });
  expect(container).toMatchSnapshot();
});
```

---

## Deployment Architecture

### Frontend (Vercel)

- **App**: `apps/web` → Vercel
- **Build**: Vite production build
- **CDN**: Vercel Edge Network
- **Env**: Environment variables in Vercel dashboard

### API (Node.js)

- **App**: `services/api` → Node server (e.g., Railway, Fly.io)
- **Port**: 3001
- **Health**: `/health` endpoint

### Workers (Background)

- **App**: `services/workers`
- **Jobs**:
  - Event outbox consumer
  - Notification dispatcher
  - Analytics aggregation

### Database (Supabase)

- **PostgreSQL**: Hosted by Supabase
- **Migrations**: Applied via `npm run migrate`
- **Backups**: Daily automated

### Storage (Supabase Storage)

- **Buckets**: `profile-images`, `documents`, `videos`
- **CDN**: Supabase CDN

### Monitoring

- **Errors**: Sentry (or similar)
- **Logs**: Structured logs to console (picked up by platform)
- **Metrics**: Performance monitoring dashboard

---

## Appendix: Key Design Decisions

### ADR-001: Monorepo with npm Workspaces

**Decision**: Use npm workspaces for monorepo management.

**Rationale**: Simple, built-in, no extra tooling. Sufficient for current scale.

**Alternatives considered**: Nx, Turborepo (more complexity than needed).

### ADR-002: Hexagonal Architecture

**Decision**: Use ports & adapters pattern.

**Rationale**: Testability, flexibility to swap implementations (e.g., switch from Supabase to Firebase).

**Trade-offs**: More initial boilerplate, but pays off long-term.

### ADR-003: CQRS without Event Sourcing

**Decision**: Separate commands and queries, but use traditional state storage (not event sourcing).

**Rationale**: CQRS benefits without event sourcing complexity.

**Trade-offs**: Cannot replay events to rebuild state (acceptable for this use case).

### ADR-004: English + Arabic Only

**Decision**: Support only English and Arabic locales.

**Rationale**: Business requirement focused on GCC region.

**Impact**: Simplifies i18n, reduces maintenance burden.

### ADR-005: Subscription Model (No Credits)

**Decision**: Use recurring subscriptions instead of pay-per-contact credits.

**Rationale**: Predictable revenue, simpler billing, better UX.

**Impact**: Existing `credit_transactions` tables deprecated.

---

## Contributing

See `CONTRIBUTING.md` for:
- Code review checklist
- Branch strategy
- Commit conventions
- PR templates

---

**Questions?** Contact the architecture team.
