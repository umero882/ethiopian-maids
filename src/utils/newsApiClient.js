import { NEWS_CONFIG } from '@/config/newsConfig';

/**
 * Enhanced API client with retry logic, rate limiting, and error handling
 */
class NewsAPIClient {
  constructor() {
    this.requestQueue = new Map();
    this.rateLimiters = new Map();
    this.cache = new Map();
    this.retryAttempts = new Map();
  }

  /**
   * Make a rate-limited API request with retry logic
   */
  async makeRequest(url, options = {}, source = 'default') {
    const requestId = `${source}-${url}`;

    try {
      // Check cache first
      const cached = this.getFromCache(requestId);
      if (cached) {
        return cached;
      }

      // Apply rate limiting
      await this.applyRateLimit(source);

      // Make the request with timeout
      const response = await this.fetchWithTimeout(url, {
        ...options,
        headers: {
          'User-Agent': 'EthiopianMaids-NewsAggregator/1.0',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful response
      this.setCache(requestId, data);

      // Reset retry counter on success
      this.retryAttempts.delete(requestId);

      return data;
    } catch (error) {
      return this.handleRequestError(requestId, url, options, source, error);
    }
  }

  /**
   * Fetch with timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      NEWS_CONFIG.ERROR_CONFIG.TIMEOUT
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Handle request errors with retry logic
   */
  async handleRequestError(requestId, url, options, source, error) {
    const currentAttempts = this.retryAttempts.get(requestId) || 0;
    const maxRetries = NEWS_CONFIG.ERROR_CONFIG.MAX_RETRIES;

    if (NEWS_CONFIG.ERROR_CONFIG.LOG_ERRORS) {
      console.error(
        `API request failed (attempt ${currentAttempts + 1}/${maxRetries + 1}):`,
        {
          source,
          url,
          error: error.message,
        }
      );
    }

    // Check if we should retry
    if (currentAttempts < maxRetries && this.shouldRetry(error)) {
      this.retryAttempts.set(requestId, currentAttempts + 1);

      // Exponential backoff
      const delay =
        NEWS_CONFIG.ERROR_CONFIG.RETRY_DELAY * Math.pow(2, currentAttempts);
      await new Promise((resolve) => setTimeout(resolve, delay));

      return this.makeRequest(url, options, source);
    }

    // Max retries reached or non-retryable error
    this.retryAttempts.delete(requestId);

    // Try to return cached data if available
    if (NEWS_CONFIG.ERROR_CONFIG.FALLBACK_TO_CACHE) {
      const cached = this.getFromCache(requestId, true); // Allow stale cache
      if (cached) {
        console.warn(`Using stale cache for ${source} due to API failure`);
        return cached;
      }
    }

    throw error;
  }

  /**
   * Determine if an error is retryable
   */
  shouldRetry(error) {
    const retryableErrors = [
      'timeout',
      'network error',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
    ];

    const retryableStatusCodes = [429, 500, 502, 503, 504];

    // Check error message
    const errorMessage = error.message.toLowerCase();
    if (retryableErrors.some((retryable) => errorMessage.includes(retryable))) {
      return true;
    }

    // Check HTTP status codes
    if (error.status && retryableStatusCodes.includes(error.status)) {
      return true;
    }

    return false;
  }

  /**
   * Apply rate limiting for a source
   */
  async applyRateLimit(source) {
    const rateLimit = NEWS_CONFIG.RATE_LIMITS[source] || 1000;
    const lastRequest = this.rateLimiters.get(source);

    if (lastRequest) {
      const timeSinceLastRequest = Date.now() - lastRequest;
      if (timeSinceLastRequest < rateLimit) {
        const waitTime = rateLimit - timeSinceLastRequest;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    this.rateLimiters.set(source, Date.now());
  }

  /**
   * Cache management
   */
  setCache(key, data) {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + NEWS_CONFIG.UPDATE_INTERVALS.CACHE_DURATION,
    };

    this.cache.set(key, cacheEntry);

    // Cleanup old cache entries
    this.cleanupCache();
  }

  getFromCache(key, allowStale = false) {
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();

    if (!allowStale && now > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  cleanupCache() {
    const now = Date.now();
    const maxSize = NEWS_CONFIG.PERFORMANCE.CACHE_SIZE_LIMIT;

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }

    // If still over limit, remove oldest entries
    if (this.cache.size > maxSize) {
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      const toRemove = entries.slice(0, this.cache.size - maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Batch requests with concurrency control
   */
  async batchRequests(
    requests,
    maxConcurrency = NEWS_CONFIG.PERFORMANCE.MAX_CONCURRENT_REQUESTS
  ) {
    const results = [];
    const executing = [];

    for (const request of requests) {
      const promise = this.makeRequest(
        request.url,
        request.options,
        request.source
      )
        .then((result) => ({ ...request, result, success: true }))
        .catch((error) => ({ ...request, error, success: false }));

      results.push(promise);

      if (results.length >= maxConcurrency) {
        executing.push(promise);
      }

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex((p) => p === promise),
          1
        );
      }
    }

    return Promise.allSettled(results);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expires) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
    };
  }

  /**
   * Clear all caches and reset state
   */
  reset() {
    this.cache.clear();
    this.rateLimiters.clear();
    this.retryAttempts.clear();
    this.requestQueue.clear();
  }
}

// Create singleton instance
const newsAPIClient = new NewsAPIClient();

export default newsAPIClient;
