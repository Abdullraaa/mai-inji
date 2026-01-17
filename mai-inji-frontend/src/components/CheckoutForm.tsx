'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCart } from '@/store/cartStore';
import { sendToWhatsApp } from '@/lib/whatsapp';
import { formatOrderMessage } from '@/lib/formatters';
import { CheckoutFormData, Order } from '@/types/api';
import { validatePhone } from '@/lib/utils';

interface CheckoutFormProps {
  onSuccess?: (order: Order) => void;
}

export const CheckoutForm = ({ onSuccess }: CheckoutFormProps) => {
  const router = useRouter();
  const { items, subtotal, delivery_fee, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    full_name: '',
    phone: '',
    email: '',
    delivery_address: '',
    fulfillment_type: 'DELIVERY',
    payment_method: 'CASH', // Default to Cash for WhatsApp flow
  });
  const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});

  /**
   * Validate form inputs before submission
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutFormData> = {};

    // Full name validation
    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 3) {
      newErrors.full_name = 'Full name must be at least 3 characters';
    }

    // Phone validation
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid Nigerian phone number (e.g., 08012345678)';
    }

    // Delivery address validation (only if delivery)
    if (formData.fulfillment_type === 'DELIVERY') {
      if (!formData.delivery_address?.trim()) {
        newErrors.delivery_address = 'Delivery address is required';
      } else if (formData.delivery_address.trim().length < 10) {
        newErrors.delivery_address = 'Please provide a complete delivery address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form input changes
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof CheckoutFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  /**
   * Submit order to WhatsApp
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      // Format the message for WhatsApp
      const message = formatOrderMessage({
        customerName: formData.full_name,
        phone: formData.phone,
        items: items.map(i => ({
          name: i.menu_item_name,
          quantity: i.quantity,
          price: i.unit_price
        })),
        total: total,
        notes: formData.fulfillment_type === 'DELIVERY'
          ? `Delivery to: ${formData.delivery_address}`
          : 'Customer will pickup',
      });

      toast.loading('Redirecting to WhatsApp...', { duration: 2000 });

      // Small delay to let the toast be seen
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to WhatsApp
      sendToWhatsApp(message);

      // Clear cart
      clearCart();

      // Trigger success UI or redirect
      toast.success('WhatsApp opened! Please send the message to complete your order.');

      router.push('/menu');
    } catch (error: any) {
      console.error('WhatsApp redirect error:', error);
      toast.error('Failed to open WhatsApp. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="mb-12">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-green-600 mb-2">Finalization</h2>
        <h1 className="text-5xl font-black tracking-tighter uppercase italic">Secure Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Checkout Form */}
        <div className="glass rounded-[3rem] p-8 md:p-12 order-2 lg:order-1 shadow-[0_32px_128px_rgba(0,0,0,0.05)] border-t-8 border-green-600">
          <h2 className="text-sm font-black uppercase tracking-widest mb-10 pb-4 border-b border-gray-100 dark:border-gray-800">1. Customer Information</h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Full Name */}
            <div className="group">
              <label htmlFor="full_name" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 transition-colors group-focus-within:text-green-600">
                Full Legal Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 transition-all font-bold ${errors.full_name ? 'ring-2 ring-red-500' : 'focus:ring-green-600'
                  }`}
                disabled={loading}
              />
              {errors.full_name && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-wide">{errors.full_name}</p>}
            </div>

            {/* Contact Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group hidden">  {/* Hidden for WhatsApp flow */}
                <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 transition-colors group-focus-within:text-green-600">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 transition-all font-bold ${errors.email ? 'ring-2 ring-red-500' : 'focus:ring-green-600'
                    }`}
                  disabled={loading}
                />
                {errors.email && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-wide">{errors.email}</p>}
              </div>

              <div className="group col-span-2">
                <label htmlFor="phone" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 transition-colors group-focus-within:text-green-600">
                  Primary Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08012345678"
                  maxLength={11}
                  className={`w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 transition-all font-bold ${errors.phone ? 'ring-2 ring-red-500' : 'focus:ring-green-600'
                    }`}
                  disabled={loading}
                />
                {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-wide">{errors.phone}</p>}
              </div>
            </div>

            <h2 className="text-sm font-black uppercase tracking-widest mb-10 pb-4 border-b border-gray-100 dark:border-gray-800 pt-6">2. Logistics</h2>

            {/* Fulfillment Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-2">
                <label htmlFor="fulfillment_type" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  Fulfillment Mode
                </label>
                <select
                  id="fulfillment_type"
                  name="fulfillment_type"
                  value={formData.fulfillment_type}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-green-600 transition-all font-black uppercase text-[10px] tracking-widest"
                  disabled={loading}
                >
                  <option value="DELIVERY">Delivery</option>
                  <option value="PICKUP">Pickup</option>
                </select>
              </div>

              <div className="hidden"> {/* Hidden for WhatsApp flow */}
                <label htmlFor="payment_method" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  Settlement Method
                </label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-green-600 transition-all font-black uppercase text-[10px] tracking-widest"
                  disabled={loading}
                >
                  <option value="PAYSTACK">💳 ONLINE (PAYSTACK)</option>
                  <option value="CASH">💰 CASH ON DELIVERY</option>
                </select>
              </div>
            </div>

            {/* Delivery Address (conditional) */}
            {formData.fulfillment_type === 'DELIVERY' && (
              <div className="animate-in slide-in-from-top-4 duration-500">
                <label htmlFor="delivery_address" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  Physical Address
                </label>
                <textarea
                  id="delivery_address"
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  placeholder="e.g., 123 Main Street, Lafia"
                  rows={3}
                  className={`w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 transition-all font-bold ${errors.delivery_address ? 'ring-2 ring-red-500' : 'focus:ring-green-600'
                    }`}
                  disabled={loading}
                />
                {errors.delivery_address && (
                  <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-wide">{errors.delivery_address}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs text-white shadow-2xl transition-all active:scale-95 ${loading || items.length === 0
                ? 'bg-gray-400 cursor-not-allowed shadow-none'
                : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-3 font-normal">⟳</span>
                  Opening WhatsApp...
                </span>
              ) : (
                `Place Order via WhatsApp (₦${total.toLocaleString()})`
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="order-1 lg:order-2 space-y-8">
          <div className="glass rounded-[3rem] p-8 md:p-12 shadow-[0_32px_128px_rgba(0,0,0,0.03)] border border-white/20">
            <h2 className="text-sm font-black uppercase tracking-widest mb-10 pb-4 border-b border-gray-100 dark:border-gray-800">Cart Inventory</h2>
            <div className="space-y-6 mb-10">
              {items.map((item) => (
                <div key={item.menu_item_id} className="flex justify-between items-start animate-in fade-in duration-700">
                  <div>
                    <p className="font-black uppercase tracking-tight text-lg leading-tight">{item.menu_item_name}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                      Units: {item.quantity} × ₦{item.unit_price.toLocaleString()}
                    </p>
                  </div>
                  <span className="font-black text-lg italic text-green-600">₦{(item.unit_price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Base Yield</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Logistics Fee</span>
                <span>₦{delivery_fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-xs font-black uppercase tracking-widest">Total settlement</span>
                <span className="text-4xl font-black italic text-green-600 tracking-tighter">₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-8 bg-black dark:bg-white text-white dark:text-black rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
              <span className="text-6xl italic font-black">!</span>
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest mb-4">Protocol Note</h3>
            <p className="text-sm font-bold leading-relaxed opacity-80">
              Your order will be verified by our coordination team. You will receive a secure confirmation and logistics update shortly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
