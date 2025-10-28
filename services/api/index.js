/**
 * Ethiopian Maids API Server
 *
 * Express server implementing the OpenAPI specification.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as authController from './controllers/auth.controller.js';
import * as profilesController from './controllers/profiles.controller.js';
import * as passwordResetController from './controllers/passwordReset.controller.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour
  message: 'Too many requests, please try again later',
});
app.use(limiter);

// Request ID middleware
app.use((req, res, next) => {
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API v1 routes
const v1Router = express.Router();

// Auth routes
v1Router.post('/auth/register', authController.register);
v1Router.post('/auth/login', authController.login);
v1Router.post('/auth/logout', authController.logout);
v1Router.get('/auth/me', authController.getCurrentUser);

// Password reset routes
v1Router.post('/auth/password-reset/request', passwordResetController.handlePasswordResetRequest);
v1Router.post('/auth/password-reset/confirm', passwordResetController.handlePasswordResetConfirm);

// Profile routes
v1Router.post('/profiles/maid', profilesController.createMaidProfile);
v1Router.patch('/profiles/maid/:profileId', profilesController.updateMaidProfile);
v1Router.get('/profiles/maid/:profileId', profilesController.getMaidProfile);
v1Router.get('/profiles/maid', profilesController.searchMaidProfiles);
v1Router.post('/profiles/maid/:profileId/submit', profilesController.submitMaidProfileForReview);
v1Router.post('/profiles/maid/:profileId/approve', profilesController.approveMaidProfile);

// Mount v1 router
app.use('/api/v1', v1Router);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ API server running on http://localhost:${PORT}`);
  console.log(`📖 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 API base URL: http://localhost:${PORT}/api/v1`);
});

export default app;
