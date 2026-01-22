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
        { id: '1', name: 'Shawarma', description: 'Classic spiced beef shawarma with creamy garlic sauce.', price: 2500, price_formatted: '₦2,500', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Shawarma },
        { id: '2', name: 'Burger', description: 'Juicy beef patty with fresh lettuce and house sauce.', price: 3500, price_formatted: '₦3,500', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Burger },
        { id: '3', name: 'Zobo', description: 'Refreshing hibiscus drink infused with ginger and cloves.', price: 1000, price_formatted: '₦1,000', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS.Zobo },
        { id: '4', name: 'Tigernut', description: 'Creamy tigernut milk (Kunu Aya) served chilled.', price: 1200, price_formatted: '₦1,200', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS.Tigernut },
        { id: '5', name: 'Yoghurt', description: 'Homestyle sweetened yoghurt parfaits.', price: 1500, price_formatted: '₦1,500', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS.Yoghurt },
        { id: '6', name: 'Arabian Tea', description: 'Spiced milky tea with cardamom notes.', price: 800, price_formatted: '₦800', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS["Arabian Tea"] },
        { id: '7', name: 'Masa', description: 'Soft rice cakes served with spicy miyan taushe.', price: 1500, price_formatted: '₦1,500', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Masa },
        { id: '8', name: 'Suya', description: 'Spicy grilled beef skewers (Stick meat).', price: 2000, price_formatted: '₦2,000', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Suya },
        { id: '9', name: 'Boba Tea', description: 'Sweet milk tea with chewy tapioca pearls.', price: 4000, price_formatted: '₦4,000', created_at: new Date().toISOString(), category_id: 'c2', is_available: true, image_url: MENU_ITEMS["Boba Tea"] },
        { id: '10', name: 'Pizza', description: 'Classic cheese and pepperoni pizza slice.', price: 4500, price_formatted: '₦4,500', created_at: new Date().toISOString(), category_id: 'c1', is_available: true, image_url: MENU_ITEMS.Pizza },
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
      throw error;
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
