const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('Checking columns of the "treatments" table...');
  const { data, error } = await supabase.from('treatments').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns found in a row:', Object.keys(data[0]));
  } else {
    console.log('No data found to check columns.');
    const { data: emptyData, error: emptyError } = await supabase.rpc('get_column_names', { table_name: 'treatments' });
    // If RPC doesn't exist, we can't easily check without data...
  }
}

checkColumns();
