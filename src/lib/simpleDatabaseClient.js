/**
 * Simple Local Database Client
 * Uses localStorage with JSON for immediate functionality
 * Provides Supabase-compatible API
 */

import { createLogger } from '@/utils/logger';

const log = createLogger('SimpleDatabaseClient');

class SimpleLocalDatabase {
  constructor() {
    this.storagePrefix = 'ethio-maids-';
    this.currentUser = null;
    this.initialized = false;
    this.init();
  }

  init() {
    try {
      // Initialize empty tables if they don't exist
      const tables = [
        'profiles', 'maid_profiles', 'sponsor_profiles',
        'agency_profiles', 'jobs', 'applications',
        'messages', 'reviews', 'favorites', 'countries'
      ];

      tables.forEach(table => {
        if (!localStorage.getItem(`${this.storagePrefix}${table}`)) {
          localStorage.setItem(`${this.storagePrefix}${table}`, JSON.stringify([]));
        }
      });

      // Load current user
      const savedUser = localStorage.getItem(`${this.storagePrefix}current-user`);
      this.currentUser = savedUser ? JSON.parse(savedUser) : null;

      this.initialized = true;
      log.info('Simple local database initialized');
    } catch (error) {
      log.error('Failed to initialize simple database:', error);
    }
  }

  // Realtime API stubs for compatibility
  channel() {
    const stub = {
      on: () => stub,
      subscribe: () => stub,
    };
    return stub;
  }

