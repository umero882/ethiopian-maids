/**
 * Phone Verification Service
 * Handles phone verification logic and database operations
 *
 * @module services/phoneVerificationService
 */

import { supabase } from '@/lib/databaseClient';
import twilioService from './twilioService';

class PhoneVerificationService {
  /**
   * Start phone verification process
   * @param {string} userId - User ID from auth
   * @param {string} phoneNumber - E.164 format phone number
   * @returns {Promise<{data?: object, error?: object}>}
   */
  async startVerification(userId, phoneNumber) {
    try {
      // Validate inputs
      if (!userId) {
        return { error: { message: 'User ID is required' } };
      }

      if (!phoneNumber) {
        return { error: { message: 'Phone number is required' } };
      }

      // Format and validate phone number
      const formattedPhone = phoneNumber.trim();
      if (!twilioService.validatePhoneNumber(formattedPhone)) {
        return { error: { message: 'Invalid phone number format. Use E.164 format (e.g., +12025551234)' } };
      }

      // Check if phone is already verified by another user
      const { data: existingSponsor } = await supabase
        .from('sponsor_profiles')
        .select('id, user_id')
        .eq('phone_number', formattedPhone)
        .eq('phone_verified', true)
        .neq('user_id', userId)
        .maybeSingle();

      if (existingSponsor) {
        return { error: { message: 'This phone number is already verified by another user' } };
      }

      // Check maid profiles too
      const { data: existingMaid } = await supabase
        .from('maid_profiles')
        .select('id, user_id')
        .eq('phone_number', formattedPhone)
        .eq('phone_verified', true)
        .neq('user_id', userId)
        .maybeSingle();

      if (existingMaid) {
        return { error: { message: 'This phone number is already verified by another user' } };
      }

      // Generate verification code
      const code = twilioService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing pending verifications for this user/phone
      await supabase
        .from('phone_verifications')
        .delete()
        .eq('user_id', userId)
        .eq('phone_number', formattedPhone)
        .eq('verified', false);

      // Save verification to database
      const { data: verification, error: dbError } = await supabase
        .from('phone_verifications')
        .insert({
          user_id: userId,
          phone_number: formattedPhone,
          verification_code: code,
          code_expires_at: expiresAt.toISOString(),
          verified: false,
          attempts: 0,
          max_attempts: 3,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        return { error: { message: 'Failed to create verification. Please try again.' } };
      }

      // Send SMS
      const smsResult = await twilioService.sendVerificationCode(formattedPhone, code);

      if (!smsResult.success) {
        // Delete verification record if SMS fails
        await supabase
          .from('phone_verifications')
          .delete()
          .eq('id', verification.id);

        return {
          error: {
            message: `Failed to send SMS: ${smsResult.error || 'Unknown error'}`,
          },
        };
      }

      return {
        data: {
          verificationId: verification.id,
          phoneNumber: formattedPhone,
          expiresAt: expiresAt.toISOString(),
          maskedPhone: twilioService.maskPhoneNumber(formattedPhone),
        },
      };
    } catch (error) {
      console.error('Error starting verification:', error);
      return {
        error: {
          message: error.message || 'An unexpected error occurred',
        },
      };
    }
  }

  /**
   * Verify code
   * @param {string} userId - User ID from auth
   * @param {string} phoneNumber - Phone number being verified
   * @param {string} code - 6-digit code from SMS
   * @returns {Promise<{data?: object, error?: object}>}
   */
  async verifyCode(userId, phoneNumber, code) {
    try {
      // Validate inputs
      if (!userId || !phoneNumber || !code) {
        return { error: { message: 'Missing required fields' } };
      }

      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        return { error: { message: 'Invalid code format. Must be 6 digits.' } };
      }

      // Get most recent verification record
      const { data: verification, error: fetchError } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('phone_number', phoneNumber)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError || !verification) {
        return {
          error: {
            message: 'No verification found. Please request a new code.',
          },
        };
      }

      // Check expiration
      if (new Date(verification.code_expires_at) < new Date()) {
        return {
          error: {
            message: 'Verification code has expired. Please request a new code.',
          },
        };
      }

      // Check attempts
      if (verification.attempts >= verification.max_attempts) {
        return {
          error: {
            message: 'Too many failed attempts. Please request a new code.',
          },
        };
      }

      // Verify code
      if (verification.verification_code !== code) {
        // Increment attempts
        await supabase
          .from('phone_verifications')
          .update({ attempts: verification.attempts + 1 })
          .eq('id', verification.id);

        const remainingAttempts = verification.max_attempts - verification.attempts - 1;

        return {
          error: {
            message: `Invalid code. ${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.`,
          },
        };
      }

      // Code is correct - mark as verified
      const { error: updateError } = await supabase
        .from('phone_verifications')
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq('id', verification.id);

      if (updateError) {
        console.error('Error updating verification:', updateError);
        return { error: { message: 'Failed to update verification status' } };
      }

      // Update profile - try sponsor_profiles first
      let profileUpdated = false;
      const { error: sponsorError } = await supabase
        .from('sponsor_profiles')
        .update({
          phone_number: phoneNumber,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (!sponsorError) {
        profileUpdated = true;
      } else {
        // Try maid_profiles
        const { error: maidError } = await supabase
          .from('maid_profiles')
          .update({
            phone_number: phoneNumber,
            phone_verified: true,
            phone_verified_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (!maidError) {
          profileUpdated = true;
        }
      }

      if (!profileUpdated) {
        return {
          error: {
            message: 'Phone verified but failed to update profile. Please contact support.',
          },
        };
      }

      return {
        data: {
          success: true,
          phoneNumber,
          verifiedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error verifying code:', error);
      return {
        error: {
          message: error.message || 'An unexpected error occurred',
        },
      };
    }
  }

  /**
   * Resend verification code
   * @param {string} userId - User ID from auth
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<{data?: object, error?: object}>}
   */
  async resendCode(userId, phoneNumber) {
    try {
      // Delete old pending verification
      await supabase
        .from('phone_verifications')
        .delete()
        .eq('user_id', userId)
        .eq('phone_number', phoneNumber)
        .eq('verified', false);

      // Start new verification
      return await this.startVerification(userId, phoneNumber);
    } catch (error) {
      console.error('Error resending code:', error);
      return {
        error: {
          message: error.message || 'Failed to resend code',
        },
      };
    }
  }

  /**
   * Check if phone number is verified for user
   * @param {string} userId - User ID from auth
   * @returns {Promise<{verified: boolean, phoneNumber?: string}>}
   */
  async checkVerificationStatus(userId) {
    try {
      // Check sponsor profile
      const { data: sponsorData } = await supabase
        .from('sponsor_profiles')
        .select('phone_number, phone_verified')
        .eq('user_id', userId)
        .maybeSingle();

      if (sponsorData?.phone_verified) {
        return {
          verified: true,
          phoneNumber: sponsorData.phone_number,
        };
      }

      // Check maid profile
      const { data: maidData } = await supabase
        .from('maid_profiles')
        .select('phone_number, phone_verified')
        .eq('user_id', userId)
        .maybeSingle();

      if (maidData?.phone_verified) {
        return {
          verified: true,
          phoneNumber: maidData.phone_number,
        };
      }

      return { verified: false };
    } catch (error) {
      console.error('Error checking verification status:', error);
      return { verified: false };
    }
  }

  /**
   * Get pending verification info
   * @param {string} userId - User ID from auth
   * @returns {Promise<{data?: object, error?: object}>}
   */
  async getPendingVerification(userId) {
    try {
      const { data, error } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { data: null };
      }

      return {
        data: {
          verificationId: data.id,
          phoneNumber: data.phone_number,
          maskedPhone: twilioService.maskPhoneNumber(data.phone_number),
          expiresAt: data.code_expires_at,
          attempts: data.attempts,
          maxAttempts: data.max_attempts,
          createdAt: data.created_at,
        },
      };
    } catch (error) {
      console.error('Error getting pending verification:', error);
      return { error };
    }
  }
}

// Export singleton instance
export const phoneVerificationService = new PhoneVerificationService();
export default phoneVerificationService;
