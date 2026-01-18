import { CartItem } from '@/types/api';
import Link from 'next/link';
import CartItemRow from './CartItemRow';

interface CartItemListProps {
  items: CartItem[];
  showSubtotals?: boolean;
}

export default function CartItemList({ items, showSubtotals = true }: CartItemListProps) {
  // We don't need actions here anymore, only items are passed in props.
  // Actually, wait, the parent passes 'items'.
  // If we need nothing from store here, we can remove useCart hook effectively?
  // But wait, the component was using useCart for actions. Now rows handle actions.
  // So we can remove useCart import if not used?
  // Let's check original file. It used useCart for removeItem/updateQuantity.
  // Now CartItemRow handles that.

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
        <CartItemRow key={item.menu_item_id} item={item} showSubtotals={showSubtotals} />
      ))}
    </div>
  );
}
