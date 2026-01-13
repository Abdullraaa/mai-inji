# Mai Inji v1 — Setup Guide

## Quick Start

### 1. PostgreSQL Database Setup (Railway)

See [RAILWAY_COMPLETE_GUIDE.md](RAILWAY_COMPLETE_GUIDE.md) for full setup.

**Quick version:**
1. Sign up to [railway.app](https://railway.app)
2. Create PostgreSQL database
3. Copy connection string
4. Create `.env` in `mai-inji-backend/`

### 2. Backend Setup

```bash
cd mai-inji-backend

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=localhost
# DB_USER=mai_inji_user
# DB_PASSWORD=your_secure_password
# PAYSTACK_SECRET_KEY=sk_test_xxxxx (from Paystack dashboard)

# Install dependencies
npm install

# Run migrations
npm run migrate

# Seed test data
npm run seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd mai-inji-frontend

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## API Endpoints (Phase 2)

### Menu
- `GET /api/menu` — Get all available menu items
- `GET /api/menu/:id` — Get menu item details

### Orders
- `POST /api/orders` — Create new order
- `GET /api/orders/:orderId` — Get order details
- `POST /api/orders/:orderId/payment` — Initialize Paystack payment
- `POST /api/orders/payment/verify` — Verify payment (webhook)
- `PATCH /api/orders/:orderId/status` — Update order status (admin)

---

## Project Structure

```
mai-inji-backend/
├── src/
│   ├── db/
│   │   ├── connection.ts      — PostgreSQL pool
│   │   ├── schema.sql         — Database schema
│   │   ├── migrate.ts         — Migration runner
│   │   └── seed.ts            — Test data
│   ├── services/
│   │   ├── orderService.ts    — Order logic
│   │   ├── menuService.ts     — Menu logic
│   │   └── paymentService.ts  — Paystack integration
│   ├── routes/
│   │   ├── menu.ts            — Menu endpoints
│   │   └── orders.ts          — Order endpoints
│   ├── middleware/
│   │   └── audit.ts           — Audit logging
│   ├── types.ts               — TypeScript types
│   ├── utils/
│   │   └── response.ts        — Response helpers
│   └── index.ts               — Express app
├── package.json
├── tsconfig.json
└── .env.example

mai-inji-frontend/
├── app/
│   ├── layout.tsx             — Root layout
│   └── page.tsx               — Home page
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.local.example
```

---

## Database Schema

**Tables:**
- `users` — Customers and admins
- `menu_categories` — Food categories
- `menu_items` — Individual food items
- `orders` — Customer orders
- `order_items` — Line items per order
- `payments` — Payment records (Paystack + Cash)
- `audit_logs` — Immutable system ledger
- `notifications` — User notifications

**Features:**
- ✅ Full audit trail (append-only)
- ✅ State machine enforcement (order lifecycle)
- ✅ Soft delete support (menu items)
- ✅ Webhook-driven payments
- ✅ Foreign key constraints (RESTRICT)

---

## Paystack Integration

1. **Get test keys from** [Paystack Dashboard](https://dashboard.paystack.com/)
2. **Add to `.env`:**
   ```
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   ```
3. **Flow:**
   - `POST /api/orders` → Create order
   - `POST /api/orders/:orderId/payment` → Get Paystack URL
   - Customer pays → Paystack webhook → `POST /api/orders/payment/verify`
   - Order moves to `PAID` status

---

## Deployment Checklist

- [ ] Database migrated and seeded
- [ ] `.env` configured with real Paystack keys
- [ ] Backend tested locally (all routes)
- [ ] Frontend UI built (menu browse, checkout)
- [ ] Audit logs verified
- [ ] Payment flow tested (test card: 4111111111111111)
- [ ] Deployed to Railway/Render
- [ ] CORS configured for production domain
- [ ] Daily backup of PostgreSQL

---

## Status: Foundation Complete

**Phase 0 ✅** — Domain model, order lifecycle, audit strategy
**Phase 1 ✅** — Database schema, migrations, seed data
**Phase 2 ✅** — Backend core (orders, menu, payments)
**Phase 3 ⏳** — Frontend (customer UI)
**Phase 4 ⏳** — Admin dashboard
**Phase 5 ⏳** — Hardening & deployment

---

**Created:** 2026-01-09
**Version:** 1.0.0 (Foundation)
**Owner:** Janga (Solo Founder)
