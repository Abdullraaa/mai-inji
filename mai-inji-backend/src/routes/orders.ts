import { Router, Request, Response } from 'express';
import * as orderService from '../services/orderService';
import * as paymentService from '../services/paymentService';
import * as webhookService from '../services/webhookService';
import { sendSuccess, sendError } from '../utils/response';
import { OrderStatus, FulfillmentType, ActorType } from '../types';

const router = Router();

// Create order
router.post('/', async (req: Request, res: Response) => {
  try {
    const { items, fulfillmentType, deliveryAddress, userEmail } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Invalid items', 400);
    }
    
    if (!fulfillmentType || !Object.values(FulfillmentType).includes(fulfillmentType)) {
      return sendError(res, 'Invalid fulfillment type', 400);
    }
    
    // Generate user ID (placeholder - will be replaced with real auth)
    const userId = req.headers['x-user-id'] as string || 'guest-user';
    
    const order = await orderService.createOrder(
      userId,
      items,
      fulfillmentType,
      deliveryAddress
    );
    
    // Move to PAYMENT_PENDING
    const paidOrder = await orderService.updateOrderStatus(
      order.id,
      OrderStatus.PAYMENT_PENDING,
      userId,
      ActorType.SYSTEM,
      'Awaiting payment'
    );
    
    sendSuccess(res, paidOrder, 201);
  } catch (error) {
    console.error('Order creation error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create order', 500);
  }
});

// Get order by ID
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrderById(req.params.orderId);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }
    sendSuccess(res, order);
  } catch (error) {
    console.error('Order fetch error:', error);
    sendError(res, 'Failed to fetch order', 500);
  }
});

// Initialize payment for order
router.post('/:orderId/payment', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return sendError(res, 'User email is required', 400);
    }
    
    const order = await orderService.getOrderById(req.params.orderId);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }
    
    if (order.status !== OrderStatus.PAYMENT_PENDING) {
      return sendError(res, `Cannot pay for order in ${order.status} status`, 400);
    }
    
    const paymentData = await paymentService.initializePayment(
      order.id,
      order.total_amount,
      userEmail
    );
    
    sendSuccess(res, paymentData);
  } catch (error) {
    console.error('Payment initialization error:', error);
    sendError(res, error instanceof Error ? error.message : 'Payment initialization failed', 500);
  }
});

