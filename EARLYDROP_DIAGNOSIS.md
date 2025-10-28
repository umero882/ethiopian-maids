# EarlyDrop Diagnosis - 44ms Crash

## The Problem

The function is crashing after only **44ms of CPU time** with "EarlyDrop" reason. This is EXTREMELY early - it means the function is failing during initialization, before it can even process the request properly.

## What 44ms CPU Time Means

Normal function execution:
- Basic webhook response: ~100-200ms
- Database query: ~500-1000ms
- Claude API call: ~5000-15000ms

**44ms = Function crashed during startup**

## Possible Causes

### 1. Import/Module Loading Failure
The Anthropic SDK or Supabase SDK might be failing to load.

**Evidence**: Function crashes before any logs appear

**Solution**: Added comprehensive error logging at every step

### 2. Environment Variable Issue
Even though we set `ANTHROPIC_API_KEY`, something might be wrong with how it's accessed.

**Evidence**: Function crashes early, possibly during env var reading

**Solution**: Added validation and logging for all env vars

### 3. Memory Limit
The function might be hitting memory limits during initialization.

**Evidence**: Memory used: 11.6MB (external: 3MB, heap: 8.6MB)

**Status**: This seems normal for initialization

### 4. Network/Import Timeout
The function might be timing out while trying to load external modules.

**Evidence**: Using ESM imports from `esm.sh`

**Potential issue**: Network delay loading Anthropic SDK

## What We Added

### 1. Startup Logging
```typescript
serve(async (req) => {
  console.log('Function started'); // ← First line, before anything else
  // ...
});
```

### 2. Comprehensive Error Logging
```typescript
} catch (error) {
  console.error('Error type:', typeof error);
  console.error('Error message:', error?.message);
  console.error('Error stack:', error?.stack);
  console.error('Error details:', JSON.stringify(error));
}
```

### 3. Unhandled Promise Rejection Catcher
```typescript
}).catch((error) => {
  console.error('=== UNHANDLED ERROR ===');
  console.error('Fatal error:', error);
});
```

## What to Look For in NEW Logs

After sending a test message, check logs for:

### Expected (Good):
```
Function started
=== WhatsApp webhook received ===
Method: POST
Headers: {...}
```

### If you see error logs:
```
=== WhatsApp webhook error (try-catch) ===
Error type: ...
Error message: ...
```

### If you see NOTHING:
This means the function is crashing BEFORE our logging starts, which indicates:
- Module import failure
- Runtime initialization error
- Supabase Edge Runtime issue

## Diagnostic Steps

### Step 1: Check if ANY logs appear
Send a message and check if you see **"Function started"** in logs.

**If YES**: Function is starting, error is later
**If NO**: Function is crashing during module loading

### Step 2: Check for error logs
Look for any error messages in the logs.

**If YES**: The error message will tell us what's wrong
**If NO but function crashed**: Silent failure, likely module import issue

### Step 3: Try the test modes
Send these messages to bypass complex code:

1. **"ping"** - Minimal code path
2. **"test"** - Database only
3. **Normal message** - Full flow

## Alternative Approach

If the function keeps crashing, we might need to:

### Option 1: Simplify Imports
Replace ESM imports with more stable versions:
```typescript
// Current (might be unstable):
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.28.0';

// Alternative (more stable):
import Anthropic from 'npm:@anthropic-ai/sdk@0.28.0';
```

### Option 2: Lazy Load Anthropic
Only load the Anthropic SDK when needed:
```typescript
// Instead of importing at the top
let Anthropic;
if (needsAI) {
  Anthropic = await import('https://esm.sh/@anthropic-ai/sdk@0.28.0');
}
```

### Option 3: Increase Function Resources
Add to the function config:
```typescript
// In supabase/functions/whatsapp-webhook/index.ts
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// Request more resources
Deno.env.set('FUNCTION_MEMORY', '512'); // Default is 256MB
```

## Next Action

**Please send "ping" message now** and check the NEW logs (after this deployment).

Look for:
1. "Function started" log
2. "Ping test - responding immediately" log
3. Any error messages
4. Response time

**Then report back**:
- Did you get a response?
- What logs do you see?
- What's the timestamp of the logs?

This will tell us if the function is even starting properly.

---

**Current Status**: Deployed with maximum error visibility
**Deployment Version**: 13
**Next Step**: Send "ping" and check logs
