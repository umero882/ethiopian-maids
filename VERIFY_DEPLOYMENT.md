# Verify Latest Webhook Deployment

## Current Deployment Status

✅ **Latest deployment**: Just completed
✅ **Query fixed**: Using `date_of_birth` instead of `age`
✅ **Timeout handling**: Added
✅ **Environment checks**: Added
✅ **Enhanced logging**: Active

## Verification Steps

### 1. Verify Correct Code is Deployed

The webhook at line 404 should have:
```typescript
.select('id, full_name, date_of_birth, experience_years, skills, availability_status, current_location, nationality, languages')
```

**Verified**: ✅ Confirmed in source file

### 2. Send Fresh Test Message

**Important**: Send a NEW WhatsApp message NOW (after this latest deployment)

Example messages:
- "I need a cleaner in Qatar"
- "Show me available maids"
- "Looking for baby care specialist"

### 3. Check LATEST Logs Only

⚠️ **IMPORTANT**: Ignore old logs!

1. Go to: https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/functions
2. Click on `whatsapp-webhook`
3. Click "Logs" tab
4. Look for logs with timestamp AFTER our deployment (check current time)
5. Ignore any logs from 13:37 or earlier - those are OLD

### 4. Expected Log Sequence

You should see (in order):

```
1. "=== WhatsApp webhook received ==="
2. "Method: POST"
3. "Supabase client created"
4. "Parsed Twilio data: {...}"
5. "Phone: +1234567890"
6. "Message: I need a cleaner"
7. "Storing incoming message..."
8. "Message stored successfully"
9. "Anthropic API key found"
10. "Calling Claude API..."
11. "Messages count: X"
12. "Claude API responded"
13. "Response content blocks: 2"
14. "Executing tool: check_maid_availability"
15. "Searching maids with filters: {...}"
16. "Executing maid query..."
17. "Found 2 maids" (or similar)
```

### 5. What Each Log Means

| Log Message | Meaning | Status |
|------------|---------|---------|
| "=== WhatsApp webhook received ===" | Request arrived | ✅ |
| "Supabase client created" | Database connected | ✅ |
| "Anthropic API key found" | AI ready | ✅ |
| "Claude API responded" | AI processed request | ✅ |
| "Found X maids" | Database query worked | ✅ |
| "Database error: age" | **OLD ERROR - Ignore** | ⚠️ |
| "EarlyDrop" | **OLD ERROR - Ignore** | ⚠️ |

### 6. If You See Database Error Again

If you see "column age does not exist" in FRESH logs (with new timestamp):

**Possible causes**:
1. Deployment didn't complete (unlikely - we saw success)
2. Caching issue (Supabase edge runtime cache)
3. Multiple versions deployed to different regions

**Solution**:
```bash
# Force clear and redeploy
npx supabase functions delete whatsapp-webhook
npx supabase functions deploy whatsapp-webhook
```

### 7. If You See "Claude API timeout"

This means Claude is taking too long (>25 seconds).

**Check**:
- Is ANTHROPIC_API_KEY valid?
- Is Anthropic API working? (check https://status.anthropic.com)
- Are you hitting rate limits?

### 8. If You See Configuration Error

If logs show "Missing Supabase environment variables" or "ANTHROPIC_API_KEY not found":

**Solution**:
1. Go to: https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/settings/functions
2. Click "Edge Functions"
3. Find "Environment Variables" section
4. Ensure `ANTHROPIC_API_KEY` exists and is not empty

## Timeline of Fixes

| Time | Action | Status |
|------|--------|--------|
| Earlier | Initial deployment with `age` column | ❌ Error |
| 13:37 | Old error logged | ❌ Old |
| Recent | Fixed to use `date_of_birth` | ✅ Fixed |
| Recent | Added timeout handling | ✅ Added |
| Recent | Added environment checks | ✅ Added |
| Just now | Final deployment | ✅ Latest |

## Quick Test Command

To verify database query works:
```bash
cd "database/test-data"
DATABASE_URL="..." node test_webhook.cjs
```

This tests the exact same query the webhook uses.

## Success Criteria

✅ User sends WhatsApp message
✅ Logs show all steps completing
✅ No "age" errors in NEW logs
✅ User receives response with maid details
✅ Response time < 30 seconds

## Troubleshooting Matrix

| Symptom | Old Issue? | Action |
|---------|-----------|--------|
| "age does not exist" with old timestamp | YES | Ignore, check new logs |
| "age does not exist" with new timestamp | NO | Report immediately |
| "EarlyDrop" with old timestamp | YES | Ignore, check new logs |
| "EarlyDrop" with new timestamp | NO | Check timeout logs |
| No logs at all | MAYBE | Check Twilio webhook URL |
| "Configuration error" | NO | Add ANTHROPIC_API_KEY |

---

**Next Step**: Send a new test message and check for logs with timestamps AFTER this deployment!
