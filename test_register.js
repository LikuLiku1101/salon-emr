const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testRegister() {
  const name = "テスト 太郎";
  const name_kana = "テスト タロウ";
  const gender = "男性";
  const phone = "090-0000-0000";
  const email = "test@example.com";

  console.log("Registering test customer...");
  const { data, error } = await supabase
    .from("customers")
    .insert([{ name, name_kana, gender, phone, email }])
    .select();

  if (error) {
    console.error("Registration Error:", error);
  } else {
    console.log("Registration Success:", data);
  }
}

testRegister();
