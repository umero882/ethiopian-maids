/**
 * Password Reset Controller
 *
 * API endpoints for password reset functionality:
 * - POST /api/v1/auth/password-reset/request - Request password reset email
 * - POST /api/v1/auth/password-reset/confirm - Confirm password reset with token
 */

import {
  requestPasswordReset,
  resetPassword,
} from '../../../src/config/identityUseCases.js';

/**
 * Request Password Reset
 * POST /api/v1/auth/password-reset/request
 *
 * Body: { email: string }
 * Returns: Always 200 with success message (email enumeration protection)
 */
export async function handlePasswordResetRequest(req, res) {
  try {
    const { email } = req.body;

    // Validation
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email is required',
      });
    }

    // Email format validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      });
    }

    // Gather request metadata
    const metadata = {
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
    };

    // Execute use-case
    const result = await requestPasswordReset.execute({
      email: email.toLowerCase().trim(),
      metadata,
    });

    // Always return success (email enumeration protection)
    return res.status(200).json({
      success: true,
      message:
        'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('❌ Password reset request error:', error);

    // Generic error response (don't leak details)
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An error occurred. Please try again later.',
    });
  }
}

/**
 * Confirm Password Reset
 * POST /api/v1/auth/password-reset/confirm
 *
 * Body: { token: string, newPassword: string }
 * Returns: 200 on success, 400 on invalid token/password
 */
export async function handlePasswordResetConfirm(req, res) {
  try {
    const { token, newPassword } = req.body;

    // Validation
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Token is required',
      });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'New password is required',
      });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters long',
      });
    }

    // Gather request metadata
    const metadata = {
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
    };

    // Execute use-case
    const result = await resetPassword.execute({
      token,
      newPassword,
      metadata,
    });

    if (!result.success) {
      // Handle specific error cases
      const statusCode = result.error === 'TOKEN_EXPIRED' ? 410 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('❌ Password reset confirm error:', error);

    // Check for specific domain errors
    if (error.message?.includes('TOKEN_NOT_FOUND')) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired reset token',
      });
    }

    if (error.message?.includes('TOKEN_EXPIRED')) {
      return res.status(410).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Reset token has expired. Please request a new one.',
      });
    }

    if (error.message?.includes('WEAK_PASSWORD')) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Password does not meet security requirements',
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An error occurred. Please try again later.',
    });
  }
}
