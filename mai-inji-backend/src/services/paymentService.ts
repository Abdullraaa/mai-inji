import axios from 'axios';
import pool from '../db/connection';
import { PaymentStatus, PaymentProvider } from '../types';
import { v4 as uuid } from 'uuid';
import { logAudit } from '../middleware/audit';
import { ActorType, AuditAction } from '../types';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    [key: string]: any;
  };
}

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function initializePayment(orderId: string, amount: number, email: string) {
  try {
    const paymentId = uuid();
    
    // Store payment record as INITIATED
    await pool.query(
      `INSERT INTO payments (id, order_id, provider, provider_reference, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [paymentId, orderId, PaymentProvider.PAYSTACK, null, amount, PaymentStatus.INITIATED]
    );
    
    // Call Paystack API
    const response = await axios.post<PaystackInitializeResponse>(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount,
        reference: `MAI-${orderId}-${Date.now()}`,
        metadata: {
          order_id: orderId,
          payment_id: paymentId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );
    
    if (!response.data.status) {
      throw new Error(response.data.message);
    }
    
    // Update payment with Paystack reference
    await pool.query(
      'UPDATE payments SET provider_reference = $1 WHERE id = $2',
      [response.data.data.reference, paymentId]
    );
    
    await logAudit(
      'PAYMENT',
      paymentId,
      AuditAction.CREATE,
      null,
      PaymentStatus.INITIATED,
      ActorType.SYSTEM,
      undefined,
      'Payment initialized with Paystack'
    );
    
    return {
      paymentId,
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    };
  } catch (error) {
    console.error('Paystack initialization error:', error);
    throw error;
  }
}

export async function verifyPayment(reference: string) {
  try {
    const response = await axios.get<PaystackVerifyResponse>(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );
    
    if (!response.data.status) {
      throw new Error(response.data.message);
    }
    
    const paymentData = response.data.data;
    const isSuccessful = paymentData.status === 'success';
    
    // Find and update payment record
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE provider_reference = $1',
      [reference]
    );
    
    if (!paymentResult.rows.length) {
      console.error('Payment record not found:', reference);
      return null;
    }
    
    const payment = paymentResult.rows[0];
    const newStatus = isSuccessful ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    
    await pool.query(
      `UPDATE payments 
       SET status = $1, raw_payload = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newStatus, JSON.stringify(paymentData), payment.id]
    );
    
    await logAudit(
      'PAYMENT',
      payment.id,
      AuditAction.UPDATE,
      PaymentStatus.INITIATED,
      newStatus,
      ActorType.SYSTEM,
      undefined,
      `Paystack verification: ${paymentData.status}`
    );
    
    return {
      orderId: payment.order_id,
      paymentId: payment.id,
      status: newStatus,
      isSuccessful,
    };
  } catch (error) {
    console.error('Paystack verification error:', error);
    throw error;
  }
}

export async function refundPayment(paymentId: string, reason?: string) {
  try {
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [paymentId]
    );
    
    if (!paymentResult.rows.length) {
      throw new Error('Payment not found');
    }
    
    const payment = paymentResult.rows[0];
    
    if (payment.provider !== PaymentProvider.PAYSTACK) {
      // Handle cash refunds differently (manual process)
      await pool.query(
        'UPDATE payments SET status = $1 WHERE id = $2',
        [PaymentStatus.REFUNDED, paymentId]
      );
      return;
    }
    
    // Call Paystack refund API
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/refund`,
      {
        transaction: payment.provider_reference,
        amount: payment.amount,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );
    
    // Update payment status
    await pool.query(
      'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [PaymentStatus.REFUNDED, paymentId]
    );
    
    await logAudit(
      'PAYMENT',
      paymentId,
      AuditAction.REFUND,
      PaymentStatus.SUCCESS,
      PaymentStatus.REFUNDED,
      ActorType.ADMIN,
      undefined,
      reason || 'Payment refunded'
    );
    
    return response.data;
  } catch (error) {
    console.error('Refund error:', error);
    throw error;
  }
}
