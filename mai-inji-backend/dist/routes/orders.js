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
const orderService = __importStar(require("../services/orderService"));
const paymentService = __importStar(require("../services/paymentService"));
const webhookService = __importStar(require("../services/webhookService"));
const response_1 = require("../utils/response");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// Create order
router.post('/', async (req, res) => {
    try {
        const { items, fulfillmentType, deliveryAddress, userEmail } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return (0, response_1.sendError)(res, 'Invalid items', 400);
        }
        if (!fulfillmentType || !Object.values(types_1.FulfillmentType).includes(fulfillmentType)) {
            return (0, response_1.sendError)(res, 'Invalid fulfillment type', 400);
        }
        // Generate user ID (placeholder - will be replaced with real auth)
        const userId = req.headers['x-user-id'] || 'guest-user';
        const order = await orderService.createOrder(userId, items, fulfillmentType, deliveryAddress);
        // Move to PAYMENT_PENDING
        const paidOrder = await orderService.updateOrderStatus(order.id, types_1.OrderStatus.PAYMENT_PENDING, userId, types_1.ActorType.SYSTEM, 'Awaiting payment');
        (0, response_1.sendSuccess)(res, paidOrder, 201);
    }
    catch (error) {
        console.error('Order creation error:', error);
        (0, response_1.sendError)(res, error instanceof Error ? error.message : 'Failed to create order', 500);
    }
});
// Get order by ID
router.get('/:orderId', async (req, res) => {
    try {
        const order = await orderService.getOrderById(req.params.orderId);
        if (!order) {
            return (0, response_1.sendError)(res, 'Order not found', 404);
        }
        (0, response_1.sendSuccess)(res, order);
    }
    catch (error) {
        console.error('Order fetch error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch order', 500);
    }
});
// Initialize payment for order
router.post('/:orderId/payment', async (req, res) => {
    try {
        const { userEmail } = req.body;
        if (!userEmail) {
            return (0, response_1.sendError)(res, 'User email is required', 400);
        }
        const order = await orderService.getOrderById(req.params.orderId);
        if (!order) {
            return (0, response_1.sendError)(res, 'Order not found', 404);
        }
        if (order.status !== types_1.OrderStatus.PAYMENT_PENDING) {
            return (0, response_1.sendError)(res, `Cannot pay for order in ${order.status} status`, 400);
        }
        const paymentData = await paymentService.initializePayment(order.id, order.total_amount, userEmail);
        (0, response_1.sendSuccess)(res, paymentData);
    }
    catch (error) {
        console.error('Payment initialization error:', error);
        (0, response_1.sendError)(res, error instanceof Error ? error.message : 'Payment initialization failed', 500);
    }
});
// Paystack webhook (signature verified in middleware)
router.post('/payment/webhook', async (req, res) => {
    try {
        const data = req.body.data;
        const reference = data.reference;
        if (!reference) {
            console.error('Webhook missing reference');
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }
        // Check idempotency: has this webhook been processed?
        const alreadyProcessed = await webhookService.hasWebhookBeenProcessed(reference);
        if (alreadyProcessed) {
            console.log(`Webhook already processed (idempotent): ${reference}`);
            // Return 200 OK even for duplicates (idempotent)
            return res.status(200).json({ status: 'ok' });
        }
        // Determine event type from Paystack data
        const eventType = data.status === 'success' ? 'charge.success' : 'charge.failed';
        // Find order and payment by reference
        const paymentResult = await require('../db/connection').default.query('SELECT * FROM payments WHERE provider_reference = $1', [reference]);
        if (!paymentResult.rows.length) {
            console.error('Payment not found for reference:', reference);
            // Still record webhook for audit
            return res.status(404).json({ error: 'Payment not found' });
        }
        const payment = paymentResult.rows[0];
        const order = await orderService.getOrderById(payment.order_id);
        if (!order) {
            console.error('Order not found for payment:', payment.id);
            return res.status(404).json({ error: 'Order not found' });
        }
        // Process webhook based on status
        if (data.status === 'success') {
            // Payment successful
            await orderService.updateOrderStatus(order.id, types_1.OrderStatus.PAID, 'system', types_1.ActorType.SYSTEM, 'Payment confirmed via Paystack webhook');
            // Record webhook event (idempotency)
            await webhookService.recordWebhookEvent(reference, order.id, payment.id, eventType, data);
            console.log(`Payment confirmed: ${order.order_number}`);
            return res.status(200).json({ status: 'ok' });
        }
        else {
            // Payment failed
            await orderService.updateOrderStatus(order.id, types_1.OrderStatus.PAYMENT_FAILED, 'system', types_1.ActorType.SYSTEM, `Payment failed: ${data.gateway_response}`);
            // Record webhook event
            await webhookService.recordWebhookEvent(reference, order.id, payment.id, eventType, data);
            console.log(`Payment failed: ${order.order_number}`);
            return res.status(200).json({ status: 'ok' });
        }
    }
    catch (error) {
        console.error('Webhook processing error:', error);
        // Return 200 to avoid Paystack retries on our errors
        res.status(200).json({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// Verify payment (legacy endpoint - manual verification)
router.post('/payment/verify', async (req, res) => {
    try {
        const { reference } = req.body;
        if (!reference) {
            return (0, response_1.sendError)(res, 'Payment reference is required', 400);
        }
        const verification = await paymentService.verifyPayment(reference);
        if (!verification) {
            return (0, response_1.sendError)(res, 'Payment verification failed', 400);
        }
        // Update order status based on payment
        if (verification.isSuccessful) {
            await orderService.updateOrderStatus(verification.orderId, types_1.OrderStatus.PAID, 'system', types_1.ActorType.SYSTEM, 'Payment confirmed');
        }
        else {
            await orderService.updateOrderStatus(verification.orderId, types_1.OrderStatus.PAYMENT_FAILED, 'system', types_1.ActorType.SYSTEM, 'Payment failed');
        }
        (0, response_1.sendSuccess)(res, verification);
    }
    catch (error) {
        console.error('Payment verification error:', error);
        (0, response_1.sendError)(res, error instanceof Error ? error.message : 'Payment verification failed', 500);
    }
});
// Admin: Update order status
router.patch('/:orderId/status', async (req, res) => {
    try {
        const { status, reason } = req.body;
        if (!status || !Object.values(types_1.OrderStatus).includes(status)) {
            return (0, response_1.sendError)(res, 'Invalid status', 400);
        }
        const adminId = req.headers['x-user-id'];
        if (!adminId) {
            return (0, response_1.sendError)(res, 'Unauthorized', 401);
        }
        const order = await orderService.updateOrderStatus(req.params.orderId, status, adminId, types_1.ActorType.ADMIN, reason);
        (0, response_1.sendSuccess)(res, order);
    }
    catch (error) {
        console.error('Order update error:', error);
        (0, response_1.sendError)(res, error instanceof Error ? error.message : 'Failed to update order', 400);
    }
});
// Admin: List all orders with pagination and filters
router.get('/', async (req, res) => {
    try {
        const adminId = req.headers['x-user-id'];
        if (!adminId) {
            return (0, response_1.sendError)(res, 'Unauthorized', 401);
        }
        const { status, page = '1', limit = '20', sort_by = 'created_at', sort_order = 'DESC' } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const offset = (pageNum - 1) * limitNum;
        let query = `
      SELECT id, order_number, status, total_amount as total, 
             customer->>'name' as customer_name, fulfillment_type, created_at
      FROM orders
      WHERE deleted_at IS NULL
    `;
        const params = [];
        // Filter by status (comma-separated)
        if (status && typeof status === 'string' && status.length > 0) {
            const statuses = status.split(',').map(s => s.trim());
            const placeholders = statuses.map((_, i) => `$${i + 1}`).join(',');
            query += ` AND status IN (${placeholders})`;
            params.push(...statuses);
        }
        // Count total for pagination
        const countQuery = query.replace('SELECT id, order_number, status, total_amount as total, customer', 'SELECT COUNT(*) as count');
        const countResult = await require('../db/connection').default.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count || '0');
        const totalPages = Math.ceil(totalCount / limitNum);
        // Sort and paginate
        const validSortFields = ['created_at', 'order_number', 'status', 'total'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortField} ${sortDir}`;
        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limitNum, offset);
        const result = await require('../db/connection').default.query(query, params);
        (0, response_1.sendSuccess)(res, {
            orders: result.rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total_count: totalCount,
                total_pages: totalPages,
                has_next: pageNum < totalPages,
                has_prev: pageNum > 1,
            },
        });
    }
    catch (error) {
        console.error('Order list error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch orders', 500);
    }
});
// Admin: Initiate refund for an order
router.post('/:orderId/refund', async (req, res) => {
    try {
        const adminId = req.headers['x-user-id'];
        if (!adminId) {
            return (0, response_1.sendError)(res, 'Unauthorized', 401);
        }
        const { reason } = req.body;
        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
            return (0, response_1.sendError)(res, 'Refund reason is required', 400);
        }
        const order = await orderService.getOrderById(req.params.orderId);
        if (!order) {
            return (0, response_1.sendError)(res, 'Order not found', 404);
        }
        // Check if order is eligible for refund (only COMPLETED or PAID orders)
        if (![types_1.OrderStatus.COMPLETED, types_1.OrderStatus.PAID].includes(order.status)) {
            return (0, response_1.sendError)(res, `Cannot refund order in ${order.status} status. Only COMPLETED or PAID orders can be refunded.`, 400);
        }
        // Get payment info
        const paymentResult = await require('../db/connection').default.query('SELECT * FROM payments WHERE order_id = $1 AND provider = $2 ORDER BY created_at DESC LIMIT 1', [req.params.orderId, 'PAYSTACK']);
        if (paymentResult.rows.length === 0) {
            return (0, response_1.sendError)(res, 'No Paystack payment found for this order', 400);
        }
        const payment = paymentResult.rows[0];
        // Check if payment is in SUCCESS state (refundable)
        if (payment.status !== 'SUCCESS') {
            return (0, response_1.sendError)(res, `Cannot refund order with payment status ${payment.status}`, 400);
        }
        try {
            // Call Paystack refund API
            const axios = require('axios');
            const refundResponse = await axios.post('https://api.paystack.co/refund', {
                transaction: parseInt(payment.provider_reference),
                amount: payment.amount,
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!refundResponse.data.status) {
                return (0, response_1.sendError)(res, 'Paystack refund API failed', 500);
            }
            // Update order status to REFUNDING
            const refundingOrder = await orderService.updateOrderStatus(req.params.orderId, types_1.OrderStatus.REFUNDING, adminId, types_1.ActorType.ADMIN, reason);
            // Update payment status to REFUNDING
            await require('../db/connection').default.query('UPDATE payments SET status = $1 WHERE id = $2', ['REFUNDING', payment.id]);
            // Log in audit
            const { logAudit } = require('../middleware/audit');
            await logAudit('order', req.params.orderId, 'REFUND_INITIATED', order.status, types_1.OrderStatus.REFUNDING, types_1.ActorType.ADMIN, adminId, reason, { refund_reference: refundResponse.data.data.reference });
            (0, response_1.sendSuccess)(res, {
                order_id: req.params.orderId,
                status: types_1.OrderStatus.REFUNDING,
                refund_reference: refundResponse.data.data.reference,
                reason,
                initiated_at: new Date().toISOString(),
            });
        }
        catch (paystackError) {
            console.error('Paystack refund error:', paystackError);
            (0, response_1.sendError)(res, 'Failed to process refund with payment provider', 500);
        }
    }
    catch (error) {
        console.error('Refund error:', error);
        (0, response_1.sendError)(res, error instanceof Error ? error.message : 'Refund failed', 500);
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map