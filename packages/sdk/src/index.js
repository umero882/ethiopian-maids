/**
 * Ethiopian Maids API SDK
 *
 * Type-safe client generated from OpenAPI specification.
 * Usage: import createClient from '@ethio-maids/sdk'
 */

import createClient from 'openapi-fetch';

/**
 * Create API client
 * @param {Object} options - Client configuration
 * @param {string} options.baseUrl - API base URL
 * @param {string} options.token - Bearer token for authentication
 * @returns API client with typed methods
 */
export default function createApiClient(options = {}) {
  const {
    baseUrl = process.env.VITE_API_URL || 'http://localhost:3001/api/v1',
    token = null,
  } = options;

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // This will be type-safe after running npm run generate
  const client = createClient({
    baseUrl,
    headers,
  });

  return client;
}

/**
 * Helper to handle API responses
 */
export async function handleResponse(promise) {
  const { data, error } = await promise;

  if (error) {
    throw new ApiError(error.message, error.code, error.errors);
  }

  return data;
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, code, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.errors = errors;
  }
}

// Re-export types after generation
// export type * from './schema';
