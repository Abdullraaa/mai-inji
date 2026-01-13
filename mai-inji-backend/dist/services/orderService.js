"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.getOrderById = getOrderById;
exports.updateOrderStatus = updateOrderStatus;
const connection_1 = __importDefault(require("../db/connection"));
const types_1 = require("../types");
const audit_1 = require("../middleware/audit");
const types_2 = require("../types");
const uuid_1 = require("uuid");
// Generate order number format: MAI-20260109-0001
function generateOrderNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `MAI-${date}-${rand}`;
}
async function createOrder(userId, items, fulfillmentType, deliveryAddress) {
    const client = await connection_1.default.connect();
    try {
        await client.query('BEGIN');
        // Calculate subtotal and get item prices
        let subtotal = 0;
        const orderItems = [];
        for (const item of items) {
            const result = await client.query('SELECT price FROM menu_items WHERE id = $1 AND deleted_at IS NULL', [item.menuItemId]);
            if (!result.rows.length) {
                throw new Error(`Menu item ${item.menuItemId} not found or deleted`);
            }
            const unitPrice = result.rows[0].price;
            const totalPrice = unitPrice * item.quantity;
            subtotal += totalPrice;
            orderItems.push({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                unitPrice,
                totalPrice,
            });
        }
        // Calculate fees
        const deliveryFee = fulfillmentType === types_1.FulfillmentType.DELIVERY ? 50000 : 0; // 500 naira delivery fee
        const totalAmount = subtotal + deliveryFee;
        // Create order
        const orderId = (0, uuid_1.v4)();
        const orderNumber = generateOrderNumber();
        await client.query(`INSERT INTO orders 
       (id, order_number, user_id, status, subtotal, delivery_fee, total_amount, fulfillment_type, delivery_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            orderId,
            orderNumber,
            userId,
            types_1.OrderStatus.CREATED,
            subtotal,
            deliveryFee,
            totalAmount,
            fulfillmentType,
            deliveryAddress || null,
        ]);
        // Insert order items
        for (const item of orderItems) {
            const itemId = (0, uuid_1.v4)();
            await client.query(`INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`, [itemId, orderId, item.menuItemId, item.quantity, item.unitPrice, item.totalPrice]);
        }
        // Audit log
        await (0, audit_1.logAudit)('ORDER', orderId, types_2.AuditAction.CREATE, null, types_1.OrderStatus.CREATED, types_2.ActorType.CUSTOMER, userId, 'Order created');
        await client.query('COMMIT');
        const order = await getOrderById(orderId);
        if (!order)
            throw new Error('Failed to retrieve created order');
        return order;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
async function getOrderById(orderId) {
    const result = await connection_1.default.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    return result.rows.length ? result.rows[0] : null;
}
async function updateOrderStatus(orderId, newStatus, actorId, actorType, reason) {
    const client = await connection_1.default.connect();
    try {
        await client.query('BEGIN');
        // Get current order
        const current = await client.query('SELECT status FROM orders WHERE id = $1', [orderId]);
        if (!current.rows.length)
            throw new Error('Order not found');
        const previousStatus = current.rows[0].status;
        // Validate state transition
        const validTransitions = {
            [types_1.OrderStatus.CREATED]: [types_1.OrderStatus.PAYMENT_PENDING, types_1.OrderStatus.CANCELLED],
            [types_1.OrderStatus.PAYMENT_PENDING]: [types_1.OrderStatus.PAID, types_1.OrderStatus.PAYMENT_FAILED],
            [types_1.OrderStatus.PAYMENT_FAILED]: [types_1.OrderStatus.CANCELLED],
            [types_1.OrderStatus.PAID]: [types_1.OrderStatus.ACCEPTED, types_1.OrderStatus.REFUNDING],
            [types_1.OrderStatus.ACCEPTED]: [types_1.OrderStatus.PREPARING, types_1.OrderStatus.CANCELLED],
            [types_1.OrderStatus.PREPARING]: [types_1.OrderStatus.READY],
            [types_1.OrderStatus.READY]: [types_1.OrderStatus.READY_FOR_PICKUP, types_1.OrderStatus.OUT_FOR_DELIVERY],
            [types_1.OrderStatus.READY_FOR_PICKUP]: [types_1.OrderStatus.COMPLETED],
            [types_1.OrderStatus.OUT_FOR_DELIVERY]: [types_1.OrderStatus.COMPLETED],
            [types_1.OrderStatus.COMPLETED]: [],
            [types_1.OrderStatus.CANCELLED]: [],
            [types_1.OrderStatus.REFUNDING]: [types_1.OrderStatus.REFUNDED],
            [types_1.OrderStatus.REFUNDED]: [],
        };
        if (!validTransitions[previousStatus]?.includes(newStatus)) {
            throw new Error(`Invalid state transition from ${previousStatus} to ${newStatus}`);
        }
        // Update order
        await client.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, orderId]);
        // Audit log
        await (0, audit_1.logAudit)('ORDER', orderId, types_2.AuditAction.STATUS_CHANGE, previousStatus, newStatus, actorType, actorId, reason);
        await client.query('COMMIT');
        const order = await getOrderById(orderId);
        if (!order)
            throw new Error('Failed to retrieve updated order');
        return order;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=orderService.js.map