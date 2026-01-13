// Order status enum
export enum OrderStatus {
  CREATED = 'CREATED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAID = 'PAID',
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

// User role enum
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// Fulfillment type
export enum FulfillmentType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

// Payment provider
export enum PaymentProvider {
  PAYSTACK = 'PAYSTACK',
  CASH = 'CASH',
}

// Payment status
export enum PaymentStatus {
  INITIATED = 'INITIATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Actor type for audit
export enum ActorType {
  SYSTEM = 'SYSTEM',
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
}

// Audit action
export enum AuditAction {
  STATUS_CHANGE = 'STATUS_CHANGE',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  REFUND = 'REFUND',
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  fulfillment_type: FulfillmentType;
  delivery_address?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  image_url?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  role: UserRole;
  phone?: string;
  email?: string;
  password_hash?: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
