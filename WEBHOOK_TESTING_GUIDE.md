# Webhook Testing & Verification Guide

## Prerequisites

1. Backend running: `npm run dev`
2. Railway PostgreSQL connected
3. Test data seeded: `npm run seed`
4. Paystack secret key in `.env`: `PAYSTACK_WEBHOOK_SECRET`

---

## Test 1: Successful Payment Flow

### 1A: Create Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-customer" \
  -d '{
    "items": [{"menuItemId": "<MENU_ID>", "quantity": 1}],
    "fulfillmentType": "PICKUP"
  }'
```

**Copy the `id` field** (this is ORDER_ID).

### 1B: Verify Order Status is PAYMENT_PENDING
```bash
curl http://localhost:3001/api/orders/<ORDER_ID>
```

Response should show: `"status": "PAYMENT_PENDING"`

### 1C: Simulate Successful Payment Webhook
```bash
.\webhook-simulator.ps1 <ORDER_ID> success
```

**Expected:**
- Order status changes to `PAID`
- Audit logs show:
  - `ORDER STATUS_CHANGE: PAYMENT_PENDING → PAID`
  - `PAYMENT CREATE`

### 1D: Verify Audit Trail
```sql
SELECT entity_type, action, previous_state, new_state, actor_type, reason 
FROM audit_logs 
WHERE entity_id = '<ORDER_ID>'
ORDER BY created_at;
```

Expected rows:
```
ORDER | CREATE | NULL | PAYMENT_PENDING | SYSTEM | Order created
ORDER | STATUS_CHANGE | PAYMENT_PENDING | CREATED | SYSTEM | Awaiting payment
PAYMENT | CREATE | NULL | INITIATED | SYSTEM | (blank)
ORDER | STATUS_CHANGE | PAYMENT_PENDING | PAID | SYSTEM | Payment confirmed via Paystack webhook
```

---

## Test 2: Idempotency — Duplicate Webhook

### 2A: Send Same Webhook Twice
```bash
.\webhook-simulator.ps1 <ORDER_ID> success
.\webhook-simulator.ps1 <ORDER_ID> success
```

**Expected:**
- First webhook: Order transitions to `PAID`
- Second webhook: Order stays `PAID` (no error)
- No duplicate audit entries

### 2B: Verify Idempotency
Query audit logs:
```sql
SELECT COUNT(*) as duplicate_count 
FROM audit_logs 
WHERE entity_id = '<ORDER_ID>' 
  AND action = 'STATUS_CHANGE' 
  AND new_state = 'PAID';
```

Should return: **1** (only one transition recorded)

---

## Test 3: Invalid Signature (Security)

### 3A: Send Webhook with Wrong Signature
```bash
curl -X POST http://localhost:3001/api/orders/payment/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: wrong_signature_here" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "MAI-test-12345",
      "status": "success",
      "amount": 250000
    }
  }'
```

**Expected Response:**
```json
{"error": "Invalid webhook signature"}
```

HTTP Status: **401**

### 3B: Verify Order NOT Modified
Query order status - should still be `PAYMENT_PENDING`.

---

## Test 4: Non-Existent Order

### 4A: Send Webhook for Fake Order ID
```bash
.\webhook-simulator.ps1 "fake-order-uuid" success
```

**Expected:**
- Error response: `Payment not found` or `Order not found`
- Order status unchanged
- Audit logs show attempt (or ignored gracefully)

---

## Test 5: Payment Rejection + Refund

### 5A: Create Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-customer" \
  -d '{
    "items": [{"menuItemId": "<MENU_ID>", "quantity": 1}],
    "fulfillmentType": "DELIVERY",
    "deliveryAddress": "Test Address"
  }'
```

Copy ORDER_ID.

### 5B: Simulate Successful Payment
```bash
.\webhook-simulator.ps1 <ORDER_ID> success
```

Order should be `PAID`.

### 5C: Admin Rejects Order (Triggers Refund)
```bash
curl -X PATCH http://localhost:3001/api/orders/<ORDER_ID>/status \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin-001" \
  -d '{
    "status": "REFUNDING",
    "reason": "Out of stock"
  }'
```

