/**
 * Auth Controller - HTTP handlers for identity endpoints
 *
 * Maps HTTP requests to use-cases.
 */

import { RegisterUser, GetUser, VerifyUserEmail } from '@ethio-maids/app-identity';
import { RegisterUserValidator } from '@ethio-maids/app-identity';
import { SupabaseUserRepository, SupabaseAuthService, SupabaseAuditLogger } from '@ethio-maids/infra-identity';
import { EventBus } from '@ethio-maids/infra-common';
import { supabase } from '../lib/supabase.js';

// Initialize infrastructure
const userRepository = new SupabaseUserRepository(supabase);
const authService = new SupabaseAuthService(supabase);
const auditLogger = new SupabaseAuditLogger(supabase);
const eventBus = new EventBus(supabase);

/**
 * POST /api/v1/auth/register
 */
export async function register(req, res) {
  try {
    // Validate input
    RegisterUserValidator.validate(req.body);

    // Create use-case with dependencies
    const registerUser = new RegisterUser({
      userRepository,
      authService,
      auditLogger,
      eventBus,
    });

    // Execute use-case
    const result = await registerUser.execute({
      ...req.body,
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // Return response
    res.status(201).json({
      data: result,
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * POST /api/v1/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    // Sign in via auth service
    const { userId, session } = await authService.signIn({ email, password });

    // Get user details
    const getUser = new GetUser({ userRepository, auditLogger });
    const user = await getUser.execute({
      userId,
      requestorId: userId,
      requestorRole: 'self',
    });

    // Audit log
    await auditLogger.logAuthAttempt({
      userId,
      success: true,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      data: {
        userId,
        session,
        user,
      },
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Log failed attempt
    await auditLogger.logAuthAttempt({
      userId: null,
      success: false,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    handleError(error, res);
  }
}

/**
 * POST /api/v1/auth/logout
 */
export async function logout(req, res) {
  try {
    await authService.signOut();

    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * GET /api/v1/auth/me
 */
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user?.id; // Set by auth middleware

    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'Not authenticated',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const getUser = new GetUser({ userRepository, auditLogger });
    const user = await getUser.execute({
      userId,
      requestorId: userId,
      requestorRole: 'self',
    });

    res.status(200).json({
      data: user,
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * Error handler
 */
function handleError(error, res) {
  console.error('API Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: error.message,
        code: 'VALIDATION_ERROR',
        errors: error.errors,
      },
    });
  }

  // Default to 500 Internal Server Error
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}
