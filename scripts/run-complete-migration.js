#!/usr/bin/env node

/**
 * Complete Database Migration Script
 * Executes all necessary SQL migrations for Ethiopian Maids platform
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) =>
    console.log(`\n${colors.cyan}🚀 ${msg}${colors.reset}\n${'='.repeat(60)}`),
};

// Load environment variables
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#') && key.trim()) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });

    return envVars;
  } catch (error) {
    log.error(`Failed to load .env file: ${error.message}`);
    return {};
  }
}

class DatabaseMigrator {
  constructor() {
    this.env = loadEnvFile();
    this.supabase = null;
    this.migrationResults = [];
  }

  async initialize() {
    const supabaseUrl = this.env.VITE_SUPABASE_URL;
    const supabaseKey =
      this.env.SUPABASE_SERVICE_KEY || this.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    log.success('Database connection initialized');
  }

  async executeSQL(sql, description) {
    try {
      log.info(`Executing: ${description}`);

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        if (
          statement.toLowerCase().includes('select ') &&
          statement.includes('status')
        ) {
          // Skip status messages
          continue;
        }

        try {
          const { error } = await this.supabase.rpc('exec_sql', {
            sql: statement,
          });
          if (error) {
            log.warning(`Statement warning: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          log.warning(`Statement error: ${err.message}`);
          errorCount++;
        }
      }

      this.migrationResults.push({
        description,
        success: errorCount === 0,
        successCount,
        errorCount,
      });

      if (errorCount === 0) {
        log.success(`✅ ${description} completed successfully`);
      } else {
        log.warning(`⚠️ ${description} completed with ${errorCount} warnings`);
      }

      return errorCount === 0;
    } catch (error) {
      log.error(`❌ Failed to execute ${description}: ${error.message}`);
      this.migrationResults.push({
        description,
        success: false,
        error: error.message,
      });
      return false;
    }
  }

  async createCoreSchema() {
    const coreSchemaSQL = `
      -- Enable necessary extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      
      -- Create profiles table with correct structure for existing data
      CREATE TABLE IF NOT EXISTS profiles (
          user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          role VARCHAR(20) NOT NULL CHECK (role IN ('maid', 'sponsor', 'agency', 'admin')),
          phone VARCHAR(20),
          country VARCHAR(100),
          avatar_url TEXT,
          registration_complete BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Enable RLS on profiles
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policies for profiles
      CREATE POLICY "Users can view own profile" ON profiles
          FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert own profile" ON profiles
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = user_id);
    `;

    return await this.executeSQL(coreSchemaSQL, 'Core Profiles Schema');
  }

  async createJobsSchema() {
    const jobsSQL = `
      -- Jobs table
      CREATE TABLE IF NOT EXISTS job_postings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sponsor_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          job_type VARCHAR(50) DEFAULT 'full-time',
          country VARCHAR(100) NOT NULL,
          city VARCHAR(100),
          salary_min INTEGER NOT NULL,
          salary_max INTEGER,
          currency VARCHAR(3) DEFAULT 'USD',
          required_skills TEXT[] DEFAULT '{}',
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Enable RLS
      ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
      
      -- RLS policies
      CREATE POLICY "Anyone can view active jobs" ON job_postings
          FOR SELECT USING (status = 'active');
      
      CREATE POLICY "Sponsors can manage own jobs" ON job_postings
          FOR ALL USING (auth.uid() = sponsor_id);
    `;

    return await this.executeSQL(jobsSQL, 'Job Postings Schema');
  }

  async createMessagingSchema() {
    const messagingSQL = `
      -- Conversations table
      CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          participant_1_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
          participant_2_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
          last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(participant_1_id, participant_2_id)
      );
      
      -- Messages table
      CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          message_type VARCHAR(20) DEFAULT 'text',
          is_read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Enable RLS
      ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
      
      -- RLS policies
      CREATE POLICY "Users can view own conversations" ON conversations
          FOR SELECT USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);
      
      CREATE POLICY "Users can create conversations" ON conversations
          FOR INSERT WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);
      
      CREATE POLICY "Users can view messages in own conversations" ON messages
          FOR SELECT USING (
              EXISTS (
                  SELECT 1 FROM conversations 
                  WHERE id = messages.conversation_id 
                  AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
              )
          );
      
      CREATE POLICY "Users can send messages in own conversations" ON messages
          FOR INSERT WITH CHECK (
              auth.uid() = sender_id AND
              EXISTS (
                  SELECT 1 FROM conversations 
                  WHERE id = messages.conversation_id 
                  AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
              )
          );
    `;

    return await this.executeSQL(messagingSQL, 'Messaging System Schema');
  }

  async createSubscriptionsSchema() {
    const subscriptionsSQL = `
      -- Subscription plans table
      CREATE TABLE IF NOT EXISTS subscription_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          billing_period VARCHAR(20) DEFAULT 'monthly',
          features JSONB DEFAULT '[]'::jsonb,
          limits JSONB DEFAULT '{}'::jsonb,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- User subscriptions table
      CREATE TABLE IF NOT EXISTS user_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
          plan_id UUID NOT NULL REFERENCES subscription_plans(id),
          stripe_subscription_id VARCHAR(255),
          stripe_customer_id VARCHAR(255),
          status VARCHAR(20) DEFAULT 'active',
          current_period_start TIMESTAMP WITH TIME ZONE,
          current_period_end TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Enable RLS
      ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
      
      -- RLS policies
      CREATE POLICY "Anyone can view active plans" ON subscription_plans
          FOR SELECT USING (active = true);
      
      CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
          FOR SELECT USING (auth.uid() = user_id);
    `;

    return await this.executeSQL(subscriptionsSQL, 'Subscriptions Schema');
  }

  async createSupportSchema() {
    const supportSQL = `
      -- Support tickets table
      CREATE TABLE IF NOT EXISTS support_tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
          user_name TEXT NOT NULL,
          user_email TEXT NOT NULL,
          subject TEXT,
          message TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'general',
          priority TEXT NOT NULL DEFAULT 'normal',
          status TEXT NOT NULL DEFAULT 'open',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Error logs table
      CREATE TABLE IF NOT EXISTS error_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          stack TEXT,
          context JSONB DEFAULT '{}'::jsonb,
          url TEXT,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Enable RLS
      ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
      
      -- RLS policies
      CREATE POLICY "Users can view own tickets" ON support_tickets
          FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can create own tickets" ON support_tickets
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Admins can view all error logs" ON error_logs
          FOR SELECT USING (
              EXISTS (
                  SELECT 1 FROM profiles 
                  WHERE user_id = auth.uid() AND role = 'admin'
              )
          );
    `;

    return await this.executeSQL(supportSQL, 'Support System Schema');
  }

  async createIndexes() {
    const indexesSQL = `
      -- Performance indexes
      CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
      CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
      CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);
      
      CREATE INDEX IF NOT EXISTS idx_job_postings_sponsor ON job_postings(sponsor_id);
      CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
      CREATE INDEX IF NOT EXISTS idx_job_postings_country ON job_postings(country);
      
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
      
      CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
    `;

    return await this.executeSQL(indexesSQL, 'Performance Indexes');
  }

  async runCompleteMigration() {
    log.header('ETHIOPIAN MAIDS - COMPLETE DATABASE MIGRATION');

    try {
      await this.initialize();

      // Run all migrations
      const migrations = [
        () => this.createCoreSchema(),
        () => this.createJobsSchema(),
        () => this.createMessagingSchema(),
        () => this.createSubscriptionsSchema(),
        () => this.createSupportSchema(),
        () => this.createIndexes(),
      ];

      let successCount = 0;
      let failureCount = 0;

      for (const migration of migrations) {
        const success = await migration();
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      // Generate report
      log.header('MIGRATION RESULTS');
      console.log(`📊 Summary:`);
      console.log(`   Successful migrations: ${successCount}`);
      console.log(`   Failed migrations: ${failureCount}`);
      console.log(`   Total migrations: ${migrations.length}`);

      if (failureCount === 0) {
        log.success('\n🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
        log.success('Database is now ready for production use.');
      } else {
        log.warning(`\n⚠️ ${failureCount} migrations had issues.`);
        log.info('Check the logs above for details.');
      }

      return failureCount === 0;
    } catch (error) {
      log.error(`Migration failed: ${error.message}`);
      return false;
    }
  }
}

// Run the migration
const migrator = new DatabaseMigrator();
migrator
  .runCompleteMigration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    log.error(`Migration script failed: ${error.message}`);
    process.exit(1);
  });
