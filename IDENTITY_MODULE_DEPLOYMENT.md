# Identity Module - Deployment Checklist

## Overview

This checklist guides you through deploying the complete Identity module with Domain, Application, and Infrastructure layers following Clean Architecture principles.

## Pre-Deployment Status

### ✅ Completed

- [x] **Domain Layer** - 3 entities (User, Session, PasswordReset)
- [x] **Application Layer** - 8 use-cases, 5 port interfaces
- [x] **Infrastructure Layer** - 5 adapters (Supabase + SendGrid)
- [x] **Database Migration** - 049_create_password_resets_table.sql
- [x] **Documentation** - Complete architecture and API docs

### ⏳ Pending Deployment

- [ ] Database migration execution
- [ ] SendGrid setup and configuration
- [ ] Environment variables configuration
- [ ] API endpoint integration
- [ ] Testing suite execution
- [ ] Monitoring and logging setup

---

## Phase 1: Database Setup

### Step 1.1: Prepare Migration

**Files to Review:**
- `database/migrations/049_create_password_resets_table.sql`
- `database/IDENTITY_MODULE_MIGRATION_GUIDE.md`

**Actions:**
```bash
# Review the migration file
cat database/migrations/049_create_password_resets_table.sql

# Check existing tables
# (via Supabase Dashboard → Database → Tables)
```

**Verification:**
- [ ] Migration file reviewed and understood
- [ ] Existing `profiles` table confirmed
- [ ] Existing `audit_logs` table confirmed
- [ ] No conflicts with existing schema

### Step 1.2: Run Migration (Development)

**Option A: Supabase Dashboard (Recommended)**

1. Log in to Supabase Dashboard: https://app.supabase.com
2. Select your development project
3. Navigate to SQL Editor
4. Create new query
5. Copy contents of `049_create_password_resets_table.sql`
6. Execute the migration
7. Check for success messages

**Option B: Supabase CLI**

```bash
# Link to development project
supabase link --project-ref your-dev-project-ref

# Create migration
supabase migration new create_password_resets_table

# Copy migration content to supabase/migrations/

# Push to development
supabase db push
```

**Verification:**
```sql
-- Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'password_resets';

-- Check indexes (should return 5)
SELECT COUNT(*) FROM pg_indexes
WHERE tablename = 'password_resets';

-- Check RLS policies (should return 2)
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'password_resets';

-- Check triggers (should return 2)
SELECT COUNT(*) FROM information_schema.triggers
WHERE event_object_table = 'password_resets';
```

**Checklist:**
- [ ] Migration executed successfully in development
- [ ] Table `password_resets` created
- [ ] 5 indexes created
- [ ] 2 RLS policies active
- [ ] 2 triggers active
- [ ] 3 utility functions created
- [ ] Test insert/query works

### Step 1.3: Run Migration (Staging)

**Actions:**
Same as development but for staging environment

```bash
# Switch to staging project
supabase link --project-ref your-staging-project-ref

# Push migration
supabase db push
```

**Checklist:**
- [ ] Migration executed successfully in staging
- [ ] All verification queries pass
- [ ] No errors in Supabase logs

### Step 1.4: Run Migration (Production)

⚠️ **CRITICAL: Backup Database First**

**Pre-Migration:**
```bash
# Backup production database
# Via Supabase Dashboard → Database → Backups
# Or use pg_dump

pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  > backup-$(date +%Y%m%d-%H%M%S).sql
```

**Actions:**
```bash
# Switch to production project
supabase link --project-ref your-prod-project-ref

# Review migration one last time
cat database/migrations/049_create_password_resets_table.sql

# Push to production
supabase db push

# OR use Supabase Dashboard SQL Editor
```

**Post-Migration Verification:**
```sql
-- Run all verification queries
-- Check Supabase logs for any errors
-- Test a sample password reset flow
```

**Checklist:**
- [ ] Production database backed up
- [ ] Migration reviewed with team
- [ ] Migration executed in production
- [ ] All verification queries pass
- [ ] No errors in production logs
- [ ] Rollback plan ready

---

## Phase 2: SendGrid Setup

### Step 2.1: Create SendGrid Account

