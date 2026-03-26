const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkColumns() {
  console.log("Checking columns of the 'customers' table...");
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Database Error:", error);
  } else if (data.length > 0) {
    console.log("Columns found in a row:", Object.keys(data[0]));
  } else {
    console.log("No data found to check columns.");
  }
}

checkColumns();
