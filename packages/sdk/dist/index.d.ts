/**
 * Create API client
 * @param {Object} options - Client configuration
 * @param {string} options.baseUrl - API base URL
 * @param {string} options.token - Bearer token for authentication
 * @returns API client with typed methods
 */
export default function createApiClient(options?: {
    baseUrl: string;
    token: string;
}): {
    GET: import("openapi-fetch").ClientMethod<{}, "get", `${string}/${string}`>;
    PUT: import("openapi-fetch").ClientMethod<{}, "put", `${string}/${string}`>;
    POST: import("openapi-fetch").ClientMethod<{}, "post", `${string}/${string}`>;
    DELETE: import("openapi-fetch").ClientMethod<{}, "delete", `${string}/${string}`>;
    OPTIONS: import("openapi-fetch").ClientMethod<{}, "options", `${string}/${string}`>;
    HEAD: import("openapi-fetch").ClientMethod<{}, "head", `${string}/${string}`>;
    PATCH: import("openapi-fetch").ClientMethod<{}, "patch", `${string}/${string}`>;
    TRACE: import("openapi-fetch").ClientMethod<{}, "trace", `${string}/${string}`>;
    use(...middleware: import("openapi-fetch").Middleware[]): void;
    eject(...middleware: import("openapi-fetch").Middleware[]): void;
};
/**
 * Helper to handle API responses
 */
export function handleResponse(promise: any): Promise<any>;
/**
 * Custom API Error class
 */
export class ApiError extends Error {
    constructor(message: any, code: any, errors?: any[]);
    code: any;
    errors: any[];
}
