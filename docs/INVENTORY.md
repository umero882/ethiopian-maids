# Ethiopian Maids Platform - Codebase Inventory (Phase 0)

**Generated:** 2025-10-21
**Purpose:** Complete auto-inventory of the codebase before modular refactor

---

## 1. Stack & Structure Detection

### Framework & Language
- **Framework:** React 18.2.0 with Vite 7.1.5
- **Language:** JavaScript (ES Modules) - No TypeScript currently
- **Package Manager:** npm
- **Monorepo Tool:** None (single package)
- **Build Tool:** Vite with React plugin
- **Styling:** TailwindCSS 3.3.3 + CSS custom properties (design tokens)
- **Testing:**
  - Unit: Vitest 3.2.4 + Jest 29.7.0
  - E2E: Playwright 1.55.0
  - Coverage: Vitest coverage, vitest-axe for a11y

### Project Type
- Multi-page application (MPA) with React Router 6.16.0
- PWA-ready (service worker registration present)
- SSR: No (client-side only)

### Top-Level Structure
```
ethiopian-maids/
├── database/              # SQL migrations, DB scripts
├── docs/                  # Documentation (this file)
├── scripts/               # Build, deployment, validation scripts
├── server/                # Standalone Express backend (Twilio/Email)
├── src/                   # Main React application
│   ├── __tests__/         # Integration tests
│   ├── archive/           # Legacy/debug components
│   ├── components/        # UI components (organized by domain)
│   ├── config/            # App configuration
│   ├── contexts/          # React Context providers
│   ├── data/              # Mock/static data
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities, clients, middleware
│   ├── pages/             # Route components
│   ├── scripts/           # Frontend scripts
│   ├── services/          # Business logic services
│   ├── styles/            # Global CSS, design tokens
│   ├── test/              # Test utilities
│   └── utils/             # Helper functions
└── supabase/              # Edge functions (not present yet)
```

---

## 2. Feature Surfaces Detected

### Core Features

#### **Identity & Authentication**
- **Location:** `src/contexts/AuthContext.jsx`, `src/services/authService.js` (missing), `src/lib/secureAuth.js`
- **Capabilities:**
  - Email/password auth via Supabase Auth
  - Phone verification (Twilio integration planned)
  - Session management with `SessionContext.jsx`
  - Multi-role support: `maid`, `sponsor`, `agency`, `admin`
  - Profile completion flow enforcement
  - Protected routes via `ProtectedRoute.jsx`
- **Missing:**
  - No `authService.js` found (logic embedded in context)
  - 2FA implementation (table exists: `two_factor_backup_codes`)

#### **Maid Profiles**
- **Location:** `src/pages/dashboards/maid/`, `src/services/maidService.js`, `src/components/maids/`
- **Capabilities:**
  - Profile CRUD with completion tracking
  - Skills, languages, experience tracking
  - Document uploads (passport, medical, police clearance)
  - Video introductions (`maid_videos` table)
  - Image galleries with primary image support
  - Availability calendar (`maid_availability` table)
  - Work experience history
- **Dashboard Routes:**
  - `/dashboard/maid/profile` - Profile management
  - `/dashboard/maid/bookings` - Booking requests
  - `/dashboard/maid/documents` - Document uploads
  - `/dashboard/maid/availability` - Calendar management
  - `/dashboard/maid/subscriptions` - Subscription/billing

#### **Sponsor Profiles**
- **Location:** `src/pages/dashboards/sponsor/`, `src/services/sponsorService.js`
- **Capabilities:**
  - Profile with KYC verification
  - Job posting and management
  - Maid search with advanced filters
  - Favorites/saved maids
  - Booking/application management
  - Document verification (`sponsor_document_verification` table)
- **Dashboard Routes:**
  - `/dashboard/sponsor` - Overview
  - `/dashboard/sponsor/profile` - Profile settings
  - `/dashboard/sponsor/favorites` - Saved maids
  - `/dashboard/sponsor/bookings` - Active bookings
  - `/dashboard/sponsor/jobs` - Job postings
  - `/dashboard/sponsor/subscriptions` - Plan management

#### **Agency Profiles**
- **Location:** `src/pages/dashboards/AgencyDashboard.jsx`, `src/services/agencyService.js`
- **Capabilities:**
  - Multi-maid roster management
  - KYB verification system (`agency_kyb_verification`, `agency_kyb_documents`)
  - Agency-level analytics
  - Compliance audit trails (`agency_kyb_audit_log`)
  - Placement tracking
- **Dashboard:** Single-page currently, needs expansion

#### **Jobs (Postings, Matches, Applications)**
- **Location:** `src/services/jobService.js`, `src/components/jobs/`, DB: `jobs`, `applications`
- **Capabilities:**
  - Job posting creation (sponsors/agencies)
  - Application submissions (maids)
  - Interest tracking (`applications` table)
  - Job views tracking (`job_views`)
  - Search and filtering