**Actions:**
1. Sign up at https://sendgrid.com
2. Choose appropriate plan (Free tier: 100 emails/day)
3. Verify your account via email

**Checklist:**
- [ ] SendGrid account created
- [ ] Email verified
- [ ] Account status: Active

### Step 2.2: Configure Sender Authentication

**Domain Authentication (Recommended):**

1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Select your DNS provider
4. Add the provided DNS records (CNAME, TXT)
5. Wait for verification (can take up to 48 hours)

**DNS Records to Add:**
```
Type: CNAME
Host: em1234.yourdomain.com
Value: u1234567.wl123.sendgrid.net

Type: CNAME
Host: s1._domainkey.yourdomain.com
Value: s1.domainkey.u1234567.wl123.sendgrid.net

Type: CNAME
Host: s2._domainkey.yourdomain.com
Value: s2.domainkey.u1234567.wl123.sendgrid.net
```

**Single Sender Verification (Quick Alternative):**

1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter email address (e.g., noreply@ethiomaids.com)
4. Verify via email link

**Checklist:**
- [ ] Domain authenticated OR Single sender verified
- [ ] SPF/DKIM records configured
- [ ] DMARC policy set up (optional but recommended)
- [ ] Test email sent successfully

### Step 2.3: Generate API Key

**Actions:**
1. Go to SendGrid Dashboard → Settings → API Keys
2. Click "Create API Key"
3. Name: "Ethiopian Maids - Production"
4. Select "Full Access" or "Restricted Access" with Mail Send permissions
5. Copy the API key (shown only once!)
6. Store securely (password manager, secrets manager)

**Permissions Required:**
- Mail Send: Full Access

**Checklist:**
- [ ] API key generated
- [ ] API key copied and stored securely
- [ ] Permissions verified

### Step 2.4: Install SendGrid Package

**Actions:**
```bash
cd "C:\Users\umera\OneDrive\Documents\ethiopian maids V.0.2\ethiopian-maids"

# Install SendGrid mail package
npm install @sendgrid/mail

# Or with pnpm
pnpm add @sendgrid/mail
```

**Checklist:**
- [ ] @sendgrid/mail package installed
- [ ] package.json updated
- [ ] Lock file updated

### Step 2.5: Update SendGridEmailService

**File:** `packages/infra/identity/SendGridEmailService.js`

**Uncomment the actual sending code:**

```javascript
// Find this section (around line 246-254)
async _sendEmail({ to, subject, html }) {
  if (!this.config.apiKey) {
    console.warn('SendGrid API key not configured. Email not sent:', { to, subject });
    return;
  }

  // UNCOMMENT THIS SECTION:
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(this.config.apiKey);
  return sgMail.send({
    to,
    from: { email: this.config.fromEmail, name: this.config.fromName },
    subject,
    html
  });

  // REMOVE OR COMMENT OUT THIS SECTION:
  // console.log('📧 Email would be sent:', { to, subject });
  // return Promise.resolve();
}
```

**Checklist:**
- [ ] SendGrid SDK code uncommented
- [ ] Development logging code removed/commented
- [ ] File saved

### Step 2.6: Test Email Sending

**Create Test Script:** `scripts/test-email.js`

```javascript
import { SendGridEmailService } from './packages/infra/identity/SendGridEmailService.js';

const emailService = new SendGridEmailService({
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL,
  baseUrl: process.env.APP_BASE_URL
});

async function testEmail() {
  try {
    await emailService.sendPasswordResetEmail({
      email: 'your-test-email@example.com',
      token: 'test-token-123',
      userName: 'Test User',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });
    console.log('✅ Test email sent successfully');
  } catch (error) {
    console.error('❌ Test email failed:', error);
  }
}

testEmail();
```

**Run Test:**
```bash
node scripts/test-email.js
```

**Checklist:**
- [ ] Test script created
- [ ] Test email sent successfully
- [ ] Email received in inbox
- [ ] Email rendering looks correct
- [ ] Reset link format is correct

---

## Phase 3: Environment Variables

### Step 3.1: Update .env Files

**Development:** `.env.development`

