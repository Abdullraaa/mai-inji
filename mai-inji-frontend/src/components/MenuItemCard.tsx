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
    <div className="card overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500">No image</span>
          </div>
        )}
        {!item.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded-lg font-semibold">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-600 mb-3 flex-1">{item.description}</p>

        {/* Price and Add to Cart */}
        <div className="space-y-3 mt-auto">
          <div className="text-xl font-bold text-green-600">{formatCurrency(item.price)}</div>

          {item.is_available ? (
            <div className="flex gap-2">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center border-0 focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(Math.min(99, quantity + 1))}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <Button
                onClick={handleAdd}
                variant="primary"
                className="flex-1"
                size="md"
              >
                Add to Cart
              </Button>
            </div>
          ) : (
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
