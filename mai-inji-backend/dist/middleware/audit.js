"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
exports.auditMiddleware = auditMiddleware;
const connection_1 = __importDefault(require("../db/connection"));
async function logAudit(entityType, entityId, action, previousState, newState, actorType, actorId, reason, metadata) {
    try {
        await connection_1.default.query(`INSERT INTO audit_logs 
       (entity_type, entity_id, action, previous_state, new_state, actor_type, actor_id, reason, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            entityType,
            entityId,
            action,
            previousState,
            newState,
            actorType,
            actorId || null,
            reason || null,
            metadata ? JSON.stringify(metadata) : null,
        ]);
    }
    catch (error) {
        console.error('Audit logging error:', error);
        // Don't throw - audit failure shouldn't break operations
    }
}
// Request logging middleware
function auditMiddleware(req, res, next) {
    // Extract user info from auth (placeholder - will be replaced with real auth)
    req.userId = req.headers['x-user-id'];
    req.userRole = req.headers['x-user-role'];
    next();
}
//# sourceMappingURL=audit.js.map