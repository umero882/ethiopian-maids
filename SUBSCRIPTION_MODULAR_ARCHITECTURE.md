# Subscription Module - Clean Architecture Implementation

## Overview

The subscription module has been completely refactored to follow Clean Architecture and Domain-Driven Design (DDD) principles, matching the architecture patterns used in the dashboard-agency module.

## Architecture Layers

### 1. Domain Layer (`packages/domain/subscriptions/`)

**Pure business logic with no external dependencies**

#### Entities
- `Subscription.js` - Rich domain entity with full business logic
  - Properties: id, userId, planType, amount, status, dates, etc.
  - Business methods: `isActive()`, `isExpired()`, `hasFeature()`, `cancel()`, `renew()`
  - Domain events: `SubscriptionCancelled`, `SubscriptionRenewed`, etc.

#### Value Objects
- `SubscriptionStatus.js` - Immutable status value object
  - Valid values: active, trial, past_due, cancelled, expired, incomplete
  - Methods: `isActive()`, `isCancelled()`, `isExpired()`

- `PlanType.js` - Immutable plan type value object
  - Valid types: free, pro, premium
  - Plan hierarchy and comparison logic
  - Methods: `canUpgradeTo()`, `canDowngradeTo()`, `isHigherThan()`

### 2. Application Layer (`packages/app/subscriptions/`)

**Use cases and port interfaces (no implementation details)**

#### Use Cases (CQRS Pattern)

**Queries (Read Operations)**
- `GetActiveSubscription.js`
  - Fetches active subscription for a user
  - Returns DTO or null for free plan
  - Records audit logs

**Commands (Write Operations)**
- `UpgradeSubscription.js`
  - Upgrades user to higher tier
  - Validates upgrade is allowed
  - Creates or updates subscription
  - Records domain events and audit logs

#### Ports (Interfaces)
- `SubscriptionRepository.js`
  - Methods: `getActiveSubscription()`, `createSubscription()`, `updateSubscription()`, etc.
  - No implementation - just contracts

- `AuditLogger.js`
  - Method: `log(event)`
  - No implementation - just contract

### 3. Infrastructure Layer (`packages/infra/subscriptions/`)

**Concrete implementations (adapters) for external systems**

#### Adapters
- `SupabaseSubscriptionRepository.js`
  - Implements `SubscriptionRepository` port
  - Uses Supabase client for database operations
  - Handles errors and logging

- `SupabaseAuditLogger.js`
  - Implements `AuditLogger` port
  - Logs to `subscription_audit_logs` table
  - Gracefully handles missing tables

## Integration with Existing Code

### Current Implementation
The existing `SubscriptionContext.jsx` and `subscriptionService.js` remain functional and work alongside the new modular architecture.

### Migration Path

**Phase 1: Coexistence (Current State)**
```javascript
// Old way (still works)
import subscriptionService from '@/services/subscriptionService';
const subscription = await subscriptionService.getActiveSubscription(userId);

// New way (clean architecture)
import { GetActiveSubscription } from '@ethio-maids/app-subscriptions';
import { SupabaseSubscriptionRepository, SupabaseAuditLogger } from '@ethio-maids/infra-subscriptions';

const repository = new SupabaseSubscriptionRepository({ supabaseClient: supabase });
const auditLogger = new SupabaseAuditLogger({ supabaseClient: supabase });
const useCase = new GetActiveSubscription({ subscriptionRepository: repository, auditLogger });

const subscription = await useCase.execute({ userId, requestedBy: currentUser.id });
```

**Phase 2: Gradual Adoption**
- Update `SubscriptionContext` to use new use cases internally
- Keep the same public API for components
- Components don't need to change

**Phase 3: Full Migration**
- Replace all direct calls to old subscriptionService
- Use dependency injection for use cases
- Remove old service files

## Usage Example

### Setting Up Dependencies

