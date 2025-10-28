/**
 * 🛡️ Input Validation & XSS Protection System
 * Comprehensive input validation and sanitization for all user inputs
 */

import React from 'react';
import createDOMPurify from 'dompurify';
import validator from 'validator';

// =============================================
// XSS PROTECTION & HTML SANITIZATION
// =============================================

/**
 * Configure DOMPurify with secure settings
 */
let DOMPurify;
try {
  const w = typeof window !== 'undefined' ? window : undefined;
  DOMPurify = w ? createDOMPurify(w) : null;
} catch (e) {
  DOMPurify = null;
}

const configureDOMPurify = () => {
  if (!DOMPurify || typeof DOMPurify.setConfig !== 'function') return;
  // Configure DOMPurify for maximum security
  DOMPurify.setConfig({
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: false,
    // Remove all potentially dangerous elements
    FORBID_TAGS: [
      'script',
      'object',
      'embed',
      'link',
      'style',
      'iframe',
      'frame',
      'frameset',
      'applet',
      'meta',
      'form',
      'input',
      'button',
      'select',
      'textarea',
      'option',
      'optgroup',
      'fieldset',
      'legend',
      'label',
    ],
    // Remove all potentially dangerous attributes
    FORBID_ATTR: [
      'onerror',
      'onload',
      'onclick',
      'onmouseover',
      'onfocus',
      'onblur',
      'onchange',
      'onsubmit',
      'onreset',
      'onselect',
      'onunload',
      'onabort',
      'onkeydown',
      'onkeypress',
      'onkeyup',
      'onmousedown',
      'onmouseup',
      'onmousemove',
      'onmouseout',
      'style',
      'class',
      'id',
    ],
  });
};

// Initialize DOMPurify configuration
configureDOMPurify();

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - HTML content to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html, options = {}) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const config = {
    ALLOWED_TAGS: options.allowedTags || ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: options.allowedAttributes || [],
    ...options,
  };

  if (!DOMPurify || typeof DOMPurify.sanitize !== 'function') return html;
  return DOMPurify.sanitize(html, config);
}

/**
 * Sanitize plain text input
 * @param {string} text - Text to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized text
 */
export function sanitizeText(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  // Remove HTML tags completely for plain text
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"&]/g, (match) => {
    const entities = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    };
    return entities[match];
  });

  // Remove null bytes and control characters
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Apply length limit if specified
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

// =============================================
// INPUT VALIDATION RULES
// =============================================

/**
 * Validation rules for different input types
 */
export const validationRules = {
  email: {
    required: true,
    validate: (value) => validator.isEmail(value),
    sanitize: (value) => sanitizeText(value.toLowerCase()),
    message: 'Please enter a valid email address',
  },

  password: {
    required: true,
    validate: (value) =>
      value.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value),
    message:
      'Password must be at least 8 characters with uppercase, lowercase, and number',
  },

  phone: {
    required: true,
    validate: (value) =>
      validator.isMobilePhone(value, 'any', { strictMode: false }),
    sanitize: (value) => value.replace(/[^\d+\-\s()]/g, ''),
    message: 'Please enter a valid phone number',
  },

  name: {
    required: true,
    validate: (value) =>
      value.length >= 2 &&
      value.length <= 50 &&
      /^[a-zA-Z\s\-'.]+$/.test(value),
    sanitize: (value) => sanitizeText(value, { maxLength: 50 }),
    message:
      'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes',
  },

  text: {
    validate: (value) => value.length <= 1000,
    sanitize: (value) => sanitizeText(value, { maxLength: 1000 }),
    message: 'Text must be less than 1000 characters',
  },

  url: {
    validate: (value) =>
      !value || validator.isURL(value, { require_protocol: true }),
    sanitize: (value) => sanitizeText(value),
    message: 'Please enter a valid URL',
  },

  number: {
    validate: (value) => validator.isNumeric(value.toString()),
    sanitize: (value) => value.toString().replace(/[^\d.-]/g, ''),
    message: 'Please enter a valid number',
  },
};

// =============================================
// VALIDATION FUNCTIONS
// =============================================

/**
 * Validate a single field
 * @param {string} fieldName - Name of the field
 * @param {any} value - Value to validate
 * @param {string} type - Validation type
 * @param {Object} customRules - Custom validation rules
 * @returns {Object} Validation result
 */
export function validateField(
  fieldName,
  value,
  type = 'text',
  customRules = {}
) {
  const rules = { ...validationRules[type], ...customRules };
  const errors = [];

  // Check if required
  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors, sanitizedValue: '' };
  }

  // Skip validation if not required and empty
  if (!rules.required && (!value || value.toString().trim() === '')) {
    return { isValid: true, errors: [], sanitizedValue: '' };
  }

  // Sanitize the value
  let sanitizedValue = value;
  if (rules.sanitize) {
    sanitizedValue = rules.sanitize(value);
  }

  // Validate the sanitized value
  if (rules.validate && !rules.validate(sanitizedValue)) {
    errors.push(rules.message || `${fieldName} is invalid`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
  };
}

/**
 * Validate multiple fields
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
 */
export function validateForm(data, schema) {
  const errors = {};
  const sanitizedData = {};
  let isValid = true;

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = data[fieldName];
    const result = validateField(
      fieldName,
      value,
      fieldSchema.type || 'text',
      fieldSchema.rules || {}
    );

    if (!result.isValid) {
      errors[fieldName] = result.errors;
      isValid = false;
    }

    sanitizedData[fieldName] = result.sanitizedValue;
  }

  return {
    isValid,
    errors,
    sanitizedData,
  };
}

// =============================================
// REACT HOOKS
// =============================================

/**
 * React hook for form validation
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation utilities
 */
export function useFormValidation(schema) {
  const [errors, setErrors] = React.useState({});

  // Use distinct names to avoid shadowing the top-level exports
  const validateOne = (fieldName, value) => {
    const fieldSchema = schema[fieldName];
    if (!fieldSchema) return { isValid: true, sanitizedValue: value };

    const result = validateField(
      fieldName,
      value,
      fieldSchema.type || 'text',
      fieldSchema.rules || {}
    );

    setErrors((prev) => ({
      ...prev,
      [fieldName]: result.isValid ? undefined : result.errors,
    }));

    return result;
  };

  const validateAll = (data) => {
    const result = validateForm(data, schema);
    setErrors(result.errors);
    return result;
  };

  const clearErrors = () => setErrors({});

  return {
    errors,
    validateField: validateOne,
    validateForm: validateAll,
    clearErrors,
  };
}
