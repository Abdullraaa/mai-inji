# Railway PostgreSQL Setup — Complete Guide

## Part 1: Create Railway Account & PostgreSQL Database

### Step 1A: Sign Up to Railway
1. Go to https://railway.app
2. Click **"Start for Free"** or sign in if you have an account
3. Authenticate with GitHub or email

### Step 1B: Create PostgreSQL Project
1. Click **"New Project"**
2. Select **"Database"**
3. Click **"PostgreSQL"**
4. Wait for database to provision (~30 seconds)

### Step 1C: Get Connection Credentials
1. Once PostgreSQL is created, click on it
2. Go to **"Connect"** tab
3. You'll see connection options. Choose **"Postgres CLI"** or **"Connection String"**

**Copy this information:**
```
Host: railway.app (or similar)
Port: 5432
Username: postgres (or your chosen name)
Password: [shown in Railway dashboard]
Database: railway
```

Or copy the full connection string (looks like):
```
postgresql://user:password@host:port/database
```

---

## Part 2: Configure Backend for Railway

### Step 2A: Create `.env` File

In `mai-inji-backend/`, create (or update) `.env`:

```env
NODE_ENV=development
PORT=3001

# Railway PostgreSQL Connection
DATABASE_URL=postgresql://RAILWAY_USER:RAILWAY_PASSWORD@RAILWAY_HOST:5432/railway?sslmode=require

# Paystack (test keys - update later with real keys)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxx
```

**CRITICAL:** Replace `RAILWAY_USER`, `RAILWAY_PASSWORD`, `RAILWAY_HOST` with actual values from Railway dashboard.

### Step 2B: Verify `.env` is in `.gitignore`

```bash
cat .gitignore
```

Should contain `.env` (so secrets never commit).

---

## Part 3: Initialize Backend

### Step 3A: Install Dependencies

```bash
cd mai-inji-backend
npm install
```

### Step 3B: Run Migrations

```bash
npm run migrate
```

**Expected output:**
```
🔄 Running database migrations...
✅ Database schema created successfully
```

**If error:**
- Check DATABASE_URL in `.env`
- Verify SSL mode: should be `?sslmode=require`
- Test connection directly in Railway dashboard SQL client

### Step 3C: Seed Test Data

```bash
npm run seed
```

**Expected output:**
```
🌱 Seeding database...
✅ Database seeded successfully
```

---

## Part 4: Start Backend Server

### Step 4A: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
🚀 Mai Inji Backend running on http://localhost:3001
📝 Database: railway
🔐 Environment: development
```

### Step 4B: Verify Server is Running

In another terminal:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-01-09T..."}
```

---

## Part 5: Validate Database & Data

### Step 5A: Check Data in Railway

1. Go to Railway dashboard
2. Click PostgreSQL service
3. Go to **"Data"** tab
4. You should see tables:
   - `users`
   - `menu_categories`
   - `menu_items`
   - `orders`
   - `order_items`
   - `payments`
   - `audit_logs`
   - `notifications`

### Step 5B: Query Test Data

Click **"Query"** and run:
```sql
SELECT COUNT(*) FROM menu_items;
```

Should return: `6` (from seed)

---

## Part 6: Test Order Flow End-to-End

### Step 6A: Get Menu

```bash
curl http://localhost:3001/api/menu
```

Response should be JSON array with 6 menu items. **Copy a menu_item_id**.

### Step 6B: Create Test Order

Replace `<MENU_ITEM_ID>` with actual ID from menu:

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-customer-001" \
  -d '{
    "items": [
      {"menuItemId": "<MENU_ITEM_ID>", "quantity": 2}
    ],
    "fulfillmentType": "DELIVERY",
    "deliveryAddress": "123 Lafia Street, Lafia"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "order_number": "MAI-20260109-XXXX",
    "user_id": "test-customer-001",
    "status": "PAYMENT_PENDING",
    "subtotal": 500000,
    "delivery_fee": 50000,
    "total_amount": 550000,
    "fulfillment_type": "DELIVERY",
    "delivery_address": "123 Lafia Street, Lafia",
    "created_at": "2026-01-09T...",
    "updated_at": "2026-01-09T..."
  },
  "timestamp": "..."
}
```

**Copy the `order_id` for next test.**

### Step 6C: Initialize Payment

Replace `<ORDER_ID>` with actual order ID:

```bash
curl -X POST http://localhost:3001/api/orders/<ORDER_ID>/payment \
  -H "Content-Type: application/json" \
  -d '{"userEmail": "test@example.com"}'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "...",
    "authorizationUrl": "https://checkout.paystack.com/...",
    "reference": "MAI-..."
  }
}
```

### Step 6D: Verify Order Status

```bash
curl http://localhost:3001/api/orders/<ORDER_ID>
```

Should show:
```json
"status": "PAYMENT_PENDING"
```

### Step 6E: Check Audit Trail

In Railway dashboard SQL query:
```sql
SELECT entity_type, action, previous_state, new_state, actor_type, reason, created_at 
FROM audit_logs 
WHERE entity_id = '<ORDER_ID>'
ORDER BY created_at;
```

You should see:
1. ORDER CREATE (SYSTEM actor)
2. ORDER STATUS_CHANGE (CREATED → PAYMENT_PENDING)
3. PAYMENT CREATE (SYSTEM actor)

---

## Success Criteria ✅

- [ ] Backend connects to Railway PostgreSQL
- [ ] Migrations run without errors
- [ ] Menu items are seeded (6 items)
- [ ] Can create orders via API
- [ ] Order status transitions to PAYMENT_PENDING
- [ ] Payment initialization works
- [ ] Audit logs are populated
- [ ] Server survives restart

---

## Next Steps

Once all tests pass:
1. **Frontend Development** — Customer UI (menu, cart, checkout)
2. **Admin Dashboard** — Order management
3. **Live Paystack Integration** — Real payment testing

---

## Troubleshooting

### Connection Error: "connection refused"
```
Error: connect ECONNREFUSED
```

**Fix:**
- Verify DATABASE_URL in `.env`
- Check Railway dashboard: database should show as "Running"
- Ensure `?sslmode=require` is in URL
- Wait 10 seconds and try again

### Error: "relation does not exist"
```
Error: relation "orders" does not exist
```

**Fix:**
```bash
npm run migrate
```

Migrations may not have run.

### Error: "authentication failed"
```
Error: role "user" does not exist
```

**Fix:**
- Copy credentials again from Railway
- Check for typos in username/password
- Test in Railway's built-in SQL client first

### Error: "SSL certificate error"
```
Error: self-signed certificate
```

**Fix:**
Already handled: `?sslmode=require` in DATABASE_URL

---

## Environment Variables (Reference)

| Variable | Example | Notes |
|----------|---------|-------|
| NODE_ENV | development | Never use "production" locally |
| PORT | 3001 | Backend server port |
| DATABASE_URL | postgresql://... | From Railway dashboard |
| PAYSTACK_SECRET_KEY | sk_test_... | From Paystack dashboard (later) |
| PAYSTACK_WEBHOOK_SECRET | whsec_... | From Paystack dashboard (later) |

---

**Status:** Ready for execution
**Time to completion:** 15-20 minutes
**Success probability:** 95% (given correct Railway credentials)
