'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import apiClient from '@/services/api';
import { useAuth } from '@/store/authStore';
import { Order, OrderStatus as OrderStatusEnum } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SalesAnalytics {
  summary: {
    total_orders: number;
    completed_orders: number;
    total_revenue: number;
    average_order_value: number;
  };
  by_day: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  top_items: Array<{
    name: string;
    quantity_sold: number;
    revenue: number;
  }>;
}

interface PopularItem {
  id: string;
  name: string;
  quantity_sold: number;
  times_ordered: number;
  total_revenue: number;
}

interface CategoryRevenue {
  category_name: string;
  total_revenue: number;
  items_sold: number;
  percentage_of_total: number;
}

interface Pagination {
  page: number;
  limit: number;
  total_count: number;
  has_next: boolean;
  has_prev: boolean;
}

interface OrdersResponse {
  orders: Order[];
  pagination: Pagination;
}

export const AdminDashboard = () => {
  const router = useRouter();
  const { token, user, isAuthenticated, loadFromStorage } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  // Analytics state
  const [salesData, setSalesData] = useState<SalesAnalytics | null>(null);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);

  // Orders management state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // UI state
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [processingRefund, setProcessingRefund] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'analytics'>(
    'overview'
  );

  /**
   * Check auth on mount
   */
  useEffect(() => {
    loadFromStorage();
    setHydrated(true);
  }, [loadFromStorage]);

  /**
   * Redirect if not authenticated
   */
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      toast.error('Please log in as admin');
      router.push('/admin/login');
    }
  }, [hydrated, isAuthenticated, router]);

  /**
   * Fetch analytics data
   */
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const [salesRes, popularRes, categoryRes] = await Promise.all([
        apiClient.get<SalesAnalytics>('/analytics/sales'),
        apiClient.get<{ items: PopularItem[] }>('/analytics/items/popular'),
        apiClient.get<{ categories: CategoryRevenue[] }>('/analytics/revenue/category'),
      ]);

      setSalesData(salesRes.data);
      setPopularItems(popularRes.data.items);
      setCategoryRevenue(categoryRes.data.categories);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  /**
   * Fetch orders list
   */
  const fetchOrders = async (page: number = 1, status?: string) => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (status) params.append('status', status);

      const response = await apiClient.get<OrdersResponse>(
        `/orders?${params.toString()}`
      );

      setOrders(response.data.orders);
      setPagination(response.data.pagination);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  /**
   * Process refund for an order
   */
  const handleRefund = async (orderId: string) => {
    setProcessingRefund(orderId);
    try {
      const response = await apiClient.post(`/orders/${orderId}/refund`, {
        reason: 'Admin requested refund',
      });

      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (!(response.data as { success?: boolean }).success) {
          throw new Error('Refund failed');
        }
      }
      if (response.data) {
        toast.success(`Refund processed for order ${orderId}`);
        // Refresh orders
        await fetchOrders(currentPage, orderStatus);
        setSelectedOrder(null);
      }
    } catch (error: any) {
      console.error('Refund error:', error);
      const message =
        error.response?.data?.message || 'Failed to process refund';
      toast.error(message);
    } finally {
      setProcessingRefund(null);
    }
  };

  /**
   * Initial data load
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fafafa] dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4 text-green-600">⟳</div>
          <p className="text-gray-600 dark:text-gray-400 font-medium font-sans">Verifying Auth State...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
              <span className="text-green-600">Admin</span> Control
            </h1>
            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase"> {user?.email} </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('admin_user');
              router.push('/admin/login');
            }}
            className="px-6 py-2 bg-red-600/10 text-red-600 border border-red-600/20 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            Terminal Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/50 dark:bg-gray-950/50 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 flex gap-12">
          {['overview', 'orders', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === tab
                ? 'text-green-600'
                : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-green-600 rounded-t-full shadow-[0_-4px_12px_rgba(22,163,74,0.4)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-6 py-12">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {loadingAnalytics ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass rounded-[2rem] p-8 animate-pulse h-40" />
                ))
              ) : salesData ? (
                <>
                  <div className="glass rounded-[2.5rem] p-8 hover:translate-y-[-4px] transition-all shadow-2xl shadow-black/5 dark:shadow-white/5">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Volume</p>
                    <p className="text-4xl font-black">{salesData.summary.total_orders}</p>
                    <p className="text-[10px] text-green-500 font-bold mt-4 uppercase"> {salesData.summary.completed_orders} Processed </p>
                  </div>

                  <div className="glass rounded-[2.5rem] p-8 hover:translate-y-[-4px] transition-all shadow-2xl shadow-black/5 dark:shadow-white/5 border-l-4 border-green-600">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Revenue</p>
                    <p className="text-4xl font-black text-green-600">{formatCurrency(salesData.summary.total_revenue)}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase"> Gross Final </p>
                  </div>

                  <div className="glass rounded-[2.5rem] p-8 hover:translate-y-[-4px] transition-all shadow-2xl shadow-black/5 dark:shadow-white/5">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Efficiency</p>
                    <p className="text-4xl font-black">{formatCurrency(salesData.summary.average_order_value)}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase"> Per Transaction </p>
                  </div>

                  <div className="glass rounded-[2.5rem] p-8 hover:translate-y-[-4px] transition-all shadow-2xl shadow-black/5 dark:shadow-white/5 bg-green-600/5">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Retention</p>
                    <p className="text-4xl font-black">
                      {Math.round((salesData.summary.completed_orders / salesData.summary.total_orders) * 100)}%
                    </p>
                    <p className="text-[10px] text-green-600 font-bold mt-4 uppercase"> Completion Rate </p>
                  </div>
                </>
              ) : null}
            </div>

            {/* Quick Stats - Top Items */}
            <div className="glass rounded-[3rem] p-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="text-8xl font-black italic select-none">DATA</span>
              </div>
              <h2 className="text-2xl font-black mb-10 tracking-tight flex items-center gap-4">
                <span className="w-8 h-1 bg-green-600 rounded-full" />
                TOP PERFORMERS
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Merchant Item</th>
                      <th className="text-right py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Units Sold</th>
                      <th className="text-right py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Total Yield</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                    {salesData?.top_items.map((item) => (
                      <tr key={item.name} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all">
                        <td className="py-8 font-bold text-lg tracking-tight group-hover:text-green-600 transition-colors uppercase">{item.name}</td>
                        <td className="text-right font-mono font-medium">{item.quantity_sold}</td>
                        <td className="text-right font-black text-green-600 text-lg">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Control Bar */}
            <div className="glass rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-green-600 mb-1">Pipeline</h2>
                <h3 className="text-2xl font-black tracking-tight">ORDER MANAGEMENT</h3>
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Filter</span>
                <select
                  value={orderStatus}
                  onChange={(e) => {
                    setOrderStatus(e.target.value);
                    fetchOrders(1, e.target.value);
                  }}
                  className="px-8 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-green-600 outline-none transition-all"
                >
                  <option value="">ALL RECORDS</option>
                  <option value="CREATED">CREATED</option>
                  <option value="PAID">PAID</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="READY">READY</option>
                  <option value="OUT_FOR_DELIVERY">DELIVERY</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
              {loadingOrders ? (
                <div className="text-center py-24 glass rounded-[3rem]">
                  <div className="animate-spin text-4xl mb-6 text-green-600 mx-auto">⟳</div>
                  <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Synchronizing Pipeline...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-24 glass rounded-[3rem]">
                  <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No records found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="glass rounded-[2.5rem] p-8 hover:bg-white dark:hover:bg-gray-900 cursor-pointer transition-all border-l-8 border-transparent hover:border-green-600 group shadow-xl shadow-black/5"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-8">
                          <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-black text-xs text-gray-300 group-hover:bg-green-600 group-hover:text-white transition-all shadow-inner">
                            #{order.order_number.slice(-4)}
                          </div>
                          <div>
                            <p className="font-black text-2xl tracking-tight uppercase group-hover:text-green-600 transition-colors uppercase">{order.customer.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mt-2">
                              {order.customer.phone} <span className="mx-2">•</span> {formatDate(order.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                          <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                            {formatCurrency(order.total)}
                          </span>
                          <span
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${order.status === OrderStatusEnum.COMPLETED
                              ? 'bg-green-600 text-white shadow-green-600/20'
                              : order.status === OrderStatusEnum.REFUNDED
                                ? 'bg-red-600 text-white shadow-red-600/20'
                                : 'bg-blue-600 text-white shadow-blue-600/20'
                              }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && (
                <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => fetchOrders(currentPage - 1, orderStatus)}
                    disabled={!pagination.has_prev}
                    className="px-10 py-4 glass rounded-[1.5rem] disabled:opacity-30 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                  >
                    ← PREV
                  </button>
                  <p className="text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase">
                    DOC {pagination.page} / {Math.ceil(pagination.total_count / pagination.limit)}
                  </p>
                  <button
                    onClick={() => fetchOrders(currentPage + 1, orderStatus)}
                    disabled={!pagination.has_next}
                    className="px-10 py-4 glass rounded-[1.5rem] disabled:opacity-30 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                  >
                    NEXT →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {loadingAnalytics ? (
              <div className="text-center py-24 glass rounded-[3rem]">
                <div className="animate-spin text-4xl mb-6 text-green-600 mx-auto">⟳</div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Processing Intelligence...</p>
              </div>
            ) : (
              <>
                {/* Revenue by Category */}
                {categoryRevenue.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-lg font-bold mb-4">
                        Revenue by Category
                      </h2>
                      <Doughnut
                        data={{
                          labels: categoryRevenue.map((c) => c.category_name),
                          datasets: [
                            {
                              data: categoryRevenue.map((c) => c.total_revenue),
                              backgroundColor: [
                                '#10b981',
                                '#3b82f6',
                                '#f59e0b',
                                '#ef4444',
                                '#8b5cf6',
                                '#ec4899',
                              ],
                              borderColor: '#fff',
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                          },
                        }}
                      />
                    </div>

                    {/* Category Stats Table */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-lg font-bold mb-4">Category Details</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Category</th>
                              <th className="text-right py-2">Revenue</th>
                              <th className="text-right py-2">%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryRevenue.map((cat) => (
                              <tr key={cat.category_name} className="border-b">
                                <td className="py-3">{cat.category_name}</td>
                                <td className="text-right font-medium">
                                  {formatCurrency(cat.total_revenue)}
                                </td>
                                <td className="text-right">
                                  {cat.percentage_of_total.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Daily Sales */}
                {salesData?.by_day && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4">Daily Sales</h2>
                    <Line
                      data={{
                        labels: salesData.by_day.map((d) => formatDate(d.date)),
                        datasets: [
                          {
                            label: 'Revenue',
                            data: salesData.by_day.map((d) => d.revenue),
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                )}

                {/* Popular Items */}
                {popularItems.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4">Popular Items</h2>
                    <Bar
                      data={{
                        labels: popularItems.map((i) => i.name),
                        datasets: [
                          {
                            label: 'Quantity Sold',
                            data: popularItems.map((i) => i.quantity_sold),
                            backgroundColor: '#3b82f6',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal (Liquid Glass) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
          <div className="glass rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_32px_128px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500">
            <div className="p-10 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white/10 backdrop-blur-md z-10">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-green-600 mb-2">Record Detail</h2>
                <h3 className="text-3xl font-black tracking-tighter uppercase italic">Order #{selectedOrder.order_number}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-600 hover:text-white transition-all text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-10 space-y-12">
              {/* Customer Profile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Customer Entity</p>
                  <p className="text-xl font-black uppercase">{selectedOrder.customer.name}</p>
                  <p className="text-sm font-bold text-gray-500 mt-2">{selectedOrder.customer.email}</p>
                  <p className="text-sm font-bold text-gray-500">{selectedOrder.customer.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Fulfillment Logistics</p>
                  <p className="text-sm font-black uppercase text-green-600">{selectedOrder.fulfillment_type}</p>
                  <p className="text-sm font-bold text-gray-500 mt-2 leading-relaxed">
                    {selectedOrder.delivery_address || 'Collection at Source (Pickup)'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Manifest Description</p>
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <div key={item.menu_item_id} className="flex justify-between items-center py-4 border-b border-gray-50 dark:border-gray-900">
                      <div>
                        <p className="font-black uppercase tracking-tight">{item.menu_item_name}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                      </div>
                      <p className="text-lg font-black italic">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Recap */}
              <div className="bg-green-600/5 rounded-[2rem] p-8 border border-green-600/10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Total Settlement Value</span>
                  <span className="text-4xl font-black text-green-600 italic">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Action Suite */}
              <div className="pt-6 space-y-4">
                {(selectedOrder.status === OrderStatusEnum.COMPLETED ||
                  selectedOrder.status === OrderStatusEnum.PAID) && (
                    <button
                      onClick={() => handleRefund(selectedOrder.id)}
                      disabled={processingRefund === selectedOrder.id}
                      className="w-full py-5 glass font-black uppercase tracking-[0.3em] text-[10px] text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-xl shadow-orange-600/10"
                    >
                      {processingRefund === selectedOrder.id
                        ? 'Executing Reversal...'
                        : 'INITIATE TERMINAL REFUND'}
                    </button>
                  )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black uppercase tracking-[0.3em] text-[10px] rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                >
                  CLOSE RECORD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