// Paystack webhook (signature verified in middleware)
router.post('/payment/webhook', async (req: Request, res: Response) => {
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
    const paymentResult = await require('../db/connection').default.query(
      'SELECT * FROM payments WHERE provider_reference = $1',
      [reference]
    );

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
      await orderService.updateOrderStatus(
        order.id,
        OrderStatus.PAID,
        'system',
        ActorType.SYSTEM,
        'Payment confirmed via Paystack webhook'
      );

      // Record webhook event (idempotency)
      await webhookService.recordWebhookEvent(
        reference,
        order.id,
        payment.id,
        eventType,
        data
      );

      console.log(`Payment confirmed: ${order.order_number}`);
      return res.status(200).json({ status: 'ok' });
    } else {
      // Payment failed
      await orderService.updateOrderStatus(
        order.id,
        OrderStatus.PAYMENT_FAILED,
        'system',
        ActorType.SYSTEM,
        `Payment failed: ${data.gateway_response}`
      );

      // Record webhook event
      await webhookService.recordWebhookEvent(
        reference,
        order.id,
        payment.id,
        eventType,
        data
      );

      console.log(`Payment failed: ${order.order_number}`);
      return res.status(200).json({ status: 'ok' });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to avoid Paystack retries on our errors
    res.status(200).json({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Verify payment (legacy endpoint - manual verification)
router.post('/payment/verify', async (req: Request, res: Response) => {
  try {
    const { reference } = req.body;
    
    if (!reference) {
      return sendError(res, 'Payment reference is required', 400);
    }
    
    const verification = await paymentService.verifyPayment(reference);
    
    if (!verification) {
      return sendError(res, 'Payment verification failed', 400);
    }
    
    // Update order status based on payment
    if (verification.isSuccessful) {
      await orderService.updateOrderStatus(
        verification.orderId,
        OrderStatus.PAID,
        'system',
        ActorType.SYSTEM,
        'Payment confirmed'
      );
    } else {
      await orderService.updateOrderStatus(
        verification.orderId,
        OrderStatus.PAYMENT_FAILED,
        'system',
        ActorType.SYSTEM,
        'Payment failed'
      );
    }
    
    sendSuccess(res, verification);
  } catch (error) {
    console.error('Payment verification error:', error);
    sendError(res, error instanceof Error ? error.message : 'Payment verification failed', 500);
  }
});

// Admin: Update order status
router.patch('/:orderId/status', async (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body;
    
    if (!status || !Object.values(OrderStatus).includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }
    
    const adminId = req.headers['x-user-id'] as string;
    if (!adminId) {
      return sendError(res, 'Unauthorized', 401);
    }
    
    const order = await orderService.updateOrderStatus(
      req.params.orderId,
      status,
      adminId,
      ActorType.ADMIN,
      reason
    );
    
    sendSuccess(res, order);
  } catch (error) {
    console.error('Order update error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to update order', 400);
  }
});

// Admin: List all orders with pagination and filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const adminId = req.headers['x-user-id'] as string;
    if (!adminId) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { status, page = '1', limit = '20', sort_by = 'created_at', sort_order = 'DESC' } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT id, order_number, status, total_amount as total, 
             customer->>'name' as customer_name, fulfillment_type, created_at
      FROM orders
      WHERE deleted_at IS NULL
    `;

    const params: any[] = [];

    // Filter by status (comma-separated)
    if (status && typeof status === 'string' && status.length > 0) {
      const statuses = (status as string).split(',').map(s => s.trim());
      const placeholders = statuses.map((_, i) => `$${i + 1}`).join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...statuses);
    }

    // Count total for pagination
    const countQuery = query.replace(
      'SELECT id, order_number, status, total_amount as total, customer',
      'SELECT COUNT(*) as count'
    );
    const countResult = await require('../db/connection').default.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count || '0');
    const totalPages = Math.ceil(totalCount / limitNum);

    // Sort and paginate
    const validSortFields = ['created_at', 'order_number', 'status', 'total'];
    const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDir = (sort_order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortField} ${sortDir}`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);

    const result = await require('../db/connection').default.query(query, params);

    sendSuccess(res, {
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
  } catch (error) {
    console.error('Order list error:', error);
    sendError(res, 'Failed to fetch orders', 500);
  }
});

// Admin: Initiate refund for an order
router.post('/:orderId/refund', async (req: Request, res: Response) => {
  try {
    const adminId = req.headers['x-user-id'] as string;
    if (!adminId) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return sendError(res, 'Refund reason is required', 400);
    }

    const order = await orderService.getOrderById(req.params.orderId);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    // Check if order is eligible for refund (only COMPLETED or PAID orders)
    if (![OrderStatus.COMPLETED, OrderStatus.PAID].includes(order.status as OrderStatus)) {
      return sendError(
        res,
        `Cannot refund order in ${order.status} status. Only COMPLETED or PAID orders can be refunded.`,
        400
      );
    }

    // Get payment info
    const paymentResult = await require('../db/connection').default.query(
      'SELECT * FROM payments WHERE order_id = $1 AND provider = $2 ORDER BY created_at DESC LIMIT 1',
      [req.params.orderId, 'PAYSTACK']
    );

    if (paymentResult.rows.length === 0) {
      return sendError(res, 'No Paystack payment found for this order', 400);
    }

    const payment = paymentResult.rows[0];

    // Check if payment is in SUCCESS state (refundable)
    if (payment.status !== 'SUCCESS') {
      return sendError(
        res,
        `Cannot refund order with payment status ${payment.status}`,
        400
      );
    }

    try {
      // Call Paystack refund API
      const axios = require('axios');
      const refundResponse = await axios.post(
        'https://api.paystack.co/refund',
        {
          transaction: parseInt(payment.provider_reference),
          amount: payment.amount,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!refundResponse.data.status) {
        return sendError(res, 'Paystack refund API failed', 500);
      }

      // Update order status to REFUNDING
      const refundingOrder = await orderService.updateOrderStatus(
        req.params.orderId,
        OrderStatus.REFUNDING,
        adminId,
        ActorType.ADMIN,
        reason
      );

      // Update payment status to REFUNDING
      await require('../db/connection').default.query(
        'UPDATE payments SET status = $1 WHERE id = $2',
        ['REFUNDING', payment.id]
      );

      // Log in audit
      const { logAudit } = require('../middleware/audit');
      await logAudit(
        'order',
        req.params.orderId,
        'REFUND_INITIATED',
        order.status,
        OrderStatus.REFUNDING,
        ActorType.ADMIN,
        adminId,
        reason,
        { refund_reference: refundResponse.data.data.reference }
      );

      sendSuccess(res, {
        order_id: req.params.orderId,
        status: OrderStatus.REFUNDING,
        refund_reference: refundResponse.data.data.reference,
        reason,
        initiated_at: new Date().toISOString(),
      });
    } catch (paystackError) {
      console.error('Paystack refund error:', paystackError);
      sendError(res, 'Failed to process refund with payment provider', 500);
    }
  } catch (error) {
    console.error('Refund error:', error);
    sendError(res, error instanceof Error ? error.message : 'Refund failed', 500);
  }
});

export default router;
