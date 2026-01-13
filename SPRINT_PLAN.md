# Sprint Plan — Phase 4 Implementation (7–10 Days)

**Period:** January 9–19, 2026
**Team:** Solo (AI + User)
**Goal:** Fully functional customer + admin UI with backend integration

---

## Sprint Overview

```
Day 1–2: Planning + Scaffold (This doc + Next.js setup)
Day 3–4: Core Components (Menu, Cart, Order Status)
Day 5–6: Checkout + Payment Flow
Day 7–8: Admin Dashboard (Orders, Analytics)
Day 9–10: Integration Testing + Polish
```

---

## Day 1–2: Planning + Scaffold

### Day 1: API Contracts + Project Setup

**Deliverables:**
- ✅ API_CONTRACTS.md (complete REST spec)
- [ ] COMPONENT_SPECS.md (TypeScript interfaces)
- [ ] Scaffold Next.js 14 project
- [ ] Install dependencies (Tailwind, axios, etc.)
- [ ] Create folder structure (/pages, /components, /services)

**What to build:**
```
mai-inji-frontend/
├── app/
│   ├── layout.tsx (root layout)
│   ├── page.tsx (home)
│   ├── menu/
│   │   └── page.tsx
│   ├── cart/
│   │   └── page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   ├── orders/
│   │   ├── page.tsx (order history)
│   │   └── [id]/page.tsx (order detail)
│   └── admin/
│       ├── login/page.tsx
│       ├── dashboard/page.tsx
│       └── orders/[id]/page.tsx
├── components/
│   ├── MenuBrowser.tsx
│   ├── CartSummary.tsx
│   ├── CheckoutForm.tsx
│   ├── OrderStatus.tsx
│   └── admin/
│       ├── OrdersList.tsx
│       ├── OrderDetail.tsx
│       └── Analytics.tsx
├── services/
│   ├── api.ts (axios setup + interceptors)
│   ├── orderService.ts
│   ├── menuService.ts
│   ├── paymentService.ts
│   └── authService.ts
├── context/
│   ├── CartContext.tsx (React Context for cart state)
│   ├── AuthContext.tsx (JWT + admin auth)
│   └── OrderContext.tsx (order tracking)
├── hooks/
│   ├── useCart.ts
│   ├── useAuth.ts
│   └── useFetch.ts
├── types/
│   ├── api.ts (request/response types)
│   ├── entities.ts (Order, MenuItem, Payment)
│   └── forms.ts (form input types)
├── utils/
│   ├── formatCurrency.ts (₦ formatting)
│   ├── validatePhone.ts
│   ├── validateEmail.ts
│   └── dateHelpers.ts
├── styles/
│   └── globals.css (Tailwind + custom)
├── middleware.ts (JWT verification)
├── env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

**Commands:**
```bash
npx create-next-app@latest mai-inji-frontend --typescript --tailwind
cd mai-inji-frontend
npm install axios zustand (or Context, your choice)
npm install -D @types/node
```

**Time:** 2 hours

---

### Day 2: Service Layer + Types

**Deliverables:**
- [ ] `services/api.ts` — Axios wrapper with interceptors
- [ ] `services/menuService.ts` — Menu API calls
- [ ] `services/orderService.ts` — Order API calls
- [ ] `services/paymentService.ts` — Paystack integration
- [ ] `services/authService.ts` — Admin login
- [ ] `types/api.ts` — Full TypeScript interfaces (from API_CONTRACTS)
- [ ] `context/CartContext.tsx` — Cart state management
- [ ] `context/AuthContext.tsx` — JWT + admin auth
- [ ] `.env.local` — API_BASE_URL, PAYSTACK_PUBLIC_KEY

**API Service Layer (Pattern):**

```typescript
// services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies (httpOnly auth)
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors (401 → redirect to login)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Types (from API_CONTRACTS):**

