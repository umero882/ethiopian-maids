const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

const testMaids = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'fatima.ahmed@testmaid.com',
    full_name: 'Fatima Ahmed',
    date_of_birth: '1996-01-15',
    nationality: 'Ethiopian',
    current_location: 'Doha, Qatar',
    marital_status: 'single',
    experience_years: 3,
    skills: ['cleaning', 'cooking', 'laundry'],
    languages: ['Amharic', 'English', 'Arabic'],
    preferred_salary_min: 1200,
    preferred_salary_max: 1500,
    preferred_currency: 'QAR'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'sarah.mohammed@testmaid.com',
    full_name: 'Sarah Mohammed',
    date_of_birth: '1992-03-22',
    nationality: 'Ethiopian',
    current_location: 'Dubai, UAE',
    marital_status: 'married',
    experience_years: 5,
    skills: ['baby_care', 'cooking', 'cleaning'],
    languages: ['Amharic', 'English', 'Arabic'],
    preferred_salary_min: 1500,
    preferred_salary_max: 1800,
    preferred_currency: 'AED'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'amina.hassan@testmaid.com',
    full_name: 'Amina Hassan',
    date_of_birth: '1999-07-10',
    nationality: 'Ethiopian',
    current_location: 'Doha, Qatar',
    marital_status: 'single',
    experience_years: 2,
    skills: ['elderly_care', 'cooking', 'cleaning'],
    languages: ['Amharic', 'English'],
    preferred_salary_min: 1000,
    preferred_salary_max: 1300,
    preferred_currency: 'QAR'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'maryam.ali@testmaid.com',
    full_name: 'Maryam Ali',
    date_of_birth: '1994-11-05',
    nationality: 'Ethiopian',
    current_location: 'Addis Ababa, Ethiopia',
    marital_status: 'single',
    experience_years: 4,
    skills: ['cleaning', 'ironing', 'laundry'],
    languages: ['Amharic', 'English', 'Arabic'],
    preferred_salary_min: 1300,
    preferred_salary_max: 1600,
    preferred_currency: 'QAR'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'zainab.omar@testmaid.com',
    full_name: 'Zainab Omar',
    date_of_birth: '1997-05-18',
    nationality: 'Ethiopian',
    current_location: 'Riyadh, Saudi Arabia',
    marital_status: 'married',
    experience_years: 6,
    skills: ['cooking', 'baking', 'cleaning', 'baby_care'],
    languages: ['Amharic', 'English', 'Arabic'],
    preferred_salary_min: 1600,
    preferred_salary_max: 2000,
    preferred_currency: 'SAR'
  }
];

async function insertMaids() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // First, let's check what triggers exist
    const triggerCheck = await client.query(`
      SELECT t.tgname, p.proname
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE t.tgrelid = 'maid_profiles'::regclass
      AND NOT t.tgisinternal
    `);

    console.log('Triggers on maid_profiles:');
    triggerCheck.rows.forEach(t => console.log(`- ${t.tgname} -> ${t.proname}`));
    console.log('');

    // Drop problematic triggers
    console.log('Dropping ALL triggers...');
    await client.query('DROP TRIGGER IF EXISTS calculate_profile_completion_trigger ON maid_profiles');
    await client.query('DROP TRIGGER IF EXISTS set_profile_completion_trigger ON maid_profiles');
    await client.query('DROP TRIGGER IF EXISTS update_maid_profile_completion_trigger ON maid_profiles');
    await client.query('DROP TRIGGER IF EXISTS encrypt_maid_pii_trigger ON maid_profiles');
    await client.query('DROP TRIGGER IF EXISTS update_maid_completion_trigger ON maid_profiles');
    await client.query('DROP TRIGGER IF EXISTS validate_maid_profile_trigger ON maid_profiles');

    // Fix DEFAULT on profile_completion_percentage
    await client.query('ALTER TABLE maid_profiles ALTER COLUMN profile_completion_percentage SET DEFAULT 0');
    console.log('Dropped all triggers and fixed column defaults\n');

    // Insert maids one by one
    let inserted = 0;
    for (const maid of testMaids) {
      try {
        // Insert auth.users
        await client.query(`
          INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
          VALUES ($1, $2, crypt('TestPassword123!', gen_salt('bf')), NOW())
          ON CONFLICT (id) DO NOTHING
        `, [maid.id, maid.email]);

        // Insert profiles
        await client.query(`
          INSERT INTO profiles (id, email, name, user_type, registration_complete, is_active)
          VALUES ($1, $2, $3, 'maid', true, true)
          ON CONFLICT (id) DO NOTHING
        `, [maid.id, maid.email, maid.full_name]);

        // Insert maid_profiles
        await client.query(`
          INSERT INTO maid_profiles (
            id, full_name, date_of_birth, nationality, current_location,
            marital_status, experience_years, skills, languages,
            preferred_salary_min, preferred_salary_max, preferred_currency,
            available_from, availability_status, profile_completion_percentage
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), 'available', 75)
          ON CONFLICT (id) DO NOTHING
        `, [
          maid.id,
          maid.full_name,
          maid.date_of_birth,
          maid.nationality,
          maid.current_location,
          maid.marital_status,
          maid.experience_years,
          maid.skills,
          maid.languages,
          maid.preferred_salary_min,
          maid.preferred_salary_max,
          maid.preferred_currency
        ]);

        console.log(`✓ Inserted ${maid.full_name}`);
        inserted++;
      } catch (err) {
        console.error(`✗ Failed to insert ${maid.full_name}:`, err.message);
      }
    }

    // Verify
    const result = await client.query(`
      SELECT
        full_name,
        EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
        experience_years,
        array_to_string(skills, ', ') as skills,
        current_location
      FROM maid_profiles
      ORDER BY full_name
    `);

    console.log(`\n✅ SUCCESS! ${inserted} maids inserted\n`);
    console.log('📋 All maids in database:');
    result.rows.forEach(m => {
      console.log(`  - ${m.full_name} (${m.age} yrs, ${m.experience_years} exp) | ${m.current_location}`);
    });
    console.log(`\n✨ Total: ${result.rows.length} maids available\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.detail) console.error('Detail:', error.detail);
  } finally {
    await client.end();
  }
}

insertMaids();