**Expected:**
- Order status: `REFUNDING`
- Audit log: `STATUS_CHANGE: PAID → REFUNDING`
- Refund initiated (in real scenario, would call Paystack API)

### 5D: Simulate Refund Webhook
```bash
.\webhook-simulator.ps1 <ORDER_ID> refund
```

**Expected:**
- Order status: `REFUNDED`
- Audit log: `STATUS_CHANGE: REFUNDING → REFUNDED`

### 5E: Verify Complete Chain
```sql
SELECT entity_type, action, previous_state, new_state, reason, created_at
FROM audit_logs
WHERE entity_id = '<ORDER_ID>'
ORDER BY created_at;
```

Expected sequence:
```
ORDER | CREATE | NULL | PAYMENT_PENDING
ORDER | STATUS_CHANGE | PAYMENT_PENDING | CREATED
PAYMENT | CREATE | NULL | INITIATED
ORDER | STATUS_CHANGE | PAYMENT_PENDING | PAID | Payment confirmed
ORDER | STATUS_CHANGE | PAID | REFUNDING | Out of stock
ORDER | STATUS_CHANGE | REFUNDING | REFUNDED | Refund confirmed
```

---

## Test 6: Failed Payment

### 6A: Create Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-customer" \
  -d '{
    "items": [{"menuItemId": "<MENU_ID>", "quantity": 1}],
    "fulfillmentType": "PICKUP"
  }'
```

Copy ORDER_ID.

### 6B: Simulate Failed Payment
```bash
.\webhook-simulator.ps1 <ORDER_ID> failed
```

**Expected:**
- Order status: `PAYMENT_FAILED`
- Audit log: `STATUS_CHANGE: PAYMENT_PENDING → PAYMENT_FAILED`

### 6C: Verify Status
```bash
curl http://localhost:3001/api/orders/<ORDER_ID>
```

Should show: `"status": "PAYMENT_FAILED"`

---

## Success Criteria Checklist

- [ ] Test 1: Successful payment flow works end-to-end
- [ ] Test 1D: Audit logs show complete chain
- [ ] Test 2: Duplicate webhooks are idempotent
- [ ] Test 3: Invalid signature rejected (401)
- [ ] Test 4: Non-existent order handled gracefully
- [ ] Test 5: Refund flow works (PAID → REFUNDING → REFUNDED)
- [ ] Test 6: Failed payment logged correctly
- [ ] All audit logs are append-only (no duplicates for same event)
- [ ] Server survives restart (restart backend, check data persistence)

---

## Debugging Queries

### Check Payment Record
```sql
SELECT * FROM payments WHERE order_id = '<ORDER_ID>';
```

### Check All Audits for Order
```sql
SELECT * FROM audit_logs WHERE entity_id = '<ORDER_ID>' ORDER BY created_at;
```

### Check Webhook Events (Idempotency)
```sql
SELECT webhook_reference, event_type, processed_at FROM webhook_events;
```

### Count Status Changes for Order
```sql
SELECT COUNT(*) FROM audit_logs 
WHERE entity_id = '<ORDER_ID>' AND action = 'STATUS_CHANGE';
```

---

## Webhook Signature Verification (Manual)

If you need to manually create a webhook with correct signature:

```powershell
# Compute HMAC-SHA512
$secret = $env:PAYSTACK_WEBHOOK_SECRET
$payload = '{"event":"charge.success","data":{"reference":"MAI-test","status":"success"}}'
$hmac = New-Object System.Security.Cryptography.HMACSHA512
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret)
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))
$signature = [System.BitConverter]::ToString($hash).Replace("-", "").ToLower()

# Send with signature
curl -X POST http://localhost:3001/api/orders/payment/webhook `
  -H "Content-Type: application/json" `
  -H "x-paystack-signature: $signature" `
  -d $payload
```

---

## Next Steps

Once all tests pass:
1. ✅ Payments verified bulletproof
2. ⏳ Deploy to Railway (update webhook URL in Paystack dashboard)
3. ⏳ Test live Paystack integration
4. ⏳ Proceed to Phase 4: Frontend

**Status: Ready for execution**
