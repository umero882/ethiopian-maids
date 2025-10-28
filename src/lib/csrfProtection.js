/**
 * 🛡️ CSRF Protection System
 * Implements Cross-Site Request Forgery protection for all forms and API calls
 */

// =============================================
// CSRF TOKEN MANAGEMENT
// =============================================

/**
 * Generate a cryptographically secure CSRF token
 * @returns {string} CSRF token
 */
export function generateCSRFToken() {
  // Use crypto.getRandomValues for secure random generation
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
}

/**
 * Get or create CSRF token for current session
 * @returns {string} CSRF token
 */
export function getCSRFToken() {
  const sessionKey = 'csrf_token';
  let token = sessionStorage.getItem(sessionKey);

  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem(sessionKey, token);
  }

  return token;
}

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @returns {boolean} Whether token is valid
 */
export function validateCSRFToken(token) {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken && token && storedToken === token;
}

/**
 * Clear CSRF token (on logout)
 */
export function clearCSRFToken() {
  sessionStorage.removeItem('csrf_token');
}

// =============================================
// FORM PROTECTION
// =============================================

/**
 * Add CSRF token to form data
 * @param {FormData|Object} formData - Form data to protect
 * @returns {FormData|Object} Protected form data
 */
export function addCSRFToken(formData) {
  const token = getCSRFToken();

  if (formData instanceof FormData) {
    formData.append('csrf_token', token);
  } else if (typeof formData === 'object') {
    formData.csrf_token = token;
  }

  return formData;
}

/**
 * Create protected form submission handler
 * @param {Function} originalHandler - Original form handler
 * @returns {Function} Protected form handler
 */
export function createProtectedFormHandler(originalHandler) {
  return async (formData, ...args) => {
    // Add CSRF token to form data
    const protectedData = addCSRFToken(formData);

    // Call original handler with protected data
    return await originalHandler(protectedData, ...args);
  };
}

// =============================================
// API PROTECTION
// =============================================

/**
 * Create protected API call with CSRF token
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @param {Object} options - Additional options
 * @returns {Promise} API response
 */
export async function protectedAPICall(
  method,
  endpoint,
  data = {},
  options = {}
) {
  const token = getCSRFToken();

  // Add CSRF token to headers
  const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
    ...options.headers,
  };

  // For POST/PUT/PATCH requests, also add token to body
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    data.csrf_token = token;
  }

  const requestOptions = {
    method: method.toUpperCase(),
    headers,
    ...options,
  };

  if (data && Object.keys(data).length > 0) {
    requestOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(endpoint, requestOptions);

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Protected API call failed:', error);
    throw error;
  }
}

// =============================================
// SUPABASE INTEGRATION
// =============================================

/**
 * Create protected Supabase operation
 * @param {Function} operation - Supabase operation
 * @returns {Function} Protected operation
 */
export function createProtectedSupabaseOperation(operation) {
  return async (...args) => {
    const token = getCSRFToken();

    // Add CSRF token to the operation context
    const context = {
      csrf_token: token,
      timestamp: Date.now(),
    };

    // Execute the operation with context
    try {
      return await operation(...args, context);
    } catch (error) {
      console.error('Protected Supabase operation failed:', error);
      throw error;
    }
  };
}

// =============================================
// REACT HOOKS
// =============================================

/**
 * React hook for CSRF protection
 * @returns {Object} CSRF utilities
 */
export function useCSRFProtection() {
  const token = getCSRFToken();

  return {
    token,
    addToFormData: (formData) => addCSRFToken(formData),
    createProtectedHandler: createProtectedFormHandler,
    protectedAPICall: (method, endpoint, data, options) =>
      protectedAPICall(method, endpoint, data, options),
  };
}

// =============================================
// INITIALIZATION
// =============================================

/**
 * Initialize CSRF protection system
 */
export function initializeCSRFProtection() {
  // Generate initial token
  getCSRFToken();

  // Clear token on page unload for security
  window.addEventListener('beforeunload', () => {
    // Don't clear on refresh, only on actual navigation away
    if (performance.navigation.type === 1) {
      clearCSRFToken();
    }
  });

}

// Auto-initialize in browser environment when event API is available
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  initializeCSRFProtection();
}
