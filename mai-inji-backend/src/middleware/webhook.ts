import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

/**
 * Middleware to capture raw body for webhook signature verification
 * Must be used BEFORE express.json()
 */
export function captureRawBody(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/api/orders/payment/webhook') {
    let rawBody = '';
    req.setEncoding('utf8');

    req.on('data', (chunk: string) => {
      rawBody += chunk;
    });

    req.on('end', () => {
      req.rawBody = rawBody;
      next();
    });
  } else {
    next();
  }
}

/**
 * Verify Paystack webhook signature
 * Paystack sends: x-paystack-signature header with HMAC-SHA512 hash
 * We compute: HMAC-SHA512(raw_body, PAYSTACK_WEBHOOK_SECRET)
 * Compare: computed == received
 */
export function verifyPaystackSignature(req: Request, res: Response, next: NextFunction) {
  if (req.path !== '/api/orders/payment/webhook') {
    return next();
  }

  const signature = req.headers['x-paystack-signature'] as string;
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
  const hash = crypto
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
  } catch (error) {
    console.error('Webhook body parse error:', error);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
}
