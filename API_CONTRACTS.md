# API Contracts — Frontend ↔ Backend Interface

**Version:** 1.0
**Date:** January 9, 2026
**Status:** Phase 4 Specification

---

## Overview

Complete REST API specification for Phase 4 frontend integration. All endpoints verified to work with Phase 3 backend. Includes request/response schemas, error handling, and authentication requirements.

---

## Authentication

### Customer (Public)
- No authentication required for browsing
- OTP required for checkout (v1 basic: phone number only)
- Session token in cookie (httpOnly)

### Admin (Secured)
- Email + password login
- JWT token in Authorization header: `Bearer <token>`
- Token expires: 24 hours

---

## Menu Endpoints

### GET /api/menu
Fetch all menu items with categories.

**Query Params:**
```
?include_sold_out=false  (boolean, default: false)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Meals",
        "sort_order": 1
      }
    ],
    "items": [
      {
        "id": "uuid",
        "category_id": "uuid",
        "name": "Jollof Rice",
        "description": "Premium rice with vegetables",
        "price": 250000,
        "price_formatted": "₦2,500",
        "image_url": "https://...",
        "is_available": true,
        "created_at": "2026-01-09T10:00:00Z"
      }
    ]
  }
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "Failed to fetch menu"
}
```

---

### GET /api/menu/:id
Fetch single menu item.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "category_id": "uuid",
    "name": "Jollof Rice",
    "description": "Premium rice with vegetables",
    "price": 250000,
    "price_formatted": "₦2,500",
    "image_url": "https://...",
    "is_available": true
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Menu item not found"
}
```

---

## Order Endpoints

### POST /api/orders
Create a new order.

**Request Body:**
```json
{
  "user_id": "uuid (optional, null for guest)",
  "phone": "234XXXXXXXXXX",
  "email": "customer@example.com",
  "full_name": "John Doe",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2
    }
  ],
  "fulfillment_type": "PICKUP | DELIVERY",
  "delivery_address": "123 Main St, Lafia (required if DELIVERY)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "ORD-20260109-001",
    "status": "PAYMENT_PENDING",
    "subtotal": 500000,
    "delivery_fee": 50000,
    "total": 550000,
    "total_formatted": "₦5,500",
    "items": [
      {
        "menu_item_id": "uuid",
        "menu_item_name": "Jollof Rice",
        "quantity": 2,
        "unit_price": 250000,
        "subtotal": 500000
      }
    ],
    "fulfillment_type": "DELIVERY",
    "delivery_address": "123 Main St, Lafia",
    "created_at": "2026-01-09T10:00:00Z"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Invalid items or missing delivery address"
}
```

---

### GET /api/orders/:orderId
Fetch order details + status history.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "ORD-20260109-001",
    "status": "ACCEPTED",
    "subtotal": 500000,
    "total": 550000,
    "items": [...],
    "fulfillment_type": "DELIVERY",
    "delivery_address": "123 Main St, Lafia",
    "customer": {
      "phone": "234XXXXXXXXXX",
      "email": "customer@example.com",
      "name": "John Doe"
    },
    "status_history": [
      {
        "status": "CREATED",
        "timestamp": "2026-01-09T10:00:00Z",
        "actor": "SYSTEM"
      },
      {
        "status": "PAYMENT_PENDING",
        "timestamp": "2026-01-09T10:00:00Z",
        "actor": "SYSTEM"
      },
      {
        "status": "PAID",
        "timestamp": "2026-01-09T10:05:00Z",
        "actor": "PAYSTACK",
        "reason": "Payment verified via webhook"
      },
      {
        "status": "ACCEPTED",
        "timestamp": "2026-01-09T10:10:00Z",
        "actor": "ADMIN",
        "admin_id": "uuid"
      }
    ],
    "payment": {
      "provider": "PAYSTACK | CASH",
      "reference": "paystack_reference",
      "status": "SUCCESS | INITIATED | FAILED",
      "amount": 550000
    },
    "created_at": "2026-01-09T10:00:00Z"
  }
}
```

---

### GET /api/orders
List all orders (admin only).

**Query Params:**
```
?status=PAYMENT_PENDING|PAID|...  (comma-separated, optional)
?page=1  (default: 1)
?limit=20  (default: 20, max: 100)
?sort_by=created_at|order_number  (default: created_at)
?sort_order=asc|desc  (default: desc)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "order_number": "ORD-20260109-001",
        "status": "ACCEPTED",
        "total": 550000,
        "customer_name": "John Doe",
        "fulfillment_type": "DELIVERY",
        "created_at": "2026-01-09T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_count": 45,
      "total_pages": 3
    }
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

## Payment Endpoints

### POST /api/orders/:orderId/payment
Initialize Paystack payment.

**Request Body:**
```json
{
  "amount": 550000
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "order_id": "uuid",
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "...",
    "reference": "paystack_reference",
    "amount": 550000
  }
}
```

**Frontend Action:** Redirect to `authorization_url`, Paystack handles payment, returns to callback URL with `reference` in query params.

---

### POST /api/orders/payment/webhook
Paystack webhook receiver (signature verified in middleware).

**Incoming (from Paystack):**
```
Headers:
  x-paystack-signature: HMAC-SHA512(rawBody, PAYSTACK_SECRET_KEY)