```bash
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# SendGrid (NEW)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@ethiomaids.com

# Application (NEW)
APP_BASE_URL=http://localhost:5173
```

**Staging:** `.env.staging`

```bash
# Supabase (Staging)
SUPABASE_URL=https://staging-xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# SendGrid
SENDGRID_API_KEY=SG.staging-xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@staging.ethiomaids.com

# Application
APP_BASE_URL=https://staging.ethiomaids.com
```

**Production:** `.env.production`

```bash
# Supabase (Production)
SUPABASE_URL=https://prod-xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# SendGrid
SENDGRID_API_KEY=SG.prod-xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@ethiomaids.com

# Application
APP_BASE_URL=https://ethiomaids.com
```

**Checklist:**
- [ ] Development .env configured
- [ ] Staging .env configured
- [ ] Production .env configured
- [ ] All sensitive values stored in secrets manager

### Step 3.2: Update .env.example

**File:** `.env.example`

```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# SendGrid Email Service
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Application Configuration
APP_BASE_URL=https://yourdomain.com

# ... other existing variables ...
```

**Checklist:**
- [ ] .env.example updated with new variables
- [ ] No actual secrets in .env.example
- [ ] Comments added for clarity

### Step 3.3: Configure Hosting Platform

**Vercel:**

```bash
# Via Vercel CLI
vercel env add SENDGRID_API_KEY production
vercel env add SENDGRID_FROM_EMAIL production
vercel env add APP_BASE_URL production

# Or via Vercel Dashboard:
# Project Settings → Environment Variables
```

**Netlify:**

```bash
# Via Netlify CLI
netlify env:set SENDGRID_API_KEY "SG.xxxxx" --context production
netlify env:set SENDGRID_FROM_EMAIL "noreply@ethiomaids.com" --context production
netlify env:set APP_BASE_URL "https://ethiomaids.com" --context production

# Or via Netlify Dashboard:
# Site Settings → Environment Variables
```

**Other Platforms:**
- Add environment variables via platform dashboard
- Ensure variables are set for all environments (dev, staging, prod)

**Checklist:**
- [ ] Environment variables added to hosting platform
- [ ] Variables verified in platform dashboard
- [ ] Test deployment to verify variables are loaded

---

## Phase 4: API Integration

### Step 4.1: Create Dependency Injection Setup

**File:** `src/config/usecases.js` (or similar)

```javascript
import { createClient } from '@supabase/supabase-js';
import {
  SupabaseUserRepository,
  SupabaseAuthService,
  SupabaseAuditLogger,
  SupabasePasswordResetRepository,
  SendGridEmailService,
} from '@ethio-maids/infra-identity';

import {
  RegisterUser,
  SignIn,
  SignOut,
  GetUser,
  VerifyUserEmail,
  RequestPasswordReset,
  ResetPassword,
  UpdateUser,
} from '@ethio-maids/app-identity';

// Initialize Supabase (service role for backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize repositories and services
const userRepository = new SupabaseUserRepository(supabase);
const authService = new SupabaseAuthService(supabase);
const auditLogger = new SupabaseAuditLogger(supabase);
const passwordResetRepository = new SupabasePasswordResetRepository(supabase);
const emailService = new SendGridEmailService({
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL,
  baseUrl: process.env.APP_BASE_URL,
});

// Event bus (placeholder - replace with actual implementation)
const eventBus = {
  publish: (event) => console.log('[Event]', event.type, event.payload),
};

// Create use-cases
export const registerUser = new RegisterUser({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

export const signIn = new SignIn({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

export const signOut = new SignOut({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

export const getUser = new GetUser({
  userRepository,
});

export const verifyUserEmail = new VerifyUserEmail({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

export const requestPasswordReset = new RequestPasswordReset({
  userRepository,
  passwordResetRepository,
  emailService,
  auditLogger,
  eventBus,
});

export const resetPassword = new ResetPassword({
  userRepository,
  passwordResetRepository,
  authService,
  auditLogger,
  eventBus,
});

export const updateUser = new UpdateUser({
  userRepository,
  auditLogger,
  eventBus,
});
```