```typescript
// types/api.ts
export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number; // in kobo
  price_formatted: string; // ₦X,XXX
  image_url: string;
  is_available: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: OrderItem[];
  fulfillment_type: 'PICKUP' | 'DELIVERY';
  delivery_address?: string;
  customer: {
    phone: string;
    email: string;
    name: string;
  };
  payment: {
    provider: 'PAYSTACK' | 'CASH';
    reference: string;
    status: 'SUCCESS' | 'INITIATED' | 'FAILED';
    amount: number;
  };
  status_history: StatusHistoryEntry[];
  created_at: string;
}

export enum OrderStatus {
  CREATED = 'CREATED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDING = 'REFUNDING',
  REFUNDED = 'REFUNDED',
}

// ... more types
```

**Context (Pattern):**

```typescript
// context/CartContext.tsx
'use client';
import { createContext, useContext, useState } from 'react';

export interface CartItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (menu_item_id: string) => void;
  updateQuantity: (menu_item_id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menu_item_id === newItem.menu_item_id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === newItem.menu_item_id
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
    // Persist to localStorage
    localStorage.setItem('cart', JSON.stringify([...items, newItem]));
  };

  // ... other methods

  return <CartContext.Provider value={{ items, addItem, ... }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be within CartProvider');
  return context;
}
```

**Time:** 3 hours

---

## Day 3–4: Core Components

### Day 3: Menu Browser + Cart UI

**Components to build:**
- `MenuBrowser.tsx` — Display menu items, search, category filter
- `MenuItem.tsx` — Menu item card (add to cart button)
- `CartSummary.tsx` — Cart icon with count + mini-cart preview
- `Cart/page.tsx` — Full cart page with remove/quantity adjust
- `Layout.tsx` — Header, nav, footer (mobile-first)

**Key Features:**
- Search menu items (client-side filtering)
- Filter by category
- Add to cart (updates context)
- Responsive grid (mobile: 1 col, tablet: 2 cols, desktop: 3 cols)
- Currency formatting (₦ symbol)

**Example Component:**

```typescript
// components/MenuBrowser.tsx
'use client';
import { useEffect, useState } from 'react';
import { MenuItem } from '@/types/api';
import { menuService } from '@/services/menuService';
import MenuItemCard from './MenuItemCard';

export default function MenuBrowser() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    menuService.getMenu().then(setItems).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search menu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
```

**Time:** 3 hours

---

### Day 4: Order Status + Status History

**Components to build:**
- `OrderStatus.tsx` — Real-time order status display (animated)
- `StatusTimeline.tsx` — Order status history with timestamps
- `Orders/page.tsx` — Order history list
- `Orders/[id]/page.tsx` — Order detail page

**Key Features:**
- Poll backend every 2 seconds (SWR with revalidateInterval)
- Show current status with badge (color-coded: pending=yellow, paid=green, etc.)
- Timeline of status changes with actor + reason
- Link to payment if still pending
- Show order number, items, total

**Status Color Map:**
```
CREATED → Gray
PAYMENT_PENDING → Yellow
PAID → Blue
ACCEPTED → Green
PREPARING → Blue
READY → Green
READY_FOR_PICKUP → Green
OUT_FOR_DELIVERY → Orange
COMPLETED → Green
CANCELLED → Red
REFUNDING → Red
REFUNDED → Red
```

**Time:** 3 hours

---

## Day 5–6: Checkout + Payment Flow

### Day 5: Checkout Form + Validation

**Components to build:**
- `CheckoutForm.tsx` — Multi-step form (customer info → address → payment)
- `PaymentMethodSelector.tsx` — PAYSTACK vs CASH toggle
- `DeliveryAddressForm.tsx` — Lafia location input
- `Checkout/page.tsx` — Full checkout flow

**Key Features:**
- Step 1: Confirm cart items
- Step 2: Customer info (name, phone, email) + validation
- Step 3: Delivery address (pickup vs delivery toggle)
- Step 4: Payment method (Paystack or Cash on Delivery)
- Step 5: Review + submit
- Validation errors inline

