# Component Specifications — TypeScript Interfaces

**Version:** 1.0
**Date:** January 9, 2026
**Purpose:** Complete component contract for Phase 4 implementation

---

## Table of Contents

1. **Common Types**
2. **Page Components**
3. **Feature Components**
4. **UI Components**
5. **Context & Hooks**

---

## Common Types

```typescript
// types/api.ts

// ============ Menu ============
export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number; // in kobo (1 NGN = 100 kobo)
  price_formatted: string; // e.g., "₦2,500"
  image_url: string;
  is_available: boolean;
  created_at: string; // ISO 8601
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

// ============ Order ============
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

export interface OrderItem {
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number; // in kobo
  subtotal: number; // in kobo
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string; // ISO 8601
  actor: 'SYSTEM' | 'CUSTOMER' | 'ADMIN' | 'PAYSTACK';
  admin_id?: string;
  reason?: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number; // in kobo
  delivery_fee: number; // in kobo
  total: number; // in kobo
  total_formatted: string; // e.g., "₦5,500"
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
    status: 'INITIATED' | 'SUCCESS' | 'FAILED';
    amount: number;
  };
  status_history: StatusHistoryEntry[];
  created_at: string; // ISO 8601
}

// ============ Payment ============
export interface PaystackInitializeResponse {
  success: boolean;
  data: {
    payment_id: string;
    order_id: string;
    authorization_url: string;
    access_code: string;
    reference: string;
    amount: number;
  };
}

export interface PaystackVerifyResponse {
  success: boolean;
  data: Order;
}

// ============ Cart ============
export interface CartItem {
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number; // in kobo
}

export interface Cart {
  items: CartItem[];
  subtotal: number; // in kobo
  delivery_fee: number; // in kobo (0 for PICKUP)
  total: number; // in kobo
}

// ============ Forms ============
export interface CheckoutFormData {
  full_name: string;
  phone: string; // 234XXXXXXXXXX format
  email: string;
  fulfillment_type: 'PICKUP' | 'DELIVERY';
  delivery_address?: string;
  payment_method: 'PAYSTACK' | 'CASH';
}

export interface AdminLoginFormData {
  email: string;
  password: string;
}

// ============ API Responses ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ============ Admin ============
export interface Admin {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER';
}

export interface AuthToken {
  token: string;
  user: Admin;
  expires_in: number; // seconds
}
```

---

## Page Components

### Home / Root

```typescript
// app/page.tsx
interface HomePageProps {}

export default function HomePage(props: HomePageProps): React.ReactNode;
// Purpose: Landing page, hero, link to menu
// Route: /
```

### Menu Page

```typescript
// app/menu/page.tsx
interface MenuPageProps {}

interface MenuPageState {
  items: MenuItem[];
  categories: MenuCategory[];
  loading: boolean;
  error?: string;
  search: string;
  selectedCategory?: string;
}

export default function MenuPage(props: MenuPageProps): React.ReactNode;
// Purpose: Display menu items with search & category filter
// Route: /menu
```

### Cart Page

```typescript
// app/cart/page.tsx
interface CartPageProps {}

export default function CartPage(props: CartPageProps): React.ReactNode;
// Purpose: Display cart items, allow quantity adjustment, proceed to checkout
// Route: /cart
// Requires: useCart hook
```

### Checkout Page

```typescript
// app/checkout/page.tsx
interface CheckoutPageProps {}

export default function CheckoutPage(props: CheckoutPageProps): React.ReactNode;
// Purpose: Multi-step checkout form (customer info → address → payment method)
// Route: /checkout
// Requires: useCart, React Context, API service
// Submits: POST /api/orders (creates order) → POST /api/orders/:id/payment (Paystack redirect)
```

### Checkout Callback (Payment Result)

```typescript
// app/checkout/callback.tsx
interface CallbackPageProps {
  searchParams: {
    reference: string;
  };
}

export default function CallbackPage(props: CallbackPageProps): React.ReactNode;
// Purpose: Handle Paystack callback after payment
// Route: /checkout/callback?reference=REF_XXXXX
// Action: Verify payment, redirect to confirmation or error page
```

### Order History

```typescript
// app/orders/page.tsx
interface OrderHistoryPageProps {}

export default function OrderHistoryPage(props: OrderHistoryPageProps): React.ReactNode;
// Purpose: Display customer's order history
// Route: /orders
// Requires: useAuth (optional, for filtering by customer)
```

### Order Detail

```typescript
// app/orders/[id]/page.tsx
interface OrderDetailPageProps {
  params: {
    id: string; // Order ID
  };
}

export default function OrderDetailPage(props: OrderDetailPageProps): React.ReactNode;
// Purpose: Display single order with status, items, timeline
// Route: /orders/[id]
// Requires: Real-time polling (SWR with 2s interval)
```

