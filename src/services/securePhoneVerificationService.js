/**
 * Secure Phone Verification Service
 * Uses Supabase Edge Function for server-side verification code storage
 * Replaces unsafe client-side sessionStorage approach
 */

import { supabase } from '@/lib/databaseClient';

const VERIFICATION_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/phone-verification`;

class SecurePhoneVerificationService {
  /**
   * Send verification code to phone number
   * @param {string} phone - Phone number in E.164 format (e.g., +971501234567)
   * @returns {Promise<{success: boolean, error?: string, devCode?: string}>}
   */
  async sendVerificationCode(phone) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(VERIFICATION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'send',
          phone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send verification code');
      }

      return {
        success: true,
        devCode: result.devCode, // Only present in development
      };
    } catch (error) {
      console.error('Send verification code error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send verification code',
      };
    }
  }

  /**
   * Verify phone number with code
   * @param {string} phone - Phone number in E.164 format
   * @param {string} code - 6-digit verification code
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async verifyCode(phone, code) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(VERIFICATION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'verify',
          phone,
          code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Verify code error:', error);
      return {
        success: false,
        error: error.message || 'Verification failed',
      };
    }
  }

  /**
   * Resend verification code
   * @param {string} phone - Phone number in E.164 format
   * @returns {Promise<{success: boolean, error?: string, devCode?: string}>}
   */
  async resendVerificationCode(phone) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(VERIFICATION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'resend',
          phone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend verification code');
      }

      return {
        success: true,
        devCode: result.devCode, // Only present in development
      };
    } catch (error) {
      console.error('Resend verification code error:', error);
      return {
        success: false,
        error: error.message || 'Failed to resend verification code',
      };
    }
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phone - Phone number
   * @param {string} countryCode - ISO country code (e.g., 'AE', 'SA')
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone, countryCode = 'AE') {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Country code mappings
    const countryDialCodes = {
      AE: '971',  // UAE
      SA: '966',  // Saudi Arabia
      KW: '965',  // Kuwait
      QA: '974',  // Qatar
      BH: '973',  // Bahrain
      OM: '968',  // Oman
      ET: '251',  // Ethiopia
      US: '1',    // United States
      GB: '44',   // United Kingdom
    };

    // If already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }

    // Get dial code for country
    const dialCode = countryDialCodes[countryCode] || countryDialCodes.AE;

    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // If doesn't start with country code, add it
    if (!cleaned.startsWith(dialCode)) {
      cleaned = dialCode + cleaned;
    }

    return `+${cleaned}`;
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number
   * @returns {boolean} True if valid E.164 format
   */
  validatePhoneNumber(phone) {
    // E.164 format: +[country code][number]
    // Length: 8-15 digits (including country code)
    const e164Regex = /^\+[1-9]\d{7,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Mask phone number for display
   * @param {string} phone - Phone number
   * @returns {string} Masked phone number (e.g., +971******567)
   */
  maskPhoneNumber(phone) {
    if (!phone || phone.length < 8) return phone;

    const start = phone.substring(0, 4);
    const end = phone.substring(phone.length - 3);
    const masked = '*'.repeat(phone.length - 7);

    return `${start}${masked}${end}`;
  }
}

// Export singleton instance
export const securePhoneVerificationService = new SecurePhoneVerificationService();
export default securePhoneVerificationService;