**Validation:**
```typescript
// utils/validate.ts
export const validatePhone = (phone: string): boolean => {
  return /^234\d{10}$/.test(phone.replace(/\D/g, ''));
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateAddress = (address: string): boolean => {
  return address.toLowerCase().includes('lafia') && address.length > 5;
};
```

**Time:** 3 hours

---

### Day 6: Payment Integration + Order Confirmation

**Components to build:**
- Payment redirect handler (Paystack callback)
- Order confirmation page
- Post-checkout order tracking
- Paystack signature verification (frontend safety)

**Flow:**
1. User submits checkout form
2. API creates order (POST /api/orders)
3. API initializes Paystack payment (POST /api/orders/:id/payment)
4. Frontend redirects to Paystack checkout URL
5. User pays or cancels
6. Paystack redirects to callback URL with `reference` query param
7. Frontend verifies payment (POST /api/orders/:id/verify? or fetch order status)
8. Show confirmation or error

**Code Pattern:**
```typescript
// pages/checkout/callback.tsx
'use client';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentService } from '@/services/paymentService';

export default function PaymentCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');

  useEffect(() => {
    if (reference) {
      // Verify payment
      paymentService
        .verifyPayment(reference)
        .then(() => router.push('/order-confirmation'))
        .catch(() => router.push('/payment-failed'));
    }
  }, [reference]);

  return <div>Processing payment...</div>;
}
```

**Time:** 3 hours

---

## Day 7–8: Admin Dashboard

### Day 7: Admin Auth + Orders List

**Components to build:**
- `Admin/Login/page.tsx` — Email + password login
- `Admin/Dashboard/page.tsx` — Admin home
- `Admin/Orders/page.tsx` — Paginated orders list (filterable by status)
- `Admin/Orders/[id]/page.tsx` — Order detail + refund button

**Admin Features:**
- Login with email + password
- JWT token in localStorage
- View all orders (paginated, 20 per page)
- Filter by status (PAYMENT_PENDING, ACCEPTED, etc.)
- Click to view order details
- Status dropdown to transition status (PAYMENT_PENDING → ACCEPTED → PREPARING → READY)
- Refund button (admin only)

