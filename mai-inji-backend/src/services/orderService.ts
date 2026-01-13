import pool from '../db/connection';
import { Order, OrderStatus, FulfillmentType } from '../types';
import { logAudit } from '../middleware/audit';
import { ActorType, AuditAction } from '../types';
import { v4 as uuid } from 'uuid';

// Generate order number format: MAI-20260109-0001
function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MAI-${date}-${rand}`;
}

export async function createOrder(
  userId: string,
  items: Array<{ menuItemId: string; quantity: number }>,
  fulfillmentType: FulfillmentType,
  deliveryAddress?: string
): Promise<Order> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Calculate subtotal and get item prices
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      const result = await client.query(
        'SELECT price FROM menu_items WHERE id = $1 AND deleted_at IS NULL',
        [item.menuItemId]
      );
      
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
    const deliveryFee = fulfillmentType === FulfillmentType.DELIVERY ? 50000 : 0; // 500 naira delivery fee
    const totalAmount = subtotal + deliveryFee;
    
    // Create order
    const orderId = uuid();
    const orderNumber = generateOrderNumber();
    
    await client.query(
      `INSERT INTO orders 
       (id, order_number, user_id, status, subtotal, delivery_fee, total_amount, fulfillment_type, delivery_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        orderId,
        orderNumber,
        userId,
        OrderStatus.CREATED,
        subtotal,
        deliveryFee,
        totalAmount,
        fulfillmentType,
        deliveryAddress || null,
      ]
    );
    
    // Insert order items
    for (const item of orderItems) {
      const itemId = uuid();
      await client.query(
        `INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [itemId, orderId, item.menuItemId, item.quantity, item.unitPrice, item.totalPrice]
      );
    }
    
    // Audit log
    await logAudit(
      'ORDER',
      orderId,
      AuditAction.CREATE,
      null,
      OrderStatus.CREATED,
      ActorType.CUSTOMER,
      userId,
      'Order created'
    );
    
    await client.query('COMMIT');
    
    const order = await getOrderById(orderId);
    if (!order) throw new Error('Failed to retrieve created order');
    
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const result = await pool.query(
    'SELECT * FROM orders WHERE id = $1',
    [orderId]
  );
  
  return result.rows.length ? result.rows[0] : null;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actorId: string,
  actorType: ActorType,
  reason?: string
): Promise<Order> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get current order
    const current = await client.query('SELECT status FROM orders WHERE id = $1', [orderId]);
    if (!current.rows.length) throw new Error('Order not found');
    
    const previousStatus = current.rows[0].status;
    
    // Validate state transition
    const validTransitions: { [key in OrderStatus]: OrderStatus[] } = {
      [OrderStatus.CREATED]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
      [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED],
      [OrderStatus.PAYMENT_FAILED]: [OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.ACCEPTED, OrderStatus.REFUNDING],
      [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY],
      [OrderStatus.READY]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.COMPLETED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDING]: [OrderStatus.REFUNDED],
      [OrderStatus.REFUNDED]: [],
    };
    
    if (!validTransitions[previousStatus as OrderStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid state transition from ${previousStatus} to ${newStatus}`
      );
    }
    
    // Update order
    await client.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStatus, orderId]
    );
    
    // Audit log
    await logAudit(
      'ORDER',
      orderId,
      AuditAction.STATUS_CHANGE,
      previousStatus,
      newStatus,
      actorType,
      actorId,
      reason
    );
    
    await client.query('COMMIT');
    
    const order = await getOrderById(orderId);
    if (!order) throw new Error('Failed to retrieve updated order');
    
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