**Checklist:**
- [ ] Dependency injection file created
- [ ] All repositories initialized
- [ ] All services initialized
- [ ] All use-cases wired up
- [ ] Event bus configured

### Step 4.2: Create API Endpoints

**Endpoint 1:** `POST /api/auth/password-reset/request`

```javascript
// api/auth/password-reset/request.js
import { requestPasswordReset } from '../../../config/usecases.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Validation
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const metadata = {
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await requestPasswordReset.execute({
      email: email.toLowerCase().trim(),
      metadata,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Password Reset Request Error]', error);

    // Always return generic success message for security
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }
}
```

**Endpoint 2:** `POST /api/auth/password-reset/confirm`

```javascript
// api/auth/password-reset/confirm.js
import { resetPassword } from '../../../config/usecases.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, newPassword } = req.body;

    // Validation
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const metadata = {
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await resetPassword.execute({
      token,
      newPassword,
      metadata,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Password Reset Confirm Error]', error);

    return res.status(400).json({
      error: error.message || 'Failed to reset password'
    });
  }
}
```

**Checklist:**
- [ ] `/api/auth/password-reset/request` endpoint created
- [ ] `/api/auth/password-reset/confirm` endpoint created
- [ ] Request validation added
- [ ] Error handling implemented
- [ ] Metadata collection (IP, user agent) implemented
- [ ] Security considerations applied (generic error messages)

### Step 4.3: Create Frontend Pages

**Password Reset Request Page:** `src/pages/ResetPasswordRequest.jsx`

```jsx
import { useState } from 'react';

export default function ResetPasswordRequest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to request password reset');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-message">
        <h2>Check Your Email</h2>
        <p>If an account with that email exists, we've sent a password reset link.</p>
        <p>The link will expire in 1 hour.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Reset Password</h2>
      {error && <div className="error">{error}</div>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}
```

**Password Reset Confirm Page:** `src/pages/ResetPasswordConfirm.jsx`

```jsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect to login
        navigate('/signin?reset=success');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className="error">Invalid reset link</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Password</h2>
      {error && <div className="error">{error}</div>}

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        required
        minLength={8}
      />

      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        required
        minLength={8}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}
```

**Checklist:**
- [ ] Reset request page created
- [ ] Reset confirm page created
- [ ] Routes configured
- [ ] Form validation implemented
- [ ] Loading states handled
- [ ] Success/error messages displayed
- [ ] Redirect after success implemented

---

## Phase 5: Testing

### Step 5.1: Unit Tests

**Test Files to Create:**

1. `packages/domain/identity/__tests__/Session.test.js`
2. `packages/domain/identity/__tests__/PasswordReset.test.js`
3. `packages/app/identity/__tests__/RequestPasswordReset.test.js`
4. `packages/app/identity/__tests__/ResetPassword.test.js`
5. `packages/infra/identity/__tests__/SupabasePasswordResetRepository.test.js`
6. `packages/infra/identity/__tests__/SendGridEmailService.test.js`

**Run Unit Tests:**
```bash
# Test domain layer
cd packages/domain/identity
pnpm test

# Test application layer
cd packages/app/identity
pnpm test

# Test infrastructure layer
cd packages/infra/identity
pnpm test
```

**Checklist:**
- [ ] Domain entity tests pass
- [ ] Use-case tests pass
- [ ] Infrastructure adapter tests pass
- [ ] Code coverage > 80%

### Step 5.2: Integration Tests

**Test Password Reset Flow:**

```javascript
// tests/integration/password-reset-flow.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { requestPasswordReset, resetPassword } from '../../src/config/usecases.js';

describe('Password Reset Integration', () => {
  let testUser;
  let resetToken;

  beforeAll(async () => {
    // Create test user
    testUser = await createTestUser('test@example.com', 'OldPassword123');
  });

  it('should request password reset', async () => {
    const result = await requestPasswordReset.execute({
      email: testUser.email,
      metadata: { ip: '127.0.0.1' },
    });

    expect(result.success).toBe(true);

    // Get token from database (in real test environment)
    resetToken = await getResetTokenFromDatabase(testUser.id);
    expect(resetToken).toBeDefined();
  });

  it('should reset password with valid token', async () => {
    const result = await resetPassword.execute({
      token: resetToken,
      newPassword: 'NewPassword456',
      metadata: { ip: '127.0.0.1' },
    });

    expect(result.success).toBe(true);

    // Verify can sign in with new password
    const signInResult = await attemptSignIn(testUser.email, 'NewPassword456');
    expect(signInResult).toBeTruthy();
  });

  it('should fail with expired token', async () => {
    // Wait for token to expire or manually expire it
    await expireToken(resetToken);

    await expect(
      resetPassword.execute({
        token: resetToken,
        newPassword: 'AnotherPassword789',
        metadata: { ip: '127.0.0.1' },
      })
    ).rejects.toThrow('expired');
  });
});
```

