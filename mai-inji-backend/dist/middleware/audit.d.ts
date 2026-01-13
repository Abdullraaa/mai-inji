import { Request, Response, NextFunction } from 'express';
import { ActorType, AuditAction } from '../types';
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userRole?: string;
        }
    }
}
export declare function logAudit(entityType: string, entityId: string, action: AuditAction, previousState: string | null, newState: string | null, actorType: ActorType, actorId?: string, reason?: string, metadata?: any): Promise<void>;
export declare function auditMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=audit.d.ts.map