- **Tables:**
  - `jobs` - Job postings
  - `applications` - Maid applications
  - `favorites` - Saved jobs/maids
  - `job_views` - Analytics

#### **Subscriptions & Billing**
- **Location:** `src/services/subscriptionService.js`, `src/services/stripeBillingService.js`
- **Stripe Integration:**
  - Price IDs for Maid/Sponsor/Agency tiers (Pro/Premium)
  - Monthly + Annual billing
  - Webhook handling (`stripeWebhookHandler.js`)
  - Payment methods (`payment_methods` table)
  - Invoice history (`InvoiceHistory.jsx` component)
  - Idempotency system (`payment_idempotency` table)
- **Tables:**
  - `subscriptions` - Active subscriptions
  - `payment_methods` - Saved payment methods
  - `payment_idempotency` - Prevent duplicate charges
  - `credit_transactions` - Credit history (legacy, not used)
  - `webhook_event_logs` - Stripe event audit trail
- **Pricing Model:** Subscription-based (no pay-per-contact credits)
- **Currency:** AED (dirham) - GCC-focused

#### **Media Management**
- **Location:** `src/services/mediaService.js`, `src/components/ImageGalleryManager.jsx`
- **Storage:** Supabase Storage
- **Capabilities:**
  - Image upload with compression (`browser-image-compression`)
  - Multi-image galleries for maids
  - Primary image designation
  - Video uploads (`maid_videos` table)
  - Processed images tracking (`processed_images` table)
  - Secure file upload with validation (`lib/secureFileUpload.js`)
- **Buckets:** (inferred) `profile-images`, `documents`, `videos`

#### **Communications**
- **Location:** `src/services/notificationService.js`, `server/` (Twilio/Email)
- **Channels:**
  - Email: Nodemailer (SendGrid/Gmail/AWS SES)
  - SMS: Twilio (phone verification)
  - WhatsApp: Planned (Twilio integration stubs)
  - In-app: Real-time notifications (`notifications` table)
  - Chat: Socket.io (`ChatContext.jsx`, `src/components/chat/`)
- **Tables:**
  - `notifications` - In-app notifications
  - `messages` - Chat messages
  - `phone_verification_log` / `phone_verifications` - SMS verification
- **Backend Server:** Express server (`server/index.js`) on port 3001

#### **Compliance (KYC/KYB, Docs, Audit)**
- **KYC (Sponsors):**
  - `sponsor_document_verification` table
  - ID verification, proof of address
- **KYB (Agencies):**
  - `agency_kyb_verification` table
  - Business registration, licenses
  - Document uploads (`agency_kyb_documents`)
  - Audit logs (`agency_kyb_audit_log`)
- **Audit Trails:**
  - `audit_logs` - General audit log
  - `security_audit_log` - Security events
  - `pii_access_log` - PII access tracking
  - `activity_log` - User activity
- **Encryption:** PII encryption utilities in `lib/encryption.js`

#### **Search & Filters**
- **Location:** `src/components/maids/MaidFilters.jsx`, `src/hooks/useSearch.js`
- **Capabilities:**
  - Maid search with multiple criteria
  - Faceted filtering (nationality, experience, salary, skills)
  - Location-based search
  - Saved searches (`search_history` table)
- **No dedicated search service** - logic embedded in `maidService.js`

#### **Dashboards (Role-Based Widgets)**
- **Layouts:**
  - `DashboardLayout.jsx` - Generic wrapper
  - `MaidDashboardLayout.jsx` - Maid-specific
  - `SponsorDashboardLayout.jsx` - Sponsor-specific
  - `AgencyDashboardLayout.jsx` - Agency-specific
- **Widgets/Panels:**
  - `MaidOverview.jsx` - Stats, pending actions
  - `TasksSLAPanel.jsx` - SLA tracking
  - `AlertsPanel.jsx` - Warnings/notifications
  - `SubscriptionManagement.jsx` - Plan status
  - `BillingOverview.jsx` - Payment summary
- **Real-time:** `useDashboardRealtime.js` hook for live updates

#### **Admin Panel**
- **Location:** `src/pages/admin/`, `src/components/admin/`
- **Auth:** Separate `AdminAuthContext.jsx`, `AdminProtectedRoute.jsx`
- **Pages:**
  - `AdminDashboard.jsx` - Overview
  - `AdminAnalyticsPage.jsx` - Platform analytics
  - `AdminUsersPage.dev.jsx` - User management
  - `AdminMaidsPage.dev.jsx` - Maid moderation
  - `AdminAgenciesPage.dev.jsx` - Agency oversight
  - `AdminFinancial*Page.dev.jsx` - Billing, disputes, payouts
  - `AdminContent*Page.dev.jsx` - Content moderation
  - `PerformanceMonitor.jsx` - System health
  - `ConfigurationDashboard.jsx` - Settings