### Admin Login

```typescript
// app/admin/login/page.tsx
interface AdminLoginPageProps {}

export default function AdminLoginPage(props: AdminLoginPageProps): React.ReactNode;
// Purpose: Email + password login for admin
// Route: /admin/login
// Action: POST /api/auth/login, store JWT in localStorage, redirect to /admin/dashboard
```

### Admin Dashboard

```typescript
// app/admin/dashboard/page.tsx
interface AdminDashboardPageProps {}

export default function AdminDashboardPage(props: AdminDashboardPageProps): React.ReactNode;
// Purpose: Admin home, quick stats, recent orders
// Route: /admin/dashboard
// Requires: Admin auth (useAuth), protected by middleware.ts
```

### Admin Orders List

```typescript
// app/admin/orders/page.tsx
interface AdminOrdersPageProps {
  searchParams: {
    status?: string; // comma-separated
    page?: string;
    limit?: string;
  };
}

interface AdminOrdersPageState {
  orders: Order[];
  pagination: PaginationMeta;
  loading: boolean;
  filters: {
    status: OrderStatus[];
    page: number;
    limit: number;
  };
}

export default function AdminOrdersPage(props: AdminOrdersPageProps): React.ReactNode;
// Purpose: List all orders with filters and pagination
// Route: /admin/orders?status=ACCEPTED,PREPARING&page=1&limit=20
// Requires: Admin auth
```

### Admin Order Detail

```typescript
// app/admin/orders/[id]/page.tsx
interface AdminOrderDetailPageProps {
  params: {
    id: string; // Order ID
  };
}

export default function AdminOrderDetailPage(props: AdminOrderDetailPageProps): React.ReactNode;
// Purpose: View order details, transition status, initiate refund
// Route: /admin/orders/[id]
// Requires: Admin auth, real-time polling
// Actions: PATCH /api/orders/:id/status, POST /api/orders/:id/refund
```

### Admin Analytics

```typescript
// app/admin/analytics/page.tsx
interface AdminAnalyticsPageProps {
  searchParams: {
    period?: 'daily' | 'weekly' | 'monthly';
    start_date?: string;
    end_date?: string;
  };
}

interface AnalyticsData {
  period: string;
  summary: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
    completed_orders: number;
    pending_orders: number;
    failed_orders: number;
  };
  by_day: Array<{
    date: string;
    revenue: number;
    order_count: number;
    completed: number;
    failed: number;
  }>;
  top_items: Array<{
    menu_item_id: string;
    name: string;
    quantity_sold: number;
    revenue: number;
  }>;
}

export default function AdminAnalyticsPage(props: AdminAnalyticsPageProps): React.ReactNode;
// Purpose: Sales dashboard with charts and KPIs
// Route: /admin/analytics
// Requires: Admin auth, GET /api/analytics/sales
```

---

## Feature Components

### MenuBrowser

```typescript
// components/MenuBrowser.tsx
interface MenuBrowserProps {
  onAddToCart?: (item: MenuItem, quantity: number) => void;
  showCategoryFilter?: boolean; // default: true
  showSearch?: boolean; // default: true
}

interface MenuBrowserState {
  items: MenuItem[];
  categories: MenuCategory[];
  loading: boolean;
  error?: string;
  search: string;
  selectedCategory?: string;
}

export default function MenuBrowser(props: MenuBrowserProps): React.ReactNode;
// Purpose: Display menu items with search & category filter, add to cart button
// Fetches: GET /api/menu
// Events: onAddToCart(item, quantity)
```

### MenuItem Card

```typescript
// components/MenuItemCard.tsx
interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity: number) => void;
}

export default function MenuItemCard(props: MenuItemCardProps): React.ReactNode;
// Purpose: Display single menu item with image, price, description, add button
// Events: onAddToCart()
```

### CartSummary

```typescript
// components/CartSummary.tsx
interface CartSummaryProps {
  badge?: boolean; // show item count badge
  mini?: boolean; // compact mode for header
}

export default function CartSummary(props: CartSummaryProps): React.ReactNode;
// Purpose: Display cart total, item count, link to /cart
// Fetches: useCart hook
```

### CartItemList

```typescript
// components/CartItemList.tsx
interface CartItemListProps {
  items: CartItem[];
  onUpdateQuantity: (menu_item_id: string, quantity: number) => void;
  onRemoveItem: (menu_item_id: string) => void;
  showSubtotals?: boolean; // default: true
}

export default function CartItemList(props: CartItemListProps): React.ReactNode;
// Purpose: Display list of cart items with remove/quantity buttons
// Events: onUpdateQuantity(), onRemoveItem()
```

