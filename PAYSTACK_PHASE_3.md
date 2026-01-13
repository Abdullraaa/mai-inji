# Phase 3 — Paystack Webhook Verification Setup

## Overview

Payment is **critical path infrastructure**. This phase:
- Configures Paystack test environment
- Implements webhook verification (cryptographic signature validation)
- Tests idempotency (duplicate webhooks don't corrupt state)
- Automates refunds via webhook
- Verifies full audit trail

---

## Part 1: Get Paystack Test Keys

### Step 1A: Create Paystack Account

1. Go to [paystack.com](https://paystack.com)
2. Sign up (requires Nigerian bank account for KYC)
3. Go to **Settings** → **API Keys & Webhooks**
4. Copy both keys (keep SECRET key secure):

```
Public Key: pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Secret Key: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 1B: Configure Webhook URL

1. In Paystack dashboard → **Settings** → **Webhooks**
2. Set **Webhook URL** to:
```
https://your-railway-domain.railway.app/api/orders/payment/webhook
```

(Replace with your actual Railway domain)

3. Copy **Webhook Secret** (for signature verification):
```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 1C: Update Backend `.env`

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Part 2: Webhook Signature Verification (Security)

All Paystack webhooks include a signature header: `x-paystack-signature`

This proves the webhook came from Paystack, not an attacker.

### How It Works

1. Paystack sends: `x-paystack-signature: <hash>`
2. We compute: `HMAC-SHA512(raw_body, PAYSTACK_WEBHOOK_SECRET)`
3. We compare: computed hash == header hash
4. If match → webhook is authentic

---

## Part 3: Update Backend Webhook Endpoint

The webhook endpoint must:
1. Verify signature
2. Check idempotency (same webhook never processed twice)
3. Update payment + order status
4. Log to audit trail
5. Return 200 OK immediately (don't retry logic here)

### Webhook Handler Updates

See updated `src/routes/orders.ts` below.

---

## Part 4: Test Webhook Flow (Simulator)

We cannot test Paystack webhooks in development without:
A) Public endpoint (localhost doesn't work)
B) Paystack test account

**Solution:** Build a **webhook simulator** that mimics Paystack webhook signature.

This is in `webhook-simulator.ps1` (see below).

---

## Part 5: Idempotency Testing

Paystack may send webhook **multiple times** if network is flaky.

System must be idempotent:
- First webhook: `PAID`
- Duplicate webhook: Still `PAID` (no error, no double-processing)

Test scenarios:
1. Webhook arrives once → state changes
2. Webhook arrives twice → state stays same
3. Webhook with wrong signature → rejected
4. Webhook for non-existent order → logged but ignored

---

## Part 6: Audit Trail Expectations

For a successful payment flow, audit_logs should show:

```
ORDER CREATE (SYSTEM)
↓
ORDER STATUS_CHANGE: CREATED → PAYMENT_PENDING (SYSTEM)
↓
PAYMENT CREATE (SYSTEM, status=INITIATED)
↓
[Paystack webhook received]
↓
PAYMENT STATUS_CHANGE: INITIATED → SUCCESS (SYSTEM)
↓
ORDER STATUS_CHANGE: PAYMENT_PENDING → PAID (SYSTEM)
```

If this chain is broken → payment verification failed.

---

## Part 7: Failure Injection Scenarios

Test these intentionally:

### Scenario 1: Duplicate Webhook
```bash
# Send same webhook twice
./webhook-simulator.ps1 <ORDER_ID> success
./webhook-simulator.ps1 <ORDER_ID> success
# Expected: Both succeed, order still PAID (idempotent)
```

### Scenario 2: Invalid Signature
```bash
# Manually send webhook with wrong signature
curl -X POST http://localhost:3001/api/orders/payment/webhook \
  -H "x-paystack-signature: wrong_signature" \
  -d '...'
# Expected: Rejected with 401
```

### Scenario 3: Webhook for Non-Existent Order
```bash
# Send webhook for order_id that doesn't exist
./webhook-simulator.ps1 "fake-order-id" success
# Expected: Logged but ignored gracefully
```

### Scenario 4: Refund After Payment
```bash
# Pay for order
./webhook-simulator.ps1 <ORDER_ID> success
# Query: order.status = PAID

# Admin rejects
curl -X PATCH http://localhost:3001/api/orders/<ORDER_ID>/status \
  -H "x-user-id: admin-001" \
  -d '{"status": "REFUNDING", "reason": "Out of stock"}'
# Expected: REFUNDING state, refund initiated

# Refund webhook arrives
./webhook-simulator.ps1 <ORDER_ID> refund
# Expected: REFUNDED state
```

---

## Success Criteria

- [ ] Paystack keys configured in `.env`
- [ ] Webhook signature verification works
- [ ] Idempotency check prevents duplicates
- [ ] Order flow: PAYMENT_PENDING → PAID (via webhook)
- [ ] Refund flow: REFUNDING → REFUNDED (automatic)
- [ ] Audit logs show complete chain
- [ ] Invalid signatures rejected (401)
- [ ] Non-existent orders handled gracefully
- [ ] Duplicate webhooks don't corrupt state

---

## Next Steps After Verification

1. Deploy backend to Railway with webhook URL
2. Test with live Paystack test mode
3. Proceed to Phase 4: Frontend

---

**Status:** Ready for implementation
**Critical:** Payment must be bulletproof before UI work begins
