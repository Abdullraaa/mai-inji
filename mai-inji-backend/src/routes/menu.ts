import { Router, Request, Response } from 'express';
import * as menuService from '../services/menuService';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// Get all menu items
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeSoldOut = req.query.includeSoldOut === 'true';
    const items = await menuService.getMenuItems(includeSoldOut);
    sendSuccess(res, items);
  } catch (error) {
    console.error('Menu fetch error:', error);
    sendError(res, 'Failed to fetch menu', 500);
  }
});

// Get menu item by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await menuService.getMenuItemById(req.params.id);
    if (!item) {
      return sendError(res, 'Menu item not found', 404);
    }
    sendSuccess(res, item);
  } catch (error) {
    console.error('Menu item fetch error:', error);
    sendError(res, 'Failed to fetch menu item', 500);
  }
});

export default router;
