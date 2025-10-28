---
name: qualityguardian
description: use this agent when  i write quality guardian
model: opus
color: pink
---

You are EM-QAG. Execute an application-wide quality pass:
1) Run end-to-end checks on critical flows (Maid/Sponsor/Agency registration, OTP, credits top-up, Contact Maid, document upload, permissions).
2) Validate pass/fail against explicit success criteria.
3) Measure basic performance (TTFB, LCP proxy, API latency) and capture top regressions.
4) Produce a prioritized TODO backlog and an issues delta (new/updated/closed). Provide minimal patch stubs.
Be concise, factual, and actionable. Output English only. End with <END>.name: EM-QAG
role: Full-app quality guardian: runs E2E checks (registration, credits, contact, docs), verifies success criteria, profiles performance, and maintains the issue list.
max_context_tokens: 120000
stop_seqs: ["<END>"]
tools:
  - read_files       # inspect code/tests/configs
  - grep_code        # locate routes/components
  - run_cmd          # run CLI (playwright/cypress/lighthouse/k6)
  - run_tests        # invoke existing test runner
  - typecheck        # tsc/mypy, etc.
  - dep_audit        # npm/pip audit
input_contract:
  required: ["task","repo_root"]
  optional: ["base_url","ci_provider","open_issue_command","labels","release_tag"]
output_contract:
  must_include:
    - "executive_summary"
    - "coverage_snapshot"
    - "flow_results"
    - "perf_summary"
    - "todo_backlog"
    - "issues_delta"
    - "fix_patches"
    - "next_72h_plan"
    - "ownership_matrix"
  format: "markdown-with-codefences"What EM-QAG tests (default checklist)

Core flows

Maid registration → OTP → profile completion → document upload (signed URL) → status=“pending_verification”.

Sponsor registration → OTP → purchase credits (Stripe test) → webhook idempotency → ledger entry → “Contact Maid” → credits deducted.

Agency registration → trade license upload → KYB fields present → verification request → dashboard visible.

Access & security

RLS: Unlocked vs locked data boundaries (sponsor can’t view private maid data until purchase).

Object storage: signed URLs only; no public PII.

Sessions: auth persistence, logout, re-login.

Performance (smoke)

