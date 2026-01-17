import apiClient from './api';
import { MenuItem, MenuCategory, ApiResponse } from '@/types/api';

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
