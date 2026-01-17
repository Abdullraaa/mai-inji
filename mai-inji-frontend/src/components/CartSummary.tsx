'use client';

import Link from 'next/link';
import { useCart } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import Button from '@/app/components/ui/Button';

import { toast } from "react-hot-toast";

interface CartSummaryProps {
  minimal?: boolean; // Show only icon with count, for header
}

export default function CartSummary({ minimal = false }: CartSummaryProps) {
  const { itemCount, total } = useCart();

  const handleCheckout = () => {
    if (itemCount === 0) return;
    toast.success("Securing your order context...", {
      icon: "🔒",
      duration: 3000,
    });
  };

  if (minimal) {
    return (
      <Link href="/cart" className="relative">
        <div className="text-2xl">🛒</div>
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Items</span>
        <span className="font-semibold">{itemCount}</span>
      </div>
      <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
        <span className="text-lg font-bold">Total</span>
        <span className="text-2xl font-bold text-green-600">{formatCurrency(total)}</span>
      </div>
      <Link href="/checkout" className="w-full">
        <Button variant="primary" size="lg" className="w-full" onClick={handleCheckout}>
          Proceed to Checkout
        </Button>
      </Link>
    </div>
  );
}