- **Tables:**
  - `admin_users` - Admin accounts
  - `admin_activity_logs` - Admin actions
  - `system_settings` - Platform config
  - `content_moderation_flags` - Flagged content
  - `security_events` - Security alerts
  - `support_tickets`, `support_messages` - Support system
- **Login:** `/admin/login` (separate from main auth)

#### **Analytics & Events**
- **Location:** `src/services/analyticsService.js`, `src/components/analytics/`
- **Capabilities:**
  - Profile views (`profile_views` table)
  - Job views tracking
  - Predictive analytics dashboard (`PredictiveAnalyticsDashboard.jsx`)
  - Performance monitoring (`PerformanceMonitor.jsx`)
  - Charts: Time-to-hire, pipeline funnel
- **External:** Google Analytics (optional, `VITE_GOOGLE_ANALYTICS_ID`)

#### **Common/Shared Components**
- **Location:** `src/components/common/`, `src/components/ui/`
- **Design System:**
  - Radix UI primitives (Dialog, Dropdown, Select, Tabs, Toast, etc.)
  - Custom components: Button, Input, Card, Badge, Avatar
  - Form components with validation
  - Error boundaries (`ErrorBoundary.jsx`, `AsyncErrorBoundary.jsx`)
  - Loading states (`LoadingStates.jsx`)
  - Icons: Lucide React
- **Accessibility:**
  - `AccessibilityContext.jsx` - A11y settings
  - `SkipNavigation.jsx` - Skip links
  - `ScreenReaderAnnouncements.jsx` - Live regions
  - `vitest-axe` for automated checks
- **Utilities:**
  - `use-toast.js` - Toast notifications (Radix)
  - `use-debounce` - Debounced inputs
  - `react-error-boundary` - Error handling

---

## 3. Integrations & External Services

### Database: Supabase (PostgreSQL)
- **Client:** `@supabase/supabase-js` v2.58.0
- **Location:** `src/lib/supabaseClient.js`, `src/lib/databaseClient.js`
- **Auth:** Built-in Supabase Auth
- **Storage:** Supabase Storage for files
- **Real-time:** `realtimeService.js` for live subscriptions
- **RLS:** Row-Level Security policies in migrations

### Payment: Stripe
- **Client:** `@stripe/stripe-js` v8.0.0, `@stripe/react-stripe-js` v5.2.0
- **Location:** `src/lib/stripe.js`, `src/config/stripeConfig.js`
- **Features:**
  - Subscriptions (monthly/annual)
  - Payment methods
  - Webhook handling
  - Invoicing
