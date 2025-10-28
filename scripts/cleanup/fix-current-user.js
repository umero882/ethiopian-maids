import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCurrentUser() {
  console.log('🔍 FINDING AND FIXING CURRENT USER');
  console.log('==================================');

  try {
    // Get all users to find the one that's being detected as sponsor
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (fetchError) {
      console.log('❌ Error fetching profiles:', fetchError.message);
      return;
    }

    console.log(`✅ Found ${allProfiles.length} profiles`);

    // Look for profiles that would be detected as 'sponsor' by AuthContext
    const problematicProfiles = allProfiles.filter((profile) => {
      const detectedUserType = profile.user_type || profile.role || 'sponsor';
      return detectedUserType === 'sponsor' && profile.email;
    });

    console.log('\n🔍 PROFILES DETECTED AS SPONSOR:');
    console.log('===============================');

    problematicProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.email}`);
      console.log(`   user_type: ${profile.user_type}`);
      console.log(`   role: ${profile.role}`);
      console.log(`   name: ${profile.name}`);
      console.log(`   updated_at: ${profile.updated_at}`);
      console.log('');
    });

    // Find the most recently updated profile (likely the current user)
    const currentUser = problematicProfiles[0];

    if (!currentUser) {
      console.log('❌ No problematic profiles found');
      return;
    }

    console.log('🎯 MOST LIKELY CURRENT USER:', currentUser.email);

    // Check if this user should be a maid based on their name or other indicators
    const shouldBeMaid =
      currentUser.name?.toLowerCase().includes('maid') ||
      currentUser.email?.toLowerCase().includes('maid') ||
      currentUser.name?.toLowerCase().includes('test');

    if (shouldBeMaid) {
      console.log('✅ This user should be a MAID - fixing now...');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_type: 'maid',
          role: 'maid',
        })
        .eq('id', currentUser.id);

      if (updateError) {
        console.log('❌ Error updating user:', updateError.message);
      } else {
        console.log('✅ Successfully updated user to MAID');
        console.log('🔄 Please refresh your browser to see the changes');
      }
    } else {
      console.log(
        "⚠️  This user doesn't seem to be a maid based on name/email"
      );
      console.log('   If this is wrong, manually update the user:');
      console.log(
        `   UPDATE profiles SET user_type = 'maid', role = 'maid' WHERE id = '${currentUser.id}';`
      );
    }

    // Also check if there are any actual maid users
    const maidUsers = allProfiles.filter((p) => p.user_type === 'maid');
    console.log(`\n📊 SUMMARY: Found ${maidUsers.length} actual maid users`);

    if (maidUsers.length > 0) {
      console.log('✅ Existing maid users:');
      maidUsers.forEach((maid) => {
        console.log(`   - ${maid.email} (${maid.name})`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixCurrentUser().catch(console.error);
