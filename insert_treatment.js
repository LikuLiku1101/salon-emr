const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('Inserting test data...');
  
  // 1. Get or Create a Customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert([{ name: '脱毛 太郎', phone: '090-1234-5678' }])
    .select()
    .single();

  if (customerError) {
    if (customerError.code === '23505') {
       console.log('Customer might exist, we will fetch one.');
    } else {
       console.error('Error creating customer:', customerError);
    }
  }

  const { data: existingCustomer } = await supabase.from('customers').select('*').limit(1).single();
  
  if (!existingCustomer) {
    console.log('Failed to setup customer.');
    return;
  }

  // 2. Create a Treatment Record
  const today = new Date().toISOString().split('T')[0];
  const { data: treatment, error: treatmentError } = await supabase
    .from('treatments')
    .insert([{
      customer_id: existingCustomer.id,
      visit_date: today,
      visit_time: '14:00:00',
      visit_count: 1
    }])
    .select()
    .single();

  if (treatmentError) {
    console.error('Error creating treatment:', treatmentError);
    return;
  }

  console.log('Successfully created treatment record!');
  console.log('*** URL TO VISIT ***: http://localhost:3000/treatments/' + treatment.id);
}

createTestData();
