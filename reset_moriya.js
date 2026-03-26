const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetMoriya() {
  const customerId = "208911d0-1016-4fe8-8a7f-e82be7db63a6";
  console.log(`Resetting LINE ID for customer ID: ${customerId}...`);

  const { data, error } = await supabase
    .from('customers')
    .update({ 
      line_user_id: null, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', customerId)
    .select();

  if (error) {
    console.error("Reset FAILED with error:", error);
  } else {
    console.log("Reset SUCCESSFUL! line_user_id is now NULL.");
    console.log("Result:", JSON.stringify(data, null, 2));
  }
}

resetMoriya();
