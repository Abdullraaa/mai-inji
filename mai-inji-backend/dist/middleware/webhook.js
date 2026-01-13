"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureRawBody = captureRawBody;
exports.verifyPaystackSignature = verifyPaystackSignature;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Middleware to capture raw body for webhook signature verification
 * Must be used BEFORE express.json()
 */
function captureRawBody(req, res, next) {
    if (req.path === '/api/orders/payment/webhook') {
        let rawBody = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
            rawBody += chunk;
        });
        req.on('end', () => {
            req.rawBody = rawBody;
            next();
        });
    }
    else {
        next();
    }
}
/**
 * Verify Paystack webhook signature
 * Paystack sends: x-paystack-signature header with HMAC-SHA512 hash
 * We compute: HMAC-SHA512(raw_body, PAYSTACK_WEBHOOK_SECRET)
 * Compare: computed == received
 */
function verifyPaystackSignature(req, res, next) {
    if (req.path !== '/api/orders/payment/webhook') {
        return next();
    }
    const signature = req.headers['x-paystack-signature'];
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!signature || !secret) {
        console.error('Webhook verification failed: missing signature or secret');
        return res.status(401).json({ error: 'Missing webhook signature' });
    }
    if (!req.rawBody) {
        console.error('Webhook verification failed: no raw body');
        return res.status(400).json({ error: 'Invalid request body' });
    }
    // Compute expected signature
    const hash = crypto_1.default
        .createHmac('sha512', secret)
        .update(req.rawBody)
        .digest('hex');
    // Compare signatures
    if (hash !== signature) {
        console.error('Webhook signature mismatch:', { received: signature, computed: hash });
        return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    // Signature valid, parse body
    try {
        req.body = JSON.parse(req.rawBody);
        next();
    }
    catch (error) {
        console.error('Webhook body parse error:', error);
        return res.status(400).json({ error: 'Invalid JSON' });
    }
}
//# sourceMappingURL=webhook.js.map