**Run Integration Tests:**
```bash
pnpm test:integration
```

**Checklist:**
- [ ] Integration tests written
- [ ] Test database configured
- [ ] Tests pass in development
- [ ] Tests pass in CI/CD

### Step 5.3: E2E Tests

**Playwright Test:** `tests/e2e/password-reset.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow', () => {
  test('should complete password reset successfully', async ({ page }) => {
    // Go to forgot password page
    await page.goto('/forgot-password');

    // Enter email
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('.success-message')).toBeVisible();

    // In test environment, get reset link from email service mock
    const resetLink = await getResetLinkFromMock();

    // Navigate to reset link
    await page.goto(resetLink);

    // Enter new password
    await page.fill('input[placeholder="New password"]', 'NewSecurePassword123!');
    await page.fill('input[placeholder="Confirm new password"]', 'NewSecurePassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to login with success message
    await expect(page).toHaveURL(/\/signin\?reset=success/);
    await expect(page.locator('.success-alert')).toContainText('Password reset successful');

    // Verify can sign in with new password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'NewSecurePassword123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });
});
```

**Run E2E Tests:**
```bash
pnpm test:e2e
```

**Checklist:**
- [ ] E2E tests written
- [ ] Tests pass locally
- [ ] Tests pass in CI/CD
- [ ] Screenshots on failure captured

### Step 5.4: Manual Testing

**Test Scenarios:**

1. **Happy Path:**
   - [ ] Request reset → Receive email → Click link → Enter new password → Success → Sign in

2. **Error Cases:**
   - [ ] Request reset with non-existent email (should show generic success)
   - [ ] Use expired token (should show error)
   - [ ] Use already-used token (should show error)
   - [ ] Enter weak password (should show validation error)
   - [ ] Passwords don't match (should show error)

3. **Security:**
   - [ ] Multiple reset requests cancel previous ones
   - [ ] All sessions revoked after password change
   - [ ] Reset email contains no sensitive info
   - [ ] Reset link expires after 1 hour

4. **Edge Cases:**
   - [ ] Request reset while already logged in
   - [ ] Use reset link after password already changed
   - [ ] Request multiple resets in quick succession

**Checklist:**
- [ ] All happy path scenarios pass
- [ ] All error cases handled correctly
- [ ] Security measures verified
- [ ] Edge cases handled gracefully

---

## Phase 6: Monitoring & Logging

### Step 6.1: Set Up Logging

**Create Logger Utility:** `src/utils/logger.js`

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
```

**Add Logging to Use-Cases:**

```javascript
// In RequestPasswordReset use-case
import logger from '../../utils/logger.js';

