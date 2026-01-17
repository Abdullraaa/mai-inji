'use client';

import { CartItem } from '@/types/api';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/store/cartStore';

interface CartItemListProps {
  items: CartItem[];
  showSubtotals?: boolean;
}

export default function CartItemList({ items, showSubtotals = true }: CartItemListProps) {
  const { removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.menu_item_id} className="card p-4 flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{item.menu_item_name}</h3>
            <p className="text-sm text-gray-600">{formatCurrency(item.unit_price)} each</p>
            {showSubtotals && (
              <p className="text-sm font-medium text-green-600 mt-1">
                Subtotal: {formatCurrency(item.unit_price * item.quantity)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Quantity Control */}
            <div className="flex items-center border border-gray-300 rounded-lg bg-white">
              <button
                onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => {
                  const newQty = parseInt(e.target.value) || 1;
                  updateQuantity(item.menu_item_id, newQty);
                }}
                className="w-10 text-center border-0 focus:outline-none"
              />
              <button
                onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => removeItem(item.menu_item_id)}
              className="text-red-600 hover:text-red-700 font-medium px-3 py-1"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
