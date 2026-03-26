const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchCustomer() {
  const name = process.argv[2] || '守屋';
  console.log(`Searching for customer: ${name}`);
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', `%${name}%`);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Results:', JSON.stringify(data, null, 2));
}

searchCustomer();
