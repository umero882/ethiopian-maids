# Agency Dashboard - Architecture Compliance Analysis

**Date:** October 23, 2025
**Status:** Analysis Complete - Refactoring Plan Approved
**Analyst:** Claude Code

---

## Executive Summary

The Agency Dashboard has been successfully cleaned of all mock data and is **production-ready** in terms of functionality. However, it **does not meet the modular architecture standards** outlined in the Migration Guide and Architecture documentation.

### Compliance Score: 2/10

| Criterion | Status | Score |
|-----------|--------|-------|
| **Domain Layer Usage** | ❌ Not Implemented | 0/10 |
| **Application Layer (Use Cases)** | ❌ Not Implemented | 0/10 |
| **Ports & Adapters Pattern** | ❌ Not Implemented | 0/10 |
| **SDK Integration** | ❌ Not Used | 0/10 |
| **Dependency Injection** | ❌ Static Classes | 0/10 |
| **Clean Architecture** | ❌ Monolithic Services | 0/10 |
| **Production Ready (Functionality)** | ✅ Complete | 10/10 |
| **No Mock Data** | ✅ Complete | 10/10 |
| **Error Handling** | ✅ Resilient | 8/10 |
| **Code Quality** | ⚠️ Mixed | 4/10 |

**Overall:** The dashboard works well but needs architectural refactoring to align with the target modular design.

---

## Current Architecture

### What Exists

#### ✅ Good: Modular Package Structure
```
packages/
├── domain/
│   ├── identity/          ✅ Implemented
│   ├── profiles/          ✅ Implemented
│   └── jobs/              ✅ Implemented
├── app/
│   ├── identity/          ✅ Implemented
│   ├── profiles/          ✅ Implemented
│   └── jobs/              ✅ Implemented
└── sdk/                   ⚠️  Exists but not used
```

#### ✅ Good: Backend API Controllers
```javascript
// services/api/controllers/auth.controller.js
import { RegisterUser } from '@ethio-maids/app-identity';
import { SupabaseUserRepository } from '@ethio-maids/infra-identity';

// ✅ Uses Clean Architecture
const registerUser = new RegisterUser({ userRepository, authService });
const result = await registerUser.execute(command);
```

#### ❌ Problem: Frontend Services
```javascript
// src/services/agencyDashboardService.js
export class AgencyDashboardService {
  static async getAgencyKPIs(agencyId) {
    // ❌ Directly calls Supabase
    const { count } = await supabase
      .from('maid_profiles')
      .select('*', { count: 'exact' });

    return count || 0;
  }
}
```

---

## Detailed Gap Analysis

### 1. Domain Layer - NOT USED ❌

**Expected:**
```javascript
// packages/domain/dashboard/entities/AgencyKPI.js
export class AgencyKPI {
  constructor({ activeMaids, jobsLive, hiresThisMonth }) {
    this.activeMaids = new KPIValue(activeMaids, 'count');
    this.jobsLive = new KPIValue(jobsLive, 'count');
    this.hiresThisMonth = new KPIValue(hiresThisMonth, 'count');
  }

  calculateGrowthRate(previousKPI) {
    // Business logic for KPI calculations
  }

  isPerformingWell() {
    // Business rules
    return this.hiresThisMonth.value > 5;
  }
}
```

**Reality:**
```javascript
// src/services/agencyDashboardService.js
// ❌ No domain entities - just plain objects
return {
  activeMaids: 5,
  jobsLive: 2,
  hiresThisMonth: 3
};
```

**Impact:**
- Business logic scattered across services
- No validation or invariants
- Hard to test business rules
- No domain events

### 2. Application Layer (Use Cases) - NOT USED ❌

