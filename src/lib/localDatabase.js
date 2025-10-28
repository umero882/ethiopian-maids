/**
 * Local SQLite Database Client
 * Replaces Supabase with local SQLite database for development
 */

import initSqlJs from 'sql.js';
import { createLogger } from '@/utils/logger';

const log = createLogger('LocalDatabase');

class LocalDatabase {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.sqlJs = null;
  }

  async init() {
    if (this.initialized) return this.db;

    try {
      // Initialize SQL.js
      this.sqlJs = await initSqlJs({
        // You can specify the path to sql-wasm.wasm if needed
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // Create or load database
      const existingDb = this.loadFromStorage();
      if (existingDb) {
        this.db = new this.sqlJs.Database(existingDb);
        log.info('Loaded existing database from localStorage');
      } else {
        this.db = new this.sqlJs.Database();
        log.info('Created new SQLite database');
        await this.initializeSchema();
      }

      this.initialized = true;
      return this.db;
    } catch (error) {
      log.error('Failed to initialize database:', error);
      throw error;
    }
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem('ethio-maids-db');
      return data ? new Uint8Array(JSON.parse(data)) : null;
    } catch (error) {
      log.warn('Could not load database from localStorage:', error);
      return null;
    }
  }

  saveToStorage() {
    if (!this.db) return;

    try {
      const data = this.db.export();
      localStorage.setItem('ethio-maids-db', JSON.stringify(Array.from(data)));
      log.debug('Database saved to localStorage');
    } catch (error) {
      log.error('Failed to save database to localStorage:', error);
    }
  }

  async initializeSchema() {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Core tables
      await this.exec(`
        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          phone_number TEXT,
          user_type TEXT CHECK(user_type IN ('maid', 'sponsor', 'agency')) NOT NULL,
          avatar_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1
        );
      `);

      // Maid profiles
      await this.exec(`
        CREATE TABLE IF NOT EXISTS maid_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          nationality TEXT,
          date_of_birth DATE,
          experience_years INTEGER DEFAULT 0,
          languages TEXT, -- JSON array
          skills TEXT, -- JSON array
          expected_salary INTEGER,
          availability_status TEXT DEFAULT 'available',
          profile_picture_url TEXT,
          documents_url TEXT, -- JSON array
          bio TEXT,
          work_history TEXT, -- JSON array
          certifications TEXT, -- JSON array
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      // Sponsor profiles
      await this.exec(`
        CREATE TABLE IF NOT EXISTS sponsor_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          company_name TEXT,
          location TEXT,
          country TEXT,
          contact_person TEXT,
          business_type TEXT,
          verification_status TEXT DEFAULT 'pending',
          documents_url TEXT, -- JSON array
          preferences TEXT, -- JSON object
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      // Agency profiles
      await this.exec(`
        CREATE TABLE IF NOT EXISTS agency_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          agency_name TEXT NOT NULL,
          license_number TEXT,
          established_year INTEGER,
          location TEXT,
          services TEXT, -- JSON array
          verification_status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      // Jobs table
      await this.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          sponsor_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          location TEXT,
          salary_min INTEGER,
          salary_max INTEGER,
          requirements TEXT, -- JSON array
          benefits TEXT, -- JSON array
          job_type TEXT DEFAULT 'full-time',
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME,
          FOREIGN KEY (sponsor_id) REFERENCES sponsor_profiles(id) ON DELETE CASCADE
        );
      `);

      // Applications table
      await this.exec(`
        CREATE TABLE IF NOT EXISTS applications (
          id TEXT PRIMARY KEY,
          job_id TEXT NOT NULL,
          maid_id TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          cover_letter TEXT,
          proposed_salary INTEGER,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          reviewed_at DATETIME,
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
          FOREIGN KEY (maid_id) REFERENCES maid_profiles(id) ON DELETE CASCADE,
          UNIQUE(job_id, maid_id)
        );
      `);

      // Messages table
      await this.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          sender_id TEXT NOT NULL,
          recipient_id TEXT NOT NULL,
          content TEXT NOT NULL,
          message_type TEXT DEFAULT 'text',
          read_status BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE,
          FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      // Reviews table
      await this.exec(`
        CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          reviewer_id TEXT NOT NULL,
          reviewed_id TEXT NOT NULL,
          rating INTEGER CHECK(rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewed_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
      `);

      // Create indexes for better performance
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_maid_profiles_user_id ON maid_profiles(user_id);`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_user_id ON sponsor_profiles(user_id);`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_sponsor_id ON jobs(sponsor_id);`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_applications_maid_id ON applications(maid_id);`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);`);
      await this.exec(`CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);`);

      this.saveToStorage();
      log.info('Database schema initialized successfully');
    } catch (error) {
      log.error('Failed to initialize schema:', error);
      throw error;
    }
  }

  async exec(query, params = []) {
    await this.init();
    try {
      const result = this.db.exec(query, params);
      this.saveToStorage();
      return result;
    } catch (error) {
      log.error('Query execution failed:', error, { query, params });
      throw error;
    }
  }

  async prepare(query) {
    await this.init();
    return this.db.prepare(query);
  }

  // Utility methods similar to Supabase API
  from(table) {
    return new QueryBuilder(this, table);
  }

  // Auth simulation
  auth = {
    getUser: async () => {
      // For development, return a mock user or get from localStorage
      const user = localStorage.getItem('ethio-maids-current-user');
      return { data: user ? JSON.parse(user) : null, error: null };
    },

    signUp: async ({ email, password, options = {} }) => {
      const userId = this.generateId();
      const user = {
        id: userId,
        email,
        user_metadata: options.data || {},
        created_at: new Date().toISOString()
      };

      // Store user in profiles table
      await this.from('profiles').insert({
        id: userId,
        email,
        full_name: options.data?.full_name || '',
        user_type: options.data?.user_type || 'maid'
      });

      localStorage.setItem('ethio-maids-current-user', JSON.stringify(user));
      return { data: { user }, error: null };
    },

    signIn: async ({ email, password }) => {
      // Simple auth simulation
      const result = await this.from('profiles').select('*').eq('email', email).single();
      if (result.data) {
        const user = {
          id: result.data.id,
          email: result.data.email,
          user_metadata: {
            user_type: result.data.user_type,
            full_name: result.data.full_name
          }
        };
        localStorage.setItem('ethio-maids-current-user', JSON.stringify(user));
        return { data: { user }, error: null };
      }
      return { data: null, error: { message: 'Invalid credentials' } };
    },

    signOut: async () => {
      localStorage.removeItem('ethio-maids-current-user');
      return { error: null };
    }
  };

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Clean shutdown
  close() {
    if (this.db) {
      this.saveToStorage();
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Query Builder to mimic Supabase API
class QueryBuilder {
  constructor(database, table) {
    this.database = database;
    this.table = table;
    this.query = {
      action: null,
      columns: '*',
      conditions: [],
      data: null,
      orderBy: null,
      limit: null,
      offset: null
    };
  }

  select(columns = '*') {
    this.query.action = 'SELECT';
    this.query.columns = columns;
    return this;
  }

  insert(data) {
    this.query.action = 'INSERT';
    this.query.data = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this.query.action = 'UPDATE';
    this.query.data = data;
    return this;
  }

  delete() {
    this.query.action = 'DELETE';
    return this;
  }

  eq(column, value) {
    this.query.conditions.push(`${column} = ?`);
    this.query.params = this.query.params || [];
    this.query.params.push(value);
    return this;
  }

  neq(column, value) {
    this.query.conditions.push(`${column} != ?`);
    this.query.params = this.query.params || [];
    this.query.params.push(value);
    return this;
  }

  like(column, value) {
    this.query.conditions.push(`${column} LIKE ?`);
    this.query.params = this.query.params || [];
    this.query.params.push(value);
    return this;
  }

  in(column, values) {
    const placeholders = values.map(() => '?').join(',');
    this.query.conditions.push(`${column} IN (${placeholders})`);
    this.query.params = this.query.params || [];
    this.query.params.push(...values);
    return this;
  }

  order(column, options = { ascending: true }) {
    this.query.orderBy = `${column} ${options.ascending ? 'ASC' : 'DESC'}`;
    return this;
  }

  limit(count) {
    this.query.limit = count;
    return this;
  }

  range(from, to) {
    this.query.limit = to - from + 1;
    this.query.offset = from;
    return this;
  }

  async single() {
    const result = await this.execute();
    return {
      data: result.data && result.data.length > 0 ? result.data[0] : null,
      error: result.error
    };
  }

  async execute() {
    try {
      const sql = this.buildSQL();
      const params = this.query.params || [];

      const results = await this.database.exec(sql, params);

      if (this.query.action === 'SELECT') {
        const data = results.length > 0 ? results[0].values.map(row => {
          const obj = {};
          results[0].columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        }) : [];

        return { data, error: null };
      } else {
        return { data: results, error: null };
      }
    } catch (error) {
      return { data: null, error };
    }
  }

  buildSQL() {
    let sql = '';
    const params = this.query.params || [];

    switch (this.query.action) {
      case 'SELECT':
        sql = `SELECT ${this.query.columns} FROM ${this.table}`;
        if (this.query.conditions.length > 0) {
          sql += ` WHERE ${this.query.conditions.join(' AND ')}`;
        }
        if (this.query.orderBy) {
          sql += ` ORDER BY ${this.query.orderBy}`;
        }
        if (this.query.limit) {
          sql += ` LIMIT ${this.query.limit}`;
        }
        if (this.query.offset) {
          sql += ` OFFSET ${this.query.offset}`;
        }
        break;

      case 'INSERT': {
        const columns = Object.keys(this.query.data[0]);
        const values = columns.map(() => '?').join(',');
        sql = `INSERT INTO ${this.table} (${columns.join(',')}) VALUES (${values})`;
        // Reset params for insert data
        this.query.params = [];
        this.query.data.forEach(row => {
          columns.forEach(col => {
            this.query.params.push(row[col]);
          });
        });
        break;
      }

      case 'UPDATE': {
        const setClauses = Object.keys(this.query.data).map(key => `${key} = ?`);
        sql = `UPDATE ${this.table} SET ${setClauses.join(', ')}`;
        // Add update values to beginning of params
        const updateParams = Object.values(this.query.data);
        this.query.params = [...updateParams, ...params];
        if (this.query.conditions.length > 0) {
          sql += ` WHERE ${this.query.conditions.join(' AND ')}`;
        }
        break;
      }

      case 'DELETE':
        sql = `DELETE FROM ${this.table}`;
        if (this.query.conditions.length > 0) {
          sql += ` WHERE ${this.query.conditions.join(' AND ')}`;
        }
        break;
    }

    return sql;
  }

  // Make it thenable for await support
  then(onResolve, onReject) {
    return this.execute().then(onResolve, onReject);
  }
}

// Create and export singleton instance
export const localDatabase = new LocalDatabase();
export default localDatabase;
