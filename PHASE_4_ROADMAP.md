# Phase 4 — Frontend & Admin Dashboard Roadmap

**Status:** Ready to begin
**Foundation:** Phase 3 (Backend + Payments) locked and verified
**Timeline:** 2-3 weeks for full implementation
**Architecture:** Next.js (React) with TypeScript

---

## Phase 4 Overview

Build the user-facing interfaces on top of the bulletproof backend:

1. **Customer UI** — Menu browsing, cart management, checkout, order tracking
2. **Admin Dashboard** — Order management, refunds, sales analytics
3. **Live Integration** — End-to-end payment flows with real Paystack webhooks

---

## Detailed Deliverables

### 4A: Customer UI (Week 1-2)

**Components:**
- `MenuBrowser` — Display categories + items, search, filtering
- `Cart` — Add/remove items, quantity adjustment, subtotal display
- `CheckoutFlow` — Customer info, address, payment method selection
- `OrderStatus` — Real-time order tracking, status history
- `OrderHistory` — List of past orders with details

**Key Features:**
- Mobile-first responsive design
- OTP-based authentication (phone number)
- Guest checkout option
- Delivery vs pickup selection
- Address validation (Lafia-only v1)
- Real-time order status via polling/WebSocket

**APIs Used:**
- `GET /api/menu`
- `POST /api/orders` (create order)
- `POST /api/orders/:id/payment` (initialize Paystack)
- `GET /api/orders/:id` (track status)
- Paystack webhook callback handler

**Success Criteria:**
- [ ] Can browse menu without login
- [ ] Can add items to cart
- [ ] Can complete checkout (guest or registered)
- [ ] Payment redirects to Paystack checkout
- [ ] Order tracking shows real-time status
- [ ] Mobile layout responsive (<= 768px)

---

### 4B: Admin Dashboard (Week 2-3)

**Components:**
- `OrdersList` — Paginated list of all orders, filterable by status
- `OrderDetail` — Full order view, status management, refund interface
- `MenuManager` — Add/edit/delete menu items, bulk operations
- `AnalyticsDashboard` — Daily revenue, order count, popular items
- `RefundCenter` — Refund requests, status tracking

**Key Features:**
- Email + password authentication (secure)
- Order status transitions with confirmation
- Refund initiation (auto-triggers webhook)
- Menu item availability toggle
- Sales reports (daily/weekly/monthly)
- Audit log viewer

**APIs Used:**
- `PATCH /api/orders/:id/status` (update order)
- `GET /api/orders` (list all) — needs implementation
- `POST /api/orders/:id/refund` — needs implementation
- `PUT /api/menu/:id` (update menu item)
- `DELETE /api/menu/:id` (soft delete)

**Success Criteria:**
- [ ] Can view all orders
- [ ] Can transition order status (PAYMENT_PENDING → ACCEPTED → etc.)
- [ ] Can initiate refunds
- [ ] Refund triggers webhook automatically
- [ ] Can manage menu (add/edit/remove items)
- [ ] Can view audit logs for any order

---

### 4C: Infrastructure & DevOps (Throughout)

**Database:**
- Migrate from local to Railway PostgreSQL
- Verify backups enabled
- Test data recovery

**Frontend Hosting:**
- Deploy Next.js to Vercel (free tier)
- Enable auto-deployments from git
- Configure environment variables

**Monitoring:**
- Error logging (Sentry)
- Payment webhook monitoring
- Order status anomalies

**Testing:**
- End-to-end tests (Playwright)
- Component tests (Jest)
- API integration tests
- Live payment flow tests

**Documentation:**
- User guide for customers
- Admin manual for operations
- Deployment runbook
- Troubleshooting guide

---

## Technical Decisions (Phase 4)

### Frontend Framework: Next.js 14 + React 18
**Why:**
- Server-side rendering (SEO for menu discovery)
- API routes (optional middleware)
- Image optimization (food photos)
- Built-in TypeScript support
- Vercel deployment (seamless)

### UI Library: Tailwind CSS + Headless UI
**Why:**
- Mobile-first utility classes
- Fast iteration (no custom CSS)
- Dark mode support
- Accessibility built-in
- Zero runtime overhead

### Authentication
**Customer:** OTP via phone (Twilio integration, v4.1)
**Admin:** Email + password with JWT tokens

### State Management
**Simple:** React Context + hooks (no Redux needed)
**Database queries:** SWR or React Query (caching, real-time)

### Payment Integration
**Paystack Checkout:** Redirect + webhook verification (done in Phase 3)
**No payment processing on frontend** (all server-side)

---

## Implementation Sequence

### Week 1: Foundation + Customer UI

