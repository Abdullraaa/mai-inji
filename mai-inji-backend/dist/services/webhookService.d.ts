/**
 * Track processed webhook references to prevent idempotency issues
 * Store: webhook_reference -> order_id, status
 */
interface WebhookEvent {
    id: string;
    webhook_reference: string;
    order_id: string;
    payment_id: string;
    event_type: string;
    payload: any;
    processed_at: string;
}
/**
 * Create webhook event table (for tracking)
 * Call this once during migration (already in schema.sql)
 */
export declare function createWebhookEventTable(): Promise<void>;
/**
 * Check if webhook has been processed already (idempotency)
 */
export declare function hasWebhookBeenProcessed(webhookReference: string): Promise<boolean>;
/**
 * Record webhook as processed (idempotency tracking)
 */
export declare function recordWebhookEvent(webhookReference: string, orderId: string, paymentId: string, eventType: string, payload: any): Promise<WebhookEvent>;
/**
 * Get previously processed webhook (for duplicate detection)
 */
export declare function getProcessedWebhookEvent(webhookReference: string): Promise<WebhookEvent | null>;
export {};
//# sourceMappingURL=webhookService.d.ts.map