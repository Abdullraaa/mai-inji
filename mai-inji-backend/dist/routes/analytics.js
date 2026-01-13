"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
/**
 * GET /api/analytics/sales
 * Sales analytics with revenue, order count, top items
 * Query: ?period=daily|weekly|monthly, ?start_date=YYYY-MM-DD, ?end_date=YYYY-MM-DD
 */
router.get('/sales', async (req, res) => {
    const { period = 'daily', start_date, end_date } = req.query;
    try {
        // Summary stats for all time
        const summaryResult = await connection_1.default.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total ELSE 0 END), 0) as total_revenue,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status IN ('PAYMENT_PENDING', 'ACCEPTED', 'PREPARING', 'READY') THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status IN ('CANCELLED', 'REJECTED', 'REFUNDED') THEN 1 END) as failed_orders
      FROM orders
      WHERE deleted_at IS NULL
    `);
        const summary = summaryResult.rows[0];
        const totalOrders = parseInt(summary.total_orders || '0');
        const averageOrderValue = totalOrders > 0
            ? Math.round(parseInt(summary.total_revenue || '0') / totalOrders)
            : 0;
        // Revenue by day (last 7 days)
        const byDayResult = await connection_1.default.query(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total ELSE 0 END), 0) as revenue,
        COUNT(*) as order_count,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status IN ('CANCELLED', 'REJECTED', 'REFUNDED') THEN 1 END) as failed
      FROM orders
      WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
        // Top 5 items by quantity sold
        const topItemsResult = await connection_1.default.query(`
      SELECT 
        oi.menu_item_id,
        mi.name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.subtotal) as revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'COMPLETED' AND o.deleted_at IS NULL
      GROUP BY oi.menu_item_id, mi.name
      ORDER BY quantity_sold DESC
      LIMIT 5
    `);
        res.json({
            success: true,
            data: {
                period: period || 'daily',
                summary: {
                    total_revenue: parseInt(summary.total_revenue || '0'),
                    total_orders: totalOrders,
                    average_order_value: averageOrderValue,
                    completed_orders: parseInt(summary.completed_orders || '0'),
                    pending_orders: parseInt(summary.pending_orders || '0'),
                    failed_orders: parseInt(summary.failed_orders || '0'),
                },
                by_day: byDayResult.rows.map((row) => ({
                    date: row.date,
                    revenue: parseInt(row.revenue || '0'),
                    order_count: parseInt(row.order_count || '0'),
                    completed: parseInt(row.completed || '0'),
                    failed: parseInt(row.failed || '0'),
                })),
                top_items: topItemsResult.rows.map((row) => ({
                    menu_item_id: row.menu_item_id,
                    name: row.name,
                    quantity_sold: parseInt(row.quantity_sold || '0'),
                    revenue: parseInt(row.revenue || '0'),
                })),
            },
        });
    }
    catch (error) {
        console.error('Analytics sales error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sales analytics',
        });
    }
});
/**
 * GET /api/analytics/items/popular
 * Top 10 selling items by quantity
 */
router.get('/items/popular', async (req, res) => {
    try {
        const result = await connection_1.default.query(`
      SELECT 
        oi.menu_item_id,
        mi.name,
        mi.category_id,
        mc.name as category,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.subtotal) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN menu_categories mc ON mi.category_id = mc.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'COMPLETED' AND o.deleted_at IS NULL
      GROUP BY oi.menu_item_id, mi.name, mi.category_id, mc.name
      ORDER BY quantity_sold DESC
      LIMIT 10
    `);
        res.json({
            success: true,
            data: {
                items: result.rows.map((row) => ({
                    menu_item_id: row.menu_item_id,
                    name: row.name,
                    category: row.category,
                    quantity_sold: parseInt(row.quantity_sold || '0'),
                    total_revenue: parseInt(row.total_revenue || '0'),
                    order_count: parseInt(row.order_count || '0'),
                })),
            },
        });
    }
    catch (error) {
        console.error('Analytics items error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch popular items',
        });
    }
});
/**
 * GET /api/analytics/revenue/category
 * Revenue breakdown by menu category
 */
router.get('/revenue/category', async (req, res) => {
    try {
        const result = await connection_1.default.query(`
      SELECT 
        mc.id,
        mc.name,
        COUNT(DISTINCT o.id) as order_count,
        SUM(oi.quantity) as total_items_sold,
        SUM(oi.subtotal) as total_revenue
      FROM menu_categories mc
      LEFT JOIN menu_items mi ON mc.id = mi.category_id
      LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'COMPLETED' AND o.deleted_at IS NULL
      WHERE mi.deleted_at IS NULL
      GROUP BY mc.id, mc.name
      ORDER BY total_revenue DESC NULLS LAST
    `);
        res.json({
            success: true,
            data: {
                categories: result.rows.map((row) => ({
                    category_id: row.id,
                    category_name: row.name,
                    order_count: parseInt(row.order_count || '0'),
                    total_items_sold: parseInt(row.total_items_sold || '0'),
                    total_revenue: parseInt(row.total_revenue || '0'),
                })),
            },
        });
    }
    catch (error) {
        console.error('Analytics category error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch category revenue',
        });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map