### CheckoutForm

```typescript
// components/CheckoutForm.tsx
interface CheckoutFormProps {
  cart: Cart;
  onSubmit: (data: CheckoutFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
}

interface CheckoutStep {
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
}

export default function CheckoutForm(props: CheckoutFormProps): React.ReactNode;
// Purpose: Multi-step form for order creation + payment method selection
// Submits: (data: CheckoutFormData) via onSubmit prop
// Validates: Phone (234XXXXXXXXXX), Email, Address (must contain "Lafia")
// Form Steps:
//   1. Review Cart Items
//   2. Customer Info (name, phone, email)
//   3. Address (pickup vs delivery)
//   4. Payment Method (Paystack vs Cash)
//   5. Review + Confirm
```

### OrderStatus

```typescript
// components/OrderStatus.tsx
interface OrderStatusProps {
  order: Order;
  pollInterval?: number; // default: 2000ms
  showTimeline?: boolean; // default: true
}

interface StatusBadgeColor {
  CREATED: string;
  PAYMENT_PENDING: string;
  PAID: string;
  ACCEPTED: string;
  PREPARING: string;
  READY: string;
  READY_FOR_PICKUP: string;
  OUT_FOR_DELIVERY: string;
  COMPLETED: string;
  CANCELLED: string;
  REFUNDING: string;
  REFUNDED: string;
}

export default function OrderStatus(props: OrderStatusProps): React.ReactNode;
// Purpose: Display current order status with timeline
// Features: Real-time polling, color-coded badges, timestamp display
// Fetches: useEffect hook polling GET /api/orders/:id
```

### OrderConfirmation

```typescript
// components/OrderConfirmation.tsx
interface OrderConfirmationProps {
  order: Order;
  onTrackOrder?: () => void;
}

export default function OrderConfirmation(props: OrderConfirmationProps): React.ReactNode;
// Purpose: Display after successful payment
// Shows: Order number, confirmation message, items, total, next steps
```

### AdminOrdersList

```typescript
// components/admin/AdminOrdersList.tsx
interface AdminOrdersListProps {
  orders: Order[];
  pagination: PaginationMeta;
  loading: boolean;
  selectedStatus?: OrderStatus[];
  onStatusFilter: (statuses: OrderStatus[]) => void;
  onPageChange: (page: number) => void;
  onOrderClick: (order: Order) => void;
}

export default function AdminOrdersList(props: AdminOrdersListProps): React.ReactNode;
// Purpose: Paginated orders list with status filter and clicks to detail
// Features: Sortable columns, status badges, quick actions
```

### AdminOrderDetail

```typescript
// components/admin/AdminOrderDetail.tsx
interface AdminOrderDetailProps {
  order: Order;
  loading: boolean;
  onStatusChange: (status: OrderStatus, reason?: string) => Promise<void>;
  onRefund: (reason: string) => Promise<void>;
  pollInterval?: number; // default: 2000ms
}

export default function AdminOrderDetail(props: AdminOrderDetailProps): React.ReactNode;
// Purpose: Full order view with status dropdown, refund button
// Features:
//   - Dropdown to transition status (validate valid transitions)
//   - Confirmation modal for status change
//   - Refund button → modal with reason field
//   - Real-time polling for status updates
//   - Audit log / status timeline
// Events: onStatusChange(newStatus, reason), onRefund(reason)
```

### AdminAnalyticsSummary

```typescript
// components/admin/AdminAnalyticsSummary.tsx
interface AdminAnalyticsSummaryProps {
  data: AnalyticsData;
  period: 'daily' | 'weekly' | 'monthly';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void;
}

interface SummaryCard {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
}

export default function AdminAnalyticsSummary(props: AdminAnalyticsSummaryProps): React.ReactNode;
// Purpose: KPI cards and trends
// Shows:
//   - Total Revenue (all time)
//   - Total Orders
//   - Completed Orders (%)
//   - Average Order Value
//   - Failed Orders (%)
```

### RevenueChart

```typescript
// components/admin/RevenueChart.tsx
interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
  }>;
  period: 'daily' | 'weekly' | 'monthly';
}

export default function RevenueChart(props: RevenueChartProps): React.ReactNode;
// Purpose: Line chart of revenue over time (last 7 days / 4 weeks / 12 months)
// Library: Chart.js or Recharts
```

---

## UI Components (Atomic)

### Button

```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button(props: ButtonProps): React.ReactNode;
// Purpose: Reusable button component with variants
// Variants:
//   - primary: Green background, white text
//   - secondary: Gray background
//   - danger: Red background (refund, cancel)
//   - ghost: No background, underline on hover
```

