# Mai Inji API Testing Guide

## Server Status

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:3000

---

## 1. Authentication Endpoints

### 1.1 Admin Login
**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mai-inji.com",
    "password": "maiini@2026"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@mai-inji.com",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

**Save the token for subsequent admin requests:**
```bash
export AUTH_TOKEN="your-token-here"
```

### 1.2 Admin Logout
**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 2. Menu Endpoints (Public)

### 2.1 Get All Menu Items
**Request:**
```bash
curl http://localhost:3001/api/menu
```

**Expected Response (200):**
```json
[
  {
    "id": "uuid-here",
    "name": "Jollof Rice",
    "description": "Traditional Nigerian rice",
    "price": 2500,
    "category": "main_courses",
    "image_url": "https://...",
    "available": true
  }
]
```

### 2.2 Get Menu Item Details
**Request:**
```bash
curl http://localhost:3001/api/menu/[item-id]
```

**Expected Response (200):** Single menu item object

---

## 3. Orders Endpoints

### 3.1 Create Order
**Request:**
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "08012345678",
    "items": [
      {
        "menu_item_id": "uuid-1",
        "quantity": 2,
        "price": 2500
      }
    ],
    "delivery_fee": 500,
    "total": 5500
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "order": {
    "id": "order-uuid",
    "order_number": "OD-20250101-001",
    "status": "PENDING",
    "total": 5500,
    "created_at": "2025-01-01T10:00:00Z"
  }
}
```

### 3.2 Get Order Details
**Request:**
```bash
curl http://localhost:3001/api/orders/[order-id]
```

**Expected Response (200):**
```json
{
  "order": {
    "id": "order-uuid",
    "order_number": "OD-20250101-001",
    "status": "COMPLETED",
    "total": 5500,
    "items": [...],
    "status_history": [
      {
        "status": "PENDING",
        "changed_at": "2025-01-01T10:00:00Z"
      },
      {
        "status": "COMPLETED",
        "changed_at": "2025-01-01T10:30:00Z"
      }
    ]
  }
}
```

### 3.3 List All Orders (Admin Only)
**Request:**
```bash
curl http://localhost:3001/api/orders \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "?status=COMPLETED&page=1&limit=20&sort_by=created_at&sort_order=desc"
```

**Expected Response (200):**
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "OD-20250101-001",
      "status": "COMPLETED",
      "total": 5500,
      "created_at": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_count": 45,
    "has_next": true,
    "has_prev": false
  }
}
```

**Query Parameters:**
- `status` (optional): Filter by order status (PENDING, CONFIRMED, PAID, COMPLETED, REFUNDING, REFUNDED)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort_by` (optional): Field to sort by (created_at, order_number, status, total)
- `sort_order` (optional): asc or desc (default: desc)

### 3.4 Update Order Status (Admin Only)
**Request:**
```bash
curl -X PATCH http://localhost:3001/api/orders/[order-id]/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "status": "COMPLETED"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "order": {
    "id": "order-uuid",
    "status": "COMPLETED"
  }
}
```

### 3.5 Refund Order (Admin Only)
**Request:**
```bash
curl -X POST http://localhost:3001/api/orders/[order-id]/refund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "reason": "Customer requested refund"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "refund": {
    "order_id": "order-uuid",
    "status": "REFUNDING",
    "refund_reference": "REF-20250101-001",
    "amount": 5500
  }
}
```

**Error Responses:**
- `400`: Order not eligible for refund (must be COMPLETED or PAID)
- `403`: Unauthorized (missing or invalid token)
- `404`: Order not found
- `500`: Paystack API error

---

## 4. Analytics Endpoints (Admin Only)

### 4.1 Sales Summary & Breakdown
**Request:**
```bash
curl http://localhost:3001/api/analytics/sales \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected Response (200):**
```json
{
  "summary": {
    "total_orders": 45,
    "completed_orders": 40,
    "total_revenue": 225000,
    "average_order_value": 5625,
    "period": "all_time"
  },
  "by_day": [
    {
      "date": "2025-01-01",
      "orders": 5,
      "revenue": 27500,
      "average_order_value": 5500
    }
  ],
  "top_items": [
    {
      "menu_item_id": "uuid",
      "name": "Jollof Rice",
      "quantity_sold": 45,
      "revenue": 112500
    }
  ]
}
```

