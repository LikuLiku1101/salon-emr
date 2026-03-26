const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // SERVICE ROLE KEYを使用

if (!supabaseKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is missing from .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMoriya() {
  const customerId = "208911d0-1016-4fe8-8a7f-e82be7db63a6";
  const testLineId = "U7c72f1234567890abcdef1234567890"; // テスト用のダミーID

  console.log(`Starting debug update for customer ID: ${customerId}...`);
  console.log(`Using Service Role Key: ${supabaseKey.substring(0, 10)}...`);

  const { data, error } = await supabase
    .from('customers')
    .update({ 
      line_user_id: testLineId, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', customerId)
    .select();

  if (error) {
    console.error("Update FAILED with error:", error);
    if (error.code === '42501') {
      console.log("--> This is a Permission Error (Insufficient Privileges). The key is likely invalid or not the Service Role key.");
    }
  } else {
    console.log("Update SUCCESSFUL!");
    console.log("Resulting data:", JSON.stringify(data, null, 2));
  }
}

updateMoriya();