### Input

```typescript
// components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function Input(props: InputProps): React.ReactNode;
// Purpose: Text input with label, error, hint
```

### Select

```typescript
// components/ui/Select.tsx
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  required?: boolean;
}

export function Select(props: SelectProps): React.ReactNode;
// Purpose: Dropdown select with label, error
```

### Modal

```typescript
// components/ui/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger';
  }>;
}

export function Modal(props: ModalProps): React.ReactNode;
// Purpose: Reusable modal dialog
```

### Toast

```typescript
// components/ui/Toast.tsx
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // ms
  onClose?: () => void;
}

export function Toast(props: ToastProps): React.ReactNode;
// Purpose: Notification toast (auto-dismiss)

// Hook:
interface UseToastReturn {
  show: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useToast(): UseToastReturn;
```

### Loading Spinner

```typescript
// components/ui/Spinner.tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Spinner(props: SpinnerProps): React.ReactNode;
// Purpose: Loading indicator
```

### Badge

```typescript
// components/ui/Badge.tsx
interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
}

export function Badge(props: BadgeProps): React.ReactNode;
// Purpose: Status badges (order status, payment status)
// Color Map:
//   - success: Green
//   - warning: Yellow
//   - error: Red
//   - info: Blue
//   - default: Gray
```

---

## Context & Hooks

### useCart

```typescript
// hooks/useCart.ts
interface UseCartReturn {
  cart: Cart;
  addItem: (item: MenuItem, quantity: number) => void;
  removeItem: (menu_item_id: string) => void;
  updateQuantity: (menu_item_id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
  itemCount: number;
}

export function useCart(): UseCartReturn;
// Purpose: Manage shopping cart state
// Persistence: localStorage (sync on add/remove/clear)
// Provider: CartProvider (wrap in layout.tsx)
```

### useAuth

```typescript
// hooks/useAuth.ts
interface UseAuthReturn {
  user?: Admin;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  token?: string;
}

export function useAuth(): UseAuthReturn;
// Purpose: Manage admin authentication (JWT)
// Persistence: localStorage (auth_token)
// Provider: AuthProvider (wrap in layout.tsx)
```

### useFetch

```typescript
// hooks/useFetch.ts
interface UseFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  skip?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  revalidateInterval?: number; // polling interval (ms)
}

interface UseFetchReturn<T> {
  data?: T;
  loading: boolean;
  error?: Error;
  refetch: () => Promise<void>;
}

export function useFetch<T = unknown>(
  url: string,
  options?: UseFetchOptions
): UseFetchReturn<T>;
// Purpose: Wrapper around SWR for API calls with polling support
// Replaces: Manual useEffect + useState for data fetching
```

### useForm

```typescript
// hooks/useForm.ts
interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validate?: (values: T) => Record<string, string>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setValues: (values: Partial<T>) => void;
  resetForm: () => void;
}

export function useForm<T>(options: UseFormOptions<T>): UseFormReturn<T>;
// Purpose: Form state management (values, errors, submission)
// Replaces: Manual useState for forms (similar to Formik pattern)
```

---

## Service Layer

### menuService

```typescript
// services/menuService.ts
export const menuService = {
  getMenu: async (): Promise<MenuItem[]>,
  getMenuItemById: async (id: string): Promise<MenuItem>,
};
```

### orderService

```typescript
// services/orderService.ts
export const orderService = {
  createOrder: async (data: {
    phone: string;
    email: string;
    full_name: string;
    items: CartItem[];
    fulfillment_type: 'PICKUP' | 'DELIVERY';
    delivery_address?: string;
  }): Promise<Order>,
  
  getOrder: async (id: string): Promise<Order>,
  getOrders: async (filters?: {
    status?: OrderStatus[];
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>>,
  
  updateOrderStatus: async (
    id: string,
    status: OrderStatus,
    reason?: string
  ): Promise<Order>,
};
```

### paymentService

```typescript
// services/paymentService.ts
export const paymentService = {
  initializePayment: async (
    orderId: string,
    amount: number
  ): Promise<PaystackInitializeResponse>,
  
  verifyPayment: async (reference: string): Promise<PaystackVerifyResponse>,
  
  refundPayment: async (
    orderId: string,
    reason: string
  ): Promise<Order>,
};
```

### authService

```typescript
// services/authService.ts
export const authService = {
  login: async (
    email: string,
    password: string
  ): Promise<{ token: string; user: Admin }>,
  
  logout: async (): Promise<void>,
};
```

---

**Status:** Component specifications locked. Ready for Next.js scaffolding and implementation.
