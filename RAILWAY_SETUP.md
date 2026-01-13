# Railway Setup + Mai Inji Backend Quick Start

## Step 1: Create Railway PostgreSQL Database (5 minutes)

1. Go to [railway.app](https://railway.app)
2. Sign up / log in
3. Click **"New Project"** → **"Database"** → **"PostgreSQL"**
4. Wait for database to initialize
5. Click on PostgreSQL service
6. Go to **"Connect"** tab
7. Copy the **Connection String** (looks like: `postgresql://user:password@host:port/railway`)

**IMPORTANT:** You need:
- Host
- Port (usually 5432)
- Username
- Password
- Database name

---

## Step 2: Update Backend `.env` File

In `mai-inji-backend/.env`, replace with your Railway credentials:

```env
NODE_ENV=development
PORT=3001

# Railway PostgreSQL (from Step 1)
DATABASE_URL=postgresql://RAILWAY_USER:RAILWAY_PASSWORD@RAILWAY_HOST:5432/RAILWAY_DB?sslmode=require

# Paystack (temporary test keys)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxx
```

**Note:** SSL mode is required for Railway. Do NOT remove `?sslmode=require`.

---

## Step 3: Install Dependencies

```bash
cd mai-inji-backend
npm install
```

---

## Step 4: Run Migrations (Create Schema)

```bash
npm run migrate
```

**Expected Output:**
```
🔄 Running database migrations...
✅ Database schema created successfully
```

If error → verify DATABASE_URL is correct.

---

## Step 5: Seed Test Data

```bash
npm run seed
```

**Expected Output:**
```
🌱 Seeding database...
✅ Database seeded successfully
```

Check Railway dashboard → you should see tables created.

---

## Step 6: Start Backend Server

```bash
npm run dev
```

**Expected Output:**
```
🚀 Mai Inji Backend running on http://localhost:3001
📝 Database: maiinji
🔐 Environment: development
```

---

## Step 7: Test API Endpoints (Validation)

Open another terminal and test:

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```

Expected:
```json
{"status":"ok","timestamp":"2026-01-09T..."}
```

### Test 2: Get Menu
```bash
curl http://localhost:3001/api/menu
```

Expected: Array of menu items (6 items from seed)

### Test 3: Create Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "x-user-id: customer-001" \
  -d '{
    "items": [
      {"menuItemId": "<MENU_ITEM_ID>", "quantity": 1}
    ],
    "fulfillmentType": "PICKUP"
  }'
```

Expected:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "order_number": "MAI-20260109-XXXX",
    "status": "PAYMENT_PENDING",
    "total_amount": 250000
  },
  "timestamp": "..."
}
```

---

## Step 8: Test Payment Flow (Critical)

### Get Menu Items First
```bash
curl http://localhost:3001/api/menu
```

Copy a `menu_item_id` from response.

### Create Test Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-customer" \
  -d '{
    "items": [
      {"menuItemId": "<ACTUAL_ID_FROM_MENU>", "quantity": 2}
    ],
    "fulfillmentType": "DELIVERY",
    "deliveryAddress": "123 Lafia Street"
  }'
```

Copy `order_id` from response.

### Initialize Payment
```bash
curl -X POST http://localhost:3001/api/orders/<ORDER_ID>/payment \
  -H "Content-Type: application/json" \
  -d '{"userEmail": "test@example.com"}'
```

Expected:
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

### Verify Order Status Changed
```bash
curl http://localhost:3001/api/orders/<ORDER_ID>
```

Should show: `"status": "PAYMENT_PENDING"`

---

## Step 9: Test Audit Trail

Query the database directly from Railway dashboard:

```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
```

You should see:
- ORDER CREATE
- STATUS_CHANGE (CREATED → PAYMENT_PENDING)
- PAYMENT CREATE

---

## Success Criteria

✅ Backend runs without errors
✅ Menu API returns items
✅ Can create orders
✅ Order status transitions work
✅ Audit logs populated
✅ Railway dashboard shows data

If all pass → **Phase 2.5 is complete**.

---

## Troubleshooting

**"connection refused"**
- Verify DATABASE_URL is correct
- Check Railway dashboard for database status
- Ensure `?sslmode=require` is in URL

**"relation does not exist"**
- Run `npm run migrate` again
- Check for migration errors

**"authentication failed"**
- Copy credentials again from Railway
- No typos in password

---

## Next: Frontend Development

Once all tests pass, you proceed to:
1. Customer UI (menu browse, cart, checkout)
2. Admin dashboard (order status management)
3. Live Paystack integration (test mode)

**Status: Ready to begin Railway setup**
