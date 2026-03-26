const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function listCustomers() {
  console.log("Checking latest 10 customers...");
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, name_kana, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Database Error:", error);
  } else {
    console.log("Found customers:", data.length);
    data.forEach(c => {
      console.log(`- ${c.name} (フリガナ: ${c.name_kana || "無し"}) / ID: ${c.id} / Created: ${c.created_at}`);
    });
  }
}

listCustomers();
