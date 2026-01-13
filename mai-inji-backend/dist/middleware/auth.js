"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminRole = exports.verifyAdminToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware to verify JWT token from Authorization header
 * Format: Authorization: Bearer <token>
 */
const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: 'Missing or invalid authorization header',
        });
        return;
    }
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.admin = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        console.error('JWT verification error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
        });
    }
};
exports.verifyAdminToken = verifyAdminToken;
/**
 * Middleware to check if user has ADMIN role
 */
const requireAdminRole = (req, res, next) => {
    if (!req.admin) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
        return;
    }
    if (req.admin.role !== 'ADMIN') {
        res.status(403).json({
            success: false,
            error: 'Admin access required',
        });
        return;
    }
    next();
};
exports.requireAdminRole = requireAdminRole;
//# sourceMappingURL=auth.js.map