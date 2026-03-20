const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function cleanup() {
  console.log('Cleaning up test records...');

  // 1. Delete treatments created today for test customers
  // We'll target "上原大作" and "酒井勇之助" or just all treatments for today if we're sure
  const today = new Date().toISOString().split('T')[0];

  const { data: testTreatments, error: fetchError } = await supabase
    .from('treatments')
    .select('id')
    .eq('visit_date', today);

  if (fetchError) {
    console.error('Error fetching treatments:', fetchError);
    return;
  }

  if (testTreatments && testTreatments.length > 0) {
    const ids = testTreatments.map(t => t.id);
    const { error: deleteError } = await supabase
      .from('treatments')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('Error deleting treatments:', deleteError);
    } else {
      console.log(`Successfully deleted ${ids.length} test treatments.`);
    }
  } else {
    console.log('No treatments found for today.');
  }
}

cleanup();
