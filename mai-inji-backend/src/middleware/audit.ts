import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import pool from '../db/connection';
import { ActorType, AuditAction } from '../types';

// Extend Express Request to include audit context
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export async function logAudit(
  entityType: string,
  entityId: string,
  action: AuditAction,
  previousState: string | null,
  newState: string | null,
  actorType: ActorType,
  actorId?: string,
  reason?: string,
  metadata?: any
) {
  try {
    await pool.query(
      `INSERT INTO audit_logs 
       (entity_type, entity_id, action, previous_state, new_state, actor_type, actor_id, reason, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entityType,
        entityId,
        action,
        previousState,
        newState,
        actorType,
        actorId || null,
        reason || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - audit failure shouldn't break operations
  }
}

// Request logging middleware
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extract user info from auth (placeholder - will be replaced with real auth)
  req.userId = req.headers['x-user-id'] as string;
  req.userRole = req.headers['x-user-role'] as string;
  
  next();
}
