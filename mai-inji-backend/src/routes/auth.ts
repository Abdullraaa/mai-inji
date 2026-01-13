import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * POST /api/auth/login
 * Admin login with email and password
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password required',
    });
  }

  try {
    // v1: Hardcoded admin credentials (upgrade to DB in v2)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mai-inji.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'maiini@2026';
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    if (email === adminEmail && password === adminPassword) {
      const token = jwt.sign(
        {
          id: 'admin_1',
          email,
          role: 'ADMIN',
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: 'admin_1',
            email,
            role: 'ADMIN',
          },
          expires_in: 86400,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

/**
 * POST /api/auth/logout
 * Admin logout (clears client-side token)
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
