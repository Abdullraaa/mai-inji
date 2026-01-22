'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '@/services/api';
import { Order, OrderStatus as OrderStatusEnum } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OrderStatusDisplayProps {
  orderId: string;
  onStatusChange?: (order: Order) => void;
}

/**
 * Status badge color mapping
 */
const getStatusColor = (
  status: OrderStatusEnum
): {
  bg: string;
  text: string;
  icon: string;
  border: string;
} => {
  const statusMap: Record<
    OrderStatusEnum,
    { bg: string; text: string; icon: string; border: string }
  > = {
    [OrderStatusEnum.CREATED]: { bg: 'bg-gray-50', text: 'text-gray-600', icon: '⏱️', border: 'border-gray-200' },
    [OrderStatusEnum.PAYMENT_PENDING]: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '💳', border: 'border-orange-200' },
    [OrderStatusEnum.PAID]: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '✓', border: 'border-blue-200' },
    [OrderStatusEnum.REJECTED]: { bg: 'bg-red-50', text: 'text-red-700', icon: '✗', border: 'border-red-200' },
    [OrderStatusEnum.ACCEPTED]: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: '👨‍🍳', border: 'border-indigo-200' },
    [OrderStatusEnum.PREPARING]: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '🔪', border: 'border-purple-200' },
    [OrderStatusEnum.READY]: { bg: 'bg-green-50', text: 'text-green-700', icon: '✓', border: 'border-green-200' },
    [OrderStatusEnum.READY_FOR_PICKUP]: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: '📦',
      border: 'border-green-200'
    },
    [OrderStatusEnum.OUT_FOR_DELIVERY]: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      icon: '🚗',
      border: 'border-cyan-200'
    },
    [OrderStatusEnum.COMPLETED]: { bg: 'bg-green-50', text: 'text-green-700', icon: '🎉', border: 'border-green-200' },
    [OrderStatusEnum.CANCELLED]: { bg: 'bg-red-50', text: 'text-red-700', icon: '🚫', border: 'border-red-200' },
    [OrderStatusEnum.REFUNDING]: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '↩️', border: 'border-orange-200' },
    [OrderStatusEnum.REFUNDED]: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '↩️', border: 'border-orange-200' },
  };

  return statusMap[status] || statusMap[OrderStatusEnum.CREATED];
};

/**
 * Get human-readable status label
 */
const getStatusLabel = (status: OrderStatusEnum): string => {
  const labels: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.CREATED]: 'Created',
    [OrderStatusEnum.PAYMENT_PENDING]: 'Payment Pending',
    [OrderStatusEnum.PAID]: 'Payment Confirmed',
    [OrderStatusEnum.REJECTED]: 'Rejected',
    [OrderStatusEnum.ACCEPTED]: 'Accepted',
    [OrderStatusEnum.PREPARING]: 'Preparing',
    [OrderStatusEnum.READY]: 'Ready',
    [OrderStatusEnum.READY_FOR_PICKUP]: 'Ready for Pickup',
    [OrderStatusEnum.OUT_FOR_DELIVERY]: 'Out for Delivery',
    [OrderStatusEnum.COMPLETED]: 'Completed',
    [OrderStatusEnum.CANCELLED]: 'Cancelled',
    [OrderStatusEnum.REFUNDING]: 'Processing Refund',
    [OrderStatusEnum.REFUNDED]: 'Refunded',
  };

  return labels[status] || status;
};

export const OrderStatusDisplay = ({ orderId, onStatusChange }: OrderStatusDisplayProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 60;

  const fetchOrder = useCallback(async () => {
    try {
      const response = await apiClient.get<Order | { order: Order }>(`/orders/${orderId}`);
      const payload = response.data as Order | { order: Order };
      const resolvedOrder = 'order' in (payload as { order?: Order })
        ? (payload as { order: Order }).order
        : (payload as Order);
      if (resolvedOrder) {
        setOrder(resolvedOrder);
        setError(null);
        if (onStatusChange) {
          onStatusChange(resolvedOrder);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      const message =
        err.response?.data?.message || 'Failed to load order status. Please try again later.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [orderId, onStatusChange]);

  useEffect(() => {
    fetchOrder();

    const pollInterval = setInterval(() => {
      setPollCount((prev) => {
        const newCount = prev + 1;
        if (newCount > maxPolls) {
          clearInterval(pollInterval);
          return prev;
        }
        fetchOrder();
        return newCount;
      });
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [orderId, fetchOrder]);

  if (loading && !order) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⟳</div>
            <p className="text-gray-600">Loading order status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold mb-4">{error}</p>
          <button
            onClick={fetchOrder}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const statusColor = getStatusColor(order.status);
  const statusLabel = getStatusLabel(order.status);
  const isCompleted = order.status === OrderStatusEnum.COMPLETED;
  const isRefunded = order.status === OrderStatusEnum.REFUNDED;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Order Status</h1>
      <p className="text-gray-600 mb-6">Order #{order.order_number}</p>

      <div className={`glass border ${statusColor.border} ${statusColor.bg} bg-opacity-50 p-8 rounded-[2rem] mb-10 flex flex-col items-center text-center shadow-none`}>
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-xl text-4xl">
          {statusColor.icon}
        </div>
        <h2 className={`text-3xl font-black uppercase tracking-tight ${statusColor.text} mb-2`}>{statusLabel}</h2>
        <p className="text-xs font-bold uppercase tracking-widest opacity-60">
          Last updated: {formatDate(new Date().toISOString())}
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Order Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Customer Name</p>
            <p className="font-medium">{order.customer.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{order.customer.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{order.customer.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fulfillment Type</p>
            <p className="font-medium">
              {order.fulfillment_type === 'DELIVERY' ? '🚗 Delivery' : '📦 Pickup'}
            </p>
          </div>
        </div>

        {order.delivery_address && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">Delivery Address</p>
            <p className="font-medium">{order.delivery_address}</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Items</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.menu_item_id}
              className="flex justify-between pb-3 border-b last:border-b-0"
            >
              <div>
                <p className="font-medium">{item.menu_item_name}</p>
                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(item.unit_price)} each
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee:</span>
            <span>{formatCurrency(order.delivery_fee)}</span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span className="text-green-600">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-2">Payment</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-600">Provider:</span>
            <span className="ml-2 font-medium">
              {order.payment.provider === 'PAYSTACK' ? '💳 Paystack' : '💰 Cash'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Reference:</span>
            <span className="ml-2 font-mono text-xs break-all">{order.payment.reference}</span>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <span
              className={`ml-2 font-medium ${order.payment.status === 'SUCCESS' ? 'text-green-600' : 'text-yellow-600'
                }`}
            >
              {order.payment.status}
            </span>
          </div>
        </div>
      </div>

      {order.status_history && order.status_history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Status History</h3>
          <div className="space-y-4">
            {order.status_history.map((entry, index) => {
              const entryColor = getStatusColor(entry.status);
              return (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${entryColor.bg}`} />
                    {index < order.status_history.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium">{getStatusLabel(entry.status)}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(entry.timestamp)}
                    </p>
                    {entry.reason && (
                      <p className="text-sm text-gray-500 mt-1">{entry.reason}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          ℹ️ Status updates are checked every 10 seconds. {isCompleted && '✓ Order complete!'}
          {isRefunded && '↩️ Order has been refunded.'}
        </p>
      </div>
    </div>
  );
};

export default OrderStatusDisplay;