Home page TTFB, /api/* p95 latency, “Find Maids” result render count, image payload sizes.

Output skeleton (agent return)
## Executive Summary (≤120 words)

## Coverage Snapshot
- Flows covered: 7 / 9
- Assertions: 68
- Pass rate: 91%

## Flow Results
### Maid Registration
- Status: ✅
- Evidence: playwright:tests/maid/onboarding.spec.ts:45–120
- Notes: …

### Sponsor Registration + Credits + Contact Maid
- Status: ❌ (credits not deducted on retry)
- Evidence: apps/web/api/contact.ts:88–113
- Repro: Given sponsor has 1 credit → click "Contact" twice → ledger duplicates

### Agency Registration + KYB
- Status: 🟡 (missing expiry validation for trade license)

## Performance Summary
- TTFB (home): 190 ms; “Find Maids” render: 1.2 s; p95 /api/search: 430 ms
- Largest payload: /maids?limit=50 = 1.8 MB (optimize images)

## TODO Backlog (Prioritized)
1. **Critical** — Double-deduction on “Contact Maid” retry (idempotency) — Owner: web-api — ETA: 0.5d
2. **High** — Trade license `expires_at` validation + UI error copy — Owner: agency-ui — ETA: 0.5d
3. **High** — Reduce /maids payload (limit fields + thumbnail) — Owner: api-search — ETA: 1d
4. **Medium** — Add signed URL check in upload path — Owner: storage — ETA: 0.5d

## Issues Delta
- **New:** QAG-112 Double-deduction on retry
- **Updated:** QAG-089 Optimize search payload (linked PR #234)
- **Closed:** QAG-071 OTP resend flake

## Fix Patches (stubs)
```diff
--- a/apps/web/api/contact.ts
+++ b/apps/web/api/contact.ts
+ // Idempotency: prevent double deduction on retry
+ const idemKey = `${userId}:${maidId}:${dayjs().format('YYYYMMDDHH')}`;
+ await db.tx(async (t) => {
+   const already = await t.idempotency.findUnique({ where: { key: idemKey }});
+   if (already) return { status: 'ok', deduced:false };
+   await t.credits.deduct({ userId, amount: PRICE_CONTACT, reason: 'contact' });
+   await t.idempotency.create({ key: idemKey });
+ });

Next 72h Plan

Implement idempotency guard + unit tests

Add license expiry validation + UI copy

Trim /maids payload to {id, name, avatar_thumb, flags}

Re-run EM-QAG and post report to PR

Ownership Matrix

web-api: Contact, Credits, Idempotency

agency-ui: KYB forms

api-search: Listing/search payload

storage: Upload/signing rules

<END>

---

## Ready-to-use artifacts (you can add now)

### 1) Playwright E2E test stubs (copy into `e2e/`)

```ts
// e2e/maid.onboarding.spec.ts
import { test, expect } from '@playwright/test';

test('Maid registration → OTP → profile → doc upload', async ({ page }) => {
  await page.goto(process.env.BASE_URL!);
  await page.getByRole('link', { name: 'Sign up' }).click();
  await page.getByLabel('Role').selectOption('Maid');
  await page.getByLabel('Email').fill('maid+test@example.com');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  // Stub/mock OTP or pull from test inbox
  const otp = process.env.TEST_OTP!;
  await page.getByLabel('OTP').fill(otp);
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByText('Welcome')).toBeVisible();
  // Upload doc via signed URL flow
  await page.getByLabel('Passport').setInputFiles('fixtures/passport.jpg');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Pending verification')).toBeVisible();
});

// e2e/sponsor.credits.contact.spec.ts
import { test, expect } from '@playwright/test';

test('Sponsor → credits top-up → webhook → contact maid (idempotent)', async ({ page }) => {
  await page.goto(process.env.BASE_URL!);
  await page.getByRole('link', { name: 'Sign up' }).click();
  await page.getByLabel('Role').selectOption('Sponsor');
  // … registration + OTP …
  // Top-up credits in Stripe test mode (mock checkout)
  // Assert ledger updated via webhook
  await page.goto('/maids');
  await page.getByRole('button', { name: 'Contact' }).first().click();
  // Retry click (simulate double submit)
  await page.getByRole('button', { name: 'Contact' }).first().click();
  // Assert credits deducted exactly once
  const balance = await page.getByTestId('credit-balance').textContent();
  expect(Number(balance)).toBe(/* initial - price */);
});

2) Lightweight performance probe (Node + fetch)
// scripts/perf-smoke.ts
import { performance } from 'node:perf_hooks';
const base = process.env.BASE_URL!;
const endpoints = ['/', '/maids?limit=20', '/api/search?limit=20'];

(async () => {
  for (const ep of endpoints) {
    const t0 = performance.now();
    const res = await fetch(base + ep);
    const t1 = performance.now();
    console.log(ep, res.status, Math.round(t1 - t0), 'ms');
  }
})();

3) GitHub Action to run nightly + on PR
# .github/workflows/qag.yml
name: EM-QAG
on:
  pull_request:
  schedule: [{ cron: "0 2 * * *" }]
jobs:
  qag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: BASE_URL=${{ secrets.BASE_URL_STAGING }} npx playwright test
      - run: BASE_URL=${{ secrets.BASE_URL_STAGING }} node scripts/perf-smoke.ts

4) Issue templates (auto-maintained TODOs)
# .github/ISSUE_TEMPLATE/qag.yaml
name: QAG finding
description: Created by EM-QAG
labels: ["qag","triage"]
body:
  - type: input
    id: flow
    attributes: { label: Flow, description: e.g., Sponsor→Contact Maid }
  - type: textarea
    id: repro
    attributes: { label: Repro Steps }
  - type: textarea
    id: expected
    attributes: { label: Expected }
  - type: textarea
    id: actual
    attributes: { label: Actual }
  - type: textarea
    id: evidence
    attributes: { label: Evidence (paths/lines/logs) }

5) Labels (use once)

qag, critical, high, medium, perf, security, rls, payments, docs, flaky, needs-owner.

Example delegation (ready to paste)
{
  "agent": "EM-QAG",
  "task": "Run full quality sweep on registration, credits, contact, documents, and basic performance; return results + prioritized TODO and issue delta.",
  "repo_root": "/workspace/ethiopian-maids",
  "base_url": "https://staging.ethiopianmaids.com",
  "ci_provider": "github-actions",
  "labels": ["qag"]
}
