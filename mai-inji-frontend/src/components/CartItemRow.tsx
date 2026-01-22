'use client';

import { memo } from 'react';
import { CartItem } from '@/types/api';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/store/cartStore';

interface CartItemRowProps {
    item: CartItem;
    showSubtotals?: boolean;
}

const CartItemRow = memo(({ item, showSubtotals }: CartItemRowProps) => {
    const updateQuantity = useCart((state) => state.updateQuantity);
    const removeItem = useCart((state) => state.removeItem);

    return (
        <div className="glass p-6 md:p-8 flex items-center justify-between group hover:border-green-600/30 transition-colors">
            <div className="flex-1">
                <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg">{item.menu_item_name}</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{formatCurrency(item.unit_price)} <span className="text-gray-300 mx-2">|</span> UNIT</p>
                {showSubtotals && (
                    <p className="text-sm font-black text-green-600 mt-2 italic">
                        {formatCurrency(item.unit_price * item.quantity)}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-6">
                {/* Quantity Control */}
                <div className="flex items-center bg-gray-50 rounded-full px-1 shadow-inner">
                    <button
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 font-bold transition-colors"
                        aria-label="Decrease quantity"
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
                        className="w-8 text-center bg-transparent border-none text-xs font-black focus:ring-0 p-0"
                        aria-label="Quantity"
                    />
                    <button
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 font-bold transition-colors"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>
                </div>

                {/* Remove Button */}
                <button
                    onClick={() => removeItem(item.menu_item_id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all"
                    aria-label="Remove item"
                >
                    ✕
                </button>
            </div>
        </div>
    );
});

CartItemRow.displayName = 'CartItemRow';

export default CartItemRow;
