import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local for keys
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('contracts').select('*').eq('id', 'e41e2212-fe09-4f21-8dd4-d41f30ae865f');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Contract Data:', JSON.stringify(data, null, 2));

  const { data: customerData } = await supabase.from('customers').select('*').eq('id', 'afbcb0c4-b5e6-4fb1-9b1e-b3a9f59b5ba4');
  console.log('Customer Data:', JSON.stringify(customerData, null, 2));
}

run();
