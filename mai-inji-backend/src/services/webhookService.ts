import pool from '../db/connection';
import { v4 as uuid } from 'uuid';

/**
 * Track processed webhook references to prevent idempotency issues
 * Store: webhook_reference -> order_id, status
 */

interface WebhookEvent {
  id: string;
  webhook_reference: string; // Paystack reference
  order_id: string;
  payment_id: string;
  event_type: string; // 'charge.success', 'charge.refund', etc.
  payload: any; // Raw webhook payload
  processed_at: string;
}

/**
 * Create webhook event table (for tracking)
 * Call this once during migration (already in schema.sql)
 */
export async function createWebhookEventTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS webhook_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      webhook_reference VARCHAR(255) NOT NULL UNIQUE,
      order_id UUID NOT NULL REFERENCES orders(id),
      payment_id UUID NOT NULL REFERENCES payments(id),
      event_type VARCHAR(100) NOT NULL,
      payload JSONB NOT NULL,
      processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_webhook_events_reference ON webhook_events(webhook_reference);
  `;
  
  try {
    await pool.query(query);
  } catch (error) {
    console.error('Error creating webhook_events table:', error);
  }
}

/**
 * Check if webhook has been processed already (idempotency)
 */
export async function hasWebhookBeenProcessed(webhookReference: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT id FROM webhook_events WHERE webhook_reference = $1',
    [webhookReference]
  );
  
  return result.rows.length > 0;
}

/**
 * Record webhook as processed (idempotency tracking)
 */
export async function recordWebhookEvent(
  webhookReference: string,
  orderId: string,
  paymentId: string,
  eventType: string,
  payload: any
): Promise<WebhookEvent> {
  const id = uuid();
  
  const result = await pool.query(
    `INSERT INTO webhook_events 
     (id, webhook_reference, order_id, payment_id, event_type, payload)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, webhookReference, orderId, paymentId, eventType, JSON.stringify(payload)]
  );
  
  return result.rows[0];
}

/**
 * Get previously processed webhook (for duplicate detection)
 */
export async function getProcessedWebhookEvent(webhookReference: string): Promise<WebhookEvent | null> {
  const result = await pool.query(
    'SELECT * FROM webhook_events WHERE webhook_reference = $1',
    [webhookReference]
  );
  
  return result.rows.length ? result.rows[0] : null;
}
