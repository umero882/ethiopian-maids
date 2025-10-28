#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const log = (...args) => console.log('[staging-validate]', ...args);
const error = (...args) => console.error('[staging-validate]', ...args);

function getEnv(name, required = false) {
  const v = process.env[name];
  if (required && !v) {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

async function run() {
  const url = getEnv('SUPABASE_URL', true) || getEnv('VITE_SUPABASE_URL', true);
  const anon = getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');
  const service = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const testEmail = getEnv('STAGING_TEST_EMAIL');
  const testPassword = getEnv('STAGING_TEST_PASSWORD');

  if (!anon && !service)
    throw new Error('Provide SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');

  const admin = service
    ? createClient(url, service, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;
  const pub = anon ? createClient(url, anon) : null;

  log('Starting staging validation...');

  // Admin checks
  if (admin) {
    log('Admin: checking table access');
    for (const table of [
      'profiles',
      'sponsor_profiles',
      'sponsor_document_verification',
      'agency_profiles',
    ]) {
      try {
        const { data, error: e } = await admin
          .from(table)
          .select('count')
          .limit(1);
        if (e) throw e;
        log(`Admin: table '${table}' OK`);
      } catch (e) {
        error(`Admin: table '${table}' check failed:`, e.message);
      }
    }
  }

  // User tests (RLS)
  if (pub && testEmail && testPassword) {
    log('User: signing in test account...');
    const { data: signInData, error: signInErr } =
      await pub.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
    if (signInErr) throw new Error(`User sign-in failed: ${signInErr.message}`);
    const user = signInData.user;
    log('User: signed in as', user.id);

    // Profiles update (own row)
    {
      const { data, error: e } = await pub
        .from('profiles')
        .update({
          name: 'Staging Test User',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();
      if (e) throw new Error(`RLS update profiles failed: ${e.message}`);
      log('User: profiles update OK');
    }

    // Sponsor profile upsert
    {
      const payload = {
        id: user.id,
        full_name: 'Staging Test User',
        country: 'UAE',
        family_size: 1,
      };
      // Try update first
      let { error: e } = await pub
        .from('sponsor_profiles')
        .update(payload)
        .eq('id', user.id);
      if (
        e &&
        (e.code === 'PGRST116' || (e.message || '').includes('No rows'))
      ) {
        const ins = await pub.from('sponsor_profiles').insert(payload);
        e = ins.error;
      }
      if (e)
        throw new Error(`RLS upsert sponsor_profiles failed: ${e.message}`);
      log('User: sponsor_profiles upsert OK');
    }

    // Sponsor document verification upsert (minimal required fields)
    {
      const payload = {
        sponsor_id: user.id,
        id_type: 'Passport',
        id_number: 'STAGING-TEST',
        residence_country: 'UAE',
        contact_phone: '+9710000000',
        employment_proof_type: 'employment-contract',
        employment_proof_url: 'staging://placeholder.pdf',
      };
      let { error: e } = await pub
        .from('sponsor_document_verification')
        .update({ ...payload, last_submission_at: new Date().toISOString() })
        .eq('sponsor_id', user.id);
      if (
        e &&
        (e.code === 'PGRST116' || (e.message || '').includes('No rows'))
      ) {
        const ins = await pub
          .from('sponsor_document_verification')
          .insert(payload);
        e = ins.error;
      }
      if (e)
        throw new Error(
          `RLS upsert sponsor_document_verification failed: ${e.message}`
        );
      log('User: sponsor_document_verification upsert OK');
    }
  } else {
    log(
      'User tests skipped (set STAGING_TEST_EMAIL and STAGING_TEST_PASSWORD to enable).'
    );
  }

  log('Staging validation complete.');
}

run().catch((e) => {
  error('Validation failed:', e.message);
  process.exit(1);
});
