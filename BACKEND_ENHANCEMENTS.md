# Backend API Enhancements — Phase 4 Implementation

**Status:** Ready for implementation
**Backend:** Express + TypeScript (Port 3001)
**Frontend:** Next.js (Port 3000)

---

## Endpoints to Implement

### 1. GET /api/orders (Admin Only - List Orders)

**Purpose:** Paginate all orders with filters

**Authentication:** Requires JWT token

**Query Parameters:**
```
?status=ACCEPTED,PREPARING  (comma-separated, optional)
?page=1                      (default: 1)
?limit=20                    (default: 20, max: 100)
?sort_by=created_at          (default: created_at)
?sort_order=desc             (default: desc, asc|desc)
```

**Implementation:**
```typescript
// routes/orders.ts - Add to existing file
router.get('/', async (req, res) => {
  const { status, page = '1', limit = '20', sort_by = 'created_at', sort_order = 'desc' } = req.query;
  
  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
  const offset = (pageNum - 1) * limitNum;

  let query = `
    SELECT id, order_number, status, total, customer->>'name' as customer_name, 
           fulfillment_type, created_at
    FROM orders
    WHERE deleted_at IS NULL
  `;

  const params: any[] = [];

  // Filter by status
  if (status && typeof status === 'string' && status.length > 0) {
    const statuses = status.split(',').map(s => s.trim());
    const placeholders = statuses.map((_, i) => `$${i + 1}`).join(',');
    query += ` AND status IN (${placeholders})`;
    params.push(...statuses);
  }

  // Count total
  const countResult = await pool.query(
    query.replace('SELECT id, order_number, status, total, customer', 'SELECT COUNT(*)'),
    params
  );
  const totalCount = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limitNum);

  // Sort and paginate
  query += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
  query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limitNum, offset);

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: {
      orders: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_count: totalCount,
        total_pages: totalPages,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1,
      },
    },
  });
});
```

---

### 2. POST /api/orders/:id/refund (Admin Only)

**Purpose:** Initiate refund on an order

**Authentication:** Requires JWT token

**Request Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

**Implementation:**
```typescript
// routes/orders.ts
router.post('/:id/refund', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    // Get order
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get payment
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE order_id = $1 AND provider = $2',
      [id, 'PAYSTACK']
    );

    if (paymentResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No Paystack payment found' });
    }

    const payment = paymentResult.rows[0];

    // Call Paystack refund API
    const refundResponse = await axios.post(
      'https://api.paystack.co/refund',
      {
        transaction: parseInt(payment.provider_reference),
        amount: payment.amount,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!refundResponse.data.status) {
      return res.status(400).json({ success: false, error: 'Paystack refund failed' });
    }

    // Update order status to REFUNDING
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['REFUNDING', id]);

    // Update payment status to REFUNDING
    await pool.query('UPDATE payments SET status = $1 WHERE id = $2', ['REFUNDING', payment.id]);

    // Log audit
    await logAudit(
      'order',
      id,
      'REFUND_INITIATED',
      order.status,
      'REFUNDING',
      'ADMIN',
      req.admin?.id || null,
      reason,
      { refund_reference: refundResponse.data.data.reference }
    );

    res.json({
      success: true,
      data: {
        order_id: id,
        status: 'REFUNDING',
        refund_reference: refundResponse.data.data.reference,
        reason,
        initiated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ success: false, error: 'Refund failed' });
  }
});
```

---

### 3. GET /api/analytics/sales (Admin Only)

**Purpose:** Sales analytics with revenue, order count, top items

**Query Parameters:**
```
?period=daily|weekly|monthly  (default: daily)
?start_date=2026-01-01        (ISO 8601)
?end_date=2026-01-31          (ISO 8601)
```

