import { MenuItem } from '../types';
export declare function getMenuItems(includeSoldOut?: boolean): Promise<any[]>;
export declare function getMenuItemById(id: string): Promise<MenuItem | null>;
export declare function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem>;
//# sourceMappingURL=menuService.d.ts.map