**Expected:**
```javascript
// packages/app/dashboard-agency/usecases/GetAgencyKPIs.js
export class GetAgencyKPIs {
  constructor({ agencyRepository, auditLogger }) {
    this.agencyRepository = agencyRepository;
    this.auditLogger = auditLogger;
  }

  async execute(query) {
    // Validate
    if (!query.agencyId) throw new ValidationError();

    // Fetch via port
    const kpiData = await this.agencyRepository.getKPIs(query.agencyId);

    // Create domain entity
    const kpi = new AgencyKPI(kpiData);

    // Audit
    await this.auditLogger.log('kpi_viewed', query.agencyId);

    // Return DTO
    return kpi.toDTO();
  }
}
```

**Reality:**
```javascript
// src/hooks/useAgencyDashboard.js
// ❌ Directly calls service
const kpisData = await AgencyDashboardService.getAgencyKPIs(agencyId);
setKpis(kpisData);
```

**Impact:**
- No clear command/query separation
- No validation layer
- No audit trail
- Hard to test in isolation

### 3. Ports & Adapters - NOT USED ❌

**Expected:**
```javascript
// packages/app/dashboard-agency/ports/AgencyDashboardRepository.js
export class AgencyDashboardRepository {
  async getKPIs(agencyId) {
    throw new Error('Must be implemented by adapter');
  }
}

// packages/infra/dashboard-agency/SupabaseAgencyRepository.js
export class SupabaseAgencyRepository extends AgencyDashboardRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async getKPIs(agencyId) {
    // Supabase-specific implementation
    const { count } = await this.supabase
      .from('maid_profiles')
      .select('*', { count: 'exact' });

    return { activeMaids: count };
  }
}
```

**Reality:**
```javascript
// src/services/agencyDashboardService.js
// ❌ Direct Supabase coupling
import { supabase } from '@/lib/databaseClient';

static async getActiveMaidsCount(agencyId) {
  const { count } = await supabase
    .from('maid_profiles')
    .select('*', { count: 'exact' });
  return count || 0;
}
```

**Impact:**
- Tightly coupled to Supabase
- Can't swap databases
- Hard to mock for tests
- Violates Dependency Inversion Principle

### 4. SDK - NOT USED ❌

**Expected:**
```javascript
// src/lib/sdk/apiClient.js (production)
import createClient from '@ethio-maids/sdk';
const client = createClient({ baseUrl, token });

// Use type-safe SDK
const { data } = await client.GET('/api/v1/agencies/{id}/kpis', {
  params: { path: { id: agencyId } }
});
```

**Reality:**
```javascript
// src/lib/sdk/apiClient.js (current)
// ❌ Marked as "MockSDKClient"
class MockSDKClient {
  async GET(path, options) {
    // Manual fetch implementation
  }
}

// ❌ SDK exists but NOT USED anywhere
// packages/sdk/ - complete but unused
```

**Impact:**
- No type safety
- Manual API call handling
- No OpenAPI contract validation
- Duplicate code for HTTP calls

### 5. Service Layer Anti-Pattern ❌

**Current State:**
```
src/services/
├── agencyService.js                    ❌ 830 lines
├── agencyDashboardService.js           ❌ 1,580 lines
├── subscriptionService.js              ❌ Large
├── stripeBillingService.js             ❌ Large
├── [25 more service files]             ❌ Anti-pattern
```

**Problems:**
```javascript
// All services follow this anti-pattern:
export class XYZService {
  static async method1() { /* ... */ }
  static async method2() { /* ... */ }
  // No dependency injection
  // No testability
  // No modularity
}
```

**Expected:**
```
packages/
├── app/
│   └── dashboard-agency/
│       ├── usecases/          # One file per use case
│       └── ports/             # Interfaces
└── infra/
    └── dashboard-agency/
        └── adapters/          # Implementations
```

---

## Architecture Comparison

### Current: Monolithic Services

```
┌─────────────────┐
│  AgencyHomePage │
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│ useAgencyDashboard (Hook)  │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ AgencyDashboardService     │  ❌ Static class
│  - getAgencyKPIs()         │  ❌ Direct Supabase
│  - getAgencyAlerts()       │  ❌ No DI
│  - getPipelineFunnel()     │  ❌ Hard to test
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│      Supabase              │
└────────────────────────────┘
```

### Target: Clean Architecture

