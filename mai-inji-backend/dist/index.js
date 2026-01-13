"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const audit_1 = require("./middleware/audit");
const webhook_1 = require("./middleware/webhook");
const auth_1 = require("./middleware/auth");
const menu_1 = __importDefault(require("./routes/menu"));
const orders_1 = __importDefault(require("./routes/orders"));
const auth_2 = __importDefault(require("./routes/auth"));
const analytics_1 = __importDefault(require("./routes/analytics"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware - order matters!
// Capture raw body BEFORE parsing for webhook signature verification
app.use(webhook_1.captureRawBody);
app.use(express_1.default.json());
app.use(webhook_1.verifyPaystackSignature); // Verify webhook signatures
app.use(audit_1.auditMiddleware);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Auth routes (public)
app.use('/api/auth', auth_2.default);
// API Routes (public)
app.use('/api/menu', menu_1.default);
app.use('/api/orders', orders_1.default);
// Protected routes (admin only)
app.use('/api/analytics', auth_1.verifyAdminToken, auth_1.requireAdminRole, analytics_1.default);
// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Mai Inji Backend running on http://localhost:${PORT}`);
    console.log(`📝 Database: ${process.env.DB_NAME || 'maiinji'}`);
    console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Webhook: POST /api/orders/payment/webhook`);
});
//# sourceMappingURL=index.js.map