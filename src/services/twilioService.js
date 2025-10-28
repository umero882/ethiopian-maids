/**
 * Twilio Service
 * Handles SMS sending and phone number operations
 *
 * @module services/twilioService
 */

// Environment variables (only account SID and phone number are safe for frontend)
const ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

class TwilioService {
  constructor() {
    // Backend API endpoint for SMS operations
    this.apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
  }

  /**
   * Send verification code via SMS
   * @param {string} phoneNumber - E.164 format (+1234567890)
   * @param {string} code - 6-digit verification code
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendVerificationCode(phoneNumber, code) {
    try {
      // Validate inputs
      if (!this.validatePhoneNumber(phoneNumber)) {
        return { success: false, error: 'Invalid phone number format' };
      }

      if (!code || code.length !== 6) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Call backend API to send SMS
      const response = await fetch(`${this.apiBaseUrl}/sms/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          code,
          message: `Your Ethiopian Maids verification code is: ${code}. Valid for 10 minutes.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      return { success: true, messageSid: data.messageSid };
    } catch (error) {
      console.error('Error sending verification SMS:', error);
      return {
        success: false,
        error: error.message || 'Failed to send verification code'
      };
    }
  }

  /**
   * Send 2FA code via SMS
   * @param {string} phoneNumber - E.164 format
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async send2FACode(phoneNumber) {
    try {
      if (!this.validatePhoneNumber(phoneNumber)) {
        return { success: false, error: 'Invalid phone number format' };
      }

      const response = await fetch(`${this.apiBaseUrl}/sms/send-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send 2FA code');
      }

      return { success: true, expiresIn: 300 }; // 5 minutes
    } catch (error) {
      console.error('Error sending 2FA SMS:', error);
      return {
        success: false,
        error: error.message || 'Failed to send 2FA code'
      };
    }
  }

  /**
   * Validate phone number format (E.164)
   * @param {string} phoneNumber
   * @returns {boolean}
   */
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }

    // E.164 format: +[country code][number]
    // Examples: +12025551234 (US), +251911234567 (Ethiopia)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164
   * @param {string} phoneNumber
   * @param {string} countryCode - ISO 3166-1 alpha-2 (e.g., 'US', 'ET')
   * @returns {string|null} - Formatted phone number or null if invalid
   */
  formatPhoneNumber(phoneNumber, countryCode = 'US') {
    if (!phoneNumber) return null;

    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Country-specific formatting
    const countryPrefixes = {
      'US': { prefix: '1', length: 10 },
      'ET': { prefix: '251', length: 9 },
      'SA': { prefix: '966', length: 9 },
      'AE': { prefix: '971', length: 9 },
      'KW': { prefix: '965', length: 8 },
      'QA': { prefix: '974', length: 8 },
      'OM': { prefix: '968', length: 8 },
      'BH': { prefix: '973', length: 8 },
    };

    const country = countryPrefixes[countryCode.toUpperCase()];

    if (!country) {
      console.warn(`Unknown country code: ${countryCode}`);
      return null;
    }

    // Add country prefix if missing and length matches
    if (cleaned.length === country.length) {
      cleaned = country.prefix + cleaned;
    }

    // Remove country prefix if present and re-add it (normalize)
    if (cleaned.startsWith(country.prefix)) {
      cleaned = country.prefix + cleaned.substring(country.prefix.length);
    }

    const formatted = '+' + cleaned;

    // Validate final format
    return this.validatePhoneNumber(formatted) ? formatted : null;
  }

  /**
   * Generate 6-digit verification code
   * @returns {string}
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Parse phone number to display format
   * @param {string} phoneNumber - E.164 format
   * @returns {string} - Human-readable format
   */
  formatForDisplay(phoneNumber) {
    if (!phoneNumber || !this.validatePhoneNumber(phoneNumber)) {
      return phoneNumber;
    }

    // Remove leading +
    const digits = phoneNumber.substring(1);

    // Format based on country code
    if (digits.startsWith('1')) {
      // US/Canada: +1 (XXX) XXX-XXXX
      const areaCode = digits.substring(1, 4);
      const prefix = digits.substring(4, 7);
      const line = digits.substring(7, 11);
      return `+1 (${areaCode}) ${prefix}-${line}`;
    } else if (digits.startsWith('251')) {
      // Ethiopia: +251 XX XXX XXXX
      const part1 = digits.substring(3, 5);
      const part2 = digits.substring(5, 8);
      const part3 = digits.substring(8);
      return `+251 ${part1} ${part2} ${part3}`;
    } else if (digits.startsWith('966') || digits.startsWith('971')) {
      // Saudi Arabia/UAE: +XXX XX XXX XXXX
      const country = digits.substring(0, 3);
      const part1 = digits.substring(3, 5);
      const part2 = digits.substring(5, 8);
      const part3 = digits.substring(8);
      return `+${country} ${part1} ${part2} ${part3}`;
    }

    // Default: +XXX XXX XXX XXXX
    return phoneNumber.replace(/(\+\d{1,3})(\d{2,3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }

  /**
   * Get country code from phone number
   * @param {string} phoneNumber - E.164 format
   * @returns {string|null} - Country code or null
   */
  getCountryCode(phoneNumber) {
    if (!this.validatePhoneNumber(phoneNumber)) {
      return null;
    }

    const digits = phoneNumber.substring(1);

    const countryMap = {
      '1': 'US',
      '251': 'ET',
      '966': 'SA',
      '971': 'AE',
      '965': 'KW',
      '974': 'QA',
      '968': 'OM',
      '973': 'BH',
    };

    // Check 3-digit prefixes first
    for (let i = 3; i >= 1; i--) {
      const prefix = digits.substring(0, i);
      if (countryMap[prefix]) {
        return countryMap[prefix];
      }
    }

    return null;
  }

  /**
   * Mask phone number for display
   * @param {string} phoneNumber - E.164 format
   * @returns {string} - Masked phone number (e.g., +1 (XXX) XXX-1234)
   */
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || !this.validatePhoneNumber(phoneNumber)) {
      return phoneNumber;
    }

    const formatted = this.formatForDisplay(phoneNumber);
    const parts = formatted.split(' ');

    if (parts.length >= 3) {
      // Mask middle parts, show last 4 digits
      return parts.map((part, index) => {
        if (index === 0 || index === parts.length - 1) {
          return part; // Keep country code and last part
        }
        return part.replace(/\d/g, 'X');
      }).join(' ');
    }

    return phoneNumber;
  }

  /**
   * Check if Twilio is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(ACCOUNT_SID && PHONE_NUMBER);
  }

  /**
   * Get Twilio account SID (safe to expose)
   * @returns {string|null}
   */
  getAccountSid() {
    return ACCOUNT_SID || null;
  }

  /**
   * Get Twilio phone number (safe to expose)
   * @returns {string|null}
   */
  getPhoneNumber() {
    return PHONE_NUMBER || null;
  }
}

// Export singleton instance
export const twilioService = new TwilioService();
export default twilioService;
