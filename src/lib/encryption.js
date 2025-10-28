/**
 * 🔐 Field-Level Encryption for PII Data
 * Provides secure encryption for sensitive personal information
 * Using AES-256-GCM for authenticated encryption
 */

import React from 'react';
import { createLogger } from '@/utils/logger';

const log = createLogger('Encryption');

// Fields that should be encrypted
export const ENCRYPTED_FIELDS = [
  'passport_number',
  'national_id',
  'bank_account',
  'phone_number', // when stored in logs
  'emergency_contact_phone',
  'medical_info',
  'previous_employer_contact',
];

class FieldEncryption {
  constructor() {
    this.isInitialized = false;
    this.encryptionKey = null;

    // Initialize encryption if in browser environment
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      this.initializeEncryption();
    }
  }

  async initializeEncryption() {
    try {
      // In production, this key should come from a secure key management service
      // For now, derive from a combination of factors
      const keyMaterial = await this.getKeyMaterial();
      this.encryptionKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('ethio-maids-salt-v1'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      this.isInitialized = true;
      log.debug('Field encryption initialized successfully');
    } catch (error) {
      log.error('Failed to initialize encryption', error);
      this.isInitialized = false;
    }
  }

  async getKeyMaterial() {
    // In production, this should be retrieved from a secure key management service
    // For development, use a derived key from environment-specific data
    const keyString = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENCRYPTION_KEY) ||
                     process.env.VITE_ENCRYPTION_KEY ||
                     'default-development-key-not-for-production-use';

    return await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keyString),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
  }

  /**
   * Encrypt a field value
   * @param {string} value - The value to encrypt
   * @returns {Promise<string>} Encrypted value as base64 string
   */
  async encrypt(value) {
    if (!this.isInitialized) {
      await this.initializeEncryption();
    }

    if (!value || typeof value !== 'string') {
      return value; // Don't encrypt null/empty/non-string values
    }

    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedValue = new TextEncoder().encode(value);

      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey,
        encodedValue
      );

      // Combine IV + encrypted data and encode as base64
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      log.error('Encryption failed', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt a field value
   * @param {string} encryptedValue - The encrypted value as base64 string
   * @returns {Promise<string>} Decrypted value
   */
  async decrypt(encryptedValue) {
    if (!this.isInitialized) {
      await this.initializeEncryption();
    }

    if (!encryptedValue || typeof encryptedValue !== 'string') {
      return encryptedValue;
    }

    try {
      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      log.error('Decryption failed', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Encrypt multiple fields in an object
   * @param {Object} data - Object containing data to encrypt
   * @param {string[]} fieldsToEncrypt - Array of field names to encrypt
   * @returns {Promise<Object>} Object with encrypted fields
   */
  async encryptFields(data, fieldsToEncrypt = ENCRYPTED_FIELDS) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const result = { ...data };

    for (const field of fieldsToEncrypt) {
      if (result[field]) {
        try {
          result[field] = await this.encrypt(result[field]);
          // Mark field as encrypted for future reference
          result[`${field}_encrypted`] = true;
        } catch (error) {
          log.error(`Failed to encrypt field ${field}`, error);
          // Don't break the entire operation for one field
        }
      }
    }

    return result;
  }

  /**
   * Decrypt multiple fields in an object
   * @param {Object} data - Object containing encrypted data
   * @param {string[]} fieldsToDecrypt - Array of field names to decrypt
   * @returns {Promise<Object>} Object with decrypted fields
   */
  async decryptFields(data, fieldsToDecrypt = ENCRYPTED_FIELDS) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const result = { ...data };

    for (const field of fieldsToDecrypt) {
      if (result[field] && result[`${field}_encrypted`]) {
        try {
          result[field] = await this.decrypt(result[field]);
          // Remove encryption marker
          delete result[`${field}_encrypted`];
        } catch (error) {
          log.error(`Failed to decrypt field ${field}`, error);
          // Keep encrypted value if decryption fails
        }
      }
    }

    return result;
  }

  /**
   * Hash a value for searching (one-way hash)
   * @param {string} value - Value to hash
   * @returns {Promise<string>} SHA-256 hash as hex string
   */
  async hashForSearch(value) {
    if (!value || typeof value !== 'string') {
      return null;
    }

    try {
      const encoded = new TextEncoder().encode(value);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      log.error('Hashing failed', error);
      throw new Error('Failed to hash value');
    }
  }

  /**
   * Mask a sensitive value for display
   * @param {string} value - Value to mask
   * @param {number} showFirst - Number of characters to show at start
   * @param {number} showLast - Number of characters to show at end
   * @returns {string} Masked value
   */
  maskValue(value, showFirst = 2, showLast = 2) {
    if (!value || typeof value !== 'string') {
      return value;
    }

    if (value.length <= showFirst + showLast) {
      return '*'.repeat(value.length);
    }

    return value.substring(0, showFirst) +
           '*'.repeat(Math.max(4, value.length - showFirst - showLast)) +
           value.substring(value.length - showLast);
  }
}

// Export singleton instance
export const fieldEncryption = new FieldEncryption();

// Utility functions
export const encryptPII = (data, fields) => fieldEncryption.encryptFields(data, fields);
export const decryptPII = (data, fields) => fieldEncryption.decryptFields(data, fields);
export const maskPII = (value, showFirst, showLast) => fieldEncryption.maskValue(value, showFirst, showLast);
export const hashForSearch = (value) => fieldEncryption.hashForSearch(value);

// React hook for encrypted data
export function useEncryptedData(data, fields = ENCRYPTED_FIELDS) {
  const [decryptedData, setDecryptedData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!data) {
      setDecryptedData(null);
      setLoading(false);
      return;
    }

    fieldEncryption.decryptFields(data, fields)
      .then(setDecryptedData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [data, fields]);

  return { data: decryptedData, loading, error };
}