```javascript
// src/hooks/useSubscription.js (new implementation)
import { useMemo } from 'react';
import { supabase } from '@/lib/databaseClient';
import { GetActiveSubscription, UpgradeSubscription } from '@ethio-maids/app-subscriptions';
import { SupabaseSubscriptionRepository, SupabaseAuditLogger } from '@ethio-maids/infra-subscriptions';
import { createLogger } from '@/utils/logger';

export function useSubscriptionModule() {
  const dependencies = useMemo(() => {
    const logger = createLogger('Subscription');

    const repository = new SupabaseSubscriptionRepository({
      supabaseClient: supabase,
      logger
    });

    const auditLogger = new SupabaseAuditLogger({
      supabaseClient: supabase,
      logger,
      enabled: true
    });

    return {
      repository,
      auditLogger,
      getActiveSubscriptionUseCase: new GetActiveSubscription({
        subscriptionRepository: repository,
        auditLogger
      }),
      upgradeSubscriptionUseCase: new UpgradeSubscription({
        subscriptionRepository: repository,
        auditLogger
      })
    };
  }, []);

  return dependencies;
}
```

### Using in Components

```javascript
// In a component
const { getActiveSubscriptionUseCase } = useSubscriptionModule();

const fetchSubscription = async () => {
  const subscription = await getActiveSubscriptionUseCase.execute({
    userId: user.id,
    requestedBy: user.id
  });

  if (subscription) {
    console.log('Plan:', subscription.planType);
    console.log('Active:', subscription.isActive);
    console.log('Days remaining:', subscription.daysRemaining);
  }
};
```

## Benefits of This Architecture

### 1. **Separation of Concerns**
- Domain logic isolated from infrastructure
- Business rules in one place (Subscription entity)
- Easy to test without database

### 2. **Testability**
- Mock repositories for unit tests
- Test domain logic without Supabase
- Test use cases with fake adapters

### 3. **Flexibility**
- Easy to swap Supabase for another database
- Can add multiple repositories (Stripe API, Cache, etc.)
- Business logic remains unchanged

### 4. **Maintainability**
- Clear structure and responsibilities
- Easy to find code
- Self-documenting through types and patterns

### 5. **Scalability**
- Add new use cases without touching existing code
- Domain events for event-driven architecture
- Can add CQRS query optimization later

## File Structure

```
packages/
├── domain/
│   └── subscriptions/
│       ├── entities/
│       │   └── Subscription.js
│       ├── value-objects/
│       │   ├── SubscriptionStatus.js
│       │   └── PlanType.js
│       └── index.js
├── app/
│   └── subscriptions/
│       ├── usecases/
│       │   ├── GetActiveSubscription.js
│       │   ├── UpgradeSubscription.js
│       │   └── index.js
│       ├── ports/
│       │   ├── SubscriptionRepository.js
│       │   ├── AuditLogger.js
│       │   └── index.js
│       └── index.js
└── infra/
    └── subscriptions/
        ├── adapters/
        │   ├── SupabaseSubscriptionRepository.js
        │   ├── SupabaseAuditLogger.js
        │   └── index.js
        └── index.js
```

## Next Steps

1. **Update SubscriptionContext** ✅ DONE
   - Already has `refreshSubscription()` function
   - Works with webhook updates

2. **Create package.json files**
   - Add to each module for proper npm packaging
   - Define dependencies

3. **Add More Use Cases**
   - `CancelSubscription`
   - `DowngradeSubscription`
   - `GetSubscriptionUsage`
   - `CheckFeatureAccess`

4. **Testing**
   - Unit tests for domain entities
   - Use case tests with mock repositories
   - Integration tests with real Supabase

5. **Documentation**
   - API documentation for each use case
   - Architecture decision records (ADRs)
   - Migration guide for developers

## Compatibility

This modular architecture is **fully compatible** with the existing subscription system:

- ✅ Stripe webhooks still work
- ✅ SubscriptionContext still works
- ✅ All existing pages still work
- ✅ No breaking changes
- ✅ Gradual migration possible

## Related Files Updated

1. `src/contexts/SubscriptionContext.jsx` - Added `refreshSubscription()` function
2. `src/pages/dashboards/agency/AgencyHomePage.jsx` - Uses `refreshSubscription()` after Stripe redirect

## Architecture Principles

This implementation follows:

- **Clean Architecture** (Uncle Bob)
- **Domain-Driven Design** (DDD)
- **CQRS** (Command Query Responsibility Segregation)
- **Dependency Inversion** (SOLID principles)
- **Ports and Adapters** (Hexagonal Architecture)

## Conclusion

The subscription module now follows the same architectural patterns as the rest of the modular codebase (dashboard-agency, identity, profiles, etc.). This provides a consistent, maintainable, and scalable foundation for subscription management.