```
┌─────────────────┐
│  AgencyHomePage │
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│ useAgencyDashboard (Hook)  │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ GetAgencyKPIs (Use Case)   │  ✅ Command/Query
│  - Validates input         │  ✅ Business logic
│  - Calls repository        │  ✅ Testable
│  - Returns DTO             │  ✅ DI
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ AgencyRepository (Port)    │  ✅ Interface
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ SupabaseAdapter (Adapter)  │  ✅ Pluggable
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│      Supabase              │
└────────────────────────────┘
```

---

## What's Already Good ✅

### 1. Backend API Layer
```javascript
// services/api/controllers/auth.controller.js
// ✅ Already uses Clean Architecture!
import { RegisterUser } from '@ethio-maids/app-identity';
import { SupabaseUserRepository } from '@ethio-maids/infra-identity';

const userRepository = new SupabaseUserRepository(supabase);
const registerUser = new RegisterUser({ userRepository });
const result = await registerUser.execute(command);
```

### 2. Domain Packages Exist
```
packages/domain/
├── identity/entities/User.js           ✅ Proper entity
├── profiles/entities/MaidProfile.js    ✅ Proper entity
└── jobs/entities/JobPosting.js         ✅ Proper entity
```

### 3. Application Packages Exist
```
packages/app/
├── identity/usecases/RegisterUser.js   ✅ Use case pattern
├── profiles/usecases/CreateMaid.js     ✅ Use case pattern
└── jobs/usecases/CreateJob.js          ✅ Use case pattern
```

### 4. SDK Package Setup
```
packages/sdk/
├── src/index.js              ✅ Created
├── src/schema.d.ts           ✅ TypeScript types
└── package.json              ✅ Scripts ready
```

### 5. Hook Pattern
```javascript
// src/hooks/useAgencyDashboard.js
// ✅ Good separation of concerns
// ⚠️  Just needs to call use-cases instead of services
```

---

## Refactoring Strategy

### Phase 1: Domain Layer (Week 1)

#### Create Domain Entities

**File:** `packages/domain/dashboard/entities/AgencyKPI.js`
```javascript
export class AgencyKPI {
  constructor({ activeMaids, jobsLive, newApplicants, interviews, hires }) {
    this.activeMaids = this._validateCount(activeMaids);
    this.jobsLive = this._validateCount(jobsLive);
    this.newApplicants = this._validateCount(newApplicants);
    this.interviews = this._validateCount(interviews);
    this.hires = this._validateCount(hires);
    this._calculatedAt = new Date();
  }

  _validateCount(value) {
    if (value < 0) throw new Error('KPI count cannot be negative');
    return value;
  }

  calculateConversionRate() {
    if (this.newApplicants === 0) return 0;
    return (this.hires / this.newApplicants) * 100;
  }

  isPerformingWell() {
    return this.hires >= 5 && this.calculateConversionRate() >= 10;
  }

  toDTO() {
    return {
      activeMaids: this.activeMaids,
      jobsLive: this.jobsLive,
      newApplicantsToday: this.newApplicants,
      interviewsScheduled: this.interviews,
      hiresThisMonth: this.hires,
      conversionRate: this.calculateConversionRate(),
      performanceStatus: this.isPerformingWell() ? 'good' : 'needs_improvement'
    };
  }
}
```

**File:** `packages/domain/dashboard/entities/AgencyAlert.js`
```javascript
export class AgencyAlert {
  constructor({ type, level, message, count, link }) {
    this.type = type;
    this.level = this._validateLevel(level);
    this.message = message;
    this.count = count || 1;
    this.link = link;
    this.createdAt = new Date();
  }

  _validateLevel(level) {
    const validLevels = ['info', 'warning', 'critical'];
    if (!validLevels.includes(level)) {
      throw new Error(`Invalid alert level: ${level}`);
    }
    return level;
  }

  isCritical() {
    return this.level === 'critical';
  }

  requiresImmediateAction() {
    return this.level === 'critical' && this.count > 0;
  }
}
```

