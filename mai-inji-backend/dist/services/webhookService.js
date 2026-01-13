"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebhookEventTable = createWebhookEventTable;
exports.hasWebhookBeenProcessed = hasWebhookBeenProcessed;
exports.recordWebhookEvent = recordWebhookEvent;
exports.getProcessedWebhookEvent = getProcessedWebhookEvent;
const connection_1 = __importDefault(require("../db/connection"));
const uuid_1 = require("uuid");
/**
 * Create webhook event table (for tracking)
 * Call this once during migration (already in schema.sql)
 */
async function createWebhookEventTable() {
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
        await connection_1.default.query(query);
    }
    catch (error) {
        console.error('Error creating webhook_events table:', error);
    }
}
/**
 * Check if webhook has been processed already (idempotency)
 */
async function hasWebhookBeenProcessed(webhookReference) {
    const result = await connection_1.default.query('SELECT id FROM webhook_events WHERE webhook_reference = $1', [webhookReference]);
    return result.rows.length > 0;
}
/**
 * Record webhook as processed (idempotency tracking)
 */
async function recordWebhookEvent(webhookReference, orderId, paymentId, eventType, payload) {
    const id = (0, uuid_1.v4)();
    const result = await connection_1.default.query(`INSERT INTO webhook_events 
     (id, webhook_reference, order_id, payment_id, event_type, payload)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`, [id, webhookReference, orderId, paymentId, eventType, JSON.stringify(payload)]);
    return result.rows[0];
}
/**
 * Get previously processed webhook (for duplicate detection)
 */
async function getProcessedWebhookEvent(webhookReference) {
    const result = await connection_1.default.query('SELECT * FROM webhook_events WHERE webhook_reference = $1', [webhookReference]);
    return result.rows.length ? result.rows[0] : null;
}
//# sourceMappingURL=webhookService.js.map