'use client';

import { useState } from 'react';
import { MenuItem } from '@/types/api';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import Button from '@/app/components/ui/Button';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity: number) => void;
}

export default function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    onAddToCart(item, quantity);
    setQuantity(1);
  };

  return (
    <div className="glass overflow-hidden flex flex-col hover:translate-y-[-4px] transition-transform duration-500">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden group">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 font-black uppercase text-xs tracking-widest">Image Loading</span>
          </div>
        )}
        {!item.is_available && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-2">{item.name}</h3>
        <p className="text-xs font-medium text-gray-500 mb-6 flex-1 leading-relaxed line-clamp-3">{item.description}</p>

        {/* Price and Add to Cart */}
        <div className="space-y-4 mt-auto">
          <div className="flex justify-between items-end">
            <div className="text-xl font-black italic text-burgundy">{formatCurrency(item.price)}</div>
          </div>

          {item.is_available ? (
            <div className="flex gap-3">
              <div className="flex items-center bg-gray-50 rounded-2xl px-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-400 hover:text-gray-900 font-bold"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-8 text-center bg-transparent border-none text-xs font-black focus:ring-0 p-0"
                />
                <button
                  onClick={() => setQuantity(Math.min(99, quantity + 1))}
                  className="px-3 py-2 text-gray-400 hover:text-gray-900 font-bold"
                >
                  +
                </button>
              </div>
              <Button
                onClick={handleAdd}
                variant="primary"
                className="flex-1 !py-3 !text-[10px]"
                size="sm"
              >
                ADD TO TRAY
              </Button>
            </div>
          ) : (
            <button
              disabled
              className="w-full px-4 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