- **Edge Functions:** Planned for webhooks (Supabase Edge)
- **Env Vars:**
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY` (server-side)
  - `STRIPE_WEBHOOK_SECRET`
  - Price IDs for all tiers

### SMS/Voice: Twilio
- **Client:** `twilio` v5.10.2
- **Location:** `server/` backend, `src/services/twilioService.js`
- **Features:**
  - Phone verification
  - SMS notifications
  - (Planned) Voice calls
- **Env Vars:**
  - `VITE_TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN` (server-side)
  - `VITE_TWILIO_PHONE_NUMBER`

### Email: Multi-Provider
- **Client:** Nodemailer v7.0.9 (in server)
- **Providers:**
  - SendGrid (production)
  - Gmail (dev/test)
  - AWS SES (high volume)
- **Location:** `server/emailService.js`
- **Env Vars:**
  - `EMAIL_SERVICE`, `EMAIL_FROM`
  - `SENDGRID_API_KEY`
  - `EMAIL_USER`, `EMAIL_PASSWORD` (Gmail)

### Voice AI: ElevenLabs (planned)
- **Location:** `src/hooks/useElevenLabsVoice.js`, `src/services/aiSupportService.js`
- **Env Vars:**
  - `VITE_ELEVENLABS_AGENT_ID`
  - `ELEVENLABS_API_KEY` (server-side)
- **Status:** Stubs present, not fully implemented

### Storage: Supabase Storage
- **Buckets:** `profile-images`, `documents`, `videos` (inferred)
- **Location:** `src/services/storageService.js`, `src/services/mediaService.js`
- **Features:**
  - Signed URLs
  - Public/private buckets
  - File validation

### Chat: Socket.io
- **Client:** `socket.io-client` v4.7.4
- **Server:** `socket.io` v4.7.4 (in `server/`)
- **Location:** `src/contexts/ChatContext.jsx`, `src/components/chat/`
- **Features:**
  - Real-time messaging
  - Online indicators
  - Video calls (planned - `VideoCall.jsx` stub)

### AI/Translation: (planned)
- **Location:** `src/services/aiTranslationService.js`, `src/services/aiService.js`
- **Status:** Stubs present, no active API integration

---

## 4. Database Schema Summary

### Core Tables (59+ tables identified)

#### User Management
- `profiles` - Base user profiles (extends auth.users)
- `maid_profiles` - Maid-specific data
- `sponsor_profiles` - Sponsor-specific data
- `agency_profiles` - Agency-specific data
- `admin_users` - Admin accounts

#### Jobs & Applications
- `jobs` - Job postings
- `applications` - Job applications
- `favorites` - Saved jobs/maids
- `bookings` - Booking requests
- `job_views` - Analytics
- `profile_views` - Profile views

#### Payments & Subscriptions
- `subscriptions` - Active subscriptions
- `payment_methods` - Stored payment methods
- `payment_idempotency` - Duplicate prevention
- `credit_transactions` - Legacy credit system
- `contact_fees` - Per-contact fees (legacy)
- `webhook_event_logs` - Stripe event log
- `user_credits` - Credit balances (not used)

#### Documents & Media
- `maid_images` - Profile images
- `maid_videos` - Video introductions
- `maid_documents` - Uploaded documents
- `processed_images` - Image processing log
- `sponsor_document_verification` - KYC docs
- `agency_kyb_documents` - KYB docs

#### Communications
- `messages` - Chat messages
- `notifications` - In-app notifications
- `phone_verifications` - SMS verification
- `phone_verification_log` - SMS audit trail

#### Compliance & Audit
- `agency_kyb_verification` - KYB status
- `agency_kyb_audit_log` - KYB audit trail
- `audit_logs` - General audit log
- `security_audit_log` - Security events
- `pii_access_log` - PII access tracking
- `activity_log` - User activity
- `two_factor_backup_codes` - 2FA recovery

#### Reference Data
- `countries` - Countries list
- `country_codes` - Phone codes
- `skills` - Skills taxonomy
- `work_experience` - Experience records

#### Admin & Support
- `admin_activity_logs` - Admin actions
- `system_settings` - Platform config
- `content_moderation_flags` - Flagged content
- `security_events` - Security alerts
- `support_tickets` - Support requests
- `support_messages` - Support chat
- `support_interactions` - Support history
- `support_agents` - Support team

#### Misc
- `reviews` - User reviews
- `search_history` - Saved searches
- `maid_availability` - Calendar availability
- `user_settings` - User preferences
- `maintenance_log` - System maintenance
- `query_optimization_hints` - DB performance

### Migration Files
- **Location:** `database/migrations/`
- **Count:** 50+ migration files
- **Status:** Many duplicates and "fix" migrations indicate schema churn
- **Notable:**
  - `001_core_schema.sql` - Foundation
  - `002_security_policies.sql` - RLS policies
  - `018_enhanced_security.sql` - Security hardening
  - `025_payment_idempotency_system.sql` - Payment safety
  - `026_agency_kyb_verification.sql` - Agency compliance

---

## 5. API Endpoints & Routes

### Frontend Routes (React Router)

#### Public
- `/` - Home
- `/login` - Login
- `/register` - Registration
- `/forgot-password` - Password reset
- `/reset-password` - Password reset confirmation
- `/verify-email` - Email verification
- `/pricing` - Pricing page
- `/maids` - Maid listings
- `/jobs` - Job listings
- `/jobs/:id` - Job details

#### Maid Dashboard (`/dashboard/maid/*`)
- `/` - Overview
- `/profile` - Profile management
- `/bookings` - Booking requests
- `/documents` - Document uploads
- `/availability` - Calendar
- `/subscriptions` - Billing
- `/notifications` - Notifications
- `/settings` - Settings

#### Sponsor Dashboard (`/dashboard/sponsor/*`)
- `/` - Overview
- `/profile` - Profile settings
- `/favorites` - Saved maids
- `/bookings` - Bookings
- `/jobs` - Job postings
- `/jobs/new` - Create job
- `/jobs/:id` - Job details
- `/jobs/:id/edit` - Edit job
- `/jobs/:id/applications/:appId` - Application review
- `/subscriptions` - Billing
- `/settings` - Settings
- `/payment-settings` - Payment methods
- `/invoices` - Invoice history
- `/feedback` - Feedback

#### Agency Dashboard (`/dashboard/agency/*`)
- `/` - Overview (single page currently)

#### Admin Panel (`/admin/*`)
- `/login` - Admin login
- `/` - Dashboard
- `/users` - User management
- `/maids` - Maid oversight
- `/agencies` - Agency oversight
- `/analytics` - Analytics
- `/financial/transactions` - Transactions
- `/financial/subscriptions` - Subscriptions
- `/financial/payouts` - Payouts
- `/financial/disputes` - Disputes
- `/content/profiles` - Profile moderation
- `/content/listings` - Listing moderation
- `/content/media` - Media moderation
- `/content/reviews` - Review moderation

#### Utility
- `/dashboard` - Role-based gateway (redirects)
- `/complete-profile` - Profile completion flow
- `/chat` - Chat interface
- `/notifications` - Notifications center
- `/test-env` - Environment test page

### Backend API (Express Server on :3001)
- **Base URL:** `http://localhost:3001/api`
- **Endpoints:** (inferred from services, not explicitly defined)
  - `/sms/send` - Send SMS via Twilio
  - `/sms/verify` - Verify SMS code
  - `/email/send` - Send email
  - *Note:* Most logic is in Supabase Edge Functions or client-side services

### Supabase Edge Functions (Planned)
- **Not yet present** - Migrations reference them but `/supabase/functions/` does not exist
- **Planned:**
  - Stripe webhooks
  - SMS/Email dispatch
  - AI/Translation proxies

---

## 6. Environment Variables (47 variables)

### Public (Frontend - `VITE_` prefix)
#### Supabase
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

#### App Config
- `VITE_APP_ENVIRONMENT`
- `VITE_APP_NAME`
- `VITE_APP_VERSION`
- `VITE_APP_URL`
- `VITE_USE_LOCAL_DATABASE`
- `VITE_ENABLE_MOCK_DATA`

#### Feature Flags
- `VITE_ENABLE_CHAT`
- `VITE_ENABLE_VIDEO_CALLS`
- `VITE_ENABLE_ANALYTICS`
- `VITE_ENABLE_DEBUG_MODE`

#### Stripe
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_MAID_PRO_MONTHLY`
- `VITE_STRIPE_MAID_PRO_ANNUAL`
- `VITE_STRIPE_MAID_PREMIUM_MONTHLY`
- `VITE_STRIPE_MAID_PREMIUM_ANNUAL`
- `VITE_STRIPE_SPONSOR_PRO_MONTHLY`
- `VITE_STRIPE_SPONSOR_PRO_ANNUAL`
- `VITE_STRIPE_SPONSOR_PREMIUM_MONTHLY`
- `VITE_STRIPE_SPONSOR_PREMIUM_ANNUAL`
- `VITE_STRIPE_AGENCY_PRO_MONTHLY`
- `VITE_STRIPE_AGENCY_PRO_ANNUAL`
- `VITE_STRIPE_AGENCY_PREMIUM_MONTHLY`
- `VITE_STRIPE_AGENCY_PREMIUM_ANNUAL`

#### Twilio
- `VITE_TWILIO_ACCOUNT_SID`
- `VITE_TWILIO_PHONE_NUMBER`

#### ElevenLabs
- `VITE_ELEVENLABS_AGENT_ID`

#### API
- `VITE_API_URL`
- `VITE_API_TIMEOUT`
- `VITE_MAX_FILE_SIZE`
- `VITE_CHAT_SERVER_URL`
- `VITE_CHAT_ENABLED`

#### Analytics
- `VITE_GOOGLE_ANALYTICS_ID`

### Private (Server-Side - NO `VITE_` prefix)
#### Supabase
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`

#### Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

#### Twilio
- `TWILIO_AUTH_TOKEN`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`

#### ElevenLabs
- `ELEVENLABS_API_KEY`

#### Email
- `EMAIL_SERVICE`
- `EMAIL_FROM`
- `SENDGRID_API_KEY`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

#### Server
- `NODE_ENV`
- `PORT`

---

## 7. i18n & RTL Audit

### Current i18n Implementation

#### **LocalizationContext Exists**
- **File:** `src/contexts/LocalizationContext.jsx`
- **Status:** Fully implemented but **no translation files**
- **Supported Locales Defined:**
  - `en` - English (LTR)
  - `ar` - Arabic (RTL) ✅
  - `am` - Amharic (LTR) ⚠️ **Must remove per requirements**
  - `tl` - Filipino (LTR) ⚠️ **Must remove**
  - `id` - Indonesian (LTR) ⚠️ **Must remove**
  - `si` - Sinhala (LTR) ⚠️ **Must remove**

#### **Translation Files**
- **Location:** Should be in `src/locales/` but **directory does not exist**
- **Expected:** `en.json`, `ar.json`
- **Status:** **Missing - all strings are hard-coded**

#### **Translation Function**
- `t(key, params)` - Implemented with nested key support
- `tp(key, count, params)` - Pluralization support
- Interpolation: `{{variable}}` syntax
- Fallback: English if key missing

#### **RTL Support**
- **Document Direction:** Automatically set via `document.documentElement.dir`
- **CSS Classes:** `useRTL()` hook provides RTL-aware classes
- **Utilities:**
  - `marginStart`, `marginEnd`
  - `paddingStart`, `paddingEnd`
  - `start`, `end` (logical properties)
  - `flipClass(baseClass)` helper

### Hard-Coded String Audit

#### **Critical Areas with Hard-Coded Strings:**
1. **All page components** (`src/pages/**`) - Titles, labels, buttons
2. **All UI components** (`src/components/**`) - Form labels, error messages
3. **Service error messages** (`src/services/**`) - User-facing errors
4. **Validation messages** (`src/lib/validationSchemas.js`) - Form validation
5. **Toast notifications** - Success/error messages
6. **Dashboard widgets** - Stats labels, headings
7. **Admin panel** - All UI text

#### **Estimated Hard-Coded Strings:** 2,000+

### RTL Issues Detected

#### **Potential Problems:**
1. **Tailwind Classes:** Left/right margins/padding used instead of logical properties
   - Example: `ml-4`, `mr-2` instead of `ms-4`, `me-2`
2. **Icon Positioning:** Icons positioned with absolute left/right
3. **Flex/Grid Direction:** May need `flex-row-reverse` in RTL
4. **Number Formatting:** Already locale-aware via `Intl.NumberFormat` ✅
5. **Date Formatting:** Already locale-aware via `Intl.DateTimeFormat` ✅
6. **Form Layouts:** Labels may need RTL-specific alignment

#### **RTL Test Coverage:** None
- **No RTL snapshots** - `dir="rtl"` tests missing
- **No visual regression tests** for RTL layouts

---

## 8. Code Quality & Patterns

### Current Architecture

#### **Service Layer**
- **Pattern:** Thin services that call Supabase directly
- **Location:** `src/services/` (47 service files)
- **Issues:**
  - Business logic mixed with data access
  - No clear domain boundaries
  - Services call other services (tight coupling)
  - No dependency injection
  - Direct Supabase client usage everywhere

#### **State Management**
- **Pattern:** React Context API
- **Contexts:** 15+ contexts (Auth, Chat, Subscription, Profile, etc.)
- **Issues:**
  - Context overlap (multiple auth contexts)
  - No clear state ownership
  - Prop drilling for nested components
  - No state persistence strategy

#### **Component Organization**
- **Pattern:** Feature-based folders
- **Structure:** Mixed (some domain folders, some by type)
- **Issues:**
  - Inconsistent organization
  - Large components (500+ LOC)
  - Business logic in components
  - No headless component pattern

#### **Error Handling**
- **Pattern:** Error boundaries + centralized handler
- **Implementation:**
  - `ErrorBoundary.jsx` for React errors
  - `centralizedErrorHandler.js` for service errors
  - Multiple error boundary variants
- **Issues:**
  - Inconsistent error handling across services
  - User-facing error messages not localized

#### **Testing**
- **Unit Test Coverage:** Low (mostly services)
- **Integration Tests:** Few (`src/__tests__/integration/`)
- **E2E Tests:** Playwright configured, minimal tests
- **Missing:**
  - Component tests
  - Hook tests
  - Context tests
  - RTL tests

### Dependencies

#### **Production (key dependencies):**
- `react`, `react-dom` - 18.2.0
- `react-router-dom` - 6.16.0
- `@supabase/supabase-js` - 2.58.0
- `@stripe/stripe-js`, `@stripe/react-stripe-js`
- `@radix-ui/*` - UI primitives (20+ packages)
- `lucide-react` - Icons
- `framer-motion` - Animations
- `socket.io-client` - Real-time
- `date-fns` - Date utilities
- `recharts` - Charts
- `twilio` - SMS/Voice
- `dompurify` - XSS protection
- `validator` - Input validation

#### **Dev Dependencies:**
- `vite` - 7.1.5
- `vitest` - 3.2.4
- `@playwright/test` - 1.55.0
- `eslint` - 9.14.0
- `prettier` - 3.2.5
- `tailwindcss` - 3.3.3
- `jest` - 29.7.0
- `@testing-library/react` - 15.0.7

---

## 9. Security & Compliance

### Security Features Implemented

#### **Authentication Security**
- Supabase Auth with secure session handling
- CSRF protection (`lib/csrfProtection.js`)
- Rate limiting (`lib/rateLimiter.js`)
- Session management (`lib/sessionManager.js`)
- Secure auth utilities (`lib/secureAuth.js`)

#### **Data Protection**
- PII encryption (`lib/encryption.js`)
- PII access logging (`pii_access_log` table)
- Input validation (`lib/inputValidation.js`)
- Secure file uploads (`lib/secureFileUpload.js`)
- XSS protection (DOMPurify)
- SQL injection prevention (Supabase parameterized queries)

#### **Authorization**
- Role-based access control (`lib/rbac.js`)
- Permission gates (`PermissionGate.jsx`, `usePermissions` hook)
- Row-Level Security (RLS) policies in DB
- Admin-only routes protected

#### **Audit & Compliance**
- Audit logging (`audit_logs`, `security_audit_log`)
- Activity tracking (`activity_log`)
- Security events (`security_events`)
- Admin actions logged (`admin_activity_logs`)
- KYC/KYB verification workflows

#### **Security Scripts**
- `scripts/security-check.sh` - Security audit
- `scripts/security-audit.js` - Dependency audit
- `scripts/security-audit-supabase.js` - DB security check

### Compliance Features

#### **KYC (Know Your Customer) - Sponsors**
- Document verification workflow
- ID upload and validation
- Proof of address
- Verification status tracking

#### **KYB (Know Your Business) - Agencies**
- Business registration verification
- License validation
- Document storage
- Compliance audit trail

#### **GDPR/Privacy Considerations**
- PII encryption at rest
- Access logging
- Data retention policies (not enforced in code)
- User consent tracking (missing)

### Security Gaps
- No Content Security Policy (CSP) headers
- No rate limiting on frontend
- No IP-based access controls
- No 2FA enforcement (tables exist, not wired up)
- No automated security testing in CI

---

## 10. Performance & Monitoring

### Performance Features

#### **Frontend Optimization**
- Code splitting via React.lazy
- Route-based chunking
- Image compression (`browser-image-compression`)
- Virtual scrolling (`react-window`, `react-virtualized-auto-sizer`)
- Debounced inputs (`use-debounce`)
- Performance monitoring (`utils/performance.js`)

#### **Caching**
- Service-level caching in `dataService.js`
- LocalStorage for preferences
- Offline storage (`lib/offlineStorage.js`)

#### **Database Optimization**
- Indexed queries (in migrations)
- Query optimization hints (`query_optimization_hints` table)
- Maintenance logging (`maintenance_log`)

#### **Monitoring**
- Performance monitoring dashboard (`PerformanceMonitor.jsx`)
- Real-time metrics (`PerformanceMonitoringDashboard.jsx`)
- Lighthouse audit script (`npm run performance:audit`)

### Performance Gaps
- No CDN configuration
- No image CDN (using Supabase Storage directly)
- No service worker for offline support (stub present)
- No bundle size budget enforcement
- No performance budgets in CI

---

## 11. Build & Deployment

### Build Configuration

#### **Vite Config** (`vite.config.js`)
- React plugin
- Path aliases (`@` → `src`)
- Build output: `dist/`
- Preview server: port 4173
- Source maps enabled

#### **Tailwind Config** (`tailwind.config.js`)
- Custom design tokens via CSS variables
- Radix UI color palette
- Custom animations (`tailwindcss-animate`)

#### **PostCSS** (`postcss.config.js`)
- Tailwind
- Autoprefixer

#### **Babel** (for Jest)
- Preset: `@babel/preset-env`, `@babel/preset-react`
- Transform import.meta

### Scripts

#### **Development**
- `npm run dev` - Start Vite dev server
- `npm run dev:with-api` - Frontend + backend concurrently
- `npm run api:dev` - Backend server with nodemon

#### **Build**
- `npm run build` - Production build (with env validation)
- `npm run preview` - Preview production build
- `npm run production:build` - Build with production checks

#### **Testing**
- `npm test` - Run Vitest
- `npm run test:e2e` - Playwright E2E
- `npm run test:coverage` - Coverage report

#### **Database**
- `npm run migrate` - Run migrations
- `npm run db:setup` - Setup database
- `npm run db:test` - Test DB connection

#### **Deployment**
- `npm run deploy` - Deploy to Vercel
- `npm run deploy:prod` - Production deployment
- Target: **Vercel** (inferred from scripts)

### Deployment Configuration
- **Platform:** Vercel (deployment scripts present)
- **Environment:** Validates env vars before deploy
- **Backend:** Express server needs separate hosting (not in repo config)
- **Database:** Supabase (hosted)
- **Storage:** Supabase Storage

---

## 12. Technical Debt & Cleanup Opportunities

### High-Priority Issues

#### **1. Schema Churn**
- 50+ migration files with many "fix" and "safe" variants
- Duplicate table definitions
- Inconsistent column names
- **Action:** Consolidate into clean schema baseline

#### **2. Service Architecture**
- No separation of concerns
- Direct DB access from services
- No domain layer
- **Action:** Implement ports & adapters pattern

#### **3. Missing Translation Files**
- LocalizationContext exists but no translations
- All strings hard-coded
- **Action:** Extract strings to `en.json` and `ar.json`

#### **4. Testing Coverage**
- Low unit test coverage
- No component tests
- No RTL tests
- **Action:** Implement testing pyramid

#### **5. Duplicate/Dead Code**
- `archive/` folder with old components
- Multiple auth contexts
- Backup config files
- **Action:** Remove dead code, consolidate duplicates

### Medium-Priority Issues

#### **6. State Management Complexity**
- 15+ contexts with overlap
- No clear state ownership
- **Action:** Consolidate into app state layer

#### **7. Component Size**
- Large components (500+ LOC)
- Business logic in components
- **Action:** Extract to use-cases and hooks

#### **8. Security Hardening**
- No CSP headers
- No rate limiting on frontend
- 2FA not enforced
- **Action:** Implement security checklist

#### **9. Performance Optimization**
- No bundle size budgets
- No image CDN
- No service worker
- **Action:** Implement performance budgets

#### **10. Documentation**
- No API documentation
- No component documentation
- No architecture diagrams
- **Action:** Generate from code + add ADRs

---

## 13. Refactor Readiness Assessment

### ✅ Strengths (Can Build On)
1. **LocalizationContext** - Solid i18n foundation
2. **RTL utilities** - `useRTL` hook ready
3. **Error boundaries** - Error handling infrastructure
4. **Security utilities** - PII encryption, audit logging
5. **Database schema** - Comprehensive (needs consolidation)
6. **Radix UI** - Accessible component primitives
7. **Test infrastructure** - Vitest + Playwright configured
8. **Design tokens** - CSS custom properties system

### ⚠️ Challenges (Need Attention)
1. **No translation files** - Must extract 2,000+ strings
2. **Mixed architecture** - No clear domain boundaries
3. **Schema churn** - Too many migration files
4. **Low test coverage** - < 30% estimated
5. **Tight coupling** - Services depend on each other
6. **Large components** - Hard to refactor in place
7. **No TypeScript** - Type safety missing
8. **Backend separation** - Express server not integrated

### 🚀 Refactor Approach Recommended

#### **Phase 1: Foundation (Week 1-2)**
1. Create monorepo structure
2. Consolidate DB schema into clean migrations
3. Extract all strings to `en.json` and `ar.json`
4. Remove unsupported locales (keep en/ar only)
5. Generate OpenAPI spec from existing routes
6. Create SDK from OpenAPI

#### **Phase 2: Domain Layer (Week 3-4)**
1. Define domain modules (identity, profiles, jobs, subscriptions, etc.)
2. Create ports (interfaces) for each module
3. Extract business logic from services into use-cases
4. Implement adapters for Supabase, Stripe, Twilio
5. Add event outbox for domain events

#### **Phase 3: Presentation Layer (Week 5-6)**
1. Refactor components to use SDK only
2. Extract headless UI components
3. Add RTL tests for all layouts
4. Implement feature flags service
5. Add audit logging to all mutations

#### **Phase 4: Quality & CI (Week 7-8)**
1. Increase test coverage to 80%+
2. Add type coverage (JSDoc or TypeScript)
3. Implement CI quality gates
4. Add Storybook for UI components
5. Create migration codemods
6. Write ARCHITECTURE.md and CONTRIBUTING.md

---

## 14. Recommendations

### Immediate Actions (Before Refactor)
1. ✅ **Freeze new features** - Stabilize current codebase
2. ✅ **Branch strategy** - Create `refactor/modular-architecture` branch
3. ✅ **Backup DB** - Export current schema and data
4. ✅ **Document current flows** - Critical user journeys
5. ✅ **Set up monitoring** - Track errors during migration

### Refactor Strategy
1. **Strangler Fig Pattern** - Replace module by module
2. **Dual-run** - Old and new code side-by-side with feature flags
3. **Incremental migration** - One feature at a time
4. **Automated testing** - Prevent regressions
5. **User communication** - Transparency about changes

### Non-Negotiables
- ✅ **English + Arabic only** - Remove am, tl, id, si
- ✅ **No Amharic content** - Per requirements
- ✅ **RTL-first design** - All components must work in RTL
- ✅ **Type safety** - JSDoc minimum, TypeScript preferred
- ✅ **Test coverage ≥ 80%** - Enforce in CI
- ✅ **OpenAPI-first** - All API changes via spec
- ✅ **Audit all mutations** - Compliance requirement

---

## 15. Next Steps

### For AI Builder (You)
1. **Review this inventory** - Confirm accuracy
2. **Create monorepo scaffold** - Set up workspace structure
3. **Generate OpenAPI spec** - Document existing API
4. **Extract strings** - Build `en.json` and `ar.json`
5. **Write migration guide** - Codemods and instructions
6. **Set up CI** - Quality gates and automation

### For Development Team
1. **Review and approve** - Sign off on refactor plan
2. **Prioritize features** - Which to migrate first
3. **Allocate resources** - Dev time for refactor
4. **Plan rollout** - Feature flag strategy
5. **Communicate with users** - Transparency about changes

---

## Appendix A: File Count Summary

```
Total Files: ~1,200+ (excluding node_modules)
- JavaScript/JSX: ~450
- SQL Migrations: ~80
- Config Files: ~15
- Test Files: ~30
- Documentation: ~10
- Scripts: ~25
```

## Appendix B: Dependency Versions

See `package.json` for full list. Key versions:
- React: 18.2.0
- Vite: 7.1.5
- Supabase JS: 2.58.0
- Stripe JS: 8.0.0
- Radix UI: Latest (varies by package)
- TailwindCSS: 3.3.3
- Vitest: 3.2.4
- Playwright: 1.55.0

## Appendix C: Contact & Support

- **Repo Owner:** (from repo context)
- **Tech Stack:** PERN (PostgreSQL, Express, React, Node.js)
- **Hosting:** Vercel (frontend), Supabase (backend/DB)
- **Support:** GitHub Issues

---

**End of Inventory Report**

Generated: 2025-10-21
Version: 1.0.0
Status: Phase 0 Complete ✅
