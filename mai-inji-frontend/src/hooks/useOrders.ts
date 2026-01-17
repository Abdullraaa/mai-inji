/**
 * Custom hooks for Mai Inji frontend
 * Provides reusable logic for orders and analytics
 */

'use client';

import { useCallback, useState } from 'react';
import apiClient from '@/services/api';
import { Order, OrderStatus as OrderStatusEnum } from '@/types/api';
import toast from 'react-hot-toast';

/**
 * Hook for fetching and managing orders
 */
export const useOrders = (orderId?: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  /**
   * Fetch single order by ID
   */
  const fetchOrder = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<Order | { order: Order }>(`/orders/${id}`);
        const payload = response.data as Order | { order: Order };
        const resolvedOrder = 'order' in (payload as { order?: Order })
          ? (payload as { order: Order }).order
          : (payload as Order);
        setOrder(resolvedOrder);
        return resolvedOrder;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to fetch order';
        setError(message);
        console.error('Fetch order error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fetch orders list with filtering
   */
  const fetchOrders = useCallback(
    async (params?: { status?: string; page?: number; limit?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const response = await apiClient.get(`/orders?${queryParams.toString()}`);
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to fetch orders';
        setError(message);
        console.error('Fetch orders error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Create new order
   */
  const createOrder = useCallback(
    async (orderData: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.post<Order | { order: Order }>(
          '/orders',
          orderData
        );
        const payload = response.data as Order | { order: Order };
        const resolvedOrder = 'order' in (payload as { order?: Order })
          ? (payload as { order: Order }).order
          : (payload as Order);
        if (resolvedOrder) {
          setOrder(resolvedOrder);
        }
        return resolvedOrder;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to create order';
        setError(message);
        console.error('Create order error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Update order status
   */
  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatusEnum) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.patch<Order | { order: Order }>(
          `/orders/${id}/status`,
          { status }
        );
        const payload = response.data as Order | { order: Order };
        const resolvedOrder = 'order' in (payload as { order?: Order })
          ? (payload as { order: Order }).order
          : (payload as Order);
        setOrder(resolvedOrder);
        return resolvedOrder;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to update order status';
        setError(message);
        console.error('Update order status error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Process refund for order
   */
  const refundOrder = useCallback(
    async (id: string, reason?: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.post(`/orders/${id}/refund`, {
          reason: reason || 'Customer requested refund',
        });
        toast.success('Refund processed successfully');
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to process refund';
        setError(message);
        toast.error(message);
        console.error('Refund error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    order,
    orders,
    loading,
    error,
    pagination,
    fetchOrder,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    refundOrder,
  };
};

/**
 * Hook for fetching analytics data
 */
export const useAnalytics = () => {
  const [salesData, setSalesData] = useState<any>(null);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all analytics data
   */
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, popularRes, categoryRes] = await Promise.all([
        apiClient.get('/analytics/sales'),
        apiClient.get('/analytics/items/popular'),
        apiClient.get('/analytics/revenue/category'),
      ]);

      setSalesData(salesRes.data);
      setPopularItems(popularRes.data.items);
      setCategoryRevenue(categoryRes.data.categories);

      return {
        sales: salesRes.data,
        popular: popularRes.data.items,
        category: categoryRes.data.categories,
      };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch analytics';
      setError(message);
      console.error('Fetch analytics error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch sales summary
   */
  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/analytics/sales');
      setSalesData(response.data);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch sales data';
      setError(message);
      console.error('Fetch sales error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch popular items
   */
  const fetchPopularItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/analytics/items/popular');
      setPopularItems(response.data.items);
      return response.data.items;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch popular items';
      setError(message);
      console.error('Fetch popular items error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch category revenue
   */
  const fetchCategoryRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/analytics/revenue/category');
      setCategoryRevenue(response.data.categories);
      return response.data.categories;
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to fetch category revenue';
      setError(message);
      console.error('Fetch category revenue error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    salesData,
    popularItems,
    categoryRevenue,
    loading,
    error,
    fetchAnalytics,
    fetchSales,
    fetchPopularItems,
    fetchCategoryRevenue,
  };
};