**Middleware (Auth Check):**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const protectedPaths = ['/admin'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

**Time:** 4 hours

---

### Day 8: Admin Analytics + Refunds

**Components to build:**
- `Admin/Analytics/page.tsx` — Sales dashboard
- `Admin/Analytics/charts/RevenueChart.tsx` — Revenue trend
- `Admin/Analytics/cards/SummaryCards.tsx` — KPIs (total revenue, order count, etc.)
- Refund handler in `Admin/Orders/[id]/page.tsx`

**Analytics Features:**
- Total revenue (all time)
- Total orders count
- Orders by status breakdown
- Top 5 menu items by quantity sold
- Revenue by day (last 7 days chart)
- Date range picker (optional v2)

**Refund Flow:**
1. Admin clicks "Refund" on order
2. Modal with reason dropdown
3. Click "Confirm Refund"
4. API calls POST /api/orders/:id/refund
5. Order status transitions to REFUNDING
6. Paystack webhook confirms → REFUNDED
7. Toast notification "Refund initiated"

**Time:** 3 hours

---

## Day 9–10: Integration Testing + Polish

### Day 9: End-to-End Testing

**Test Scenarios:**
1. **Menu Browse** — Load menu, search, category filter
2. **Add to Cart** — Add item, increment quantity, remove
3. **Checkout** — Fill form, validate, submit
4. **Payment (Test Card)** — Redirect to Paystack, use 4111111111111111, verify order status updates
5. **Order Tracking** — Polling updates order status every 2 seconds
6. **Admin Login** — Email + password, token stored
7. **Admin Order List** — Filter by status, pagination
8. **Admin Status Transition** — Move order ACCEPTED → PREPARING → READY
9. **Admin Refund** — Initiate refund, verify order status → REFUNDING
10. **Mobile Responsive** — Test on 375px, 768px, 1024px viewports

**Manual Test Checklist:**
- [ ] Menu loads and displays correctly
- [ ] Cart persists on refresh (localStorage)
- [ ] Checkout form validates (phone, email, address)
- [ ] Payment redirects to Paystack
- [ ] Order confirmation shows after successful payment
- [ ] Order status tracking updates in real-time
- [ ] Admin login works (JWT token)
- [ ] Admin sees all orders
- [ ] Admin can transition order status
- [ ] Admin refund works (calls backend)
- [ ] Mobile menu collapses (hamburger)
- [ ] All text readable on mobile (<= 375px)
- [ ] Images load and optimize
- [ ] No console errors

**Time:** 3 hours

---

### Day 10: Polish + Edge Cases + Documentation

**Polish Tasks:**
- [ ] Loading states (spinners) on all async operations
- [ ] Error states (toast notifications for failures)
- [ ] Empty states (no orders, no menu items)
- [ ] Accessibility (alt text, ARIA labels)
- [ ] Dark mode toggle (optional)
- [ ] Optimistic UI updates (add to cart shows immediately)
- [ ] Proper redirects (unauthenticated admin → login)

**Edge Cases:**
- User adds item, goes to checkout, item sold out → show warning
- User in checkout for >30 min, session expires → redirect to login
- Payment webhook doesn't arrive (offline) → manual verify button
- Refund API fails → show error, allow retry
- Menu item image fails to load → placeholder image

**Documentation:**
- [ ] README.md (setup, running locally)
- [ ] FEATURES.md (what's implemented in Phase 4)
- [ ] TESTING.md (manual test procedures)
- [ ] TROUBLESHOOTING.md (common issues)
- [ ] API_USAGE.md (frontend examples for each API)

**Time:** 3 hours

---

## Timeline Summary

```
Day 1 → Plan + API Contracts + Scaffold                   (5 hours)
Day 2 → Service Layer + Types + Context                   (3 hours)
Day 3 → Menu Browser + Cart UI                            (3 hours)
Day 4 → Order Status + History                            (3 hours)
Day 5 → Checkout Form + Validation                        (3 hours)
Day 6 → Payment Integration + Callback                    (3 hours)
Day 7 → Admin Auth + Orders List                          (4 hours)
Day 8 → Admin Analytics + Refunds                         (3 hours)
Day 9 → End-to-End Testing                                (3 hours)
Day 10 → Polish + Edge Cases + Docs                       (3 hours)
        ─────────────────────────────
        TOTAL: ~35 hours (4-5 working days with breaks)
```

**Realistic Timeline (with breaks, debugging, learning):**
- **Optimistic:** 7 days (5 hours/day)
- **Comfortable:** 10 days (3–4 hours/day)
- **Relaxed:** 2 weeks (2–3 hours/day)

---

## Execution Strategy

**Parallelizable:**
- Day 1: User can review API_CONTRACTS while AI scaffolds Next.js
- Days 3–6: User can test components locally as AI builds them
- Day 9: User can run test scenarios while AI polishes

**Checkpoints for Review:**
- [ ] End of Day 2: Service layer complete, types locked
- [ ] End of Day 4: Core UI components working
- [ ] End of Day 6: Payment flow end-to-end
- [ ] End of Day 8: Admin dashboard complete
- [ ] End of Day 10: Ready for production deployment

---

## Success Criteria (Phase 4 Complete)

**Customer Path Works:**
- Browse menu ✅
- Add to cart ✅
- Checkout ✅
- Pay via Paystack ✅
- Track order status ✅
- Receive order confirmation ✅

**Admin Path Works:**
- Login ✅
- View all orders ✅
- Transition order status ✅
- Refund order ✅
- View analytics ✅

**Quality:**
- No console errors ✅
- Mobile responsive ✅
- Accessibility WCAG AA ✅
- All APIs tested ✅
- Documentation complete ✅

---

**Status:** Sprint plan locked. Ready to execute from Day 1 onwards.
