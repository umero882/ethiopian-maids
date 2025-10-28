const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function testSearch() {
  try {
    await client.connect();
    console.log('Testing maid search functionality...\n');

    // Test 1: Search for cleaners in Qatar
    console.log('🔍 Test 1: Search for cleaners in Qatar');
    const cleanersInQatar = await client.query(`
      SELECT full_name, array_to_string(skills, ', ') as skills, current_location
      FROM maid_profiles
      WHERE availability_status = 'available'
        AND skills @> ARRAY['cleaning']
        AND current_location LIKE '%Qatar%'
    `);
    console.log(`Found ${cleanersInQatar.rows.length} maids:`);
    cleanersInQatar.rows.forEach(m => console.log(`  - ${m.full_name} (${m.current_location})`));
    console.log('');

    // Test 2: Search for baby care specialists
    console.log('🔍 Test 2: Search for baby care specialists');
    const babyCareSpecialists = await client.query(`
      SELECT full_name, array_to_string(skills, ', ') as skills, experience_years
      FROM maid_profiles
      WHERE availability_status = 'available'
        AND skills && ARRAY['baby_care']
    `);
    console.log(`Found ${babyCareSpecialists.rows.length} maids:`);
    babyCareSpecialists.rows.forEach(m => console.log(`  - ${m.full_name} (${m.experience_years} years experience)`));
    console.log('');

    // Test 3: Search using overlaps operator (simulating webhook)
    console.log('🔍 Test 3: Search using overlaps operator (webhook style)');
    const result = await client.query(`
      SELECT
        id, full_name, date_of_birth, experience_years, skills,
        availability_status, current_location, nationality, languages
      FROM maid_profiles
      WHERE availability_status = 'available'
        AND skills && $1
      LIMIT 10
    `, [['cleaning', 'cooking']]);

    console.log(`Found ${result.rows.length} maids with cleaning OR cooking skills:`);
    result.rows.forEach(m => {
      const age = new Date().getFullYear() - new Date(m.date_of_birth).getFullYear();
      console.log(`  - ${m.full_name} (${age} yrs, ${m.experience_years} exp) - Skills: ${m.skills.join(', ')}`);
    });
    console.log('');

    console.log('✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testSearch();
