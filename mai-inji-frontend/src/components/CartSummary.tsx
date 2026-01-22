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
    <div className="glass p-8 space-y-6 sticky top-24">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total Items</span>
        <span className="font-black text-lg">{itemCount}</span>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex justify-between items-end">
        <span className="text-sm font-black uppercase tracking-widest text-gray-900">Estimated Total</span>
        <span className="text-4xl font-black italic text-burgundy tracking-tighter">{formatCurrency(total)}</span>
      </div>
      <Link href="/checkout" className="w-full block pt-4">
        <Button variant="primary" size="lg" className="w-full py-5! text-sm" onClick={handleCheckout}>
          SECURE CHECKOUT
        </Button>
      </Link>
    </div>
  );
}
