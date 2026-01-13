# Mai Inji v1 — ADR Log

## ADR-001: Order Lifecycle & State Machine

**Decision:** Implement explicit order state machine with validated transitions

**Date:** 2026-01-09

**Context:**
Food delivery orders require predictable state flow to prevent conflicts between customer expectations and restaurant operations.

**Options Considered:**
- Option A: Simple status enum, no validation
- Option B: Explicit state machine with transition guards (CHOSEN)
- Option C: Event-sourcing architecture (too complex for v1)

**Chosen Path:** Option B

**States:**
```
CREATED → PAYMENT_PENDING → PAID → ACCEPTED → PREPARING → READY 
         ↓                   ↓               ↓
      PAYMENT_FAILED      REFUNDING    CANCELLED
                          ↓
                        REFUNDED
      
READY → [READY_FOR_PICKUP | OUT_FOR_DELIVERY] → COMPLETED
```

**Rationale:**
- Clear separation of payment and fulfillment
- Prevents invalid transitions (can't go backward from READY)
- Terminal states (COMPLETED, CANCELLED) prevent accidental reopens
- Webhook-driven payment confirmation eliminates optimistic state

**Risks Accepted:**
- Manual transition enforcement in code (not database constraint)
- No automatic timeout transitions (v2 feature)

**Review Date:** 2026-02-09

---

## ADR-002: Audit Trail — Append-Only Immutable Log

**Decision:** Implement immutable audit_logs table for all state changes

**Date:** 2026-01-09

**Context:**
Payment disputes, operational transparency, and compliance require complete audit trail. Cannot be deletable or modifiable.

**Options Considered:**
- Option A: Logging to external service (Datadog, Splunk)
- Option B: Append-only PostgreSQL table (CHOSEN)
- Option C: Event store (too early)

**Chosen Path:** Option B

**Fields:**
- entity_type, entity_id (what changed)
- action (CREATE, UPDATE, STATUS_CHANGE, REFUND)
- previous_state, new_state
- actor_type, actor_id (who made the change)
- reason (why)
- metadata (context)
- created_at (immutable timestamp)

**Rules:**
- No UPDATE/DELETE on audit_logs
- Every order status transition logged
- Every payment status change logged
- Every menu item modification logged

**Rationale:**
- Single source of truth for disputes
- Backward compatible with multi-restaurant scaling
- Query performance: Index on (entity_type, entity_id, created_at DESC)

**Risks Accepted:**
- Database storage grows over time (requires archival strategy v2)

**Review Date:** 2026-02-09

---

## ADR-003: Database Soft Delete Pattern

**Decision:** Use `deleted_at` timestamp for menu items, not hard delete

**Date:** 2026-01-09

**Context:**
Historical orders reference menu items by ID. If menu item is deleted, referential integrity breaks and order history shows broken links.

**Options Considered:**
- Option A: Hard delete (break historical records)
- Option B: Soft delete with deleted_at (CHOSEN)
- Option C: Archive to separate table (too complex)

**Chosen Path:** Option B

**Implementation:**
```sql
ALTER TABLE menu_items ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_menu_items_deleted ON menu_items(deleted_at) WHERE deleted_at IS NULL;

-- Query active items only:
SELECT * FROM menu_items WHERE deleted_at IS NULL;
```

**Rationale:**
- Historical orders show "Jollof Rice (discontinued)" instead of NULL
- Audit trail preserved
- Admin can un-delete items
- Minimal query overhead with index

**Risks Accepted:**
- Must remember to filter deleted_at in all queries

**Review Date:** 2026-02-09

---

## ADR-004: Payment Provider Integration Strategy

**Decision:** Paystack primary + Cash on Delivery fallback, no other providers

**Date:** 2026-01-09

**Context:**
Nigeria payment landscape dominated by Paystack. Local delivery doesn't require international payment processing.

**Options Considered:**
- Option A: Multiple payment gateways (Paystack, Flutterwave, Stripe)
- Option B: Paystack only (ignore cash)
- Option C: Paystack + COD (CHOSEN)

**Chosen Path:** Option C

**Implementation:**
- Paystack for online payment (webhook-driven)
- COD for cash at pickup/delivery (manual reconciliation)
- Unified payments table with provider enum

**Rationale:**
- Paystack: 90%+ Nigerian adoption
- COD: Emergency option if customer prefers cash
- Keeps code simple (no multi-provider abstraction complexity)
- Can add Flutterwave in v1.1 if needed

**Risks Accepted:**
- No international card support
- Manual COD reconciliation required
- Paystack outage is critical (but rare)

**Review Date:** 2026-02-09

---

## ADR-005: User Authentication Strategy

**Decision:** OTP for customers, Email+Password for admin

**Date:** 2026-01-09

**Context:**
Nigerian mobile market is SMS/USSD native. Password fatigue kills customer adoption. Admins need account security.

**Options Considered:**
- Option A: Email/Password for all
- Option B: Social login (Google, WhatsApp)
- Option C: OTP for customers, Email+Password for admin (CHOSEN)

**Chosen Path:** Option C

**Implementation:**
- Customers: Phone-based OTP (session-only, no password_hash)
- Admins: Email + password_hash (bcrypt)
- PHAPA integration ready (future phone provider: Twilio)

**Rationale:**
- OTP: 70% Nigerian users prefer phone-based auth
- Email+Password: Admin accountability
- Session-only customer auth: No data loss if DB breached
- Avoids social login dependency

**Risks Accepted:**
- OTP delivery failure (SMS provider needed v1.1)
- No password reset for customers (but they don't have passwords)

**Review Date:** 2026-02-09

---

## ADR-006: Data Portability & Migration Path

**Decision:** PostgreSQL standard schema, no vendor lock-in, versioned migrations

**Date:** 2026-01-09

**Context:**
Sovereignty principle: System must be portable. Cannot depend on Vercel, Railway, or any single provider.

**Options Considered:**
- Option A: Firebase/Firestore (cloud-first, no portability)
- Option B: PostgreSQL (standard, portable) (CHOSEN)
- Option C: MongoDB (NoSQL, schema flexibility)

**Chosen Path:** Option B

**Implementation:**
- Standard PostgreSQL (no vendor extensions)
- Versioned migrations (Flyway-style naming: 001_init.sql, 002_audit.sql)
- Schema-only (no ORMs for visibility)
- Can migrate to any PostgreSQL host (local, AWS RDS, Railway, Render, etc)

**Rationale:**
- PostgreSQL: Industry standard, available everywhere
- No cloud vendor lock-in
- Can self-host on VPS if needed
- Schema visible and auditable

**Risks Accepted:**
- No built-in cloud-specific features (DynamoDB scaling, Firestore realtime)

**Review Date:** 2026-02-09

---

**Total ADRs:** 6
**Status:** All approved for Phase 1
**Next Review:** 2026-02-09
