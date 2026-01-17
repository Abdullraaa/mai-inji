'use client';

import { useEffect, useState } from 'react';
import { MenuItem } from '@/types/api';
import { menuService } from '@/services/menuService';
import { useCart } from '@/store/cartStore';
import toast from 'react-hot-toast';
import MenuItemCard from './MenuItemCard';

interface MenuBrowserProps {
  showSearch?: boolean;
  showCategoryFilter?: boolean;
}

export default function MenuBrowser({ showSearch = true, showCategoryFilter = true }: MenuBrowserProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');
  const addItem = useCart((state) => state.addItem);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(undefined);
        const menuItems = await menuService.getMenu();
        setItems(menuItems);
      } catch (err) {
        console.error('Failed to fetch menu:', err);
        setError('Failed to load menu. Please try again.');
        toast.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const handleAddToCart = (item: MenuItem, quantity: number) => {
    addItem(item, quantity);
    toast.success(`${item.name} added to cart!`);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      {showSearch && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {search ? 'No items match your search' : 'No menu items available'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} available
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
