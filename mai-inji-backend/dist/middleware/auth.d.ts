import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            admin?: {
                id: string;
                email: string;
                role: string;
            };
        }
    }
}
/**
 * Middleware to verify JWT token from Authorization header
 * Format: Authorization: Bearer <token>
 */
export declare const verifyAdminToken: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has ADMIN role
 */
export declare const requireAdminRole: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map