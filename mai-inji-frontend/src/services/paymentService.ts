import apiClient from './api';
import { Order, ApiResponse, PaystackInitializeResponse } from '@/types/api';

const resolveApiEnvelope = <T>(payload: unknown, fallbackError: string): T => {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const envelope = payload as ApiResponse<T>;
    if (envelope.success && envelope.data) {
      return envelope.data;
    }
    throw new Error(envelope.error || fallbackError);
  }
  return payload as T;
};

export const paymentService = {
  /**
   * Initialize Paystack payment
   */
  initializePayment: async (orderId: string, amount: number): Promise<PaystackInitializeResponse> => {
    try {
      const response = await apiClient.post<PaystackInitializeResponse>(
        `/orders/${orderId}/payment`,
        { amount }
      );
      return resolveApiEnvelope<PaystackInitializeResponse>(response.data, 'Payment initialization failed');
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw error;
    }
  },

  /**
   * Verify payment after Paystack callback
   */
  verifyPayment: async (reference: string): Promise<Order> => {
    try {
      const response = await apiClient.post<Order | ApiResponse<Order>>('/orders/payment/verify', {
        reference,
      });

      return resolveApiEnvelope<Order>(response.data, 'Payment verification failed');
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },

  /**
   * Refund an order (admin only)
   */
  refundOrder: async (orderId: string, reason: string): Promise<Order> => {
    try {
      const response = await apiClient.post<Order | ApiResponse<Order>>(
        `/orders/${orderId}/refund`,
        { reason }
      );

      return resolveApiEnvelope<Order>(response.data, 'Refund initiation failed');
    } catch (error) {
      console.error('Error refunding order:', error);
      throw error;
    }
  },
};
