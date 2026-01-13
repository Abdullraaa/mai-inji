import express from 'express';
import dotenv from 'dotenv';
import { auditMiddleware } from './middleware/audit';
import { captureRawBody, verifyPaystackSignature } from './middleware/webhook';
import { verifyAdminToken, requireAdminRole } from './middleware/auth';
import menuRoutes from './routes/menu';
import orderRoutes from './routes/orders';
import authRoutes from './routes/auth';
import analyticsRoutes from './routes/analytics';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - order matters!
// Capture raw body BEFORE parsing for webhook signature verification
app.use(captureRawBody);
app.use(express.json());
app.use(verifyPaystackSignature); // Verify webhook signatures
app.use(auditMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// API Routes (public)
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// Protected routes (admin only)
app.use('/api/analytics', verifyAdminToken, requireAdminRole, analyticsRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