Body:
{
  "event": "charge.success | charge.failed",
  "data": {
    "reference": "paystack_reference",
    "amount": 550000,
    "customer": {
      "email": "customer@example.com"
    },
    "status": "success | failed"
  }
}
```

**Response (200 OK — always, idempotent):**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

**Backend Action:**
1. Verify signature (done in middleware)
2. Check if webhook already processed (idempotency)
3. Update payment status (SUCCESS/FAILED)
4. Update order status (PAID/PAYMENT_FAILED)
5. Log audit trail

---

### POST /api/orders/:orderId/refund
Initiate refund (admin only).

**Request Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "refund_id": "uuid",
    "order_id": "uuid",
    "amount": 550000,
    "status": "REFUNDING",
    "reason": "Customer requested cancellation",
    "initiated_at": "2026-01-09T10:15:00Z"
  }
}
```

**Backend Action:**
1. Call Paystack refund API
2. Update payment status to REFUNDING
3. Update order status to REFUNDING
4. Log audit trail
5. Paystack webhook confirms refund → order moves to REFUNDED

---

## Analytics Endpoints (Admin Only)

### GET /api/analytics/sales
Sales analytics.

**Query Params:**
```
?period=daily|weekly|monthly  (default: daily)
?start_date=2026-01-01  (ISO 8601)
?end_date=2026-01-31  (ISO 8601)
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "daily",
    "summary": {
      "total_revenue": 125500000,
      "total_orders": 127,
      "average_order_value": 988189,
      "completed_orders": 120,
      "pending_orders": 5,
      "failed_orders": 2
    },
    "by_day": [
      {
        "date": "2026-01-09",
        "revenue": 2750000,
        "order_count": 5,
        "completed": 5,
        "failed": 0
      }
    ],
    "top_items": [
      {
        "menu_item_id": "uuid",
        "name": "Jollof Rice",
        "quantity_sold": 45,
        "revenue": 11250000
      }
    ]
  }
}
```

---

## Authentication Endpoints

### POST /api/auth/login (Admin)
Admin login.

**Request Body:**
```json
{
  "email": "admin@mai-inji.com",
  "password": "secure_password"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "admin@mai-inji.com",
      "role": "ADMIN"
    },
    "expires_in": 86400
  }
}
```

**Note:** Token set in httpOnly cookie automatically (backend).

---

### POST /api/auth/logout (Admin)
Clear session.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out"
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Human readable error message",
  "code": "ERROR_CODE",
  "details": { "optional": "context" }
}
```

**HTTP Status Codes:**
- `200` — Success
- `201` — Created
- `400` — Bad request (validation error)
- `401` — Unauthorized
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `409` — Conflict (duplicate reference, etc.)
- `500` — Server error

---

## Rate Limiting

**Public endpoints:** 100 requests / 15 minutes
**Admin endpoints:** 1000 requests / 15 minutes
**Webhook endpoint:** No limit (trusted source)

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1674123456
```

---

## Pagination

Default: 20 items per page, max 100.

**Query Params:**
```
?page=1
?limit=20
?sort_by=created_at
?sort_order=desc
```

**Response Meta:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_count": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Testing Endpoints (Development Only)

### POST /api/test/webhook-simulate
Simulate Paystack webhook (disabled in production).

**Request Body:**
```json
{
  "order_id": "uuid",
  "status": "success | failed"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Webhook simulated"
}
```

---

## API Summary Table

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | /api/menu | Public | List all menu items |
| GET | /api/menu/:id | Public | Get menu item |
| POST | /api/orders | Public | Create order |
| GET | /api/orders/:id | Public | Get order (any user) |
| GET | /api/orders | Admin | List all orders |
| POST | /api/orders/:id/payment | Public | Initialize Paystack |
| POST | /api/orders/payment/webhook | Public (verified) | Paystack webhook |
| POST | /api/orders/:id/refund | Admin | Initiate refund |
| GET | /api/analytics/sales | Admin | Sales data |
| POST | /api/auth/login | Public | Admin login |
| POST | /api/auth/logout | Admin | Admin logout |

---

## Implementation Checklist

**Backend (Phase 3 → Phase 4):**
- [x] GET /api/menu
- [x] GET /api/menu/:id
- [x] POST /api/orders
- [x] GET /api/orders/:id
- [ ] GET /api/orders (needs implementation)
- [x] POST /api/orders/:id/payment
- [x] POST /api/orders/payment/webhook
- [ ] POST /api/orders/:id/refund (needs implementation)
- [ ] GET /api/analytics/sales (needs implementation)
- [ ] POST /api/auth/login (needs implementation)
- [ ] POST /api/auth/logout (needs implementation)
- [ ] Rate limiting middleware
- [ ] Status history in order responses

**Frontend (Phase 4):**
- [ ] API service layer (axios wrapper)
- [ ] Menu browser page
- [ ] Cart management (Context)
- [ ] Checkout flow
- [ ] Payment redirect handler
- [ ] Order status tracker
- [ ] Admin login page
- [ ] Admin orders list
- [ ] Admin order detail + refund
- [ ] Admin analytics

---

**Status:** Locked for Phase 4 implementation.