### Phase 2: Application Layer (Week 1-2)

#### Create Use Cases

**File:** `packages/app/dashboard-agency/usecases/GetAgencyKPIs.js`
```javascript
import { AgencyKPI } from '@ethio-maids/domain-dashboard';

export class GetAgencyKPIs {
  constructor({ agencyRepository, auditLogger }) {
    if (!agencyRepository) throw new Error('agencyRepository is required');
    if (!auditLogger) throw new Error('auditLogger is required');

    this.agencyRepository = agencyRepository;
    this.auditLogger = auditLogger;
  }

  async execute(query) {
    // Validate
    if (!query.agencyId) {
      throw new ValidationError('agencyId is required');
    }

    // Fetch data via repository port
    const kpiData = await this.agencyRepository.getKPIs(query.agencyId);

    // Create domain entity
    const kpi = new AgencyKPI(kpiData);

    // Audit log
    await this.auditLogger.log({
      action: 'kpis_viewed',
      agencyId: query.agencyId,
      timestamp: new Date()
    });

    // Return DTO
    return kpi.toDTO();
  }
}
```

**File:** `packages/app/dashboard-agency/usecases/GetAgencyMaids.js`
```javascript
export class GetAgencyMaids {
  constructor({ maidRepository, auditLogger }) {
    this.maidRepository = maidRepository;
    this.auditLogger = auditLogger;
  }

  async execute(query) {
    const { agencyId, filters = {} } = query;

    // Validate
    if (!agencyId) throw new ValidationError('agencyId is required');

    // Fetch via repository
    const maids = await this.maidRepository.findByAgency(agencyId, filters);

    // Audit
    await this.auditLogger.log({
      action: 'maids_list_viewed',
      agencyId,
      filterCount: Object.keys(filters).length
    });

    // Return DTOs
    return maids.map(maid => maid.toDTO());
  }
}
```

#### Define Ports (Interfaces)

**File:** `packages/app/dashboard-agency/ports/AgencyDashboardRepository.js`
```javascript
/**
 * Port (Interface) for Agency Dashboard data access
 */
export class AgencyDashboardRepository {
  /**
   * Get KPIs for an agency
   * @param {string} agencyId
   * @returns {Promise<Object>} Raw KPI data
   */
  async getKPIs(agencyId) {
    throw new Error('getKPIs must be implemented by adapter');
  }

  /**
   * Get alerts for an agency
   * @param {string} agencyId
   * @returns {Promise<Array>} Raw alert data
   */
  async getAlerts(agencyId) {
    throw new Error('getAlerts must be implemented by adapter');
  }

  /**
   * Get pipeline funnel metrics
   * @param {string} agencyId
   * @param {number} dateRange - Days to look back
   * @returns {Promise<Object>} Pipeline data
   */
  async getPipelineFunnel(agencyId, dateRange) {
    throw new Error('getPipelineFunnel must be implemented by adapter');
  }
}
```

**File:** `packages/app/dashboard-agency/ports/MaidRepository.js`
```javascript
export class MaidRepository {
  async findByAgency(agencyId, filters = {}) {
    throw new Error('findByAgency must be implemented');
  }

  async findById(maidId) {
    throw new Error('findById must be implemented');
  }

  async create(maidData) {
    throw new Error('create must be implemented');
  }

  async update(maidId, updates) {
    throw new Error('update must be implemented');
  }

  async delete(maidId) {
    throw new Error('delete must be implemented');
  }
}
```

### Phase 3: Infrastructure Adapters (Week 2)

