import apiClient from './api';
import { MenuItem, MenuCategory, ApiResponse } from '@/types/api';
import { env } from '@/lib/env';

interface MenuResponse {
  categories: MenuCategory[];
  items: MenuItem[];
}

const normalizeMenuResponse = (payload: unknown): MenuItem[] => {
  if (Array.isArray(payload)) {
    return payload as MenuItem[];
  }

  if (payload && typeof payload === 'object') {
    const envelope = payload as ApiResponse<MenuResponse | MenuItem[]>;
    if (envelope.success === false) {
      throw new Error(envelope.error || 'Failed to fetch menu');
    }
    if (envelope.success && envelope.data) {
      return normalizeMenuResponse(envelope.data);
    }

    const menu = payload as MenuResponse;
    if (Array.isArray(menu.items)) {
      return menu.items;
    }
  }

  throw new Error('Failed to fetch menu');
};

export const menuService = {
  /**
   * Fetch all menu items with categories
   */
  getMenu: async (includeSoldOut: boolean = false): Promise<MenuItem[]> => {
    // Soft Launch Mode: Return static data
    if (env.softLaunchMode) {
      const { MENU_ITEMS } = await import('@/lib/assets');

      const mockItems: MenuItem[] = [
        { id: '1', name: 'Signature Shawarma', description: 'Our famous chicken shawarma, toasted to perfection with creamy garlic sauce and fresh veggies.', price: 2500, price_formatted: '₦2,500', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Shawarma },
        { id: '2', name: 'Gourmet Beef Burger', description: 'Double beef patty, melted cheese, caramelized onions, and house secret sauce on a brioche bun.', price: 4500, price_formatted: '₦4,500', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Burger },
        { id: '3', name: 'Hibiscus Zobo (Chilled)', description: 'Refreshing hibiscus punch infused with ginger, cloves, and natural pineapple essence.', price: 1000, price_formatted: '₦1,000', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS.Zobo },
        { id: '4', name: 'Creamy Tigernut Milk', description: 'Rich, dairy-free Kunu Aya beverage made from fresh tigernuts and dates.', price: 1500, price_formatted: '₦1,500', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS.Tigernut },
        { id: '5', name: 'Yoghurt Parfait', description: 'Creamy Greek-style yoghurt layered with granola, honey, and seasonal fruits.', price: 2500, price_formatted: '₦2,500', created_at: new Date().toISOString(), category_id: 'c3', is_available: true, image_url: MENU_ITEMS.Yoghurt },
        { id: '6', name: 'Spiced Arabian Tea', description: 'Aromatic milk tea brewed with cardamom, cinnamon, and special Arabian spices.', price: 1200, price_formatted: '₦1,200', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS["Arabian Tea"] },
        { id: '7', name: 'Masa Platter', description: 'Soft fermented rice cakes served hot with spicy Miyan Taushe and beef chunks.', price: 2000, price_formatted: '₦2,000', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Masa },
        { id: '8', name: 'Beef Suya Skewers', description: 'Authentic coal-grilled beef skewers dusted with spicy Yaji pepper blend.', price: 1500, price_formatted: '₦1,500', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Suya },
        { id: '9', name: 'Boba Milk Tea', description: 'Sweet milk tea features chewy tapioca pearls and brown sugar syrup.', price: 4000, price_formatted: '₦4,000', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS["Boba Tea"] },
        { id: '10', name: 'Pepperoni Pizza Slice', description: 'Classic cheesy pizza slice topped with premium beef pepperoni.', price: 3000, price_formatted: '₦3,000', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Pizza },
      ];
      return mockItems;
    }

    try {
      const response = await apiClient.get<MenuResponse | MenuItem[] | ApiResponse<MenuResponse | MenuItem[]>>(
        `/menu?include_sold_out=${includeSoldOut}`
      );
      return normalizeMenuResponse(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      // Try to fall back to static mock items so the UI still renders gracefully
      try {
        const { MENU_ITEMS } = await import('@/lib/assets');
        const fallback: MenuItem[] = [
          { id: '1', name: 'Signature Shawarma', description: 'Our famous chicken shawarma, toasted to perfection with creamy garlic sauce and fresh veggies.', price: 2500, price_formatted: '₦2,500', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Shawarma },
          { id: '2', name: 'Gourmet Beef Burger', description: 'Double beef patty, melted cheese, caramelized onions, and house secret sauce on a brioche bun.', price: 4500, price_formatted: '₦4,500', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Burger },
          { id: '3', name: 'Hibiscus Zobo (Chilled)', description: 'Refreshing hibiscus punch infused with ginger, cloves, and natural pineapple essence.', price: 1000, price_formatted: '₦1,000', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS.Zobo },
          { id: '4', name: 'Creamy Tigernut Milk', description: 'Rich, dairy-free Kunu Aya beverage made from fresh tigernuts and dates.', price: 1500, price_formatted: '₦1,500', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS.Tigernut },
          { id: '5', name: 'Yoghurt Parfait', description: 'Creamy Greek-style yoghurt layered with granola, honey, and seasonal fruits.', price: 2500, price_formatted: '₦2,500', created_at: new Date().toISOString(), category_id: 'c3', is_available: true, image_url: MENU_ITEMS.Yoghurt },
          { id: '6', name: 'Spiced Arabian Tea', description: 'Aromatic milk tea brewed with cardamom, cinnamon, and special Arabian spices.', price: 1200, price_formatted: '₦1,200', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS["Arabian Tea"] },
          { id: '7', name: 'Masa Platter', description: 'Soft fermented rice cakes served hot with spicy Miyan Taushe and beef chunks.', price: 2000, price_formatted: '₦2,000', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Masa },
          { id: '8', name: 'Beef Suya Skewers', description: 'Authentic coal-grilled beef skewers dusted with spicy Yaji pepper blend.', price: 1500, price_formatted: '₦1,500', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Suya },
          { id: '9', name: 'Boba Milk Tea', description: 'Sweet milk tea features chewy tapioca pearls and brown sugar syrup.', price: 4000, price_formatted: '₦4,000', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS["Boba Tea"] },
          { id: '10', name: 'Pepperoni Pizza Slice', description: 'Classic cheesy pizza slice topped with premium beef pepperoni.', price: 3000, price_formatted: '₦3,000', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Pizza },
        ];
        return fallback;
      } catch (err) {
        // If even the assets import fails, rethrow the original error
        throw error;
      }
    }
  },

  /**
   * Fetch single menu item by ID
   */
  getMenuItemById: async (id: string): Promise<MenuItem> => {
    try {
      const response = await apiClient.get<MenuItem | ApiResponse<MenuItem>>(`/menu/${id}`);
      const payload = response.data as MenuItem | ApiResponse<MenuItem>;
      if (payload && typeof payload === 'object' && 'success' in payload) {
        if (payload.success && payload.data) {
          return payload.data;
        }
        throw new Error(payload.error || 'Menu item not found');
      }
      return payload as MenuItem;
    } catch (error) {
      console.error(`Error fetching menu item ${id}:`, error);
      throw error;
    }
  },
};