async execute(command) {
  logger.info('[RequestPasswordReset] Started', {
    email: command.email,
    ip: command.metadata?.ip,
  });

  try {
    // ... existing code ...

    logger.info('[RequestPasswordReset] Success', {
      email: command.email,
      resetId: passwordReset.id,
    });
  } catch (error) {
    logger.error('[RequestPasswordReset] Failed', {
      email: command.email,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
```

**Checklist:**
- [ ] Logger configured
- [ ] Logging added to all use-cases
- [ ] Error logging captures stack traces
- [ ] Sensitive data NOT logged (passwords, tokens)
- [ ] Log files rotating properly

### Step 6.2: Set Up Error Tracking

**Sentry Integration:**

```bash
npm install @sentry/node
```

```javascript
// src/config/sentry.js
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

export default Sentry;
```

**Add to API Endpoints:**

```javascript
import Sentry from '../../config/sentry.js';

try {
  // ... existing code ...
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'password-reset',
      endpoint: '/api/auth/password-reset/request',
    },
    extra: {
      email: req.body.email,
      ip: req.ip,
    },
  });
  // ... error response ...
}
```

**Checklist:**
- [ ] Sentry configured
- [ ] Error tracking added to API endpoints
- [ ] Error tracking added to use-cases
- [ ] Test error in development captured in Sentry

### Step 6.3: Set Up Monitoring Dashboard

**Metrics to Monitor:**

1. **Password Reset Requests:**
   - Total requests per day
   - Success rate
   - Failure rate by reason

2. **Email Delivery:**
   - Emails sent
   - Delivery rate
   - Bounce rate
   - Open rate (if tracking enabled)

3. **Performance:**
   - API endpoint response times
   - Database query times
   - Email sending times

4. **Security:**
   - Failed reset attempts
   - Expired token usage attempts
   - Multiple requests from same IP

**Query for Statistics:**

```sql
-- Get password reset stats
SELECT * FROM get_password_reset_stats(30); -- Last 30 days
```

**Create Monitoring Query:** `scripts/monitor-password-resets.sql`

```sql
-- Daily password reset statistics
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'used') as successful,
  COUNT(*) FILTER (WHERE status = 'expired') as expired,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'used')::NUMERIC / COUNT(*) * 100,
    2
  ) as success_rate_pct
FROM password_resets
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top IPs requesting resets (potential abuse)
SELECT
  ip_address,
  COUNT(*) as request_count,
  COUNT(DISTINCT email) as unique_emails,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request
FROM password_resets
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY request_count DESC
LIMIT 20;
```

**Checklist:**
- [ ] Monitoring queries created
- [ ] Dashboard configured (Grafana, Datadog, etc.)
- [ ] Alerts configured for anomalies
- [ ] Daily/weekly reports scheduled

### Step 6.4: Set Up Alerts

**Alert Conditions:**

1. **High Error Rate:** > 10% of password reset requests failing
2. **Unusual Volume:** > 100 requests per hour
3. **Low Success Rate:** < 50% success rate over 24 hours
4. **Email Delivery Issues:** > 5% bounce rate
5. **Potential Abuse:** > 10 requests from single IP in 1 hour

**Alert Channels:**
- Email notifications
- Slack channel
- PagerDuty (for critical issues)

**Checklist:**
- [ ] Alerts configured
- [ ] Alert thresholds tuned
- [ ] Alert channels tested
- [ ] On-call rotation defined

---

## Phase 7: Documentation

### Step 7.1: Update API Documentation

**Create OpenAPI Spec:** `docs/api/password-reset.yaml`

```yaml
openapi: 3.0.0
info:
  title: Ethiopian Maids - Password Reset API
  version: 1.0.0

paths:
  /api/auth/password-reset/request:
    post:
      summary: Request password reset
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
      responses:
        '200':
          description: Success (generic response for security)
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: "If an account with that email exists, a password reset link has been sent."
        '400':
          description: Validation error
        '500':
          description: Server error

  /api/auth/password-reset/confirm:
    post:
      summary: Confirm password reset
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - token
                - newPassword
              properties:
                token:
                  type: string
                  example: "abc123..."
                newPassword:
                  type: string
                  format: password
                  minLength: 8
                  example: "NewSecurePassword123!"
      responses:
        '200':
          description: Password reset successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: "Password reset successfully"
        '400':
          description: Invalid token or validation error
        '500':
          description: Server error
```

**Checklist:**
- [ ] API documentation created
- [ ] Request/response examples added
- [ ] Error codes documented
- [ ] Rate limits documented

### Step 7.2: Update User Documentation

**Create User Guide:** `docs/user-guides/password-reset.md`

```markdown
# How to Reset Your Password

## Step 1: Request Password Reset

1. Go to the sign-in page
2. Click "Forgot Password?"
3. Enter your email address
4. Click "Send Reset Link"
5. Check your email inbox

## Step 2: Click Reset Link