  removeChannel() {
    return true; // no-op in local mode
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  getTable(tableName) {
    try {
      const data = localStorage.getItem(`${this.storagePrefix}${tableName}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      log.error(`Error reading table ${tableName}:`, error);
      return [];
    }
  }

  setTable(tableName, data) {
    try {
      localStorage.setItem(`${this.storagePrefix}${tableName}`, JSON.stringify(data));
      return true;
    } catch (error) {
      log.error(`Error writing table ${tableName}:`, error);
      return false;
    }
  }

  from(tableName) {
    return new SimpleQueryBuilder(this, tableName);
  }

  // Auth simulation
  auth = {
    getUser: async () => {
      return {
        data: { user: this.currentUser },
        error: null,
      };
    },

    getSession: async () => {
      try {
        const raw = localStorage.getItem(`${this.storagePrefix}session`);
        const session = raw ? JSON.parse(raw) : null;
        return { data: { session }, error: null };
      } catch (error) {
        return { data: { session: null }, error: { message: error.message } };
      }
    },

    signUp: async ({ email, password, options = {} }) => {
      try {
        const userId = this.generateId();
        const user = {
          id: userId,
          email,
          user_metadata: options.data || {},
          created_at: new Date().toISOString()
        };

        // Add to profiles table
        const profiles = this.getTable('profiles');
        const profile = {
          id: userId,
          email,
          full_name: options.data?.full_name || '',
          user_type: options.data?.user_type || 'maid',
          phone_number: options.data?.phone_number || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        };

        profiles.push(profile);
        this.setTable('profiles', profiles);

        // Create local session
        const session = {
          access_token: `local-${userId}`,
          token_type: 'bearer',
          expires_in: 60 * 60 * 24, // 24h
          expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
          refresh_token: `local-refresh-${userId}`,
          user,
        };

        // Set current user and session
        this.currentUser = user;
        localStorage.setItem(
          `${this.storagePrefix}current-user`,
          JSON.stringify(user)
        );
        localStorage.setItem(
          `${this.storagePrefix}session`,
          JSON.stringify(session)
        );

        return { data: { user, session }, error: null };
      } catch (error) {
        return { data: null, error: { message: error.message } };
      }
    },

    // Compatibility with Supabase API: signInWithPassword
    signInWithPassword: async ({ email, password }) => {
      try {
        const profiles = this.getTable('profiles');
        const profile = profiles.find(p => p.email === email);

        if (profile) {
          const user = {
            id: profile.id,
            email: profile.email,
            user_metadata: {
              user_type: profile.user_type,
              full_name: profile.full_name
            }
          };

          // Create/refresh local session
          const session = {
            access_token: `local-${user.id}`,
            token_type: 'bearer',
            expires_in: 60 * 60 * 24,
            expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
            refresh_token: `local-refresh-${user.id}`,
            user,
          };

          this.currentUser = user;
          localStorage.setItem(
            `${this.storagePrefix}current-user`,
            JSON.stringify(user)
          );
          localStorage.setItem(
            `${this.storagePrefix}session`,
            JSON.stringify(session)
          );

          return { data: { user, session }, error: null };
        }

        return { data: null, error: { message: 'Invalid credentials' } };
      } catch (error) {
        return { data: null, error: { message: error.message } };
      }
    },

    signOut: async () => {
      this.currentUser = null;
      localStorage.removeItem(`${this.storagePrefix}current-user`);
      localStorage.removeItem(`${this.storagePrefix}session`);
      return { error: null };
    },

    onAuthStateChange: (callback) => {
      // Simple implementation - call immediately with current state
      setTimeout(() => {
        callback('SIGNED_IN', { user: this.currentUser });
      }, 0);

      // Return unsubscribe function
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  };
}

class SimpleQueryBuilder {
  constructor(database, tableName) {
    this.database = database;
    this.tableName = tableName;
    this.query = {
      action: 'select',
      filters: [],
      orderBy: null,
      limitCount: null,
      data: null,
      returning: false,
      returnColumns: '*',
      expectSingle: false,
    };
  }

  select(columns = '*') {
    // If performing a write, select() means "returning"
    if (['update', 'insert', 'delete'].includes(this.query.action)) {
      this.query.returning = true;
      this.query.returnColumns = columns;
      return this;
    }
    // Otherwise it's a normal select
    this.query.action = 'select';
    this.query.columns = columns;
    return this;
  }

  insert(data) {
    this.query.action = 'insert';
    this.query.data = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this.query.action = 'update';
    this.query.data = data;
    return this;
  }

  delete() {
    this.query.action = 'delete';
    return this;
  }

  eq(column, value) {
    this.query.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column, value) {
    this.query.filters.push({ column, operator: 'neq', value });
    return this;
  }

  like(column, value) {
    this.query.filters.push({ column, operator: 'like', value });
    return this;
  }

  in(column, values) {
    this.query.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  order(column, options = { ascending: true }) {
    this.query.orderBy = { column, ascending: options.ascending };
    return this;
  }

  limit(count) {
    this.query.limitCount = count;
    return this;
  }

  range(from, to) {
    this.query.limitCount = to - from + 1;
    this.query.offset = from;
    return this;
  }

  async single() {
    this.query.expectSingle = true;
    const result = await this.execute();
    if (!result.error) {
      const rows = Array.isArray(result.data) ? result.data : (result.data ? [result.data] : []);
      if (rows.length === 0) {
        return {
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        };
      }
      return { data: rows[0], error: null };
    }
    return result;
  }

  async execute() {
    try {
      const table = this.database.getTable(this.tableName);

      switch (this.query.action) {
        case 'select':
          return this.handleSelect(table);
        case 'insert':
          return this.handleInsert(table);
        case 'update':
          return this.handleUpdate(table);
        case 'delete':
          return this.handleDelete(table);
        default:
          throw new Error(`Unsupported action: ${this.query.action}`);
      }
    } catch (error) {
      log.error('Query execution failed:', error);
      return { data: null, error: { message: error.message } };
    }
  }

  handleSelect(table) {
    let filtered = this.applyFilters(table);

    if (this.query.orderBy) {
      filtered.sort((a, b) => {
        const aVal = a[this.query.orderBy.column];
        const bVal = b[this.query.orderBy.column];
        const compare = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.query.orderBy.ascending ? compare : -compare;
      });
    }

    if (this.query.limitCount) {
      const offset = this.query.offset || 0;
      filtered = filtered.slice(offset, offset + this.query.limitCount);
    }

    return { data: filtered, error: null };
  }

  handleInsert(table) {
    const newRecords = this.query.data.map(record => ({
      ...record,
      id: record.id || this.database.generateId(),
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || new Date().toISOString()
    }));

    const updatedTable = [...table, ...newRecords];
    this.database.setTable(this.tableName, updatedTable);
    const data = this.query.returning ? newRecords : null;
    return { data, error: null };
  }

  handleUpdate(table) {
    const filtered = this.applyFilters(table);
    const updated = [];

    const updatedTable = table.map(record => {
      if (filtered.includes(record)) {
        const updatedRecord = {
          ...record,
          ...this.query.data,
          updated_at: new Date().toISOString()
        };
        updated.push(updatedRecord);
        return updatedRecord;
      }
      return record;
    });

    this.database.setTable(this.tableName, updatedTable);
    const data = this.query.returning ? updated : null;
    return { data, error: null };
  }

  handleDelete(table) {
    const filtered = this.applyFilters(table);
    const remaining = table.filter(record => !filtered.includes(record));

    this.database.setTable(this.tableName, remaining);
    const data = this.query.returning ? filtered : null;
    return { data, error: null };
  }

  applyFilters(table) {
    return table.filter(record => {
      return this.query.filters.every(filter => {
        const recordValue = record[filter.column];

        switch (filter.operator) {
          case 'eq':
            return recordValue === filter.value;
          case 'neq':
            return recordValue !== filter.value;
          case 'like':
            return String(recordValue).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'in':
            return filter.value.includes(recordValue);
          default:
            return true;
        }
      });
    });
  }

  // Make it thenable for await support
  then(onResolve, onReject) {
    return this.execute().then(onResolve, onReject);
  }
}

// Create and export singleton instance
export const simpleDatabase = new SimpleLocalDatabase();
export { simpleDatabase as supabase };
export default simpleDatabase;
