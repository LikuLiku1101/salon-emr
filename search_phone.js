const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchByPhone() {
  const phone = process.argv[2] || '08059220505';
  console.log(`Searching for phone: ${phone}`);
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Results:', JSON.stringify(data, null, 2));
}

searchByPhone();