1. Open the email from Ethiopian Maids
2. Click the "Reset Password" button
3. **Important:** The link expires in 1 hour

## Step 3: Create New Password

1. Enter your new password
2. Confirm your new password
3. Click "Reset Password"

## Password Requirements

- At least 8 characters long
- Mix of uppercase and lowercase letters
- At least one number
- At least one special character (recommended)

## Troubleshooting

**Didn't receive the email?**
- Check your spam/junk folder
- Wait a few minutes and try again
- Verify you entered the correct email address

**Link expired?**
- Request a new password reset
- Complete the process within 1 hour

**Link not working?**
- Copy and paste the full link into your browser
- Make sure you're using the latest reset email

## Security Notes

- Never share your reset link with anyone
- For security, all active sessions will be logged out after password reset
- You'll need to sign in again with your new password
```

**Checklist:**
- [ ] User guide created
- [ ] Screenshots added
- [ ] Troubleshooting section complete
- [ ] Security notes included

### Step 7.3: Update Developer Documentation

Files already created:
- [x] `packages/IDENTITY_MODULE_COMPLETE.md` - Complete architecture overview
- [x] `packages/DOMAIN_APP_LAYER_SUMMARY.md` - Domain and application layers
- [x] `packages/infra/identity/INFRASTRUCTURE_SUMMARY.md` - Infrastructure layer
- [x] `database/IDENTITY_MODULE_MIGRATION_GUIDE.md` - Database migration guide
- [x] `IDENTITY_MODULE_DEPLOYMENT.md` - This deployment checklist

**Checklist:**
- [ ] All documentation reviewed for accuracy
- [ ] Code examples tested
- [ ] Links between docs verified
- [ ] README updated with links to new docs

---

## Phase 8: Deployment

### Step 8.1: Pre-Deployment Checklist

**Code Review:**
- [ ] All code reviewed and approved
- [ ] No console.log statements in production code
- [ ] No hardcoded secrets
- [ ] Error handling comprehensive
- [ ] Security best practices followed

**Testing:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Manual testing complete
- [ ] Load testing performed (if applicable)

**Configuration:**
- [ ] Environment variables set
- [ ] Database migration ready
- [ ] SendGrid configured and tested
- [ ] Monitoring configured
- [ ] Alerts configured

**Documentation:**
- [ ] API documentation complete
- [ ] User documentation complete
- [ ] Developer documentation complete
- [ ] Changelog updated

### Step 8.2: Deploy to Staging

**Actions:**
```bash
# Build application
npm run build

# Deploy to staging
# (Command depends on hosting platform)
vercel deploy --env=staging
# OR
netlify deploy --prod=false

# Run database migration
supabase db push --project-ref staging-project-ref
```

**Post-Deployment Verification:**
- [ ] Staging site accessible
- [ ] Database migration applied
- [ ] Environment variables loaded
- [ ] Test password reset flow end-to-end
- [ ] Check logs for errors
- [ ] Verify email sending works
- [ ] Test from different devices/browsers

### Step 8.3: Deploy to Production

⚠️ **CRITICAL: Follow this exact sequence**

**Pre-Deployment:**
1. [ ] Announce maintenance window (if needed)
2. [ ] Backup production database
3. [ ] Verify staging works perfectly
4. [ ] Have rollback plan ready

**Deployment Sequence:**

```bash
# 1. Database migration (FIRST - before code deploy)
supabase db push --project-ref prod-project-ref

# 2. Verify migration succeeded
# Check Supabase Dashboard → Database → Tables

# 3. Deploy code
npm run build
vercel deploy --prod
# OR
netlify deploy --prod

