"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menuService = __importStar(require("../services/menuService"));
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// Get all menu items
router.get('/', async (req, res) => {
    try {
        const includeSoldOut = req.query.includeSoldOut === 'true';
        const items = await menuService.getMenuItems(includeSoldOut);
        (0, response_1.sendSuccess)(res, items);
    }
    catch (error) {
        console.error('Menu fetch error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch menu', 500);
    }
});
// Get menu item by ID
router.get('/:id', async (req, res) => {
    try {
        const item = await menuService.getMenuItemById(req.params.id);
        if (!item) {
            return (0, response_1.sendError)(res, 'Menu item not found', 404);
        }
        (0, response_1.sendSuccess)(res, item);
    }
    catch (error) {
        console.error('Menu item fetch error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch menu item', 500);
    }
});
exports.default = router;
//# sourceMappingURL=menu.js.map