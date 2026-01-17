'use client';

import Link from 'next/link';
import { useCart } from '@/store/cartStore';
import CartItemList from '@/components/CartItemList';
import CartSummary from '@/components/CartSummary';
import Button from '../components/ui/Button';

export default function CartPage() {
  const cart = useCart();

  return (
    <main className="min-h-screen bg-transparent py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cart.itemCount === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-600 text-lg">Your cart is empty</p>
            <Link href="/menu">
              <Button variant="primary" size="md">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <CartItemList items={cart.items} />
              <div className="mt-6">
                <Link href="/menu" className="text-green-600 hover:text-green-700 font-medium">
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <CartSummary />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
