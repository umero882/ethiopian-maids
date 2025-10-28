/**
 * 🗄️ Unified Data Service
 * Standardized data operations with caching, pagination, and error handling
 */

import { supabase } from '@/lib/databaseClient';
import { handleDatabaseError } from '@/services/centralizedErrorHandler';

class DataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generic query builder with standardized options
   */
  async query(table, options = {}) {
    const {
      select = '*',
      filters = {},
      orderBy = null,
      limit = null,
      offset = 0,
      useCache = false,
      cacheKey = null,
    } = options;

    // Check cache first
    if (useCache) {
      const cached = this.getFromCache(
        cacheKey || `${table}_${JSON.stringify(options)}`
      );
      if (cached) return cached;
    }

    try {
      let query = supabase.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value.operator) {
            // Advanced filtering: { operator: 'gte', value: 18 }
            query = query[value.operator](key, value.value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply ordering
      if (orderBy) {
        const { column, ascending = true } = orderBy;
        query = query.order(column, { ascending });
      }

      // Apply pagination
      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const result = {
        data,
        count,
        hasMore: limit ? data.length === limit : false,
        offset,
        limit,
      };

      // Cache result if requested
      if (useCache) {
        this.setCache(
          cacheKey || `${table}_${JSON.stringify(options)}`,
          result
        );
      }

      return result;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Get single record by ID
   */
  async getById(table, id, options = {}) {
    const { select = '*', useCache = true } = options;

    try {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (useCache) {
        this.setCache(`${table}_${id}`, data);
      }

      return data;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Create new record
   */
  async create(table, data, options = {}) {
    const { select = '*', clearCache = true } = options;

    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select(select)
        .single();

      if (error) throw error;

      if (clearCache) {
        this.clearCacheByPattern(table);
      }

      return result;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Update record
   */
  async update(table, id, data, options = {}) {
    const { select = '*', clearCache = true } = options;

    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select(select)
        .single();

      if (error) throw error;

      if (clearCache) {
        this.clearCacheByPattern(table);
        this.clearCache(`${table}_${id}`);
      }

      return result;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Delete record
   */
  async delete(table, id, options = {}) {
    const { clearCache = true } = options;

    try {
      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) throw error;

      if (clearCache) {
        this.clearCacheByPattern(table);
        this.clearCache(`${table}_${id}`);
      }

      return true;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Paginated query with standardized response
   */
  async getPaginated(table, page = 1, pageSize = 20, options = {}) {
    const offset = (page - 1) * pageSize;

    const result = await this.query(table, {
      ...options,
      limit: pageSize,
      offset,
    });

    return {
      data: result.data,
      pagination: {
        page,
        pageSize,
        total: result.count,
        totalPages: Math.ceil(result.count / pageSize),
        hasNext: result.hasMore,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Search with full-text search
   */
  async search(table, searchTerm, searchColumns = [], options = {}) {
    try {
      let query = supabase.from(table);

      if (searchColumns.length > 0) {
        // Use textSearch for specific columns
        const searchQuery = searchColumns
          .map((col) => `${col}.fts.${searchTerm}`)
          .join(',');
        query = query.or(searchQuery);
      } else {
        // Use ilike for general search
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query.select(options.select || '*');

      if (error) throw error;

      return data;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Batch operations
   */
  async batchCreate(table, records, options = {}) {
    const { batchSize = 100, clearCache = true } = options;
    const results = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      try {
        const { data, error } = await supabase
          .from(table)
          .insert(batch)
          .select();

        if (error) throw error;
        results.push(...data);
      } catch (error) {
        await handleDatabaseError(error);
        throw error;
      }
    }

    if (clearCache) {
      this.clearCacheByPattern(table);
    }

    return results;
  }

  /**
   * Cache management
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache(key) {
    this.cache.delete(key);
  }

  clearCacheByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Real-time subscriptions
   */
  subscribe(table, callback, filters = {}) {
    let subscription = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter:
            Object.keys(filters).length > 0
              ? Object.entries(filters)
                  .map(([key, value]) => `${key}=eq.${value}`)
                  .join(',')
              : undefined,
        },
        callback
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      return { healthy: !error, error: error?.message };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

// Export singleton instance
export const dataService = new DataService();

// Convenience functions for common operations
export const getMaidProfiles = (filters = {}, options = {}) =>
  dataService.query('maid_profiles', { filters, ...options });

export const getSponsorProfiles = (filters = {}, options = {}) =>
  dataService.query('sponsor_profiles', { filters, ...options });

export const getJobPostings = (filters = {}, options = {}) =>
  dataService.query('jobs', { filters, ...options });

export const searchMaids = (searchTerm, options = {}) =>
  dataService.search(
    'maid_profiles',
    searchTerm,
    ['full_name', 'skills'],
    options
  );

export const searchJobs = (searchTerm, options = {}) =>
  dataService.search('jobs', searchTerm, ['title', 'description'], options);