**Implementation:**
```typescript
// routes/analytics.ts (new file)
import express from 'express';
import pool from '@/db/connection';

const router = express.Router();

router.get('/sales', async (req, res) => {
  const { period = 'daily', start_date, end_date } = req.query;

  try {
    // Summary stats
    const summaryResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status IN ('COMPLETED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY') THEN total ELSE 0 END), 0) as total_revenue,
        COUNT(*) as total_orders,
        COALESCE(AVG(CASE WHEN status IN ('COMPLETED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY') THEN total ELSE NULL END), 0) as average_order_value,
        COUNT(CASE WHEN status IN ('COMPLETED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY') THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status IN ('PAYMENT_PENDING', 'CREATED') THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status IN ('CANCELLED', 'REJECTED', 'PAYMENT_FAILED') THEN 1 END) as failed_orders
      FROM orders
      WHERE deleted_at IS NULL
    `);

    // By day (last 7 days)
    const byDayResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN status IN ('COMPLETED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY') THEN total ELSE 0 END), 0) as revenue,
        COUNT(*) as order_count,
        COUNT(CASE WHEN status IN ('COMPLETED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY') THEN 1 END) as completed,
        COUNT(CASE WHEN status IN ('CANCELLED', 'REJECTED', 'PAYMENT_FAILED') THEN 1 END) as failed
      FROM orders
      WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Top items
    const topItemsResult = await pool.query(`
      SELECT 
        oi.menu_item_id,
        mi.name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.subtotal) as revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('COMPLETED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY') AND o.deleted_at IS NULL
      GROUP BY oi.menu_item_id, mi.name
      ORDER BY quantity_sold DESC
      LIMIT 5
    `);

    const summary = summaryResult.rows[0];

    res.json({
      success: true,
      data: {
        period: period || 'daily',
        summary: {
          total_revenue: parseInt(summary.total_revenue),
          total_orders: parseInt(summary.total_orders),
          average_order_value: parseInt(summary.average_order_value),
          completed_orders: parseInt(summary.completed_orders),
          pending_orders: parseInt(summary.pending_orders),
          failed_orders: parseInt(summary.failed_orders),
        },
        by_day: byDayResult.rows.map(row => ({
          date: row.date,
          revenue: parseInt(row.revenue),
          order_count: parseInt(row.order_count),
          completed: parseInt(row.completed),
          failed: parseInt(row.failed),
        })),
        top_items: topItemsResult.rows.map(row => ({
          menu_item_id: row.menu_item_id,
          name: row.name,
          quantity_sold: parseInt(row.quantity_sold),
          revenue: parseInt(row.revenue),
        })),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

export default router;
```

---

### 4. POST /api/auth/login (Admin Authentication)

**Purpose:** Admin login with email and password

**Request Body:**
```json
{
  "email": "admin@mai-inji.com",
  "password": "secure_password"
}
```

**Implementation:**
```typescript
// routes/auth.ts (new file)
import express from 'express';
import pool from '@/db/connection';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    // For v1, use hardcoded admin (production: implement real user table)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mai-inji.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'maiini@2026';

    if (email === adminEmail && password === adminPassword) {
      const token = jwt.sign(
        { id: 'admin_1', email, role: 'ADMIN' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: 'admin_1',
            email,
            role: 'ADMIN',
          },
          expires_in: 86400,
        },
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

export default router;
```

---

## Implementation Checklist

### Phase 3 → 4 Migration

- [ ] **GET /api/orders** — Add list endpoint with pagination + filters
- [ ] **POST /api/orders/:id/refund** — Add refund endpoint (calls Paystack API)
- [ ] **GET /api/analytics/sales** — Add analytics endpoint
- [ ] **POST /api/auth/login** — Add admin login endpoint
- [ ] **POST /api/auth/logout** — Add logout endpoint
- [ ] Update **index.ts** to register new routes

### New Files to Create

- [ ] `src/routes/analytics.ts` — Analytics endpoints
- [ ] `src/routes/auth.ts` — Authentication endpoints

### Environment Variables

Add to `.env`:
```
JWT_SECRET=your-secret-key-here
ADMIN_EMAIL=admin@mai-inji.com
ADMIN_PASSWORD=maiini@2026
```

### Testing

- [ ] GET http://localhost:3001/api/orders → 200 with paginated orders
- [ ] POST http://localhost:3001/api/auth/login → 200 with JWT token
- [ ] GET http://localhost:3001/api/analytics/sales → 200 with sales data
- [ ] POST http://localhost:3001/api/orders/:id/refund → 200 with refund initiated

---

**Priority:** HIGH — Frontend depends on these endpoints for admin dashboard and refunds