### 4.2 Popular Items
**Request:**
```bash
curl http://localhost:3001/api/analytics/items/popular \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Jollof Rice",
      "category": "main_courses",
      "quantity_sold": 45,
      "times_ordered": 35,
      "total_revenue": 112500,
      "average_price": 2500
    }
  ]
}
```

### 4.3 Revenue by Category
**Request:**
```bash
curl http://localhost:3001/api/analytics/revenue/category \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected Response (200):**
```json
{
  "categories": [
    {
      "category_name": "main_courses",
      "total_revenue": 150000,
      "items_sold": 60,
      "average_item_price": 2500,
      "percentage_of_total": 66.67
    },
    {
      "category_name": "drinks",
      "total_revenue": 75000,
      "items_sold": 30,
      "average_item_price": 2500,
      "percentage_of_total": 33.33
    }
  ],
  "total_revenue": 225000
}
```

---

## 5. Payment Webhook (Post-Integration)

### 5.1 Paystack Payment Verification
**After Paystack redirects to callback:**
```bash
curl -X POST http://localhost:3001/api/orders/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "8986556677"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "order": {
    "id": "order-uuid",
    "status": "PAID",
    "amount": 5500
  }
}
```

---

## Testing Flow Checklist

### ✅ Public Flow (No Auth Required)
- [ ] GET /api/menu — Fetch menu items
- [ ] POST /api/orders — Create order
- [ ] GET /api/orders/[id] — Check order status

### ✅ Admin Flow (Requires Auth Token)
1. [ ] POST /api/auth/login — Get token
2. [ ] GET /api/orders — List all orders
3. [ ] PATCH /api/orders/[id]/status — Update status
4. [ ] POST /api/orders/[id]/refund — Process refund
5. [ ] GET /api/analytics/sales — Sales summary
6. [ ] GET /api/analytics/items/popular — Top items
7. [ ] GET /api/analytics/revenue/category — Category breakdown

### ✅ Frontend Integration
- [ ] Menu page loads items from API
- [ ] Cart stores items in localStorage + Zustand
- [ ] Checkout form submits order to backend
- [ ] Login page sends credentials, stores JWT token
- [ ] Admin dashboard fetches analytics with token

---

## Error Codes Reference

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | ✅ Data returned |
| 201 | Created | ✅ New order created |
| 400 | Bad Request | ❌ Invalid order status |
| 403 | Forbidden | ❌ Missing auth token |
| 404 | Not Found | ❌ Order doesn't exist |
| 500 | Server Error | ❌ Database/API failure |

---

## Testing with Postman

1. Import this collection: [API_TESTING.postman_collection.json](./API_TESTING.postman_collection.json)
2. Set environment variable: `{{ auth_token }}` from login response
3. Run test sequences in order

---

## Debugging Tips

**Backend logs not showing?**
```bash
# Check backend terminal (ID: 208e6106-17cb-4ea3-8838-d00161e1906a)
# Should show: "🚀 Mai Inji Backend running on http://localhost:3001"
```

**Frontend can't reach backend?**
- Check CORS headers in backend (should allow http://localhost:3000)
- Check axios baseURL in [services/api.ts](./mai-inji-frontend/services/api.ts)

**JWT token expired?**
- Token expires in 24 hours
- Call POST /api/auth/login again to get new token

**Refund failing?**
- Order must be in COMPLETED or PAID status
- Check Paystack test keys are configured
- Use test card: 4111 1111 1111 1111 (Paystack test)

---

## Next Steps

1. ✅ Both servers running
2. ⏳ Test each endpoint with curl/Postman (reference above)
3. ⏳ Verify frontend service layer receives responses correctly
4. ⏳ Build remaining components (CheckoutForm, OrderStatus, Admin pages)
5. ⏳ End-to-end testing (menu → cart → checkout → order confirmation)
