import apiClient from './api';
import { Order, ApiResponse, PaginatedResponse, CartItem, CheckoutFormData } from '@/types/api';
import { env } from '@/lib/env';

type BackendOrderPayload = {
  items: Array<{ menuItemId: string; quantity: number }>;
  fulfillmentType: 'PICKUP' | 'DELIVERY';
  deliveryAddress?: string;
  userEmail: string;
};

const mapToBackendPayload = (data: {
  phone: string;
  email: string;
  full_name: string;
  items: CartItem[];
  fulfillment_type: 'PICKUP' | 'DELIVERY';
  delivery_address?: string;
}): BackendOrderPayload => ({
  items: data.items.map((item) => ({
    menuItemId: item.menu_item_id,
    quantity: item.quantity,
  })),
  fulfillmentType: data.fulfillment_type,
  deliveryAddress: data.delivery_address,
  userEmail: data.email,
});

const resolveOrder = (payload: unknown): Order => {
  if (payload && typeof payload === 'object' && 'id' in payload) {
    return payload as Order;
  }
  const envelope = payload as ApiResponse<Order>;
  if (envelope?.success && envelope.data) {
    return envelope.data;
  }
  throw new Error(envelope?.error || 'Order request failed');
};

export const orderService = {
  /**
   * Create a new order
   */
  createOrder: async (data: {
    phone: string;
    email: string;
    full_name: string;
    items: CartItem[];
    fulfillment_type: 'PICKUP' | 'DELIVERY';
    delivery_address?: string;
  }): Promise<Order> => {
    try {
      if (env.orderMode !== 'backend') {
        throw new Error('Backend order mode is disabled. Use WhatsApp checkout.');
      }

      const payload = mapToBackendPayload(data);
      const response = await apiClient.post<Order | ApiResponse<Order>>('/orders', payload);
      return resolveOrder(response.data);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Get order details by ID
   */
  getOrder: async (id: string): Promise<Order> => {
    try {
      const response = await apiClient.get<Order | ApiResponse<Order>>(`/orders/${id}`);
      return resolveOrder(response.data);
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all orders (admin only) with pagination
   */
  getOrders: async (filters?: {
    status?: string[];
    page?: number;
    limit?: number;
  }): Promise<Order[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<PaginatedResponse<Order>['data'] | ApiResponse<PaginatedResponse<Order>['data']>>(
        `/orders?${params.toString()}`
      );
      const payload = response.data as PaginatedResponse<Order>['data'] | ApiResponse<PaginatedResponse<Order>['data']>;
      if (payload && typeof payload === 'object' && 'success' in payload) {
        if (payload.success && payload.data?.orders) {
          return payload.data.orders;
        }
        throw new Error(payload.error || 'Failed to fetch orders');
      }
      return (payload as PaginatedResponse<Order>['data']).orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  /**
   * Update order status (admin only)
   */
  updateOrderStatus: async (id: string, status: string, reason?: string): Promise<Order> => {
    try {
      const response = await apiClient.patch<Order | ApiResponse<Order>>(`/orders/${id}/status`, {
        status,
        reason: reason || 'Updated by admin',
      });

      return resolveOrder(response.data);
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      throw error;
    }
  },
};
