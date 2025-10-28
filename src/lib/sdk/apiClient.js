/**
 * API Client Wrapper
 *
 * Wraps the SDK client with application-specific configuration and error handling.
 * Provides a singleton instance for use throughout the application.
 */

// Note: This will be replaced with actual SDK import once packages are set up
// import createClient from '@ethio-maids/sdk';

/**
 * Mock SDK client for development
 * Replace this with actual SDK once package linking is set up
 */
class MockSDKClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.headers = config.headers || {};
  }

  async GET(path, options = {}) {
    const url = new URL(path, this.baseUrl);
    if (options.params?.query) {
      Object.entries(options.params.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
    });

    return this._handleResponse(response);
  }

  async POST(path, options = {}) {
    const url = new URL(path, this.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options.body),
    });

    return this._handleResponse(response);
  }

  async PUT(path, options = {}) {
    const url = new URL(path, this.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options.body),
    });

    return this._handleResponse(response);
  }

  async PATCH(path, options = {}) {
    const url = new URL(path, this.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options.body),
    });

    return this._handleResponse(response);
  }

  async DELETE(path, options = {}) {
    const url = new URL(path, this.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
    });

    return this._handleResponse(response);
  }

  setAuthToken(token) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.headers['Authorization'];
    }
  }

  async _handleResponse(response) {
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return { data, response };
  }
}

// Singleton instance
let apiClientInstance = null;

/**
 * Get or create the API client instance
 * @param {Object} config - Optional configuration (only used on first call)
 * @returns {MockSDKClient} The API client instance
 */
export function getApiClient(config) {
  if (!apiClientInstance) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

    apiClientInstance = new MockSDKClient({
      baseUrl,
      ...config,
    });
  }

  return apiClientInstance;
}

/**
 * Reset the API client instance (useful for testing)
 */
export function resetApiClient() {
  apiClientInstance = null;
}

/**
 * Set authentication token for API requests
 * @param {string} token - JWT token
 */
export function setAuthToken(token) {
  const client = getApiClient();
  client.setAuthToken(token);
}

/**
 * Clear authentication token
 */
export function clearAuthToken() {
  const client = getApiClient();
  client.setAuthToken(null);
}

export default getApiClient;