**File:** `packages/infra/dashboard-agency/adapters/SupabaseAgencyRepository.js`
```javascript
import { AgencyDashboardRepository } from '@ethio-maids/app-dashboard-agency';

export class SupabaseAgencyRepository extends AgencyDashboardRepository {
  constructor(supabase) {
    super();
    if (!supabase) throw new Error('Supabase client is required');
    this.supabase = supabase;
  }

  async getKPIs(agencyId) {
    // Fetch counts in parallel
    const results = await Promise.allSettled([
      this._getActiveMaidsCount(agencyId),
      this._getJobsLiveCount(agencyId),
      this._getNewApplicantsTodayCount(agencyId),
      this._getInterviewsScheduledCount(agencyId),
      this._getHiresThisMonthCount(agencyId)
    ]);

    // Return raw data (domain entity will be created in use-case)
    return {
      activeMaids: results[0].status === 'fulfilled' ? results[0].value : 0,
      jobsLive: results[1].status === 'fulfilled' ? results[1].value : 0,
      newApplicants: results[2].status === 'fulfilled' ? results[2].value : 0,
      interviews: results[3].status === 'fulfilled' ? results[3].value : 0,
      hires: results[4].status === 'fulfilled' ? results[4].value : 0
    };
  }

  async _getActiveMaidsCount(agencyId) {
    const { count } = await this.supabase
      .from('maid_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('availability_status', 'available');

    return count || 0;
  }

  // ... other private methods
}
```

### Phase 4: SDK Integration (Week 2-3)

**Update API Client:**
```javascript
// src/lib/sdk/apiClient.js (refactored)
import createClient from '@ethio-maids/sdk';

let apiClientInstance = null;

export function getApiClient(config) {
  if (!apiClientInstance) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const token = config?.token || null;

    // ✅ Use real SDK now
    apiClientInstance = createClient({ baseUrl, token });
  }

  return apiClientInstance;
}
```

**Complete OpenAPI Spec:**
```yaml
# services/api/openapi.yaml
paths:
  /agencies/{agencyId}/kpis:
    get:
      summary: Get Agency KPIs
      parameters:
        - name: agencyId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AgencyKPIs'
```

### Phase 5: Update Hooks (Week 3)

**Refactor Hook:**
```javascript
// src/hooks/useAgencyDashboard.js (refactored)
import { GetAgencyKPIs, GetAgencyAlerts } from '@ethio-maids/app-dashboard-agency';
import { SupabaseAgencyRepository } from '@ethio-maids/infra-dashboard-agency';
import { SupabaseAuditLogger } from '@ethio-maids/infra-common';
import { supabase } from '@/lib/databaseClient';

// Initialize dependencies (could use DI container)
const agencyRepository = new SupabaseAgencyRepository(supabase);
const auditLogger = new SupabaseAuditLogger(supabase);

export const useAgencyDashboard = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({});
  // ... state

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // ✅ Use use-cases now
      const getKPIs = new GetAgencyKPIs({ agencyRepository, auditLogger });
      const getAlerts = new GetAgencyAlerts({ agencyRepository, auditLogger });

      const [kpisData, alertsData] = await Promise.all([
        getKPIs.execute({ agencyId: user.id }),
        getAlerts.execute({ agencyId: user.id })
      ]);

      setKpis(kpisData);
      setAlerts(alertsData);
    } catch (err) {
      setError(err.message);
    }
  }, [user?.id]);

  // ... rest of hook
};
```

---

## Migration Steps

### Step 1: Create Domain Package
```bash
mkdir -p packages/domain/dashboard/entities
mkdir -p packages/domain/dashboard/value-objects
mkdir -p packages/domain/dashboard/events
mkdir -p packages/domain/dashboard/__tests__

# Create entities
touch packages/domain/dashboard/entities/AgencyKPI.js
touch packages/domain/dashboard/entities/AgencyAlert.js
touch packages/domain/dashboard/entities/PipelineMetric.js
touch packages/domain/dashboard/index.js
```

### Step 2: Create Application Package
```bash
mkdir -p packages/app/dashboard-agency/usecases
mkdir -p packages/app/dashboard-agency/ports
mkdir -p packages/app/dashboard-agency/validators
mkdir -p packages/app/dashboard-agency/__tests__

# Create use-cases
touch packages/app/dashboard-agency/usecases/GetAgencyKPIs.js
touch packages/app/dashboard-agency/usecases/GetAgencyAlerts.js
touch packages/app/dashboard-agency/usecases/GetAgencyMaids.js

# Create ports
touch packages/app/dashboard-agency/ports/AgencyDashboardRepository.js
touch packages/app/dashboard-agency/ports/MaidRepository.js
touch packages/app/dashboard-agency/ports/AuditLogger.js
```

