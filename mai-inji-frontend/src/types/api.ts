// Complete API type definitions matching backend contracts

// ============ Menu Types ============
export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number; // in kobo (1 NGN = 100 kobo)
  price_formatted: string; // e.g., "₦2,500"
  image_url: string;
  label?: string; // UI badge label (e.g., "Best Seller", "Signature")
  is_available: boolean;
  created_at: string; // ISO 8601
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

// ============ Order Types ============
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

// ============ Cart Types ============
export interface CartItem {
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number; // in kobo
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  itemCount: number;
}

// ============ Form Types ============
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

// ============ Payment Types ============
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

// ============ Admin Types ============
export interface Admin {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER';
}

export interface AuthToken {
  token: string;
  user: Admin;
  expires_in: number;
}

// ============ API Response Types ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    orders: T[];
    pagination: PaginationMeta;
  };
}

// ============ Analytics Types ============
export interface AnalyticsData {
  period: 'daily' | 'weekly' | 'monthly';
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
