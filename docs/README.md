# Ethiopian Maids Platform - Documentation

Welcome to the Ethiopian Maids Platform documentation!

## 📚 Documentation Index

### Getting Started

1. **[INVENTORY.md](./INVENTORY.md)** - Complete codebase audit
   - Stack detection & structure
   - Feature mapping (10 major domains)
   - Database schema (59+ tables)
   - i18n & RTL audit
   - Technical debt assessment

2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
   - Domain-Driven Design (DDD)
   - Clean Architecture (Hexagonal)
   - CQRS pattern
   - Module organization
   - Testing strategy
   - Security & compliance

3. **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration instructions
   - 8-week migration plan
   - Phase-by-phase guide
   - Codemods for automation
   - Breaking changes
   - Rollback plan

### Quick Links

- [OpenAPI Specification](../services/api/openapi.yaml) - API contract
- [Translation Catalogs](../packages/i18n/locales/) - en.json, ar.json
- [Design System](../packages/ui/) - Reusable UI components

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥18
- npm ≥9
- PostgreSQL (via Supabase)
- Git

### Installation

```bash
# Clone repository
git clone <repo-url>
cd ethiopian-maids

# Install dependencies (npm workspaces)
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Development Commands

```bash
# Frontend development
npm run dev --workspace=@ethio-maids/web

# API development
npm run dev --workspace=@ethio-maids/api

# Run all tests
npm test

# Generate SDK from OpenAPI
npm run generate --workspace=@ethio-maids/sdk

# Check i18n completeness
npm run check --workspace=@ethio-maids/i18n

# Lint code
npm run lint

# Build for production
npm run build
```

---

## 🏗️ Project Structure

```
ethiopian-maids/
├── apps/
│   └── web/                    # PWA frontend (React + Vite)
│
├── services/
│   ├── api/                    # HTTP API handlers
│   └── workers/                # Background jobs
│
├── packages/
│   ├── domain/                 # Pure business logic (11 contexts)
│   ├── app/                    # Use-cases & ports (13 features)
│   ├── ui/                     # Design system
│   ├── i18n/                   # Translations (en, ar)
│   ├── sdk/                    # Generated API client
│   └── utils/                  # Shared utilities
│
├── database/                   # SQL migrations
├── scripts/                    # Build & deployment
└── docs/                       # Documentation (you are here)
```

---

## 🎯 Architecture Overview

### Layers

```
┌─────────────────────────────────────┐
│   Presentation Layer (React)        │  apps/web
├─────────────────────────────────────┤
│   API Layer (Express)               │  services/api
├─────────────────────────────────────┤
│   Application Layer (Use-Cases)     │  packages/app/*
├─────────────────────────────────────┤
│   Domain Layer (Entities)           │  packages/domain/*
├─────────────────────────────────────┤
│   Infrastructure (Adapters)         │  (To be created)
└─────────────────────────────────────┘
```

### Key Principles

- **Domain-Driven Design**: Business logic in pure entities
- **Ports & Adapters**: Decoupled from infrastructure
- **CQRS**: Separate read and write models
- **Event-Driven**: Domain events for loose coupling
- **OpenAPI-First**: API contract drives development

---

## 🌍 Internationalization

### Supported Locales

- **English (en)**: Default, left-to-right (LTR)
- **Arabic (ar)**: Right-to-left (RTL)

**Note**: Only English and Arabic are supported. Previous support for Amharic, Filipino, Indonesian, and Sinhala has been removed per business requirements.

### Usage

```javascript
import { t } from '@ethio-maids/i18n';

// Get translation
const title = t('en', 'identity.register.title'); // "Create Account"
const titleAr = t('ar', 'identity.register.title'); // "إنشاء حساب"

// With parameters
const message = t('en', 'dashboard.welcome', { name: 'Ahmed' });
// "Welcome, Ahmed!"
```

### RTL Support

All components use logical properties for RTL compatibility:

```javascript
import { useRTL } from '@ethio-maids/ui';

const { isRTL, dir, marginStart } = useRTL(locale);

<div dir={dir} style={marginStart('16px')}>
  {/* Content adapts to RTL */}
</div>
```

---

## 🔐 Security

### Authentication

- **Provider**: Supabase Auth
- **Token Type**: JWT
- **Session Duration**: 1 hour (access), 30 days (refresh)

### Authorization

- **Model**: Role-Based Access Control (RBAC)
- **Roles**: `maid`, `sponsor`, `agency`, `admin`
- **Enforcement**: Use-case layer + Row-Level Security (RLS)

### Compliance

- **KYC**: Sponsor identity verification
- **KYB**: Agency business verification
- **Audit Logs**: All sensitive operations logged
- **PII Protection**: Encryption at rest, access logging

---

## 🧪 Testing

### Test Pyramid

```
      /\
     /E2E\       5% - End-to-End (Playwright)
    /------\
   /Integr.\ 15% - Integration (Vitest)
  /----------\
 /   Unit     \ 80% - Unit (Vitest)
/--------------\
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Coverage Goals

- Domain layer: **100%**
- Application layer: **≥90%**
- Infrastructure: **≥80%**
- Presentation: **≥70%**
- **Overall: ≥80%**

---

## 📦 Modules

### Identity
- User authentication & authorization
- Role management
- Email/phone verification

### Profiles
- Maid profiles (skills, experience, documents)
- Sponsor profiles (preferences, KYC)
- Agency profiles (roster, KYB)

### Jobs
- Job postings
- Applications
- Matching & filtering

### Subscriptions
- Subscription plans (Pro, Premium)
- Stripe integration
- Invoicing

### Media
- File uploads (images, documents, videos)
- Supabase Storage
- Image processing

### Communications
- Email notifications
- SMS verification
- Real-time chat (Socket.io)

### Compliance
- KYC/KYB workflows
- Document verification
- Audit trails

### Search
- Advanced filtering
- Faceted search
- Saved searches

### Dashboard
- Role-based widgets
- Analytics
- Real-time updates

### Admin
- User management
- Content moderation
- System configuration

### Analytics
- Event tracking
- Predictive analytics
- Reporting

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
# Production build
npm run build --workspace=@ethio-maids/web

# Deploy to Vercel
vercel --prod
```

### API (Node.js)

```bash
# Start production server
npm start --workspace=@ethio-maids/api
```

### Database (Supabase)

```bash
# Run migrations
npm run migrate

# Check schema
npm run schema:check
```

---

## 📊 Monitoring

### Health Checks

- **Frontend**: `https://app.ethiomaids.com/`
- **API**: `https://api.ethiomaids.com/health`
- **Database**: Supabase dashboard

### Logs

- **Application**: Structured logs to stdout
- **Errors**: Centralized error tracking (Sentry)
- **Audit**: Security events in `audit_logs` table

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Code style guide
- Branch naming conventions
- Commit message format
- Pull request template
- Code review checklist

---

## 📝 License

Proprietary - All rights reserved

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/ethiopian-maids/issues)
- **Email**: support@ethiomaids.com
- **Slack**: #ethiopian-maids (internal)

---

## 📚 Additional Resources

### External Documentation

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe API](https://stripe.com/docs/api)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs)

### Architecture References

- [Domain-Driven Design](https://domainlanguage.com/ddd/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [CQRS](https://martinfowler.com/bliki/CQRS.html)

---

**Last Updated**: 2025-10-21
**Version**: 2.0.0