### Step 3: Create Infrastructure Package
```bash
mkdir -p packages/infra/dashboard-agency/adapters
mkdir -p packages/infra/dashboard-agency/__tests__

# Create adapters
touch packages/infra/dashboard-agency/adapters/SupabaseAgencyRepository.js
touch packages/infra/dashboard-agency/adapters/SupabaseMaidRepository.js
touch packages/infra/dashboard-agency/adapters/SupabaseAuditLogger.js
```

### Step 4: Update Package.json Files
```json
// packages/domain/dashboard/package.json
{
  "name": "@ethio-maids/domain-dashboard",
  "version": "0.1.0",
  "main": "index.js",
  "dependencies": {}
}

// packages/app/dashboard-agency/package.json
{
  "name": "@ethio-maids/app-dashboard-agency",
  "version": "0.1.0",
  "main": "index.js",
  "dependencies": {
    "@ethio-maids/domain-dashboard": "workspace:*"
  }
}

// packages/infra/dashboard-agency/package.json
{
  "name": "@ethio-maids/infra-dashboard-agency",
  "version": "0.1.0",
  "main": "index.js",
  "dependencies": {
    "@ethio-maids/app-dashboard-agency": "workspace:*",
    "@supabase/supabase-js": "^2.x"
  }
}
```

### Step 5: Link Packages
```bash
# From project root
npm install
```

### Step 6: Implement & Test
1. Write domain entities with tests
2. Write use-cases with tests
3. Write adapters with integration tests
4. Update hooks to use new architecture
5. Run full test suite
6. Deploy with feature flag

---

## Testing Strategy

### Domain Layer Tests
```javascript
// packages/domain/dashboard/__tests__/AgencyKPI.test.js
import { AgencyKPI } from '../entities/AgencyKPI';

describe('AgencyKPI', () => {
  it('should calculate conversion rate correctly', () => {
    const kpi = new AgencyKPI({
      activeMaids: 10,
      jobsLive: 5,
      newApplicants: 20,
      interviews: 10,
      hires: 5
    });

    expect(kpi.calculateConversionRate()).toBe(25);
  });

  it('should identify good performance', () => {
    const kpi = new AgencyKPI({
      activeMaids: 10,
      jobsLive: 5,
      newApplicants: 20,
      interviews: 10,
      hires: 6
    });

    expect(kpi.isPerformingWell()).toBe(true);
  });

  it('should reject negative counts', () => {
    expect(() => {
      new AgencyKPI({ activeMaids: -5 });
    }).toThrow('KPI count cannot be negative');
  });
});
```

### Application Layer Tests
```javascript
// packages/app/dashboard-agency/__tests__/GetAgencyKPIs.test.js
import { GetAgencyKPIs } from '../usecases/GetAgencyKPIs';

describe('GetAgencyKPIs', () => {
  let mockRepository;
  let mockAuditLogger;
  let useCase;

  beforeEach(() => {
    mockRepository = {
      getKPIs: jest.fn()
    };
    mockAuditLogger = {
      log: jest.fn()
    };
    useCase = new GetAgencyKPIs({
      agencyRepository: mockRepository,
      auditLogger: mockAuditLogger
    });
  });

  it('should return KPI DTO', async () => {
    mockRepository.getKPIs.mockResolvedValue({
      activeMaids: 10,
      jobsLive: 5,
      newApplicants: 20,
      interviews: 10,
      hires: 5
    });

    const result = await useCase.execute({ agencyId: 'agency-1' });

    expect(result).toHaveProperty('activeMaids', 10);
    expect(result).toHaveProperty('conversionRate', 25);
    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'kpis_viewed' })
    );
  });

  it('should throw validation error for missing agencyId', async () => {
    await expect(
      useCase.execute({})
    ).rejects.toThrow('agencyId is required');
  });
});
```