**Day 1-2:**
- [ ] Set up Next.js project
- [ ] Configure TypeScript + Tailwind
- [ ] Build basic layout (header, footer, navigation)
- [ ] Set up API client (axios with interceptors)

**Day 3-4:**
- [ ] Build MenuBrowser component
- [ ] Fetch menu from backend
- [ ] Implement search + filtering
- [ ] Mobile responsiveness

**Day 5-6:**
- [ ] Build Cart component (React Context for state)
- [ ] Add to cart / remove / quantity adjust
- [ ] Cart persistence (localStorage)

**Day 7:**
- [ ] Integration test: Menu → Cart → Checkout

### Week 2: Checkout + Payment

**Day 1-3:**
- [ ] Build CheckoutFlow component
- [ ] Collect customer info (name, phone, address)
- [ ] Integrate Paystack checkout
- [ ] Handle payment callback

**Day 4-5:**
- [ ] Build OrderStatus component
- [ ] Poll backend for real-time status
- [ ] Display status history from audit logs

**Day 6-7:**
- [ ] End-to-end payment flow test
- [ ] Live Paystack integration (test mode)

### Week 3: Admin Dashboard

**Day 1-3:**
- [ ] Build admin authentication (JWT)
- [ ] Build OrdersList + OrderDetail
- [ ] Implement status transitions
- [ ] Add refund interface

**Day 4-5:**
- [ ] Build MenuManager
- [ ] Build AnalyticsDashboard (basic charts)

**Day 6-7:**
- [ ] Testing + deployment
- [ ] Monitoring setup

---

## API Enhancements Needed

Backend currently has:
- ✅ Create order
- ✅ Get order by ID
- ✅ Update order status
- ✅ Initialize payment
- ✅ Webhook verification
- ❌ List all orders (needs pagination, filtering)
- ❌ Get menu by category
- ❌ Refund endpoint
- ❌ Analytics queries

**Frontend blockers:** None critical. Can use workarounds for v1.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Paystack webhook timeout | Already handled: immediate 200 OK response |
| Lost cart on refresh | localStorage persistence |
| Slow menu load | Image optimization + caching |
| Order status stale | Poll backend every 2 seconds |
| Admin unauthorized access | JWT + httpOnly cookies |
| Payment double-charge | Idempotency via webhook reference (Phase 3) |

---

## Success Definition (Phase 4 Complete)

**Customer Journey:**
- [ ] Browse menu without account
- [ ] Add items to cart
- [ ] Complete guest checkout
- [ ] Pay via Paystack (test card: 4111111111111111)
- [ ] Receive order confirmation
- [ ] Track order status in real-time
- [ ] Receive refund if order rejected

**Admin Journey:**
- [ ] Log in to dashboard
- [ ] View all orders
- [ ] Transition order status (ACCEPTED → PREPARING → READY)
- [ ] Initiate refund (order moves to REFUNDING → REFUNDED)
- [ ] View menu items
- [ ] See basic sales analytics

**Technical:**
- [ ] No unhandled errors in logs
- [ ] All payments audited in database
- [ ] Refunds automatic via webhook
- [ ] Mobile responsive (<= 768px)
- [ ] Sub-2 second page load times

---

## Deployment Timeline

**After Phase 4:**
1. Deploy backend to Railway (done)
2. Deploy frontend to Vercel (new)
3. Update Paystack webhook URL to production
4. Switch to live Paystack keys (optional)
5. Soft launch (friends + family)
6. Monitor for 1 week
7. Open to public

---

## Phase 4 Milestones

```
[Day 1-7] -----[MVP Customer UI]-----
[Day 8-14]-----[Checkout + Payment]-----
[Day 15-21]-----[Admin + Launch]-----
[Ongoing]------[Monitoring + Iteration]------
```

---

## What Comes After Phase 4

**Phase 5: Hardening & Scaling**
- Multi-restaurant support
- Rider assignment + tracking
- SMS notifications
- Email receipts
- Loyalty program
- Live Paystack keys + real payments

**Phase 6: Infrastructure**
- Docker containerization
- Kubernetes deployment
- Database replication
- CDN for images
- Analytics dashboard

---

## Decision Gate

**To proceed with Phase 4 implementation:**

Choose one:

1. **Detailed Sprint Planning** — I draft day-by-day tasks, component specs, API contracts
2. **Quick Start** — Start building immediately with this roadmap as guide
3. **Wait** — Lock Phase 3, plan Phase 4 later

**Recommendation:** Option 1 (detailed planning saves rework) OR Option 2 (start building now, iterate fast).

---

**Status:** Phase 4 ready to begin whenever you decide.
