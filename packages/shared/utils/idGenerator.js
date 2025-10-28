/**
 * ID Generator Utility
 *
 * Generates unique IDs for entities.
 * Uses UUID v4 format for globally unique identifiers.
 * Browser-compatible implementation using Web Crypto API.
 */

/**
 * Generate a UUID v4 identifier
 * Browser-compatible version using crypto.getRandomValues or Math.random fallback
 * @returns {string} A UUID v4 string
 */
export function generateId() {
  // Use browser's crypto.getRandomValues if available, otherwise fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment with Web Crypto API
    return generateIdBrowser();
  } else if (typeof require !== 'undefined') {
    // Node.js environment
    return generateIdNode();
  } else {
    // Fallback for environments without crypto
    return generateIdFallback();
  }
}

/**
 * Generate UUID using Web Crypto API (browser)
 * @private
 */
function generateIdBrowser() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Set version (4) and variant bits according to RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

  // Convert to hex string with dashes
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-');
}

/**
 * Generate UUID using Node.js crypto (server)
 * @private
 */
function generateIdNode() {
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(16);

  // Set version (4) and variant bits according to RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

  // Convert to hex string with dashes
  const hex = bytes.toString('hex');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-');
}

/**
 * Generate UUID using Math.random (fallback)
 * @private
 */
function generateIdFallback() {
  // RFC 4122 version 4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a short ID (8 characters)
 * Useful for user-facing IDs or reference numbers
 * Browser-compatible version
 * @returns {string} A short alphanumeric ID
 */
export function generateShortId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters
  let result = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 8; i++) {
      result += chars[bytes[i] % chars.length];
    }
  } else if (typeof require !== 'undefined') {
    // Node.js environment
    const crypto = require('crypto');
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      result += chars[bytes[i] % chars.length];
    }
  } else {
    // Fallback
    for (let i = 0; i < 8; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return result;
}

/**
 * Validate UUID format
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid UUID format
 */
export function isValidUuid(id) {
  if (typeof id !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
