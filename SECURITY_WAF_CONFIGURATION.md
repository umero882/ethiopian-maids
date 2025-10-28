# Web Application Firewall (WAF) Configuration Guide

**Purpose:** Additional security layer for Stripe webhook endpoints
**Created:** 2025-10-15
**Provider:** Cloudflare (Recommended) or Supabase Edge Functions with custom WAF rules

---

## Overview

A Web Application Firewall (WAF) provides an additional layer of security by:
- Filtering malicious traffic before it reaches your application
- Protecting against DDoS attacks
- Blocking common attack patterns (SQL injection, XSS, etc.)
- Rate limiting at the edge
- Geographic restrictions

---

## Option 1: Cloudflare WAF (Recommended)

### Prerequisites
- Cloudflare account (Free tier available)
- Domain pointed to Cloudflare nameservers
- Stripe webhook endpoint: `https://your-domain.com/functions/v1/stripe-webhook`

### Step 1: Set Up Cloudflare

1. **Add Domain to Cloudflare**
   ```
   Sign in to Cloudflare → Add Site → Enter your domain
   Update nameservers at your domain registrar
   ```

2. **Configure DNS**
   ```
   A record: @ → Supabase IP
   CNAME: functions → kstoksqbhmxnrmspfywm.supabase.co
   ```

3. **Enable Proxy (Orange Cloud)**
   - Click orange cloud icon next to webhook endpoint
   - This routes traffic through Cloudflare

### Step 2: Create WAF Rules

Navigate to: **Security → WAF → Create Rule**

#### Rule 1: Block Non-Stripe IPs

```
Rule Name: Block Non-Stripe IPs
Expression:
(http.request.uri.path contains "/stripe-webhook") and
(not ip.src in {
  3.18.12.63
  3.130.192.231
  13.235.14.237
  13.235.122.149
  18.211.135.69
  35.154.171.200
  52.15.183.38
  54.88.130.119
  54.88.130.237
  54.187.174.169
  54.187.205.235
  54.187.216.72
})

Action: Block
```

#### Rule 2: Rate Limiting for Webhooks

```
Rule Name: Webhook Rate Limit
Expression:
(http.request.uri.path contains "/stripe-webhook")

Action: Rate Limit
- Requests: 100 per minute
- Duration: 60 seconds
- Action: Block
```

#### Rule 3: Block Known Attack Patterns

```
Rule Name: Block Common Attacks
Expression:
(http.request.uri.query contains "union select") or
(http.request.uri.query contains "<script") or
(http.request.uri.query contains "../") or
(http.request.headers["user-agent"] contains "sqlmap") or
(http.request.headers["user-agent"] contains "nikto")

Action: Block
```

#### Rule 4: Require Valid Stripe Signature

```
Rule Name: Require Stripe Signature
Expression:
(http.request.uri.path contains "/stripe-webhook") and
(not http.request.headers["stripe-signature"] exists)

Action: Block
```

#### Rule 5: Block Suspicious User Agents

```
Rule Name: Block Suspicious User Agents
Expression:
(http.request.headers["user-agent"] eq "") or
(lower(http.request.headers["user-agent"]) contains "bot") or
(lower(http.request.headers["user-agent"]) contains "scanner") or
(lower(http.request.headers["user-agent"]) contains "crawler")

Action: Challenge (CAPTCHA)
```

### Step 3: Configure DDoS Protection

Navigate to: **Security → DDoS**

```
DDoS Protection: Enabled
Sensitivity Level: High
Advanced TCP Protection: Enabled
```

### Step 4: Enable Bot Protection

Navigate to: **Security → Bots**

```
Bot Fight Mode: Enabled (Free tier)
Or
Super Bot Fight Mode: Enabled (Pro tier)

Configuration:
- Definitely Automated: Block
- Likely Automated: Challenge
- Verified Bots: Allow (e.g., Stripe)
```

### Step 5: Configure Security Level

Navigate to: **Security → Settings**

```
Security Level: High
Challenge Passage: 30 minutes
Browser Integrity Check: Enabled
Privacy Pass Support: Enabled
```

---

## Option 2: Supabase Edge Functions WAF (Custom)

If you can't use Cloudflare, implement WAF rules in Edge Functions:

### Custom WAF Middleware

Already implemented in `stripe-webhook/index.ts`:

```typescript
✅ Rate Limiting (100 req/min)
✅ IP Whitelisting (Stripe IPs only)
✅ Signature Verification
✅ Request Logging
```

### Additional Custom Rules (Optional)

Add to webhook function:

```typescript
// Block suspicious User-Agents
const userAgent = req.headers.get('user-agent') || '';
const suspiciousAgents = ['sqlmap', 'nikto', 'scanner', 'bot'];
if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
  return new Response(
    JSON.stringify({ error: 'Forbidden' }),
    { status: 403 }
  );
}

// Block requests with suspicious query parameters
const url = new URL(req.url);
const suspiciousPatterns = ['union', 'select', '<script', '../', '..\\'];
const queryString = url.search.toLowerCase();
if (suspiciousPatterns.some(pattern => queryString.includes(pattern))) {
  return new Response(
    JSON.stringify({ error: 'Invalid request' }),
    { status: 400 }
  );
}
```

---

## Option 3: Supabase Network Restrictions

Navigate to: **Supabase Dashboard → Settings → API**

### Enable IP Restrictions

```
Allowed IP Addresses:
- Add all Stripe webhook IPs (see list above)
- Add your office/home IP for testing
```