### Infrastructure Tests
```javascript
// packages/infra/dashboard-agency/__tests__/SupabaseAgencyRepository.test.js
import { SupabaseAgencyRepository } from '../adapters/SupabaseAgencyRepository';

describe('SupabaseAgencyRepository', () => {
  let mockSupabase;
  let repository;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    repository = new SupabaseAgencyRepository(mockSupabase);
  });

  it('should fetch KPIs from database', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({ count: 10 })
    });

    const kpis = await repository.getKPIs('agency-1');

    expect(kpis).toHaveProperty('activeMaids');
    expect(mockSupabase.from).toHaveBeenCalledWith('maid_profiles');
  });

  it('should handle database errors gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('DB Error'))
    });

    const kpis = await repository.getKPIs('agency-1');

    // Should return fallback values, not throw
    expect(kpis.activeMaids).toBe(0);
  });
});
```

---

## Benefits After Refactoring

### 1. Testability ✅
```javascript
// BEFORE: Hard to test
static async getAgencyKPIs(agencyId) {
  const { count } = await supabase.from('maid_profiles')...
}

// AFTER: Easy to test with mocks
const mockRepo = { getKPIs: jest.fn() };
const useCase = new GetAgencyKPIs({ agencyRepository: mockRepo });
await useCase.execute({ agencyId: 'test' });
expect(mockRepo.getKPIs).toHaveBeenCalled();
```

### 2. Modularity ✅
```javascript
// Each layer is independent
packages/domain/dashboard      // Pure business logic
packages/app/dashboard-agency  // Use-cases, no dependencies
packages/infra/dashboard       // Supabase adapter (pluggable)
```

### 3. Type Safety ✅
```javascript
// SDK provides TypeScript types
const { data } = await client.GET('/agencies/{id}/kpis', {
  params: { path: { id: agencyId } }
});
// `data` is fully typed from OpenAPI spec
```

### 4. Flexibility ✅
```javascript
// Easy to swap database
const repository = usePostgres
  ? new PostgresRepository()
  : new SupabaseRepository();

// Easy to add caching
const cachedRepo = new CachedRepository(repository);

// Easy to add logging
const loggedRepo = new LoggingDecorator(repository);
```

### 5. Clean Dependencies ✅
```
Domain ← Application ← Infrastructure
  ↑         ↑              ↑
Pure     Ports         Adapters
```

---

## Success Metrics

### Code Quality
- [ ] Domain layer: 100% pure (no framework deps)
- [ ] Application layer: 100% ports (no concrete adapters)
- [ ] Test coverage: ≥80%
- [ ] Cyclomatic complexity: <10 per method

### Architecture
- [ ] All services converted to use-cases
- [ ] All Supabase calls in adapters
- [ ] SDK used for all API calls
- [ ] Dependency injection throughout

### Performance
- [ ] No performance regression
- [ ] Response times <200ms (same as before)
- [ ] Bundle size: ~15KB reduction (removed service classes)

---

## Timeline Summary

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | Domain + App Layers | Entities, Use-cases, Ports |
| **Week 2** | Infrastructure | Adapters, SDK Integration |
| **Week 3** | Refactor Services | Update hooks, components |
| **Week 4** | Testing & Deploy | Full test suite, feature flags |

---

## Next Steps

1. ✅ **Approved Plan** - This analysis
2. ⏳ **Create Domain Entities** - AgencyKPI, Alert, Metric
3. ⏳ **Implement First Use Case** - GetAgencyKPIs
4. ⏳ **Create Adapter** - SupabaseAgencyRepository
5. ⏳ **Update Hook** - useAgencyDashboard to use use-case
6. ⏳ **Test** - Verify pattern works
7. ⏳ **Scale** - Apply to all dashboard features

---

**Conclusion:** The Agency Dashboard is production-ready functionally but needs architectural refactoring to meet the modular design standards. The refactoring will improve testability, modularity, and maintainability while preserving all existing functionality.
