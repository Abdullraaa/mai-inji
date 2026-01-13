import { Request, Response, NextFunction } from 'express';
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
export declare function captureRawBody(req: Request, res: Response, next: NextFunction): void;
/**
 * Verify Paystack webhook signature
 * Paystack sends: x-paystack-signature header with HMAC-SHA512 hash
 * We compute: HMAC-SHA512(raw_body, PAYSTACK_WEBHOOK_SECRET)
 * Compare: computed == received
 */
export declare function verifyPaystackSignature(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
//# sourceMappingURL=webhook.d.ts.map