# 4. Verify deployment
curl https://ethiomaids.com/api/health
```

**Post-Deployment Verification:**
- [ ] Production site accessible
- [ ] Database migration confirmed
- [ ] Environment variables confirmed
- [ ] Test password reset flow (with test account)
- [ ] Monitor error logs for 30 minutes
- [ ] Check SendGrid for email delivery
- [ ] Verify monitoring dashboards
- [ ] Verify alerts working
- [ ] Test from multiple locations
- [ ] Check mobile responsiveness

**Communication:**
- [ ] Notify team of successful deployment
- [ ] Update status page (if applicable)
- [ ] Share release notes with stakeholders

---

## Phase 9: Post-Deployment

### Step 9.1: Monitor for 24 Hours

**What to Watch:**
- [ ] Error rates (should be near zero)
- [ ] Response times (should be < 200ms)
- [ ] Email delivery rates (should be > 95%)
- [ ] Password reset success rates
- [ ] User feedback/support tickets

**Monitoring Checklist:**
- [ ] Check logs every 2 hours for first 8 hours
- [ ] Review monitoring dashboard regularly
- [ ] Respond to any alerts immediately
- [ ] Keep rollback plan ready

### Step 9.2: Cleanup

**Actions:**
- [ ] Remove any temporary test data
- [ ] Clean up old/expired resets: `SELECT cleanup_expired_password_resets()`
- [ ] Archive deployment logs
- [ ] Update project board/issue tracker

### Step 9.3: Retrospective

**Questions to Answer:**
- What went well?
- What could be improved?
- Were there any unexpected issues?
- What should we do differently next time?
- Any technical debt created?

**Document Lessons Learned:**
- [ ] Update deployment runbook
- [ ] Add any new troubleshooting steps discovered
- [ ] Note any gotchas for future reference

---

## Rollback Plan

If critical issues are discovered post-deployment:

### Immediate Actions

1. **Disable Password Reset Feature:**
   ```javascript
   // Add feature flag check
   if (!process.env.ENABLE_PASSWORD_RESET) {
     return res.status(503).json({
       error: 'Password reset temporarily unavailable'
     });
   }
   ```

2. **Rollback Code (if needed):**
   ```bash
   # Vercel
   vercel rollback

   # Netlify
   netlify rollback
   ```

3. **Rollback Database (only if absolutely necessary):**
   ```sql
   -- Execute rollback script from IDENTITY_MODULE_MIGRATION_GUIDE.md
   DROP TABLE IF EXISTS password_resets CASCADE;
   -- ... (full rollback script)
   ```

4. **Communication:**
   - Notify team immediately
   - Update status page
   - Prepare user communication

### Post-Rollback

- [ ] Identify root cause
- [ ] Fix issues
- [ ] Test fix thoroughly
- [ ] Re-deploy when ready

---

## Summary

This deployment checklist ensures the Identity module is deployed safely and successfully. Follow each phase in sequence, checking off items as you complete them.

**Key Success Criteria:**
- ✅ Database migration applied successfully
- ✅ SendGrid sending emails reliably
- ✅ API endpoints working correctly
- ✅ Frontend pages functioning properly
- ✅ All tests passing
- ✅ Monitoring and alerts active
- ✅ Zero critical errors in production

**Estimated Timeline:**
- Phase 1 (Database): 2-4 hours
- Phase 2 (SendGrid): 2-3 hours (including DNS wait time)
- Phase 3 (Environment): 1 hour
- Phase 4 (API): 4-6 hours
- Phase 5 (Testing): 4-8 hours
- Phase 6 (Monitoring): 2-3 hours
- Phase 7 (Documentation): 2-3 hours
- Phase 8 (Deployment): 2-4 hours
- Phase 9 (Post-Deployment): 24 hours monitoring

**Total: 3-5 days** (depending on team size and existing infrastructure)

---

## Quick Reference

**Key Files:**
- Migration: `database/migrations/049_create_password_resets_table.sql`
- Migration Guide: `database/IDENTITY_MODULE_MIGRATION_GUIDE.md`
- Architecture: `packages/IDENTITY_MODULE_COMPLETE.md`
- Infrastructure: `packages/infra/identity/INFRASTRUCTURE_SUMMARY.md`

**Key Commands:**
```bash
# Run migration
supabase db push

# Test email
node scripts/test-email.js

# Deploy staging
vercel deploy --env=staging

# Deploy production
vercel deploy --prod

# Monitor logs
vercel logs --follow
```

**Support Contacts:**
- DevOps: [contact]
- Database Admin: [contact]
- On-Call Engineer: [contact]

---

**Deployment Status:** ⏳ Pending

**Last Updated:** 2025-10-21
