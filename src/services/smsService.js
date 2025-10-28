// SMS Service using Twilio for phone verification
import { createLogger } from '@/utils/logger';

const log = createLogger('SMSService');

class SMSService {
  constructor() {
    // Use the backend server URL (port 3001) for API calls
    this.baseUrl = 'http://localhost:3001/api/sms';
  }

  /**
   * Send verification code to phone number
   * @param {string} phoneNumber - Phone number in E.164 format (e.g., +1234567890)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async sendVerificationCode(phoneNumber) {
    try {
      const response = await fetch(`${this.baseUrl}/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      // Check if response is ok first
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            'SMS service is not configured yet. Please contact support.'
          );
        }
        throw new Error(`Server error: ${response.status}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(
          'SMS service is not properly configured. Please contact support.'
        );
      }

      const data = await response.json();

      return {
        success: true,
        message: 'Verification code sent successfully',
        data: data,
      };
    } catch (error) {
      log.error('Send verification error:', error);

      // Handle specific error types
      if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        throw new Error(
          'SMS service is not configured yet. Please contact support.'
        );
      }

      throw new Error(error.message || 'Failed to send verification code');
    }
  }

  /**
   * Verify the code entered by user
   * @param {string} phoneNumber - Phone number in E.164 format
   * @param {string} code - 6-digit verification code
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async verifyCode(phoneNumber, code) {
    try {
      const response = await fetch(`${this.baseUrl}/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, code }),
      });

      // Check if response is ok first
      if (!response.ok) {
        if (response.status === 404) {
          // Fallback for development mode when server is not configured
          if (code === '123456') {
            return {
              success: true,
              message: 'Phone number verified successfully (development mode)',
              data: { valid: true, developmentMode: true },
            };
          }
          throw new Error('Invalid verification code');
        }
        throw new Error(`Server error: ${response.status}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Fallback for development mode when server returns non-JSON
        if (code === '123456') {
          return {
            success: true,
            message: 'Phone number verified successfully (development mode)',
            data: { valid: true, developmentMode: true },
          };
        }
        throw new Error('Invalid verification code');
      }

      const data = await response.json();

      return {
        success: true,
        message: 'Phone number verified successfully',
        data: data,
      };
    } catch (error) {
      log.error('Verify code error:', error);

      // Handle specific error types
      if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        // Fallback for development mode
        if (code === '123456') {
          return {
            success: true,
            message: 'Phone number verified successfully (development mode)',
            data: { valid: true, developmentMode: true },
          };
        }
        throw new Error('Invalid verification code');
      }

      // Network errors - provide fallback for development
      if (
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch')
      ) {
        if (code === '123456') {
          return {
            success: true,
            message: 'Phone number verified successfully (development mode)',
            data: { valid: true, developmentMode: true },
          };
        }
        throw new Error('Invalid verification code');
      }

      throw new Error(error.message || 'Failed to verify code');
    }
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phoneNumber - Raw phone number
   * @param {string} countryCode - Country code (e.g., 'US', 'AE', 'ET')
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber, countryCode = 'AE') {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Country code mappings for common GCC and Ethiopian numbers
    const countryPrefixes = {
      AE: '+971', // UAE
      SA: '+966', // Saudi Arabia
      KW: '+965', // Kuwait
      QA: '+974', // Qatar
      BH: '+973', // Bahrain
      OM: '+968', // Oman
      ET: '+251', // Ethiopia
      PH: '+63', // Philippines
      ID: '+62', // Indonesia
      LK: '+94', // Sri Lanka
      IN: '+91', // India
    };

    const prefix = countryPrefixes[countryCode] || '+971';

    // If number already starts with country code, return as is
    if (cleaned.startsWith(prefix.substring(1))) {
      return `+${cleaned}`;
    }

    // If number starts with 0, remove it (common in local formats)
    const withoutLeadingZero = cleaned.startsWith('0')
      ? cleaned.substring(1)
      : cleaned;

    return `${prefix}${withoutLeadingZero}`;
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - Whether the phone number is valid
   */
  isValidPhoneNumber(phoneNumber) {
    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Get country code from phone number
   * @param {string} phoneNumber - Phone number in E.164 format
   * @returns {string|null} - Country code or null if not found
   */
  getCountryCodeFromPhone(phoneNumber) {
    const countryMappings = {
      '+971': 'AE',
      '+966': 'SA',
      '+965': 'KW',
      '+974': 'QA',
      '+973': 'BH',
      '+968': 'OM',
      '+251': 'ET',
      '+63': 'PH',
      '+62': 'ID',
      '+94': 'LK',
      '+91': 'IN',
    };

    for (const [prefix, code] of Object.entries(countryMappings)) {
      if (phoneNumber.startsWith(prefix)) {
        return code;
      }
    }

    return null;
  }
}

// Create and export singleton instance
export const smsService = new SMSService();
export default smsService;
