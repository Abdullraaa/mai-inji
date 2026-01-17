'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem } from '@/types/api';

interface CartStore {
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  itemCount: number;
  addItem: (item: MenuItem, quantity: number) => void;
  removeItem: (menu_item_id: string) => void;
  updateQuantity: (menu_item_id: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryFee: (fee: number) => void;
  recalculateTotal: () => void;
}

const calculateTotals = (items: CartItem[], delivery_fee: number = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const total = subtotal + delivery_fee;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal, total, itemCount };
};

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      subtotal: 0,
      delivery_fee: 0,
      total: 0,
      itemCount: 0,

      addItem: (item: MenuItem, quantity: number) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.menu_item_id === item.id);

          let newItems: CartItem[];
          if (existingItem) {
            newItems = state.items.map((i) =>
              i.menu_item_id === item.id ? { ...i, quantity: i.quantity + quantity } : i
            );
          } else {
            newItems = [
              ...state.items,
              {
                menu_item_id: item.id,
                menu_item_name: item.name,
                quantity,
                unit_price: item.price,
              },
            ];
          }

          const { subtotal, total, itemCount } = calculateTotals(newItems, state.delivery_fee);
          return { items: newItems, subtotal, total, itemCount };
        });
      },

      removeItem: (menu_item_id: string) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.menu_item_id !== menu_item_id);
          const { subtotal, total, itemCount } = calculateTotals(newItems, state.delivery_fee);
          return { items: newItems, subtotal, total, itemCount };
        });
      },

      updateQuantity: (menu_item_id: string, quantity: number) => {
        set((state) => {
          let newItems = state.items;
          if (quantity <= 0) {
            newItems = state.items.filter((i) => i.menu_item_id !== menu_item_id);
          } else {
            newItems = state.items.map((i) =>
              i.menu_item_id === menu_item_id ? { ...i, quantity } : i
            );
          }

          const { subtotal, total, itemCount } = calculateTotals(newItems, state.delivery_fee);
          return { items: newItems, subtotal, total, itemCount };
        });
      },

      clearCart: () => {
        set({ items: [], subtotal: 0, total: 0, itemCount: 0 });
      },

      setDeliveryFee: (fee: number) => {
        set((state) => {
          const { subtotal, total, itemCount } = calculateTotals(state.items, fee);
          return { delivery_fee: fee, subtotal, total };
        });
      },

      recalculateTotal: () => {
        set((state) => {
          const { subtotal, total, itemCount } = calculateTotals(state.items, state.delivery_fee);
          return { subtotal, total, itemCount };
        });
      },
    }),
    {
      name: 'mai-inji-cart',
      version: 1,
    }
  )
);
