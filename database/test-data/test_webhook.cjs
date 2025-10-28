const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function testWebhookQuery() {
  try {
    await client.connect();
    console.log('Testing webhook-style query...\n');

    // Test the exact query the webhook will run
    console.log('🔍 Test: Search for maids with cleaning skills in Qatar');
    const result = await client.query(`
      SELECT
        id,
        full_name,
        date_of_birth,
        experience_years,
        skills,
        availability_status,
        current_location,
        nationality,
        languages
      FROM maid_profiles
      WHERE availability_status = 'available'
        AND skills && $1
        AND current_location ILIKE $2
      LIMIT 10
    `, [['cleaning'], '%Qatar%']);

    console.log(`Found ${result.rows.length} maids:\n`);

    result.rows.forEach(m => {
      // Calculate age
      const birthDate = new Date(m.date_of_birth);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      console.log(`- ${m.full_name}`);
      console.log(`  Age: ${age} years`);
      console.log(`  Experience: ${m.experience_years} years`);
      console.log(`  Skills: ${m.skills.join(', ')}`);
      console.log(`  Location: ${m.current_location}`);
      console.log(`  Languages: ${m.languages.join(', ')}`);
      console.log('');
    });

    // Test without filters (should return all available maids)
    console.log('🔍 Test: Get all available maids (no filters)');
    const allMaids = await client.query(`
      SELECT
        id,
        full_name,
        date_of_birth,
        experience_years,
        skills,
        availability_status,
        current_location,
        nationality,
        languages
      FROM maid_profiles
      WHERE availability_status = 'available'
      LIMIT 10
    `);

    console.log(`Found ${allMaids.rows.length} available maids total\n`);

    console.log('✅ Webhook queries working correctly!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testWebhookQuery();