**Note:** This requires Supabase Pro plan ($25/month)

---

## Testing WAF Configuration

### Test 1: Verify Stripe IPs Work

```bash
# Should succeed (Stripe IP)
curl -X POST https://your-domain.com/functions/v1/stripe-webhook \
  -H "stripe-signature: test" \
  -d '{"test": true}'
```

### Test 2: Verify Non-Stripe IPs Blocked

```bash
# Should return 403 Forbidden
curl -X POST https://your-domain.com/functions/v1/stripe-webhook \
  -H "X-Forwarded-For: 1.2.3.4" \
  -d '{"test": true}'
```

### Test 3: Verify Rate Limiting

```bash
# Run 101 requests in 1 minute - last request should return 429
for i in {1..101}; do
  curl -X POST https://your-domain.com/functions/v1/stripe-webhook \
    -H "stripe-signature: test"
done
```

### Test 4: Verify Attack Patterns Blocked

```bash
# Should return 400 or 403
curl "https://your-domain.com/functions/v1/stripe-webhook?test=<script>alert(1)</script>"
curl "https://your-domain.com/functions/v1/stripe-webhook?test=' union select * from users"
```

---

## Monitoring WAF Activity

### Cloudflare Analytics

Navigate to: **Analytics → Security**

Monitor:
- Blocked requests
- Top blocked IPs
- Attack patterns
- Rate limit hits

### Custom Monitoring (Supabase)

Already implemented in `webhook_event_logs` table:

```sql
-- Check blocked requests
SELECT COUNT(*) FROM webhook_event_logs
WHERE response_status IN (403, 429)
  AND created_at > NOW() - INTERVAL '1 hour';

-- Top blocked IPs
SELECT client_ip, COUNT(*)
FROM webhook_event_logs
WHERE response_status = 403
GROUP BY client_ip
ORDER BY COUNT(*) DESC;
```

---

## WAF Maintenance

### Monthly Tasks

1. **Update Stripe IP List**
   - Check: https://stripe.com/docs/ips
   - Update WAF rules if IPs changed

2. **Review Blocked Requests**
   - Check for false positives
   - Whitelist legitimate traffic

3. **Analyze Attack Patterns**
   - Look for new attack vectors
   - Update WAF rules accordingly

### Quarterly Tasks

1. **Security Audit**
   - Test WAF with penetration testing tools
   - Verify all rules are working

2. **Performance Review**
   - Check WAF impact on latency
   - Optimize rules if needed

---

## Cost Comparison

| Provider | Free Tier | Pro Tier | Enterprise |
|----------|-----------|----------|------------|
| **Cloudflare WAF** | Limited rules | $20/mo | Custom |
| **Supabase Pro** | N/A | $25/mo | Custom |
| **AWS WAF** | Pay per rule | ~$30/mo | Custom |
| **Custom (DIY)** | Free | Free | Free |

**Recommendation:** Start with Custom DIY (already implemented), upgrade to Cloudflare Pro when traffic grows.

---

## Security Best Practices

### DO:
✅ Keep Stripe IP list updated
✅ Monitor blocked requests daily
✅ Test WAF rules in staging first
✅ Log all security events
✅ Review WAF logs weekly

### DON'T:
❌ Block all traffic during testing
❌ Forget to whitelist legitimate IPs
❌ Disable WAF without approval
❌ Ignore false positive alerts
❌ Use overly aggressive rules

---

## Emergency WAF Bypass

If WAF blocks legitimate Stripe webhooks:

### Option 1: Disable Specific Rule (Cloudflare)
```
Security → WAF → Find Rule → Disable
```

### Option 2: Disable IP Whitelist (Supabase)
```bash
# Set environment variable
supabase secrets set STRIPE_IP_WHITELIST_ENABLED=false
```

### Option 3: Temporary Whitelist IP
```
Add IP to whitelist temporarily
Remove after incident resolved
```

---

## Support & Troubleshooting

### Issue: Legitimate Webhooks Blocked

**Solution:**
1. Check Cloudflare/Supabase logs
2. Verify Stripe IP in whitelist
3. Temporarily disable IP whitelist
4. Check webhook signature header

### Issue: Too Many False Positives

**Solution:**
1. Review WAF rules
2. Lower sensitivity
3. Whitelist specific patterns
4. Monitor for 24 hours

### Issue: DDoS Attack

**Solution:**
1. Enable "Under Attack Mode" (Cloudflare)
2. Tighten rate limits (10 req/min)
3. Block attacking IPs
4. Contact Stripe support
5. Monitor webhook event logs

---

## Compliance & Certifications

### Cloudflare WAF
- PCI DSS 3.2.1 Compliant
- ISO 27001 Certified
- SOC 2 Type II
- GDPR Compliant

### Custom WAF (Supabase)
- Inherits Supabase security certifications
- Your responsibility to maintain compliance
- Audit logs available

---

## Next Steps

1. ✅ **Immediate:** Deploy custom WAF rules (already done)
2. 📅 **Week 1:** Set up Cloudflare account
3. 📅 **Week 2:** Configure Cloudflare WAF rules
4. 📅 **Week 3:** Monitor and tune rules
5. 📅 **Month 1:** Review performance and costs

---

## Additional Resources

- Cloudflare WAF Docs: https://developers.cloudflare.com/waf/
- Stripe Webhook IPs: https://stripe.com/docs/ips
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase Security: https://supabase.com/docs/guides/security

---

**Status:** Custom WAF implemented in `stripe-webhook/index.ts`
**Next Review:** 2025-11-15
